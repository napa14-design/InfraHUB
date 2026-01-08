
import React, { useState, useEffect } from 'react';
import { 
  Droplet, Edit, X, Search, ArrowLeft,
  Waves, Box, History, User as UserIcon, ChevronRight,
  Download, Activity, Filter, Settings, FileText, Calendar, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, HydroPoco, HydroCisterna, HydroCaixa, UserRole, HydroSettings } from '../../types';
import { hydroService } from '../../services/hydroService';
import { EmptyState } from '../Shared/EmptyState';

type Tab = 'pocos' | 'cisternas' | 'caixas';

export const HydroReservatorios: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('pocos');
  const [pocos, setPocos] = useState<HydroPoco[]>([]);
  const [cisternas, setCisternas] = useState<HydroCisterna[]>([]);
  const [caixas, setCaixas] = useState<HydroCaixa[]>([]);
  const [filterText, setFilterText] = useState('');
  const [settings, setSettings] = useState<HydroSettings | null>(null);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [historyItem, setHistoryItem] = useState<any>(null);

  useEffect(() => { refreshData(); }, [user]);

  const refreshData = async () => {
    setPocos(await hydroService.getPocos(user));
    setCisternas(await hydroService.getCisternas(user));
    setCaixas(await hydroService.getCaixas(user));
    setSettings(await hydroService.getSettings());
  };

  const handleEdit = (item: any) => { setEditItem({ ...item }); setIsModalOpen(true); };
  const handleHistory = (item: any) => { setHistoryItem(item); setIsHistoryOpen(true); };
  const handleSave = async () => {
      if (activeTab === 'pocos') await hydroService.savePoco(editItem);
      else if (activeTab === 'cisternas') await hydroService.saveCisterna(editItem);
      else await hydroService.saveCaixa(editItem);
      await refreshData();
      setIsModalOpen(false);
  };

  // --- AUTOMATION HELPERS ---
  const calculateNextDate = (dateStr: string, months: number) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      // Data entry is usually local, ensure we don't shift due to timezone when creating object
      // Simply adding months to the date object
      d.setMonth(d.getMonth() + months);
      return d.toISOString().split('T')[0];
  };

  const determineStatus = (nextDateStr: string) => {
      if (!nextDateStr) return 'PENDENTE';
      const today = new Date();
      // Reset time to avoid issues
      today.setHours(0,0,0,0);
      const next = new Date(nextDateStr);
      return next >= today ? 'DENTRO DO PRAZO' : 'FORA DO PRAZO';
  };

  const handleDateChange = (field: 'LIMPEZA' | 'FILTRO', dateValue: string) => {
      // Get Duration from Settings (Default to 6 if not loaded yet)
      const duration = field === 'LIMPEZA' 
        ? (settings?.validadeLimpezaMeses || 6) 
        : (settings?.validadeFiltroMeses || 6);

      const nextDate = calculateNextDate(dateValue, duration);
      const status = determineStatus(nextDate);

      if (field === 'LIMPEZA') {
          setEditItem((prev: any) => ({
              ...prev,
              dataUltimaLimpeza: dateValue,
              proximaLimpeza: nextDate,
              situacaoLimpeza: status
          }));
      } else {
          setEditItem((prev: any) => ({
              ...prev,
              ultimaTrocaFiltro: dateValue,
              proximaTrocaFiltro: nextDate,
              situacaoFiltro: status
          }));
      }
  };

  const TabButton = ({ id, label, count, icon: Icon }: { id: Tab, label: string, count: number, icon: any }) => (
    <button
        onClick={() => { setActiveTab(id); setFilterText(''); }}
        className={`
            flex-1 py-4 text-xs md:text-sm font-bold rounded-2xl transition-all flex flex-col md:flex-row items-center justify-center gap-2 border-2 uppercase tracking-wide
            ${activeTab === id 
                ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 text-cyan-700 dark:text-cyan-300' 
                : 'bg-white dark:bg-slate-900/50 border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
        `}
    >
        <Icon size={18} className={activeTab === id ? 'text-cyan-600' : 'text-slate-400'} />
        <span>{label}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === id ? 'bg-cyan-200 text-cyan-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{count}</span>
    </button>
  );

  const filterList = (list: any[]) => {
      if (!filterText) return list;
      return list.filter(i => i.local.toLowerCase().includes(filterText.toLowerCase()) || i.sedeId.toLowerCase().includes(filterText.toLowerCase()));
  };

  const renderTimelineDate = (label: string, date: string, status?: 'done' | 'pending' | 'future') => (
      <div className="flex flex-col items-center flex-1 relative">
          <div className="text-[9px] uppercase font-bold text-slate-400 mb-1.5">{label}</div>
          <div className={`px-2 py-1 rounded text-[10px] font-bold border font-mono ${!date ? 'bg-slate-50 text-slate-300 border-slate-100 dark:bg-slate-800 dark:border-slate-700' : status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30' : status === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20' : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
              {date ? new Date(date).toLocaleDateString() : '--/--/--'}
          </div>
      </div>
  );

  const data = activeTab === 'pocos' ? filterList(pocos) : activeTab === 'cisternas' ? filterList(cisternas) : filterList(caixas);

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
                                <Droplet size={28} className="text-cyan-600 dark:text-cyan-500" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                                    RESERVATÓRIOS
                                </h1>
                                <p className="text-slate-500 dark:text-white/30 text-xs md:text-sm font-mono mt-0.5">
                                    Poços, Cisternas e Caixas d'água.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-64 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar Local..." 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* TABS */}
            <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <TabButton id="pocos" label="Poços Artesianos" count={pocos.length} icon={Activity} />
                <TabButton id="cisternas" label="Cisternas" count={cisternas.length} icon={Waves} />
                <TabButton id="caixas" label="Caixas D'água" count={caixas.length} icon={Box} />
            </div>

            {/* LIST */}
            {data.length === 0 ? (
                <EmptyState icon={Droplet} title="Nenhum registro" description={`Não encontramos ${activeTab} na busca.`} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
                    {data.map((item: any) => (
                        <div key={item.id} className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800/60 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden group">
                            {/* Card Header */}
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 relative">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-bl-3xl"></div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">{item.sedeId}</span>
                                            <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 px-2 py-0.5 rounded">{activeTab === 'pocos' ? 'POÇO' : activeTab === 'cisternas' ? 'CISTERNA' : 'CAIXA'}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{item.local}</h3>
                                    </div>
                                    <div className={`px-2 py-1 rounded border text-[9px] font-bold uppercase tracking-wider ${item.situacaoLimpeza?.includes('DENTRO') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                        {item.situacaoLimpeza || 'PENDENTE'}
                                    </div>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-5 space-y-5 flex-1">
                                {activeTab === 'pocos' ? (
                                    <>
                                        <div>
                                            <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase text-slate-400">
                                                <Droplet size={12} className="text-cyan-500" /> Cronograma Limpeza
                                            </div>
                                            <div className="flex items-center gap-1 justify-between">
                                                {renderTimelineDate('Última', item.dataUltimaLimpeza, 'done')}
                                                <ChevronRight size={12} className="text-slate-300"/>
                                                {renderTimelineDate('Próxima', item.proximaLimpeza, 'future')}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-950/30 rounded-xl p-3 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                            <div className="flex gap-2 items-center">
                                                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/20 rounded text-amber-600"><Filter size={12}/></div>
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase text-slate-400">Filtro</p>
                                                    <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{item.refil || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold uppercase text-slate-400">Vencimento</p>
                                                <p className={`text-xs font-mono font-bold ${item.situacaoFiltro === 'FORA DO PRAZO' ? 'text-red-500' : 'text-emerald-500'}`}>{item.proximaTrocaFiltro ? new Date(item.proximaTrocaFiltro).toLocaleDateString() : '-'}</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex gap-4 text-xs text-slate-500">
                                            <div><span className="font-bold text-slate-900 dark:text-white">{item.capacidade || '-'} L</span> Cap.</div>
                                            <div className="w-px h-3 bg-slate-300"></div>
                                            <div><span className="font-bold text-slate-900 dark:text-white">{item.numCelulas}</span> Células</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className={`p-2 rounded-lg border text-center ${item.dataLimpeza1 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                                <p className="text-[9px] font-bold uppercase text-slate-400">1º Semestre</p>
                                                <p className={`text-xs font-bold ${item.dataLimpeza1 ? 'text-emerald-600' : 'text-slate-400'}`}>{item.dataLimpeza1 ? new Date(item.dataLimpeza1).toLocaleDateString() : 'PENDENTE'}</p>
                                            </div>
                                            <div className={`p-2 rounded-lg border text-center ${item.dataLimpeza2 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                                <p className="text-[9px] font-bold uppercase text-slate-400">2º Semestre</p>
                                                <p className={`text-xs font-bold ${item.dataLimpeza2 ? 'text-emerald-600' : 'text-slate-400'}`}>{item.dataLimpeza2 ? new Date(item.dataLimpeza2).toLocaleDateString() : 'PENDENTE'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><UserIcon size={12}/> {item.responsavel || 'N/A'}</div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleHistory(item)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"><History size={16}/></button>
                                    <button onClick={() => handleEdit(item)} className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1"><Edit size={12} /> Editar</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL EDIT (Full Featured) */}
            {isModalOpen && editItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-2xl p-0 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider text-lg">
                                    {editItem.local}
                                </h3>
                                <p className="text-xs font-mono text-slate-500">{editItem.tipo} - {editItem.sedeId}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* 1. Common Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Localização</label>
                                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" 
                                        value={editItem.local} onChange={e => setEditItem({...editItem, local: e.target.value})} placeholder="Ex: Subsolo 1" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Responsável</label>
                                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" 
                                        value={editItem.responsavel} onChange={e => setEditItem({...editItem, responsavel: e.target.value})} placeholder="Nome do Técnico" />
                                </div>
                            </div>

                            {/* 2. Type Specific Fields */}
                            {editItem.tipo === 'POCO' && (
                                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl space-y-4">
                                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs uppercase mb-1">
                                        <FileText size={14} /> Dados do Poço
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* REMOVED BAIRRO FIELD */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Ref. Bomba</label>
                                            <input className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" 
                                                value={editItem.referenciaBomba || ''} onChange={e => setEditItem({...editItem, referenciaBomba: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Ficha Operacional (Link/ID)</label>
                                            <input className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" 
                                                value={editItem.fichaOperacional || ''} onChange={e => setEditItem({...editItem, fichaOperacional: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(editItem.tipo === 'CISTERNA' || editItem.tipo === 'CAIXA') && (
                                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl space-y-4">
                                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase mb-1">
                                        <Box size={14} /> Capacidade e Estrutura
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Capacidade (L)</label>
                                            <input className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" 
                                                value={editItem.capacidade || ''} onChange={e => setEditItem({...editItem, capacidade: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Nº Células</label>
                                            <input type="number" className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" 
                                                value={editItem.numCelulas || ''} onChange={e => setEditItem({...editItem, numCelulas: parseInt(e.target.value)})} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. Maintenance Sections */}
                            
                            {/* POÇO: Filtro Config */}
                            {editItem.tipo === 'POCO' && (
                                <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl space-y-4">
                                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase mb-1">
                                        <Filter size={14} /> Manutenção do Filtro
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Tipo Refil</label>
                                            <input className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" 
                                                value={editItem.refil || ''} onChange={e => setEditItem({...editItem, refil: e.target.value})} placeholder='Ex: 10"' />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Última Troca</label>
                                            <input type="date" className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" 
                                                value={editItem.ultimaTrocaFiltro || ''} onChange={e => handleDateChange('FILTRO', e.target.value)} />
                                        </div>
                                        <div className="space-y-1 relative group">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">Próxima Troca <Lock size={8}/></label>
                                            <input type="date" className="w-full p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-500 cursor-not-allowed" 
                                                value={editItem.proximaTrocaFiltro || ''} readOnly />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Cleaning Schedule (Common Logic but different fields for Cist/Caixa) */}
                            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl space-y-4">
                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase mb-1">
                                    <Calendar size={14} /> Cronograma de Limpeza
                                </div>
                                
                                {editItem.tipo === 'POCO' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Data Realização</label>
                                            <input type="date" className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" 
                                                value={editItem.dataUltimaLimpeza || ''} onChange={e => handleDateChange('LIMPEZA', e.target.value)} />
                                        </div>
                                        <div className="space-y-1 relative">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">Próxima Limpeza <Lock size={8}/></label>
                                            <input type="date" className="w-full p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-500 cursor-not-allowed" 
                                                value={editItem.proximaLimpeza || ''} readOnly />
                                        </div>
                                    </div>
                                ) : (
                                    /* CAIXA / CISTERNA - SEMESTRAL LOGIC */
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-emerald-100 dark:border-emerald-900/30">
                                            <div className="col-span-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">1º Semestre</div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Previsão</label>
                                                <input type="date" className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" 
                                                    value={editItem.previsaoLimpeza1 || ''} onChange={e => setEditItem({...editItem, previsaoLimpeza1: e.target.value})} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Realização</label>
                                                <input type="date" className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" 
                                                    value={editItem.dataLimpeza1 || ''} onChange={e => setEditItem({...editItem, dataLimpeza1: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">2º Semestre</div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Previsão</label>
                                                <input type="date" className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" 
                                                    value={editItem.previsaoLimpeza2 || ''} onChange={e => setEditItem({...editItem, previsaoLimpeza2: e.target.value})} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Realização</label>
                                                <input type="date" className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" 
                                                    value={editItem.dataLimpeza2 || ''} onChange={e => setEditItem({...editItem, dataLimpeza2: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-1 pt-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">Status Geral <Lock size={8}/></label>
                                    <select className="w-full p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono text-slate-500 cursor-not-allowed"
                                        value={editItem.situacaoLimpeza} disabled
                                    >
                                        <option value="PENDENTE">PENDENTE</option>
                                        <option value="DENTRO DO PRAZO">DENTRO DO PRAZO</option>
                                        <option value="FORA DO PRAZO">FORA DO PRAZO</option>
                                        <option value="DESATIVADO">DESATIVADO</option>
                                    </select>
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-black/20">
                            <button onClick={handleSave} className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 uppercase tracking-widest font-mono text-sm transition-all">
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
