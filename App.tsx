
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User, UserRole } from './types';
import { authService } from './services/authService';
import { orgService } from './services/orgService'; 
import { supabase, isSupabaseConfigured } from './lib/supabase'; // Import supabase client
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Layout } from './components/Layout';
import { ModuleView } from './components/ModuleView';
import { AdminUserManagement } from './components/AdminUserManagement';
import { AdminModuleManagement } from './components/AdminModuleManagement';
import { AdminOrgManagement } from './components/AdminOrgManagement';
import { AdminNotificationConfig } from './components/AdminNotificationConfig';
import { HydroSysDashboard } from './components/HydroSysDashboard';
import { HydroCertificados } from './components/HydroSys/HydroCertificados';
import { HydroCloro } from './components/HydroSys/HydroCloro';
import { HydroFiltros } from './components/HydroSys/HydroFiltros';
import { HydroReservatorios } from './components/HydroSys/HydroReservatorios';
import { HydroConfig } from './components/HydroSys/HydroConfig';
import { HydroSysAnalytics } from './components/HydroSys/HydroAnalytics';
import { ThemeProvider } from './components/ThemeContext';
import { Instructions } from './supabase_setup';
import { UpdatePassword } from './components/UpdatePassword';

// Component to handle Supabase Auth Events (Like Password Recovery Redirects)
const AuthObserver = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // FORCE redirect to update-password when recovery link is clicked
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
            // 0. Ensure Session is restored before fetching data
            // This is critical for RLS policies to recognize the user
            if (isSupabaseConfigured()) {
                await supabase.auth.getSession();
            }
        } catch (e) {
            console.warn("Session check failed", e);
        }

        // 1. Load Org Cache (Critical for UI labels)
        await orgService.initialize();

        // 2. Check Session
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
      // Re-fetch org data on login to ensure we have fresh data with new permissions
      await orgService.initialize();
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Callback to update user state after password change without logging out
  const refreshUser = () => {
      const updated = authService.getCurrentUser();
      setUser(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
             <p className="text-slate-500 font-medium animate-pulse">Carregando Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <AuthObserver /> {/* Listens for Password Recovery events inside Router */}
        <Routes>
          <Route path="/setup" element={<Instructions />} />
          
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
            } 
          />

          {/* Password Reset Route (No Auth Required) */}
          <Route path="/update-password" element={<UpdatePassword />} />

          {/* Protected Routes Wrapper */}
          <Route
            path="*"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Routes>
                    <Route path="/" element={<Dashboard user={user} />} />
                    
                    {/* Admin Routes */}
                    <Route 
                      path="/admin/users" 
                      element={
                        (user.role === UserRole.ADMIN || user.role === UserRole.GESTOR)
                          ? <AdminUserManagement /> 
                          : <Navigate to="/" replace />
                      } 
                    />

                    <Route 
                      path="/admin/modules" 
                      element={
                        user.role === UserRole.ADMIN 
                          ? <AdminModuleManagement /> 
                          : <Navigate to="/" replace />
                      } 
                    />

                    <Route 
                      path="/admin/org" 
                      element={
                        user.role === UserRole.ADMIN 
                          ? <AdminOrgManagement /> 
                          : <Navigate to="/" replace />
                      } 
                    />

                    <Route 
                      path="/admin/notifications" 
                      element={
                        user.role === UserRole.ADMIN 
                          ? <AdminNotificationConfig /> 
                          : <Navigate to="/" replace />
                      } 
                    />

                    {/* HydroSys Main Route */}
                    <Route 
                        path="/module/hydrosys" 
                        element={<HydroSysDashboard user={user} />} 
                    />

                    {/* HydroSys Internal Routes */}
                    <Route path="/module/hydrosys/certificados" element={<HydroCertificados user={user} />} />
                    <Route path="/module/hydrosys/cloro" element={<HydroCloro user={user} />} />
                    <Route path="/module/hydrosys/filtros" element={<HydroFiltros user={user} />} />
                    <Route path="/module/hydrosys/reservatorios" element={<HydroReservatorios user={user} />} />
                    
                    <Route 
                      path="/module/hydrosys/config" 
                      element={
                        user.role === UserRole.ADMIN 
                          ? <HydroConfig user={user} />
                          : <Navigate to="/module/hydrosys" replace />
                      } 
                    />

                    <Route 
                      path="/module/hydrosys/analytics" 
                      element={
                        user.role === UserRole.ADMIN 
                          ? <HydroSysAnalytics user={user} />
                          : <Navigate to="/module/hydrosys" replace />
                      } 
                    />
                    
                    {/* Generic Module Routes */}
                    <Route path="/module/:id" element={<ModuleView />} />
                    
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
