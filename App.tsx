
import React, { Component, useState, useEffect, Suspense, lazy, ReactNode } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole } from './types';
import { authService } from './services/authService';
import { orgService } from './services/orgService'; 
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { ThemeProvider } from './components/ThemeContext';
import { ToastProvider } from './components/Shared/ToastContext';
import { ConfirmationProvider } from './components/Shared/ConfirmationContext';
import { logger } from './utils/logger';

logger.log('[App] Module loaded');

// --- ERROR BOUNDARY FOR LAZY LOADING ---
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    logger.error("Application Error (ErrorBoundary caught):", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 text-center">
          <div className="max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-mono uppercase">Erro de Carregamento</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Houve uma falha crítica na aplicação.</p>
            <div className="text-xs text-red-500 mb-4 font-mono bg-red-50 dark:bg-red-900/10 p-2 rounded break-all text-left overflow-auto max-h-32">
                {this.state.error?.message || 'Erro desconhecido'}
                <br/>
                Check console for details.
            </div>
            <button 
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} 
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- LAZY COMPONENTS (CODE SPLITTING) ---
const lazyImport = <T extends React.ComponentType<any>>(
  factory: () => Promise<{ [key: string]: T }>,
  name: string
): React.LazyExoticComponent<T> => {
  return lazy(() => 
    factory()
      .then((module) => {
        // console.log(`[LazyImport] Loaded: ${name}`); 
        return { default: module[name as keyof typeof module] };
      })
      .catch(err => {
        logger.error(`[LazyImport] Failed to load ${name}:`, err);
        throw err;
      })
  );
};

// Core Components
const Login = lazyImport(() => import('./components/Login'), 'Login');
const UpdatePassword = lazyImport(() => import('./components/UpdatePassword'), 'UpdatePassword');
const Layout = lazyImport(() => import('./components/Layout'), 'Layout');
const Dashboard = lazyImport(() => import('./components/Dashboard'), 'Dashboard');
const ModuleView = lazyImport(() => import('./components/ModuleView'), 'ModuleView');

// Admin Components
const AdminUserManagement = lazyImport(() => import('./components/AdminUserManagement'), 'AdminUserManagement');
const AdminModuleManagement = lazyImport(() => import('./components/AdminModuleManagement'), 'AdminModuleManagement');
const AdminOrgManagement = lazyImport(() => import('./components/AdminOrgManagement'), 'AdminOrgManagement');
const AdminNotificationConfig = lazyImport(() => import('./components/AdminNotificationConfig'), 'AdminNotificationConfig');
const AuditLogs = lazyImport(() => import('./components/AuditLogs'), 'AuditLogs');
const Instructions = lazyImport(() => import('./supabase_setup'), 'Instructions');

// HydroSys Components
// CORRECTION: Changed from ./components/HydroSys/HydroSysDashboard to ./components/HydroSysDashboard
const HydroSysDashboard = lazyImport(() => import('./components/HydroSysDashboard'), 'HydroSysDashboard');
const HydroCertificados = lazyImport(() => import('./components/HydroSys/HydroCertificados'), 'HydroCertificados');
const HydroCloro = lazyImport(() => import('./components/HydroSys/HydroCloro'), 'HydroCloro');
const HydroFiltros = lazyImport(() => import('./components/HydroSys/HydroFiltros'), 'HydroFiltros');
const HydroReservatorios = lazyImport(() => import('./components/HydroSys/HydroReservatorios'), 'HydroReservatorios');
const HydroConfig = lazyImport(() => import('./components/HydroSys/HydroConfig'), 'HydroConfig');
const HydroSysAnalytics = lazyImport(() => import('./components/HydroSys/HydroAnalytics'), 'HydroSysAnalytics');

// PestControl Components
const PestControlDashboard = lazyImport(() => import('./components/PestControl/PestControlDashboard'), 'PestControlDashboard');
const PestControlExecution = lazyImport(() => import('./components/PestControl/PestControlExecution'), 'PestControlExecution');
const PestControlConfig = lazyImport(() => import('./components/PestControl/PestControlConfig'), 'PestControlConfig');
const PestControlAnalytics = lazyImport(() => import('./components/PestControl/PestControlAnalytics'), 'PestControlAnalytics');
const PestControlHelp = lazyImport(() => import('./components/PestControl/PestControlHelp'), 'PestControlHelp');

// --- LOADING FALLBACK ---
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="flex flex-col items-center gap-4">
       <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 dark:border-brand-400"></div>
       <p className="text-slate-400 font-mono text-xs animate-pulse uppercase tracking-widest">Carregando...</p>
    </div>
  </div>
);

// Component to handle Supabase Auth Events
const AuthObserver = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        logger.log("Password Recovery Event Detected - Redirecting...");
        navigate('/update-password');
      }
    });

    return () => {
      if (data && data.subscription) data.subscription.unsubscribe();
    };
  }, [navigate]);

  return null;
};

