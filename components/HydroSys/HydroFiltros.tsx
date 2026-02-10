
import React, { useState, useEffect } from 'react';
import { Filter, AlertTriangle, CheckCircle, Clock, RotateCw, X, Plus, Trash2, Building2, MapPin, History, ArrowLeft, Calendar, User as UserIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, HydroFiltro, UserRole, Sede, LogEntry, HydroSettings } from '../../types';
import { hydroService } from '../../services/hydroService';
import { orgService } from '../../services/orgService';
import { logService } from '../../services/logService';
import { EmptyState } from '../Shared/EmptyState';

export const HydroFiltros: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<HydroFiltro[]>([]);
  const [availableSedes, setAvailableSedes] = useState<Sede[]>([]);
  const [settings, setSettings] = useState<HydroSettings | null>(null);
  
  // Filters
  const [selectedSedeFilter, setSelectedSedeFilter] = useState<string>('');

  // Modals
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  // Selection & History
  const [selectedItem, setSelectedItem] = useState<HydroFiltro | null>(null);
  const [itemToDelete, setItemToDelete] = useState<HydroFiltro | null>(null);
  const [historyLogs, setHistoryLogs] = useState<LogEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Dates
  const [todayDate, setTodayDate] = useState('');
  const [nextDate, setNextDate] = useState('');

  // Form
  const initialNewFilter: Partial<HydroFiltro> = { sedeId: '', patrimonio: '', local: '', dataTroca: '', bebedouro: 'Bebedouro' };
  const [newFilter, setNewFilter] = useState<Partial<HydroFiltro>>(initialNewFilter);

  useEffect(() => { loadData(); loadSedes(); loadSettings(); }, [user]);

  const loadData = async () => setData(await hydroService.getFiltros(user));
  const loadSettings = async () => setSettings(await hydroService.getSettings());
  const loadSedes = () => {
      const allSedes = orgService.getSedes();
      setAvailableSedes(user.role === UserRole.ADMIN ? allSedes : allSedes.filter(s => (user.sedeIds || []).includes(s.id)));
  };

  const canManage = user.role === UserRole.ADMIN || user.role === UserRole.GESTOR;
  const isAdmin = user.role === UserRole.ADMIN;
  const filtroMonths = settings?.validadeFiltroMeses || 6;
  
  const getDaysRemaining = (dateStr: string) => {
    if (!dateStr) return 999;
    return Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatus = (days: number) => {
    if (days < 0) return { label: 'Vencido', color: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30', icon: AlertTriangle };
    if (days < 30) return { label: 'Próximo', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30', icon: Clock };
    return { label: 'Regular', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30', icon: CheckCircle };
  };

  const handleExchangeClick = (item: HydroFiltro) => {
    setSelectedItem(item);
    const today = new Date();
    const next = new Date(); next.setMonth(next.getMonth() + filtroMonths);
    setTodayDate(today.toISOString().split('T')[0]);
    setNextDate(next.toISOString().split('T')[0]);
    setIsExchangeModalOpen(true);
  };

  const handleHistoryClick = async (item: HydroFiltro) => {
      setSelectedItem(item);
      setIsLoadingHistory(true);
      setIsHistoryModalOpen(true);
      const allLogs = await logService.getAll();
      const logs = allLogs.filter(l => 
        l.module === 'HYDROSYS' && 
        (l.target.includes(item.patrimonio) || l.details?.includes(item.patrimonio))
      );
      setHistoryLogs(logs);
      setIsLoadingHistory(false);
  };

  const confirmExchange = async () => {
    if (selectedItem && todayDate) {
        await hydroService.saveFiltro({ ...selectedItem, dataTroca: todayDate, proximaTroca: nextDate });
        await loadData();
        setIsExchangeModalOpen(false);
    }
  };

  const handleAddNew = () => {
      let defaultSedeId = (user.role !== UserRole.ADMIN && user.sedeIds && user.sedeIds.length === 1) ? user.sedeIds[0] : '';
      setNewFilter({ ...initialNewFilter, sedeId: defaultSedeId, dataTroca: new Date().toISOString().split('T')[0] });
      setIsAddModalOpen(true);
  };

  const confirmAdd = async () => {
      if (newFilter.sedeId && newFilter.patrimonio && newFilter.local && newFilter.dataTroca) {
          const next = new Date(newFilter.dataTroca); next.setMonth(next.getMonth() + filtroMonths);
          await hydroService.saveFiltro({
              id: Date.now().toString(),
              sedeId: newFilter.sedeId,
              patrimonio: newFilter.patrimonio,
              local: newFilter.local,
              bebedouro: 'Bebedouro',
              dataTroca: newFilter.dataTroca,
              proximaTroca: next.toISOString().split('T')[0]
          } as HydroFiltro);
          await loadData();
          setIsAddModalOpen(false);
          setNewFilter(initialNewFilter);
      } else { alert('Preencha os campos obrigatérios.'); }
  };

  const requestDelete = (item: HydroFiltro) => { setItemToDelete(item); setIsDeleteModalOpen(true); };
  const confirmDelete = async () => { if (itemToDelete) { await hydroService.deleteFiltro(itemToDelete.id); await loadData(); setIsDeleteModalOpen(false); } };

  const filteredData = data.filter(item => {
      if (isAdmin && selectedSedeFilter && item.sedeId !== selectedSedeFilter) return false;
      return true;
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0A0A0C]">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] text-slate-400 dark:text-cyan-500" style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
      </div>

      <div className="relative z-10 px-4 md:px-8 py-6 space-y-6 pb-24 md:pb-8 max-w-7xl mx-auto">
        <header className="relative overflow-hidden border border-slate-200 dark:border-white/5 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-sm rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-4 w-full md:w-auto">
                    <button onClick={() => navigate('/module/hydrosys')} className="group flex items-center gap-2 text-slate-500 dark:text-white/40 hover:text-cyan-600 transition-all text-xs font-mono uppercase tracking-widest">
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel
                    </button>
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 border-2 border-cyan-500/20 dark:border-cyan-500/5 flex items-center justify-center bg-cyan-50 dark:bg-cyan-500/5 rounded-xl">
                            <Filter size={28} className="text-cyan-600 dark:text-cyan-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono uppercase">gestão de Filtros</h1>
                            <p className="text-slate-500 dark:text-white/30 text-xs md:text-sm font-mono mt-0.5">manutenção de elementos filtrantes.</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    {/* FILTRO DE SEDE (ADMIN ONLY) */}
                    {isAdmin && (
                        <div className="relative group w-full sm:w-auto">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Building2 size={14} />
                            </div>
                            <select
                                className="w-full sm:w-48 pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none uppercase transition-all hover:border-cyan-500/30"
                                value={selectedSedeFilter}
                                onChange={(e) => setSelectedSedeFilter(e.target.value)}
                            >
                                <option value="">Todas as Sedes</option>
                                {availableSedes.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                <Filter size={12} />
                            </div>
                        </div>
                    )}

                    {canManage && (
                        <button onClick={handleAddNew} className="w-full sm:w-auto h-12 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-bold font-mono text-sm shadow-lg flex items-center justify-center gap-2 transition-all">
                            <Plus size={18} /> NOVO FILTRO
                        </button>
                    )}
                </div>
            </div>
        </header>

        {filteredData.length === 0 ? (
            <EmptyState icon={Filter} title="Nenhum Filtro Encontrado" description={selectedSedeFilter ? "não há filtros cadastrados nesta unidade." : "Nenhum registro disponível."} actionLabel={canManage ? "Cadastrar Agora" : undefined} onAction={canManage ? handleAddNew : undefined} />
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                {filteredData.map(item => {
                    const days = getDaysRemaining(item.proximaTroca);
                    const status = getStatus(days);
                    const StatusIcon = status.icon;
                    const critical = days < 30;

                    return (
                        <div key={item.id} className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800/60 p-6 relative hover:border-cyan-500/30 transition-all shadow-sm group flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Building2 size={10}/> {item.sedeId}</div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white uppercase">{item.local}</h3>
                                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{item.patrimonio}</span>
                                </div>
                                <div className={`p-2 rounded-xl border ${status.color}`}>
                                    <StatusIcon size={20} className={critical ? 'animate-pulse' : ''} />
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-black/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 mb-6 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">próxima Troca</p>
                                    <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{new Date(item.proximaTroca).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">Prazo</p>
                                    <p className={`text-xs font-black uppercase ${status.color.split(' ')[0]}`}>
                                        {days < 0 ? 'VENCIDO' : `${days} dias`}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto space-y-3">
                                <button 
                                    onClick={() => handleExchangeClick(item)} 
                                    className={`w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 ${critical ? 'animate-pulse' : ''}`}
                                >
                                    <RotateCw size={18} /> Registrar Troca de Refil
                                </button>
                                
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/50">
                                    <button onClick={() => handleHistoryClick(item)} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                                        <History size={16} /> histórico
                                    </button>
                                    {canManage && (
                                        <button onClick={() => requestDelete(item)} className="p-3 text-red-400 hover:text-red-600 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* EXCHANGE MODAL */}
        {isExchangeModalOpen && selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
                    <div className="flex justify-between mb-6">
                        <h3 className="font-bold text-slate-900 dark:text-white font-mono uppercase tracking-widest">Registrar manutenção</h3>
                        <button onClick={() => setIsExchangeModalOpen(false)}><X size={20} className="text-slate-500"/></button>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data Realização</label>
                        <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" value={todayDate} onChange={e => { setTodayDate(e.target.value); const n = new Date(e.target.value); n.setMonth(n.getMonth() + filtroMonths); setNextDate(n.toISOString().split('T')[0]); }} />
                        </div>
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1 tracking-widest">Nova Validade (+{filtroMonths} meses)</p>
                            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{new Date(nextDate).toLocaleDateString()}</p>
                        </div>
                        <button onClick={confirmExchange} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20">CONFIRMAR TROCA</button>
                    </div>
                </div>
            </div>
        )}

        {/* HISTORY MODAL */}
        {isHistoryModalOpen && selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white font-mono uppercase tracking-widest">Auditoria de Filtro</h3>
                            <p className="text-xs text-slate-500">Patrimônio: {selectedItem.patrimonio}</p>
                        </div>
                        <button onClick={() => setIsHistoryModalOpen(false)}><X size={20} className="text-slate-500"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        {isLoadingHistory ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400"><Loader2 size={32} className="animate-spin mb-2 text-cyan-500" /><p className="text-xs font-mono uppercase">Carregando...</p></div>
                        ) : historyLogs.length === 0 ? (
                            <div className="text-center py-12 text-slate-400"><History size={40} className="mx-auto mb-3 opacity-20" /><p className="text-xs font-mono uppercase">Sem trocas recentes.</p></div>
                        ) : (
                            <div className="space-y-6 relative border-l border-slate-200 dark:border-slate-800 ml-3 pl-6">
                                {historyLogs.map((log, idx) => (
                                    <div key={idx} className="relative group">
                                        <div className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full bg-cyan-500 border-4 border-white dark:border-[#111114]"></div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{new Date(log.timestamp).toLocaleString()}</p>
                                        <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
                                            <div className="flex items-center gap-2 mb-1"><UserIcon size={12} className="text-slate-400" /><span className="text-xs font-bold text-slate-700 dark:text-slate-200">{log.userName}</span></div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">{log.details || 'manutenção realizada.'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* ADD MODAL */}
        {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
                    <div className="flex justify-between mb-6"><h3 className="font-bold text-slate-900 dark:text-white font-mono uppercase tracking-widest">Novo Ativo</h3><button onClick={() => setIsAddModalOpen(false)}><X size={20} className="text-slate-500"/></button></div>
                    <div className="space-y-4">
                        <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unidade</label><select className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm uppercase" value={newFilter.sedeId} onChange={e => setNewFilter({...newFilter, sedeId: e.target.value})}><option value="">Selecione...</option>{availableSedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                        <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" placeholder="Patrimônio" value={newFilter.patrimonio} onChange={e => setNewFilter({...newFilter, patrimonio: e.target.value.toUpperCase()})} />
                        <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" placeholder="Local Instalação" value={newFilter.local} onChange={e => setNewFilter({...newFilter, local: e.target.value.toUpperCase()})} />
                        <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Última Troca</label><input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" value={newFilter.dataTroca} onChange={e => setNewFilter({...newFilter, dataTroca: e.target.value})} /></div>
                        <button onClick={confirmAdd} className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Cadastrar Novo</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
