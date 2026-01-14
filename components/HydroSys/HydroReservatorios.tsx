
import React, { useState, useEffect } from 'react';
import { 
  Droplet, Edit, X, Search, ArrowLeft,
  Waves, Box, History, User as UserIcon, ChevronRight,
  Download, Activity, Filter, Settings, FileText, Calendar, Lock, RotateCw, Building2,
  AlertCircle, CheckCircle2, FileJson, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, HydroPoco, HydroCisterna, HydroCaixa, UserRole, HydroSettings, Sede, LogEntry } from '../../types';
import { hydroService } from '../../services/hydroService';
import { orgService } from '../../services/orgService';
import { logService } from '../../services/logService';
import { EmptyState } from '../Shared/EmptyState';

type Tab = 'pocos' | 'cisternas' | 'caixas';

// Helper para formatar data ignorando fuso horário (UTC vs Local)
const formatDate = (dateStr: string) => {
    if (!dateStr) return '--/--/--';
    // Se estiver no formato ISO YYYY-MM-DD
    if (dateStr.includes('-')) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
};

// Helper para calcular status dinamicamente baseado na data de hoje
const getComputedStatus = (dateStr?: string) => {
    if (!dateStr) return 'PENDENTE';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day); // Mês é 0-indexado

    if (targetDate < today) return 'FORA DO PRAZO';
    return 'DENTRO DO PRAZO';
};

