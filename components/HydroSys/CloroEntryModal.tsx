
import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Save, Calendar, Loader2, Camera, Trash2, 
    Minus, Plus, User as UserIcon 
} from 'lucide-react';
import { HydroCloroEntry, HydroSettings, User } from '../../types';
import { compressImage } from '../../utils/imageUtils';
import { hydroService } from '../../services/hydroService';
import { formatDate } from '../../utils/formatters';
import { logger } from '../../utils/logger';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: Partial<HydroCloroEntry>;
    dateStr: string;
    sedeId: string;
    settings: HydroSettings;
    currentUser: User;
    onSaveSuccess: () => void;
}

export const CloroEntryModal: React.FC<Props> = ({ 
    isOpen, onClose, data, dateStr, sedeId, settings, currentUser, onSaveSuccess 
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState<Partial<HydroCloroEntry>>({ ...data });
    
    // We use number directly for form state, but string for input value to allow empty state or decimals
    const [clInput, setClInput] = useState<string>('');
    const [phInput, setPhInput] = useState<string>('');
    
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setForm({ 
                ...data, 
                responsavel: data.responsavel || currentUser.name 
            });
            // Init inputs
            setClInput(data.cl !== undefined ? data.cl.toString() : '');
            setPhInput(data.ph !== undefined ? data.ph.toString() : '');
        }
    }, [isOpen, data, currentUser]);

    if (!isOpen) return null;

    const getStatusInfo = (val: number, min: number, max: number) => {
        if (val < min) return { text: 'BAIXO', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' };
        if (val > max) return { text: 'ALTO', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' };
        return { text: 'IDEAL', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' };
    };

    const handleManualChange = (field: 'cl' | 'ph', value: string) => {
        // Allow empty string to clear input
        if (value === '') {
            if (field === 'cl') setClInput(''); else setPhInput('');
            setForm(prev => ({ ...prev, [field]: 0 }));
            return;
        }

        const numericVal = parseFloat(value);
        if (!isNaN(numericVal)) {
            setForm(prev => ({ ...prev, [field]: numericVal }));
        }
        if (field === 'cl') setClInput(value); else setPhInput(value);
    };

    const adjustValue = (field: 'cl' | 'ph', delta: number) => {
        const current = Number(form[field] || 0);
        const newValue = Math.max(0, parseFloat((current + delta).toFixed(1)));
        
        setForm(prev => ({ ...prev, [field]: newValue }));
        
        if (field === 'cl') setClInput(newValue.toString());
        else setPhInput(newValue.toString());
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
  
        setIsUploading(true);
        try {
            if (form.photoUrl && form.photoUrl.startsWith('blob:')) {
                URL.revokeObjectURL(form.photoUrl);
            }
  
            const compressedBlob = await compressImage(file, 1000, 0.6);
            const url = await hydroService.uploadPhoto(compressedBlob);
            if (url) setForm(prev => ({ ...prev, photoUrl: url }));
            else alert("Erro no upload da imagem.");
        } catch (err) {
            logger.error("Erro upload/compressão:", err);
            alert("Erro ao processar imagem. Tente uma menor.");
        } finally {
            setIsUploading(false);
        }
    };

    const removePhoto = () => {
        if (form.photoUrl && form.photoUrl.startsWith('blob:')) {
            URL.revokeObjectURL(form.photoUrl);
        }
        setForm(prev => ({ ...prev, photoUrl: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSave = async () => {
        // Validation check
        if (Number(form.cl) < 0 || Number(form.ph) < 0) {
            alert("Valores não podem ser negativos.");
            return;
        }

        setIsSaving(true);
        try {
            await hydroService.saveCloro({
                id: form.id || `cl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                sedeId: sedeId,
                date: dateStr,
                cl: Number(Number(form.cl).toFixed(1)),
                ph: Number(Number(form.ph).toFixed(1)),
                medidaCorretiva: form.medidaCorretiva,
                responsavel: form.responsavel || currentUser.name,
                photoUrl: form.photoUrl
            });
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            alert(`Erro ao salvar: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto overscroll-contain bg-black/70 backdrop-blur-md p-0 sm:p-4">
            <div className="bg-white dark:bg-[#111114] w-full max-w-md h-[92dvh] sm:h-auto sm:max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
                
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest mb-1">
                            <Calendar size={12}/> {formatDate(dateStr)}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Registro de análise</h3>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-8">
                    {/* Readings Section */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* CLORO INPUT */}
                        <div className={`p-4 rounded-2xl border-2 transition-all ${getStatusInfo(Number(form.cl), settings.cloroMin, settings.cloroMax).bg}`}>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black uppercase text-slate-500">Cloro (ppm)</span>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase bg-white/50 dark:bg-black/20 ${getStatusInfo(Number(form.cl), settings.cloroMin, settings.cloroMax).color}`}>
                                    {getStatusInfo(Number(form.cl), settings.cloroMin, settings.cloroMax).text}
                                </span>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <input 
                                    type="number"
                                    inputMode="decimal"
                                    step="0.1"
                                    value={clInput}
                                    onChange={(e) => handleManualChange('cl', e.target.value)}
                                    className="text-4xl font-black text-slate-800 dark:text-white font-mono tracking-tighter bg-transparent outline-none text-center w-full focus:underline decoration-2 underline-offset-4 decoration-slate-300 dark:decoration-slate-700"
                                />
                                <div className="flex items-center gap-2 w-full">
                                    <button onClick={() => adjustValue('cl', -0.1)} className="flex-1 h-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Minus size={16}/></button>
                                    <button onClick={() => adjustValue('cl', 0.1)} className="flex-1 h-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Plus size={16}/></button>
                                </div>
                            </div>
                        </div>

                        {/* pH INPUT */}
                        <div className={`p-4 rounded-2xl border-2 transition-all ${getStatusInfo(Number(form.ph), settings.phMin, settings.phMax).bg}`}>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black uppercase text-slate-500">pH</span>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase bg-white/50 dark:bg-black/20 ${getStatusInfo(Number(form.ph), settings.phMin, settings.phMax).color}`}>
                                    {getStatusInfo(Number(form.ph), settings.phMin, settings.phMax).text}
                                </span>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <input 
                                    type="number"
                                    inputMode="decimal"
                                    step="0.1"
                                    value={phInput}
                                    onChange={(e) => handleManualChange('ph', e.target.value)}
                                    className="text-4xl font-black text-slate-800 dark:text-white font-mono tracking-tighter bg-transparent outline-none text-center w-full focus:underline decoration-2 underline-offset-4 decoration-slate-300 dark:decoration-slate-700"
                                />
                                <div className="flex items-center gap-2 w-full">
                                    <button onClick={() => adjustValue('ph', -0.1)} className="flex-1 h-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Minus size={16}/></button>
                                    <button onClick={() => adjustValue('ph', 0.1)} className="flex-1 h-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Plus size={16}/></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Photo Evidence */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidência fotográfica</label>
                        <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        {form.photoUrl ? (
                            <div className="relative group rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 h-40">
                                <img src={form.photoUrl} alt="Registro" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={removePhoto} className="p-3 bg-red-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] font-bold text-white uppercase backdrop-blur-sm">Imagem Anexada</div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-cyan-500 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/10 transition-all gap-2"
                            >
                                {isUploading ? (
                                    <><Loader2 size={24} className="animate-spin" /><span className="text-[10px] font-bold uppercase">Processando...</span></>
                                ) : (
                                    <><Camera size={24} /><span className="text-[10px] font-bold uppercase">Adicionar Foto</span></>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável técnico</label>
                            <div className="relative">
                                <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-cyan-500 transition-colors" value={form.responsavel} onChange={e => setForm({...form, responsavel: e.target.value})} placeholder="Nome do operador" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações / Correções</label>
                            <textarea className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-cyan-500 transition-colors resize-none" rows={2} value={form.medidaCorretiva} onChange={e => setForm({...form, medidaCorretiva: e.target.value})} placeholder="Opcional..." />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-black/20">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className={`w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-2xl shadow-lg shadow-cyan-500/20 uppercase tracking-widest font-mono text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {isSaving ? 'Salvando...' : 'Registrar Coleta'}
                    </button>
                </div>
            </div>
        </div>
    );
};
