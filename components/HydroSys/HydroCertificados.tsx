import React, { useState, useEffect } from 'react';
import { 
  Award, FileText, Calendar, Plus, Edit, Save, X, History, Clock, 
  Link as LinkIcon, ExternalLink, CheckCircle2, AlertTriangle, 
  Activity, Filter, FlaskConical, Microscope, ArrowRight, Droplets,
  Search, Trash2, ArrowUpDown
} from 'lucide-react';
import { User, HydroCertificado, UserRole } from '../../types';
import { hydroService } from '../../services/hydroService';

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
      return { bg: 'bg-gradient-to-r from-emerald-500 to-teal-500', text: 'text-white', label: 'Vigente', icon: CheckCircle2 };
    case 'PROXIMO':
      return { bg: 'bg-gradient-to-r from-amber-500 to-orange-500', text: 'text-white', label: 'Vencendo', icon: Clock };
    case 'VENCIDO':
      return { bg: 'bg-gradient-to-r from-red-500 to-rose-500', text: 'text-white', label: 'Vencido', icon: AlertTriangle };
    default:
      return { bg: 'bg-slate-500', text: 'text-white', label: status, icon: Activity };
  }
};

const getDaysConfig = (days: number) => {
  if (days < 0) return { bg: 'bg-red-500/10', text: 'text-red-600', label: `${days}d` };
  if (days <= 30) return { bg: 'bg-amber-500/10', text: 'text-amber-600', label: `${days}d` };
  return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: `${days}d` };
};

// --- COMPONENTS ---

