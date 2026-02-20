
import React, { useState, useEffect } from 'react';
import { 
  Droplet, X, Search, ArrowLeft,
  Waves, Box, History, User as UserIcon,
  RotateCw, Building2,
  FileJson, Loader2, Activity, ClipboardList, Plus
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole, Sede, LogEntry, FichaPoco } from '../../types';
import { hydroService } from '../../services/hydroService';
import { orgService } from '../../services/orgService';
import { logService } from '../../services/logService';
import { EmptyState } from '../Shared/EmptyState';
import { ReservoirFichaModal } from './ReservoirFichaModal';
import { useToast } from '../Shared/ToastContext';
import { useConfirmation } from '../Shared/ConfirmationContext';
import { useHydroData } from '../../hooks/useHydroData'; // Using new Hook
import { logger } from '../../utils/logger';

type Tab = 'pocos' | 'cisternas' | 'caixas';
type CreateReservatorioForm = {
    sedeId: string;
    local: string;
    responsavel: string;
    referenciaBomba: string;
    refil: string;
    capacidade: string;
    numCelulas: string;
    dataUltimaLimpeza: string;
    dataLimpeza1: string;
    dataLimpeza2: string;
};

const parseReservatorioSituacao = (value: string | null): 'ATRASADO' | 'PROXIMO_30D' | null => {
    if (!value) return null;
    const normalized = value.toUpperCase();
    if (normalized === 'ATRASADO' || normalized === 'PROXIMO_30D') return normalized;
    return null;
};

