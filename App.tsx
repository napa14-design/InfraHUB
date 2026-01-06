import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole } from './types';
import { authService } from './services/authService';
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for persisted session
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email: string) => {
    // In this mock implementation, we retrieve the user by email since authentication 
    // was already handled by the Login component.
    const users = authService.getAllUsers();
    const foundUser = users.find(u => u.email === email);
    
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
            } 
          />

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