const KPICard = ({ title, value, icon, gradient, iconBg, onClick, isActive }: any) => (
  <div 
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 border 
      ${isActive 
        ? 'ring-2 ring-cyan-500 shadow-xl shadow-cyan-500/10 scale-[1.02] bg-white dark:bg-slate-900 border-transparent' 
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:scale-[1.02] shadow-sm'
      }`}
  >
    <div className={`absolute inset-0 opacity-[0.03] ${gradient}`} />
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`h-12 w-12 rounded-xl ${iconBg} flex items-center justify-center text-white shadow-lg`}>
        {icon}
      </div>
    </div>
    {isActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500" />}
  </div>
);

export const HydroCertificados: React.FC<{ user: User }> = ({ user }) => {
  const [data, setData] = useState<HydroCertificado[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  
  // Sheet/Modal State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'NEW' | 'EDIT' | 'RENEW'>('NEW');
  
  // History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTargetId, setHistoryTargetId] = useState<string | null>(null);

  const initialForm: HydroCertificado = {
    id: '',
    sedeId: user.sedeId || '',
    parceiro: '',
    status: 'VIGENTE',
    semestre: '1º SEM - 2025',
    validadeSemestre: '',
    dataAnalise: '',
    validade: '',
    linkMicro: '',
    linkFisico: '',
    empresa: user.sedeId ? 'Minha Unidade' : '',
    agendamento: '',
    observacao: ''
  };
  const [formData, setFormData] = useState<HydroCertificado>(initialForm);

  useEffect(() => {
    setData(hydroService.getCertificados(user));
  }, [user]);

  // --- ACTIONS ---

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
    
    // Auto Calculate Logic for Renovation
    const today = new Date();
    const nextValidade = new Date(today);
    nextValidade.setMonth(nextValidade.getMonth() + 6);

    setFormData({
      ...initialForm,
      id: Date.now().toString(), // New ID
      sedeId: item.sedeId, // Same Place
      parceiro: item.parceiro, // Same Lab
      empresa: item.empresa,
      dataAnalise: today.toISOString().split('T')[0],
      validade: nextValidade.toISOString().split('T')[0],
      status: 'VIGENTE'
    });
    setIsSheetOpen(true);
  };

  const handleSave = () => {
    hydroService.saveCertificado(formData);
    setData(hydroService.getCertificados(user));
    setIsSheetOpen(false);
  };

  const handleDelete = (id: string) => {
      if(confirm("Deseja remover este certificado?")) {
        // Mock delete functionality would go here
        alert("Função de deletar simulada.");
      }
  }

  // --- KPI CALCULATIONS ---
  const total = data.length;
  const vigentes = data.filter(d => d.status === 'VIGENTE').length;
  const vencendo = data.filter(d => d.status === 'PROXIMO').length;
  const vencidos = data.filter(d => d.status === 'VENCIDO').length;

  const filteredData = filterStatus 
    ? data.filter(d => d.status === filterStatus)
    : data;

  return (
    <div className="space-y-8 animate-in fade-in pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 text-white">
            <Droplets size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Certificados de Qualidade
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Controle de potabilidade e laudos da unidade.
            </p>
          </div>
        </div>

        <button 
          onClick={handleNew}
          className="h-12 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Certificado
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Vigentes" 
          value={vigentes} 
          icon={<CheckCircle2 size={24}/>}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
          isActive={filterStatus === 'VIGENTE'}
          onClick={() => setFilterStatus(filterStatus === 'VIGENTE' ? null : 'VIGENTE')}
        />
        <KPICard 
          title="Vencendo" 
          value={vencendo} 
          icon={<Clock size={24}/>}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
          isActive={filterStatus === 'PROXIMO'}
          onClick={() => setFilterStatus(filterStatus === 'PROXIMO' ? null : 'PROXIMO')}
        />
        <KPICard 
          title="Vencidos" 
          value={vencidos} 
          icon={<AlertTriangle size={24}/>}
          gradient="bg-gradient-to-br from-red-500 to-rose-500"
          iconBg="bg-gradient-to-br from-red-500 to-rose-600"
          isActive={filterStatus === 'VENCIDO'}
          onClick={() => setFilterStatus(filterStatus === 'VENCIDO' ? null : 'VENCIDO')}
        />
        <KPICard 
          title="Total" 
          value={total} 
          icon={<Activity size={24}/>}
          gradient="bg-gradient-to-br from-slate-500 to-slate-600"
          iconBg="bg-gradient-to-br from-slate-500 to-slate-600"
          isActive={filterStatus === null}
          onClick={() => setFilterStatus(null)}
        />
      </div>

      {/* LIST HEADER */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Filter className="text-cyan-600" size={20} />
            <h2 className="font-bold text-slate-800 dark:text-white">
                {filterStatus ? `Filtrando: ${getStatusConfig(filterStatus).label}` : 'Todos os Registros'}
            </h2>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full font-bold">
                {filteredData.length}
            </span>
         </div>
         {filterStatus && (
             <button onClick={() => setFilterStatus(null)} className="text-sm text-cyan-600 hover:underline">
                 Limpar Filtro
             </button>
         )}
      </div>

      {/* --- MOBILE: RICH CARDS --- */}
      <div className="md:hidden space-y-4">
        {filteredData.map(item => {
            const statusCfg = getStatusConfig(item.status);
            const daysLeft = getDaysRemaining(item.validade);
            const daysCfg = getDaysConfig(daysLeft);

            return (
                <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {/* Card Header */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                        <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-500 font-bold text-sm shadow-inner">
                                {item.parceiro.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{item.parceiro}</h3>
                                <p className="text-xs text-slate-500">{item.semestre}</p>
                            </div>
                        </div>
                        <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text}`}>
                            {statusCfg.label}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
                         <div className="p-3 text-center">
                             <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Dias</p>
                             <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${daysCfg.bg} ${daysCfg.text}`}>
                                 {daysCfg.label}
                             </span>
                         </div>
                         <div className="p-3 text-center">
                             <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Análise</p>
                             <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                {new Date(item.dataAnalise).toLocaleDateString()}
                             </p>
                         </div>
                         <div className="p-3 text-center">
                             <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Validade</p>
                             <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                {new Date(item.validade).toLocaleDateString()}
                             </p>
                         </div>
                    </div>

                    {/* Docs Links */}
                    <div className="p-3 flex gap-2 justify-center bg-slate-50/30 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                         {item.linkMicro ? (
                             <a href={item.linkMicro} target="_blank" className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded hover:bg-purple-100 transition-colors">
                                 <Microscope size={12} /> Micro
                             </a>
                         ) : <span className="text-xs text-slate-400 italic">Sem Micro</span>}
                         
                         {item.linkFisico ? (
                             <a href={item.linkFisico} target="_blank" className="flex items-center gap-1 text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded hover:bg-cyan-100 transition-colors">
                                 <FlaskConical size={12} /> Físico
                             </a>
                         ) : <span className="text-xs text-slate-400 italic">Sem Físico</span>}
                    </div>

                    {/* Action Footer */}
                    <div className="p-2 flex items-center justify-between bg-white dark:bg-slate-900">
                        <div className="flex gap-1">
                            {/* Renovar */}
                            <button 
                                onClick={() => handleRenovar(item)}
                                className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform"
                                title="Renovar"
                            >
                                <FlaskConical size={16} />
                            </button>
                            {/* Editar */}
                            <button 
                                onClick={() => handleEdit(item)}
                                className="h-9 w-9 rounded-xl border border-slate-200 text-slate-400 hover:text-cyan-600 hover:border-cyan-200 hover:bg-cyan-50 flex items-center justify-center transition-colors"
                                title="Editar"
                            >
                                <Edit size={16} />
                            </button>
                             {/* Histórico */}
                             <button 
                                onClick={() => { setHistoryTargetId(item.sedeId); setIsHistoryOpen(true); }}
                                className="h-9 w-9 rounded-xl border border-slate-200 text-slate-400 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 flex items-center justify-center transition-colors"
                                title="Histórico"
                            >
                                <History size={16} />
                            </button>
                        </div>
                        {/* Delete */}
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="h-9 w-9 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            );
        })}
      </div>

      {/* --- DESKTOP: TABLE --- */}
      <div className="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
             <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
                 <tr>
                     <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Parceiro</th>
                     <th className="py-4 px-6 text-center font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Status</th>
                     <th className="py-4 px-6 text-center font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Dias</th>
                     <th className="py-4 px-6 text-center font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Análise</th>
                     <th className="py-4 px-6 text-center font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Validade</th>
                     <th className="py-4 px-6 text-center font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Docs</th>
                     <th className="py-4 px-6 text-right font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Ações</th>
                 </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {filteredData.map(item => {
                     const statusCfg = getStatusConfig(item.status);
                     const daysLeft = getDaysRemaining(item.validade);
                     const daysCfg = getDaysConfig(daysLeft);

                     return (
                         <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                             <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs">
                                        {item.parceiro.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">{item.parceiro}</div>
                                        <div className="text-xs text-slate-500">{item.semestre}</div>
                                    </div>
                                </div>
                             </td>
                             <td className="py-4 px-6 text-center">
                                 <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text}`}>
                                     {statusCfg.label}
                                 </span>
                             </td>
                             <td className="py-4 px-6 text-center">
                                 <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${daysCfg.bg} ${daysCfg.text}`}>
                                     {daysCfg.label}
                                 </span>
                             </td>
                             <td className="py-4 px-6 text-center text-slate-600 dark:text-slate-400">
                                 {new Date(item.dataAnalise).toLocaleDateString()}
                             </td>
                             <td className="py-4 px-6 text-center font-medium text-slate-900 dark:text-white">
                                 {new Date(item.validade).toLocaleDateString()}
                             </td>
                             <td className="py-4 px-6 text-center">
                                 <div className="flex justify-center gap-2">
                                     {item.linkMicro && <a href={item.linkMicro} className="text-purple-600 hover:scale-110 transition-transform"><Microscope size={16}/></a>}
                                     {item.linkFisico && <a href={item.linkFisico} className="text-cyan-600 hover:scale-110 transition-transform"><FlaskConical size={16}/></a>}
                                 </div>
                             </td>
                             <td className="py-4 px-6 text-right">
                                 <div className="flex justify-end items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                     <button onClick={() => handleRenovar(item)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors" title="Renovar"><FlaskConical size={16}/></button>
                                     <button onClick={() => handleEdit(item)} className="p-2 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors" title="Editar"><Edit size={16}/></button>
                                     <button onClick={() => { setHistoryTargetId(item.sedeId); setIsHistoryOpen(true); }} className="p-2 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors" title="Histórico"><History size={16}/></button>
                                     <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors" title="Excluir"><Trash2 size={16}/></button>
                                 </div>
                             </td>
                         </tr>
                     );
                 })}
             </tbody>
        </table>
      </div>

      {/* --- SLIDE OVER (SHEET) FOR FORM --- */}
      {isSheetOpen && (
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsSheetOpen(false)} />
            <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col">
                <div className="relative h-32 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent">
                    <div className="absolute bottom-0 left-0 p-6 flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg text-white">
                            {sheetMode === 'RENEW' ? <FlaskConical size={24} /> : <FileText size={24} />}
                        </div>
                        <div>
                             <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                 {sheetMode === 'NEW' ? 'Novo Certificado' : sheetMode === 'EDIT' ? 'Editar Registro' : 'Renovar Certificado'}
                             </h2>
                             <p className="text-sm text-slate-500">
                                 {sheetMode === 'RENEW' ? 'Datas calculadas automaticamente (+6 meses).' : 'Preencha os dados do laudo.'}
                             </p>
                        </div>
                    </div>
                    <button onClick={() => setIsSheetOpen(false)} className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Laboratório / Parceiro</label>
                        <input 
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                            value={formData.parceiro}
                            onChange={e => setFormData({...formData, parceiro: e.target.value})}
                            placeholder="Ex: Lab Waters"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Referência</label>
                            <input 
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                value={formData.semestre}
                                onChange={e => setFormData({...formData, semestre: e.target.value})}
                                placeholder="1º SEM - 2025"
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                             <select 
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                value={formData.status}
                                onChange={e => setFormData({...formData, status: e.target.value as any})}
                             >
                                 <option value="VIGENTE">Vigente</option>
                                 <option value="PROXIMO">Vencendo</option>
                                 <option value="VENCIDO">Vencido</option>
                             </select>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
                             <div className="flex items-center gap-2"><Calendar size={16} className="text-cyan-500"/> Datas</div>
                             {sheetMode === 'RENEW' && <span className="text-[10px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">Automático</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-xs font-medium text-slate-500 mb-1">Análise</label>
                                 <input 
                                    type="date"
                                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                    value={formData.dataAnalise}
                                    onChange={e => setFormData({...formData, dataAnalise: e.target.value})}
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-medium text-slate-500 mb-1">Validade</label>
                                 <input 
                                    type="date"
                                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                    value={formData.validade}
                                    onChange={e => setFormData({...formData, validade: e.target.value})}
                                 />
                             </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                         <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Documentos (Links Drive)</label>
                         <div className="flex items-center gap-2">
                             <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 flex-shrink-0">
                                 <Microscope size={20} />
                             </div>
                             <input 
                                className="flex-1 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
                                placeholder="Link Análise Microbiológica..."
                                value={formData.linkMicro}
                                onChange={e => setFormData({...formData, linkMicro: e.target.value})}
                             />
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="h-10 w-10 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600 border border-cyan-100 flex-shrink-0">
                                 <FlaskConical size={20} />
                             </div>
                             <input 
                                className="flex-1 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
                                placeholder="Link Análise Físico-Química..."
                                value={formData.linkFisico}
                                onChange={e => setFormData({...formData, linkFisico: e.target.value})}
                             />
                         </div>
                    </div>

                    <div>
                         <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Observações</label>
                         <textarea 
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm h-24 resize-none focus:ring-2 focus:ring-cyan-500/20 outline-none"
                            placeholder="Informações adicionais..."
                            value={formData.observacao}
                            onChange={e => setFormData({...formData, observacao: e.target.value})}
                         />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <button 
                        onClick={handleSave}
                        className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={20} />
                        {sheetMode === 'RENEW' ? 'Confirmar Renovação' : 'Salvar Registro'}
                    </button>
                </div>
            </div>
        </>
      )}

      {/* --- HISTORY MODAL (TIMELINE) --- */}
      {isHistoryOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
                      <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                              <History size={20} />
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-800 dark:text-white">Histórico</h3>
                              <p className="text-xs text-slate-500">Linha do tempo de análises</p>
                          </div>
                      </div>
                      <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={18}/></button>
                  </div>
                  
                  <div className="p-6 max-h-[60vh] overflow-y-auto relative">
                       {/* Timeline Line */}
                       <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-800"></div>

                       <div className="space-y-8">
                           {/* Mock Timeline Items based on Data */}
                           {data.filter(d => d.sedeId === historyTargetId || !historyTargetId).slice(0, 3).map((hist, idx) => (
                               <div key={idx} className="relative pl-10">
                                   <div className={`absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-white dark:border-slate-900 ${hist.status === 'VENCIDO' ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
                                   
                                   <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                                       <div className="flex justify-between items-start mb-2">
                                           <span className="font-bold text-slate-800 dark:text-white text-sm">{hist.semestre}</span>
                                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hist.status === 'VENCIDO' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                               {hist.status}
                                           </span>
                                       </div>
                                       <div className="text-xs text-slate-500 space-y-1">
                                           <div className="flex items-center gap-2"><Calendar size={12}/> Análise: {new Date(hist.dataAnalise).toLocaleDateString()}</div>
                                           <div className="flex items-center gap-2"><Clock size={12}/> Vencimento: {new Date(hist.validade).toLocaleDateString()}</div>
                                       </div>
                                       
                                       {/* NEW LINKS SECTION FOR HISTORY */}
                                       <div className="mt-3 grid grid-cols-2 gap-2">
                                           {hist.linkMicro ? (
                                                <a href={hist.linkMicro} target="_blank" className="flex items-center justify-center gap-2 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors border border-purple-100">
                                                    <Microscope size={14}/> Micro
                                                </a>
                                           ) : (
                                                <span className="flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-400 rounded-lg text-xs border border-slate-100 cursor-not-allowed">
                                                    <Microscope size={14}/> N/A
                                                </span>
                                           )}

                                           {hist.linkFisico ? (
                                                <a href={hist.linkFisico} target="_blank" className="flex items-center justify-center gap-2 py-2 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-bold hover:bg-cyan-100 transition-colors border border-cyan-100">
                                                    <FlaskConical size={14}/> Físico
                                                </a>
                                           ) : (
                                                <span className="flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-400 rounded-lg text-xs border border-slate-100 cursor-not-allowed">
                                                    <FlaskConical size={14}/> N/A
                                                </span>
                                           )}
                                       </div>

                                   </div>
                               </div>
                           ))}
                       </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};