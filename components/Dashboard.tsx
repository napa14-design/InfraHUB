import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AppModule, ModuleStatus, ModuleType } from '../types';
import { moduleService } from '../services/moduleService';
import { authService } from '../services/authService';
import { orgService } from '../services/orgService';
import { 
  Users, FileText, BarChart3, Box, Truck, LifeBuoy, AlertTriangle,
  CheckCircle, Clock, Wrench, ExternalLink, Globe, Layout, Briefcase,
  Building2, Map, Calendar, Sun, LayoutGrid, Droplets
} from 'lucide-react';

const IconMap: Record<string, React.ElementType> = {
  Users, FileText, BarChart3, Box, Truck, LifeBuoy, Globe, Layout, Briefcase, Building2, Droplets
};

const StatusBadge: React.FC<{ status: ModuleStatus }> = ({ status }) => {
  const styles = {
    [ModuleStatus.NORMAL]: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    [ModuleStatus.WARNING]: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    [ModuleStatus.CRITICAL]: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    [ModuleStatus.MAINTENANCE]: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  };

  const icons = {
    [ModuleStatus.NORMAL]: CheckCircle,
    [ModuleStatus.WARNING]: Clock,
    [ModuleStatus.CRITICAL]: AlertTriangle,
    [ModuleStatus.MAINTENANCE]: Wrench,
  };

  const Icon = icons[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${styles[status]}`}>
      <Icon size={12} className="mr-1.5" />
      {status === ModuleStatus.NORMAL ? 'Online' : status}
    </span>
  );
};

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<AppModule[]>([]);
  const userSede = user.sedeId ? orgService.getSedeById(user.sedeId) : null;

  useEffect(() => {
    setModules(moduleService.getAll());
  }, []);

  const accessibleModules = modules.filter(module => 
    authService.hasPermission(user.role, module.minRole)
  );

  const handleModuleClick = (module: AppModule) => {
    if (module.type === ModuleType.EXTERNAL) {
      window.open(module.path, '_blank');
    } else {
      navigate(module.path);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Section - Adapted for Light/Dark Mode */}
      <div className="relative rounded-3xl overflow-hidden p-8 md:p-12 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
        {/* Background Mesh Gradient - Only visible in Dark Mode for effect, or subtle in light */}
        <div className="absolute inset-0 bg-white dark:bg-slate-900 transition-colors">
           <div className="hidden dark:block absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/30 rounded-full blur-[100px] mix-blend-screen opacity-50 animate-pulse"></div>
           <div className="hidden dark:block absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/30 rounded-full blur-[80px] mix-blend-screen opacity-50"></div>
           
           {/* Light Mode subtle gradient */}
           <div className="dark:hidden absolute top-0 right-0 w-full h-full bg-gradient-to-br from-slate-50 to-white"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-300 mb-2 font-medium">
              <Sun size={18} />
              <span>Bom dia,</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              {user.name.split(' ')[0]}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg max-w-xl leading-relaxed">
              Bem-vindo ao Nexus Hub. Você tem acesso a <span className="font-bold text-slate-900 dark:text-white">{accessibleModules.length} aplicações</span> hoje.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 rounded-2xl p-4 min-w-[200px] text-slate-900 dark:text-white">
            <p className="text-xs text-slate-500 dark:text-slate-300 uppercase tracking-wider font-bold mb-1">Sua Unidade</p>
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-brand-600 dark:text-brand-300" />
              <span className="font-semibold text-lg">{userSede ? userSede.name : 'Matriz Global'}</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Map size={12} />
              {userSede?.address || 'Localização não definida'}
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <LayoutGrid className="text-brand-500" size={24} />
            Ferramentas Operacionais
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1 rounded-full shadow-sm">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {accessibleModules.map((module) => {
            const Icon = IconMap[module.iconName] || Box;
            
            return (
              <div 
                key={module.id}
                onClick={() => handleModuleClick(module)}
                className="group relative bg-white dark:bg-slate-900 rounded-3xl p-1 cursor-pointer transition-all duration-300 hover:-translate-y-1"
              >
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-3xl -z-10 group-hover:from-brand-400 group-hover:to-purple-500 transition-colors duration-300"></div>
                
                <div className="h-full bg-white dark:bg-slate-900/95 backdrop-blur-xl rounded-[22px] p-6 border border-slate-100 dark:border-slate-800 group-hover:border-transparent transition-colors">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 duration-300
                      ${module.type === ModuleType.EXTERNAL ? 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/30' : 'bg-gradient-to-br from-brand-500 to-cyan-600 shadow-brand-500/30'}
                    `}>
                      <Icon size={26} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={module.status} />
                      {module.type === ModuleType.EXTERNAL && (
                          <span className="flex items-center text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                              Externo <ExternalLink size={10} className="ml-1" />
                          </span>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 h-10 line-clamp-2">
                    {module.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{module.category}</span>
                     <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-brand-500 group-hover:text-white transition-all">
                       <Layout size={14} />
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};