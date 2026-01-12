
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bug, ShieldAlert, PieChart, Settings, HelpCircle, ChevronRight, AlertTriangle, CalendarCheck, CheckCircle2, TrendingUp } from 'lucide-react';
import { User, UserRole, PestControlEntry } from '../../types';
import { orgService } from '../../services/orgService';
import { pestService } from '../../services/pestService';

interface Props {
  user: User;
}

// Helper para consistência de status (mesma lógica da Execução)
const getDynamicStatus = (entry: PestControlEntry) => {
    if (entry.status === 'REALIZADO') return 'REALIZADO';
    
    // Comparação de datas (Ignorando horas para precisão de dia)
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (!entry.scheduledDate) return 'PENDENTE';
    
    // Parse manual YYYY-MM-DD para evitar problemas de timezone
    const [year, month, day] = entry.scheduledDate.split('-').map(Number);
    const target = new Date(year, month - 1, day);
    
    // Se a data alvo for menor que hoje (ontem ou antes), está atrasado
    if (target.getTime() < today.getTime()) return 'ATRASADO';
    
    return 'PENDENTE';
};

const MenuCard = ({ title, description, icon: Icon, onClick, colorClass, isAdminOnly }: any) => (
    <button 
        onClick={onClick}
        className="group relative text-left h-full w-full"
    >
        <div className={`relative h-full border bg-white dark:bg-[#111114]/80 backdrop-blur-sm p-6 transition-all duration-300 ${isAdminOnly ? 'border-slate-200 dark:border-white/5' : 'border-slate-200 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-50/[0.02] dark:hover:bg-amber-500/[0.02]'}`}>
            {/* Corner accent */}
            <div className={`absolute top-0 right-0 w-3 h-3 border-t border-r transition-colors duration-300 ${isAdminOnly ? 'border-slate-200 dark:border-white/10' : 'border-slate-200 dark:border-white/10 group-hover:border-amber-500/50'}`} />
            
            <div className="flex justify-between items-start mb-5">
                <div className={`w-12 h-12 border flex items-center justify-center transition-all duration-300 ${isAdminOnly ? 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-400' : `border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 ${colorClass} group-hover:bg-amber-100 dark:group-hover:bg-amber-500/10`}`}>
                    <Icon size={24} />
                </div>
                {isAdminOnly && <span className="px-2 py-1 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-[9px] font-mono text-slate-500 dark:text-white/40 uppercase tracking-wider">Admin</span>}
            </div>

            <div className="space-y-2 mb-6">
                <h3 className={`text-lg font-bold transition-colors duration-300 ${isAdminOnly ? 'text-slate-500 dark:text-white/60' : 'text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400'}`}>{title}</h3>
                <p className="text-sm text-slate-500 dark:text-white/30 leading-relaxed font-mono">{description}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <span className={`text-[10px] font-mono uppercase tracking-widest transition-colors duration-300 ${isAdminOnly ? 'text-slate-400' : 'text-slate-500 group-hover:text-amber-600'}`}>Acessar</span>
                <ChevronRight size={16} className={`transition-all duration-300 ${isAdminOnly ? 'text-slate-300' : 'text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1'}`} />
            </div>
        </div>
    </button>
);

