import React, { useState, useEffect } from 'react';
import { 
  Droplet, Edit, CheckCircle, X, Calendar, Settings, 
  Filter, Activity, FileText, AlertCircle, Search, ArrowRight,
  Waves, Box, History, User as UserIcon, AlertTriangle, ChevronRight,
  Download
} from 'lucide-react';
import { User, HydroPoco, HydroCisterna, HydroCaixa, UserRole } from '../../types';
import { hydroService } from '../../services/hydroService';
import { EmptyState } from '../Shared/EmptyState';

type Tab = 'pocos' | 'cisternas' | 'caixas';

export const HydroReservatorios: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<Tab>('pocos');
  const [pocos, setPocos] = useState<HydroPoco[]>([]);
  const [cisternas, setCisternas] = useState<HydroCisterna[]>([]);
  const [caixas, setCaixas] = useState<HydroCaixa[]>([]);
  const [filterText, setFilterText] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [historyItem, setHistoryItem] = useState<any>(null);

  useEffect(() => {
    refreshData();
  }, [user]);

  const refreshData = () => {
    setPocos(hydroService.getPocos(user));
    setCisternas(hydroService.getCisternas(user));
    setCaixas(hydroService.getCaixas(user));
  };

  const handleEdit = (item: any) => {
    setEditItem({ ...item });
    setIsModalOpen(true);
  };

  const handleHistory = (item: any) => {
      setHistoryItem(item);
      setIsHistoryOpen(true);
  };

  const handleSave = () => {
      if (activeTab === 'pocos') hydroService.savePoco(editItem);
      else if (activeTab === 'cisternas') hydroService.saveCisterna(editItem);
      else hydroService.saveCaixa(editItem);
      refreshData();
      setIsModalOpen(false);
  };

  const TabButton = ({ id, label, count, icon: Icon }: { id: Tab, label: string, count: number, icon: any }) => (
    <button
        onClick={() => { setActiveTab(id); setFilterText(''); }}
        className={`
            flex-1 py-4 text-sm font-bold rounded-2xl transition-all flex flex-col md:flex-row items-center justify-center gap-2 border-2
            ${activeTab === id 
                ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 text-cyan-700 dark:text-cyan-300' 
                : 'bg-white dark:bg-slate-900 border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
        `}
    >
        <Icon size={20} className={activeTab === id ? 'text-cyan-600' : 'text-slate-400'} />
        <span>{label}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === id ? 'bg-cyan-200 text-cyan-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{count}</span>
    </button>
  );

  const getStatusColor = (status: string) => {
      const s = status?.toUpperCase() || '';
      if (s.includes('DENTRO') || s.includes('OK')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      if (s.includes('FORA') || s.includes('VENCIDO')) return 'text-red-600 bg-red-50 border-red-100';
      return 'text-slate-500 bg-slate-100 border-slate-200';
  };

  // Filter Logic
  const filterList = (list: any[]) => {
      if (!filterText) return list;
      return list.filter(i => 
          i.local.toLowerCase().includes(filterText.toLowerCase()) ||
          i.sedeId.toLowerCase().includes(filterText.toLowerCase())
      );
  };

  // --- RENDERERS ---

  const renderTimelineDate = (label: string, date: string, status?: 'done' | 'pending' | 'future') => (
      <div className="flex flex-col items-center flex-1 relative">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">{label}</div>
          <div className={`
              px-3 py-1.5 rounded-lg text-sm font-bold border
              ${!date 
                  ? 'bg-slate-50 text-slate-300 border-slate-100 dark:bg-slate-800 dark:border-slate-700' 
                  : status === 'done' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20' 
                      : status === 'pending'
                          ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20'
                          : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }
          `}>
              {date || '--/--/----'}
          </div>
      </div>
  );

  const renderPocoCard = (item: HydroPoco) => (
    <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
        {/* Header Clean */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">{item.sedeId}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(item.situacaoLimpeza)}`}>
                        {item.situacaoLimpeza}
                    </span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{item.local}</h3>
                {item.bairro && <p className="text-xs text-slate-400 mt-1">{item.bairro}</p>}
            </div>
            
            {/* Responsável - Clean Look */}
            <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-slate-500">
                    <UserIcon size={12} />
                    {item.responsavel || 'N/A'}
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
            
            {/* Timeline Visual */}
            <div>
                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-900 dark:text-white">
                    <Droplet size={14} className="text-cyan-500" />
                    Cronograma de Higienização
                </div>
                <div className="flex items-center gap-2">
                    {renderTimelineDate('Última', item.dataUltimaLimpeza, 'done')}
                    <ChevronRight size={16} className="text-slate-300 mt-5"/>
                    {renderTimelineDate('Atual', item.dataLimpeza, item.dataLimpeza ? 'done' : 'pending')}
                    <ChevronRight size={16} className="text-slate-300 mt-5"/>
                    {renderTimelineDate('Próxima', item.previsaoLimpeza1_2026, 'future')}
                </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

            {/* Tech Specs */}
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-900 dark:text-white">
                        <Settings size={14} className="text-slate-400" /> Equipamento
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs">
                            <span className="text-slate-400 block mb-0.5">Bomba</span>
                            {item.referenciaBomba ? (
                                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{item.referenciaBomba}</span>
                            ) : (
                                <span className="text-slate-300 text-[10px] italic">Não informado</span>
                            )}
                        </div>
                        <div className="text-xs pt-1">
                            <span className="text-slate-400 block mb-0.5">Refil</span>
                            {item.refil ? (
                                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{item.refil}</span>
                            ) : (
                                <span className="text-slate-300 text-[10px] italic">-</span>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-900 dark:text-white">
                        <Filter size={14} className="text-amber-500" /> Status Filtro
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-slate-400">Vencimento</span>
                            <span className={`text-xs font-bold ${item.situacaoFiltro === 'FORA DO PRAZO' ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                {item.proximaTrocaFiltro || '-'}
                            </span>
                        </div>
                        <div className={`text-[9px] font-bold uppercase tracking-wider ${item.situacaoFiltro === 'FORA DO PRAZO' ? 'text-red-500' : 'text-emerald-500'}`}>
                            {item.situacaoFiltro || 'N/A'}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex gap-2">
                {item.fichaOperacional && (
                    <a href={item.fichaOperacional} target="_blank" className="p-2.5 text-slate-500 hover:text-cyan-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 transition-all" title="Ficha Operacional">
                        <FileText size={18}/>
                    </a>
                )}
                <button onClick={() => handleHistory(item)} className="p-2.5 text-slate-500 hover:text-purple-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 transition-all" title="Ver Histórico">
                    <History size={18}/>
                </button>
            </div>
            
            <button 
                onClick={() => handleEdit(item)}
                className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2"
            >
                <Edit size={16} /> Atualizar
            </button>
        </div>
    </div>
  );

  const renderReservatorioCard = (item: HydroCisterna | HydroCaixa, type: 'Cisterna' | 'Caixa') => (
    <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 relative z-10 flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">{item.sedeId}</span>
                    <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 px-2 py-0.5 rounded border border-cyan-100 dark:border-cyan-900/30">{type.toUpperCase()}</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{item.local}</h3>
                
                <div className="flex gap-4 mt-3 text-xs text-slate-500">
                    <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{item.capacidade || '-'} L</span> Cap.
                    </div>
                    <div className="w-px h-3 bg-slate-300"></div>
                    <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{item.numCelulas}</span> Células
                    </div>
                </div>
            </div>
            <div className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(item.situacao)}`}>
                 {item.situacao}
            </div>
        </div>

        <div className="p-6 space-y-6 flex-1 relative z-10">
            {/* Timeline Semestral */}
            <div className="relative">
                <div className="absolute left-[19px] top-8 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
                
                <div className="space-y-6">
                    {/* Semestre 1 */}
                    <div className="flex gap-4 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-white dark:border-slate-900 ${item.dataLimpeza1 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            <span className="text-xs font-bold">1º</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Semestre 1</p>
                            {item.dataLimpeza1 ? (
                                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/30 inline-block">
                                    Realizado: {item.dataLimpeza1}
                                </div>
                            ) : (
                                <div className="text-sm font-medium text-slate-500">
                                    Previsão: <span className="font-bold text-slate-700 dark:text-slate-300">{item.previsaoLimpeza1_2025 || 'Não agendado'}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Semestre 2 */}
                    <div className="flex gap-4 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-white dark:border-slate-900 ${item.dataLimpeza2 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            <span className="text-xs font-bold">2º</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Semestre 2</p>
                            {item.dataLimpeza2 ? (
                                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/30 inline-block">
                                    Realizado: {item.dataLimpeza2}
                                </div>
                            ) : (
                                <div className="text-sm font-medium text-slate-500">
                                    Previsão: <span className="font-bold text-slate-700 dark:text-slate-300">{item.previsaoLimpeza2_2025 || 'Não agendado'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
             <div className="text-xs text-slate-500 flex items-center gap-1.5 pl-2">
                <UserIcon size={12} /> {item.responsavel}
             </div>
             
             <div className="flex gap-2">
                <button onClick={() => handleHistory(item)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-white rounded-lg transition-all" title="Histórico">
                    <History size={18}/>
                </button>
                <button 
                    onClick={() => handleEdit(item)}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-2"
                >
                    <Edit size={14} /> Atualizar
                </button>
             </div>
        </div>
    </div>
  );

  const data = activeTab === 'pocos' ? filterList(pocos) : activeTab === 'cisternas' ? filterList(cisternas) : filterList(caixas);

  return (
    <div className="space-y-8 animate-in fade-in pb-20 md:pb-0">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Droplet className="text-cyan-600" />
                Gestão de Reservatórios
              </h1>
              <p className="text-sm text-slate-500">Controle de limpeza, bombas e manutenção de ativos.</p>
          </div>
          
          <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                  type="text" 
                  placeholder="Buscar Local ou Sede..." 
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
              />
          </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col md:flex-row gap-4">
          <TabButton id="pocos" label="Poços" count={pocos.length} icon={Activity} />
          <TabButton id="cisternas" label="Cisternas" count={cisternas.length} icon={Waves} />
          <TabButton id="caixas" label="Caixas D'água" count={caixas.length} icon={Box} />
      </div>

      {/* Content Grid */}
      {data.length === 0 ? (
          <EmptyState 
            icon={Droplet}
            title="Nenhum registro encontrado"
            description={`Não encontramos ${activeTab} correspondentes à sua busca.`}
          />
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeTab === 'pocos' && data.map((item: any) => renderPocoCard(item))}
              {activeTab === 'cisternas' && data.map((item: any) => renderReservatorioCard(item, 'Cisterna'))}
              {activeTab === 'caixas' && data.map((item: any) => renderReservatorioCard(item, 'Caixa'))}
          </div>
      )}

      {/* EDIT MODAL */}
      {isModalOpen && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Atualizar Registro</h3>
                        <p className="text-sm text-slate-500">{editItem.local} - {editItem.sedeId}</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="text-slate-500" /></button>
                </div>
                
                <div className="space-y-6">
                    {/* Campos Específicos POÇOS */}
                    {activeTab === 'pocos' && (
                        <>
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ref. Bomba</label>
                                   <input className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm" 
                                          value={editItem.referenciaBomba || ''} 
                                          onChange={e => setEditItem({...editItem, referenciaBomba: e.target.value})} 
                                          placeholder="Ex: MB-37"
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Refil Filtro</label>
                                   <input className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm" 
                                          value={editItem.refil || ''} 
                                          onChange={e => setEditItem({...editItem, refil: e.target.value})} 
                                          placeholder='Ex: 10"'
                                   />
                               </div>
                           </div>

                           {/* Permissão para alterar responsável */}
                           {(user.role === UserRole.ADMIN || user.role === UserRole.GESTOR) && (
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Responsável Técnico</label>
                                   <input className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm" 
                                          value={editItem.responsavel || ''} 
                                          onChange={e => setEditItem({...editItem, responsavel: e.target.value})} 
                                   />
                               </div>
                           )}

                           <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                               <h4 className="text-blue-700 dark:text-blue-400 font-bold text-sm mb-3 flex items-center gap-2"><Droplet size={14}/> Datas de Limpeza</h4>
                               <div className="grid grid-cols-2 gap-3">
                                   <div>
                                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Última (2024)</label>
                                       <input type="date" className="w-full p-2 rounded-lg border border-slate-200 text-sm" value={editItem.dataUltimaLimpeza || ''} onChange={e => setEditItem({...editItem, dataUltimaLimpeza: e.target.value})} />
                                   </div>
                                   <div>
                                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Atual (2025)</label>
                                       <input type="date" className="w-full p-2 rounded-lg border border-slate-200 text-sm" value={editItem.dataLimpeza || ''} onChange={e => setEditItem({...editItem, dataLimpeza: e.target.value})} />
                                   </div>
                                   <div className="col-span-2">
                                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Previsão 2026</label>
                                       <input type="date" className="w-full p-2 rounded-lg border border-slate-200 text-sm" value={editItem.previsaoLimpeza1_2026 || ''} onChange={e => setEditItem({...editItem, previsaoLimpeza1_2026: e.target.value})} />
                                   </div>
                               </div>
                           </div>

                           <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                               <h4 className="text-amber-700 dark:text-amber-400 font-bold text-sm mb-3 flex items-center gap-2"><Filter size={14}/> Manutenção Filtro</h4>
                               <div className="grid grid-cols-2 gap-3">
                                   <div>
                                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Última Troca</label>
                                       <input type="date" className="w-full p-2 rounded-lg border border-slate-200 text-sm" value={editItem.ultimaTrocaFiltro || ''} onChange={e => setEditItem({...editItem, ultimaTrocaFiltro: e.target.value})} />
                                   </div>
                                   <div>
                                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Próxima Troca</label>
                                       <input type="date" className="w-full p-2 rounded-lg border border-slate-200 text-sm" value={editItem.proximaTrocaFiltro || ''} onChange={e => setEditItem({...editItem, proximaTrocaFiltro: e.target.value})} />
                                   </div>
                               </div>
                           </div>
                        </>
                    )}

                    {/* Campos Específicos RESERVATÓRIOS */}
                    {(activeTab === 'cisternas' || activeTab === 'caixas') && (
                        <>
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Capacidade</label>
                                   <input className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" 
                                          value={editItem.capacidade || ''} 
                                          onChange={e => setEditItem({...editItem, capacidade: e.target.value})} 
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nº Células</label>
                                   <input type="number" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" 
                                          value={editItem.numCelulas || 0} 
                                          onChange={e => setEditItem({...editItem, numCelulas: parseInt(e.target.value)})} 
                                   />
                               </div>
                           </div>

                           <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-4">
                               <div className="grid grid-cols-2 gap-4 items-center">
                                   <span className="text-sm font-bold text-slate-600 dark:text-slate-300">1ª Limpeza</span>
                                   <input type="date" className="w-full p-2 rounded-lg border border-slate-200" value={editItem.dataLimpeza1 || ''} onChange={e => setEditItem({...editItem, dataLimpeza1: e.target.value})} />
                               </div>
                               <div className="grid grid-cols-2 gap-4 items-center">
                                   <span className="text-sm font-bold text-slate-600 dark:text-slate-300">2ª Limpeza</span>
                                   <input type="date" className="w-full p-2 rounded-lg border border-slate-200" value={editItem.dataLimpeza2 || ''} onChange={e => setEditItem({...editItem, dataLimpeza2: e.target.value})} />
                               </div>
                           </div>
                        </>
                    )}
                    
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button onClick={handleSave} className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all">
                            Salvar Alterações
                        </button>
                    </div>
                </div>
             </div>
        </div>
      )}

      {/* HISTORY MODAL (SIMULATED) */}
      {isHistoryOpen && historyItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Histórico de Atividades</h3>
                          <p className="text-sm text-slate-500">{historyItem.local}</p>
                      </div>
                      <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="text-slate-500" /></button>
                  </div>

                  <div className="space-y-6 relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                        {/* Simulation: Using the 'Last' date as a history entry */}
                        {historyItem.dataUltimaLimpeza && (
                            <div className="relative">
                                <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-slate-900"></div>
                                <p className="text-xs font-bold text-slate-400 mb-1">{new Date(historyItem.dataUltimaLimpeza).toLocaleDateString()}</p>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Higienização Realizada</p>
                                    <p className="text-xs text-slate-500">Executado conforme cronograma.</p>
                                </div>
                            </div>
                        )}

                        {/* Current Cleaning */}
                        {historyItem.dataLimpeza ? (
                            <div className="relative">
                                <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></div>
                                <p className="text-xs font-bold text-emerald-600 mb-1">{new Date(historyItem.dataLimpeza).toLocaleDateString()}</p>
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                    <p className="font-bold text-sm text-emerald-800 dark:text-emerald-400">Ciclo Atual Concluído</p>
                                    <p className="text-xs text-emerald-600/80">Registro ativo no sistema.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative opacity-50">
                                <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900"></div>
                                <p className="text-xs font-bold text-slate-400 mb-1">Ciclo 2025</p>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-dashed border-slate-300">
                                    <p className="font-bold text-sm text-slate-500">Pendente</p>
                                </div>
                            </div>
                        )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                      <button className="text-sm text-cyan-600 font-bold hover:underline flex items-center justify-center gap-1">
                          <Download size={14} /> Exportar Relatório Completo
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};