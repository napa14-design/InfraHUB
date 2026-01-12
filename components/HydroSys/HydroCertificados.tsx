
import React, { useState, useEffect } from 'react';
import { 
  Award, FileText, Calendar, Plus, Edit, X, History, Clock, 
  CheckCircle2, AlertTriangle, Activity, Filter, FlaskConical, 
  Microscope, Trash2, ArrowLeft, Building2, Save, RotateCw, Eye, ExternalLink, Maximize2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, HydroCertificado, UserRole, Sede } from '../../types';
import { hydroService } from '../../services/hydroService';
import { notificationService } from '../../services/notificationService';
import { orgService } from '../../services/orgService';
import { EmptyState } from '../Shared/EmptyState';
import { useToast } from '../Shared/ToastContext';
import { CardSkeleton } from '../Shared/Skeleton';

const getDaysRemaining = (validade: string) => {
  if (!validade) return 0;
  // Normalizar datas para meia-noite para evitar frações de horas afetando o dia 0
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  // Ajuste de fuso horário simples para input type="date"
  const parts = validade.split('-');
  const dataValidade = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  
  const diffTime = dataValidade.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'VIGENTE':
      return { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', label: 'Vigente', icon: CheckCircle2 };
    case 'PROXIMO':
      return { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', label: 'Vencendo', icon: Clock };
    case 'VENCIDO':
      return { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-600 dark:text-red-400', label: 'Vencido', icon: AlertTriangle };
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-500', label: status, icon: Activity };
  }
};

const KPICard = ({ title, value, icon, gradient, onClick, isActive }: any) => (
  <div 
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all duration-300 border backdrop-blur-sm
      ${isActive 
        ? 'bg-white dark:bg-[#111114] border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
        : 'bg-white/60 dark:bg-[#111114]/60 border-slate-200 dark:border-white/5 hover:border-cyan-500/30 hover:bg-white dark:hover:bg-[#111114]'
      }`}
  >
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">{value}</p>
      </div>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${gradient}`}>
        {icon}
      </div>
    </div>
    {isActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500" />}
  </div>
);

export const HydroCertificados: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [data, setData] = useState<HydroCertificado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [availableSedes, setAvailableSedes] = useState<Sede[]>([]);
  const [selectedSedeFilter, setSelectedSedeFilter] = useState<string>('');
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'NEW' | 'EDIT' | 'RENEW'>('NEW');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HydroCertificado[]>([]);
  const [historyTitle, setHistoryTitle] = useState('');

  // --- PREVIEW MODAL STATE ---
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const canCreate = user.role !== UserRole.OPERATIONAL;
  const isAdmin = user.role === UserRole.ADMIN;

  const initialForm: HydroCertificado = {
    id: '',
    sedeId: (user.sedeIds && user.sedeIds.length > 0) ? user.sedeIds[0] : '',
    parceiro: '',
    status: 'VIGENTE',
    semestre: '',
    validadeSemestre: '',
    dataAnalise: '',
    validade: '',
    linkMicro: '',
    linkFisico: '',
    empresa: 'Nexus Group',
    agendamento: '',
    observacao: ''
  };
  const [formData, setFormData] = useState<HydroCertificado>(initialForm);

  const loadData = async () => {
     setIsLoading(true);
     // Simulate slight delay for Skeleton demo
     setTimeout(async () => {
         const res = await hydroService.getCertificados(user);
         setData(res);
         if (isAdmin) setAvailableSedes(orgService.getSedes());
         setIsLoading(false);
     }, 600);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // --- DOC PREVIEW LOGIC ---
  const handlePreview = (url: string) => {
      if (!url) return;
      
      let finalUrl = url;
      // Transform Google Drive /view links to /preview for embedded clean view
      if (url.includes('drive.google.com') && url.includes('/view')) {
          finalUrl = url.replace(/\/view.*/, '/preview');
      }
      
      setPreviewUrl(finalUrl);
  };

  const handleNew = () => {
    setSheetMode('NEW');
    setFormData({ ...initialForm, id: Date.now().toString(), dataAnalise: new Date().toISOString().split('T')[0] });
    setIsSheetOpen(true);
  };

  const handleEdit = (item: HydroCertificado) => {
    setSheetMode('EDIT');
    setFormData({ ...item });
    setIsSheetOpen(true);
  };

  const handleRenovar = (item: HydroCertificado) => {
    setSheetMode('RENEW');
    const today = new Date();
    const nextValidade = new Date(today);
    nextValidade.setMonth(nextValidade.getMonth() + 6);
    let nextSemestre = item.semestre;
    if (item.semestre.includes('1º')) nextSemestre = item.semestre.replace('1º', '2º');
    else if (item.semestre.includes('2º')) {
        const yearMatch = item.semestre.match(/\d{4}/);
        const year = yearMatch ? parseInt(yearMatch[0]) : today.getFullYear();
        nextSemestre = `1º SEM - ${year + 1}`;
    }
    setFormData({
      ...item,
      id: `cert-${Date.now()}`,
      semestre: nextSemestre,
      dataAnalise: today.toISOString().split('T')[0],
      validade: nextValidade.toISOString().split('T')[0],
      status: 'VIGENTE',
      linkMicro: '',
      linkFisico: ''
    });
    setIsSheetOpen(true);
  };

  const handleOpenHistory = (parceiro: string, sedeId: string) => {
      const filtered = data.filter(d => d.parceiro === parceiro && d.sedeId === sedeId)
                          .sort((a, b) => new Date(b.validade).getTime() - new Date(a.validade).getTime());
      setHistoryItems(filtered);
      setHistoryTitle(`${parceiro} - ${sedeId}`);
      setIsHistoryOpen(true);
  };

  const handleSave = async () => {
    if (!formData.parceiro || !formData.dataAnalise || !formData.validade) {
        addToast("Preencha todos os campos obrigatórios.", "warning");
        return;
    }
    await hydroService.saveCertificado(formData);
    await notificationService.markByLink('/module/hydrosys/certificados');
    await loadData();
    setIsSheetOpen(false);
    addToast(sheetMode === 'RENEW' ? "Certificado renovado com sucesso!" : "Registro salvo com sucesso!", "success");
  };

  const handleDelete = async (id: string) => {
    if(confirm("Deseja remover este certificado permanentemente?")) {
        await hydroService.deleteCertificado(id);
        await loadData();
        addToast("Certificado removido.", "info");
    }
  };

  const activeItems: HydroCertificado[] = Array.from(data.reduce((map: Map<string, HydroCertificado>, item: HydroCertificado) => {
      const key = `${item.sedeId}-${item.parceiro}`;
      const existing = map.get(key);
      if (!existing || new Date(item.validade) > new Date(existing.validade)) map.set(key, item);
      return map;
  }, new Map<string, HydroCertificado>()).values());

  const getDynamicStatus = (daysLeft: number) => {
      if (daysLeft < 0) return 'VENCIDO';
      if (daysLeft <= 30) return 'PROXIMO'; 
      return 'VIGENTE';
  };

  const filteredData: HydroCertificado[] = activeItems
    .filter(d => {
        const days = getDaysRemaining(d.validade);
        const dynamicStatus = getDynamicStatus(days);
        
        if (filterStatus && dynamicStatus !== filterStatus) return false;
        if (isAdmin && selectedSedeFilter && d.sedeId !== selectedSedeFilter) return false;
        return true;
    })
    .sort((a, b) => new Date(b.validade).getTime() - new Date(a.validade).getTime());

  // Count filtered for stats if filter is applied, or all if no filter
  const itemsToCount = isAdmin && selectedSedeFilter ? activeItems.filter(i => i.sedeId === selectedSedeFilter) : activeItems;
  const countByStatus = (status: string) => itemsToCount.filter(i => getDynamicStatus(getDaysRemaining(i.validade)) === status).length;

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0A0A0C]">
      <div className="relative z-10 px-4 md:px-8 py-6 space-y-6 max-w-7xl mx-auto">
        <header className="border border-slate-200 dark:border-white/5 bg-white/90 dark:bg-[#111114]/90 rounded-3xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-4">
                <button onClick={() => navigate('/module/hydrosys')} className="flex items-center gap-2 text-slate-500 hover:text-cyan-600 transition-all text-xs font-mono uppercase tracking-widest">
                    <ArrowLeft size={14} /> Voltar ao Painel
                </button>
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 border-2 border-cyan-500/20 flex items-center justify-center bg-cyan-50 dark:bg-cyan-500/5 rounded-xl text-cyan-600">
                        <Award size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase">Vigência de Laudos</h1>
                        <p className="text-slate-500 text-xs font-mono">Monitoramento 30 dias para vencimento.</p>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                {/* FILTRO DE SEDE (ADMIN ONLY) */}
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

                {canCreate && (
                    <button onClick={handleNew} className="w-full sm:w-auto px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold font-mono text-sm shadow-lg flex items-center justify-center gap-2 transition-all">
                        <Plus size={18} /> <span className="hidden sm:inline">NOVO LAUDO</span><span className="sm:hidden">NOVO</span>
                    </button>
                )}
            </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Vigentes" value={countByStatus('VIGENTE')} icon={<CheckCircle2 size={20}/>} gradient="from-emerald-500 to-teal-500" isActive={filterStatus === 'VIGENTE'} onClick={() => setFilterStatus(filterStatus === 'VIGENTE' ? null : 'VIGENTE')} />
            <KPICard title="Vencendo" value={countByStatus('PROXIMO')} icon={<Clock size={20}/>} gradient="from-amber-500 to-orange-500" isActive={filterStatus === 'PROXIMO'} onClick={() => setFilterStatus(filterStatus === 'PROXIMO' ? null : 'PROXIMO')} />
            <KPICard title="Vencidos" value={countByStatus('VENCIDO')} icon={<AlertTriangle size={20}/>} gradient="from-red-500 to-rose-500" isActive={filterStatus === 'VENCIDO'} onClick={() => setFilterStatus(filterStatus === 'VENCIDO' ? null : 'VENCIDO')} />
            <KPICard title="Total" value={itemsToCount.length} icon={<Activity size={20}/>} gradient="from-slate-500 to-slate-600" isActive={filterStatus === null} onClick={() => setFilterStatus(null)} />
        </div>

        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                {filteredData.length === 0 ? (
                    <div className="col-span-full py-12">
                        <EmptyState 
                            icon={Filter} 
                            title="Nenhum certificado encontrado" 
                            description={selectedSedeFilter ? "Não há laudos cadastrados para esta unidade com os filtros atuais." : "Ajuste os filtros ou cadastre um novo laudo."}
                        />
                    </div>
                ) : (
                    filteredData.map((item: HydroCertificado) => {
                        const daysLeft = getDaysRemaining(item.validade);
                        const displayStatus = getDynamicStatus(daysLeft);
                        const cfg = getStatusConfig(displayStatus);
                        const isUrgent = displayStatus !== 'VIGENTE';

                        return (
                            <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-6 flex flex-col h-full shadow-sm hover:border-cyan-500/30 transition-all">
                                <div className="flex justify-between items-start mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs">{item.sedeId}</div>
                                        <div><h3 className="font-bold text-slate-900 dark:text-white uppercase text-sm">{item.parceiro}</h3><p className="text-[10px] text-slate-500 font-mono">{item.semestre}</p></div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${cfg.bg} ${cfg.text}`}>{cfg.label}</div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mb-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800/50 text-center">
                                    <div className="border-r border-slate-200 dark:border-slate-800"><p className="text-[9px] uppercase text-slate-400 font-black mb-0.5">Análise</p><p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{new Date(item.dataAnalise).toLocaleDateString()}</p></div>
                                    <div>
                                        <p className="text-[9px] uppercase text-slate-400 font-black mb-0.5">Vencimento</p>
                                        <p className={`text-xs font-mono font-bold ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {daysLeft < 0 ? `VENCIDO (${Math.abs(daysLeft)}d)` : daysLeft === 0 ? 'HOJE' : `${daysLeft} dias`}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-auto space-y-4">
                                    {canCreate && (
                                        <button 
                                            onClick={() => handleRenovar(item)} 
                                            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2
                                            ${isUrgent 
                                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/30 animate-pulse' 
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                                        >
                                            <RotateCw size={18} className={isUrgent ? "animate-spin-slow" : ""} /> 
                                            {isUrgent ? 'Renovar Agora' : 'Antecipar Renovação'}
                                        </button>
                                    )}
                                    
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/50">
                                        <div className="flex gap-2">
                                            {item.linkMicro && (
                                                <button onClick={() => handlePreview(item.linkMicro)} className="p-2 text-purple-600 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100" title="Ver Micro">
                                                    <Microscope size={16}/>
                                                </button>
                                            )}
                                            {item.linkFisico && (
                                                <button onClick={() => handlePreview(item.linkFisico)} className="p-2 text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg hover:bg-cyan-100" title="Ver Físico">
                                                    <FlaskConical size={16}/>
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex gap-1 opacity-80 hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenHistory(item.parceiro, item.sedeId)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Ver Histórico"><History size={16}/></button>
                                            <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-brand-500" title="Editar"><Edit size={16} /></button>
                                            {canCreate && <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-500" title="Excluir"><Trash2 size={16} /></button>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        )}
      </div>

      {/* --- DOCUMENT PREVIEW MODAL (GOOGLE DRIVE VIEWER) --- */}
      {previewUrl && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 md:p-6 animate-in fade-in duration-300">
              <div className="w-full h-full max-w-6xl flex flex-col bg-white dark:bg-[#111114] rounded-2xl overflow-hidden relative shadow-2xl">
                  {/* Header Overlay */}
                  <div className="flex justify-between items-center p-4 bg-slate-900 text-white border-b border-white/10">
                      <div className="flex items-center gap-3">
                          <Eye size={20} className="text-cyan-400" />
                          <h3 className="font-mono font-bold uppercase tracking-wider text-sm">Visualizador de Documento</h3>
                      </div>
                      <div className="flex items-center gap-3">
                          <a 
                            href={previewUrl.replace('/preview', '/view')} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold uppercase transition-colors"
                          >
                              <ExternalLink size={14} /> Abrir no Navegador
                          </a>
                          <button onClick={() => setPreviewUrl(null)} className="p-1.5 bg-white/10 hover:bg-red-500/80 rounded-lg transition-colors text-white">
                              <X size={20} />
                          </button>
                      </div>
                  </div>
                  
                  {/* Iframe Container */}
                  <div className="flex-1 bg-slate-200 dark:bg-slate-900 relative">
                      <iframe 
                        src={previewUrl} 
                        className="w-full h-full absolute inset-0 border-0" 
                        allow="autoplay"
                        title="Document Preview"
                      />
                  </div>
              </div>
          </div>
      )}

      {/* MODAL HISTÓRICO */}
      {isHistoryOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-[#111114] rounded-3xl w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl"><History size={20}/></div>
                          <div>
                              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">Histórico de Laudos</h3>
                              <p className="text-[10px] text-slate-500 font-black uppercase">{historyTitle}</p>
                          </div>
                      </div>
                      <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                      <div className="space-y-4">
                          {historyItems.map((h, idx) => {
                              // Calcular status histórico também
                              const days = getDaysRemaining(h.validade);
                              
                              return (
                                <div key={h.id} className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 pb-4 last:pb-0">
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-[#111114] ${idx === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                    <div className={`p-4 rounded-2xl border ${idx === 0 ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">{h.semestre}</p>
                                                <p className="text-[10px] text-slate-500 font-mono">Análise: {new Date(h.dataAnalise).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusConfig(h.status).bg} ${getStatusConfig(h.status).text}`}>
                                                {h.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <p className="text-[10px] text-slate-400 font-mono italic">Validade: {new Date(h.validade).toLocaleDateString()}</p>
                                            
                                            {/* VISIBLE LINKS AS PREVIEW BUTTONS */}
                                            <div className="flex gap-2 mt-2">
                                                {h.linkMicro ? (
                                                    <button onClick={() => handlePreview(h.linkMicro)} className="flex-1 py-1.5 px-3 rounded bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase flex items-center justify-center gap-2 hover:bg-purple-100 transition-colors">
                                                        <Microscope size={12}/> Ver Micro
                                                    </button>
                                                ) : (
                                                    <span className="flex-1 py-1.5 px-3 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-300 text-[10px] font-bold uppercase flex items-center justify-center gap-2 cursor-not-allowed">
                                                        <Microscope size={12}/> Sem Micro
                                                    </span>
                                                )}
                                                
                                                {h.linkFisico ? (
                                                    <button onClick={() => handlePreview(h.linkFisico)} className="flex-1 py-1.5 px-3 rounded bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold uppercase flex items-center justify-center gap-2 hover:bg-cyan-100 transition-colors">
                                                        <FlaskConical size={12}/> Ver Físico
                                                    </button>
                                                ) : (
                                                    <span className="flex-1 py-1.5 px-3 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-300 text-[10px] font-bold uppercase flex items-center justify-center gap-2 cursor-not-allowed">
                                                        <FlaskConical size={12}/> Sem Físico
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                              );
                          })}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL FORM (SHEET) */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg h-full bg-white dark:bg-[#111114] shadow-2xl p-8 flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black font-mono uppercase text-slate-900 dark:text-white">
                        {sheetMode === 'RENEW' ? 'RENOVAR LAUDO' : sheetMode === 'EDIT' ? 'EDITAR REGISTRO' : 'REGISTRO DE LAUDO'}
                    </h2>
                    <button onClick={() => setIsSheetOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><X size={20}/></button>
                </div>
                <div className="flex-1 space-y-6 overflow-y-auto">
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Unidade</label><select className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" value={formData.sedeId} onChange={e => setFormData({...formData, sedeId: e.target.value})} disabled={sheetMode === 'RENEW' || sheetMode === 'EDIT'}>{orgService.getSedes().map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Laboratório</label><input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm uppercase" value={formData.parceiro} onChange={e => setFormData({...formData, parceiro: e.target.value.toUpperCase()})} placeholder="EX: PASTEUR" disabled={sheetMode === 'RENEW'} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Semestre Referência</label><input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" value={formData.semestre} onChange={e => setFormData({...formData, semestre: e.target.value})} placeholder="Ex: 2º SEM - 2025" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Status</label><select className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="VIGENTE">VIGENTE</option><option value="PROXIMO">VENCENDO</option><option value="VENCIDO">VENCIDO</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Data Analise</label><input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" value={formData.dataAnalise} onChange={e => setFormData({...formData, dataAnalise: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Data Validade</label><input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" value={formData.validade} onChange={e => setFormData({...formData, validade: e.target.value})} /></div>
                    </div>
                    <div className="space-y-3 pt-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Documentação Digital (Links)</label>
                        <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs" value={formData.linkMicro} onChange={e => setFormData({...formData, linkMicro: e.target.value})} placeholder="URL Laudo Micro" />
                        <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs" value={formData.linkFisico} onChange={e => setFormData({...formData, linkFisico: e.target.value})} placeholder="URL Laudo Físico" />
                    </div>
                </div>
                <button onClick={handleSave} className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-2xl shadow-xl shadow-cyan-500/20 uppercase tracking-widest mt-8 flex items-center justify-center gap-2"><Save size={18}/> {sheetMode === 'RENEW' ? 'CONFIRMAR RENOVAÇÃO' : 'SALVAR REGISTRO'}</button>
            </div>
        </div>
      )}
    </div>
  );
};
