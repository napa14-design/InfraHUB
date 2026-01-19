
import React, { useState, useEffect } from 'react';
import { 
  Droplet, Edit, X, Search, ArrowLeft,
  Waves, Box, History, User as UserIcon,
  RotateCw, Building2,
  FileJson, Loader2, Activity, ClipboardList
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, HydroPoco, HydroCisterna, HydroCaixa, UserRole, HydroSettings, Sede, LogEntry, FichaPoco } from '../../types';
import { hydroService } from '../../services/hydroService';
import { orgService } from '../../services/orgService';
import { logService } from '../../services/logService';
import { EmptyState } from '../Shared/EmptyState';
import { ReservoirFichaModal } from './ReservoirFichaModal'; // IMPORTED

type Tab = 'pocos' | 'cisternas' | 'caixas';

// --- HELPERS ---
const formatDate = (dateStr: string) => {
    if (!dateStr) return '--/--/--';
    if (dateStr.includes('-')) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
};

const getComputedStatus = (dateStr?: string) => {
    if (!dateStr) return 'PENDENTE';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    if (targetDate < today) return 'FORA DO PRAZO';
    return 'DENTRO DO PRAZO';
};

// Data Structures for Initial State
const MATERIALS_LIST = ['CANO', 'LUVAS', 'CORDA', 'ELETRODO', 'QUADRO DE COMANDO', 'REFIL FILTRO'];
const INITIAL_FICHA: FichaPoco = {
    inicioLimpeza: '', terminoLimpeza: '', supervisor: '', coordenador: '', bombeiro: '',
    profundidadeBomba: '', potenciaBomba: '', numEstagios: '', patrimonioBomba: '', marcaBomba: '', modeloBomba: '',
    preLimpeza: { profundidade: '', nivelEstatico: '', nivelDinamico: '', tempo: '', vazao: '' },
    posLimpeza: { profundidade: '', nivelEstatico: '', nivelDinamico: '', tempo: '', vazao: '' },
    materiais: MATERIALS_LIST.map(m => ({ item: m, situacao: 'BOM', obs: '' })),
    checklist: { epis: [], dia1: [], dia2: [], dia3: [] },
    necessidades: [],
    observacoes: ''
};

