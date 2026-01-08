
import React, { useState, useEffect } from 'react';
import { 
  Award, FileText, Calendar, Plus, Edit, X, History, Clock, 
  CheckCircle2, AlertTriangle, Activity, Filter, FlaskConical, 
  Microscope, Trash2, ArrowLeft, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, HydroCertificado, UserRole, Sede } from '../../types';
import { hydroService } from '../../services/hydroService';
import { notificationService } from '../../services/notificationService';
import { orgService } from '../../services/orgService';
import { EmptyState } from '../Shared/EmptyState';

// --- HELPERS ---
const getDaysRemaining = (validade: string) => {
  if (!validade) return 0;
  const hoje = new Date();
  const dataValidade = new Date(validade);
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
  const [data, setData] = useState<HydroCertificado[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  
  // Admin Filters
  const [availableSedes, setAvailableSedes] = useState<Sede[]>([]);
  const [selectedSedeFilter, setSelectedSedeFilter] = useState<string>('');

  // Sheet/Modal State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'NEW' | 'EDIT' | 'RENEW'>('NEW');
  
  // History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTargetId, setHistoryTargetId] = useState<string | null>(null);

  const canCreate = user.role !== UserRole.OPERATIONAL;
  const isAdmin = user.role === UserRole.ADMIN;

  const initialForm: HydroCertificado = {
    id: '',
    sedeId: (user.sedeIds && user.sedeIds.length > 0) ? user.sedeIds[0] : '',
    parceiro: '',
    status: 'VIGENTE',
    semestre: '1º SEM - 2025',
    validadeSemestre: '',
    dataAnalise: '',
    validade: '',
    linkMicro: '',
    linkFisico: '',
    empresa: (user.sedeIds && user.sedeIds.length > 0) ? 'Minha Unidade' : '',
    agendamento: '',
    observacao: ''
  };
  const [formData, setFormData] = useState<HydroCertificado>(initialForm);

  useEffect(() => {
    const load = async () => {
       const res = await hydroService.getCertificados(user);
       setData(res);
       
       if (isAdmin) {
           setAvailableSedes(orgService.getSedes());
       }
    };
    load();
  }, [user]);

  // Actions...
  const handleNew = () => {
    setSheetMode('NEW');
    setFormData({ ...initialForm, id: Date.now().toString() });
    setIsSheetOpen(true);
  };

  const handleEdit = (item: HydroCertificado) => {
    setSheetMode('EDIT');
    setFormData(item);
    setIsSheetOpen(true);
  };

  const handleRenovar = (item: HydroCertificado) => {
    setSheetMode('RENEW');
    const today = new Date();
    const nextValidade = new Date(today);
    nextValidade.setMonth(nextValidade.getMonth() + 6);

    setFormData({
      ...initialForm,
      id: Date.now().toString(),
      sedeId: item.sedeId,
      parceiro: item.parceiro,
      empresa: item.empresa,
      dataAnalise: today.toISOString().split('T')[0],
      validade: nextValidade.toISOString().split('T')[0],
      status: 'VIGENTE'
    });
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    await hydroService.saveCertificado(formData);
    const actionType = sheetMode === 'RENEW' ? 'Renovação' : sheetMode === 'NEW' ? 'Criação' : 'Edição';
    await notificationService.add({
        id: `cert-${sheetMode}-${Date.now()}`,
        title: `Certificado - ${actionType}`,
        message: `${actionType} de certificado para ${formData.parceiro} realizada com sucesso por ${user.name}.`,
        type: 'SUCCESS',
        read: false,
        timestamp: new Date(),
        moduleSource: 'HydroSys'
    });
    const res = await hydroService.getCertificados(user);
    setData(res);
    setIsSheetOpen(false);
  };

  const handleDelete = async (id: string) => {
      if(confirm("Deseja remover este certificado?")) {
        await hydroService.deleteCertificado(id);
        await notificationService.add({
            id: `del-cert-${Date.now()}`,
            title: 'Certificado Removido',
            message: `Um certificado foi removido do sistema.`,
            type: 'WARNING',
            read: false,
            timestamp: new Date(),
            moduleSource: 'HydroSys'
        });
        const res = await hydroService.getCertificados(user);
        setData(res);
      }
  }

  // Calculations
  const total = data.length;
  const vigentes = data.filter(d => d.status === 'VIGENTE').length;
  const vencendo = data.filter(d => d.status === 'PROXIMO').length;
  const vencidos = data.filter(d => d.status === 'VENCIDO').length;

  // Filter & Sort Logic
  const filteredData = data
    .filter(d => {
        if (filterStatus && d.status !== filterStatus) return false;
        if (isAdmin && selectedSedeFilter && d.sedeId !== selectedSedeFilter) return false;
        return true;
    })
    .sort((a, b) => {
        // Sort by Validity Date Ascending (Sooner first)
        const dateA = new Date(a.validade).getTime();
        const dateB = new Date(b.validade).getTime();
        return dateA - dateB;
    });

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0A0A0C]">
      
      {/* BACKGROUND THEME */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] text-slate-400 dark:text-cyan-500" style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015] text-slate-400 dark:text-cyan-500" style={{ backgroundImage: `linear-gradient(currentColor 0.5px, transparent 0.5px), linear-gradient(90deg, currentColor 0.5px, transparent 0.5px)`, backgroundSize: '16px 16px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30 dark:opacity-20" style={{ background: 'radial-gradient(ellipse at top, rgba(6, 182, 212, 0.3) 0%, transparent 70%)' }} />
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
                            <Award size={28} className="text-cyan-600 dark:text-cyan-500" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                                CERTIFICADOS
                            </h1>
                            <p className="text-slate-500 dark:text-white/30 text-xs md:text-sm font-mono mt-0.5">
                                Controle de potabilidade e laudos.
                            </p>
                        </div>
                    </div>
                </div>
                {canCreate && (
                    <button 
                    onClick={handleNew}
                    className="w-full md:w-auto h-12 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-bold font-mono text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                    <Plus size={18} />
                    NOVO CERTIFICADO
                    </button>
                )}
            </div>
        </header>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <KPICard 
                title="Vigentes" 
                value={vigentes} 
                icon={<CheckCircle2 size={20}/>}
                gradient="from-emerald-500 to-teal-500"
                isActive={filterStatus === 'VIGENTE'}
                onClick={() => setFilterStatus(filterStatus === 'VIGENTE' ? null : 'VIGENTE')}
            />
            <KPICard 
                title="Vencendo" 
                value={vencendo} 
                icon={<Clock size={20}/>}
                gradient="from-amber-500 to-orange-500"
                isActive={filterStatus === 'PROXIMO'}
                onClick={() => setFilterStatus(filterStatus === 'PROXIMO' ? null : 'PROXIMO')}
            />
            <KPICard 
                title="Vencidos" 
                value={vencidos} 
                icon={<AlertTriangle size={20}/>}
                gradient="from-red-500 to-rose-500"
                isActive={filterStatus === 'VENCIDO'}
                onClick={() => setFilterStatus(filterStatus === 'VENCIDO' ? null : 'VENCIDO')}
            />
            <KPICard 
                title="Total" 
                value={total} 
                icon={<Activity size={20}/>}
                gradient="from-slate-500 to-slate-600"
                isActive={filterStatus === null}
                onClick={() => setFilterStatus(null)}
            />
        </div>

        {/* CONTENT */}
        <div className="bg-white/80 dark:bg-[#111114]/80 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200 min-h-[400px]">
            {filteredData.length === 0 ? (
                <EmptyState 
                    icon={FileText}
                    title="Nenhum Registro"
                    description={filterStatus ? `Não há certificados com status "${filterStatus}".` : "Nenhum certificado registrado nesta unidade."}
                    actionLabel={(!filterStatus && canCreate) ? "Adicionar Primeiro" : undefined}
                    onAction={(!filterStatus && canCreate) ? handleNew : undefined}
                />
            ) : (
                <>
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-black/20">
                        <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                                <Filter size={16} className="text-cyan-500" />
                                {filterStatus ? `Filtro: ${getStatusConfig(filterStatus).label}` : 'Todos os Registros'}
                            </div>
                            
                            {/* ADMIN SEDE FILTER */}
                            {isAdmin && (
                                <div className="relative w-full md:w-64">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <select
                                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-cyan-500 appearance-none uppercase"
                                        value={selectedSedeFilter}
                                        onChange={(e) => setSelectedSedeFilter(e.target.value)}
                                    >
                                        <option value="">TODAS AS UNIDADES</option>
                                        {availableSedes.map(sede => (
                                            <option key={sede.id} value={sede.id}>{sede.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {(filterStatus || selectedSedeFilter) && (
                            <button onClick={() => { setFilterStatus(null); setSelectedSedeFilter(''); }} className="text-xs font-mono text-cyan-600 hover:underline whitespace-nowrap">
                                Limpar Filtros
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredData.map(item => {
                            const statusCfg = getStatusConfig(item.status);
                            const daysLeft = getDaysRemaining(item.validade);
                            
                            return (
                                <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-cyan-500/30 transition-all group shadow-sm flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs shadow-inner">
                                                {item.sedeId.substring(0, 3).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{item.parceiro}</h3>
                                                <p className="text-xs text-slate-500 font-mono">{item.semestre}</p>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${statusCfg.bg} ${statusCfg.text}`}>
                                            {statusCfg.label}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50 flex-1">
                                        <div className="text-center border-r border-slate-200 dark:border-slate-800">
                                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Análise</p>
                                            <p className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                                                {new Date(item.dataAnalise).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Vence em</p>
                                            <p className={`text-xs font-mono font-bold ${daysLeft < 0 ? 'text-red-500' : daysLeft < 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                {daysLeft < 0 ? `Vencido (${Math.abs(daysLeft)}d)` : `${daysLeft} dias`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {item.linkMicro && (
                                                <a href={item.linkMicro} target="_blank" className="p-2 text-purple-600 bg-purple-50 dark:bg-purple-900/10 rounded-lg hover:bg-purple-100 transition-colors" title="Microbiológico">
                                                    <Microscope size={16}/>
                                                </a>
                                            )}
                                            {item.linkFisico && (
                                                <a href={item.linkFisico} target="_blank" className="p-2 text-cyan-600 bg-cyan-50 dark:bg-cyan-900/10 rounded-lg hover:bg-cyan-100 transition-colors" title="Físico-Químico">
                                                    <FlaskConical size={16}/>
                                                </a>
                                            )}
                                        </div>
                                        
                                        <div className="flex gap-1">
                                            {canCreate && (
                                                <button onClick={() => handleRenovar(item)} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" title="Renovar">
                                                    <FlaskConical size={16}/>
                                                </button>
                                            )}
                                            <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => { setHistoryTargetId(item.sedeId); setIsHistoryOpen(true); }} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                                <History size={16} />
                                            </button>
                                            {canCreate && (
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>

      </div>

      {/* MODALS RETAINED BUT STYLED */}
      {/* ... (Keep existing modal logic, just ensure classes use slate-900 for dark mode bg) ... */}
      {isSheetOpen && (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={() => setIsSheetOpen(false)} />
            <div className="fixed inset-y-0 right-0 z-[60] w-full sm:w-[500px] bg-white dark:bg-[#111114] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 dark:border-slate-800">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-black/20 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white uppercase tracking-wider">
                            {sheetMode === 'NEW' ? 'Novo Certificado' : sheetMode === 'EDIT' ? 'Editar Registro' : 'Renovar'}
                        </h2>
                        <p className="text-xs text-slate-500 font-mono">Preencha os dados do laudo.</p>
                    </div>
                    <button onClick={() => setIsSheetOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-red-500 transition-colors"><X size={18} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Form Inputs with Industrial Style */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Laboratório</label>
                        <input className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-cyan-500 transition-colors font-mono text-sm" 
                            value={formData.parceiro} onChange={e => setFormData({...formData, parceiro: e.target.value})} placeholder="Nome do Laboratório" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Referência</label>
                            <input className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-cyan-500 font-mono text-sm" 
                                value={formData.semestre} onChange={e => setFormData({...formData, semestre: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                            <select className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-cyan-500 font-mono text-sm" 
                                value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                <option value="VIGENTE">VIGENTE</option>
                                <option value="PROXIMO">VENCENDO</option>
                                <option value="VENCIDO">VENCIDO</option>
                            </select>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data Análise</label>
                            <input type="date" className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" 
                                value={formData.dataAnalise} onChange={e => setFormData({...formData, dataAnalise: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Validade</label>
                            <input type="date" className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" 
                                value={formData.validade} onChange={e => setFormData({...formData, validade: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Documentação (Links)</label>
                        <div className="flex gap-2 items-center">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><Microscope size={16}/></div>
                            <input className="flex-1 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" 
                                placeholder="Link Microbiológico" value={formData.linkMicro} onChange={e => setFormData({...formData, linkMicro: e.target.value})} />
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 rounded-lg"><FlaskConical size={16}/></div>
                            <input className="flex-1 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" 
                                placeholder="Link Físico-Químico" value={formData.linkFisico} onChange={e => setFormData({...formData, linkFisico: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={handleSave} className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold font-mono uppercase tracking-widest rounded-xl shadow-lg shadow-cyan-500/20 transition-all">
                        {sheetMode === 'RENEW' ? 'Confirmar Renovação' : 'Salvar Dados'}
                    </button>
                </div>
            </div>
        </>
      )}
      
      {/* HISTORY MODAL reused logic but dark mode compliant */}
      {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-[#111114] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-slate-900 dark:text-white font-mono uppercase">Histórico de Análises</h3>
                      <button onClick={() => setIsHistoryOpen(false)}><X size={20} className="text-slate-500" /></button>
                  </div>
                  {/* Timeline content... */}
                  <div className="space-y-6 relative pl-4 border-l border-slate-200 dark:border-slate-800 ml-2">
                       {data.filter(d => d.sedeId === historyTargetId || !historyTargetId).slice(0, 3).map((hist, idx) => (
                           <div key={idx} className="relative pl-6">
                               <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-[#111114]"></div>
                               <p className="text-xs font-bold text-slate-500 mb-1">{new Date(hist.dataAnalise).toLocaleDateString()}</p>
                               <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                   <div className="flex justify-between mb-1">
                                       <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{hist.semestre}</span>
                                       <span className="text-[10px] uppercase font-bold text-slate-400">{hist.status}</span>
                                   </div>
                               </div>
                           </div>
                       ))}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
