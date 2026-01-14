import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User, UserRole } from './types';
import { authService } from './services/authService';
import { orgService } from './services/orgService'; 
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { ThemeProvider } from './components/ThemeContext';
import { ToastProvider } from './components/Shared/ToastContext'; // Import ToastProvider
import { Instructions } from './supabase_setup';

// --- ERROR BOUNDARY FOR LAZY LOADING ---
interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Lazy Load Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 text-center">
          <div className="max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-mono uppercase">Erro de Carregamento</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Houve uma falha ao baixar o módulo. Verifique sua conexão.</p>
            <button 
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} 
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
            >
              Tentar Novamente
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
  return lazy(() => factory().then((module) => ({ default: module[name as keyof typeof module] })));
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

// HydroSys Components
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
       <p className="text-slate-400 font-mono text-xs animate-pulse uppercase tracking-widest">Carregando Módulo...</p>
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
        console.log("Password Recovery Event Detected - Redirecting...");
        navigate('/update-password');
      }
    });

    return () => {
      if (data && data.subscription) data.subscription.unsubscribe();
    };
  }, [navigate]);

  return null;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
        try {
            if (isSupabaseConfigured()) {
                await supabase.auth.getSession();
            }
        } catch (e) {
            console.warn("Session check failed", e);
        }

        await orgService.initialize();

        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
        setLoading(false);
    };

    initApp();
  }, []);

  const handleLogin = async (email: string) => {
    const users = await authService.getAllUsers();
    const foundUser = users.find(u => u.email === email);
    
    if (foundUser) {
      setUser(foundUser);
      await orgService.initialize();
      return true;
    }
    return false;
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
        <Router>
          <AuthObserver />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/setup" element={<Instructions />} />
                
                <Route 
                  path="/login" 
                  element={
                    user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
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
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;