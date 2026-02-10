
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bug, ShieldAlert, PieChart, Settings, HelpCircle, ChevronRight, AlertTriangle, CalendarCheck, CheckCircle2, TrendingUp, Clock, MapPin, Database, Activity } from 'lucide-react';
import { User, UserRole, PestControlEntry } from '../../types';
import { orgService } from '../../services/orgService';
import { pestService } from '../../services/pestService';
import { Breadcrumbs } from '../Shared/Breadcrumbs';
import { diffDaysFromToday, isBeforeToday, isOnOrBefore, formatDateBR } from '../../utils/dateUtils';

interface Props {
  user: User;
}

const COLOR_STYLES: Record<string, { border: string; icon: string; badge: string; glow: string }> = {
    slate: {
        border: 'border-slate-200 dark:border-white/5',
        icon: 'bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-white/60',
        badge: 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/50',
        glow: 'bg-slate-500/10'
    },
    amber: {
        border: 'border-amber-500/20 dark:border-amber-500/30',
        icon: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300',
        glow: 'bg-amber-500/10'
    },
    emerald: {
        border: 'border-emerald-500/20 dark:border-emerald-500/30',
        icon: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        glow: 'bg-emerald-500/10'
    },
    red: {
        border: 'border-rose-500/20 dark:border-rose-500/30',
        icon: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
        badge: 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300',
        glow: 'bg-rose-500/10'
    },
    purple: {
        border: 'border-purple-500/20 dark:border-purple-500/30',
        icon: 'bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400',
        badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
        glow: 'bg-purple-500/10'
    },
    cyan: {
        border: 'border-cyan-500/20 dark:border-cyan-500/30',
        icon: 'bg-cyan-50 dark:bg-cyan-900/10 text-cyan-600 dark:text-cyan-400',
        badge: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
        glow: 'bg-cyan-500/10'
    }
};

const getDynamicStatus = (entry: PestControlEntry) => {
    if (entry.status === 'REALIZADO') return 'REALIZADO';
    if (!entry.scheduledDate) return 'PENDENTE';
    if (isBeforeToday(entry.scheduledDate)) return 'ATRASADO';
    return 'PENDENTE';
};

const KPICard = ({ label, value, icon: Icon, color, subtext, delay }: any) => {
    const styles = COLOR_STYLES[color] || COLOR_STYLES.slate;
    return (
    <div 
        className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111114]/80 border ${styles.border} p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards`}
        style={{ animationDelay: delay }}
    >
        <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${styles.glow} transition-transform duration-500 group-hover:scale-110`}></div>
        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles.icon}`}>
                    <Icon size={20} strokeWidth={1.5} />
                </div>
                {subtext && <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${styles.badge} uppercase`}>{subtext}</span>}
            </div>
            <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{value}</h3>
                <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500 dark:text-white/40">{label}</p>
            </div>
        </div>
    </div>
    );
};

// Novo componente de visualização de dados
const OverviewWidget = ({ total, completed, pending, delayed }: any) => {
    const getPct = (val: number) => total > 0 ? (val / total) * 100 : 0;
    
    return (
        <div className="col-span-full bg-white dark:bg-[#16161a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-4 gap-4">
                <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Activity size={16} className="text-blue-500" /> Resumo Operacional
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                        Progresso geral dos agendamentos
                    </p>
                </div>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> concluído
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pendente
                    </div>
                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Atrasado
                    </div>
                </div>
            </div>

            {/* Segmented Progress Bar */}
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div style={{ width: `${getPct(completed)}%` }} className="h-full bg-emerald-500 transition-all duration-1000 ease-out relative group">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div style={{ width: `${getPct(pending)}%` }} className="h-full bg-amber-500 transition-all duration-1000 ease-out relative group">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div style={{ width: `${getPct(delayed)}%` }} className="h-full bg-red-500 transition-all duration-1000 ease-out relative group">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
            </div>
            
            <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-400">
                <span>0%</span>
                <span>{Math.round(getPct(completed))}% EFICIÊNCIA</span>
                <span>100%</span>
            </div>
        </div>
    );
};

