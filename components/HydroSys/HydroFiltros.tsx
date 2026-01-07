import React, { useState, useEffect } from 'react';
import { Filter, AlertTriangle, CheckCircle, Clock, RotateCw, X, Calendar, Plus, Trash2, Building2, MapPin, History } from 'lucide-react';
import { User, HydroFiltro, UserRole, Sede } from '../../types';
import { hydroService } from '../../services/hydroService';
import { orgService } from '../../services/orgService';
import { EmptyState } from '../Shared/EmptyState';

export const HydroFiltros: React.FC<{ user: User }> = ({ user }) => {
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
  
  // Dates for exchange form
  const [todayDate, setTodayDate] = useState('');
  const [nextDate, setNextDate] = useState('');

  // Form for New Filter
  const initialNewFilter: Partial<HydroFiltro> = {
      sedeId: '',
      patrimonio: '',
      local: '',
      dataTroca: '',
      bebedouro: 'Bebedouro', // Default generic name
  };
  const [newFilter, setNewFilter] = useState<Partial<HydroFiltro>>(initialNewFilter);

  useEffect(() => {
    loadData();
    loadSedes();
  }, [user]);

  const loadData = async () => {
      setData(await hydroService.getFiltros(user));
  };

  const loadSedes = () => {
      const allSedes = orgService.getSedes();
      if (user.role === UserRole.ADMIN) {
          setAvailableSedes(allSedes);
      } else {
          // Filter only assigned sedes
          const userSedeIds = user.sedeIds || [];
          setAvailableSedes(allSedes.filter(s => userSedeIds.includes(s.id)));
      }
  };

  const canManage = user.role === UserRole.ADMIN || user.role === UserRole.GESTOR;

  const getDaysRemaining = (dateStr: string) => {
    if (!dateStr) return 999;
    const today = new Date();
    const target = new Date(dateStr);
    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatus = (days: number) => {
    if (days < 0) return { label: 'Vencido', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle };
    if (days < 30) return { label: 'Troca Próxima', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock };
    return { label: 'Regular', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle };
  };

  // --- ACTIONS ---

  const handleExchangeClick = (item: HydroFiltro) => {
    setSelectedItem(item);
    
    // Auto Calculate dates
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const next = new Date();
    next.setMonth(next.getMonth() + 6);
    const nextStr = next.toISOString().split('T')[0];

    setTodayDate(todayStr);
    setNextDate(nextStr);
    
    setIsExchangeModalOpen(true);
  };

  const confirmExchange = async () => {
    if (selectedItem && todayDate) {
        const updated: HydroFiltro = {
            ...selectedItem,
            dataTroca: todayDate,
            proximaTroca: nextDate
        };
        
        await hydroService.saveFiltro(updated);
        await loadData();
        setIsExchangeModalOpen(false);
    }
  };

  const handleHistory = (item: HydroFiltro) => {
      setHistoryTarget(item);
      setIsHistoryModalOpen(true);
  };

  // --- DELETE LOGIC ---
  const requestDelete = (item: HydroFiltro) => {
      setItemToDelete(item);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      if (itemToDelete) {
          await hydroService.deleteFiltro(itemToDelete.id);
          await loadData();
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
      }
  };

  // --- ADD NEW LOGIC ---
  const handleAddNew = () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Auto-select sede if user only has one (or logic for Admin to select none initially)
      let defaultSedeId = '';
      if (user.role !== UserRole.ADMIN && user.sedeIds && user.sedeIds.length === 1) {
          defaultSedeId = user.sedeIds[0];
      }

      setNewFilter({ 
          ...initialNewFilter, 
          sedeId: defaultSedeId,
          dataTroca: today 
      });
      setIsAddModalOpen(true);
  };

  const confirmAdd = async () => {
      if (newFilter.sedeId && newFilter.patrimonio && newFilter.local && newFilter.dataTroca) {
          // Auto calc next date based on input
          const next = new Date(newFilter.dataTroca);
          next.setMonth(next.getMonth() + 6);
          const nextStr = next.toISOString().split('T')[0];

          const newItem: HydroFiltro = {
              id: Date.now().toString(),
              sedeId: newFilter.sedeId,
              patrimonio: newFilter.patrimonio,
              local: newFilter.local,
              bebedouro: 'Bebedouro', // Fixed as requested
              dataTroca: newFilter.dataTroca,
              proximaTroca: nextStr
          };

          await hydroService.saveFiltro(newItem);
          await loadData();
          setIsAddModalOpen(false);
          setNewFilter(initialNewFilter);
      } else {
          alert('Preencha os campos obrigatórios, incluindo a Sede.');
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Filter className="text-cyan-600" />
            Filtros
            </h1>
            <p className="text-sm text-slate-500">Gestão e trocas de elementos filtrantes.</p>
        </div>
        
        {canManage && (
            <button 
                onClick={handleAddNew}
                className="flex items-center justify-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all"
            >
                <Plus size={18} className="mr-2" /> Novo Filtro
            </button>
        )}
      </div>

      {data.length === 0 ? (
          <EmptyState 
            icon={Filter}
            title="Nenhum Filtro Cadastrado"
            description="Não há filtros de bebedouro cadastrados para esta unidade."
            actionLabel={canManage ? "Cadastrar Filtro" : undefined}
            onAction={canManage ? handleAddNew : undefined}
          />
      ) : (
        <>
            {/* --- MOBILE: CARDS --- */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {data.map(item => {
                    const days = getDaysRemaining(item.proximaTroca);
                    const status = getStatus(days);
                    const StatusIcon = status.icon;

                    return (
                        <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                            {canManage && (
                                <button onClick={() => requestDelete(item)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <div className="flex justify-between items-start mb-4 pr-8">
                                <div className="bg-slate-100 dark:bg-slate-800 p-2 px-3 rounded-lg text-slate-600 dark:text-slate-400 font-mono text-xs font-bold">
                                    {item.patrimonio}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${status.color}`}>
                                    <StatusIcon size={12} />
                                    {status.label}
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{item.local}</h3>
                            <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Building2 size={12}/> {item.sedeId}</p>
                            <p className="text-sm text-slate-500 mb-6 flex items-center gap-1">Próxima troca: {new Date(item.proximaTroca).toLocaleDateString()}</p>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleHistory(item)}
                                    className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    <History size={18} />
                                </button>
                                <button 
                                    onClick={() => handleExchangeClick(item)}
                                    className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
                                >
                                    <RotateCw size={18} /> Realizar Troca
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- DESKTOP: TABLE --- */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Patrimônio</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Sede</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Local</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Última Troca</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Próxima Troca</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Ações</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.map((item) => {
                        const days = getDaysRemaining(item.proximaTroca);
                        const status = getStatus(days);
                        return (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="px-6 py-4 font-mono font-bold text-slate-500">{item.patrimonio}</td>
                                <td className="px-6 py-4 text-slate-500">{item.sedeId}</td>
                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{item.local}</td>
                                <td className="px-6 py-4">{new Date(item.dataTroca).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-bold">{new Date(item.proximaTroca).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                                        {status.label}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                                    <button onClick={() => handleHistory(item)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Histórico">
                                        <History size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleExchangeClick(item)}
                                        className="px-3 py-1.5 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg text-xs font-bold border border-cyan-100 transition-colors flex items-center gap-1"
                                    >
                                        <RotateCw size={14} /> Trocar
                                    </button>
                                    {canManage && (
                                        <button 
                                            onClick={() => requestDelete(item)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </>
      )}

      {/* Exchange Modal */}
      {isExchangeModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirmar Troca</h3>
                    <button onClick={() => setIsExchangeModalOpen(false)}><X className="text-slate-500 hover:text-slate-700" /></button>
                </div>
                
                <p className="text-sm text-slate-500 mb-6">
                    Registrar manutenção para filtro <strong>{selectedItem.patrimonio}</strong> em <strong>{selectedItem.local}</strong>.
                </p>
                
                <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                        <label className="block text-xs font-bold text-emerald-600 uppercase mb-1">Data da Realização</label>
                        <input 
                            type="date" 
                            className="w-full bg-transparent font-bold text-lg text-slate-800 outline-none"
                            value={todayDate}
                            onChange={(e) => {
                                setTodayDate(e.target.value);
                                // Recalc next date
                                if(e.target.value) {
                                    const next = new Date(e.target.value);
                                    next.setMonth(next.getMonth() + 6);
                                    setNextDate(next.toISOString().split('T')[0]);
                                }
                            }}
                        />
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                         <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Nova Validade (+6 Meses)</label>
                         <div className="font-bold text-lg text-slate-800">{new Date(nextDate).toLocaleDateString()}</div>
                    </div>
                </div>

                <button onClick={confirmExchange} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl mt-6 shadow-lg shadow-emerald-500/20">
                    Confirmar e Salvar
                </button>
            </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {isHistoryModalOpen && historyTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Histórico de Trocas</h3>
                          <p className="text-sm text-slate-500">{historyTarget.local} - {historyTarget.patrimonio}</p>
                      </div>
                      <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="text-slate-500" /></button>
                  </div>

                  <div className="space-y-6 relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                        {/* Current/Last Exchange */}
                        <div className="relative">
                            <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-cyan-500 border-2 border-white dark:border-slate-900"></div>
                            <p className="text-xs font-bold text-cyan-600 mb-1">{new Date(historyTarget.dataTroca).toLocaleDateString()}</p>
                            <div className="bg-cyan-50 dark:bg-cyan-900/10 p-3 rounded-lg border border-cyan-100 dark:border-cyan-900/30">
                                <p className="font-bold text-sm text-cyan-800 dark:text-cyan-400">Última Troca Registrada</p>
                                <p className="text-xs text-cyan-600/80">Válido até {new Date(historyTarget.proximaTroca).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Simulated Previous Entry */}
                        <div className="relative opacity-60">
                            <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-slate-900"></div>
                            <p className="text-xs font-bold text-slate-400 mb-1">05/01/2025</p>
                            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                <p className="font-bold text-sm text-slate-600 dark:text-slate-300">Troca Anterior</p>
                            </div>
                        </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- ADD NEW MODAL --- */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Novo Filtro</h3>
                    <button onClick={() => setIsAddModalOpen(false)}><X className="text-slate-500 hover:text-slate-700" /></button>
                </div>

                <div className="space-y-4">
                    {/* Sede Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Unidade / Sede</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select 
                                className="w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none appearance-none"
                                value={newFilter.sedeId}
                                onChange={e => setNewFilter({...newFilter, sedeId: e.target.value})}
                            >
                                <option value="">Selecione...</option>
                                {availableSedes.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Patrimônio / ID</label>
                        <input 
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                            placeholder="Ex: 1098 ou SEM PATRIMÔNIO"
                            value={newFilter.patrimonio}
                            onChange={e => setNewFilter({...newFilter, patrimonio: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Local de Instalação</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                className="w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                                placeholder="Ex: 10º Andar"
                                value={newFilter.local}
                                onChange={e => setNewFilter({...newFilter, local: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Data da Última Troca</label>
                        <input 
                            type="date"
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                            value={newFilter.dataTroca}
                            onChange={e => setNewFilter({...newFilter, dataTroca: e.target.value})}
                        />
                    </div>
                </div>

                <button onClick={confirmAdd} className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl mt-6 shadow-lg shadow-cyan-500/20">
                    Adicionar Filtro
                </button>
            </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 text-center">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50 dark:border-red-900/20">
                      <Trash2 size={32} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Excluir Filtro?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                      Você está prestes a remover o filtro <strong>{itemToDelete.patrimonio}</strong> localizado em <strong>{itemToDelete.local}</strong>. <br/>Esta ação não pode ser desfeita.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={confirmDelete}
                        className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-colors"
                      >
                          Sim, Excluir
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};