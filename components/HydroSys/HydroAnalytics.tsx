import React, { useEffect, useState } from 'react';
import {
  PieChart, AlertTriangle, Droplets, Loader2,
  ShieldCheck, TrendingUp, AlertCircle, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, HydroCertificado, HydroFiltro, HydroReservatorio } from '../../types';
import { hydroService } from '../../services/hydroService';
import { notificationService } from '../../services/notificationService';
import { EmptyState } from '../Shared/EmptyState';
import { diffDaysFromToday, formatDateBR } from '../../utils/dateUtils';

const ProgressBar = ({ value, colorClass }: { value: number, colorClass: string }) => (
    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} transition-all duration-1000 ease-out`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
);

const StatCard = ({ title, value, subtitle, icon: Icon, type = 'neutral' }: any) => {
    let colors = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white";
    let iconColors = "bg-slate-100 dark:bg-slate-800 text-slate-500";
    if (type === 'success') iconColors = "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400";
    else if (type === 'warning') iconColors = "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400";
    else if (type === 'danger') iconColors = "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
    else if (type === 'info') iconColors = "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400";

    return (
        <div className={`p-6 rounded-2xl border shadow-sm ${colors}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${iconColors}`}><Icon size={24} /></div>
                {type !== 'neutral' && <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${type === 'success' ? 'bg-emerald-100 text-emerald-700' : type === 'warning' ? 'bg-amber-100 text-amber-700' : type === 'danger' ? 'bg-red-100 text-red-700' : 'bg-cyan-100 text-cyan-700'}`}>{type}</div>}
            </div>
            <h3 className="text-3xl font-black tracking-tight font-mono">{value}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono font-bold uppercase mt-1">{title}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
    );
};

