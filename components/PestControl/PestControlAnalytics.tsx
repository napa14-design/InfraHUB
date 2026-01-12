
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart, Building2, CheckCircle2, AlertTriangle, Bug, TrendingUp, Calendar, AlertOctagon } from 'lucide-react';
import { EmptyState } from '../Shared/EmptyState';
import { User, PestControlEntry, UserRole } from '../../types';
import { pestService } from '../../services/pestService';

// SVG Donut Chart Component
const DonutChart = ({ percent, color, size = 120, stroke = 12, label }: { percent: number, color: string, size?: number, stroke?: number, label?: string }) => {
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percent / 100) * circumference;
    
    // Color mapping
    const getColor = (c: string) => {
        if(c === 'emerald') return '#10b981';
        if(c === 'amber') return '#f59e0b';
        if(c === 'red') return '#ef4444';
        if(c === 'blue') return '#3b82f6';
        if(c === 'purple') return '#8b5cf6';
        return '#cbd5e1';
    };

    return (
        <div className="relative flex flex-col items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={stroke}
                    fill="transparent"
                    className="text-slate-100 dark:text-slate-800"
                />
                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={getColor(color)}
                    strokeWidth={stroke}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800 dark:text-white">{percent}%</span>
                {label && <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>}
            </div>
        </div>
    );
};

