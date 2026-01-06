import React, { useState, useEffect } from 'react';
import { User, UserRole, AppNotification, NotificationType } from '../types';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { orgService } from '../services/orgService';
import { NotificationCenter } from './NotificationCenter';
import { CriticalAlertBanner } from './CriticalAlertBanner';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import { 
  LogOut, 
  Menu, 
  X, 
  LayoutGrid, 
  Bell, 
  ShieldCheck,
  Layers,
  Building2,
  Moon,
  Sun,
  MapPin,
  Droplets,
  Award,
  TestTube,
  Filter,
  Droplet,
  PieChart,
  ArrowLeft
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Notification States
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<NotificationType | 'ALL'>('ALL');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const { theme, toggleTheme } = useTheme();
  
  const navigate = useNavigate();
  const location = useLocation();

  const userSedeCount = user.sedeIds ? user.sedeIds.length : 0;
  const primarySede = userSedeCount > 0 ? orgService.getSedeById(user.sedeIds[0]) : null;
  const userRegion = user.regionId ? orgService.getRegionById(user.regionId) : null;

  // Check if we are inside HydroSys module
  const isHydroSys = location.pathname.includes('/module/hydrosys');

  useEffect(() => {
    // 1. Run Check Logic for Warnings/Criticals based on Rules
    notificationService.checkSystemStatus(user);
    
    // 2. Load Notifications
    setNotifications(notificationService.getAll());

    // 3. Interval for polling (Simulated)
    const interval = setInterval(() => {
      // Re-check system status every minute in case something expired while open
      notificationService.checkSystemStatus(user);
      setNotifications(notificationService.getAll());
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    authService.logout();
    onLogout();
    navigate('/login');
  };

  const handleOpenCriticalNotifications = () => {
      setNotifFilter('ERROR');
      setIsNotifOpen(true);
  };

  const navItemClass = (path: string) => `
    flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
    ${location.pathname === path 
      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold shadow-sm' 
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
  `;

  const unreadCount = notifications.filter(n => !n.read).length;
  // Check if there are any CRITICAL unread notifications to animate the bell
  const hasCritical = notifications.some(n => !n.read && n.type === 'ERROR');

  const renderHydroSysSidebar = () => (
    <>
      <div className="pt-2 pb-2">
        <p className="px-4 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-2">
          Menu HydroSys
        </p>
        
        <Link to="/module/hydrosys" className={navItemClass('/module/hydrosys')} onClick={() => setIsSidebarOpen(false)}>
          <LayoutGrid size={20} />
          <span>Dashboard Hydro</span>
        </Link>
        <Link to="/module/hydrosys/cloro" className={navItemClass('/module/hydrosys/cloro')} onClick={() => setIsSidebarOpen(false)}>
          <TestTube size={20} />
          <span>Controle de Cloro</span>
        </Link>
        <Link to="/module/hydrosys/certificados" className={navItemClass('/module/hydrosys/certificados')} onClick={() => setIsSidebarOpen(false)}>
          <Award size={20} />
          <span>Certificados</span>
        </Link>
        <Link to="/module/hydrosys/filtros" className={navItemClass('/module/hydrosys/filtros')} onClick={() => setIsSidebarOpen(false)}>
          <Filter size={20} />
          <span>Filtros</span>
        </Link>
        <Link to="/module/hydrosys/reservatorios" className={navItemClass('/module/hydrosys/reservatorios')} onClick={() => setIsSidebarOpen(false)}>
          <Droplet size={20} />
          <span>Reservatórios</span>
        </Link>
        {user.role === UserRole.ADMIN && (
           <Link to="/module/hydrosys/analytics" className={navItemClass('/module/hydrosys/analytics')} onClick={() => setIsSidebarOpen(false)}>
            <PieChart size={20} />
            <span>Analytics</span>
          </Link>
        )}
      </div>

      <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <Link to="/" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:text-brand-600 transition-colors">
            <ArrowLeft size={20} />
            <span>Voltar ao Hub</span>
          </Link>
      </div>
    </>
  );

  const renderMainSidebar = () => {
    const isAdmin = user.role === UserRole.ADMIN;
    const isGestor = user.role === UserRole.GESTOR;
    const canManageUsers = isAdmin || isGestor;

    return (
      <>
        <Link to="/" className={navItemClass('/')} onClick={() => setIsSidebarOpen(false)}>
          <LayoutGrid size={20} />
          <span>Dashboard</span>
        </Link>

        {(isAdmin || canManageUsers) && (
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider">
              Administração
            </p>
          </div>
        )}

        {isAdmin && (
          <Link to="/admin/org" className={navItemClass('/admin/org')} onClick={() => setIsSidebarOpen(false)}>
            <Building2 size={20} />
            <span>Estrutura Org.</span>
          </Link>
        )}
        
        {canManageUsers && (
          <Link to="/admin/users" className={navItemClass('/admin/users')} onClick={() => setIsSidebarOpen(false)}>
            <ShieldCheck size={20} />
            <span>Gestão Usuários</span>
          </Link>
        )}

        {isAdmin && (
          <Link to="/admin/modules" className={navItemClass('/admin/modules')} onClick={() => setIsSidebarOpen(false)}>
            <Layers size={20} />
            <span>Catálogo de Apps</span>
          </Link>
        )}

        {isAdmin && (
           <Link to="/admin/notifications" className={navItemClass('/admin/notifications')} onClick={() => setIsSidebarOpen(false)}>
            <Bell size={20} />
            <span>Config. Notificações</span>
          </Link>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex">
      <NotificationCenter 
        isOpen={isNotifOpen} 
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkRead={(id) => setNotifications(notificationService.markAsRead(id))}
        onMarkAllRead={() => setNotifications(notificationService.markAllRead())}
        activeFilter={notifFilter}
        onFilterChange={setNotifFilter}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Glassmorphism */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 shadow-xl transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-4">
          {/* Logo Area */}
          <div className="h-20 flex items-center px-4 mb-2">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg 
                ${isHydroSys ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30' : 'bg-gradient-to-br from-brand-500 to-indigo-600 shadow-brand-500/30'}`}>
                {isHydroSys ? <Droplets size={22} /> : <LayoutGrid size={22} />}
              </div>
              <div>
                <span className="block text-xl font-bold tracking-tight text-slate-900 dark:text-white">Nexus</span>
                <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {isHydroSys ? 'HydroSys' : 'Corporativo'}
                </span>
              </div>
            </div>
            <button 
              className="ml-auto lg:hidden text-slate-500 hover:text-brand-500"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          {/* User Info Card */}
          <div className="p-4 mb-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-600 shadow-sm bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold">
                  {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
            {(userRegion || primarySede) && (
              <div className="flex items-start text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                <MapPin size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                <span className="leading-tight">
                  {userSedeCount > 1 ? `${userSedeCount} Sedes Vinculadas` : primarySede?.name} <br/>
                  <span className="opacity-70">{userRegion?.name}</span>
                </span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-2">
            {isHydroSys ? renderHydroSysSidebar() : renderMainSidebar()}
          </nav>

          {/* Bottom Actions */}
          <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800 space-y-2">
             <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                  <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
                </div>
              </button>
             <button 
                onClick={() => { setNotifFilter('ALL'); setIsNotifOpen(true); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Bell size={20} className={hasCritical ? 'text-red-500 animate-pulse' : ''} />
                  <span>Notificações</span>
                </div>
                {unreadCount > 0 && (
                  <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${hasCritical ? 'bg-red-500 shadow-red-500/50 animate-pulse' : 'bg-brand-500 shadow-brand-500/50'}`}>
                    {unreadCount}
                  </span>
                )}
              </button>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut size={20} />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center px-4 justify-between lg:hidden flex-shrink-0 z-30">
          <div className="flex items-center space-x-3">
             <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500 dark:text-slate-400">
              <Menu size={24} />
            </button>
            <span className="font-bold text-slate-900 dark:text-white">
              {isHydroSys ? 'HydroSys' : 'Nexus Hub'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setNotifFilter('ALL'); setIsNotifOpen(true); }} className="relative text-slate-500 dark:text-slate-400">
              <Bell size={24} className={hasCritical ? 'text-red-500 animate-pulse' : ''} />
              {unreadCount > 0 && (
                <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${hasCritical ? 'bg-red-600' : 'bg-brand-500'}`}></span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
             {/* CRITICAL ALERT BANNER - ONLY ON DASHBOARD */}
             {location.pathname === '/' && (
                 <CriticalAlertBanner onViewCritical={handleOpenCriticalNotifications} />
             )}
            
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};