// Componente para lidar com redirecionamento PWA (Modo Cloro)
const PWANavigator = ({ user }: { user: User | null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Só executa se tiver USUÁRIO e ainda não tiver verificado nesta sessão do componente
    if (user && !checked) {
       const params = new URLSearchParams(window.location.search);
       const mode = params.get('mode');
       
       if (mode === 'cloro') {
           logger.log("[PWA] Redirecting to Cloro Module");
           // Navega para o Módulo e remove o query param da história para não ficar preso
           navigate('/module/hydrosys/cloro', { replace: true });
       }
       setChecked(true);
    }
  }, [user, checked, navigate]);

  return null;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string>('/');

  useEffect(() => {
    logger.log('[App] Initializing...');
    const initApp = async () => {
        try {
            if (isSupabaseConfigured()) {
                await supabase.auth.getSession();
            }
        } catch (e) {
            logger.warn("Session check failed", e);
        }

        const orgInit = orgService.initialize();

        const currentUser = await authService.refreshSessionUser();
        if (currentUser) {
            logger.log('[App] User found:', currentUser.email);
        } else {
            logger.log('[App] No user session found.');
        }
        setUser(currentUser);
        orgInit.catch(() => undefined);
        
        // PWA Initial Detection for Login Redirect
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'cloro') {
            setRedirectPath('/module/hydrosys/cloro');
        }

        setLoading(false);
    };

    initApp();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null);
        return;
      }
      const refreshed = await authService.refreshSessionUser();
      setUser(refreshed);
      orgService.initialize().catch(() => undefined);
    });

    return () => {
      if (data?.subscription) data.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (userToSet: User) => {
    setUser(userToSet);
    orgService.initialize().catch(() => undefined);
    return true;
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmationProvider>
          <Router>
            <AuthObserver />
            <PWANavigator user={user} />
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/setup" element={<Instructions />} />
                  
                  <Route 
                    path="/login" 
                    element={
                      // Se o USUÁRIO logar, usa o redirectPath definido no useEffect inicial
                      user ? <Navigate to={redirectPath} replace /> : <Login onLogin={handleLogin} />
                    } 
                  />

                  <Route path="/update-password" element={<UpdatePassword />} />

                  <Route
                    path="*"
                    element={
                      user ? (
                        <Layout user={user} onLogout={handleLogout}>
                          <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                              <Routes>
                                <Route path="/" element={<Dashboard user={user} />} />
                                
                                {/* Admin Routes */}
                                <Route path="/admin/users" element={(user.role === UserRole.ADMIN || user.role === UserRole.GESTOR) ? <AdminUserManagement /> : <Navigate to="/" replace />} />
                                <Route path="/admin/modules" element={user.role === UserRole.ADMIN ? <AdminModuleManagement /> : <Navigate to="/" replace />} />
                                <Route path="/admin/org" element={user.role === UserRole.ADMIN ? <AdminOrgManagement /> : <Navigate to="/" replace />} />
                                <Route path="/admin/notifications" element={user.role === UserRole.ADMIN ? <AdminNotificationConfig /> : <Navigate to="/" replace />} />
                                <Route path="/admin/logs" element={(user.role === UserRole.ADMIN || user.role === UserRole.GESTOR) ? <AuditLogs /> : <Navigate to="/" replace />} />

                                {/* HydroSys Routes */}
                                <Route path="/module/hydrosys" element={<HydroSysDashboard user={user} />} />
                                <Route path="/module/hydrosys/certificados" element={<HydroCertificados user={user} />} />
                                <Route path="/module/hydrosys/cloro" element={<HydroCloro user={user} />} />
                                <Route path="/module/hydrosys/filtros" element={<HydroFiltros user={user} />} />
                                <Route path="/module/hydrosys/reservatorios" element={<HydroReservatorios user={user} />} />
                                <Route path="/module/hydrosys/config" element={user.role === UserRole.ADMIN ? <HydroConfig user={user} /> : <Navigate to="/module/hydrosys" replace />} />
                                <Route path="/module/hydrosys/analytics" element={user.role === UserRole.ADMIN ? <HydroSysAnalytics user={user} /> : <Navigate to="/module/hydrosys" replace />} />

                                {/* Pest Control Routes */}
                                <Route path="/module/pestcontrol" element={<PestControlDashboard user={user} />} />
                                <Route path="/module/pestcontrol/execution" element={<PestControlExecution user={user} />} />
                                <Route path="/module/pestcontrol/help" element={<PestControlHelp user={user} />} />
                                <Route path="/module/pestcontrol/config" element={user.role === UserRole.ADMIN ? <PestControlConfig user={user} /> : <Navigate to="/module/pestcontrol" replace />} />
                                <Route path="/module/pestcontrol/analytics" element={user.role === UserRole.ADMIN ? <PestControlAnalytics user={user} /> : <Navigate to="/module/pestcontrol" replace />} />
                                
                                <Route path="/module/:id" element={<ModuleView />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                              </Routes>
                            </Suspense>
                          </ErrorBoundary>
                        </Layout>
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    }
                  />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Router>
        </ConfirmationProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