const StatWidget = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white dark:bg-[#16161a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{value}</h3>
            {subtext && <p className="text-[10px] font-mono text-slate-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-4 rounded-2xl bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 group-hover:scale-110 transition-transform`}>
            <Icon size={24} />
        </div>
    </div>
);

interface ProgressBarProps {
    label: string;
    count: number;
    total: number;
    color: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, count, total, color }) => {
    const percent = total > 0 ? (count / total) * 100 : 0;
    
    const getColorClass = (c: string) => {
        if(c === 'amber') return 'bg-amber-500';
        if(c === 'purple') return 'bg-purple-500';
        if(c === 'blue') return 'bg-blue-500';
        return 'bg-slate-500';
    };

    return (
        <div className="group">
            <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</span>
                <span className="text-[10px] font-mono font-bold text-slate-400">{count} ({Math.round(percent)}%)</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${getColorClass(color)} transition-all duration-1000 ease-out relative group-hover:opacity-80`} style={{ width: `${percent}%` }}>
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                </div>
            </div>
        </div>
    );
};

export const PestControlAnalytics: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
      const load = async () => {
          const data = await pestService.getAll(user);
          calculateStats(data);
      };
      load();
  }, [user]);

  const calculateStats = (data: PestControlEntry[]) => {
      const total = data.length;
      if (total === 0) { setStats(null); return; }

      const realizado = data.filter(e => e.status === 'REALIZADO').length;
      const pendente = data.filter(e => e.status === 'PENDENTE').length;
      const atrasado = data.filter(e => e.status === 'ATRASADO').length;

      const byTarget: Record<string, number> = {};
      data.forEach(e => { byTarget[e.target] = (byTarget[e.target] || 0) + 1; });
      
      const bySede: Record<string, number> = {};
      data.filter(e => e.status === 'ATRASADO').forEach(e => { bySede[e.sedeId] = (bySede[e.sedeId] || 0) + 1; });

      setStats({
          total,
          realizado,
          pendente,
          atrasado,
          byTarget,
          bySede,
          compliance: Math.round((realizado / total) * 100)
      });
  };

  if (!stats) {
      return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-[#0A0A0C] p-8">
            <button onClick={() => navigate('/module/pestcontrol')} className="flex items-center text-slate-500 hover:text-amber-600 transition-colors text-xs font-mono uppercase tracking-widest mb-8">
                    <ArrowLeft size={16} className="mr-2" /> Voltar
            </button>
            <div className="max-w-4xl mx-auto">
                <EmptyState icon={PieChart} title="Sem Dados" description="Nenhum registro encontrado para análise." />
            </div>
        </div>
      );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0A0A0C] p-4 md:p-8">
       {/* Background */}
       <div className="fixed inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-purple-500/5 to-transparent" />
       </div>

       <div className="max-w-7xl mx-auto space-y-8 pb-20">
           <div className="flex items-center justify-between">
                <div>
                    <button onClick={() => navigate('/module/pestcontrol')} className="flex items-center text-slate-500 hover:text-purple-600 transition-colors text-xs font-mono uppercase tracking-widest mb-3">
                            <ArrowLeft size={16} className="mr-2" /> Voltar ao Menu
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tighter flex items-center gap-3">
                        DASHBOARD <span className="text-purple-600">ANALYTICS</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Inteligência de Dados e Conformidade.</p>
                </div>
                <div className="hidden md:block">
                    <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                        <Calendar size={14} /> <span>Ano Corrente</span>
                    </div>
                </div>
           </div>
           
           {/* KPI ROW */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatWidget title="Total Realizado" value={stats.realizado} icon={CheckCircle2} color="emerald" subtext={`${stats.compliance}% de conclusão`} />
                <StatWidget title="Aguardando" value={stats.pendente} icon={AlertOctagon} color="amber" subtext="Dentro do prazo" />
                <StatWidget title="Atrasos Críticos" value={stats.atrasado} icon={AlertTriangle} color="red" subtext="Requer atenção imediata" />
           </div>

           {/* BENTO GRID */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               
               {/* 1. COMPLIANCE CARD (Large) */}
               <div className="bg-white dark:bg-[#16161a] p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                   <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                       <TrendingUp size={18} className="text-emerald-500"/> Índice de Eficiência
                   </h3>
                   <DonutChart percent={stats.compliance} color={stats.compliance >= 80 ? 'emerald' : stats.compliance >= 50 ? 'amber' : 'red'} size={200} stroke={18} label="Execução" />
                   <p className="text-xs text-slate-400 mt-8 max-w-[200px] leading-relaxed">
                       Porcentagem de serviços concluídos em relação ao total planejado.
                   </p>
               </div>

               {/* 2. TYPE DISTRIBUTION (Tall) */}
               <div className="lg:col-span-2 bg-white dark:bg-[#16161a] p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                   <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <Bug size={18} className="text-purple-500"/> Ocorrências por Tipo
                        </h3>
                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">TOP 5</span>
                   </div>
                   
                   <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-6">
                            {Object.entries(stats.byTarget).slice(0, 5).map(([key, val]: any, idx) => (
                                <ProgressBar 
                                    key={key} 
                                    label={key} 
                                    count={val} 
                                    total={stats.total} 
                                    color={idx % 2 === 0 ? 'purple' : 'blue'} 
                                />
                            ))}
                        </div>
                        {/* Summary Box inside Card */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 h-full flex flex-col justify-center items-center text-center">
                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                                <Bug size={32} />
                            </div>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                {Object.keys(stats.byTarget).length} Tipos Monitorados
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                                A diversidade de pragas exige métodos de controle específicos para cada categoria.
                            </p>
                        </div>
                   </div>
               </div>

               {/* 3. CRITICAL AREAS (Bottom Row) */}
               {user.role !== UserRole.OPERATIONAL && Object.keys(stats.bySede).length > 0 && (
                   <div className="lg:col-span-3 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-6 rounded-3xl flex flex-col md:flex-row gap-6 items-center">
                       <div className="flex-shrink-0 p-4 bg-red-100 dark:bg-red-900/20 rounded-2xl text-red-600">
                           <AlertTriangle size={32} />
                       </div>
                       <div className="flex-1">
                           <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase mb-1">Pontos de Atenção</h3>
                           <p className="text-sm text-slate-500 dark:text-slate-400">Unidades com maior volume de atrasos operacionais.</p>
                       </div>
                       <div className="flex flex-wrap gap-3 justify-center md:justify-end">
                           {Object.entries(stats.bySede).map(([key, val]: any) => (
                               <div key={key} className="px-4 py-2 bg-white dark:bg-slate-950 border border-red-200 dark:border-red-900/50 rounded-xl shadow-sm flex items-center gap-3">
                                   <Building2 size={16} className="text-red-400"/>
                                   <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{key}</span>
                                   <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-black px-2 py-0.5 rounded">{val}</span>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};
