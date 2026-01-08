
import React, { useState, useEffect } from 'react';
import { ArrowLeft, TestTube, ChevronLeft, ChevronRight, X, Save, Droplets, AlertTriangle, Clock, CheckCircle2, User as UserIcon, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, HydroCloroEntry, HydroSettings, Sede, UserRole } from '../../types';
import { hydroService } from '../../services/hydroService';
import { orgService } from '../../services/orgService';

export const HydroCloro: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<HydroCloroEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  
  // Sede Filtering
  const [availableSedes, setAvailableSedes] = useState<Sede[]>([]);
  const [selectedSedeId, setSelectedSedeId] = useState<string>('');

  // Settings State
  const [settings, setSettings] = useState<HydroSettings>({
    validadeCertificadoMeses: 6,
    validadeFiltroMeses: 6,
    validadeLimpezaMeses: 6,
    cloroMin: 1.0,
    cloroMax: 3.0,
    phMin: 7.4,
    phMax: 7.6
  });

  const [form, setForm] = useState<Partial<HydroCloroEntry>>({
    cl: 0, ph: 0, medidaCorretiva: '', responsavel: user.name
  });

  useEffect(() => {
    const load = async () => {
      // Load All User's Data
      setEntries(await hydroService.getCloro(user));
      setSettings(await hydroService.getSettings());
      
      // Setup Sede Selector
      const allSedes = orgService.getSedes();
      let userSedes: Sede[] = [];
      
      // ADMIN sees ALL, others see filtered list
      if (user.role === UserRole.ADMIN) {
          userSedes = allSedes;
      } else if (user.sedeIds && user.sedeIds.length > 0) {
          userSedes = allSedes.filter(s => user.sedeIds.includes(s.id));
      } else {
          // Fallback if no sedes mapped
          userSedes = [];
      }
      
      setAvailableSedes(userSedes);
      
      // Auto-select first
      if (userSedes.length > 0) {
          setSelectedSedeId(userSedes[0].id);
      }
    };
    load();
  }, [user]);

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // FILTERED ENTRY GETTER: MATCHES DATE AND SELECTED SEDE
  const getEntry = (date: string) => {
      if (!selectedSedeId) return undefined;
      return entries.find(e => e.date === date && e.sedeId === selectedSedeId);
  };

  // Helper to check safety range based on settings
  const isSafe = (val: number, min: number, max: number) => val >= min && val <= max;

  const handleDayClick = (day: number) => {
    if (!selectedSedeId) {
        alert("Selecione uma sede primeiro.");
        return;
    }

    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDateStr(dateStr);
    
    const entry = getEntry(dateStr);
    if (entry) {
        setForm(entry);
    } else {
        // Reset form but keep responsible name if set, otherwise default
        setForm({ id: undefined, cl: 0, ph: 0, medidaCorretiva: '', responsavel: user.name });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (selectedDateStr && selectedSedeId) {
        // Use existing ID if editing, otherwise generate new one
        const entryId = form.id || Date.now().toString();

        await hydroService.saveCloro({
            id: entryId,
            sedeId: selectedSedeId, // Use Selected Sede explicitly
            date: selectedDateStr,
            cl: Number(form.cl),
            ph: Number(form.ph),
            medidaCorretiva: form.medidaCorretiva,
            responsavel: form.responsavel || user.name
        });
        
        // Refresh data to reflect update
        setEntries(await hydroService.getCloro(user));
        setIsModalOpen(false);
    }
  };

  // Rendering Calendar
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  return (
    <div className="space-y-8 animate-in fade-in pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 text-white">
            <TestTube size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Controle de Cloro e pH
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Monitoramento diário da qualidade da água.
            </p>
          </div>
        </div>

        {/* SEDE SELECTOR */}
        {availableSedes.length > 0 && (
            <div className="w-full lg:w-64">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Unidade Monitorada</label>
                <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
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

      {/* --- CALENDAR --- */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 md:p-8 relative overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-8 relative z-10">
              <button onClick={handlePrevMonth} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"><ChevronLeft size={20} /></button>
              <h2 className="text-2xl font-black capitalize text-slate-800 dark:text-white tracking-tight">{monthName}</h2>
              <button onClick={handleNextMonth} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"><ChevronRight size={20} /></button>
          </div>

          {!selectedSedeId ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Building2 size={48} className="mb-4 opacity-50" />
                  <p>Selecione uma unidade para visualizar os dados.</p>
              </div>
          ) : (
            <>
                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-3 mb-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
                </div>

                <div className="grid grid-cols-7 gap-3 lg:gap-4 relative z-10">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                    
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const entry = getEntry(dateStr);
                        
                        let cardStyle = "bg-yellow-50/50 dark:bg-yellow-900/5 border border-dashed border-yellow-200 text-yellow-600/60";
                        let statusLabel = "FUTURO";
                        let Icon = Clock;
                        let iconColor = "text-yellow-400";

                        if (dateStr < todayStr) {
                            if (entry) {
                                const clSafe = isSafe(entry.cl, settings.cloroMin, settings.cloroMax);
                                const phSafe = isSafe(entry.ph, settings.phMin, settings.phMax);
                                
                                if (clSafe && phSafe) {
                                    cardStyle = "bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-emerald-900/30 shadow-sm";
                                    statusLabel = "REGISTRADO";
                                    Icon = CheckCircle2;
                                    iconColor = "text-emerald-500";
                                } else {
                                    cardStyle = "bg-red-50 dark:bg-red-900/20 border-2 border-red-200";
                                    statusLabel = "FORA DO PADRÃO";
                                    Icon = AlertTriangle;
                                    iconColor = "text-red-500";
                                }
                            } else {
                                cardStyle = "bg-red-50 dark:bg-red-900/10 border-2 border-red-100 text-red-400";
                                statusLabel = "PENDENTE";
                                Icon = AlertTriangle;
                                iconColor = "text-red-400";
                            }
                        } else if (dateStr === todayStr) {
                            if (entry) {
                                cardStyle = "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500 shadow-md shadow-emerald-500/10";
                                statusLabel = "HOJE (OK)";
                                Icon = CheckCircle2;
                                iconColor = "text-emerald-600";
                            } else {
                                cardStyle = "bg-white dark:bg-slate-800 border-2 border-red-400 ring-4 ring-red-50 dark:ring-red-900/20";
                                statusLabel = "HOJE";
                                Icon = AlertTriangle;
                                iconColor = "text-red-500 animate-pulse";
                            }
                        }

                        return (
                            <button 
                                key={day}
                                onClick={() => handleDayClick(day)}
                                className={`
                                    group h-24 md:h-32 rounded-2xl flex flex-col justify-between p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg
                                    ${cardStyle}
                                `}
                            >
                                <div className="flex justify-between items-start w-full">
                                    <span className={`text-lg font-bold ${dateStr === todayStr ? 'text-slate-900' : 'opacity-70'}`}>{day}</span>
                                    <Icon size={16} className={iconColor} />
                                </div>

                                <div className="w-full">
                                    {entry ? (
                                        <div className="flex flex-col gap-1">
                                            <div className={`flex justify-between items-center text-xs px-2 py-1 rounded-lg font-bold ${isSafe(entry.cl, settings.cloroMin, settings.cloroMax) ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300' : 'bg-red-100 text-red-600'}`}>
                                                <span>CL</span> <span>{entry.cl}</span>
                                            </div>
                                            <div className={`flex justify-between items-center text-xs px-2 py-1 rounded-lg font-bold ${isSafe(entry.ph, settings.phMin, settings.phMax) ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300' : 'bg-red-100 text-red-600'}`}>
                                                <span>pH</span> <span>{entry.ph}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 flex justify-center">{statusLabel}</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </>
          )}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      </div>

      {/* --- INFO FOOTER (DYNAMIC) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {/* Padrão Cloro */}
           <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
               <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-emerald-600">
                   <Droplets size={24} />
               </div>
               <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Padrão Cloro</p>
                   <p className="text-2xl font-black text-slate-800">{settings.cloroMin} - {settings.cloroMax}</p>
                   <span className="text-xs font-bold text-emerald-600">ppm ideal</span>
               </div>
           </div>

           {/* Padrão pH */}
           <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
               <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-cyan-600">
                   <TestTube size={24} />
               </div>
               <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Padrão pH</p>
                   <p className="text-2xl font-black text-slate-800">{settings.phMin} - {settings.phMax}</p>
                   <span className="text-xs font-bold text-cyan-600">neutro/básico</span>
               </div>
           </div>

           {/* Alerta Cloro */}
           <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
               <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-amber-600">
                   <AlertTriangle size={24} />
               </div>
               <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Alerta Cloro</p>
                   <p className="text-lg font-black text-slate-800 leading-tight">&lt; {settings.cloroMin} <span className="text-slate-300">|</span> &gt; {settings.cloroMax}</p>
                   <span className="text-xs font-bold text-amber-600">Ação corretiva</span>
               </div>
           </div>

            {/* Alerta pH */}
           <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
               <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-red-600">
                   <AlertTriangle size={24} />
               </div>
               <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Alerta pH</p>
                   <p className="text-lg font-black text-slate-800 leading-tight">&lt; {settings.phMin} <span className="text-slate-300">|</span> &gt; {settings.phMax}</p>
                   <span className="text-xs font-bold text-red-600">Crítico</span>
               </div>
           </div>
      </div>

      {/* --- MODAL (SIMPLIFIED FOR USER) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 border-t-8 border-cyan-500">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lançamento Diário</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                            {selectedDateStr.split('-').reverse().slice(0, 2).join('/')}
                        </h3>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X className="text-slate-500" size={20} /></button>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-2xl border ${isSafe(Number(form.cl), settings.cloroMin, settings.cloroMax) ? 'bg-cyan-50 border-cyan-100' : 'bg-red-50 border-red-100'}`}>
                            <label className={`block text-xs font-bold uppercase mb-2 ${isSafe(Number(form.cl), settings.cloroMin, settings.cloroMax) ? 'text-cyan-600' : 'text-red-600'}`}>Cloro (ppm)</label>
                            <input 
                                type="number" step="0.1"
                                className="w-full bg-white px-2 py-2 rounded-xl border border-cyan-200 focus:ring-2 focus:ring-cyan-500 outline-none text-3xl font-black text-center text-slate-800"
                                value={form.cl}
                                onChange={e => setForm({...form, cl: Number(e.target.value)})}
                            />
                        </div>
                        <div className={`p-4 rounded-2xl border ${isSafe(Number(form.ph), settings.phMin, settings.phMax) ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
                            <label className={`block text-xs font-bold uppercase mb-2 ${isSafe(Number(form.ph), settings.phMin, settings.phMax) ? 'text-blue-600' : 'text-red-600'}`}>pH</label>
                            <input 
                                type="number" step="0.1"
                                className="w-full bg-white px-2 py-2 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-3xl font-black text-center text-slate-800"
                                value={form.ph}
                                onChange={e => setForm({...form, ph: Number(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Responsável Técnico</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-slate-300 outline-none text-sm transition-colors font-medium text-slate-700 dark:text-slate-200"
                                value={form.responsavel}
                                onChange={e => setForm({...form, responsavel: e.target.value})}
                                placeholder="Nome do Responsável"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Medida Corretiva (Opcional)</label>
                        <textarea 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-slate-300 outline-none text-sm transition-colors"
                            placeholder="Descreva se aplicou produto..."
                            rows={2}
                            value={form.medidaCorretiva}
                            onChange={e => setForm({...form, medidaCorretiva: e.target.value})}
                        />
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30 transition-all hover:scale-[1.02]"
                    >
                        <Save size={20} /> Salvar Registro
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
