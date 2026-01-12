
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bug, ShieldAlert, PieChart, Settings, HelpCircle, ChevronRight, AlertTriangle, CalendarCheck, CheckCircle2, TrendingUp, Clock, MapPin } from 'lucide-react';
import { User, UserRole, PestControlEntry } from '../../types';
import { orgService } from '../../services/orgService';
import { pestService } from '../../services/pestService';

interface Props {
  user: User;
}

const getDynamicStatus = (entry: PestControlEntry) => {
    if (entry.status === 'REALIZADO') return 'REALIZADO';
    const today = new Date();
    today.setHours(0,0,0,0);
    if (!entry.scheduledDate) return 'PENDENTE';
    const [year, month, day] = entry.scheduledDate.split('-').map(Number);
    const target = new Date(year, month - 1, day);
    if (target.getTime() < today.getTime()) return 'ATRASADO';
    return 'PENDENTE';
};

const KPICard = ({ label, value, icon: Icon, color, subtext, delay }: any) => (
    <div 
        className={`relative overflow-hidden rounded-3xl p-6 bg-white dark:bg-[#16161a] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/50 group animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards`}
        style={{ animationDelay: delay }}
    >
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-500`}></div>
        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400`}>
                    <Icon size={24} strokeWidth={1.5} />
                </div>
                {subtext && <span className={`text-[10px] font-bold px-2 py-1 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 uppercase`}>{subtext}</span>}
            </div>
            <div>
                <h3 className="text-4xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">{value}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            </div>
        </div>
    </div>
);

const ActionCard = ({ title, desc, icon: Icon, onClick, color, delay }: any) => (
    <button 
        onClick={onClick}
        className="group relative w-full text-left overflow-hidden rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-[#16161a] dark:to-[#0f0f12] border border-slate-200 dark:border-slate-800 p-6 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards"
        style={{ animationDelay: delay }}
    >
        <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${color}-50 dark:bg-${color}-900/10 text-${color}-600 dark:text-${color}-400 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={24} />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{title}</h3>
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all">
                <ChevronRight size={16} />
            </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-relaxed pl-1">{desc}</p>
    </button>
);

