
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, ShieldAlert, Plus, Calendar, Filter, 
    Search, CheckCircle2, AlertTriangle, Clock, 
    Edit2, Trash2, Save, X, Building2, Check, History, Eye, Beaker, Bug
} from 'lucide-react';
import { User, PestControlEntry, UserRole, Sede } from '../../types';
import { pestService } from '../../services/pestService';
import { orgService } from '../../services/orgService';
import { EmptyState } from '../Shared/EmptyState';

const PEST_TYPES = [
    "Rato / Roedores",
    "Barata / Escorpião", 
    "Muriçoca / Mosquitos",
    "Formiga",
    "Cupim",
    "Outros"
];

export const PestControlExecution: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<PestControlEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<PestControlEntry[]>([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedSedeId, setSelectedSedeId] = useState('');
  const [availableSedes, setAvailableSedes] = useState<Sede[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDENTE' | 'REALIZADO' | 'ATRASADO'>('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<PestControlEntry>>({});
  const [historyItems, setHistoryItems] = useState<PestControlEntry[]>([]);
  const [historyTarget, setHistoryTarget] = useState('');

  // Permissions
  const canEdit = user.role === UserRole.ADMIN || user.role === UserRole.GESTOR;
  const canCreate = canEdit; // Apenas Admin e Gestor podem criar novos registros
  const isAdmin = user.role === UserRole.ADMIN;

  useEffect(() => {
      const init = async () => {
          // Load Sedes
          const sedes = orgService.getSedes();
          const userSedes = user.role === UserRole.ADMIN ? sedes : sedes.filter(s => (user.sedeIds || []).includes(s.id));
          setAvailableSedes(userSedes);
          
          // Select logic
          if (user.role === UserRole.ADMIN) {
              setSelectedSedeId(''); // Admin defaults to ALL
          } else if (userSedes.length > 0) {
              setSelectedSedeId(userSedes[0].id);
          }

          // Load Data
          const data = await pestService.getAll(user);
          setEntries(data);
      };
      init();
  }, [user]);

  // Filter Logic
  useEffect(() => {
      let res = entries;

      if (selectedSedeId) {
          res = res.filter(e => e.sedeId === selectedSedeId);
      }

      if (search) {
          const lower = search.toLowerCase();
          res = res.filter(e => 
              e.target.toLowerCase().includes(lower) || 
              e.product.toLowerCase().includes(lower) ||
              e.technician.toLowerCase().includes(lower) ||
              (availableSedes.find(s => s.id === e.sedeId)?.name || '').toLowerCase().includes(lower)
          );
      }

      if (statusFilter !== 'ALL') {
          res = res.filter(e => e.status === statusFilter);
      }

      // Sort by Date Desc
      res.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

      setFilteredEntries(res);
  }, [entries, search, selectedSedeId, statusFilter, availableSedes]);

  const handleAddNew = () => {
      setEditingItem({
          id: Date.now().toString(),
          sedeId: selectedSedeId || (availableSedes.length > 0 ? availableSedes[0].id : ''), // Default to first if ALL is selected
          item: 'Dedetização',
          target: PEST_TYPES[0], // Default value
          product: '',
          frequency: 'Quinzenal',
          method: '',
          technician: '',
          scheduledDate: new Date().toISOString().split('T')[0],
          status: 'PENDENTE'
      });
      setIsModalOpen(true);
  };

  const handleEdit = (item: PestControlEntry) => {
      setEditingItem({ ...item });
      setIsModalOpen(true);
  };

  const handleComplete = (item: PestControlEntry) => {
      // Setup completion modal state
      setEditingItem({
          ...item,
          performedDate: new Date().toISOString().split('T')[0], // Default to today
          status: 'REALIZADO'
      });
      setIsModalOpen(true);
  };

  const handleViewHistory = (target: string) => {
      const hist = entries.filter(e => 
          (selectedSedeId ? e.sedeId === selectedSedeId : true) && // Filter by current view scope
          e.target === target && 
          e.status === 'REALIZADO'
      );
      hist.sort((a, b) => new Date(b.performedDate!).getTime() - new Date(a.performedDate!).getTime());
      setHistoryItems(hist);
      setHistoryTarget(target);
      setIsHistoryOpen(true);
  };

  const handleSave = async () => {
      if (editingItem.target && editingItem.product && editingItem.scheduledDate && editingItem.sedeId) {
          await pestService.save(editingItem as PestControlEntry);
          setEntries(await pestService.getAll(user));
          setIsModalOpen(false);
      } else {
          alert("Preencha os campos obrigatórios (incluindo a Unidade)");
      }
  };

  const handleDelete = async (id: string) => {
      if(confirm("Remover este registro?")) {
          await pestService.delete(id);
          setEntries(await pestService.getAll(user));
      }
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'REALIZADO': return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded text-[10px] font-bold uppercase border border-emerald-200 dark:border-emerald-800"><CheckCircle2 size={12}/> Realizado</span>;
          case 'ATRASADO': return <span className="flex items-center gap-1 text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-[10px] font-bold uppercase border border-red-200 dark:border-red-800"><AlertTriangle size={12}/> Atrasado</span>;
          default: return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded text-[10px] font-bold uppercase border border-amber-200 dark:border-amber-800"><Clock size={12}/> Pendente</span>;
      }
  };

  // Determine if it's "Completion Mode" (Operational user or finishing a pending task)
  const isCompletionMode = (!canEdit) || (editingItem.status === 'REALIZADO' && entries.find(e => e.id === editingItem.id)?.status !== 'REALIZADO');

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0A0A0C] pb-20">
       
       {/* Header Section */}
       <div className="bg-white dark:bg-[#111114] border-b border-slate-200 dark:border-slate-800 px-6 py-6 sticky top-0 z-20">
           <div className="max-w-7xl mx-auto">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                   <div>
                       <button onClick={() => navigate('/module/pestcontrol')} className="flex items-center text-slate-500 hover:text-amber-600 transition-colors text-xs font-mono uppercase tracking-widest mb-2">
                            <ArrowLeft size={14} className="mr-1" /> Voltar
                       </button>
                       <h1 className="text-2xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-3">
                           <ShieldAlert className="text-amber-600" size={28} /> 
                           CRONOGRAMA DE DEDETIZAÇÃO
                       </h1>
                   </div>
                   
                   {canCreate && (
                       <button 
                        onClick={handleAddNew}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all w-full md:w-auto justify-center"
                       >
                           <Plus size={16} /> Novo Registro
                       </button>
                   )}
               </div>

               {/* Filters Toolbar */}
               <div className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                   {/* Sede Selector */}
                   <div className="w-full md:w-64">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Unidade / Sede</label>
                       <div className="relative">
                           <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                           <select 
                               className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-500 transition-all uppercase"
                               value={selectedSedeId}
                               onChange={(e) => setSelectedSedeId(e.target.value)}
                           >
                               {isAdmin && <option value="">TODAS AS UNIDADES</option>}
                               {availableSedes.length === 0 && !isAdmin && <option value="">Sem permissão</option>}
                               {availableSedes.map(sede => (
                                   <option key={sede.id} value={sede.id}>{sede.name}</option>
                               ))}
                           </select>
                       </div>
                   </div>

                   {/* Search */}
                   <div className="flex-1">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Buscar Registro</label>
                       <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                           <input 
                               type="text" 
                               placeholder="Praga, Produto, Local..."
                               className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-amber-500 transition-all"
                               value={search}
                               onChange={e => setSearch(e.target.value)}
                           />
                       </div>
                   </div>

                   {/* Status Filter */}
                   <div className="w-full md:w-48">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Status</label>
                       <div className="relative">
                           <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                           <select 
                               className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-500 transition-all uppercase"
                               value={statusFilter}
                               onChange={e => setStatusFilter(e.target.value as any)}
                           >
                               <option value="ALL">Todos</option>
                               <option value="REALIZADO">Realizados</option>
                               <option value="PENDENTE">Pendentes</option>
                               <option value="ATRASADO">Atrasados</option>
                           </select>
                       </div>
                   </div>
               </div>
           </div>
       </div>
       
       <div className="max-w-7xl mx-auto p-4 md:p-6">
           {filteredEntries.length === 0 ? (
               <EmptyState 
                   icon={ShieldAlert}
                   title="Nenhum Registro Encontrado"
                   description="Tente ajustar os filtros ou selecionar outra unidade."
               />
           ) : (
               <>
                   {/* MOBILE VIEW (Cards) */}
                   <div className="grid grid-cols-1 gap-4 md:hidden">
                       {filteredEntries.map(entry => (
                           <div key={entry.id} className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                               {/* Card Header */}
                               <div className="flex justify-between items-start mb-4">
                                   <div className="flex items-start gap-3">
                                       <div className="p-2 bg-amber-50 dark:bg-amber-900/10 rounded-xl text-amber-600 dark:text-amber-500 border border-amber-100 dark:border-amber-900/30">
                                           <Bug size={20} />
                                       </div>
                                       <div>
                                           <p className="text-[10px] font-bold text-slate-400 uppercase">{entry.item} - {entry.sedeId}</p>
                                           <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{entry.target}</h3>
                                       </div>
                                   </div>
                                   {getStatusBadge(entry.status)}
                               </div>

                               {/* Info Grid */}
                               <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                                   <div>
                                       <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Data Prevista</p>
                                       <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                           <Calendar size={12} className="text-slate-400"/>
                                           {new Date(entry.scheduledDate).toLocaleDateString()}
                                       </p>
                                   </div>
                                   <div className="pl-3 border-l border-slate-200 dark:border-slate-700">
                                       <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Execução</p>
                                       <p className={`text-sm font-mono font-bold flex items-center gap-1 ${entry.performedDate ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 italic'}`}>
                                           {entry.performedDate ? (
                                               <><CheckCircle2 size={12}/> {new Date(entry.performedDate).toLocaleDateString()}</>
                                           ) : 'Pendente'}
                                       </p>
                                   </div>
                               </div>

                               {/* Details */}
                               <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                                   <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                                       <span className="flex items-center gap-2"><Beaker size={14}/> Produto</span>
                                       <span className="font-medium text-slate-900 dark:text-white">{entry.product}</span>
                                   </div>
                                   <div className="flex justify-between items-center pt-1">
                                       <span className="flex items-center gap-2"><Clock size={14}/> Frequência</span>
                                       <span className="font-mono text-xs uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{entry.frequency}</span>
                                   </div>
                               </div>

                               {/* Actions */}
                               <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                   <button 
                                    onClick={() => handleViewHistory(entry.target)} 
                                    className="col-span-1 p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600 rounded-xl flex items-center justify-center transition-colors"
                                    title="Histórico"
                                   >
                                       <History size={18} />
                                   </button>
                                   
                                   {entry.status !== 'REALIZADO' ? (
                                       <button 
                                        onClick={() => handleComplete(entry)} 
                                        className="col-span-3 p-3 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                       >
                                           <Check size={16} /> Concluir Serviço
                                       </button>
                                   ) : canEdit ? (
                                       <button 
                                        onClick={() => handleEdit(entry)} 
                                        className="col-span-2 p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-2"
                                       >
                                           <Edit2 size={16} /> Editar
                                       </button>
                                   ) : (
                                       <div className="col-span-3"></div>
                                   )}

                                   {canEdit && entry.status === 'REALIZADO' && (
                                       <button 
                                        onClick={() => handleDelete(entry.id)} 
                                        className="col-span-1 p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl flex items-center justify-center"
                                       >
                                           <Trash2 size={18} />
                                       </button>
                                   )}
                                   
                                   {canEdit && entry.status !== 'REALIZADO' && (
                                        <>
                                            <button onClick={() => handleEdit(entry)} className="hidden"></button>
                                            <button onClick={() => handleDelete(entry.id)} className="col-span-1 p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-xl flex items-center justify-center">
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                   )}
                               </div>
                           </div>
                       ))}
                   </div>

                   {/* DESKTOP VIEW (Table) */}
                   <div className="hidden md:block bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                       <div className="overflow-x-auto">
                           <table className="w-full text-left text-sm">
                               <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                   <tr>
                                       {isAdmin && <th className="px-6 py-4 font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold">Unidade</th>}
                                       <th className="px-6 py-4 font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold">Data Prevista</th>
                                       <th className="px-6 py-4 font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold">Praga Alvo</th>
                                       <th className="px-6 py-4 font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold">Produto / Método</th>
                                       <th className="px-6 py-4 font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold">Frequência</th>
                                       <th className="px-6 py-4 font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold text-center">Status</th>
                                       <th className="px-6 py-4 font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold text-right">Ações</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                   {filteredEntries.map(entry => (
                                       <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                                           {isAdmin && (
                                               <td className="px-6 py-4">
                                                   <span className="font-bold text-slate-600 dark:text-slate-400 font-mono">{entry.sedeId}</span>
                                               </td>
                                           )}
                                           <td className="px-6 py-4 whitespace-nowrap">
                                               <div className="flex flex-col">
                                                   <span className="font-bold text-slate-900 dark:text-white font-mono">
                                                       {new Date(entry.scheduledDate).toLocaleDateString()}
                                                   </span>
                                                   <span className="text-[10px] text-slate-400">
                                                       Realizado: {entry.performedDate ? new Date(entry.performedDate).toLocaleDateString() : '-'}
                                                   </span>
                                               </div>
                                           </td>
                                           <td className="px-6 py-4">
                                               <span className="font-bold text-slate-800 dark:text-slate-200">{entry.target}</span>
                                           </td>
                                           <td className="px-6 py-4">
                                               <div className="flex flex-col">
                                                   <span className="text-slate-700 dark:text-slate-300 font-medium">{entry.product}</span>
                                                   <span className="text-[10px] text-slate-500 truncate max-w-[150px]" title={entry.method}>{entry.method}</span>
                                               </div>
                                           </td>
                                           <td className="px-6 py-4">
                                               <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs font-mono uppercase">
                                                   {entry.frequency}
                                               </span>
                                           </td>
                                           <td className="px-6 py-4 text-center">
                                               <div className="flex justify-center">
                                                   {getStatusBadge(entry.status)}
                                               </div>
                                           </td>
                                           <td className="px-6 py-4 text-right">
                                               <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                   <button onClick={() => handleViewHistory(entry.target)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-purple-600 rounded-lg transition-colors" title="Histórico">
                                                       <History size={16} />
                                                   </button>
                                                   
                                                   {entry.status !== 'REALIZADO' && (
                                                       <button onClick={() => handleComplete(entry)} className="p-2 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title="Concluir">
                                                           <Check size={16} />
                                                       </button>
                                                   )}

                                                   {canEdit && (
                                                       <button onClick={() => handleEdit(entry)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-amber-600 rounded-lg transition-colors" title="Editar">
                                                           <Edit2 size={16} />
                                                       </button>
                                                   )}
                                                   
                                                   {canEdit && (
                                                       <button onClick={() => handleDelete(entry.id)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-red-600 rounded-lg transition-colors" title="Excluir">
                                                           <Trash2 size={16} />
                                                       </button>
                                                   )}
                                               </div>
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                   </div>
               </>
           )}
       </div>

       {/* Edit/Create Modal */}
       {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-2xl p-0 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
                   <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
                       <div>
                           <h3 className="font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider text-lg">
                               {isCompletionMode ? 'Concluir Serviço' : editingItem.id ? 'Editar Lançamento' : 'Novo Lançamento'}
                           </h3>
                           <p className="text-xs font-mono text-slate-500">Controle de Pragas</p>
                       </div>
                       <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-6 space-y-6">
                       
                       {/* ADMIN UNIT SELECTOR IN MODAL */}
                       {(isAdmin || availableSedes.length > 1) && !isCompletionMode && (
                           <div className="space-y-1">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unidade / Sede</label>
                               <select 
                                   className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm uppercase"
                                   value={editingItem.sedeId}
                                   onChange={e => setEditingItem({...editingItem, sedeId: e.target.value})}
                                   disabled={!!editingItem.id && editingItem.id.length < 13 && !editingItem.id.startsWith('new')} // Only disable if existing ID looks like mock
                               >
                                   <option value="">Selecione uma unidade...</option>
                                   {availableSedes.map(sede => (
                                       <option key={sede.id} value={sede.id}>{sede.name}</option>
                                   ))}
                               </select>
                           </div>
                       )}

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Praga Alvo</label>
                               <select 
                                   className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm disabled:opacity-60"
                                   value={editingItem.target}
                                   onChange={e => setEditingItem({...editingItem, target: e.target.value})}
                                   disabled={isCompletionMode}
                               >
                                   <option value="">Selecione...</option>
                                   {PEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                               </select>
                           </div>
                           <div className="space-y-1">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Produto</label>
                               <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm disabled:opacity-60" 
                                   value={editingItem.product} onChange={e => setEditingItem({...editingItem, product: e.target.value})} placeholder="Ex: Racumin" 
                                   disabled={isCompletionMode}
                               />
                           </div>
                           <div className="space-y-1">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Frequência (Visual)</label>
                               <select className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm disabled:opacity-60"
                                   value={editingItem.frequency} onChange={e => setEditingItem({...editingItem, frequency: e.target.value})} disabled={isCompletionMode}>
                                   <option value="Semanal">Semanal</option>
                                   <option value="Quinzenal">Quinzenal</option>
                                   <option value="Mensal">Mensal</option>
                                   <option value="Trimestral">Trimestral</option>
                               </select>
                           </div>
                           <div className="space-y-1">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Técnico / Dedetizador</label>
                               <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm disabled:opacity-60" 
                                   value={editingItem.technician} onChange={e => setEditingItem({...editingItem, technician: e.target.value})} 
                                   disabled={isCompletionMode}
                               />
                           </div>
                       </div>

                       <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Método de Aplicação</label>
                           <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm disabled:opacity-60" 
                               value={editingItem.method} onChange={e => setEditingItem({...editingItem, method: e.target.value})} placeholder="Ex: Isca nas caixas de passagem" 
                               disabled={isCompletionMode}
                           />
                       </div>

                       <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl space-y-4">
                           <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase mb-1">
                               <Calendar size={14} /> Cronograma
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                   <label className="text-[10px] font-bold text-slate-500 uppercase">Data Prevista</label>
                                   <input type="date" className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono disabled:opacity-60" 
                                       value={editingItem.scheduledDate} onChange={e => setEditingItem({...editingItem, scheduledDate: e.target.value})} 
                                       disabled={isCompletionMode}
                                   />
                               </div>
                               <div className="space-y-1">
                                   <label className="text-[10px] font-bold text-emerald-600 uppercase">Data Realizada</label>
                                   <input type="date" className="w-full p-2 bg-white dark:bg-slate-950 border border-emerald-500 dark:border-emerald-700 rounded-lg text-sm font-mono text-emerald-700 dark:text-emerald-400 font-bold" 
                                       value={editingItem.performedDate || ''} onChange={e => setEditingItem({...editingItem, performedDate: e.target.value})} />
                                   {isCompletionMode && <p className="text-[9px] text-emerald-600 mt-1">* Confirmar a data de execução.</p>}
                               </div>
                           </div>
                       </div>

                       <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Observações</label>
                           <textarea className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" rows={2}
                               value={editingItem.observation} onChange={e => setEditingItem({...editingItem, observation: e.target.value})} />
                       </div>
                   </div>

                   <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-black/20">
                       <button onClick={handleSave} className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 uppercase tracking-widest font-mono text-sm transition-all flex items-center justify-center gap-2">
                           {isCompletionMode ? <Check size={18} /> : <Save size={18} />}
                           {isCompletionMode ? 'CONFIRMAR E GERAR PRÓXIMO' : 'SALVAR REGISTRO'}
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* History Modal */}
       {isHistoryOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-lg p-0 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[80vh]">
                   <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
                       <div>
                           <h3 className="font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider text-lg">
                               Histórico - {historyTarget}
                           </h3>
                           <p className="text-xs font-mono text-slate-500">
                                {selectedSedeId ? `Unidade ${selectedSedeId}` : isAdmin ? 'Todas as Unidades' : 'Suas Unidades'}
                           </p>
                       </div>
                       <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-6 space-y-4">
                       {historyItems.length === 0 ? (
                           <div className="text-center text-slate-400 py-10 font-mono text-xs">Nenhum histórico encontrado.</div>
                       ) : (
                           historyItems.map(h => (
                               <div key={h.id} className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 pb-4 last:pb-0">
                                   <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-400"></div>
                                   <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                       <div className="flex justify-between items-center mb-2">
                                           <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{new Date(h.performedDate!).toLocaleDateString()}</span>
                                           <span className="text-[10px] text-slate-500 uppercase">{h.technician} ({h.sedeId})</span>
                                       </div>
                                       <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{h.product} - {h.method}</p>
                                       {h.observation && <p className="text-[10px] italic text-slate-400">Obs: {h.observation}</p>}
                                   </div>
                               </div>
                           ))
                       )}
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
