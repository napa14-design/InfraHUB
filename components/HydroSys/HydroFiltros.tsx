
import React, { useState, useEffect } from 'react';
import { Filter, AlertTriangle, CheckCircle, Clock, RotateCw, X, Plus, Trash2, Building2, MapPin, History, ArrowLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, HydroFiltro, UserRole, Sede } from '../../types';
import { hydroService } from '../../services/hydroService';
import { orgService } from '../../services/orgService';
import { EmptyState } from '../Shared/EmptyState';

export const HydroFiltros: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<HydroFiltro[]>([]);
  const [availableSedes, setAvailableSedes] = useState<Sede[]>([]);
  
  // Modals
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  // Selection
  const [selectedItem, setSelectedItem] = useState<HydroFiltro | null>(null);
  const [itemToDelete, setItemToDelete] = useState<HydroFiltro | null>(null);
  const [historyTarget, setHistoryTarget] = useState<HydroFiltro | null>(null);
  
  // Dates
  const [todayDate, setTodayDate] = useState('');
  const [nextDate, setNextDate] = useState('');

  // Form
  const initialNewFilter: Partial<HydroFiltro> = { sedeId: '', patrimonio: '', local: '', dataTroca: '', bebedouro: 'Bebedouro' };
  const [newFilter, setNewFilter] = useState<Partial<HydroFiltro>>(initialNewFilter);

  useEffect(() => { loadData(); loadSedes(); }, [user]);

  const loadData = async () => setData(await hydroService.getFiltros(user));
  const loadSedes = () => {
      const allSedes = orgService.getSedes();
      setAvailableSedes(user.role === UserRole.ADMIN ? allSedes : allSedes.filter(s => (user.sedeIds || []).includes(s.id)));
  };

  const canManage = user.role === UserRole.ADMIN || user.role === UserRole.GESTOR;
  
  const getDaysRemaining = (dateStr: string) => {
    if (!dateStr) return 999;
    return Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatus = (days: number) => {
    if (days < 0) return { label: 'Vencido', color: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30', icon: AlertTriangle };
    if (days < 30) return { label: 'Próximo', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30', icon: Clock };
    return { label: 'Regular', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30', icon: CheckCircle };
  };

  // Actions
  const handleExchangeClick = (item: HydroFiltro) => {
    setSelectedItem(item);
    const today = new Date();
    const next = new Date(); next.setMonth(next.getMonth() + 6);
    setTodayDate(today.toISOString().split('T')[0]);
    setNextDate(next.toISOString().split('T')[0]);
    setIsExchangeModalOpen(true);
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
          const next = new Date(newFilter.dataTroca); next.setMonth(next.getMonth() + 6);
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
      } else { alert('Preencha os campos obrigatórios.'); }
  };

  const requestDelete = (item: HydroFiltro) => { setItemToDelete(item); setIsDeleteModalOpen(true); };
  const confirmDelete = async () => { if (itemToDelete) { await hydroService.deleteFiltro(itemToDelete.id); await loadData(); setIsDeleteModalOpen(false); } };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0A0A0C]">
      {/* BACKGROUND */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] text-slate-400 dark:text-cyan-500" style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
      </div>

      <div className="relative z-10 px-4 md:px-8 py-6 space-y-6 pb-24 md:pb-8 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="relative overflow-hidden border border-slate-200 dark:border-white/5 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-sm rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-4 w-full md:w-auto">
                    <button onClick={() => navigate('/module/hydrosys')} className="group flex items-center gap-2 text-slate-500 dark:text-white/40 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all text-xs font-mono uppercase tracking-widest">
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel
                    </button>
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 border-2 border-cyan-500/20 dark:border-cyan-500/50 flex items-center justify-center bg-cyan-50 dark:bg-cyan-500/5 rounded-xl">
                            <Filter size={28} className="text-cyan-600 dark:text-cyan-500" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                                GESTÃO DE FILTROS
                            </h1>
                            <p className="text-slate-500 dark:text-white/30 text-xs md:text-sm font-mono mt-0.5">
                                Manutenção e troca de elementos.
                            </p>
                        </div>
                    </div>
                </div>
                {canManage && (
                    <button onClick={handleAddNew} className="w-full md:w-auto h-12 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-bold font-mono text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2">
                        <Plus size={18} /> NOVO FILTRO
                    </button>
                )}
            </div>
        </header>

        {data.length === 0 ? (
            <EmptyState icon={Filter} title="Nenhum Filtro" description="Não há filtros cadastrados." actionLabel={canManage ? "Cadastrar" : undefined} onAction={canManage ? handleAddNew : undefined} />
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                {data.map(item => {
                    const days = getDaysRemaining(item.proximaTroca);
                    const status = getStatus(days);
                    const StatusIcon = status.icon;

                    return (
                        <div key={item.id} className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-800/60 p-6 relative hover:border-cyan-500/30 transition-all shadow-sm group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Building2 size={10}/> {item.sedeId}</div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{item.local}</h3>
                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{item.patrimonio}</span>
                                </div>
                                <div className={`p-2 rounded-xl border ${status.color}`}>
                                    <StatusIcon size={20} />
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-3 border border-slate-100 dark:border-slate-800 mb-6 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Vencimento</p>
                                    <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{new Date(item.proximaTroca).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Status</p>
                                    <p className={`text-xs font-bold ${status.color.split(' ')[0]}`}>{status.label}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => handleExchangeClick(item)} className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all">
                                    <RotateCw size={16} /> Trocar
                                </button>
                                <button onClick={() => { setHistoryTarget(item); setIsHistoryModalOpen(true); }} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-xl transition-colors">
                                    <History size={18} />
                                </button>
                                {canManage && (
                                    <button onClick={() => requestDelete(item)} className="p-3 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-xl transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* --- MODALS (STYLED) --- */}
        {isExchangeModalOpen && selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
                    <div className="flex justify-between mb-6">
                        <h3 className="font-bold text-slate-900 dark:text-white font-mono uppercase">Registrar Troca</h3>
                        <button onClick={() => setIsExchangeModalOpen(false)}><X size={20} className="text-slate-500"/></button>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Data Realização</label>
                            <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" value={todayDate} onChange={e => { setTodayDate(e.target.value); const n = new Date(e.target.value); n.setMonth(n.getMonth()+6); setNextDate(n.toISOString().split('T')[0]); }} />
                        </div>
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Nova Validade</p>
                            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{new Date(nextDate).toLocaleDateString()}</p>
                        </div>
                        <button onClick={confirmExchange} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-500/20">Confirmar</button>
                    </div>
                </div>
            </div>
        )}

        {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
                    <div className="flex justify-between mb-6">
                        <h3 className="font-bold text-slate-900 dark:text-white font-mono uppercase">Novo Filtro</h3>
                        <button onClick={() => setIsAddModalOpen(false)}><X size={20} className="text-slate-500"/></button>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Unidade</label>
                            <select className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" value={newFilter.sedeId} onChange={e => setNewFilter({...newFilter, sedeId: e.target.value})}>
                                <option value="">Selecione...</option>
                                {availableSedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" placeholder="Patrimônio" value={newFilter.patrimonio} onChange={e => setNewFilter({...newFilter, patrimonio: e.target.value})} />
                        <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" placeholder="Local (Ex: 1º Andar)" value={newFilter.local} onChange={e => setNewFilter({...newFilter, local: e.target.value})} />
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Última Troca</label>
                            <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" value={newFilter.dataTroca} onChange={e => setNewFilter({...newFilter, dataTroca: e.target.value})} />
                        </div>
                        <button onClick={confirmAdd} className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-cyan-500/20">Cadastrar</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
