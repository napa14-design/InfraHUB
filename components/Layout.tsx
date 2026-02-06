
import React, { useState, useEffect } from 'react';
import { User, UserRole, AppNotification, NotificationType } from '../types';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { orgService } from '../services/orgService';
import { NotificationCenter } from './NotificationCenter';
import { CriticalAlertBanner } from './CriticalAlertBanner';
import { CommandPalette } from './CommandPalette';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import { FirstLoginSetup } from './FirstLoginSetup';
import { PWAInstallPrompt } from './Shared/PWAInstallPrompt';
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
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Database,
  Wifi,
  WifiOff,
  Settings,
  Bug,
  ShieldAlert,
  HelpCircle,
  FileText
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  // Sidebar States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop
  
  // Notification States
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<NotificationType | 'ALL'>('ALL');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // First Login Modal State
  const [showFirstLogin, setShowFirstLogin] = useState(false);

  const { theme, toggleTheme } = useTheme();
  
  const navigate = useNavigate();
  const location = useLocation();

  // Check Contexts
  const isHydroSys = location.pathname.includes('/module/hydrosys');
  const isPestControl = location.pathname.includes('/module/pestcontrol');
  
  // Safe User Name access
  const userName = user.name || 'Usuário';
  const userInitial = userName.charAt(0) || 'U';

  // Check Data Source
  const isMockData = orgService.isMockMode();

  // PERMISSION CHECK: Only Admin and Gestor can see alerts/notifications
  const canViewAlerts = user.role === UserRole.ADMIN || user.role === UserRole.GESTOR;

  // Derived Notification State
  const unreadCount = notifications.filter(n => !n.read).length;
  const hasCritical = notifications.some(n => n.type === 'ERROR' && !n.read);

  const fetchNotifications = async () => {
      // 1. Run checks (Async)
      await notificationService.checkSystemStatus(user);
      // 2. Fetch recent (Async)
      const data = await notificationService.getAll();
      setNotifications(data);
  };

  const handleMarkRead = async (id: string) => {
      await notificationService.markAsRead(id);
      // Removed manual fetchNotifications() call here as notificationService.markAsRead triggers the event
  };

  const handleMarkAllRead = async () => {
      await notificationService.markAllRead();
  };

  // CHECK FIRST LOGIN ON MOUNT
  useEffect(() => {
      if (user.isFirstLogin) {
          setShowFirstLogin(true);
      }
  }, [user.isFirstLogin]);

  useEffect(() => {
    if (canViewAlerts) {
        // Request Permission for Mobile Push / Desktop Notifications
        notificationService.requestPermission();

        fetchNotifications();
        
        // REAL-TIME LISTENER
        // This listens for events dispatched by notificationService.notifyRefresh()
        const unsubscribe = notificationService.onRefresh(() => {
            fetchNotifications();
        });

        // Polling every minute as backup
        const interval = setInterval(() => {
          fetchNotifications();
        }, 60000);
        
        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    }
  }, [user, canViewAlerts]);

  const handleLogout = () => {
    authService.logout();
    onLogout();
    navigate('/login');
  };

  const handleFirstLoginComplete = () => {
      setShowFirstLogin(false);
  };

  const handleOpenCriticalNotifications = () => {
      setNotifFilter('ERROR');
      setIsNotifOpen(true);
  };

  // --- COMPONENT: NAV ITEM ---
  const NavItem = ({ to, icon: Icon, label, onClick }: { to: string, icon: any, label: string, onClick?: () => void }) => {
    const isActive = location.pathname === to;
    const isButton = to === '#';

    return (
      <Link 
        to={to} 
        onClick={(e) => {
            if (isButton) e.preventDefault();
            if(onClick) onClick();
            setIsSidebarOpen(false);
        }}
        className={`
          group relative flex items-center px-3 py-3 rounded-xl transition-all duration-200 mb-1 cursor-pointer
          ${isActive 
            ? 'bg-gradient-to-r from-brand-50 to-white dark:from-brand-900/20 dark:to-transparent text-brand-600 dark:text-brand-400 font-bold' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
          ${isCollapsed ? 'justify-center' : ''}
        `}
      >
        {isActive && !isCollapsed && (
            <div className="absolute left-0 top-2 bottom-2 w-1 bg-brand-500 rounded-r-full" />
        )}
        <div className={`flex-shrink-0 transition-all duration-200 ${isActive && !isCollapsed ? 'ml-2' : ''}`}>
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        {!isCollapsed && (
            <span className="ml-3 truncate transition-opacity duration-300 opacity-100">
                {label}
            </span>
        )}
        
        {/* Tooltip Fix: Moved to fixed positioning relative to parent or smarter absolute handling */}
        {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] shadow-xl transition-all duration-200">
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
                {label}
            </div>
        )}
      </Link>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => {
      if (isCollapsed) return <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4 my-4"></div>;
      return (
        <p className="px-4 mt-6 mb-2 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-in fade-in duration-300">
            {label}
        </p>
      );
  };

  const renderBackToHub = () => (
      <div className={`mt-4 border-t border-slate-100 dark:border-slate-800 pt-4`}>
          {isCollapsed ? (
              <div className="flex justify-center group relative">
                  <Link to="/" className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-brand-600 transition-colors" title="Voltar ao Hub">
                      <ArrowLeft size={20} />
                  </Link>
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] shadow-xl transition-all duration-200">
                      <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
                      Voltar ao Hub
                  </div>
              </div>
          ) : (
              <Link to="/" className="flex items-center space-x-3 px-3 py-3 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <ArrowLeft size={20} />
                <span className="font-medium">Voltar ao Hub</span>
              </Link>
          )}
      </div>
  );

  const renderHydroSysSidebar = () => (
    <>
      <SectionLabel label="Módulos HydroSys" />
      <NavItem to="/module/hydrosys" icon={LayoutGrid} label="Dashboard" />
      <NavItem to="/module/hydrosys/cloro" icon={TestTube} label="Controle de Cloro" />
      <NavItem to="/module/hydrosys/certificados" icon={Award} label="Certificados" />
      <NavItem to="/module/hydrosys/filtros" icon={Filter} label="Filtros" />
      <NavItem to="/module/hydrosys/reservatorios" icon={Droplet} label="reservatórios" />
      {user.role === UserRole.ADMIN && (
         <>
            <NavItem to="/module/hydrosys/analytics" icon={PieChart} label="Analytics" />
            <NavItem to="/module/hydrosys/config" icon={Settings} label="CONFIGURAÇÕES" />
         </>
      )}
      {renderBackToHub()}
    </>
  );

  const renderPestControlSidebar = () => (
    <>
      <SectionLabel label="Controle de Pragas" />
      <NavItem to="/module/pestcontrol" icon={LayoutGrid} label="Visão Geral" />
      <NavItem to="/module/pestcontrol/execution" icon={ShieldAlert} label="Dedetização" />
      {user.role === UserRole.ADMIN && (
         <>
            <NavItem to="/module/pestcontrol/analytics" icon={PieChart} label="Analytics" />
            <NavItem to="/module/pestcontrol/config" icon={Settings} label="CONFIGURAÇÕES" />
         </>
      )}
      <NavItem to="/module/pestcontrol/help" icon={HelpCircle} label="Ajuda" />
      {renderBackToHub()}
    </>
  );

  const renderMainSidebar = () => {
    const isAdmin = user.role === UserRole.ADMIN;
    const isGestor = user.role === UserRole.GESTOR;
    const canManageUsers = isAdmin || isGestor;

    return (
      <>
        <NavItem to="/" icon={LayoutGrid} label="Dashboard" />
        {(isAdmin || canManageUsers) && <SectionLabel label="Administração" />}
        {isAdmin && <NavItem to="/admin/org" icon={Building2} label="Estrutura Org." />}
        {canManageUsers && <NavItem to="/admin/users" icon={ShieldCheck} label="Gestão de usuários" />}
        {(isAdmin || isGestor) && <NavItem to="/admin/logs" icon={FileText} label="Logs de Auditoria" />}
        {isAdmin && <NavItem to="/admin/modules" icon={Layers} label="Catélogo Apps" />}
        {isAdmin && <NavItem to="#" onClick={() => { setNotifFilter('ALL'); setIsNotifOpen(true); }} icon={Bell} label="Central de Alertas" />}
      </>
    );
  };

  const getModuleConfig = () => {
      if (isHydroSys) return { title: 'HydroSys', subtitle: 'Gestão de água', icon: Droplets, color: 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30' };
      if (isPestControl) return { title: 'Pragas', subtitle: 'Controle Sanitário', icon: Bug, color: 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30' };
      return { title: 'InfraHub', subtitle: 'Infraestrutura', icon: LayoutGrid, color: 'bg-gradient-to-br from-brand-500 to-indigo-600 shadow-brand-500/30' };
  };

  const modConfig = getModuleConfig();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex">
      <CommandPalette />
      {showFirstLogin && <FirstLoginSetup user={user} onComplete={handleFirstLoginComplete} />}
      {canViewAlerts && (
          <NotificationCenter 
            isOpen={isNotifOpen} 
            onClose={() => setIsNotifOpen(false)}
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            activeFilter={notifFilter}
            onFilterChange={setNotifFilter}
            userRole={user.role} 
          />
      )}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 shadow-xl transform transition-all duration-300 ease-in-out lg:relative ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'lg:w-[88px]' : 'lg:w-72'}`}>
        <div className="h-full flex flex-col">
          <div className="h-20 flex items-center px-4 mb-2 flex-shrink-0 transition-all">
            <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'justify-between w-full space-x-3'}`}>
              <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-300 flex-shrink-0 ${modConfig.color}`}>
                    <modConfig.icon size={22} />
                  </div>
                  {!isCollapsed && (
                      <div className="animate-in fade-in duration-300 whitespace-nowrap overflow-hidden">
                        <span className="block text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">{modConfig.title}</span>
                        <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{modConfig.subtitle}</span>
                      </div>
                  )}
              </div>
            </div>
            <button className="lg:hidden text-slate-500 hover:text-brand-500 ml-auto" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
          </div>
          
          {/* NAV CONTAINER FIX: Switch overflow based on state to allow tooltips */}
          <nav className={`flex-1 px-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden'}`}>
            {isHydroSys ? renderHydroSysSidebar() : isPestControl ? renderPestControlSidebar() : renderMainSidebar()}
          </nav>
          
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-2">
             
             {/* PWA INSTALL BUTTON */}
             <PWAInstallPrompt collapsed={isCollapsed} />

             {!isCollapsed && (
                <div className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 mb-1 border ${isMockData ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' : 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'}`}>
                    {isMockData ? <WifiOff size={12}/> : <Wifi size={12}/>}
                    {isMockData ? 'Modo Demo' : 'Supabase OK'}
                </div>
             )}
             <div className={`hidden lg:flex ${isCollapsed ? 'justify-center' : 'justify-end'} mb-2`}>
                 <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-brand-600 hover:border-brand-300 transition-all shadow-sm">
                     {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                 </button>
             </div>
             <div className={`relative rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 group ${isCollapsed ? 'p-2 flex flex-col items-center' : 'p-3'}`}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'justify-between w-full'}`}>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold border-2 border-white dark:border-slate-900">{userInitial}</div>
                            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white dark:border-slate-800 rounded-full ${isMockData ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                        </div>
                        {!isCollapsed && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{userName.split(' ')[0]}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{user.role}</p>
                            </div>
                        )}
                    </div>
                    {!isCollapsed && <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Sair"><LogOut size={16} /></button>}
                </div>
                <button onClick={toggleTheme} className={`flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${isCollapsed ? 'mt-2 w-9 h-9 border border-slate-100 dark:border-slate-700' : 'mt-3 w-full py-1.5 border-t border-slate-100 dark:border-slate-700 pt-3'}`} title="Alternar Tema">
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
                {isCollapsed && <button onClick={handleLogout} className="mt-2 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Sair"><LogOut size={16} /></button>}
             </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative bg-slate-50 dark:bg-slate-950">
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center px-4 justify-between lg:hidden flex-shrink-0 z-30">
          <div className="flex items-center space-x-3">
             <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500 dark:text-slate-400"><Menu size={24} /></button>
            <span className="font-bold text-slate-900 dark:text-white">{modConfig.title}</span>
          </div>
          <div className="flex items-center gap-3">
            {canViewAlerts && (
                <button onClick={() => { setNotifFilter('ALL'); setIsNotifOpen(true); }} className="relative text-slate-500 dark:text-slate-400">
                <Bell size={24} className={hasCritical ? 'text-red-500 animate-pulse' : ''} />
                {unreadCount > 0 && <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${hasCritical ? 'bg-red-600' : 'bg-brand-500'}`}></span>}
                </button>
            )}
            <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">{userInitial}</div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
             {location.pathname === '/' && canViewAlerts && <CriticalAlertBanner onViewCritical={handleOpenCriticalNotifications} />}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
