
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, ShieldAlert, Plus, Calendar, Filter, 
    Search, CheckCircle2, AlertTriangle, Clock, 
    Edit2, Trash2, Save, X, Check, User as UserIcon, 
    Bug, Beaker, ClipboardList, History, CalendarCheck, AlertCircle, MapPin
} from 'lucide-react';
import { User, PestControlEntry, UserRole, Sede, PestControlSettings } from '../../types';
import { pestService } from '../../services/pestService';
import { notificationService } from '../../services/notificationService';
import { orgService } from '../../services/orgService';
import { Breadcrumbs } from '../Shared/Breadcrumbs';

// Helper de Data Robusto (Ignora Fuso Horário para comparação de dias puros)
const getDaysDiff = (dateStr: string) => {
    if (!dateStr) return 0;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [year, month, day] = dateStr.split('-').map(Number);
    const target = new Date(year, month - 1, day);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const PestControlExecution: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<PestControlEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<PestControlEntry[]>([]);
  const [settings, setSettings] = useState<PestControlSettings | null>(null);
  
  const [search, setSearch] = useState('');
  const [selectedSedeId, setSelectedSedeId] = useState('');
  const [availableSedes, setAvailableSedes] = useState<Sede[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDENTE' | 'REALIZADO' | 'ATRASADO'>('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PestControlEntry | null>(null);
  
  const [editingItem, setEditingItem] = useState<Partial<PestControlEntry>>({});
  const [historyItems, setHistoryItems] = useState<PestControlEntry[]>([]);
  const [historyTitle, setHistoryTitle] = useState('');

  const canEdit = user.role === UserRole.ADMIN || user.role === UserRole.GESTOR;
  const isAdmin = user.role === UserRole.ADMIN;

  useEffect(() => {
      const init = async () => {
          const sedes = orgService.getSedes();
          const userSedes = isAdmin ? sedes : sedes.filter(s => (user.sedeIds || []).includes(s.id));
          setAvailableSedes(userSedes);
          if (isAdmin) setSelectedSedeId(''); 
          else if (userSedes.length > 0) setSelectedSedeId(userSedes[0].id);

          await refreshData();
      };
      init();
  }, [user]);

  const refreshData = async () => {
      const [data, s] = await Promise.all([ pestService.getAll(user), pestService.getSettings() ]);
      setEntries(data);
      setSettings(s);
  };

  const getDynamicStatus = (entry: PestControlEntry) => {
      if (entry.status === 'REALIZADO') return 'REALIZADO';
      const diff = getDaysDiff(entry.scheduledDate);
      if (diff < 0) return 'ATRASADO';
      return 'PENDENTE';
  };

  useEffect(() => {
      let res = entries;
      if (selectedSedeId) res = res.filter(e => e.sedeId === selectedSedeId);
      if (search) {
          const lower = search.toLowerCase();
          res = res.filter(e => 
              e.target.toLowerCase().includes(lower) || 
              (e.product || '').toLowerCase().includes(lower) ||
              e.technician.toLowerCase().includes(lower) ||
              (e.method || '').toLowerCase().includes(lower)
          );
      }
      if (statusFilter !== 'ALL') {
          res = res.filter(e => getDynamicStatus(e) === statusFilter);
      }
      res.sort((a, b) => {
          const statusA = getDynamicStatus(a);
          const statusB = getDynamicStatus(b);
          if (statusA === 'ATRASADO' && statusB !== 'ATRASADO') return -1;
          if (statusB === 'ATRASADO' && statusA !== 'ATRASADO') return 1;
          return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      });
      setFilteredEntries(res);
  }, [entries, search, selectedSedeId, statusFilter]);

  const handleAddNew = () => {
      setEditingItem({
          id: Date.now().toString(),
          sedeId: selectedSedeId || (availableSedes.length > 0 ? availableSedes[0].id : ''),
          item: 'Dedetização',
          target: settings?.pestTypes[0] || '',
          product: '',
          frequency: 'Quinzenal',
          method: '',
          technician: settings?.technicians[0] || '',
          scheduledDate: new Date().toISOString().split('T')[0],
          status: 'PENDENTE'
      });
      setIsModalOpen(true);
  };

  const handleEdit = (item: PestControlEntry) => {
      setEditingItem({...item, performedDate: undefined}); 
      setIsModalOpen(true);
  };

  const handleComplete = (item: PestControlEntry) => {
      setEditingItem({ ...item, performedDate: new Date().toISOString().split('T')[0], status: 'REALIZADO' });
      setIsModalOpen(true);
  };

  const requestDelete = (item: PestControlEntry, e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      setItemToDelete(item);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      if(itemToDelete) {
          try {
            setEntries(prev => prev.filter(i => i.id !== itemToDelete.id));
            await pestService.delete(itemToDelete.id);
            await refreshData();
          } catch (e) {
            console.error("Delete failed", e);
            alert("Erro ao excluir.");
            await refreshData();
          } finally {
            setIsDeleteModalOpen(false); setItemToDelete(null);
          }
      }
  };

  const handleViewHistory = (item: PestControlEntry) => {
      const history = entries.filter(e => e.sedeId === item.sedeId && e.target === item.target)
                             .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
      setHistoryItems(history);
      setHistoryTitle(`${item.target} em ${item.sedeId}`);
      setIsHistoryOpen(true);
  };

  const handleSave = async () => {
      if (editingItem.performedDate) {
          if (!editingItem.product || !editingItem.method) {
              alert("Para concluir, é obrigatório informar Produto e Método.");
              return;
          }
          editingItem.status = 'REALIZADO';
      }
      if (editingItem.target && editingItem.scheduledDate && editingItem.sedeId) {
          await pestService.save(editingItem as PestControlEntry);
          await notificationService.markByLink('/module/pestcontrol/execution');
          await refreshData();
          setIsModalOpen(false);
      } else {
          alert("Preencha todos os campos obrigatórios.");
      }
  };

  const stats = {
      delayed: entries.filter(e => getDynamicStatus(e) === 'ATRASADO').length,
      pending: entries.filter(e => getDynamicStatus(e) === 'PENDENTE').length,
      completedMonth: entries.filter(e => {
          if (e.status !== 'REALIZADO' || !e.performedDate) return false;
          const d = new Date(e.performedDate);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length
  };

  const renderStatusPill = (status: string, diff: number) => {
      if (status === 'REALIZADO') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"><CheckCircle2 size={12}/> Concluído</span>;
      if (status === 'ATRASADO') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-500/10 text-red-600 border border-red-500/20 animate-pulse"><AlertTriangle size={12}/> Atrasado ({Math.abs(diff)}d)</span>;
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20"><Clock size={12}/> Aguardando</span>;
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0A0A0C] pb-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: `radial-gradient(#f59e0b 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
        </div>

       {/* Top Bar */}
       <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-md sticky top-0 z-30">
           <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
               <Breadcrumbs />
               <div className="flex flex-col gap-6">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-2 uppercase tracking-tight">
                                <ShieldAlert className="text-amber-600" size={24} /> Ordem de Serviço
                            </h1>
                        </div>
                        {canEdit && (
                            <button onClick={handleAddNew} className="w-full md:w-auto px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-lg">
                                <Plus size={16} /> Agendar
                            </button>
                        )}
                   </div>

                   {/* Filters Bar */}
                   <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                       {/* Stats Pills */}
                       <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                           <div className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex items-center gap-2 min-w-max">
                               <span className="text-lg font-black text-red-600 dark:text-red-400">{stats.delayed}</span>
                               <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Atrasos</span>
                           </div>
                           <div className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 flex items-center gap-2 min-w-max">
                               <span className="text-lg font-black text-amber-600 dark:text-amber-400">{stats.pending}</span>
                               <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Pendentes</span>
                           </div>
                           <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2 min-w-max">
                               <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stats.completedMonth}</span>
                               <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Realizados (Mês)</span>
                           </div>
                       </div>

                       {/* Controls */}
                       <div className="flex flex-1 w-full md:w-auto gap-2">
                           <div className="relative flex-1 group">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-amber-500 transition-colors" size={16} />
                               <input 
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-mono"
                                placeholder="Buscar praga, técnico..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                               />
                           </div>
                           {availableSedes.length > 0 && (
                               <select className="bg-slate-100 dark:bg-slate-900 border-none text-xs font-bold px-3 rounded-xl outline-none text-slate-600 dark:text-slate-300 min-w-[100px]" value={selectedSedeId} onChange={e => setSelectedSedeId(e.target.value)}>
                                   {isAdmin && <option value="">Global</option>}
                                   {availableSedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                           )}
                       </div>
                   </div>

                   {/* Status Tabs */}
                   <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-full md:w-fit overflow-x-auto">
                       {['ALL', 'PENDENTE', 'ATRASADO', 'REALIZADO'].map(st => (
                           <button 
                            key={st} 
                            onClick={() => setStatusFilter(st as any)} 
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === st ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                           >
                               {st === 'ALL' ? 'Todos' : st}
                           </button>
                       ))}
                   </div>
               </div>
           </div>
       </div>
       
       {/* List Content */}
       <div className="max-w-7xl mx-auto p-4 md:p-6">
           {filteredEntries.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4"><ClipboardList size={32} className="opacity-50"/></div>
                   <p className="text-sm font-bold uppercase tracking-wider">Nenhum serviço encontrado.</p>
               </div>
           ) : (
               <div className="grid grid-cols-1 gap-4">
                   {filteredEntries.map(entry => {
                       const dynamicStatus = getDynamicStatus(entry);
                       const diff = getDaysDiff(entry.scheduledDate);
                       
                       // Define Border Color
                       let borderColor = 'border-l-slate-300 dark:border-l-slate-700';
                       if (dynamicStatus === 'ATRASADO') borderColor = 'border-l-red-500';
                       else if (dynamicStatus === 'REALIZADO') borderColor = 'border-l-emerald-500';
                       else borderColor = 'border-l-amber-500';

                       return (
                           <div key={entry.id} className={`bg-white dark:bg-[#16161a] rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 border-l-[6px] ${borderColor} hover:shadow-md transition-all group relative overflow-hidden`}>
                               
                               <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                   {/* Info Block */}
                                   <div className="flex items-start gap-4 flex-1">
                                       {/* Date Box */}
                                       <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                           <span className="text-xs font-bold text-slate-400 uppercase">{new Date(entry.scheduledDate).toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                                           <span className="text-2xl font-black text-slate-800 dark:text-white font-mono">{new Date(entry.scheduledDate).getDate()}</span>
                                       </div>
                                       
                                       <div className="space-y-1">
                                           <div className="flex flex-wrap items-center gap-2">
                                               <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 uppercase tracking-wide border border-slate-200 dark:border-slate-700">{entry.sedeId}</span>
                                               {renderStatusPill(dynamicStatus, diff)}
                                           </div>
                                           <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2 group-hover:text-amber-600 transition-colors">
                                               {entry.target}
                                           </h3>
                                           <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                               <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded"><UserIcon size={12}/> {entry.technician}</span>
                                               <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded"><Calendar size={12}/> {entry.frequency}</span>
                                           </div>
                                       </div>
                                   </div>

                                   {/* Actions Block */}
                                   <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
                                       <button onClick={() => handleViewHistory(entry)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors" title="Histórico">
                                           <History size={20}/>
                                       </button>
                                       
                                       {canEdit && (
                                           <>
                                               <button onClick={() => handleEdit(entry)} className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-colors" title="Editar">
                                                   <Edit2 size={20}/>
                                               </button>
                                               {dynamicStatus !== 'REALIZADO' && (
                                                   <button onClick={() => handleComplete(entry)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20" title="Concluir Serviço">
                                                       <Check size={16} /> Baixa
                                                   </button>
                                               )}
                                               <button onClick={(e) => requestDelete(entry, e)} className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors" title="Excluir">
                                                   <Trash2 size={20}/>
                                               </button>
                                           </>
                                       )}
                                   </div>
                               </div>
                               
                               {/* Footer Details (Methods) */}
                               {(entry.method || entry.product) && (
                                   <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                                       {entry.method && <span className="flex items-center gap-1.5"><Beaker size={12} className="text-purple-500"/> <strong className="text-slate-700 dark:text-slate-300">MET:</strong> {entry.method}</span>}
                                       {entry.product && <span className="flex items-center gap-1.5"><Bug size={12} className="text-amber-500"/> <strong className="text-slate-700 dark:text-slate-300">PROD:</strong> {entry.product}</span>}
                                   </div>
                               )}
                           </div>
                       );
                   })}
               </div>
           )}
       </div>

       {/* MODAL EDIT / COMPLETE / NEW */}
       {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-[#111114] rounded-[32px] w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-hidden">
                   <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-black/40">
                       <div>
                           <h3 className="font-black text-slate-900 dark:text-white uppercase font-mono tracking-tight text-xl">
                               {editingItem.id && editingItem.performedDate ? 'Finalizar Serviço' : editingItem.id ? 'Editar Agendamento' : 'Novo Serviço'}
                           </h3>
                           <p className="text-xs text-slate-500 font-medium mt-0.5">Preencha os dados técnicos da operação.</p>
                       </div>
                       <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"><X size={20} className="text-slate-500"/></button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-8 space-y-8">
                       {/* 1. Contexto */}
                       <section>
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin size={14}/> Localização e Data</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                               <div className="space-y-1.5">
                                   <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Unidade</label>
                                   <select className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-amber-500" 
                                    value={editingItem.sedeId} 
                                    onChange={e => setEditingItem({...editingItem, sedeId: e.target.value})} 
                                    disabled={!!editingItem.performedDate && !!editingItem.status && editingItem.status === 'REALIZADO'}
                                   >
                                       {availableSedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                   </select>
                               </div>
                               <div className="space-y-1.5">
                                   <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Data Prevista</label>
                                   <input type="date" className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-amber-500" 
                                    value={editingItem.scheduledDate} 
                                    onChange={e => setEditingItem({...editingItem, scheduledDate: e.target.value})} 
                                   />
                               </div>
                           </div>
                       </section>

                       <hr className="border-slate-100 dark:border-slate-800" />

                       {/* 2. Técnico */}
                       <section>
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Bug size={14}/> Especificações Técnicas</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Praga Alvo</label>
                                    <select className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-amber-500" value={editingItem.target} onChange={e => setEditingItem({...editingItem, target: e.target.value})}>
                                        {settings?.pestTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Técnico Responsável</label>
                                    <select className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-amber-500" value={editingItem.technician} onChange={e => setEditingItem({...editingItem, technician: e.target.value})}>
                                        <option value="">Selecione...</option>
                                        {settings?.technicians.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Frequência</label>
                                    <input className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-amber-500" value={editingItem.frequency} onChange={e => setEditingItem({...editingItem, frequency: e.target.value})} placeholder="Ex: Quinzenal" />
                                </div>
                           </div>
                       </section>

                       {/* 3. Execução (Condicional) */}
                       <div className={`transition-all duration-500 ${editingItem.performedDate !== undefined ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4'}`}>
                           <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl space-y-5">
                               <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-800/50 pb-3">
                                   <CheckCircle2 size={18}/>
                                   <h4 className="font-black uppercase text-sm">Dados de Baixa (Obrigatório)</h4>
                               </div>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                   <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Data Realização</label>
                                        <input type="date" className="w-full p-3 bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-bold text-emerald-600 outline-none" value={editingItem.performedDate || ''} onChange={e => setEditingItem({...editingItem, performedDate: e.target.value})} />
                                   </div>
                                   <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Produto Químico</label>
                                        <input className="w-full p-3 bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm outline-none" value={editingItem.product} onChange={e => setEditingItem({...editingItem, product: e.target.value})} placeholder="Ex: K-Othrine" />
                                   </div>
                                   <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Método de Aplicação</label>
                                        <input className="w-full p-3 bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm outline-none" value={editingItem.method} onChange={e => setEditingItem({...editingItem, method: e.target.value})} placeholder="Ex: Pulverização em área externa" />
                                   </div>
                                   <div className="space-y-1.5 md:col-span-2">
                                       <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Observações</label>
                                       <textarea className="w-full p-3 bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm outline-none resize-none" rows={2} value={editingItem.observation || ''} onChange={e => setEditingItem({...editingItem, observation: e.target.value})} placeholder="Notas adicionais..."></textarea>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>

                   <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-black/20 flex gap-3">
                       <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold uppercase text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
                       <button onClick={handleSave} className="flex-[2] py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl shadow-xl uppercase tracking-widest text-xs transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2">
                           <Save size={18} /> {editingItem.performedDate ? 'Confirmar Execução' : 'Salvar Alterações'}
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* MODAL HISTORY */}
       {isHistoryOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                   <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
                       <div>
                           <h3 className="font-bold text-slate-900 dark:text-white uppercase font-mono tracking-tighter">Histórico de Serviços</h3>
                           <p className="text-xs text-slate-500">{historyTitle}</p>
                       </div>
                       <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-6 space-y-6">
                       {historyItems.length === 0 ? (
                           <div className="text-center py-10 text-slate-400">
                               <History size={40} className="mx-auto mb-2 opacity-30"/>
                               <p className="text-xs font-mono uppercase">Nenhum histórico encontrado.</p>
                           </div>
                       ) : (
                           <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8">
                               {historyItems.map((item, idx) => (
                                   <div key={item.id} className="relative pl-6 group">
                                       <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-[#111114] ${item.status === 'REALIZADO' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                       <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-black text-slate-800 dark:text-white text-sm">{new Date(item.scheduledDate).toLocaleDateString()}</p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><UserIcon size={10}/> {item.technician || 'Sem técnico'}</p>
                                                </div>
                                                <div className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${item.status === 'REALIZADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {item.status}
                                                </div>
                                            </div>
                                            {item.performedDate && (
                                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-[10px]">
                                                    <p className="text-emerald-600 font-mono font-bold flex items-center gap-1 mb-1"><CalendarCheck size={10}/> Realizado: {new Date(item.performedDate).toLocaleDateString()}</p>
                                                    {item.product && <p className="text-slate-500"><span className="font-bold">Prod:</span> {item.product}</p>}
                                                    {item.method && <p className="text-slate-500"><span className="font-bold">Método:</span> {item.method}</p>}
                                                </div>
                                            )}
                                       </div>
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
               </div>
           </div>
       )}

       {/* DELETE CONFIRMATION MODAL */}
       {isDeleteModalOpen && itemToDelete && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-[#111114] border border-red-200 dark:border-red-900/50 w-full max-w-sm p-8 text-center relative overflow-hidden rounded-3xl animate-in zoom-in-95 shadow-2xl">
                   <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
                   <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 flex items-center justify-center mx-auto mb-6 rounded-full border border-red-100 dark:border-red-800">
                       <AlertCircle size={32} />
                   </div>
                   
                   <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Confirmar Exclusão</h3>
                   <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                       Você está prestes a remover o agendamento de <br/><strong className="text-slate-900 dark:text-white">{itemToDelete.target}</strong>. <br/>Esta ação não pode ser desfeita.
                   </p>

                   <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => setIsDeleteModalOpen(false)}
                         className="py-3.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors rounded-xl"
                       >
                           Cancelar
                       </button>
                       <button 
                         onClick={confirmDelete}
                         className="py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase transition-colors rounded-xl shadow-lg shadow-red-500/20"
                       >
                           Confirmar
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
