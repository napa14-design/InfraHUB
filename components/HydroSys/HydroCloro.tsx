
import React, { useState, useEffect, useRef } from 'react';
import { TestTube, ChevronLeft, ChevronRight, X, Save, Droplets, AlertTriangle, Clock, CheckCircle2, User as UserIcon, Building2, ArrowLeft, Info, Camera, Image, Trash2, Loader2, FileText, Check, Plus, Minus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, HydroCloroEntry, HydroSettings, Sede, UserRole } from '../../types';
import { hydroService } from '../../services/hydroService';
import { orgService } from '../../services/orgService';
import { Breadcrumbs } from '../Shared/Breadcrumbs';

// Função utilitária para compressão de imagem via Canvas
const compressImage = async (file: File, maxWidth = 1024, quality = 0.6): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Redimensionar mantendo proporção
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Converter para JPEG comprimido
                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error("Falha na compressão do Canvas."));
                    },
                    'image/jpeg',
                    quality // 0.6 = 60% qualidade (bom balanço tamanho/qualidade)
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

export const HydroCloro: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [entries, setEntries] = useState<HydroCloroEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [availableSedes, setAvailableSedes] = useState<Sede[]>([]);
  const [selectedSedeId, setSelectedSedeId] = useState<string>('');
  const [settings, setSettings] = useState<HydroSettings>({
    validadeCertificadoMeses: 6,
    validadeFiltroMeses: 6,
    validadeLimpezaCaixa: 6,
    validadeLimpezaCisterna: 6,
    validadeLimpezaPoco: 12,
    cloroMin: 1.0,
    cloroMax: 3.0,
    phMin: 7.4,
    phMax: 7.6
  });
  const [form, setForm] = useState<Partial<HydroCloroEntry>>({ cl: 0, ph: 0, medidaCorretiva: '', responsavel: user.name, photoUrl: '' });
  
  // Inputs manuais (strings) para permitir digitação fluida com vírgula
  const [clInput, setClInput] = useState('0');
  const [phInput, setPhInput] = useState('0');

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setEntries(await hydroService.getCloro(user));
      setSettings(await hydroService.getSettings());
      const allSedes = orgService.getSedes();
      let userSedes: Sede[] = [];
      if (user.role === UserRole.ADMIN) {
          userSedes = allSedes;
      } else if (user.sedeIds && user.sedeIds.length > 0) {
          userSedes = allSedes.filter(s => user.sedeIds.includes(s.id));
      }
      setAvailableSedes(userSedes);
      if (userSedes.length > 0) setSelectedSedeId(userSedes[0].id);
    };
    load();
  }, [user]);

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toISOString().split('T')[0];
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const getEntry = (date: string) => (!selectedSedeId) ? undefined : entries.find(e => e.date === date && e.sedeId === selectedSedeId);
  const isSafe = (val: number, min: number, max: number) => val >= min && val <= max;

  const handleDayClick = (day: number) => {
    if (!selectedSedeId) { alert("Selecione uma sede primeiro."); return; }
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDateStr(dateStr);
    const entry = getEntry(dateStr);
    
    // Set form state
    const newForm = entry || { id: undefined, cl: 0, ph: 0, medidaCorretiva: '', responsavel: user.name, photoUrl: '' };
    setForm(newForm);
    
    // Sync manual inputs (converting dots to commas for display)
    setClInput(newForm.cl !== undefined ? newForm.cl.toString().replace('.', ',') : '0');
    setPhInput(newForm.ph !== undefined ? newForm.ph.toString().replace('.', ',') : '0');
    
    setIsModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
          const compressedBlob = await compressImage(file, 1000, 0.6);
          const url = await hydroService.uploadPhoto(compressedBlob);
          if (url) setForm(prev => ({ ...prev, photoUrl: url }));
          else alert("Erro no upload da imagem. Verifique a conexão.");
      } catch (err) {
          console.error("Erro upload/compressão:", err);
          alert("Erro ao processar imagem.");
      } finally {
          setIsUploading(false);
      }
  };

  const removePhoto = () => {
      setForm(prev => ({ ...prev, photoUrl: '' }));
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!selectedDateStr || !selectedSedeId) return;
    
    setIsSaving(true);
    try {
        await hydroService.saveCloro({
            id: form.id || `cl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sedeId: selectedSedeId,
            date: selectedDateStr,
            cl: Number(Number(form.cl).toFixed(1)),
            ph: Number(Number(form.ph).toFixed(1)),
            medidaCorretiva: form.medidaCorretiva,
            responsavel: form.responsavel || user.name,
            photoUrl: form.photoUrl
        });
        
        setEntries(await hydroService.getCloro(user));
        setIsModalOpen(false);
    } catch (error: any) {
        console.error("Save error:", error);
        const msg = error.message || JSON.stringify(error, null, 2);
        alert(`Erro ao salvar no banco de dados:\n${msg}`);
    } finally {
        setIsSaving(false);
    }
  };

  const adjustValue = (field: 'cl' | 'ph', delta: number) => {
      const current = Number(form[field] || 0);
      const newValue = Math.max(0, parseFloat((current + delta).toFixed(1)));
      
      setForm(prev => ({ ...prev, [field]: newValue }));
      
      // Update string inputs to match
      const strVal = newValue.toString().replace('.', ',');
      if (field === 'cl') setClInput(strVal);
      else setPhInput(strVal);
  };

  const handleManualChange = (field: 'cl' | 'ph', value: string) => {
      // Regex: permite digitos, e apenas uma vírgula ou ponto
      if (!/^\d*[.,]?\d*$/.test(value)) return;

      if (field === 'cl') setClInput(value);
      else setPhInput(value);

      // Convert to number for internal logic (status color, etc)
      // Replace comma with dot for parsing
      const numericVal = parseFloat(value.replace(',', '.'));
      
      if (!isNaN(numericVal)) {
          setForm(prev => ({ ...prev, [field]: numericVal }));
      } else {
          // If empty string or just "," set to 0 internally but keep string empty/partial
          if (value === '') setForm(prev => ({ ...prev, [field]: 0 }));
      }
  };

  const getStatusInfo = (val: number, min: number, max: number) => {
      if (val < min) return { text: 'BAIXO', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' };
      if (val > max) return { text: 'ALTO', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' };
      return { text: 'IDEAL', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' };
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0A0A0C]">
      
      {/* BACKGROUND */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] text-slate-400 dark:text-cyan-500" style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015] text-slate-400 dark:text-cyan-500" style={{ backgroundImage: `linear-gradient(currentColor 0.5px, transparent 0.5px), linear-gradient(90deg, currentColor 0.5px, transparent 0.5px)`, backgroundSize: '16px 16px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30 dark:opacity-20" style={{ background: 'radial-gradient(ellipse at top, rgba(6, 182, 212, 0.3) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 px-4 md:px-8 py-6 space-y-6 pb-24 md:pb-8 max-w-7xl mx-auto">
        <Breadcrumbs />

        {/* HEADER */}
        <header className="relative overflow-hidden border border-slate-200 dark:border-white/5 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-sm rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-4 w-full md:w-auto">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 border-2 border-cyan-500/20 dark:border-cyan-500/50 flex items-center justify-center bg-cyan-50 dark:bg-cyan-500/5 rounded-xl">
                            <TestTube size={28} className="text-cyan-600 dark:text-cyan-500" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                                CLORO & pH
                            </h1>
                            <p className="text-slate-500 dark:text-white/30 text-xs md:text-sm font-mono mt-0.5">
                                Monitoramento diário da qualidade.
                            </p>
                        </div>
                    </div>
                </div>
                {availableSedes.length > 0 && (
                    <div className="w-full md:w-64">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1 tracking-wider">Unidade Monitorada</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-mono"
                                value={selectedSedeId}
                                onChange={(e) => setSelectedSedeId(e.target.value)}
                            >
                                {availableSedes.map(sede => (
                                    <option key={sede.id} value={sede.id}>{sede.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </header>

        {/* STANDARDS INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
             {/* Cloro Card */}
             <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-bl-full -mr-10 -mt-10"></div>
                 <div className="flex items-center gap-4 mb-4 relative z-10">
                     <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                        <Droplets size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Padrão Cloro (CL)</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{settings.cloroMin} a {settings.cloroMax} <span className="text-sm font-bold text-slate-400">ppm</span></p>
                     </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3 text-xs font-mono relative z-10">
                    <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                        <p className="font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1"><AlertTriangle size={10}/> &lt; {settings.cloroMin} ppm</p>
                        <p className="text-slate-600 dark:text-slate-400 leading-tight text-[10px] uppercase">Adicionar Cloro</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/20">
                        <p className="font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1"><AlertTriangle size={10}/> &gt; {settings.cloroMax} ppm</p>
                        <p className="text-slate-600 dark:text-slate-400 leading-tight text-[10px] uppercase">Adic. Água s/ Cloro</p>
                    </div>
                 </div>
             </div>

             {/* pH Card */}
             <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full -mr-10 -mt-10"></div>
                 <div className="flex items-center gap-4 mb-4 relative z-10">
                     <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <TestTube size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Padrão pH</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{settings.phMin} a {settings.phMax}</p>
                     </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3 text-xs font-mono relative z-10">
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/20">
                        <p className="font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1"><AlertTriangle size={10}/> &lt; {settings.phMin}</p>
                        <p className="text-slate-600 dark:text-slate-400 leading-tight text-[10px] uppercase">Adic. Ácido Fosfórico</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-900/20">
                        <p className="font-bold text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1"><AlertTriangle size={10}/> &gt; {settings.phMax}</p>
                        <p className="text-slate-600 dark:text-slate-400 leading-tight text-[10px] uppercase">Adic. Carbonato</p>
                    </div>
                 </div>
             </div>
        </div>

        {/* CALENDAR */}
        <div className="bg-white/80 dark:bg-[#111114]/80 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-4 md:p-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
            <div className="flex items-center justify-between mb-6 md:mb-8 relative z-10">
                <button onClick={handlePrevMonth} className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-slate-700 transition-colors"><ChevronLeft size={18} /></button>
                <h2 className="text-lg md:text-2xl font-black capitalize text-slate-800 dark:text-white tracking-tight font-mono">{monthName}</h2>
                <button onClick={handleNextMonth} className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-slate-700 transition-colors"><ChevronRight size={18} /></button>
            </div>

            {!selectedSedeId ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Building2 size={48} className="mb-4 opacity-50" />
                    <p className="font-mono text-sm">Selecione uma unidade para visualizar.</p>
                </div>
            ) : (
              <>
                  <div className="grid grid-cols-7 gap-1 sm:gap-3 mb-2 md:mb-4 text-center text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 sm:gap-3 lg:gap-4 relative z-10">
                      {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const entry = getEntry(dateStr);
                          const isToday = dateStr === todayStr;
                          
                          let cardStyle = "bg-white dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 text-slate-400";
                          let statusIndicator = null;

                          if (dateStr < todayStr) {
                              if (entry) {
                                  const clSafe = isSafe(entry.cl, settings.cloroMin, settings.cloroMax);
                                  const phSafe = isSafe(entry.ph, settings.phMin, settings.phMax);
                                  if (clSafe && phSafe) {
                                      cardStyle = "bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/10 dark:to-slate-800/30 border-emerald-200 dark:border-emerald-800 shadow-sm";
                                      statusIndicator = <div className="absolute top-2 right-2 text-emerald-500"><CheckCircle2 size={14} /></div>;
                                  } else {
                                      cardStyle = "bg-gradient-to-br from-red-50/80 to-white dark:from-red-900/10 dark:to-slate-800/30 border-red-200 dark:border-red-800 shadow-sm";
                                      statusIndicator = <div className="absolute top-2 right-2 text-red-500"><AlertTriangle size={14} /></div>;
                                  }
                              } else {
                                  cardStyle = "bg-slate-50 dark:bg-slate-900/20 border-dashed border-red-200 dark:border-red-900/40 text-red-300 opacity-80";
                                  statusIndicator = <div className="absolute top-2 right-2 text-red-300 opacity-50"><AlertTriangle size={12} /></div>;
                              }
                          } else if (isToday) {
                              if (entry) {
                                  cardStyle = "bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md";
                                  statusIndicator = <div className="absolute top-2 right-2 text-emerald-500"><CheckCircle2 size={14} /></div>;
                              } else {
                                  cardStyle = "bg-white dark:bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10";
                                  statusIndicator = <div className="absolute top-2 right-2 text-cyan-500 animate-pulse"><Clock size={14} /></div>;
                              }
                          }

                          return (
                              <button key={day} onClick={() => handleDayClick(day)} className={`group relative h-auto min-h-[90px] md:h-28 rounded-xl md:rounded-2xl flex flex-col p-2 md:p-3 border transition-all duration-200 active:scale-95 md:hover:-translate-y-1 md:hover:shadow-lg ${cardStyle}`}>
                                  {statusIndicator}
                                  <span className={`text-sm md:text-lg font-bold font-mono mb-auto ${isToday ? 'text-cyan-600 dark:text-cyan-400' : dateStr > todayStr ? 'text-slate-300 dark:text-slate-700' : 'text-slate-700 dark:text-slate-300'}`}>
                                      {day}
                                  </span>
                                  {entry ? (
                                      <div className="w-full space-y-1.5 mt-1">
                                          <div className="grid grid-cols-2 gap-1">
                                              <div className={`flex flex-col items-center justify-center rounded-lg py-1 ${isSafe(entry.cl, settings.cloroMin, settings.cloroMax) ? 'bg-slate-100 dark:bg-black/20 text-slate-600 dark:text-slate-300' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                                  <span className="text-[7px] uppercase font-black opacity-60">CL</span>
                                                  <span className="text-[10px] md:text-xs font-bold font-mono">{entry.cl}</span>
                                              </div>
                                              <div className={`flex flex-col items-center justify-center rounded-lg py-1 ${isSafe(entry.ph, settings.phMin, settings.phMax) ? 'bg-slate-100 dark:bg-black/20 text-slate-600 dark:text-slate-300' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                                  <span className="text-[7px] uppercase font-black opacity-60">pH</span>
                                                  <span className="text-[10px] md:text-xs font-bold font-mono">{entry.ph}</span>
                                              </div>
                                          </div>
                                          <div className="flex gap-1 justify-end opacity-60">
                                              {entry.photoUrl && <Image size={10} className="text-cyan-500" />}
                                              {entry.medidaCorretiva && <FileText size={10} className="text-amber-500" />}
                                          </div>
                                      </div>
                                  ) : (
                                      dateStr <= todayStr && (
                                          <div className="w-full h-full flex items-end justify-center pb-1 opacity-20 group-hover:opacity-60 transition-opacity">
                                              <div className="w-8 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                                          </div>
                                      )
                                  )}
                              </button>
                          );
                      })}
                  </div>
              </>
            )}
        </div>

        {/* MODAL REDESIGN */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4">
                <div className="bg-white dark:bg-[#111114] w-full max-w-md h-[90vh] sm:h-auto rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
                    
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest mb-1">
                                <Calendar size={12}/> {selectedDateStr.split('-').reverse().join('/')}
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Registro de Análise</h3>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* 1. Readings Section - Styled as Cards with Inputs */}
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
                                        type="text"
                                        inputMode="decimal"
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
                                        type="text"
                                        inputMode="decimal"
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

                        {/* 2. Photo Evidence */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidência Fotográfica</label>
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

                        {/* 3. Details */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável Técnico</label>
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
        )}
      </div>
    </div>
  );
};