export const PestControlDashboard: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const userSede = (user.sedeIds && user.sedeIds.length > 0) ? orgService.getSedeById(user.sedeIds[0]) : null;
  const isAdmin = user.role === UserRole.ADMIN;

  const [stats, setStats] = useState({
      pending: 0,
      delayed: 0,
      nextDate: '',
      status: 'REGULAR'
  });
  const [upcoming, setUpcoming] = useState<PestControlEntry[]>([]);

  useEffect(() => {
      const loadStats = async () => {
          const entries = await pestService.getAll(user);
          
          let pendingCount = 0;
          let delayedCount = 0;
          const futureList: PestControlEntry[] = [];

          entries.forEach(e => {
              // Use dynamic status calculation to match Execution List logic
              const status = getDynamicStatus(e);
              
              if (status === 'PENDENTE') pendingCount++;
              if (status === 'ATRASADO') delayedCount++;
              
              if (status !== 'REALIZADO') {
                  // Inject dynamic status into the object for the list display
                  futureList.push({ ...e, status: status as any }); 
              }
          });
          
          // Sort by date (oldest first for upcoming/delayed tasks)
          futureList.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
          
          const nextDate = futureList.length > 0 ? new Date(futureList[0].scheduledDate).toLocaleDateString() : 'N/A';

          setStats({
              pending: pendingCount,
              delayed: delayedCount,
              nextDate,
              status: delayedCount > 0 ? 'CRÍTICO' : pendingCount > 0 ? 'PENDENTE' : 'REGULAR'
          });
          
          setUpcoming(futureList.slice(0, 3)); // Top 3 next actions
      };
      loadStats();
  }, [user]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0A0A0C]">
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '40px 40px', color: '#f59e0b' }} />
      </div>

      <div className="relative z-10 px-4 md:px-8 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="relative overflow-hidden border border-slate-200 dark:border-white/5 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-sm rounded-3xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-4 w-full md:w-auto">
                <button onClick={() => navigate('/')} className="group flex items-center gap-2 text-slate-500 dark:text-white/40 hover:text-amber-600 dark:hover:text-amber-400 transition-all text-xs font-mono uppercase tracking-widest">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Hub
                </button>
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 border-2 border-amber-500/20 dark:border-amber-500/50 flex items-center justify-center bg-amber-50 dark:bg-amber-500/5 rounded-xl">
                        <Bug size={32} className="text-amber-600 dark:text-amber-500" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                            CONTROLE DE <span className="text-amber-600 dark:text-amber-500">PRAGAS</span>
                        </h1>
                        <p className="text-slate-500 dark:text-white/30 text-sm font-mono mt-0.5">Gestão de Vetores e Dedetização.</p>
                    </div>
                </div>
            </div>
            {/* Show User Context Scope */}
            <div className="px-4 py-2 border border-amber-500/20 bg-amber-50 dark:bg-amber-900/10 flex items-center gap-3 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-purple-500' : 'bg-amber-500'} animate-pulse`}></div>
                <span className="font-bold text-slate-800 dark:text-amber-100 uppercase text-xs">
                    {isAdmin ? 'Visão Geral (Admin)' : userSede ? userSede.name : 'Minhas Unidades'}
                </span>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Overview (Left Column) */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Próxima Visita</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{stats.nextDate}</p>
                    </div>
                    <CalendarCheck className="text-emerald-500" size={24} />
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Status Geral</p>
                        <p className={`text-xl font-black mt-1 ${stats.status === 'CRÍTICO' ? 'text-red-500' : 'text-emerald-600'}`}>{stats.status}</p>
                    </div>
                    {stats.status === 'REGULAR' ? <CheckCircle2 className="text-emerald-500" size={24} /> : <ShieldAlert className="text-amber-500" size={24} />}
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Pendências</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                            {stats.delayed > 0 ? <span className="text-red-500">{stats.delayed} Atrasados</span> : `${stats.pending} Agendados`}
                        </p>
                    </div>
                    <AlertTriangle className={stats.delayed > 0 ? "text-red-500 animate-pulse" : "text-slate-300 dark:text-slate-600"} size={24} />
                </div>

                {/* Main Menu Grid */}
                <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                    <MenuCard 
                        title="Dedetização" 
                        description="Cronograma operacional." 
                        icon={ShieldAlert} 
                        onClick={() => navigate('/module/pestcontrol/execution')}
                        colorClass="text-amber-600 dark:text-amber-500"
                    />
                    {isAdmin && (
                        <>
                            <MenuCard 
                                title="Analytics" 
                                description="Relatórios e gráficos." 
                                icon={PieChart} 
                                onClick={() => navigate('/module/pestcontrol/analytics')}
                                colorClass="text-purple-600 dark:text-purple-500"
                                isAdminOnly
                            />
                            <MenuCard 
                                title="Configuração" 
                                description="Regras e parâmetros." 
                                icon={Settings} 
                                onClick={() => navigate('/module/pestcontrol/config')}
                                colorClass="text-slate-600 dark:text-slate-400"
                                isAdminOnly
                            />
                        </>
                    )}
                    <MenuCard 
                        title="Ajuda" 
                        description="Manuais e contatos." 
                        icon={HelpCircle} 
                        onClick={() => navigate('/module/pestcontrol/help')}
                        colorClass="text-cyan-600 dark:text-cyan-500"
                    />
                </div>
            </div>

            {/* Upcoming Activity (Right Column) */}
            <div className="bg-white/80 dark:bg-[#111114]/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 font-mono uppercase text-sm">
                    <TrendingUp size={16} className="text-amber-600" /> Próximas Atividades
                </h3>
                
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-2">
                    {upcoming.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs font-mono">
                            <CheckCircle2 size={24} className="mb-2 opacity-50"/>
                            <p>Tudo em dia!</p>
                        </div>
                    ) : (
                        upcoming.map(item => (
                            <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 relative group hover:border-amber-500/30 transition-colors">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${item.status === 'ATRASADO' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                <div className="pl-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(item.scheduledDate).toLocaleDateString()}</span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${item.status === 'ATRASADO' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'}`}>{item.status}</span>
                                    </div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.target}</p>
                                    <p className="text-xs text-slate-500 truncate">{item.sedeId} - {item.method || 'A Definir'}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                <button 
                    onClick={() => navigate('/module/pestcontrol/execution')}
                    className="mt-4 w-full py-3 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
                >
                    Ver Cronograma Completo
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