export const HydroReservatorios: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('pocos');
  const [pocos, setPocos] = useState<HydroPoco[]>([]);
  const [cisternas, setCisternas] = useState<HydroCisterna[]>([]);
  const [caixas, setCaixas] = useState<HydroCaixa[]>([]);
  
  // Filters
  const [filterText, setFilterText] = useState('');
  const [selectedSedeFilter, setSelectedSedeFilter] = useState<string>('');
  const [availableSedes, setAvailableSedes] = useState<Sede[]>([]);
  
  // Settings
  const [settings, setSettings] = useState<HydroSettings>({
    validadeCertificadoMeses: 6,
    validadeFiltroMeses: 6,
    validadeLimpezaCaixa: 6,
    validadeLimpezaCisterna: 6,
    validadeLimpezaPoco: 6,
    cloroMin: 1.0,
    cloroMax: 3.0,
    phMin: 7.4,
    phMax: 7.6
  });
  
  // Modals & History State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<LogEntry[]>([]);
  
  const [editItem, setEditItem] = useState<any>(null);
  const [historyItem, setHistoryItem] = useState<any>(null);

  const isAdmin = user.role === UserRole.ADMIN;

  useEffect(() => { refreshData(); loadSedes(); }, [user]);

  const loadSedes = () => {
      const allSedes = orgService.getSedes();
      setAvailableSedes(user.role === UserRole.ADMIN ? allSedes : allSedes.filter(s => (user.sedeIds || []).includes(s.id)));
  };

  const refreshData = async () => {
    setPocos(await hydroService.getPocos(user));
    setCisternas(await hydroService.getCisternas(user));
    setCaixas(await hydroService.getCaixas(user));
    setSettings(await hydroService.getSettings());
  };

  const handleEdit = (item: any) => { setEditItem({ ...item }); setIsModalOpen(true); };
  
  const handleHistory = async (item: any) => { 
      setHistoryItem(item); 
      setIsHistoryOpen(true); 
      setLoadingHistory(true);
      
      try {
          const allLogs = await logService.getAll();
          const relevant = allLogs.filter(l => 
              l.module === 'HYDROSYS' && 
              (l.target.includes(item.local) || (l.details && l.details.includes(item.local)))
          );
          setHistoryLogs(relevant);
      } catch (e) {
          console.error("Erro ao buscar histórico", e);
      } finally {
          setLoadingHistory(false);
      }
  };

  const handleSave = async () => {
      // Recalcula status antes de salvar para persistir corretamente
      if (editItem.proximaLimpeza) {
          editItem.situacaoLimpeza = getComputedStatus(editItem.proximaLimpeza);
      }
      if (editItem.tipo === 'POCO' && editItem.proximaTrocaFiltro) {
          editItem.situacaoFiltro = getComputedStatus(editItem.proximaTrocaFiltro);
      }

      if (activeTab === 'pocos') await hydroService.savePoco(editItem);
      else if (activeTab === 'cisternas') await hydroService.saveCisterna(editItem);
      else await hydroService.saveCaixa(editItem);
      await refreshData();
      setIsModalOpen(false);
  };

  const calculateNextDate = (dateStr: string, months: number) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      d.setMonth(d.getMonth() + months);
      return d.toISOString().split('T')[0];
  };

  const handleDateChange = (field: 'LIMPEZA' | 'FILTRO', dateValue: string) => {
      let duration = 6;
      if (field === 'LIMPEZA') {
          if (editItem.tipo === 'POCO') duration = settings.validadeLimpezaPoco || 6;
          else if (editItem.tipo === 'CISTERNA') duration = settings.validadeLimpezaCisterna || 6;
          else duration = settings.validadeLimpezaCaixa || 6;
      } else {
          duration = settings?.validadeFiltroMeses || 6;
      }

      const nextDate = calculateNextDate(dateValue, duration);
      // Calcula status imediatamente baseado na nova data calculada
      const status = getComputedStatus(nextDate);

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
                ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-md' 
                : 'bg-white dark:bg-slate-900/50 border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
        `}
    >
        <Icon size={18} className={activeTab === id ? 'text-cyan-600' : 'text-slate-400'} />
        <span>{label}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === id ? 'bg-cyan-200 text-cyan-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{count}</span>
    </button>
  );

  const filterList = (list: any[]) => {
      let result = list;
      if (isAdmin && selectedSedeFilter) result = result.filter(i => i.sedeId === selectedSedeFilter);
      if (filterText) result = result.filter(i => i.local.toLowerCase().includes(filterText.toLowerCase()) || i.sedeId.toLowerCase().includes(filterText.toLowerCase()));
      return result;
  };

  const data = activeTab === 'pocos' ? filterList(pocos) : activeTab === 'cisternas' ? filterList(cisternas) : filterList(caixas);

  // Helper para o Card de Poços
  const PocoStatusIndicator = ({ label, status, date }: { label: string, status: string, date?: string }) => {
      const isLate = status === 'FORA DO PRAZO';
      const isOk = status === 'DENTRO DO PRAZO';
      
      let colorClass = 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      if (isLate) colorClass = 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-900/30';
      else if (isOk) colorClass = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30';

      return (
          <div className={`p-2 rounded-xl border ${colorClass} flex flex-col items-center justify-center text-center flex-1`}>
              <span className="text-[9px] font-black uppercase mb-1 opacity-70">{label}</span>
              <span className="text-xs font-mono font-bold">{formatDate(date || '')}</span>
              <span className="text-[8px] uppercase font-bold mt-1 tracking-wider">
                  {isLate ? 'VENCIDO' : isOk ? 'EM DIA' : 'PENDENTE'}
              </span>
          </div>
      );
  };

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
                <div className="p-6 md:p-8 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="space-y-4 w-full lg:w-auto">
                        <button onClick={() => navigate('/module/hydrosys')} className="group flex items-center gap-2 text-slate-500 dark:text-white/40 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all text-xs font-mono uppercase tracking-widest">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel
                        </button>
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 border-2 border-cyan-500/20 dark:border-cyan-500/5 flex items-center justify-center bg-cyan-50 dark:bg-cyan-500/5 rounded-xl">
                                <Droplet size={28} className="text-cyan-600 dark:text-cyan-500" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono uppercase">
                                    RESERVATÓRIOS
                                </h1>
                                <p className="text-slate-500 dark:text-white/30 text-xs md:text-sm font-mono mt-0.5">
                                    Monitoramento de Limpeza e Manutenção.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
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

                        <div className="w-full sm:w-64 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Buscar Local..." 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-mono uppercase"
                                value={filterText}
                                onChange={e => setFilterText(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* TABS */}
            <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <TabButton id="pocos" label="Poços Artesianos" count={filterList(pocos).length} icon={Activity} />
                <TabButton id="cisternas" label="Cisternas" count={filterList(cisternas).length} icon={Waves} />
                <TabButton id="caixas" label="Caixas D'água" count={filterList(caixas).length} icon={Box} />
            </div>

            {/* LIST */}
            {data.length === 0 ? (
                <EmptyState icon={Droplet} title="Nenhum registro" description={selectedSedeFilter ? `Não encontramos ${activeTab} nesta unidade.` : `Não encontramos ${activeTab} na busca.`} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
                    {data.map((item: any) => {
                        // CALCULO DINAMICO DE STATUS (Ignora o texto do banco se a data já venceu)
                        const computedStatusLimpeza = getComputedStatus(item.proximaLimpeza);
                        const isDelayed = computedStatusLimpeza === 'FORA DO PRAZO';
                        
                        // Para Poços, calculamos o status do filtro também
                        const computedStatusFiltro = item.tipo === 'POCO' ? getComputedStatus(item.proximaTrocaFiltro) : 'PENDENTE';

                        return (
                            <div key={item.id} className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800/60 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden group">
                                {/* Card Header */}
                                <div className="p-5 border-b border-slate-100 dark:border-slate-800 relative">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-bl-3xl"></div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{item.sedeId}</span>
                                                <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 px-2 py-0.5 rounded">{activeTab === 'pocos' ? 'POÇO' : activeTab === 'cisternas' ? 'CISTERNA' : 'CAIXA'}</span>
                                            </div>
                                            <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight uppercase">{item.local}</h3>
                                        </div>
                                        {activeTab !== 'pocos' && (
                                            <div className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${!isDelayed ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100 animate-pulse'}`}>
                                                {computedStatusLimpeza}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-5 space-y-5 flex-1">
                                    {activeTab === 'pocos' ? (
                                        <>
                                            {/* Tech Info Row */}
                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                                    <Settings size={14} className="text-slate-400"/>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Ref. Bomba</p>
                                                        <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{item.referenciaBomba || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                                    <Filter size={14} className="text-slate-400"/>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Refil Filtro</p>
                                                        <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{item.refil || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Cleaning Status Block */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase text-slate-400">
                                                    <Droplet size={12} className="text-blue-500" /> Higienização / Limpeza
                                                </div>
                                                <div className="flex gap-2">
                                                    <PocoStatusIndicator label="Realizada" status="OK" date={item.dataUltimaLimpeza} />
                                                    <PocoStatusIndicator label="Vencimento" status={computedStatusLimpeza} date={item.proximaLimpeza} />
                                                </div>
                                            </div>

                                            {/* Filter Status Block */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase text-slate-400">
                                                    <Filter size={12} className="text-amber-500" /> Elemento Filtrante
                                                </div>
                                                <div className="flex gap-2">
                                                    <PocoStatusIndicator label="Trocado em" status="OK" date={item.ultimaTrocaFiltro} />
                                                    <PocoStatusIndicator label="Próx. Troca" status={computedStatusFiltro} date={item.proximaTrocaFiltro} />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex gap-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                                                <div><span className="font-black text-slate-900 dark:text-white text-xs">{item.capacidade || '-'} L</span> CAPACIDADE</div>
                                                <div className="w-px h-3 bg-slate-300"></div>
                                                <div><span className="font-black text-slate-900 dark:text-white text-xs">{item.numCelulas}</span> CÉLULAS</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className={`p-2 rounded-xl border text-center ${item.dataLimpeza1 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                                    <p className="text-[9px] font-bold uppercase text-slate-400">1º Semestre</p>
                                                    <p className={`text-xs font-bold font-mono ${item.dataLimpeza1 ? 'text-emerald-600' : 'text-slate-400'}`}>{item.dataLimpeza1 ? formatDate(item.dataLimpeza1) : 'PENDENTE'}</p>
                                                </div>
                                                <div className={`p-2 rounded-xl border text-center ${item.dataLimpeza2 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                                    <p className="text-[9px] font-bold uppercase text-slate-400">2º Semestre</p>
                                                    <p className={`text-xs font-bold font-mono ${item.dataLimpeza2 ? 'text-emerald-600' : 'text-slate-400'}`}>{item.dataLimpeza2 ? formatDate(item.dataLimpeza2) : 'PENDENTE'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => handleEdit(item)} 
                                            className={`py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm`}
                                        >
                                            <RotateCw size={14} /> Manutenção
                                        </button>
                                        
                                        {item.fichaOperacional && item.fichaOperacional !== 'LINK' ? (
                                            <a 
                                                href={item.fichaOperacional} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                            >
                                                <FileJson size={14} /> Ficha Op.
                                            </a>
                                        ) : (
                                            <button disabled className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed opacity-60">
                                                <FileJson size={14} /> Sem Ficha
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-between items-center px-1 pt-1">
                                        <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase"><UserIcon size={12}/> {item.responsavel || 'N/A'}</div>
                                        <button onClick={() => handleHistory(item)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"><History size={18}/></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL EDIT */}
            {isModalOpen && editItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-2xl p-0 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider text-lg">
                                    {editItem.local}
                                </h3>
                                <p className="text-xs font-mono text-slate-500">Unidade: {editItem.sedeId}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Localização</label>
                                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm uppercase" 
                                        value={editItem.local} onChange={e => setEditItem({...editItem, local: e.target.value})} placeholder="Ex: Subsolo 1" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Responsável</label>
                                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm uppercase" 
                                        value={editItem.responsavel} onChange={e => setEditItem({...editItem, responsavel: e.target.value})} placeholder="Técnico" />
                                </div>
                            </div>

                            {editItem.tipo === 'POCO' && (
                                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl space-y-4">
                                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-black text-[10px] uppercase mb-1">
                                        <FileText size={14} /> Dados Técnicos
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Ref. Bomba</label>
                                            <input className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" 
                                                value={editItem.referenciaBomba || ''} onChange={e => setEditItem({...editItem, referenciaBomba: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Link Ficha Op.</label>
                                            <input className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" 
                                                value={editItem.fichaOperacional || ''} onChange={e => setEditItem({...editItem, fichaOperacional: e.target.value})} placeholder="URL do Arquivo" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(editItem.tipo === 'CISTERNA' || editItem.tipo === 'CAIXA') && (
                                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl space-y-4">
                                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-black text-[10px] uppercase mb-1">
                                        <Box size={14} /> Capacidade Estrutural
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Capacidade (Litros)</label>
                                            <input className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" 
                                                value={editItem.capacidade || ''} onChange={e => setEditItem({...editItem, capacidade: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Número de Células</label>
                                            <input type="number" className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" 
                                                value={editItem.numCelulas || ''} onChange={e => setEditItem({...editItem, numCelulas: parseInt(e.target.value)})} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {editItem.tipo === 'POCO' && (
                                <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl space-y-4">
                                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-[10px] uppercase mb-1">
                                        <Filter size={14} /> Troca de Filtro
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Refil</label>
                                            <input className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" 
                                                value={editItem.refil || ''} onChange={e => setEditItem({...editItem, refil: e.target.value})} placeholder='10"' />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Data Troca</label>
                                            <input type="date" className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" 
                                                value={editItem.ultimaTrocaFiltro || ''} onChange={e => handleDateChange('FILTRO', e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Próxima</label>
                                            <input type="date" className="w-full p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono text-slate-500" 
                                                value={editItem.proximaTrocaFiltro || ''} readOnly />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl space-y-4">
                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-[10px] uppercase mb-1">
                                    <Calendar size={14} /> Cronograma de Higienização
                                </div>
                                
                                {editItem.tipo === 'POCO' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Data Realização</label>
                                            <input type="date" className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" 
                                                value={editItem.dataUltimaLimpeza || ''} onChange={e => handleDateChange('LIMPEZA', e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Vencimento</label>
                                            <input type="date" className="w-full p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono text-slate-500" 
                                                value={editItem.proximaLimpeza || ''} readOnly />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-emerald-100 dark:border-emerald-900/20">
                                            <div className="col-span-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">1º Semestre</div>
                                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Previsão</label><input type="date" className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" value={editItem.previsaoLimpeza1 || ''} onChange={e => setEditItem({...editItem, previsaoLimpeza1: e.target.value})} /></div>
                                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Realização</label><input type="date" className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" value={editItem.dataLimpeza1 || ''} onChange={e => setEditItem({...editItem, dataLimpeza1: e.target.value})} /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">2º Semestre</div>
                                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Previsão</label><input type="date" className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" value={editItem.previsaoLimpeza2 || ''} onChange={e => setEditItem({...editItem, previsaoLimpeza2: e.target.value})} /></div>
                                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Realização</label><input type="date" className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" value={editItem.dataLimpeza2 || ''} onChange={e => setEditItem({...editItem, dataLimpeza2: e.target.value})} /></div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-1 pt-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Status Operacional</label>
                                    <select className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                                        value={editItem.situacaoLimpeza} onChange={e => setEditItem({...editItem, situacaoLimpeza: e.target.value})}
                                    >
                                        <option value="PENDENTE">PENDENTE</option>
                                        <option value="DENTRO DO PRAZO">DENTRO DO PRAZO</option>
                                        <option value="FORA DO PRAZO">FORA DO PRAZO</option>
                                        <option value="DESATIVADO">DESATIVADO</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-black/20">
                            <button onClick={handleSave} className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-2xl shadow-lg shadow-cyan-500/20 uppercase tracking-widest font-mono text-sm transition-all active:scale-95">
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL HISTORY */}
            {isHistoryOpen && historyItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl"><History size={20}/></div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">Rastreabilidade</h3>
                                    <p className="text-[10px] text-slate-500 font-black uppercase">{historyItem.local}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingHistory ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <Loader2 size={32} className="animate-spin mb-2 text-purple-500" />
                                    <p className="text-xs font-mono uppercase">Carregando logs...</p>
                                </div>
                            ) : historyLogs.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Activity size={40} className="mx-auto mb-3 opacity-20" />
                                    <p className="text-xs font-mono uppercase">Nenhum evento registrado.</p>
                                </div>
                            ) : (
                                <div className="space-y-6 relative border-l-2 border-slate-100 dark:border-slate-800 ml-4">
                                    {historyLogs.map((log, idx) => (
                                        <div key={log.id} className="relative pl-6 group">
                                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-[#111114] ${idx === 0 ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-900/50 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-black text-slate-800 dark:text-white text-xs uppercase">{new Date(log.timestamp).toLocaleDateString()}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold rounded uppercase">{log.action}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <UserIcon size={12} className="text-purple-500"/>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.userName}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-relaxed">{log.details}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
