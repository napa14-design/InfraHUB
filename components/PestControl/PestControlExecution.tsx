
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, ShieldAlert, Plus, Calendar, Filter, 
    Search, CheckCircle2, AlertTriangle, Clock, 
    Edit2, Trash2, Save, X, Check, User as UserIcon, 
    Bug, Beaker, ClipboardList, History, CalendarCheck, AlertCircle
} from 'lucide-react';
import { User, PestControlEntry, UserRole, Sede, PestControlSettings } from '../../types';
import { pestService } from '../../services/pestService';
import { notificationService } from '../../services/notificationService';
import { orgService } from '../../services/orgService';

// Helper de Data Robusto (Ignora Fuso Horário para comparação de dias puros)
// Se target (data agendada) for MENOR que hoje (00:00), retorna negativo (Atrasado).
const getDaysDiff = (dateStr: string) => {
    if (!dateStr) return 0;
    const now = new Date();
    // Resetar hoje para meia-noite absoluta local
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Parse manual da string YYYY-MM-DD para garantir data local correta
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
  
  // Delete Modal State
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

  // Lógica de Status Dinâmico
  const getDynamicStatus = (entry: PestControlEntry) => {
      if (entry.status === 'REALIZADO') return 'REALIZADO';
      const diff = getDaysDiff(entry.scheduledDate);
      if (diff < 0) return 'ATRASADO';
      return 'PENDENTE';
  };

  useEffect(() => {
      let res = entries;
      
      // Filter by Sede
      if (selectedSedeId) res = res.filter(e => e.sedeId === selectedSedeId);
      
      // Filter by Search
      if (search) {
          const lower = search.toLowerCase();
          res = res.filter(e => 
              e.target.toLowerCase().includes(lower) || 
              (e.product || '').toLowerCase().includes(lower) ||
              e.technician.toLowerCase().includes(lower) ||
              (e.method || '').toLowerCase().includes(lower)
          );
      }
      
      // Filter by Status (Dynamic)
      if (statusFilter !== 'ALL') {
          res = res.filter(e => getDynamicStatus(e) === statusFilter);
      }

      // Sort: Atrasados first, then by date
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
      setEditingItem({ 
          ...item, 
          performedDate: new Date().toISOString().split('T')[0], 
          status: 'REALIZADO' 
      });
      setIsModalOpen(true);
  };

  const requestDelete = (item: PestControlEntry, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); // CRUCIAL: Stop event bubbling
      setItemToDelete(item);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      if(itemToDelete) {
          try {
            // Optimistic Update
            setEntries(prev => prev.filter(i => i.id !== itemToDelete.id));
            await pestService.delete(itemToDelete.id);
            await refreshData();
          } catch (e) {
            console.error("Delete failed", e);
            alert("Erro ao excluir. Verifique sua conexão ou permissões.");
            await refreshData(); // Revert
          } finally {
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
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
      // Validate mandatory fields for completion
      if (editingItem.performedDate) {
          if (!editingItem.product || !editingItem.method) {
              alert("Para concluir o serviço, é obrigatório informar o Produto e o Método utilizados.");
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
          alert("Preencha todos os campos obrigatórios (Praga, Data, Unidade).");
      }
  };

  // Stats Calculation
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

  const StatusBadge = ({ status, diff }: { status: string, diff: number }) => {
      if (status === 'REALIZADO') {
          return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle2 size={12}/> Realizado</span>;
      }
      if (status === 'ATRASADO') {
          return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-200 animate-pulse"><AlertTriangle size={12}/> Atrasado ({Math.abs(diff)}d)</span>;
      }
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 border border-amber-200"><Clock size={12}/> Pendente</span>;
  };

  const ActionButtons = ({ entry, dynamicStatus }: { entry: PestControlEntry, dynamicStatus: string }) => (
      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleViewHistory(entry)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Histórico">
              <History size={18}/>
          </button>
          
          {canEdit && (
              <button onClick={() => handleEdit(entry)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                  <Edit2 size={18}/>
              </button>
          )}

          {dynamicStatus !== 'REALIZADO' && canEdit && (
              <button onClick={() => handleComplete(entry)} className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm" title="Concluir / Renovar">
                  <CheckCircle2 size={20} />
              </button>
          )}
          
          {canEdit && (
              <button 
                onClick={(e) => requestDelete(entry, e)} 
                className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                title="Excluir"
              >
                  <Trash2 size={18}/>
              </button>
          )}
      </div>
  );

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0A0A0C] pb-20">
       
       {/* Top Bar */}
       <div className="bg-white dark:bg-[#111114] border-b border-slate-200 dark:border-slate-800 pt-6 pb-6 px-4 md:px-6 sticky top-0 z-30 shadow-sm">
           <div className="max-w-7xl mx-auto space-y-6">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <button onClick={() => navigate('/module/pestcontrol')} className="flex items-center text-slate-500 hover:text-amber-600 transition-colors text-xs font-mono uppercase tracking-widest mb-2">
                            <ArrowLeft size={14} className="mr-1" /> Voltar ao Painel
                        </button>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-3 uppercase tracking-tight">
                            <ShieldAlert className="text-amber-600" size={28} /> Cronograma
                        </h1>
                    </div>
                    {canEdit && (
                        <button onClick={handleAddNew} className="w-full md:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                            <Plus size={18} /> Novo Agendamento
                        </button>
                    )}
               </div>

               {/* Stats & Filters */}
               <div className="flex flex-col xl:flex-row gap-6 items-end">
                   <div className="grid grid-cols-3 gap-2 w-full xl:w-auto">
                       <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-2 md:p-3 rounded-xl flex flex-col items-center justify-center min-w-[100px]">
                           <span className="text-xl font-black text-red-600 dark:text-red-400">{stats.delayed}</span>
                           <span className="text-[9px] font-bold text-red-400 uppercase">Atrasados</span>
                       </div>
                       <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-2 md:p-3 rounded-xl flex flex-col items-center justify-center min-w-[100px]">
                           <span className="text-xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</span>
                           <span className="text-[9px] font-bold text-amber-400 uppercase">Pendentes</span>
                       </div>
                       <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-2 md:p-3 rounded-xl flex flex-col items-center justify-center min-w-[100px]">
                           <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.completedMonth}</span>
                           <span className="text-[9px] font-bold text-emerald-400 uppercase">Feitos (Mês)</span>
                       </div>
                   </div>

                   <div className="flex-1 w-full flex flex-wrap gap-2 items-center justify-end bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl">
                       {['ALL', 'PENDENTE', 'ATRASADO', 'REALIZADO'].map(st => (
                           <button key={st} onClick={() => setStatusFilter(st as any)} className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${statusFilter === st ? 'bg-white dark:bg-slate-800 text-amber-600 border-slate-200 dark:border-slate-700 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-white/50'}`}>
                               {st === 'ALL' ? 'Todos' : st}
                           </button>
                       ))}
                       {availableSedes.length > 0 && (
                           <select className="bg-white dark:bg-slate-800 border-none text-xs font-bold p-2 rounded-lg outline-none text-slate-600 dark:text-slate-300 min-w-[120px]" value={selectedSedeId} onChange={e => setSelectedSedeId(e.target.value)}>
                               {isAdmin && <option value="">Todas Unidades</option>}
                               {availableSedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                           </select>
                       )}
                   </div>
               </div>
           </div>
       </div>
       
       <div className="max-w-7xl mx-auto p-4 md:p-6">
           {/* MOBILE CARDS VIEW (md:hidden) */}
           <div className="md:hidden space-y-4">
                {filteredEntries.length === 0 ? (
                    <div className="p-8 text-center text-slate-400"><ClipboardList size={32} className="mx-auto mb-2 opacity-50"/><p className="text-xs uppercase">Nada encontrado.</p></div>
                ) : (
                    filteredEntries.map(entry => {
                        const dynamicStatus = getDynamicStatus(entry);
                        const diff = getDaysDiff(entry.scheduledDate);
                        return (
                            <div key={entry.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${dynamicStatus === 'ATRASADO' ? 'bg-red-500' : dynamicStatus === 'REALIZADO' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                <div className="pl-3 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 uppercase">{entry.sedeId}</span>
                                                <span className="text-[10px] font-mono text-slate-400">{new Date(entry.scheduledDate).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 dark:text-white uppercase text-sm flex items-center gap-2"><Bug size={14} className="text-amber-500"/> {entry.target}</h3>
                                        </div>
                                        <StatusBadge status={dynamicStatus} diff={diff} />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <span className="block text-[9px] text-slate-400 uppercase font-bold">Método</span> 
                                            {entry.method || <span className="text-slate-300 italic">A Definir</span>}
                                        </div>
                                        <div>
                                            <span className="block text-[9px] text-slate-400 uppercase font-bold">Técnico</span> 
                                            {entry.technician}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{entry.frequency}</span>
                                        <ActionButtons entry={entry} dynamicStatus={dynamicStatus} />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
           </div>

           {/* DESKTOP TABLE VIEW (hidden on mobile) */}
           <div className="hidden md:block bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
               <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                       <tr>
                           <th className="px-6 py-4 text-[10px] text-slate-500 font-black uppercase tracking-wider">Data Programada</th>
                           <th className="px-6 py-4 text-[10px] text-slate-500 font-black uppercase tracking-wider">Local</th>
                           <th className="px-6 py-4 text-[10px] text-slate-500 font-black uppercase tracking-wider">Serviço / Praga</th>
                           <th className="px-6 py-4 text-[10px] text-slate-500 font-black uppercase tracking-wider">Detalhes Técnicos</th>
                           <th className="px-6 py-4 text-[10px] text-slate-500 font-black uppercase tracking-wider">Status</th>
                           <th className="px-6 py-4 text-[10px] text-slate-500 font-black uppercase tracking-wider text-right">Ação</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                       {filteredEntries.length === 0 ? (
                           <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-mono text-xs uppercase flex flex-col items-center justify-center"><ClipboardList size={32} className="mb-2 opacity-50"/>Nenhum registro encontrado.</td></tr>
                       ) : (
                           filteredEntries.map(entry => {
                               const dynamicStatus = getDynamicStatus(entry);
                               const diff = getDaysDiff(entry.scheduledDate);
                               const hasDetails = entry.method && entry.product;

                               return (
                                   <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                                       <td className="px-6 py-4">
                                           <div className="flex items-center gap-2 font-mono font-black text-slate-900 dark:text-white">
                                               <Calendar size={14} className="text-slate-400"/>
                                               {new Date(entry.scheduledDate).toLocaleDateString()}
                                           </div>
                                           {entry.performedDate && (
                                               <span className="text-[10px] text-emerald-600 font-bold ml-6 block">Feito: {new Date(entry.performedDate).toLocaleDateString()}</span>
                                           )}
                                       </td>
                                       <td className="px-6 py-4">
                                           <div className="flex items-center gap-2">
                                               <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500 border border-slate-200 dark:border-slate-700">{entry.sedeId}</div>
                                               {isAdmin && <span className="text-[10px] text-slate-400 uppercase hidden xl:inline">{availableSedes.find(s=>s.id===entry.sedeId)?.name}</span>}
                                           </div>
                                       </td>
                                       <td className="px-6 py-4">
                                           <div className="font-black text-slate-700 dark:text-slate-300 uppercase text-xs flex items-center gap-2">
                                               <Bug size={14} className="text-amber-500"/> {entry.target}
                                           </div>
                                           <div className="text-[10px] font-bold text-slate-400 pl-6 uppercase tracking-wider">{entry.frequency}</div>
                                       </td>
                                       <td className="px-6 py-4">
                                           {hasDetails ? (
                                               <div className="space-y-1">
                                                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded w-fit">
                                                       <Beaker size={10}/> {entry.method}
                                                   </div>
                                                   <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                                                       <UserIcon size={10}/> {entry.technician}
                                                   </div>
                                               </div>
                                           ) : (
                                               <span className="text-[10px] text-slate-400 italic bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded">
                                                   A Definir na Execução
                                               </span>
                                           )}
                                       </td>
                                       <td className="px-6 py-4">
                                           <StatusBadge status={dynamicStatus} diff={diff} />
                                       </td>
                                       <td className="px-6 py-4 text-right">
                                            <ActionButtons entry={entry} dynamicStatus={dynamicStatus} />
                                       </td>
                                   </tr>
                               );
                           })
                       )}
                   </tbody>
               </table>
           </div>
       </div>

       {/* MODAL EDIT / COMPLETE / NEW */}
       {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                   <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
                       <h3 className="font-bold text-slate-900 dark:text-white uppercase font-mono tracking-tighter text-lg">
                           {editingItem.id && editingItem.performedDate ? 'Concluir Serviço (Baixa)' : editingItem.id ? 'Editar Serviço' : 'Novo Agendamento'}
                       </h3>
                       <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-6 space-y-6">
                       {/* Section 1: Basic Info */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Unidade</label>
                               <select className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" 
                                value={editingItem.sedeId} 
                                onChange={e => setEditingItem({...editingItem, sedeId: e.target.value})} 
                                disabled={!!editingItem.performedDate && !!editingItem.status && editingItem.status === 'REALIZADO'}
                               >
                                   {availableSedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                               </select>
                           </div>
                           <div className="space-y-1">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Data Prevista</label>
                               <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" 
                                value={editingItem.scheduledDate} 
                                onChange={e => setEditingItem({...editingItem, scheduledDate: e.target.value})} 
                               />
                           </div>
                       </div>

                       {/* Section 2: Technical Details */}
                       <div className="p-5 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
                           <h4 className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-2"><Bug size={14}/> Detalhes Técnicos</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Praga Alvo</label>
                                    <select className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" value={editingItem.target} onChange={e => setEditingItem({...editingItem, target: e.target.value})}>
                                        {settings?.pestTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Frequência</label>
                                    <input className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" value={editingItem.frequency} onChange={e => setEditingItem({...editingItem, frequency: e.target.value})} placeholder="Ex: Quinzenal" />
                                </div>
                                
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        Método {editingItem.performedDate && <span className="text-red-500">*</span>}
                                    </label>
                                    <input 
                                        className={`w-full p-2 bg-white dark:bg-slate-900 border rounded-lg text-sm font-mono ${editingItem.performedDate && !editingItem.method ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-200 dark:border-slate-700'}`} 
                                        value={editingItem.method} 
                                        onChange={e => setEditingItem({...editingItem, method: e.target.value})} 
                                        placeholder="Ex: Pulverização" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        Produto {editingItem.performedDate && <span className="text-red-500">*</span>}
                                    </label>
                                    <input 
                                        className={`w-full p-2 bg-white dark:bg-slate-900 border rounded-lg text-sm font-mono ${editingItem.performedDate && !editingItem.product ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-200 dark:border-slate-700'}`} 
                                        value={editingItem.product} 
                                        onChange={e => setEditingItem({...editingItem, product: e.target.value})} 
                                        placeholder="Químico Utilizado" 
                                    />
                                </div>
                           </div>
                       </div>

                       {/* Section 3: Execution (Only if completing or editing executed) */}
                       <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Técnico Responsável</label>
                           <select className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" value={editingItem.technician} onChange={e => setEditingItem({...editingItem, technician: e.target.value})}>
                               <option value="">Selecione...</option>
                               {settings?.technicians.map(t => <option key={t} value={t}>{t}</option>)}
                           </select>
                       </div>

                       {editingItem.performedDate !== undefined && (
                           <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl animate-in slide-in-from-bottom-2">
                               <label className="text-[10px] font-black text-emerald-600 uppercase mb-2 block flex items-center gap-2"><CheckCircle2 size={14}/> Confirmação de Execução</label>
                               <input type="date" className="w-full p-3 bg-white dark:bg-slate-950 border border-emerald-500 rounded-xl text-sm font-black font-mono text-emerald-600" value={editingItem.performedDate} onChange={e => setEditingItem({...editingItem, performedDate: e.target.value})} />
                               <div className="mt-3">
                                   <label className="text-[10px] font-bold text-slate-400 uppercase">Observações do Serviço</label>
                                   <textarea className="w-full p-3 mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono" rows={2} value={editingItem.observation || ''} onChange={e => setEditingItem({...editingItem, observation: e.target.value})} placeholder="Ex: Área externa isolada..."></textarea>
                                </div>
                               <p className="text-[10px] text-slate-400 mt-2 font-mono ml-1">
                                   * Ao confirmar, a próxima visita será agendada automaticamente. Campos de Método e Produto são obrigatórios para baixa.
                               </p>
                           </div>
                       )}
                   </div>

                   <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-black/20">
                       <button onClick={handleSave} className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black rounded-2xl shadow-xl shadow-amber-500/30 uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2">
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
                                   <div key={item.id} className="relative pl-6">
                                       <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${item.status === 'REALIZADO' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                       <div className="flex justify-between items-start">
                                           <div>
                                               <p className="font-bold text-slate-800 dark:text-white text-sm">{new Date(item.scheduledDate).toLocaleDateString()}</p>
                                               <p className="text-xs text-slate-500 flex items-center gap-1"><UserIcon size={10}/> {item.technician || 'Sem técnico'}</p>
                                           </div>
                                           <div className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${item.status === 'REALIZADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                               {item.status}
                                           </div>
                                       </div>
                                       {item.performedDate && (
                                           <div className="mt-2 text-[10px] bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                                               <p className="text-emerald-600 font-mono font-bold flex items-center gap-1"><CalendarCheck size={10}/> Executado em: {new Date(item.performedDate).toLocaleDateString()}</p>
                                               {item.product && <p className="text-slate-500 mt-1"><span className="font-bold">PROD:</span> {item.product}</p>}
                                               {item.method && <p className="text-slate-500"><span className="font-bold">MET:</span> {item.method}</p>}
                                           </div>
                                       )}
                                       {item.observation && (
                                           <p className="text-xs text-slate-500 mt-1 italic">"{item.observation}"</p>
                                       )}
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
               <div className="bg-white dark:bg-[#111114] border border-red-200 dark:border-red-900/50 w-full max-w-sm p-8 text-center relative overflow-hidden rounded-2xl animate-in zoom-in-95 shadow-2xl">
                   <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
                   <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 flex items-center justify-center mx-auto mb-6 rounded-full border border-red-200 dark:border-red-800">
                       <AlertCircle size={32} />
                   </div>
                   
                   <h3 className="text-xl font-mono font-bold text-slate-900 dark:text-white mb-2 uppercase">CONFIRMAR EXCLUSÃO</h3>
                   <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                       Ação irreversível.<br/>
                       Deseja realmente remover o agendamento de <strong className="text-slate-900 dark:text-white">{itemToDelete.target}</strong>?
                   </p>

                   <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => setIsDeleteModalOpen(false)}
                         className="py-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-mono text-xs font-bold uppercase hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors rounded-xl"
                       >
                           CANCELAR
                       </button>
                       <button 
                         onClick={confirmDelete}
                         className="py-3 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase transition-colors rounded-xl shadow-lg shadow-red-500/20"
                       >
                           CONFIRMAR
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
