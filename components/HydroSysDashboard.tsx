
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, Award, TestTube, Filter, Droplet, Settings, PieChart, Lock, ChevronRight, Activity, AlertTriangle, Gauge, Thermometer, Waves } from 'lucide-react';
import { User, UserRole } from '../types';
import { HYDROSYS_SUBMODULES } from '../constants';
import { orgService } from '../services/orgService';
import { hydroService } from '../services/hydroService';

interface Props {
  user: User;
}

const HydroIconMap: Record<string, React.ElementType> = {
  Award, TestTube, Filter, Droplet, Settings, PieChart
};

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
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const userSede = (user.sedeIds && user.sedeIds.length > 0) ? orgService.getSedeById(user.sedeIds[0]) : null;

  // Real Data State
  const [stats, setStats] = useState({
      reservatorios: 0,
      certificados: 0,
      filtros: 0,
      alertas: 0
  });
  
  const [latestReading, setLatestReading] = useState({
      ph: 0,
      cloro: 0,
      date: ''
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    fetchDashboardData();

    return () => clearInterval(timer);
  }, [user]);

  const fetchDashboardData = async () => {
      try {
          const [certs, filts, pocos, cist, caixas, cloroEntries] = await Promise.all([
              hydroService.getCertificados(user),
              hydroService.getFiltros(user),
              hydroService.getPocos(user),
              hydroService.getCisternas(user),
              hydroService.getCaixas(user),
              hydroService.getCloro(user)
          ]);

          // 1. Calc Totals
          const totalReservatorios = pocos.length + cist.length + caixas.length;
          
          // 2. Calc Alerts (Simple logic: Check dates)
          const today = new Date();
          let alertCount = 0;

          const checkDate = (dateStr?: string, daysThreshold = 30) => {
              if (!dateStr) return false;
              const d = new Date(dateStr);
              const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return diff <= daysThreshold;
          };

          // Check Certs
          certs.forEach(c => { if (c.status !== 'VIGENTE' || checkDate(c.validade)) alertCount++; });
          // Check Filtros
          filts.forEach(f => { if (checkDate(f.proximaTroca, 15)) alertCount++; });
          // Check Reservatorios (Pocos only for now as example of cleaning)
          pocos.forEach(p => { if (checkDate(p.proximaLimpeza)) alertCount++; });

          setStats({
              reservatorios: totalReservatorios,
              certificados: certs.length,
              filtros: filts.length,
              alertas: alertCount
          });

          // 3. Latest Reading
          if (cloroEntries.length > 0) {
              // Sort by date desc
              const sorted = [...cloroEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              const last = sorted[0];
              setLatestReading({
                  ph: last.ph,
                  cloro: last.cl,
                  date: last.date
              });
          }

      } catch (error) {
          console.error("Error loading dashboard data", error);
      } finally {
          setIsLoading(false);
      }
  };

  const allowedSubModules = HYDROSYS_SUBMODULES.filter(mod => {
    return mod.roles.includes(user.role);
  });

  const handleCardClick = (id: string) => {
      const route = RouteMap[id];
      if (route) navigate(route);
  };

  // Dynamic Metrics based on fetched data
  const metrics = [
    { id: 'reserv', label: 'Reservatórios', value: stats.reservatorios.toString().padStart(2, '0'), unit: 'ativos', status: 'normal', icon: Droplet },
    { id: 'cert', label: 'Certificados', value: stats.certificados.toString().padStart(2, '0'), unit: 'total', status: 'normal', icon: Award },
    { id: 'filtros', label: 'Filtros', value: stats.filtros.toString().padStart(2, '0'), unit: 'un', status: 'normal', icon: Filter },
    { id: 'alertas', label: 'Alertas', value: stats.alertas.toString().padStart(2, '0'), unit: 'pendentes', status: stats.alertas > 0 ? 'critical' : 'normal', icon: AlertTriangle },
  ];

  const liveData = [
    { label: 'pH Recente', value: latestReading.ph > 0 ? latestReading.ph.toFixed(1) : '--', unit: 'pH', icon: Gauge },
    { label: 'Cloro (CL)', value: latestReading.cloro > 0 ? latestReading.cloro.toFixed(1) : '--', unit: 'mg/L', icon: TestTube },
    { label: 'Temp. Amb.', value: '28°', unit: 'C', icon: Thermometer }, // Mocked sensor data (hard to get without IoT)
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0A0A0C]">
      
      {/* ========== INDUSTRIAL GRID BACKGROUND ========== */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Base */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
        
        {/* Primary Grid - Adaptive Colors */}
        <div 
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] text-slate-400 dark:text-cyan-500"
          style={{
            backgroundImage: `
              linear-gradient(currentColor 1px, transparent 1px),
              linear-gradient(90deg, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
        
        {/* Secondary Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015] text-slate-400 dark:text-cyan-500"
          style={{
            backgroundImage: `
              linear-gradient(currentColor 0.5px, transparent 0.5px),
              linear-gradient(90deg, currentColor 0.5px, transparent 0.5px)
            `,
            backgroundSize: '16px 16px',
          }}
        />

        {/* Pipe/Flow Lines SVG - Visible mostly in Dark Mode or very subtle in Light */}
        <svg className="absolute inset-0 w-full h-full opacity-10 dark:opacity-10" preserveAspectRatio="none">
          {/* Horizontal pipe lines */}
          <line x1="0" y1="20%" x2="30%" y2="20%" className="stroke-slate-300 dark:stroke-cyan-500" strokeWidth="3" strokeDasharray="20 10" />
          <line x1="70%" y1="35%" x2="100%" y2="35%" className="stroke-slate-300 dark:stroke-cyan-500" strokeWidth="3" strokeDasharray="20 10" />
          <line x1="0" y1="80%" x2="25%" y2="80%" className="stroke-slate-300 dark:stroke-cyan-500" strokeWidth="2" />
          <line x1="75%" y1="65%" x2="100%" y2="65%" className="stroke-slate-300 dark:stroke-cyan-500" strokeWidth="2" />
          
          {/* Vertical connectors */}
          <line x1="30%" y1="20%" x2="30%" y2="40%" className="stroke-slate-300 dark:stroke-cyan-500" strokeWidth="3" strokeDasharray="20 10" />
          <line x1="70%" y1="35%" x2="70%" y2="55%" className="stroke-slate-300 dark:stroke-cyan-500" strokeWidth="3" strokeDasharray="20 10" />
          
          {/* Junction circles */}
          <circle cx="30%" cy="20%" r="6" fill="none" className="stroke-slate-300 dark:stroke-cyan-500" strokeWidth="2" />
          <circle cx="70%" cy="35%" r="6" fill="none" className="stroke-slate-300 dark:stroke-cyan-500" strokeWidth="2" />
        </svg>

        {/* Corner Technical Markers */}
        <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-slate-300 dark:border-cyan-500/10" />
        <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-slate-300 dark:border-cyan-500/10" />
        <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-slate-300 dark:border-cyan-500/10" />
        <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-slate-300 dark:border-cyan-500/10" />

        {/* Ambient glow */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30 dark:opacity-100"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ========== TOP STATUS BAR ========== */}
      <div className="relative z-10 border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
        <div className="px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
              <span className="text-[10px] font-mono text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  {isLoading ? 'Atualizando...' : 'Sistema Online'}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-400 dark:text-white/30">
              <Activity size={12} className="text-cyan-600 dark:text-cyan-500" />
              <span>Dados em tempo real</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-white/40 tabular-nums">
            {currentTime.toLocaleDateString('pt-BR')} | {currentTime.toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <div className="relative z-10 px-4 md:px-8 py-6 space-y-6 pb-24 md:pb-8">
        
        {/* ========== HEADER ========== */}
        <header 
          className={`
            relative overflow-hidden border border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-sm
            transition-all duration-700
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
          `}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          
          <div className="p-6 md:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              
              {/* Left side */}
              <div className="space-y-4">
                <button 
                  onClick={() => navigate('/')}
                  className="group flex items-center gap-2 text-slate-500 dark:text-white/40 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all text-xs font-mono uppercase tracking-widest"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
                  Hub Principal
                </button>
                
                <div className="flex items-center gap-5">
                  {/* Logo */}
                  <div className="relative">
                    <div className="w-16 h-16 border-2 border-cyan-500/20 dark:border-cyan-500/50 flex items-center justify-center bg-cyan-50 dark:bg-cyan-500/5">
                      <Waves size={32} className="text-cyan-600 dark:text-cyan-500" strokeWidth={1.5} />
                    </div>
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-500" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-500" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-cyan-500" />
                      <span className="text-[10px] font-mono text-cyan-600/70 dark:text-cyan-500/70 uppercase tracking-widest">
                        Módulo Operacional
                      </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                      HYDRO<span className="text-cyan-600 dark:text-cyan-500">SYS</span>
                    </h1>
                    <p className="text-slate-500 dark:text-white/30 text-sm font-mono mt-0.5">
                      Gestão de Recursos Hídricos
                    </p>
                  </div>
                </div>
              </div>

              {/* Right side - Sede + Live data */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                {/* Live data indicators */}
                <div className="hidden xl:flex items-center gap-4">
                  {liveData.map((data, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
                      <data.icon size={14} className="text-cyan-600/70 dark:text-cyan-500/70" />
                      <div>
                        <div className="text-xs text-slate-500 dark:text-white/30 font-mono">{data.label}</div>
                        <div className="text-sm text-slate-800 dark:text-white font-mono font-bold">
                          {data.value}<span className="text-slate-400 dark:text-white/40 text-xs ml-1">{data.unit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sede info */}
                {userSede && (
                  <div className="flex flex-col items-start lg:items-end gap-1">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-white/30 uppercase tracking-widest">
                      Unidade
                    </span>
                    <div className="flex items-center gap-3 px-4 py-2 border border-cyan-500/20 bg-cyan-50 dark:bg-cyan-500/5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-slate-800 dark:text-white font-mono font-bold text-lg">{userSede.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ========== METRICS GRID ========== */}
        <div 
          className={`
            grid grid-cols-2 lg:grid-cols-4 gap-4
            transition-all duration-700 delay-100
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            const statusConfig = {
              normal: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-600 dark:text-emerald-500', dot: 'bg-emerald-500' },
              warning: { border: 'border-amber-500/20', bg: 'bg-amber-500/5', text: 'text-amber-600 dark:text-amber-500', dot: 'bg-amber-500' },
              critical: { border: 'border-red-500/20', bg: 'bg-red-500/5', text: 'text-red-600 dark:text-red-500', dot: 'bg-red-500 animate-pulse' },
            };
            const config = statusConfig[metric.status as keyof typeof statusConfig] || statusConfig.normal;
            
            return (
              <div 
                key={metric.id}
                className={`relative p-5 border bg-white dark:bg-transparent ${config.border} ${config.bg}`}
              >
                {/* Corner accent */}
                <div className={`absolute top-0 right-0 w-2 h-2 ${config.dot}`} />
                
                <div className="flex items-start justify-between mb-3">
                  <Icon size={20} className={config.text} />
                  <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                </div>
                
                <div className="space-y-1">
                  <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                    {metric.value}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-white/40 font-mono uppercase tracking-wider">
                    {metric.label} <span className="text-slate-300 dark:text-white/20">/ {metric.unit}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========== MODULES SECTION ========== */}
        <div 
          className={`
            transition-all duration-700 delay-200
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          {/* Section header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-cyan-500" />
            <span className="text-sm font-mono text-slate-500 dark:text-white/40 uppercase tracking-widest">
              Painéis de Controle
            </span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/5" />
            <span className="text-[10px] font-mono text-slate-400 dark:text-white/20">
              {allowedSubModules.length} disponíveis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allowedSubModules.map((mod, index) => {
              const Icon = HydroIconMap[mod.iconName] || Droplets;
              const isAdminOnly = mod.roles.length === 1 && mod.roles.includes(UserRole.ADMIN);

              return (
                <button 
                  key={mod.id}
                  onClick={() => handleCardClick(mod.id)}
                  className="group relative text-left h-full"
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animation: mounted ? 'fade-up 0.4s ease-out forwards' : 'none',
                    opacity: 0,
                  }}
                >
                  {/* Card */}
                  <div className={`
                    relative h-full border bg-white dark:bg-[#111114]/80 backdrop-blur-sm p-6 transition-all duration-300
                    ${isAdminOnly 
                      ? 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10' 
                      : 'border-slate-200 dark:border-white/5 hover:border-cyan-500/30 hover:bg-cyan-50/[0.02] dark:hover:bg-cyan-500/[0.02]'
                    }
                  `}>
                    {/* Top accent on hover */}
                    <div className={`
                      absolute top-0 left-0 right-0 h-px transition-all duration-300
                      ${isAdminOnly ? 'bg-transparent' : 'bg-transparent group-hover:bg-cyan-500/50'}
                    `} />
                    
                    {/* Corner accent */}
                    <div className={`
                      absolute top-0 right-0 w-3 h-3 border-t border-r transition-colors duration-300
                      ${isAdminOnly ? 'border-slate-200 dark:border-white/10' : 'border-slate-200 dark:border-white/10 group-hover:border-cyan-500/50'}
                    `} />
                    
                    {/* Top row */}
                    <div className="flex justify-between items-start mb-5">
                      <div className={`
                        w-12 h-12 border flex items-center justify-center transition-all duration-300
                        ${isAdminOnly 
                          ? 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-400 dark:text-white/30' 
                          : 'border-cyan-500/20 bg-cyan-50 dark:bg-cyan-500/5 text-cyan-600 dark:text-cyan-500 group-hover:border-cyan-500/40 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-500/10'
                        }
                      `}>
                        <Icon size={24} />
                      </div>
                      
                      {isAdminOnly && (
                        <span className="px-2 py-1 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-[9px] font-mono text-slate-500 dark:text-white/40 uppercase tracking-wider">
                          Admin
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-2 mb-6">
                      <h3 className={`
                        text-lg font-bold transition-colors duration-300
                        ${isAdminOnly ? 'text-slate-500 dark:text-white/60' : 'text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400'}
                      `}>
                        {mod.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-white/30 leading-relaxed line-clamp-2 font-mono">
                        {mod.description}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <span className={`
                        text-[10px] font-mono uppercase tracking-widest transition-colors duration-300
                        ${isAdminOnly ? 'text-slate-400 dark:text-white/20' : 'text-slate-500 dark:text-white/30 group-hover:text-cyan-600 dark:group-hover:text-cyan-500/70'}
                      `}>
                        Acessar
                      </span>
                      <div className={`
                        w-8 h-8 border flex items-center justify-center transition-all duration-300
                        ${isAdminOnly 
                          ? 'border-slate-200 dark:border-white/5 text-slate-300 dark:text-white/20' 
                          : 'border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30 group-hover:border-cyan-500/30 group-hover:text-cyan-600 dark:group-hover:text-cyan-500 group-hover:translate-x-1'
                        }
                      `}>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Locked modules */}
            {allowedSubModules.length < HYDROSYS_SUBMODULES.length && (
              <div className="h-full min-h-[200px] border border-dashed border-slate-300 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01] flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 border border-slate-300 dark:border-white/10 flex items-center justify-center mb-3">
                  <Lock size={20} className="text-slate-400 dark:text-white/20" />
                </div>
                <p className="text-xs text-slate-400 dark:text-white/20 font-mono">
                  Módulos restritos
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========== FOOTER STATUS ========== */}
        <div 
          className={`
            flex items-center justify-between px-6 py-4 border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/[0.01]
            transition-all duration-700 delay-300
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 dark:text-white/30">
            <span>HYDROSYS v2.0</span>
            <span className="text-slate-300 dark:text-white/10">|</span>
            <span>Build 2024.01</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <div className="w-2 h-2 bg-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-500">OPERACIONAL</span>
          </div>
        </div>
      </div>

      {/* ========== CSS ========== */}
      <style>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
