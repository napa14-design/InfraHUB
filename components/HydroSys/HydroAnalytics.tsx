import React, { useEffect, useState } from 'react';
import { 
  PieChart, BarChart3, AlertTriangle, CheckCircle2, Droplets, Filter, 
  ArrowUpRight, Building2, TrendingUp, Calendar, ArrowRight, Activity,
  AlertCircle
} from 'lucide-react';
import { User, UserRole, HydroCertificado, HydroFiltro, HydroPoco } from '../../types';
import { hydroService } from '../../services/hydroService';
import { EmptyState } from '../Shared/EmptyState';
import { useNavigate } from 'react-router-dom';

// --- SVG CHARTS COMPONENTS ---

const SimpleDonut = ({ data, size = 160, stroke = 20 }: any) => {
    const center = size / 2;
    const radius = center - stroke;
    const circumference = 2 * Math.PI * radius;
    
    let angleOffset = -90;
    const total = data.reduce((acc: number, item: any) => acc + item.value, 0);

    return (
        <div className="relative flex items-center justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                {data.map((item: any, index: number) => {
                    const percentage = total === 0 ? 0 : item.value / total;
                    const dashArray = percentage * circumference;
                    const gap = circumference - dashArray;
                    
                    // Calculando offset acumulativo
                    const currentOffset = circumference - (data.slice(0, index).reduce((acc: number, cur: any) => acc + (cur.value/total) * circumference, 0));

                    return (
                        <circle
                            key={index}
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth={stroke}
                            strokeDasharray={`${dashArray} ${gap}`}
                            strokeDashoffset={circumference - currentOffset} // Fixed offset logic for SVG
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                            style={{ 
                                strokeDashoffset: circumference - (dashArray), 
                                transform: `rotate(${data.slice(0, index).reduce((acc: number, cur: any) => acc + (cur.value/total) * 360, 0)}deg)`, 
                                transformOrigin: 'center' 
                            }}
                        />
                    );
                })}
                {/* Background Circle if empty */}
                {total === 0 && (
                    <circle cx={center} cy={center} r={radius} fill="transparent" stroke="#e2e8f0" strokeWidth={stroke} />
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 dark:text-slate-200">
                <span className="text-3xl font-black">{total}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
            </div>
        </div>
    );
};