const parseReservatorioTab = (value: string | null): Tab | null => {
    if (!value) return null;
    const normalized = value.toLowerCase();
    if (normalized === 'pocos' || normalized === 'cisternas' || normalized === 'caixas') return normalized;
    return null;
};
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
  const { addToast } = useToast();
  const { confirm } = useConfirmation(); // Using global confirmation
  
  // Custom Hook for Data
  const { pocos, cisternas, caixas, settings, loading, refresh } = useHydroData(user);

  const [activeTab, setActiveTab] = useState<Tab>('pocos');
  
  // Filters
  const [filterText, setFilterText] = useState('');
  const [selectedSedeFilter, setSelectedSedeFilter] = useState<string>('');
  const [situacaoFilter, setSituacaoFilter] = useState<'ATRASADO' | 'PROXIMO_30D' | null>(null);
  const [availableSedes, setAvailableSedes] = useState<Sede[]>([]);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false); // Generic Edit
  const [isFichaOpen, setIsFichaOpen] = useState(false); // poco Specific
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [editItem, setEditItem] = useState<any>(null);
  const [fichaData, setFichaData] = useState<FichaPoco>(INITIAL_FICHA);

  // Create flow
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingGeneric, setIsSavingGeneric] = useState(false);
  const [isSavingFicha, setIsSavingFicha] = useState(false);
  const [createForm, setCreateForm] = useState<CreateReservatorioForm>({
      sedeId: '',
      local: '',
      responsavel: '',
      referenciaBomba: '',
      refil: '',
      capacidade: '',
      numCelulas: '',
      dataUltimaLimpeza: '',
      dataLimpeza1: '',
      dataLimpeza2: ''
  });

  // History
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<LogEntry[]>([]);
  const [historyItem, setHistoryItem] = useState<any>(null);

  const isAdmin = user.role === UserRole.ADMIN;
  const isActionBusy = isCreating || isSavingGeneric || isSavingFicha;

  const addMonths = (dateStr: string, months: number) => {
      const d = new Date(dateStr);
      d.setMonth(d.getMonth() + months);
      return d.toISOString().split('T')[0];
  };

  const getLatestDate = (a?: string, b?: string) => {
      const dates = [a, b].filter(Boolean) as string[];
      if (dates.length === 0) return '';
      return dates.reduce((latest, current) => (
          new Date(current) > new Date(latest) ? current : latest
      ), dates[0]);
  };

  useEffect(() => {
      void loadSedes();
  }, [user]);

  // Efeito para capturar filtro da URL (ao clicar em notificacao)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sedeParam = params.get('sede');
    const tabParam = parseReservatorioTab(params.get('tab'));
    const situacaoParam = parseReservatorioSituacao(params.get('situacao'));

    setSituacaoFilter(situacaoParam);

    if (tabParam) {
      setActiveTab(tabParam);
    }

    if (sedeParam) {
        if (isAdmin) {
            setSelectedSedeFilter(sedeParam);
        } else {
            setFilterText(sedeParam);
        }
    } else if (isAdmin) {
      setSelectedSedeFilter('');
    }
  }, [location.search, isAdmin]);

  const getTabTipo = (tab: Tab): 'POCO' | 'CISTERNA' | 'CAIXA' => {
      if (tab === 'pocos') return 'POCO';
      if (tab === 'cisternas') return 'CISTERNA';
      return 'CAIXA';
  };

  const getTabLabel = (tab: Tab) => {
      if (tab === 'pocos') return 'Poco';
      if (tab === 'cisternas') return 'Cisterna';
      return "Caixa D'Agua";
  };

  const buildDefaultCreateForm = (sedeId = ''): CreateReservatorioForm => ({
      sedeId,
      local: '',
      responsavel: user.name || '',
      referenciaBomba: '',
      refil: '',
      capacidade: '',
      numCelulas: '',
      dataUltimaLimpeza: '',
      dataLimpeza1: '',
      dataLimpeza2: ''
  });

  const loadSedes = async (): Promise<Sede[]> => {
      await orgService.initialize(user);
      const allSedes = orgService.getSedes();
      const scoped = user.role === UserRole.ADMIN
          ? allSedes
          : allSedes.filter(s => (user.sedeIds || []).includes(s.id));
      setAvailableSedes(scoped);
      return scoped;
  };

  const openCreateModal = async () => {
      const sedes = await loadSedes();
      const defaultSede = selectedSedeFilter || sedes[0]?.id || '';
      setCreateForm(buildDefaultCreateForm(defaultSede));
      setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
      if (isActionBusy) return;
      setIsCreateModalOpen(false);
  };

  const handleCreateReservatorio = async () => {
      if (isActionBusy) return;

      const local = createForm.local.trim();
      if (!createForm.sedeId) {
          addToast('Selecione uma sede para continuar.', 'warning');
          return;
      }
      if (!local) {
          addToast('Informe o local do reservatorio.', 'warning');
          return;
      }

      if (activeTab !== 'pocos' && !createForm.capacidade.trim()) {
          addToast('Informe a capacidade do reservatorio.', 'warning');
          return;
      }

      const parsedNumCelulas = createForm.numCelulas.trim() ? Number(createForm.numCelulas) : undefined;
      if (activeTab !== 'pocos' && createForm.numCelulas.trim() && (!Number.isFinite(parsedNumCelulas) || parsedNumCelulas <= 0)) {
          addToast('Numero de celulas invalido.', 'warning');
          return;
      }

      setIsCreating(true);
      try {
          const id = 'res-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
          const tipo = getTabTipo(activeTab);
          const responsavel = createForm.responsavel.trim() || user.name || 'N/A';
          const dataReferencia = activeTab === 'pocos'
              ? createForm.dataUltimaLimpeza
              : getLatestDate(createForm.dataLimpeza1, createForm.dataLimpeza2);

          let proximaLimpeza = '';
          let situacaoLimpeza: 'DENTRO DO PRAZO' | 'FORA DO PRAZO' | 'PENDENTE' | 'DESATIVADO' = 'PENDENTE';

          if (dataReferencia) {
              const cicloMeses = activeTab === 'pocos'
                  ? (settings?.validadeLimpezaPoco || 12)
                  : activeTab === 'cisternas'
                      ? (settings?.validadeLimpezaCisterna || 6)
                      : (settings?.validadeLimpezaCaixa || 6);
              proximaLimpeza = addMonths(dataReferencia, cicloMeses);
              situacaoLimpeza = getComputedStatus(proximaLimpeza) === 'FORA DO PRAZO' ? 'FORA DO PRAZO' : 'DENTRO DO PRAZO';
          }

          const baseItem = {
              id,
              sedeId: createForm.sedeId,
              tipo,
              local,
              responsavel,
              dataUltimaLimpeza: dataReferencia || undefined,
              proximaLimpeza,
              situacaoLimpeza
          };

          if (tipo === 'POCO') {
              await hydroService.savePoco({
                  ...baseItem,
                  tipo: 'POCO',
                  referenciaBomba: createForm.referenciaBomba.trim() || undefined,
                  refil: createForm.refil.trim() || undefined
              });
          } else if (tipo === 'CISTERNA') {
              await hydroService.saveCisterna({
                  ...baseItem,
                  tipo: 'CISTERNA',
                  capacidade: createForm.capacidade.trim(),
                  numCelulas: parsedNumCelulas,
                  dataLimpeza1: createForm.dataLimpeza1 || undefined,
                  dataLimpeza2: createForm.dataLimpeza2 || undefined
              });
          } else {
              await hydroService.saveCaixa({
                  ...baseItem,
                  tipo: 'CAIXA',
                  capacidade: createForm.capacidade.trim(),
                  numCelulas: parsedNumCelulas,
                  dataLimpeza1: createForm.dataLimpeza1 || undefined,
                  dataLimpeza2: createForm.dataLimpeza2 || undefined
              });
          }

          try {
              const normalizedLocal = local.toUpperCase();
              const existing = orgService.getLocais().find(l =>
                  l.sedeId === createForm.sedeId &&
                  (l.tipo || '').toUpperCase() === tipo &&
                  l.name.trim().toUpperCase() === normalizedLocal
              );
              if (!existing) {
                  await orgService.saveLocal({
                      id: 'loc-' + id,
                      sedeId: createForm.sedeId,
                      name: local,
                      tipo
                  });
              }
          } catch (syncErr) {
              logger.warn('Falha ao sincronizar local na estrutura organizacional.', syncErr);
          }

          await refresh();
          setIsCreateModalOpen(false);
          addToast(getTabLabel(activeTab) + ' criado com sucesso.', 'success');
      } catch (err: any) {
          logger.error('Erro ao criar reservatorio:', err);
          addToast(err?.message || 'Erro ao criar reservatorio.', 'error');
      } finally {
          setIsCreating(false);
      }
  };

  // --- ACTIONS ---

  const handleEdit = (item: any) => { 
      setEditItem({ ...item });
      
      if (item.tipo === 'POCO') {
          // Load Ficha Data if exists, else generic info mapping
          if (item.dadosFicha) {
              setFichaData(item.dadosFicha);
          } else {
              setFichaData({
                  ...INITIAL_FICHA,
                  supervisor: item.responsavel || '',
                  patrimonioBomba: item.referenciaBomba || '',
                  materiais: INITIAL_FICHA.materiais
              });
          }
          setIsFichaOpen(true);
      } else {
          setIsModalOpen(true);
      }
  };
  
  const handleSaveGeneric = async () => {
      if (isSavingGeneric) return;

      confirm({
          title: "Salvar Alteracoes?",
          message: "Deseja confirmar a atualizacao dos dados deste reservatorio?",
          type: "info",
          confirmLabel: "Salvar",
          onConfirm: async () => {
              setIsSavingGeneric(true);
              try {
                  const cycleMonths = activeTab === 'cisternas'
                      ? (settings?.validadeLimpezaCisterna || 6)
                      : (settings?.validadeLimpezaCaixa || 6);
                  const latestLimpeza = getLatestDate(editItem.dataLimpeza1, editItem.dataLimpeza2);
                  if (latestLimpeza) {
                      editItem.dataUltimaLimpeza = latestLimpeza;
                      editItem.proximaLimpeza = addMonths(latestLimpeza, cycleMonths);
                  }
                  if (editItem.proximaLimpeza) editItem.situacaoLimpeza = getComputedStatus(editItem.proximaLimpeza);

                  if (activeTab === 'cisternas') await hydroService.saveCisterna(editItem);
                  else await hydroService.saveCaixa(editItem);

                  await refresh();
                  setIsModalOpen(false);
                  addToast("reservatorio atualizado com sucesso.", "success");
              } catch (err: any) {
                  logger.error('Erro ao salvar reservatorio:', err);
                  addToast(err?.message || 'Erro ao salvar reservatorio.', 'error');
              } finally {
                  setIsSavingGeneric(false);
              }
          }
      });
  };

  const handleSaveFicha = async () => {
      if (!editItem || isSavingFicha) return;

      confirm({
          title: "Finalizar Ficha TECNICA",
          message: "Isso atualizara o status do poco e calculara a proxima data de limpeza automaticamente.",
          type: "warning",
          confirmLabel: "Confirmar e Salvar",
          onConfirm: async () => {
              setIsSavingFicha(true);
              try {
                  // Calcular Data de Validade
                  let nextLimpeza = editItem.proximaLimpeza;
                  let statusLimpeza = editItem.situacaoLimpeza;
                  let feedbackMsg = "Ficha tecnica salva com sucesso.";

                  if (fichaData.terminoLimpeza) {
                      const end = new Date(fichaData.terminoLimpeza);
                      const mesesValidade = settings?.validadeLimpezaPoco || 12;
                      end.setMonth(end.getMonth() + mesesValidade);

                      nextLimpeza = end.toISOString().split('T')[0];
                      statusLimpeza = getComputedStatus(nextLimpeza);

                      const fmtDate = new Date(nextLimpeza).toLocaleDateString('pt-BR');
                      feedbackMsg = 'Ficha salva! proxima limpeza: ' + fmtDate + ' (Ciclo: ' + mesesValidade + ' meses).';
                  }

                  const updatedPoco = {
                      ...editItem,
                      responsavel: fichaData.supervisor || editItem.responsavel,
                      referenciaBomba: fichaData.patrimonioBomba || editItem.referenciaBomba,
                      dataUltimaLimpeza: fichaData.terminoLimpeza || editItem.dataUltimaLimpeza,
                      proximaLimpeza: nextLimpeza,
                      situacaoLimpeza: statusLimpeza,
                      dadosFicha: fichaData
                  };

                  await hydroService.savePoco(updatedPoco);
                  await refresh();
                  setIsFichaOpen(false);
                  addToast(feedbackMsg, "success");
              } catch (err: any) {
                  logger.error('Erro ao salvar ficha do poco:', err);
                  addToast(err?.message || 'Erro ao salvar ficha.', 'error');
              } finally {
                  setIsSavingFicha(false);
              }
          }
      });
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
      } catch (e) { logger.error(e); } finally { setLoadingHistory(false); }
  };

  const TabButton = ({ id, label, count, icon: Icon }: any) => (
    <button onClick={() => { setActiveTab(id); setFilterText(''); }} className={`flex-1 py-4 text-xs md:text-sm font-bold rounded-2xl border-2 uppercase tracking-wide flex flex-col md:flex-row items-center justify-center gap-2 ${activeTab === id ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 text-cyan-700 dark:text-cyan-300' : 'bg-white dark:bg-slate-900/50 border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
        <Icon size={18} className={activeTab === id ? 'text-cyan-600' : 'text-slate-400'} />
        <span>{label}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === id ? 'bg-cyan-200 text-cyan-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{count}</span>
    </button>
  );

  const getDaysToLimpeza = (dateStr?: string) => {
      if (!dateStr) return null;
      const [year, month, day] = dateStr.split('-').map(Number);
      const target = new Date(year, month - 1, day);
      target.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffMs = target.getTime() - today.getTime();
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const matchesSituacaoFilter = (item: any) => {
      if (!situacaoFilter) return true;
      const days = getDaysToLimpeza(item.proximaLimpeza);
      if (days === null) return false;
      if (situacaoFilter === 'ATRASADO') return days < 0;
      return days >= 0 && days <= 30;
  };

  const filterList = (list: any[], options?: { ignoreText?: boolean }) => {
      let result = list;
      if (isAdmin && selectedSedeFilter) result = result.filter(i => i.sedeId === selectedSedeFilter);
      if (situacaoFilter) result = result.filter(matchesSituacaoFilter);
      if (!options?.ignoreText && filterText) {
          const normalizedText = filterText.toLowerCase();
          result = result.filter(i => i.local.toLowerCase().includes(normalizedText) || i.sedeId.toLowerCase().includes(normalizedText));
      }
      return result;
  };

  const data = activeTab === 'pocos' ? filterList(pocos) : activeTab === 'cisternas' ? filterList(cisternas) : filterList(caixas);

  useEffect(() => {
      if (!situacaoFilter) return;

      const tabWithData = (['pocos', 'cisternas', 'caixas'] as Tab[]).find(tab => {
          const source = tab === 'pocos' ? pocos : tab === 'cisternas' ? cisternas : caixas;
          return filterList(source, { ignoreText: true }).length > 0;
      });

      if (tabWithData && tabWithData !== activeTab) {
          setActiveTab(tabWithData);
      }
  }, [situacaoFilter, activeTab, pocos, cisternas, caixas, selectedSedeFilter, filterText, isAdmin]);

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
                            <div><h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-mono uppercase">Reservatorios</h1><p className="text-slate-500 text-xs font-mono">Monitoramento de Limpeza.</p></div>
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
                        {isAdmin && (
                            <button
                                onClick={openCreateModal}
                                disabled={isActionBusy}
                                className="w-full sm:w-auto px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isActionBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
                                Cadastrar {getTabLabel(activeTab)}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex flex-col md:flex-row gap-4">
                <TabButton id="pocos" label="pocos Artesianos" count={filterList(pocos).length} icon={Activity} />
                <TabButton id="cisternas" label="Cisternas" count={filterList(cisternas).length} icon={Waves} />
                <TabButton id="caixas" label="Caixas D'agua" count={filterList(caixas).length} icon={Box} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setSituacaoFilter(null)}
                    className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${situacaoFilter === null ? 'bg-slate-900 text-white border-slate-900 dark:bg-cyan-600 dark:border-cyan-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-cyan-500/40'}`}
                >
                    Todas as limpezas
                </button>
                <button
                    onClick={() => setSituacaoFilter('ATRASADO')}
                    className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${situacaoFilter === 'ATRASADO' ? 'bg-red-500 text-white border-red-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-red-400/60'}`}
                >
                    Atrasadas
                </button>
                <button
                    onClick={() => setSituacaoFilter('PROXIMO_30D')}
                    className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${situacaoFilter === 'PROXIMO_30D' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-amber-400/60'}`}
                >
                    Proximas 30d
                </button>
            </div>

            {/* List */}
            {loading ? (
               <div className="py-20 text-center text-slate-400 flex flex-col items-center">
                   <Loader2 size={32} className="animate-spin mb-2" />
                   <span className="text-xs font-mono uppercase tracking-widest">Carregando dados...</span>
               </div>
            ) : data.length === 0 ? (
                <EmptyState
                    icon={Droplet}
                    title="Nenhum registro"
                    description="nao encontramos itens com os filtros atuais."
                    actionLabel={isAdmin && !isActionBusy ? ('Cadastrar ' + getTabLabel(activeTab)) : undefined}
                    onAction={isAdmin && !isActionBusy ? openCreateModal : undefined}
                />
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
                                            <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 px-2 py-0.5 rounded">{activeTab === 'pocos' ? 'POCO' : activeTab === 'cisternas' ? 'CISTERNA' : 'CAIXA'}</span>
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
                                                        <span className="text-[8px] font-bold uppercase block mb-1">ultima</span>
                                                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatDate(item.dataUltimaLimpeza || '')}</span>
                                                    </div>
                                                    <div className={`p-2 rounded border ${isDelayed ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                                                        <span className="text-[8px] font-bold uppercase block mb-1">proxima</span>
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
                                                <div><span className="font-black text-slate-900 dark:text-white text-xs">{item.numCelulas}</span> celulas</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-center">
                                                <div className="p-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                                                    <p className="text-[9px] font-bold uppercase text-slate-400">1o Semestre</p>
                                                    <p className={`text-xs font-bold font-mono ${item.dataLimpeza1 ? 'text-emerald-500' : 'text-slate-400'}`}>{item.dataLimpeza1 ? formatDate(item.dataLimpeza1) : 'PENDENTE'}</p>
                                                </div>
                                                <div className="p-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                                                    <p className="text-[9px] font-bold uppercase text-slate-400">2o Semestre</p>
                                                    <p className={`text-xs font-bold font-mono ${item.dataLimpeza2 ? 'text-emerald-500' : 'text-slate-400'}`}>{item.dataLimpeza2 ? formatDate(item.dataLimpeza2) : 'PENDENTE'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => handleEdit(item)} disabled={isActionBusy} className="py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                                            {isActionBusy ? <Loader2 size={14} className="animate-spin"/> : activeTab === 'pocos' ? <ClipboardList size={14}/> : <RotateCw size={14}/>} 
                                            {activeTab === 'pocos' ? 'Ficha TECNICA' : 'manutencao'}
                                        </button>
                                        
                                        {item.fichaOperacional && item.fichaOperacional !== 'LINK' ? (
                                            <a href={item.fichaOperacional} target="_blank" rel="noreferrer" className="py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:bg-blue-100"><FileJson size={14} /> Ficha Antiga</a>
                                        ) : (
                                            <button disabled className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed opacity-60"><FileJson size={14} /> Sem Anexo</button>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center px-1 pt-1">
                                        <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase"><UserIcon size={12}/> {item.responsavel || 'N/A'}</div>
                                        <button onClick={() => handleHistory(item)} disabled={isActionBusy} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><History size={18}/></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isActionBusy && (
                <div className="fixed inset-0 z-[90] bg-black/25 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-600 dark:text-slate-300">
                        <Loader2 size={14} className="animate-spin" />
                        Processando...
                    </div>
                </div>
            )}

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase font-mono tracking-tight">Novo {getTabLabel(activeTab)}</h3>
                            <button onClick={closeCreateModal} disabled={isCreating}><X size={20} className="text-slate-500"/></button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Sede</label>
                                <select
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    value={createForm.sedeId}
                                    onChange={e => setCreateForm({ ...createForm, sedeId: e.target.value })}
                                    disabled={isCreating}
                                >
                                    <option value="">Selecione...</option>
                                    {availableSedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Local</label>
                                <input
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    value={createForm.local}
                                    onChange={e => setCreateForm({ ...createForm, local: e.target.value })}
                                    disabled={isCreating}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Responsavel</label>
                                <input
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    value={createForm.responsavel}
                                    onChange={e => setCreateForm({ ...createForm, responsavel: e.target.value })}
                                    disabled={isCreating}
                                />
                            </div>

                            {activeTab === 'pocos' ? (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Referencia da bomba</label>
                                        <input
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                            value={createForm.referenciaBomba}
                                            onChange={e => setCreateForm({ ...createForm, referenciaBomba: e.target.value })}
                                            disabled={isCreating}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Refil</label>
                                        <input
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                            value={createForm.refil}
                                            onChange={e => setCreateForm({ ...createForm, refil: e.target.value })}
                                            disabled={isCreating}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Data ultima limpeza</label>
                                        <input
                                            type="date"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                            value={createForm.dataUltimaLimpeza}
                                            onChange={e => setCreateForm({ ...createForm, dataUltimaLimpeza: e.target.value })}
                                            disabled={isCreating}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Capacidade (L)</label>
                                        <input
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                            value={createForm.capacidade}
                                            onChange={e => setCreateForm({ ...createForm, capacidade: e.target.value })}
                                            disabled={isCreating}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Numero de celulas</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                            value={createForm.numCelulas}
                                            onChange={e => setCreateForm({ ...createForm, numCelulas: e.target.value })}
                                            disabled={isCreating}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Limpeza 1 semestre</label>
                                        <input
                                            type="date"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                            value={createForm.dataLimpeza1}
                                            onChange={e => setCreateForm({ ...createForm, dataLimpeza1: e.target.value })}
                                            disabled={isCreating}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Limpeza 2 semestre</label>
                                        <input
                                            type="date"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                            value={createForm.dataLimpeza2}
                                            onChange={e => setCreateForm({ ...createForm, dataLimpeza2: e.target.value })}
                                            disabled={isCreating}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="pt-4 grid grid-cols-2 gap-3">
                                <button
                                    onClick={closeCreateModal}
                                    disabled={isCreating}
                                    className="py-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateReservatorio}
                                    disabled={isCreating}
                                    className="py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    {isCreating ? 'Criando...' : ('Criar ' + getTabLabel(activeTab))}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SEPARATED FICHA MODAL --- */}
            <ReservoirFichaModal 
                isOpen={isFichaOpen}
                onClose={() => { if (!isSavingFicha) setIsFichaOpen(false); }}
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
                            <h3 className="font-black text-slate-900 dark:text-white uppercase font-mono tracking-tight">Editar reservatorio</h3>
                            <button onClick={() => setIsModalOpen(false)} disabled={isSavingGeneric}><X size={20} className="text-slate-500"/></button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Capacidade</label><input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" value={editItem.capacidade || ''} onChange={e => setEditItem({...editItem, capacidade: e.target.value})} /></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Celulas</label><input type="number" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" value={editItem.numCelulas || ''} onChange={e => setEditItem({...editItem, numCelulas: parseInt(e.target.value)})} /></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Limpeza 1o Sem</label><input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" value={editItem.dataLimpeza1 || ''} onChange={e => setEditItem({...editItem, dataLimpeza1: e.target.value})} /></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Limpeza 2o Sem</label><input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" value={editItem.dataLimpeza2 || ''} onChange={e => setEditItem({...editItem, dataLimpeza2: e.target.value})} /></div>
                            <div className="pt-4"><button onClick={handleSaveGeneric} disabled={isSavingGeneric} className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 disabled:opacity-70">{isSavingGeneric ? <Loader2 size={14} className="animate-spin"/> : null}{isSavingGeneric ? 'Salvando...' : 'Salvar Alteracoes'}</button></div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HISTORY MODAL --- */}
            {isHistoryOpen && historyItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
                            <div><h3 className="font-bold text-slate-900 dark:text-white font-mono uppercase">historico</h3><p className="text-xs text-slate-500">{historyItem.local}</p></div>
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

