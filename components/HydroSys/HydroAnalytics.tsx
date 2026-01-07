
import React, { useEffect, useState } from 'react';
import { 
  PieChart, AlertTriangle, CheckCircle2, Droplets, Activity,
  Calendar, ArrowRight, ShieldCheck, Zap, TrendingUp, AlertCircle
} from 'lucide-react';
import { User, HydroCertificado, HydroFiltro, HydroPoco } from '../../types';
import { hydroService } from '../../services/hydroService';
import { EmptyState } from '../Shared/EmptyState';
import { useNavigate } from 'react-router-dom';

// --- SIMPLE PROGRESS BAR COMPONENT ---
const ProgressBar = ({ value, colorClass }: { value: number, colorClass: string }) => (
    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
            className={`h-full ${colorClass} transition-all duration-1000 ease-out`} 
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
    </div>
);

// --- KPI CARD COMPONENT ---
const StatCard = ({ title, value, subtitle, icon: Icon, type = 'neutral' }: any) => {
    let colors = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white";
    let iconColors = "bg-slate-100 dark:bg-slate-800 text-slate-500";

    if (type === 'success') {
        iconColors = "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400";
    } else if (type === 'warning') {
        iconColors = "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400";
    } else if (type === 'danger') {
        iconColors = "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
    } else if (type === 'info') {
        iconColors = "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400";
    }

    return (
        <div className={`p-6 rounded-2xl border shadow-sm ${colors}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${iconColors}`}>
                    <Icon size={24} />
                </div>
                {type === 'success' && <div className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase rounded-lg">Bom</div>}
                {type === 'warning' && <div className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase rounded-lg">Atenção</div>}
                {type === 'danger' && <div className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold uppercase rounded-lg">Crítico</div>}
            </div>
            <h3 className="text-3xl font-black tracking-tight">{value}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
    );
};

export const HydroSysAnalytics: React.FC<{ user: User }> = ({ user }) => {
    const navigate = useNavigate();
    
    const [certificados, setCertificados] = useState<HydroCertificado[]>([]);
    const [filtros, setFiltros] = useState<HydroFiltro[]>([]);
    const [pocos, setPocos] = useState<HydroPoco[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const [c, f, p] = await Promise.all([
                hydroService.getCertificados(user),
                hydroService.getFiltros(user),
                hydroService.getPocos(user)
            ]);
            setCertificados(c);
            setFiltros(f);
            setPocos(p);
            setLoading(false);
        };
        load();
    }, [user]);

    // --- CALCULATIONS ---
    const totalAssets = certificados.length + filtros.length + pocos.length;
    const today = new Date();
    
    // Critical Items Logic
    const criticalItems: Array<{id: string, name: string, local: string, type: string, days: number, route: string}> = [];

    certificados.forEach(c => {
        const diff = Math.ceil((new Date(c.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff <= 30) criticalItems.push({ id: c.id, name: `Certificado ${c.parceiro}`, local: c.sedeId, type: 'Certificado', days: diff, route: '/module/hydrosys/certificados' });
    });

    filtros.forEach(f => {
        if (f.proximaTroca) {
            const diff = Math.ceil((new Date(f.proximaTroca).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diff <= 15) criticalItems.push({ id: f.id, name: `Filtro ${f.patrimonio}`, local: `${f.sedeId} - ${f.local}`, type: 'Filtro', days: diff, route: '/module/hydrosys/filtros' });
        }
    });

    pocos.forEach(p => {
        if (p.proximaLimpeza) {
             const diff = Math.ceil((new Date(p.proximaLimpeza).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
             if (diff <= 30) criticalItems.push({ id: p.id, name: `Limpeza Reservatório`, local: `${p.sedeId} - ${p.local}`, type: 'Limpeza', days: diff, route: '/module/hydrosys/reservatorios' });
        }
    });

    criticalItems.sort((a, b) => a.days - b.days);
    
    const expiredCount = criticalItems.filter(i => i.days < 0).length;
    const warningCount = criticalItems.filter(i => i.days >= 0).length;
    
    // Calculate Health Score (Weighted)
    // Expired item = -10 points, Warning item = -2 points
    const penalty = (expiredCount * 10) + (warningCount * 2);
    const healthScore = Math.max(0, 100 - (totalAssets > 0 ? (penalty / totalAssets) * 20 : 0)); // Simplified algo
    const displayScore = Math.round(healthScore);

    // Color logic for Score
    let scoreColor = "text-emerald-500";
    let scoreBarColor = "bg-emerald-500";
    if (displayScore < 80) { scoreColor = "text-amber-500"; scoreBarColor = "bg-amber-500"; }
    if (displayScore < 50) { scoreColor = "text-red-500"; scoreBarColor = "bg-red-500"; }

    if (loading) {
        return (
             <div className="p-12 text-center flex flex-col items-center">
                 <div className="animate-spin w-10 h-10 border-4 border-slate-200 border-t-brand-600 rounded-full mb-4"></div>
                 <p className="text-slate-500 font-medium">Carregando dados...</p>
             </div>
        );
    }
    
    if (totalAssets === 0) {
        return (
             <div className="p-8">
                 <EmptyState 
                    icon={PieChart} 
                    title="Sem Dados Suficientes" 
                    description="O sistema precisa de cadastros (Certificados, Filtros ou Reservatórios) para gerar análises."
                 />
             </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in pb-10">
            
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <Activity className="text-brand-600 dark:text-brand-400" />
                    Analytics & Conformidade
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Visão geral da saúde do sistema HydroSys.
                </p>
            </div>

            {/* KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Índice de Saúde" 
                    value={`${displayScore}%`} 
                    icon={ShieldCheck} 
                    type={displayScore >= 80 ? 'success' : displayScore >= 50 ? 'warning' : 'danger'}
                />
                <StatCard 
                    title="Itens Vencidos" 
                    value={expiredCount} 
                    icon={AlertCircle} 
                    type={expiredCount === 0 ? 'success' : 'danger'}
                    subtitle="Ação imediata necessária"
                />
                <StatCard 
                    title="Alertas Próximos" 
                    value={warningCount} 
                    icon={AlertTriangle} 
                    type={warningCount === 0 ? 'success' : 'warning'}
                    subtitle="Vencem em breve"
                />
                <StatCard 
                    title="Total Monitorado" 
                    value={totalAssets} 
                    icon={Droplets} 
                    type="info"
                    subtitle="Ativos cadastrados"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: Health & Categories */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Health Score Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <TrendingUp size={20} className="text-slate-400" /> Performance
                        </h3>
                        
                        <div className="flex flex-col items-center justify-center py-6">
                            <div className={`text-6xl font-black ${scoreColor} mb-2`}>
                                {displayScore}
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pontuação Geral</p>
                        </div>

                        <div className="space-y-4 mt-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-600 dark:text-slate-300">Conformidade</span>
                                    <span className={scoreColor}>{displayScore}%</span>
                                </div>
                                <ProgressBar value={displayScore} colorClass={scoreBarColor} />
                            </div>
                        </div>
                    </div>

                    {/* Breakdown by Type */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Distribuição de Ativos</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><ShieldCheck size={16}/></div>
                                    <span className="font-medium text-slate-700 dark:text-slate-200">Certificados</span>
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">{certificados.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 rounded-lg"><Zap size={16}/></div>
                                    <span className="font-medium text-slate-700 dark:text-slate-200">Filtros</span>
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">{filtros.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><Droplets size={16}/></div>
                                    <span className="font-medium text-slate-700 dark:text-slate-200">Reservatórios</span>
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">{pocos.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Critical Alerts List */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle className="text-amber-500" />
                            Painel de Alertas
                        </h3>
                        <span className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">
                            {criticalItems.length} Pendências
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[500px] p-0">
                        {criticalItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <CheckCircle2 size={48} className="text-emerald-500 mb-4 opacity-50" />
                                <p className="font-medium">Nenhuma pendência encontrada.</p>
                                <p className="text-sm">O sistema está em conformidade.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4">Item / Ativo</th>
                                        <th className="px-6 py-4">Localização</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {criticalItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                                                <div className="text-xs text-slate-500">{item.type}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                {item.local}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.days < 0 ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                        Vencido ({Math.abs(item.days)}d)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                        Vence em {item.days}d
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => navigate(item.route)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                                >
                                                    <ArrowRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
