import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart, BarChart3, Building2, CheckCircle2, AlertTriangle, Bug } from 'lucide-react';
import { EmptyState } from '../Shared/EmptyState';
import { User, PestControlEntry, UserRole } from '../../types';
import { pestService } from '../../services/pestService';

// Add comment above each fix.
// Fixed: Explicitly typed as React.FC to handle 'key' and other React-specific props correctly in map()
const SimpleBar: React.FC<{ label: string, count: number, total: number, color: string }> = ({ label, count, total, color }) => {
    const percent = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs font-mono font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">{label}</span>
                <span className="text-slate-500">{count} ({Math.round(percent)}%)</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
};

export const PestControlAnalytics: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<PestControlEntry[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
      const load = async () => {
          const data = await pestService.getAll(user);
          setEntries(data);
          calculateStats(data);
      };
      load();
  }, [user]);

  const calculateStats = (data: PestControlEntry[]) => {
      const total = data.length;
      if (total === 0) return;

      const realizado = data.filter(e => e.status === 'REALIZADO').length;
      const pendente = data.filter(e => e.status === 'PENDENTE').length;
      const atrasado = data.filter(e => e.status === 'ATRASADO').length;

      // Group by Target
      const byTarget: Record<string, number> = {};
      data.forEach(e => { byTarget[e.target] = (byTarget[e.target] || 0) + 1; });
      
      // Group by Sede (Top 5 w/ issues)
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
       </div>

       <div className="max-w-6xl mx-auto space-y-8">
           <div className="flex items-center justify-between">
                <div>
                    <button onClick={() => navigate('/module/pestcontrol')} className="flex items-center text-slate-500 hover:text-amber-600 transition-colors text-xs font-mono uppercase tracking-widest mb-2">
                            <ArrowLeft size={16} className="mr-2" /> Voltar
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-3">
                        <PieChart className="text-purple-600" /> INDICADORES
                    </h1>
                </div>
                <div className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-sm">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Conformidade Global</p>
                    <p className={`text-2xl font-black ${stats.compliance >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{stats.compliance}%</p>
                </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Summary Cards */}
               <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                   <div className="flex items-center gap-3 mb-4">
                       <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-lg"><CheckCircle2 size={20}/></div>
                       <div>
                           <p className="text-xs font-bold text-slate-400 uppercase">Realizados</p>
                           <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.realizado}</p>
                       </div>
                   </div>
                   <div className="flex items-center gap-3 mb-4">
                       <div className="p-2 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-lg"><BarChart3 size={20}/></div>
                       <div>
                           <p className="text-xs font-bold text-slate-400 uppercase">Pendentes</p>
                           <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.pendente}</p>
                       </div>
                   </div>
                   <div className="flex items-center gap-3">
                       <div className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg"><AlertTriangle size={20}/></div>
                       <div>
                           <p className="text-xs font-bold text-slate-400 uppercase">Atrasados</p>
                           <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.atrasado}</p>
                       </div>
                   </div>
               </div>

               {/* Pest Breakdown */}
               <div className="md:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                   <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 font-mono uppercase text-sm">
                       <Bug size={16} className="text-amber-500"/> Distribuição por Praga
                   </h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                       {Object.entries(stats.byTarget).map(([key, val]: any) => (
                           <SimpleBar key={key} label={key} count={val} total={stats.total} color="bg-amber-500" />
                       ))}
                   </div>
               </div>
           </div>

           {/* Sede Breakdown (Admin only ideally, but useful for overview) */}
           {user.role !== UserRole.OPERATIONAL && (
               <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                   <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 font-mono uppercase text-sm">
                       <Building2 size={16} className="text-purple-500"/> Unidades com Pendências
                   </h3>
                   {Object.keys(stats.bySede).length === 0 ? (
                       <p className="text-center text-slate-400 py-8 font-mono text-sm">Nenhuma unidade com atrasos críticos.</p>
                   ) : (
                       <div className="flex flex-wrap gap-4">
                           {Object.entries(stats.bySede).map(([key, val]: any) => (
                               <div key={key} className="flex-1 min-w-[150px] p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                   <p className="font-bold text-slate-800 dark:text-white uppercase text-lg">{key}</p>
                                   <p className="text-xs text-slate-500 uppercase font-bold mt-1">{val} Atrasos</p>
                               </div>
                           ))}
                       </div>
                   )}
               </div>
           )}
       </div>
    </div>
  );
};