export const PestControlDashboard: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const userSede = (user.sedeIds && user.sedeIds.length > 0) ? orgService.getSedeById(user.sedeIds[0]) : null;
  const isAdmin = user.role === UserRole.ADMIN;

  const [stats, setStats] = useState({
      pending: 0,
      delayed: 0,
      completed: 0,
      nextDate: '',
      nextLocation: '',
      status: 'REGULAR'
  });
  const [upcoming, setUpcoming] = useState<PestControlEntry[]>([]);

  useEffect(() => {
      const loadStats = async () => {
          const entries = await pestService.getAll(user);
          
          let pendingCount = 0;
          let delayedCount = 0;
          let completedCount = 0;
          const futureList: PestControlEntry[] = [];

          entries.forEach(e => {
              const status = getDynamicStatus(e);
              if (status === 'PENDENTE') pendingCount++;
              if (status === 'ATRASADO') delayedCount++;
              if (status === 'REALIZADO') completedCount++;
              
              if (status !== 'REALIZADO') {
                  futureList.push({ ...e, status: status as any }); 
              }
          });
          
          futureList.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
          
          const nextItem = futureList.length > 0 ? futureList[0] : null;
          const nextDate = nextItem ? new Date(nextItem.scheduledDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '--';
          const nextLocation = nextItem ? nextItem.sedeId : '--';

          setStats({
              pending: pendingCount,
              delayed: delayedCount,
              completed: completedCount,
              nextDate,
              nextLocation,
              status: delayedCount > 0 ? 'CRÍTICO' : pendingCount > 0 ? 'PENDENTE' : 'REGULAR'
          });
          
          setUpcoming(futureList.slice(0, 4)); 
      };
      loadStats();
  }, [user]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0A0A0C]">
      {/* Background Pattern - Hexagons */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-50/50 to-slate-100 dark:from-[#0A0A0C] dark:via-[#0e0e11] dark:to-[#0A0A0C]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-[120px]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.05]" width="100%" height="100%">
            <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                <path d="M25 0 L50 14.4 L50 43.3 L25 57.7 L0 43.3 L0 14.4 Z" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-900 dark:text-amber-500"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#hexagons)" />
        </svg>
      </div>

      <div className="relative z-10 px-4 md:px-8 py-6 space-y-8 max-w-7xl mx-auto pb-24">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
                <button onClick={() => navigate('/')} className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-xs font-bold uppercase tracking-widest mb-3">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Hub Principal
                </button>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                    CONTROLE DE <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">PRAGAS</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Gestão Sanitária e Controle de Vetores</p>
            </div>
            
            <div className="flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm backdrop-blur-sm">
                <div className={`w-2.5 h-2.5 rounded-full ${stats.status === 'CRÍTICO' ? 'bg-red-500 animate-pulse' : stats.status === 'PENDENTE' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Geral</span>
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase">{stats.status}</span>
                </div>
            </div>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Próxima Visita" value={stats.nextDate} icon={CalendarCheck} color="amber" subtext={stats.nextLocation} delay="0ms" />
            <KPICard label="Pendências" value={stats.pending} icon={Clock} color="blue" delay="100ms" />
            <KPICard label="Atrasados" value={stats.delayed} icon={AlertTriangle} color="red" subtext={stats.delayed > 0 ? "Ação Imediata" : "Regular"} delay="200ms" />
            <KPICard label="Realizados (Total)" value={stats.completed} icon={CheckCircle2} color="emerald" delay="300ms" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Menu Actions */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ActionCard 
                    title="Dedetização" 
                    desc="Gerenciar cronograma, lançar execuções e monitorar serviços." 
                    icon={ShieldAlert} 
                    onClick={() => navigate('/module/pestcontrol/execution')}
                    color="amber"
                    delay="400ms"
                />
                <ActionCard 
                    title="Ajuda & Manuais" 
                    desc="Procedimentos operacionais (POP), fichas técnicas e emergência." 
                    icon={HelpCircle} 
                    onClick={() => navigate('/module/pestcontrol/help')}
                    color="cyan"
                    delay="500ms"
                />
                {isAdmin && (
                    <>
                        <ActionCard 
                            title="Analytics" 
                            desc="Indicadores de performance e conformidade por unidade." 
                            icon={PieChart} 
                            onClick={() => navigate('/module/pestcontrol/analytics')}
                            color="purple"
                            delay="600ms"
                        />
                        <ActionCard 
                            title="Configurações" 
                            desc="Ajuste de ciclos, cadastro de pragas e regras de alerta." 
                            icon={Settings} 
                            onClick={() => navigate('/module/pestcontrol/config')}
                            color="slate"
                            delay="700ms"
                        />
                    </>
                )}
            </div>

            {/* Right Column: Timeline Widget */}
            <div className="bg-white/90 dark:bg-[#16161a]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/20 flex flex-col animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <TrendingUp size={18} className="text-amber-500" /> Próximas Ações
                    </h3>
                    <button onClick={() => navigate('/module/pestcontrol/execution')} className="text-[10px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-500 uppercase bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full transition-colors">
                        Ver Tudo
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-0 relative pl-2">
                    {/* Timeline Line */}
                    <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800"></div>

                    {upcoming.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/10 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-500">
                                <CheckCircle2 size={32} />
                            </div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Cronograma em dia!</p>
                        </div>
                    ) : (
                        upcoming.map((item, idx) => {
                            const isDelayed = item.status === 'ATRASADO';
                            return (
                                <div key={item.id} className="relative pl-10 py-3 group">
                                    {/* Timeline Dot */}
                                    <div className={`absolute left-[13px] top-5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 z-10 transition-all duration-300 ${isDelayed ? 'bg-red-500 ring-2 ring-red-100 dark:ring-red-900/30' : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-amber-500'}`}></div>
                                    
                                    <div className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-md ${isDelayed ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-amber-200 dark:hover:border-amber-900/50'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${isDelayed ? 'text-red-500' : 'text-slate-400 group-hover:text-amber-500'}`}>
                                                {new Date(item.scheduledDate).toLocaleDateString()}
                                            </span>
                                            {isDelayed && <AlertTriangle size={12} className="text-red-500" />}
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{item.target}</h4>
                                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                            <MapPin size={10} /> {item.sedeId}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
