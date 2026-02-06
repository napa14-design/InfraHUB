
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AppModule, ModuleStatus, ModuleType } from '../types';
import { moduleService } from '../services/moduleService';
import { authService } from '../services/authService';
import { 
  Users, FileText, BarChart3, Box, Truck, LifeBuoy, AlertTriangle,
  CheckCircle, Clock, Wrench, ExternalLink, Globe, Layout, Briefcase,
  Building2, Droplets, ArrowRight, Zap, Search, Bell, Sparkles, Command,
  LayoutGrid, Activity
} from 'lucide-react';

const IconMap: Record<string, React.ElementType> = {
  Users, FileText, BarChart3, Box, Truck, LifeBuoy, Globe, Layout, Briefcase, Building2, Droplets
};

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<AppModule[]>([]);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    setModules(moduleService.getAll());
    
    const updateGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setGreeting('Bom dia');
        else if (hour >= 12 && hour < 18) setGreeting('Boa tarde');
        else setGreeting('Boa noite');
    };

    updateGreeting();
    
    const clockInterval = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  const accessibleModules = modules.filter(module => 
    authService.hasPermission(user.role, module.minRole)
  );

  const filteredModules = accessibleModules.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleModuleClick = (module: AppModule) => {
    if (module.type === ModuleType.EXTERNAL) {
      window.open(module.path, '_blank');
    } else {
      navigate(module.path);
    }
  };

  return (
    <div className="relative min-h-screen pb-20 overflow-hidden">
      
      {/* ARCHITECTURAL BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        {/* Grids */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] text-brand-600 dark:text-brand-500"
          style={{
            backgroundImage: `
              linear-gradient(currentColor 1px, transparent 1px),
              linear-gradient(90deg, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.02] text-slate-900 dark:text-white"
          style={{
            backgroundImage: `
              linear-gradient(currentColor 0.5px, transparent 0.5px),
              linear-gradient(90deg, currentColor 0.5px, transparent 0.5px)
            `,
            backgroundSize: '12px 12px',
          }}
        />
        
        {/* Diagonal Lines Texture */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.015] dark:opacity-[0.03]" preserveAspectRatio="none">
          <defs>
            <pattern id="diag-lines" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="20" className="stroke-slate-900 dark:stroke-white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diag-lines)" />
        </svg>

        {/* Ambient Glow */}
        <div 
          className="absolute top-0 right-0 w-[600px] h-[600px] opacity-40 dark:opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className={`space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10 px-1 pt-4 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      
        {/* HERO SECTION */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-px w-8 bg-brand-500"></div>
                    <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
                        Central de Comando
                    </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
                    {greeting}, <br/>
                    <span className="text-slate-400 dark:text-slate-500 font-light">
                        {user.name.split(' ')[0]}
                    </span>
                </h1>
            </div>

            {/* Right Side: Search & Time */}
            <div className="w-full lg:w-auto flex flex-col items-start lg:items-end gap-4">
                {/* Time Display */}
                <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 font-mono text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <Activity size={12} className="text-brand-500 animate-pulse" />
                    <span>{currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '')}</span>
                    <span className="w-px h-3 bg-slate-300 dark:bg-slate-700"></span>
                    <span>{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Search Bar Technical */}
                <div className="relative w-full lg:w-80 group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-cyan-500 rounded-lg opacity-20 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
                        <div className="pl-3 text-slate-400">
                            <Search size={16} />
                        </div>
                        <input 
                            type="text"
                            placeholder="Acessar Módulo..."
                            className="w-full bg-transparent border-none outline-none px-3 py-2 text-sm font-mono text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="hidden md:flex items-center pr-2">
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                                CTRL K
                            </kbd>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* APPS GRID */}
        <div>
            <div className="flex items-center gap-3 mb-6">
                <LayoutGrid size={20} className="text-brand-600 dark:text-brand-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Aplicações Ativas
                </h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                <span className="text-xs font-mono text-slate-400">
                    {filteredModules.length} RECURSOS
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredModules.map((module, index) => {
                    const Icon = IconMap[module.iconName] || Box;
                    const isExternal = module.type === ModuleType.EXTERNAL;
                    
                    // Stagger animation
                    const delay = { animationDelay: `${index * 50}ms` };

                    return (
                        <button
                            key={module.id}
                            onClick={() => handleModuleClick(module)}
                            style={delay}
                            className="group relative flex flex-col h-full animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards text-left"
                        >
                            {/* Card Body */}
                            <div className="flex-1 w-full flex flex-col bg-white dark:bg-[#111114] border border-slate-200 dark:border-white/5 hover:border-brand-400 dark:hover:border-brand-500/50 rounded-xl p-6 transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-1">
                                
                                {/* Technical Corner Accents (Visible on Hover) */}
                                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-brand-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-brand-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-brand-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-brand-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`
                                        w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300
                                        ${isExternal 
                                            ? 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700' 
                                            : 'bg-brand-50 dark:bg-brand-900/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/30'
                                        }
                                    `}>
                                        <Icon size={24} strokeWidth={1.5} />
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${module.status === 'NORMAL' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                                        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                                            {module.status === 'NORMAL' ? 'ONLINE' : 'ALERTA'}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 mb-6">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                        {module.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">
                                        {module.description}
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span className={`
                                        text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded border
                                        ${isExternal 
                                            ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500' 
                                            : 'bg-brand-50 dark:bg-brand-900/10 border-brand-100 dark:border-brand-900/30 text-brand-600 dark:text-brand-400'}
                                    `}>
                                        {isExternal ? 'EXTERNO' : 'INTERNO'}
                                    </span>

                                    <div className="text-slate-300 dark:text-slate-600 group-hover:text-brand-500 dark:group-hover:text-brand-400 group-hover:translate-x-1 transition-all">
                                        {isExternal ? <ExternalLink size={16} /> : <ArrowRight size={16} />}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
            
            {filteredModules.length === 0 && (
                <div className="py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Search size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Nenhum app encontrado</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Verifique os termos de busca.</p>
                </div>
            )}
        </div>

      </div>
      
      {/* Technical Footer */}
      <div className="fixed bottom-4 left-0 right-0 text-center pointer-events-none z-0">
          <div className="inline-flex items-center gap-4 text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
              <span>Sistema v2.0</span>
              <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
              <span>conexão Segura</span>
          </div>
      </div>
    </div>
  );
};