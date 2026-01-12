
import React, { useState, useEffect } from 'react';
import { TestTube, ChevronLeft, ChevronRight, X, Save, Droplets, AlertTriangle, Clock, CheckCircle2, User as UserIcon, Building2, ArrowLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, HydroCloroEntry, HydroSettings, Sede, UserRole } from '../../types';
import { hydroService } from '../../services/hydroService';
import { orgService } from '../../services/orgService';
import { Breadcrumbs } from '../Shared/Breadcrumbs';

export const HydroCloro: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<HydroCloroEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [availableSedes, setAvailableSedes] = useState<Sede[]>([]);
  const [selectedSedeId, setSelectedSedeId] = useState<string>('');
  const [settings, setSettings] = useState<HydroSettings>({
    validadeCertificadoMeses: 6,
    validadeFiltroMeses: 6,
    validadeLimpezaMeses: 6,
    cloroMin: 1.0,
    cloroMax: 3.0,
    phMin: 7.4,
    phMax: 7.6
  });
  const [form, setForm] = useState<Partial<HydroCloroEntry>>({ cl: 0, ph: 0, medidaCorretiva: '', responsavel: user.name });

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
    setForm(entry || { id: undefined, cl: 0, ph: 0, medidaCorretiva: '', responsavel: user.name });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (selectedDateStr && selectedSedeId) {
        await hydroService.saveCloro({
            id: form.id || Date.now().toString(),
            sedeId: selectedSedeId,
            date: selectedDateStr,
            cl: Number(form.cl),
            ph: Number(form.ph),
            medidaCorretiva: form.medidaCorretiva,
            responsavel: form.responsavel || user.name
        });
        setEntries(await hydroService.getCloro(user));
        setIsModalOpen(false);
    }
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

        {/* STANDARDS INFO (MOVED TO TOP) */}
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
        <div className="bg-white/80 dark:bg-[#111114]/80 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 md:p-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
            <div className="flex items-center justify-between mb-8 relative z-10">
                <button onClick={handlePrevMonth} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-slate-700 transition-colors"><ChevronLeft size={20} /></button>
                <h2 className="text-xl md:text-2xl font-black capitalize text-slate-800 dark:text-white tracking-tight font-mono">{monthName}</h2>
                <button onClick={handleNextMonth} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-slate-700 transition-colors"><ChevronRight size={20} /></button>
            </div>

            {!selectedSedeId ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Building2 size={48} className="mb-4 opacity-50" />
                    <p className="font-mono text-sm">Selecione uma unidade para visualizar.</p>
                </div>
            ) : (
              <>
                  <div className="grid grid-cols-7 gap-3 mb-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
                  </div>
                  <div className="grid grid-cols-7 gap-3 lg:gap-4 relative z-10">
                      {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const entry = getEntry(dateStr);
                          
                          let cardStyle = "bg-white dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 text-slate-400";
                          let Icon = Clock;
                          let iconColor = "text-slate-300 dark:text-slate-600";

                          if (dateStr < todayStr) {
                              if (entry) {
                                  const clSafe = isSafe(entry.cl, settings.cloroMin, settings.cloroMax);
                                  const phSafe = isSafe(entry.ph, settings.phMin, settings.phMax);
                                  if (clSafe && phSafe) {
                                      cardStyle = "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30";
                                      Icon = CheckCircle2; iconColor = "text-emerald-500";
                                  } else {
                                      cardStyle = "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30";
                                      Icon = AlertTriangle; iconColor = "text-red-500";
                                  }
                              } else {
                                  cardStyle = "bg-red-50/20 dark:bg-red-900/5 border-red-100 dark:border-red-900/20";
                                  Icon = AlertTriangle; iconColor = "text-red-300";
                              }
                          } else if (dateStr === todayStr) {
                              if (entry) {
                                  cardStyle = "bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20";
                                  Icon = CheckCircle2; iconColor = "text-emerald-500";
                              } else {
                                  cardStyle = "bg-white dark:bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/20";
                                  Icon = Droplets; iconColor = "text-cyan-500 animate-pulse";
                              }
                          }

                          return (
                              <button key={day} onClick={() => handleDayClick(day)} className={`group h-24 md:h-28 rounded-xl flex flex-col justify-between p-3 border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${cardStyle}`}>
                                  <div className="flex justify-between items-start w-full">
                                      <span className={`text-lg font-bold font-mono ${dateStr === todayStr ? 'text-slate-900 dark:text-white' : 'opacity-70'}`}>{day}</span>
                                      <Icon size={16} className={iconColor} />
                                  </div>
                                  <div className="w-full">
                                      {entry ? (
                                          <div className="flex flex-col gap-1">
                                              <div className={`flex justify-between text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${isSafe(entry.cl, settings.cloroMin, settings.cloroMax) ? 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300' : 'bg-red-100 text-red-600'}`}>
                                                  <span>CL</span> <span>{entry.cl}</span>
                                              </div>
                                              <div className={`flex justify-between text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${isSafe(entry.ph, settings.phMin, settings.phMax) ? 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300' : 'bg-red-100 text-red-600'}`}>
                                                  <span>pH</span> <span>{entry.ph}</span>
                                              </div>
                                          </div>
                                      ) : dateStr < todayStr ? (
                                          <div className="flex justify-center items-center h-full opacity-50">
                                              <AlertTriangle size={16} className="text-red-400" />
                                          </div>
                                      ) : null}
                                  </div>
                              </button>
                          );
                      })}
                  </div>
                  
                  {/* LEGEND */}
                  <div className="mt-8 flex flex-wrap justify-center gap-6 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-6">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-500">
                                <CheckCircle2 size={10} />
                            </div>
                            <span>Realizado (OK)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 flex items-center justify-center text-red-500">
                                <AlertTriangle size={10} />
                            </div>
                            <span>Pendente / Irregular</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border-2 border-cyan-500 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></div>
                            </div>
                            <span>Hoje</span>
                        </div>
                  </div>
              </>
            )}
        </div>

        {/* MODAL */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-[#111114] rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lançamento Diário</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">{selectedDateStr.split('-').reverse().slice(0, 2).join('/')}</h3>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full"><X size={20} className="text-slate-500" /></button>
                    </div>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-2xl border ${isSafe(Number(form.cl), settings.cloroMin, settings.cloroMax) ? 'bg-cyan-50 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900'}`}>
                                <label className="block text-[10px] font-bold uppercase mb-2 text-slate-500">Cloro (ppm)</label>
                                <input type="number" step="0.1" className="w-full bg-transparent outline-none text-3xl font-black text-center text-slate-800 dark:text-white" value={form.cl} onChange={e => setForm({...form, cl: Number(e.target.value)})} />
                            </div>
                            <div className={`p-4 rounded-2xl border ${isSafe(Number(form.ph), settings.phMin, settings.phMax) ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900'}`}>
                                <label className="block text-[10px] font-bold uppercase mb-2 text-slate-500">pH</label>
                                <input type="number" step="0.1" className="w-full bg-transparent outline-none text-3xl font-black text-center text-slate-800 dark:text-white" value={form.ph} onChange={e => setForm({...form, ph: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsável</label>
                            <div className="relative">
                                <UserIcon size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono" value={form.responsavel} onChange={e => setForm({...form, responsavel: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Observações</label>
                            <textarea className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono" rows={2} value={form.medidaCorretiva} onChange={e => setForm({...form, medidaCorretiva: e.target.value})} />
                        </div>
                        <button onClick={handleSave} className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 uppercase tracking-widest font-mono text-sm">Salvar Registro</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
