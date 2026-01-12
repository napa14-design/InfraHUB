
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, Award, TestTube, Filter, Droplet, Settings, PieChart, Lock, ChevronRight, Activity, AlertTriangle, Gauge, Thermometer, Waves, FileDown, Calendar, Download, X } from 'lucide-react';
import { User, UserRole, HydroCertificado, HydroFiltro } from '../types';
import { HYDROSYS_SUBMODULES } from '../constants';
import { orgService } from '../../services/orgService';
import { hydroService } from '../../services/hydroService';
import { exportToCSV } from '../utils/csvExport';
import { Breadcrumbs } from './Shared/Breadcrumbs';
import { DashboardGridSkeleton, Skeleton } from './Shared/Skeleton';

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

  // --- REPORT MODAL STATE ---
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'CLORO' | 'CERTIFICADOS' | 'FILTROS' | 'RESERVATORIOS'>('CLORO');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Simulate slight delay to show off skeleton
    setTimeout(() => {
        fetchDashboardData();
    }, 800);
    
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
    setDateRange({ start: firstDay, end: lastDay });

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

          const uniqueCerts = Array.from(certs.reduce((map, item) => {
              const key = `${item.sedeId}-${item.parceiro}`;
              const existing = map.get(key);
              if (!existing || new Date(item.validade) > new Date(existing.validade)) {
                  map.set(key, item);
              }
              return map;
          }, new Map<string, HydroCertificado>()).values());

          const uniqueFiltros = Array.from(filts.reduce((map, item) => {
              const key = `${item.sedeId}-${item.patrimonio}`; 
              const existing = map.get(key);
              if (!existing || new Date(item.dataTroca) > new Date(existing.dataTroca)) {
                  map.set(key, item);
              }
              return map;
          }, new Map<string, HydroFiltro>()).values());

          const totalReservatorios = pocos.length + cist.length + caixas.length;
          
          const today = new Date();
          let alertCount = 0;

          const checkDate = (dateStr?: string, daysThreshold = 30) => {
              if (!dateStr) return false;
              const d = new Date(dateStr);
              const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return diff <= daysThreshold;
          };

          uniqueCerts.forEach(c => { if (c.status !== 'VIGENTE' || checkDate(c.validade)) alertCount++; });
          uniqueFiltros.forEach(f => { if (checkDate(f.proximaTroca, 15)) alertCount++; });
          pocos.forEach(p => { if (checkDate(p.proximaLimpeza)) alertCount++; });
          cist.forEach(c => { if (checkDate(c.proximaLimpeza)) alertCount++; });
          caixas.forEach(c => { if (checkDate(c.proximaLimpeza)) alertCount++; });

          setStats({
              reservatorios: totalReservatorios,
              certificados: uniqueCerts.length,
              filtros: uniqueFiltros.length,
              alertas: alertCount
          });

          if (cloroEntries.length > 0) {
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

  const handleExport = async () => {
      setIsExporting(true);
      try {
          if (reportType === 'CLORO') {
              const data = await hydroService.getCloro(user);
              const filtered = data.filter(d => d.date >= dateRange.start && d.date <= dateRange.end);
              const headers = { sedeId: 'Unidade/Sede', date: 'Data Coleta', cl: 'Cloro (ppm)', ph: 'pH', medidaCorretiva: 'Ação Corretiva', responsavel: 'Responsável Técnico' };
              const finalData = filtered.map(item => ({ sedeId: item.sedeId, date: item.date, cl: item.cl, ph: item.ph, medidaCorretiva: item.medidaCorretiva, responsavel: item.responsavel }));
              exportToCSV(finalData, 'Relatorio_Cloro_pH', headers);
          } else if (reportType === 'CERTIFICADOS') {
              const data = await hydroService.getCertificados(user);
              const headers = { sedeId: 'Sede', parceiro: 'Laboratório', status: 'Status', validade: 'Vencimento', dataAnalise: 'Data Análise', linkFisico: 'Link Laudo Físico', linkMicro: 'Link Laudo Micro' };
              exportToCSV(data, 'Relatorio_Certificados', headers);
          } else if (reportType === 'FILTROS') {
              const data = await hydroService.getFiltros(user);
              const headers = { sedeId: 'Sede', local: 'Local Instalação', patrimonio: 'Patrimônio', dataTroca: 'Última Troca', proximaTroca: 'Próxima Troca' };
              exportToCSV(data, 'Inventario_Filtros', headers);
          } else if (reportType === 'RESERVATORIOS') {
              const pocos = await hydroService.getPocos(user);
              const cist = await hydroService.getCisternas(user);
              const caixas = await hydroService.getCaixas(user);
              const combined = [ ...pocos.map(p => ({ ...p, tipoDesc: 'Poço Artesiano' })), ...cist.map(c => ({ ...c, tipoDesc: 'Cisterna' })), ...caixas.map(c => ({ ...c, tipoDesc: 'Caixa D\'água' })) ];
              const headers = { sedeId: 'Sede', tipoDesc: 'Tipo', local: 'Localização', situacaoLimpeza: 'Status Limpeza', proximaLimpeza: 'Próxima Limpeza', responsavel: 'Responsável' };
              const finalData = combined.map(i => ({ sedeId: i.sedeId, tipoDesc: i.tipoDesc, local: i.local, situacaoLimpeza: i.situacaoLimpeza, proximaLimpeza: i.proximaLimpeza, responsavel: i.responsavel }));
              exportToCSV(finalData, 'Controle_Reservatorios', headers);
          }
          setIsReportModalOpen(false);
      } catch (e) {
          alert("Erro ao gerar relatório");
      } finally {
          setIsExporting(false);
      }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0A0A0C]">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] text-slate-400 dark:text-cyan-500" style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015] text-slate-400 dark:text-cyan-500" style={{ backgroundImage: `linear-gradient(currentColor 0.5px, transparent 0.5px), linear-gradient(90deg, currentColor 0.5px, transparent 0.5px)`, backgroundSize: '16px 16px' }} />
      </div>

      {/* Top Status Bar */}
      <div className="relative z-10 border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
        <div className="px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
              <span className="text-[10px] font-mono text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  {isLoading ? 'Atualizando...' : 'Sistema Online'}
              </span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-white/40 tabular-nums">
            {currentTime.toLocaleDateString('pt-BR')} | {currentTime.toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 md:px-8 py-6 space-y-6 pb-24 md:pb-8">
        <Breadcrumbs />
        
        <header className={`relative overflow-hidden border border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          <div className="p-6 md:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 border-2 border-cyan-500/20 dark:border-cyan-500/50 flex items-center justify-center bg-cyan-50 dark:bg-cyan-500/5 rounded-xl">
                    <Waves size={32} className="text-cyan-600 dark:text-cyan-500" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-mono">HYDRO<span className="text-cyan-600 dark:text-cyan-500">SYS</span></h1>
                    <p className="text-slate-500 dark:text-white/30 text-sm font-mono mt-0.5">Gestão de Recursos Hídricos</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                {(user.role === UserRole.ADMIN || user.role === UserRole.GESTOR) && (
                    <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-xl shadow-lg shadow-cyan-500/20 hover:bg-cyan-700 transition-all text-xs font-bold font-mono uppercase">
                        <FileDown size={16} /> Central de Relatórios
                    </button>
                )}
                {userSede && (
                  <div className="flex flex-col items-start lg:items-end gap-1">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-white/30 uppercase tracking-widest">Unidade</span>
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

        {/* MODULES SECTION WITH SKELETON */}
        <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-cyan-500" />
            <span className="text-sm font-mono text-slate-500 dark:text-white/40 uppercase tracking-widest">Painéis de Controle</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/5" />
          </div>

          {isLoading ? (
              <DashboardGridSkeleton />
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {allowedSubModules.map((mod, index) => {
                  const Icon = HydroIconMap[mod.iconName] || Droplets;
                  const isAdminOnly = mod.roles.length === 1 && mod.roles.includes(UserRole.ADMIN);

                  return (
                    <button key={mod.id} onClick={() => handleCardClick(mod.id)} className="group relative text-left h-full" style={{ animationDelay: `${index * 50}ms`, animation: mounted ? 'fade-up 0.4s ease-out forwards' : 'none', opacity: 0 }}>
                      <div className={`relative h-full border bg-white dark:bg-[#111114]/80 backdrop-blur-sm p-6 transition-all duration-300 ${isAdminOnly ? 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10' : 'border-slate-200 dark:border-white/5 hover:border-cyan-500/30 hover:bg-cyan-50/[0.02] dark:hover:bg-cyan-500/[0.02]'}`}>
                        <div className={`absolute top-0 right-0 w-3 h-3 border-t border-r transition-colors duration-300 ${isAdminOnly ? 'border-slate-200 dark:border-white/10' : 'border-slate-200 dark:border-white/10 group-hover:border-cyan-500/50'}`} />
                        <div className="flex justify-between items-start mb-5">
                          <div className={`w-12 h-12 border flex items-center justify-center transition-all duration-300 ${isAdminOnly ? 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-400' : 'border-cyan-500/20 bg-cyan-50 dark:bg-cyan-500/5 text-cyan-600 dark:text-cyan-500 group-hover:border-cyan-500/40 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-500/10'}`}>
                            <Icon size={24} />
                          </div>
                          {isAdminOnly && <span className="px-2 py-1 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-[9px] font-mono text-slate-500 dark:text-white/40 uppercase tracking-wider">Admin</span>}
                        </div>
                        <div className="space-y-2 mb-6">
                          <h3 className={`text-lg font-bold transition-colors duration-300 ${isAdminOnly ? 'text-slate-500 dark:text-white/60' : 'text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400'}`}>{mod.title}</h3>
                          <p className="text-sm text-slate-500 dark:text-white/30 leading-relaxed line-clamp-2 font-mono">{mod.description}</p>
                        </div>
                        <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                          <span className={`text-[10px] font-mono uppercase tracking-widest transition-colors duration-300 ${isAdminOnly ? 'text-slate-400 dark:text-white/20' : 'text-slate-500 dark:text-white/30 group-hover:text-cyan-600 dark:group-hover:text-cyan-500/70'}`}>Acessar</span>
                          <ChevronRight size={16} className={isAdminOnly ? 'text-slate-300' : 'text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-1'} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
          )}
        </div>

        {/* Modal code remains same */}
        {isReportModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 flex items-center justify-center">
                                <FileDown size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Exportar Dados</h3>
                                <p className="text-xs text-slate-500">Business Intelligence CSV</p>
                            </div>
                        </div>
                        <button onClick={() => setIsReportModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <X size={18} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Selecione o Relatório</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setReportType('CLORO')} className={`p-3 rounded-xl border text-left text-sm font-bold transition-all ${reportType === 'CLORO' ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                    <div className="flex items-center gap-2 mb-1"><TestTube size={16}/> Cloro e pH</div>
                                </button>
                                <button onClick={() => setReportType('RESERVATORIOS')} className={`p-3 rounded-xl border text-left text-sm font-bold transition-all ${reportType === 'RESERVATORIOS' ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                    <div className="flex items-center gap-2 mb-1"><Droplet size={16}/> Reservatórios</div>
                                </button>
                                <button onClick={() => setReportType('CERTIFICADOS')} className={`p-3 rounded-xl border text-left text-sm font-bold transition-all ${reportType === 'CERTIFICADOS' ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                    <div className="flex items-center gap-2 mb-1"><Award size={16}/> Certificados</div>
                                </button>
                                <button onClick={() => setReportType('FILTROS')} className={`p-3 rounded-xl border text-left text-sm font-bold transition-all ${reportType === 'FILTROS' ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                    <div className="flex items-center gap-2 mb-1"><Filter size={16}/> Filtros</div>
                                </button>
                            </div>
                        </div>

                        {reportType === 'CLORO' && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 animate-in fade-in">
                                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase">
                                    <Calendar size={14} /> Período de Análise
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-slate-400 block mb-1">Início</label>
                                        <input type="date" className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 block mb-1">Fim</label>
                                        <input type="date" className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <button onClick={handleExport} disabled={isExporting} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                                {isExporting ? <Activity className="animate-spin" /> : <Download size={20} />}
                                {isExporting ? 'Gerando Arquivo...' : 'Baixar Relatório CSV'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
      <style>{`@keyframes fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};