const ActionCard = ({ title, desc, icon: Icon, onClick, color, delay }: any) => {
    const styles = COLOR_STYLES[color] || COLOR_STYLES.slate;
    return (
    <button 
        onClick={onClick}
        className="group relative w-full text-left overflow-hidden rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-[#16161a] dark:to-[#0f0f12] border border-slate-200 dark:border-slate-800 p-6 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards"
        style={{ animationDelay: delay }}
    >
        <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${styles.icon} group-hover:scale-110 transition-transform duration-300`}>
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
};

export const PestControlDashboard: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const userSede = (user.sedeIds && user.sedeIds.length > 0) ? orgService.getSedeById(user.sedeIds[0]) : null;
  const isAdmin = user.role === UserRole.ADMIN;

  const [stats, setStats] = useState({
      total: 0,
      pending: 0,
      delayed: 0,
      completed: 0,
      sla: 0,
      next7: 0,
      avgDelay: 0,
      status: 'REGULAR'
  });
  const [upcoming, setUpcoming] = useState<PestControlEntry[]>([]);

  useEffect(() => {
      const loadStats = async () => {
          const entries = await pestService.getAll(user);
          
          const total = entries.length;
          let pendingCount = 0;
          let delayedCount = 0;
          let completedCount = 0;
          let completedOnTime = 0;
          let next7Count = 0;
          let delayDaysTotal = 0;
          let delayDaysCount = 0;
          const futureList: PestControlEntry[] = [];

          entries.forEach(e => {
              const status = getDynamicStatus(e);
              if (status === 'PENDENTE') pendingCount++;
              if (status === 'ATRASADO') delayedCount++;
              if (status === 'REALIZADO') completedCount++;
              
              if (status === 'REALIZADO' && e.performedDate && e.scheduledDate) {
                  if (isOnOrBefore(e.performedDate, e.scheduledDate)) completedOnTime++;
              }
              
              if (status !== 'REALIZADO') {
                  futureList.push({ ...e, status: status as any }); 
                  const diff = diffDaysFromToday(e.scheduledDate);
                  if (diff >= 0 && diff <= 7) next7Count++;
                  if (diff < 0) {
                      delayDaysTotal += Math.abs(diff);
                      delayDaysCount += 1;
                  }
              }
          });
          
          futureList.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
          
          setStats({
              total,
              pending: pendingCount,
              delayed: delayedCount,
              completed: completedCount,
              sla: completedCount > 0 ? Math.round((completedOnTime / completedCount) * 100) : 0,
              next7: next7Count,
              avgDelay: delayDaysCount > 0 ? Math.round(delayDaysTotal / delayDaysCount) : 0,
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
        
        <Breadcrumbs />

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                    CONTROLE DE <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">PRAGAS</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">gestão Sanitária e Controle de Vetores</p>
            </div>
            
            <div className="flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm backdrop-blur-sm">
                <div className={`w-2.5 h-2.5 rounded-full ${stats.status === 'CRÍTICO' ? 'bg-red-500 animate-pulse' : stats.status === 'PENDENTE' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Geral</span>
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase">{stats.status}</span>
                </div>
            </div>
        </header>

        {/* Visual Summary Widget */}
        <OverviewWidget 
            total={stats.total} 
            completed={stats.completed} 
            pending={stats.pending} 
            delayed={stats.delayed} 
        />

        {/* KPI Grid - Updated to Requested Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard label="Total Agendamentos" value={stats.total} icon={Database} color="slate" delay="0ms" />
            <KPICard label="Pendentes" value={stats.pending} icon={Clock} color="amber" subtext="Dentro do Prazo" delay="100ms" />
            <KPICard label="Realizados" value={stats.completed} icon={CheckCircle2} color="emerald" delay="200ms" />
            <KPICard label="Atrasados" value={stats.delayed} icon={AlertTriangle} color="red" subtext={stats.delayed > 0 ? `Média ${stats.avgDelay}d` : "Regular"} delay="300ms" />
            <KPICard label="SLA Dentro do Prazo" value={`${stats.sla}%`} icon={CalendarCheck} color="cyan" subtext="Dos realizados" delay="400ms" />
            <KPICard label="Próximos 7 dias" value={stats.next7} icon={CalendarCheck} color="purple" subtext="Agendados" delay="500ms" />
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
                        <TrendingUp size={18} className="text-amber-500" /> próximas Ações
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
                                                {formatDateBR(item.scheduledDate)}
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
