import React, { useState, useEffect } from 'react';
import { Filter, AlertTriangle, CheckCircle, Clock, RotateCw, X, Calendar } from 'lucide-react';
import { User, HydroFiltro } from '../../types';
import { hydroService } from '../../services/hydroService';

export const HydroFiltros: React.FC<{ user: User }> = ({ user }) => {
  const [data, setData] = useState<HydroFiltro[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HydroFiltro | null>(null);
  
  // Dates for form
  const [todayDate, setTodayDate] = useState('');
  const [nextDate, setNextDate] = useState('');

  useEffect(() => {
    setData(hydroService.getFiltros(user));
  }, [user]);

  const getDaysRemaining = (dateStr: string) => {
    const today = new Date();
    const target = new Date(dateStr);
    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatus = (days: number) => {
    if (days < 0) return { label: 'Vencido', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle };
    if (days < 30) return { label: 'Troca Próxima', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock };
    return { label: 'Regular', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle };
  };

  const handleExchangeClick = (item: HydroFiltro) => {
    setSelectedItem(item);
    
    // Auto Calculate dates
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const next = new Date();
    next.setMonth(next.getMonth() + 6);
    const nextStr = next.toISOString().split('T')[0];

    setTodayDate(todayStr);
    setNextDate(nextStr);
    
    setIsModalOpen(true);
  };

  const confirmExchange = () => {
    if (selectedItem && todayDate) {
        const updated: HydroFiltro = {
            ...selectedItem,
            dataTroca: todayDate,
            proximaTroca: nextDate
        };
        
        hydroService.saveFiltro(updated);
        setData(hydroService.getFiltros(user));
        setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Filter className="text-cyan-600" />
          Filtros
        </h1>
        <p className="text-sm text-slate-500">Gestão e trocas de elementos filtrantes.</p>
      </div>

      {/* --- MOBILE: CARDS --- */}
      <div className="md:hidden grid grid-cols-1 gap-4">
          {data.map(item => {
              const days = getDaysRemaining(item.proximaTroca);
              const status = getStatus(days);
              const StatusIcon = status.icon;

              return (
                  <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                       <div className="flex justify-between items-start mb-4">
                          <div className="bg-slate-100 dark:bg-slate-800 p-2 px-3 rounded-lg text-slate-600 dark:text-slate-400 font-mono text-xs font-bold">
                              {item.patrimonio}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${status.color}`}>
                              <StatusIcon size={12} />
                              {status.label}
                          </div>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{item.bebedouro}</h3>
                      <p className="text-sm text-slate-500 mb-6 flex items-center gap-1">{item.local}</p>
                      
                      <button 
                        onClick={() => handleExchangeClick(item)}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
                      >
                          <RotateCw size={18} /> Realizar Troca
                      </button>
                  </div>
              );
          })}
      </div>

      {/* --- DESKTOP: TABLE --- */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Patrimônio</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Equipamento/Local</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Última Troca</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Próxima Troca</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((item) => {
                 const days = getDaysRemaining(item.proximaTroca);
                 const status = getStatus(days);
                 return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-6 py-4 font-mono font-bold text-slate-500">{item.patrimonio}</td>
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 dark:text-white">{item.bebedouro}</div>
                            <div className="text-xs text-slate-500">{item.local}</div>
                        </td>
                        <td className="px-6 py-4">{new Date(item.dataTroca).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-bold">{new Date(item.proximaTroca).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                                {status.label}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                             <button 
                                onClick={() => handleExchangeClick(item)}
                                className="px-4 py-2 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg text-xs font-bold border border-cyan-100 transition-colors"
                             >
                                Registrar Troca
                             </button>
                        </td>
                    </tr>
                 );
              })}
            </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirmar Troca</h3>
                    <button onClick={() => setIsModalOpen(false)}><X /></button>
                </div>
                
                <p className="text-sm text-slate-500 mb-6">
                    Você está registrando a manutenção para <strong>{selectedItem.bebedouro}</strong>.
                </p>
                
                <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                        <label className="block text-xs font-bold text-emerald-600 uppercase mb-1">Data da Realização</label>
                        <div className="font-bold text-lg text-slate-800">{new Date(todayDate).toLocaleDateString()}</div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                         <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Nova Validade (+6 Meses)</label>
                         <div className="font-bold text-lg text-slate-800">{new Date(nextDate).toLocaleDateString()}</div>
                    </div>
                </div>

                <button onClick={confirmExchange} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl mt-6 shadow-lg shadow-emerald-500/20">
                    Confirmar e Salvar
                </button>
            </div>
        </div>
      )}
    </div>
  );
};