import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, Award, TestTube, Filter, Droplet, Settings, PieChart, Lock } from 'lucide-react';
import { User, UserRole } from '../types';
import { HYDROSYS_SUBMODULES } from '../constants';
import { authService } from '../services/authService';
import { orgService } from '../services/orgService';

interface Props {
  user: User;
}

const HydroIconMap: Record<string, React.ElementType> = {
  Award, TestTube, Filter, Droplet, Settings, PieChart
};

// Map Submodule IDs to Routes
const RouteMap: Record<string, string> = {
    'hs-certificados': '/module/hydrosys/certificados',
    'hs-cloro': '/module/hydrosys/cloro',
    'hs-filtros': '/module/hydrosys/filtros',
    'hs-limpeza': '/module/hydrosys/reservatorios',
    'hs-config': '/module/hydrosys/config',
    'hs-dashboard': '/module/hydrosys/analytics'
};

export const HydroSysDashboard: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const userSede = user.sedeId ? orgService.getSedeById(user.sedeId) : null;

  // Filter modules based on user role
  const allowedSubModules = HYDROSYS_SUBMODULES.filter(mod => {
    return mod.roles.includes(user.role);
  });

  const handleCardClick = (id: string) => {
      const route = RouteMap[id];
      if (route) navigate(route);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Specific for HydroSys */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 rounded-3xl p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10">
            <button 
                onClick={() => navigate('/')}
                className="flex items-center text-blue-100 hover:text-white transition-colors text-sm font-medium mb-4 bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm"
            >
                <ArrowLeft size={16} className="mr-1" />
                Voltar ao Hub
            </button>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                        <Droplets size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">HydroSys</h1>
                        <p className="text-blue-100">Gestão de Qualidade da Água</p>
                    </div>
                </div>
                {userSede && (
                     <div className="bg-blue-800/40 backdrop-blur-sm px-4 py-2 rounded-xl border border-blue-400/30">
                        <p className="text-xs text-blue-200 uppercase tracking-wider font-bold">Unidade Ativa</p>
                        <p className="font-semibold">{userSede.name}</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allowedSubModules.map(mod => {
            const Icon = HydroIconMap[mod.iconName] || Droplets;
            const isAdminOnly = mod.roles.length === 1 && mod.roles.includes(UserRole.ADMIN);

            return (
                <div 
                    key={mod.id}
                    onClick={() => handleCardClick(mod.id)}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl hover:border-cyan-200 dark:hover:border-cyan-800 transition-all duration-300 cursor-pointer relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-50 dark:bg-cyan-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500"></div>
                    
                    <div className="relative z-10">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 
                            ${isAdminOnly ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400'}
                        `}>
                            <Icon size={24} />
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{mod.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{mod.description}</p>
                        
                        <div className="flex items-center text-cyan-600 dark:text-cyan-400 text-sm font-bold group-hover:translate-x-2 transition-transform">
                            Acessar <ArrowLeft size={16} className="ml-1 rotate-180" />
                        </div>
                    </div>
                </div>
            );
        })}
        
        {/* Permission Message */}
        {allowedSubModules.length < HYDROSYS_SUBMODULES.length && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center opacity-75">
                <Lock size={24} className="text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">Alguns módulos estão ocultos para o seu perfil ({user.role}).</p>
            </div>
        )}
      </div>
    </div>
  );
};