export const HydroSysAnalytics: React.FC<{ user: User }> = ({ user }) => {
    const navigate = useNavigate();
    const [certificados, setCertificados] = useState<HydroCertificado[]>([]);
    const [filtros, setFiltros] = useState<HydroFiltro[]>([]);
    const [reservatorios, setReservatorios] = useState<HydroReservatorio[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        const load = async () => {
            setLoading(true);
            const [c, f, pocos, cisternas, caixas] = await Promise.all([
                hydroService.getCertificados(user),
                hydroService.getFiltros(user),
                hydroService.getPocos(user),
                hydroService.getCisternas(user),
                hydroService.getCaixas(user)
            ]);

            const uniqueCerts = Array.from(c.reduce((map, item) => {
                const key = `${item.sedeId}-${item.parceiro}`;
                const existing = map.get(key);
                if (!existing || new Date(item.validade) > new Date(existing.validade)) map.set(key, item);
                return map;
            }, new Map<string, HydroCertificado>()).values());

            const uniqueFiltros = Array.from(f.reduce((map, item) => {
                const key = `${item.sedeId}-${item.patrimonio}`;
                const existing = map.get(key);
                if (!existing || new Date(item.dataTroca) > new Date(existing.dataTroca)) map.set(key, item);
                return map;
            }, new Map<string, HydroFiltro>()).values());

            if (!isActive) return;

            setCertificados(uniqueCerts);
            setFiltros(uniqueFiltros);
            setReservatorios([...pocos, ...cisternas, ...caixas]);
            setLoading(false);
        };

        void load();
        const unsubscribeRefresh = notificationService.onRefresh(() => {
            void load();
        });
        const pollingId = window.setInterval(() => {
            void load();
        }, 60000);

        return () => {
            isActive = false;
            unsubscribeRefresh();
            window.clearInterval(pollingId);
        };
    }, [user]);

    const totalAssets = certificados.length + filtros.length + reservatorios.length;

    const criticalItems: Array<{
        id: string;
        kind: 'CERTIFICADO' | 'FILTRO' | 'RESERVATORIO';
        label: string;
        sedeId: string;
        local: string;
        dueDate: string;
        days: number;
        modulePath: string;
    }> = [];

    certificados.forEach(c => {
        const diff = diffDaysFromToday(c.validade);
        if (diff <= 30) {
            criticalItems.push({
                id: c.id,
                kind: 'CERTIFICADO',
                label: 'Certificado',
                sedeId: c.sedeId,
                local: c.parceiro,
                dueDate: c.validade,
                days: diff,
                modulePath: '/module/hydrosys/certificados'
            });
        }
    });

    filtros.forEach(f => {
        const diff = diffDaysFromToday(f.proximaTroca);
        if (diff <= 15) {
            criticalItems.push({
                id: f.id,
                kind: 'FILTRO',
                label: 'Filtro',
                sedeId: f.sedeId,
                local: `${f.local} (${f.patrimonio})`,
                dueDate: f.proximaTroca,
                days: diff,
                modulePath: '/module/hydrosys/filtros'
            });
        }
    });

    reservatorios.forEach(r => {
        const diff = diffDaysFromToday(r.proximaLimpeza);
        if (diff <= 30) {
            const tipoLabel = r.tipo === 'POCO' ? 'Po?o' : r.tipo === 'CISTERNA' ? 'Cisterna' : "Caixa d'Agua";
            criticalItems.push({
                id: r.id,
                kind: 'RESERVATORIO',
                label: tipoLabel,
                sedeId: r.sedeId,
                local: r.local,
                dueDate: r.proximaLimpeza,
                days: diff,
                modulePath: '/module/hydrosys/reservatorios'
            });
        }
    });

    criticalItems.sort((a, b) => a.days - b.days);

    const expiredCount = criticalItems.filter(i => i.days < 0).length;
    const warningCount = criticalItems.filter(i => i.days >= 0).length;
    const healthScore = Math.round(Math.max(0, 100 - (totalAssets > 0 ? ((expiredCount * 10 + warningCount * 2) / totalAssets) * 20 : 0)));
    const scoreColor = healthScore < 50 ? 'text-red-500' : healthScore < 80 ? 'text-amber-500' : 'text-emerald-500';
    const barColor = healthScore < 50 ? 'bg-red-500' : healthScore < 80 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0A0A0C]">
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
                <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] text-slate-400 dark:text-cyan-500" style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
            </div>

            <div className="relative z-10 px-4 md:px-8 py-6 space-y-6 pb-24 md:pb-8 max-w-7xl mx-auto">
                <header className="relative overflow-hidden border border-slate-200 dark:border-white/5 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-sm rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                    <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-4 w-full md:w-auto">
                            <button onClick={() => navigate('/module/hydrosys')} className="group flex items-center gap-2 text-slate-500 dark:text-white/40 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all text-xs font-mono uppercase tracking-widest">
                                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel
                            </button>
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 border-2 border-cyan-500/20 dark:border-cyan-500/50 flex items-center justify-center bg-cyan-50 dark:bg-cyan-500/5 rounded-xl">
                                    <PieChart size={28} className="text-cyan-600 dark:text-cyan-500" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">ANALYTICS</h1>
                                    <p className="text-slate-500 dark:text-white/30 text-xs md:text-sm font-mono mt-0.5">Indicadores de Conformidade.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#111114]/80 rounded-3xl p-10 flex items-center justify-center gap-3 text-slate-500 dark:text-slate-300">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-xs font-mono uppercase tracking-widest">Atualizando indicadores...</span>
                    </div>
                ) : totalAssets === 0 ? (
                    <EmptyState icon={PieChart} title="Sem Dados" description="Necess?rio cadastrar ativos." />
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                            <StatCard title="?ndice de Sa?de" value={`${healthScore}%`} icon={ShieldCheck} type={healthScore >= 80 ? 'success' : healthScore >= 50 ? 'warning' : 'danger'} />
                            <StatCard title="Itens Vencidos" value={expiredCount} icon={AlertCircle} type={expiredCount === 0 ? 'success' : 'danger'} subtitle="a??o imediata" />
                            <StatCard title="Alertas Pr?ximos" value={warningCount} icon={AlertTriangle} type={warningCount === 0 ? 'success' : 'warning'} subtitle="Vencem em breve" />
                            <StatCard title="Total Monitorado" value={totalAssets} icon={Droplets} type="info" subtitle="Ativos ativos" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
                            <div className="lg:col-span-1 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 font-mono uppercase"><TrendingUp size={20} className="text-slate-400" /> Performance</h3>
                                <div className="flex flex-col items-center justify-center py-6">
                                    <div className={`text-6xl font-black ${scoreColor} mb-2 font-mono`}>{healthScore}</div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pontua??o Geral</p>
                                </div>
                                <div className="mt-4"><ProgressBar value={healthScore} colorClass={barColor} /></div>
                            </div>

                            <div className="lg:col-span-2 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-black/20 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 font-mono uppercase"><AlertTriangle className="text-amber-500" /> Pend?ncias ({criticalItems.length})</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto max-h-[400px]">
                                    {criticalItems.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400"><p className="font-medium">Sistema em conformidade.</p></div>
                                    ) : (
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-4">Sede</th>
                                                    <th className="px-4 py-4">Local/Item</th>
                                                    <th className="px-4 py-4">Tipo</th>
                                                    <th className="px-4 py-4">Vencimento</th>
                                                    <th className="px-4 py-4 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {criticalItems.map((item, idx) => (
                                                    <tr
                                                        key={`${item.kind}-${item.id}-${idx}`}
                                                        onClick={() => navigate(item.modulePath)}
                                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                                                    >
                                                        <td className="px-4 py-4 text-xs font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">{item.sedeId}</td>
                                                        <td className="px-4 py-4 font-bold text-slate-900 dark:text-white">{item.local}</td>
                                                        <td className="px-4 py-4 text-slate-500 text-xs uppercase">{item.label}</td>
                                                        <td className="px-4 py-4 text-slate-500 text-xs">{formatDateBR(item.dueDate)}</td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase ${item.days < 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                {item.days < 0 ? `Vencido (${Math.abs(item.days)}d)` : `Vence em ${item.days}d`}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