const SimpleBarChart = ({ data, height = 150 }: any) => {
    const max = Math.max(...data.map((d: any) => d.value));
    
    return (
        <div className="flex items-end justify-between gap-2 w-full" style={{ height }}>
            {data.map((item: any, idx: number) => {
                const h = max === 0 ? 0 : (item.value / max) * 100;
                return (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
                        <div className="relative w-full flex justify-center items-end h-full">
                            <div 
                                className={`w-full max-w-[24px] rounded-t-lg transition-all duration-500 ${item.color} opacity-80 group-hover:opacity-100`}
                                style={{ height: `${h}%` }}
                            >
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                                    {item.value} itens
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase truncate w-full text-center" title={item.label}>
                            {item.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// --- KPI CARD ---

const StatCard = ({ title, value, subtext, icon: Icon, trend, trendUp }: any) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/20 group-hover:text-cyan-600 transition-colors">
                <Icon size={24} />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                    {trendUp ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                    {trend}
                </div>
            )}
        </div>
        <div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{value}</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
        </div>
    </div>
);

export const HydroSysAnalytics: React.FC<{ user: User }> = ({ user }) => {
    const navigate = useNavigate();
    
    // Replace useMemo with state to handle async loading
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

    // 2. Calculations
    const totalAssets = certificados.length + filtros.length + pocos.length;
    
    if (loading) {
        return (
             <div className="p-8 animate-in fade-in">
                 <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white"><PieChart className="text-cyan-600"/> Analytics</h1>
                 <p>Carregando dados analíticos...</p>
             </div>
        );
    }
    
    if (totalAssets === 0) {
        return (
             <div className="p-8 animate-in fade-in">
                 <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white"><PieChart className="text-cyan-600"/> Analytics</h1>
                 <EmptyState 
                    icon={PieChart} 
                    title="Dados Insuficientes" 
                    description="Não há registros suficientes no sistema para gerar insights analíticos no momento."
                 />
             </div>
        );
    }

    // --- LOGIC ---
    const today = new Date();

    // Critical Items Logic
    const criticalItems: Array<{id: string, name: string, local: string, type: string, days: number, route: string}> = [];

    // Certificados Vencidos/Críticos
    certificados.forEach(c => {
        const diff = Math.ceil((new Date(c.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff <= 30) {
            criticalItems.push({
                id: c.id,
                name: `Certificado ${c.parceiro}`,
                local: c.sedeId,
                type: 'Certificado',
                days: diff,
                route: '/module/hydrosys/certificados'
            });
        }
    });

    // Filtros Vencidos/Críticos
    filtros.forEach(f => {
        if (f.proximaTroca) {
            const diff = Math.ceil((new Date(f.proximaTroca).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diff <= 15) {
                criticalItems.push({
                    id: f.id,
                    name: `Filtro ${f.patrimonio}`,
                    local: `${f.sedeId} - ${f.local}`,
                    type: 'Filtro',
                    days: diff,
                    route: '/module/hydrosys/filtros'
                });
            }
        }
    });

    // Poços Vencidos/Críticos (Limpeza)
    pocos.forEach(p => {
        if (p.proximaLimpeza) { // Updated property name
             const diff = Math.ceil((new Date(p.proximaLimpeza).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
             if (diff <= 30) {
                criticalItems.push({
                    id: p.id,
                    name: `Limpeza Poço`,
                    local: `${p.sedeId} - ${p.local}`,
                    type: 'Reservatório',
                    days: diff,
                    route: '/module/hydrosys/reservatorios'
                });
             }
        }
    });

    // Sort by Urgency
    criticalItems.sort((a, b) => a.days - b.days);
    const topCritical = criticalItems.slice(0, 5);

    // Compliance Rate
    const totalCriticalCount = criticalItems.filter(i => i.days < 0).length; // Vencidos de fato
    const complianceRate = Math.round(((totalAssets - totalCriticalCount) / totalAssets) * 100);

    // Data for Donut (Global Status)
    const donutData = [
        { label: 'Vigente', value: totalAssets - criticalItems.length, color: '#10b981' }, // emerald-500
        { label: 'Atenção', value: criticalItems.filter(i => i.days >= 0).length, color: '#f59e0b' }, // amber-500
        { label: 'Crítico', value: criticalItems.filter(i => i.days < 0).length, color: '#ef4444' }, // red-500
    ];

    // Data for Bar Chart (Top 6 Sedes Volume)
    const distributionBySede: Record<string, number> = {};
    [...certificados, ...filtros, ...pocos].forEach(item => {
        const sede = item.sedeId || 'N/A';
        distributionBySede[sede] = (distributionBySede[sede] || 0) + 1;
    });
    
    const barData = Object.entries(distributionBySede)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .map(([label, value]) => ({
            label,
            value,
            color: 'bg-cyan-500'
        }));

    return (
        <div className="space-y-8 animate-in fade-in pb-20 md:pb-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Activity className="text-cyan-600" />
                        Visão Geral HydroSys
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Monitoramento de conformidade e ativos em tempo real.</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <Calendar size={16} className="text-slate-400"/>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Conformidade" 
                    value={`${complianceRate}%`} 
                    icon={CheckCircle2} 
                    trend="Estável" 
                    trendUp={complianceRate >= 90}
                />
                <StatCard 
                    title="Ativos Totais" 
                    value={totalAssets} 
                    icon={Building2} 
                    subtext="Cadastrados no sistema"
                />
                <StatCard 
                    title="Ações Pendentes" 
                    value={criticalItems.length} 
                    icon={AlertTriangle} 
                    subtext="Itens vencidos ou a vencer"
                />
                <StatCard 
                    title="Sedes Ativas" 
                    value={Object.keys(distributionBySede).length} 
                    icon={Droplets} 
                    subtext="Com monitoramento"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Visuals */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Donut: Health */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 w-full text-left">Saúde do Sistema</h3>
                            <SimpleDonut data={donutData} />
                            <div className="flex justify-center gap-4 mt-6 w-full">
                                {donutData.map((d: any) => (
                                    <div key={d.label} className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{d.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bars: Volume */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Volume por Sede</h3>
                            <div className="flex-1 flex items-end">
                                <SimpleBarChart data={barData} />
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Stats */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">Resumo Operacional</h3>
                                <p className="text-slate-400 text-sm mb-6">Distribuição atual dos ativos monitorados.</p>
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-3xl font-black text-cyan-400">{filtros.length}</p>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Filtros</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-purple-400">{certificados.length}</p>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Certificados</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-emerald-400">{pocos.length}</p>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Reservatórios</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-full md:w-auto min-w-[200px]">
                                <div className="flex items-center gap-3 mb-3">
                                    <AlertCircle className="text-amber-400" />
                                    <span className="font-bold">Atenção</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Você tem <span className="font-bold text-white">{criticalItems.length} itens</span> que requerem manutenção ou renovação nos próximos 30 dias.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Action List */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden h-[600px] lg:h-auto">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-500" />
                            Prioridade Alta
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Itens mais urgentes para resolução.</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {topCritical.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                                <CheckCircle2 size={40} className="text-emerald-200 dark:text-emerald-900/50 mb-4"/>
                                <p className="font-medium text-sm text-slate-600 dark:text-slate-300">Tudo em ordem!</p>
                                <p className="text-xs mt-1">Nenhum item crítico pendente.</p>
                            </div>
                        ) : (
                            topCritical.map((item, idx) => (
                                <div 
                                    key={`${item.id}-${idx}`} 
                                    className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group bg-white dark:bg-slate-800 shadow-sm hover:shadow-md cursor-pointer"
                                    onClick={() => navigate(item.route)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${item.days < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'}`}>
                                            {item.days < 0 ? `Vencido ${Math.abs(item.days)}d` : `Vence em ${item.days}d`}
                                        </span>
                                        <ArrowRight size={14} className="text-slate-300 group-hover:text-cyan-500 transition-colors" />
                                    </div>
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1 line-clamp-1">{item.name}</h4>
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><Building2 size={10}/> {item.local}</span>
                                        <span>{item.type}</span>
                                    </div>
                                </div>
                            ))
                        )}
                        
                        {criticalItems.length > 5 && (
                            <p className="text-xs text-center text-slate-400 py-2">
                                + {criticalItems.length - 5} outros itens pendentes
                            </p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};