export const HydroReservatorios: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('pocos');
  
  // Data
  const [pocos, setPocos] = useState<HydroPoco[]>([]);
  const [cisternas, setCisternas] = useState<HydroCisterna[]>([]);
  const [caixas, setCaixas] = useState<HydroCaixa[]>([]);
  
  // Filters & Settings
  const [filterText, setFilterText] = useState('');
  const [selectedSedeFilter, setSelectedSedeFilter] = useState<string>('');
  const [availableSedes, setAvailableSedes] = useState<Sede[]>([]);
  const [settings, setSettings] = useState<HydroSettings | null>(null);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false); // Generic Edit
  const [isFichaOpen, setIsFichaOpen] = useState(false); // Poço Specific
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [editItem, setEditItem] = useState<any>(null);
  const [fichaData, setFichaData] = useState<FichaPoco>(INITIAL_FICHA);

  // History
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<LogEntry[]>([]);
  const [historyItem, setHistoryItem] = useState<any>(null);

  const isAdmin = user.role === UserRole.ADMIN;

  useEffect(() => { refreshData(); loadSedes(); }, [user]);

  // Efeito para capturar filtro da URL (ao clicar em notificação)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sedeParam = params.get('sede');
    if (sedeParam) {
        if (isAdmin) {
            setSelectedSedeFilter(sedeParam);
        } else {
            setFilterText(sedeParam);
        }
    }
  }, [location.search, isAdmin]);

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

  // --- ACTIONS ---

  const handleEdit = (item: any) => { 
      setEditItem({ ...item });
      
      if (item.tipo === 'POCO') {
          // Load Ficha Data if exists, else generic info mapping
          if (item.dadosFicha) {
              setFichaData(item.dadosFicha);
          } else {
              // Pre-fill what we can from flat structure
              setFichaData({
                  ...INITIAL_FICHA,
                  supervisor: item.responsavel || '',
                  patrimonioBomba: item.referenciaBomba || '',
                  // Tenta preservar materiais se já editou antes mas não salvou estrutura completa
                  materiais: INITIAL_FICHA.materiais
              });
          }
          setIsFichaOpen(true);
      } else {
          setIsModalOpen(true);
      }
  };
  
  const handleSaveGeneric = async () => {
      // Recalcula status
      if (editItem.proximaLimpeza) editItem.situacaoLimpeza = getComputedStatus(editItem.proximaLimpeza);
      
      if (activeTab === 'cisternas') await hydroService.saveCisterna(editItem);
      else await hydroService.saveCaixa(editItem);
      
      await refreshData();
      setIsModalOpen(false);
  };

  const handleSaveFicha = async () => {
      if (!editItem) return;

      // Calcular Data de Validade baseada no término da limpeza e na CONFIGURAÇÃO
      let nextLimpeza = editItem.proximaLimpeza;
      let statusLimpeza = editItem.situacaoLimpeza;

      if (fichaData.terminoLimpeza) {
          const end = new Date(fichaData.terminoLimpeza);
          
          // --- MUDANÇA: Usa a configuração ou 12 meses como fallback ---
          const mesesValidade = settings?.validadeLimpezaPoco || 12; 
          end.setMonth(end.getMonth() + mesesValidade);
          
          nextLimpeza = end.toISOString().split('T')[0];
          statusLimpeza = getComputedStatus(nextLimpeza);
      }

      // Update basic fields from Ficha
      const updatedPoco = {
          ...editItem,
          responsavel: fichaData.supervisor || editItem.responsavel,
          referenciaBomba: fichaData.patrimonioBomba || editItem.referenciaBomba,
          dataUltimaLimpeza: fichaData.terminoLimpeza || editItem.dataUltimaLimpeza,
          proximaLimpeza: nextLimpeza,
          situacaoLimpeza: statusLimpeza,
          dadosFicha: fichaData // Armazena a estrutura completa
      };

      await hydroService.savePoco(updatedPoco);
      await refreshData();
      setIsFichaOpen(false);
  };

  // --- HISTORY ---
  const handleHistory = async (item: any) => { 
      setHistoryItem(item); 
      setIsHistoryOpen(true); 
      setLoadingHistory(true);
      try {
          const allLogs = await logService.getAll();
          const relevant = allLogs.filter(l => l.module === 'HYDROSYS' && (l.target.includes(item.local) || (l.details && l.details.includes(item.local))));
          setHistoryLogs(relevant);
      } catch (e) { console.error(e); } finally { setLoadingHistory(false); }
  };

  const TabButton = ({ id, label, count, icon: Icon }: any) => (
    <button onClick={() => { setActiveTab(id); setFilterText(''); }} className={`flex-1 py-4 text-xs md:text-sm font-bold rounded-2xl border-2 uppercase tracking-wide flex flex-col md:flex-row items-center justify-center gap-2 ${activeTab === id ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 text-cyan-700 dark:text-cyan-300' : 'bg-white dark:bg-slate-900/50 border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0A0A0C]">
        {/* Background */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
            <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] text-slate-400 dark:text-cyan-500" style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
        </div>

        <div className="relative z-10 px-4 md:px-8 py-6 space-y-6 pb-24 md:pb-8 max-w-7xl mx-auto">
            {/* Header */}
            <header className="relative overflow-hidden border border-slate-200 dark:border-white/5 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-sm rounded-3xl shadow-sm">
                <div className="p-6 md:p-8 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="space-y-4 w-full lg:w-auto">
                        <button onClick={() => navigate('/module/hydrosys')} className="group flex items-center gap-2 text-slate-500 hover:text-cyan-600 transition-all text-xs font-mono uppercase tracking-widest">
                            <ArrowLeft size={14} /> Voltar ao Painel
                        </button>
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 border-2 border-cyan-500/20 flex items-center justify-center bg-cyan-50 dark:bg-cyan-500/5 rounded-xl text-cyan-600"><Droplet size={28} /></div>
                            <div><h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-mono uppercase">Reservatórios</h1><p className="text-slate-500 text-xs font-mono">Monitoramento de Limpeza.</p></div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        {isAdmin && (
                            <div className="relative group w-full sm:w-auto">
                                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                <select className="w-full sm:w-48 pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 outline-none uppercase" value={selectedSedeFilter} onChange={(e) => setSelectedSedeFilter(e.target.value)}>
                                    <option value="">Todas as Sedes</option>
                                    {availableSedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="w-full sm:w-64 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="text" placeholder="Buscar Local..." className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none uppercase font-mono" value={filterText} onChange={e => setFilterText(e.target.value)} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex flex-col md:flex-row gap-4">
                <TabButton id="pocos" label="Poços Artesianos" count={filterList(pocos).length} icon={Activity} />
                <TabButton id="cisternas" label="Cisternas" count={filterList(cisternas).length} icon={Waves} />
                <TabButton id="caixas" label="Caixas D'água" count={filterList(caixas).length} icon={Box} />
            </div>

            {/* List */}
            {data.length === 0 ? (
                <EmptyState icon={Droplet} title="Nenhum registro" description="Não encontramos itens com os filtros atuais." />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {data.map((item: any) => {
                        const computedStatusLimpeza = getComputedStatus(item.proximaLimpeza);
                        const isDelayed = computedStatusLimpeza === 'FORA DO PRAZO';

                        return (
                            <div key={item.id} className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800/60 shadow-sm hover:shadow-lg transition-all flex flex-col group">
                                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{item.sedeId}</span>
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

                                <div className="p-5 space-y-5 flex-1">
                                    {activeTab === 'pocos' ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Bomba</p>
                                                    <p className="font-mono font-bold">{item.referenciaBomba || 'N/A'}</p>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Filtro</p>
                                                    <p className="font-mono font-bold">{item.refil || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex gap-2 mb-2 text-[10px] font-bold uppercase text-slate-400"><Droplet size={12} className="text-blue-500" /> Limpeza</div>
                                                <div className="grid grid-cols-2 gap-2 text-center">
                                                    <div className="p-2 rounded border bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30">
                                                        <span className="text-[8px] font-bold uppercase block mb-1">Última</span>
                                                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatDate(item.dataUltimaLimpeza || '')}</span>
                                                    </div>
                                                    <div className={`p-2 rounded border ${isDelayed ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                                                        <span className="text-[8px] font-bold uppercase block mb-1">Próxima</span>
                                                        <span className={`text-xs font-mono font-bold ${isDelayed ? 'text-red-600' : 'text-slate-600 dark:text-slate-400'}`}>{formatDate(item.proximaLimpeza || '')}</span>
                                                    </div>
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
                                            <div className="grid grid-cols-2 gap-3 text-center">
                                                <div className="p-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                                                    <p className="text-[9px] font-bold uppercase text-slate-400">1º Semestre</p>
                                                    <p className={`text-xs font-bold font-mono ${item.dataLimpeza1 ? 'text-emerald-500' : 'text-slate-400'}`}>{item.dataLimpeza1 ? formatDate(item.dataLimpeza1) : 'PENDENTE'}</p>
                                                </div>
                                                <div className="p-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                                                    <p className="text-[9px] font-bold uppercase text-slate-400">2º Semestre</p>
                                                    <p className={`text-xs font-bold font-mono ${item.dataLimpeza2 ? 'text-emerald-500' : 'text-slate-400'}`}>{item.dataLimpeza2 ? formatDate(item.dataLimpeza2) : 'PENDENTE'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => handleEdit(item)} className="py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm">
                                            {activeTab === 'pocos' ? <ClipboardList size={14}/> : <RotateCw size={14}/>} 
                                            {activeTab === 'pocos' ? 'Ficha Técnica' : 'Manutenção'}
                                        </button>
                                        
                                        {item.fichaOperacional && item.fichaOperacional !== 'LINK' ? (
                                            <a href={item.fichaOperacional} target="_blank" rel="noreferrer" className="py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:bg-blue-100"><FileJson size={14} /> Ficha Antiga</a>
                                        ) : (
                                            <button disabled className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed opacity-60"><FileJson size={14} /> Sem Anexo</button>
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

            {/* --- SEPARATED FICHA MODAL --- */}
            <ReservoirFichaModal 
                isOpen={isFichaOpen}
                onClose={() => setIsFichaOpen(false)}
                editItem={editItem}
                fichaData={fichaData}
                setFichaData={setFichaData}
                onSave={handleSaveFicha}
            />

            {/* --- GENERIC MODAL (CISTERNA/CAIXA) --- */}
            {isModalOpen && editItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase font-mono tracking-tight">Editar Reservatório</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-500"/></button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Capacidade</label><input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" value={editItem.capacidade || ''} onChange={e => setEditItem({...editItem, capacidade: e.target.value})} /></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Células</label><input type="number" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" value={editItem.numCelulas || ''} onChange={e => setEditItem({...editItem, numCelulas: parseInt(e.target.value)})} /></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Limpeza 1º Sem</label><input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" value={editItem.dataLimpeza1 || ''} onChange={e => setEditItem({...editItem, dataLimpeza1: e.target.value})} /></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Limpeza 2º Sem</label><input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" value={editItem.dataLimpeza2 || ''} onChange={e => setEditItem({...editItem, dataLimpeza2: e.target.value})} /></div>
                            <div className="pt-4"><button onClick={handleSaveGeneric} className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Salvar Alterações</button></div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HISTORY MODAL --- */}
            {isHistoryOpen && historyItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
                            <div><h3 className="font-bold text-slate-900 dark:text-white font-mono uppercase">Histórico</h3><p className="text-xs text-slate-500">{historyItem.local}</p></div>
                            <button onClick={() => setIsHistoryOpen(false)}><X size={20} className="text-slate-500"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingHistory ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-cyan-500" /></div> : historyLogs.length === 0 ? <div className="text-center text-slate-400 py-10 text-xs font-mono uppercase">Sem registros recentes.</div> : (
                                <div className="space-y-6 border-l-2 border-slate-100 dark:border-slate-800 ml-3 pl-6">
                                    {historyLogs.map((log, idx) => (
                                        <div key={idx} className="relative">
                                            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-cyan-100 border-4 border-white dark:border-[#111114]"></div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{new Date(log.timestamp).toLocaleDateString()}</p>
                                            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.userName}</p>
                                                {/* Ensure whitespace is preserved for the rich text details */}
                                                <p className="text-xs text-slate-500 font-mono mt-1 whitespace-pre-wrap">{log.details}</p>
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
