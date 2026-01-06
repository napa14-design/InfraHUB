import React, { useState, useEffect } from 'react';
import { Droplet, Layers, Edit, CheckCircle, X } from 'lucide-react';
import { User, HydroPoco, HydroCisterna, HydroCaixa } from '../../types';
import { hydroService } from '../../services/hydroService';

type Tab = 'pocos' | 'cisternas' | 'caixas';

export const HydroReservatorios: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<Tab>('pocos');
  const [pocos, setPocos] = useState<HydroPoco[]>([]);
  const [cisternas, setCisternas] = useState<HydroCisterna[]>([]);
  const [caixas, setCaixas] = useState<HydroCaixa[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  useEffect(() => {
    refreshData();
  }, [user]);

  const refreshData = () => {
    setPocos(hydroService.getPocos(user));
    setCisternas(hydroService.getCisternas(user));
    setCaixas(hydroService.getCaixas(user));
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setIsModalOpen(true);
  };

  const handleSave = () => {
      if (activeTab === 'pocos') hydroService.savePoco(editItem);
      else if (activeTab === 'cisternas') hydroService.saveCisterna(editItem);
      else hydroService.saveCaixa(editItem);
      refreshData();
      setIsModalOpen(false);
  };

  const TabButton = ({ id, label, count }: { id: Tab, label: string, count: number }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`
            flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2
            ${activeTab === id 
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30' 
                : 'bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400'}
        `}
    >
        {label}
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>{count}</span>
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in pb-20 md:pb-0">
      <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Droplet className="text-cyan-600" />
            Reservatórios
          </h1>
          <p className="text-sm text-slate-500">Limpeza e manutenção de reservatórios.</p>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl overflow-x-auto">
          <TabButton id="pocos" label="Poços" count={pocos.length} />
          <TabButton id="cisternas" label="Cisternas" count={cisternas.length} />
          <TabButton id="caixas" label="Caixas" count={caixas.length} />
      </div>

      {/* --- MOBILE: CARDS --- */}
      <div className="md:hidden space-y-4">
          {activeTab === 'pocos' && pocos.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                  <button onClick={() => handleEdit(item)} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-cyan-600">
                      <Edit size={18} />
                  </button>
                  <div className="pr-12">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{item.local}</h3>
                      <p className="text-sm text-slate-500">{item.bairro} - {item.responsavel}</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                          <span className="block text-xs text-emerald-600 font-bold uppercase mb-1">Última</span>
                          <span className="font-bold text-slate-800 dark:text-emerald-100">{item.dataLimpeza || '-'}</span>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30">
                           <span className="block text-xs text-blue-600 font-bold uppercase mb-1">Próxima</span>
                           <span className="font-bold text-slate-800 dark:text-blue-100">{item.previsaoLimpeza1_2026}</span>
                      </div>
                  </div>
              </div>
          ))}

          {(activeTab === 'cisternas' ? cisternas : activeTab === 'caixas' ? caixas : []).map((item: any) => (
               <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                  <button onClick={() => handleEdit(item)} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-cyan-600">
                      <Edit size={18} />
                  </button>
                  <div className="pr-12">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{item.local}</h3>
                      <div className="flex gap-2 mt-1">
                         <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-bold">{item.capacidade}</span>
                      </div>
                  </div>
                  <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                          <div className="text-sm">
                              <span className="block text-xs text-slate-400">1ª Limpeza (Prev: {item.previsaoLimpeza1_2025})</span>
                              <span className={`font-bold ${item.dataLimpeza1 ? 'text-emerald-600' : 'text-slate-400'}`}>{item.dataLimpeza1 || 'Pendente'}</span>
                          </div>
                          {item.dataLimpeza1 && <CheckCircle size={18} className="text-emerald-500" />}
                      </div>
                       <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                          <div className="text-sm">
                              <span className="block text-xs text-slate-400">2ª Limpeza (Prev: {item.previsaoLimpeza2_2025})</span>
                              <span className={`font-bold ${item.dataLimpeza2 ? 'text-emerald-600' : 'text-slate-400'}`}>{item.dataLimpeza2 || 'Pendente'}</span>
                          </div>
                          {item.dataLimpeza2 && <CheckCircle size={18} className="text-emerald-500" />}
                      </div>
                  </div>
              </div>
          ))}
      </div>

       {/* --- DESKTOP: TABLE --- */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {activeTab === 'pocos' && (
              <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase">
                      <tr>
                          <th className="p-4">Local</th>
                          <th className="p-4">Bomba</th>
                          <th className="p-4">Limpeza Atual</th>
                          <th className="p-4">Próxima</th>
                          <th className="p-4">Filtro (Troca)</th>
                          <th className="p-4 text-right">Ação</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {pocos.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="p-4 font-medium">{item.local}<br/><span className="text-slate-400">{item.bairro}</span></td>
                              <td className="p-4">{item.referenciaBomba}</td>
                              <td className="p-4 font-bold text-emerald-600">{item.dataLimpeza || '-'}</td>
                              <td className="p-4 text-slate-500">{item.previsaoLimpeza1_2026}</td>
                              <td className="p-4">{item.ultimaTrocaFiltro}</td>
                              <td className="p-4 text-right">
                                  <button onClick={() => handleEdit(item)} className="text-cyan-600 hover:underline">Editar</button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          )}

           {(activeTab === 'cisternas' || activeTab === 'caixas') && (
               <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase">
                      <tr>
                          <th className="p-4">Local</th>
                          <th className="p-4">Capacidade</th>
                          <th className="p-4">1ª Limpeza (2025)</th>
                          <th className="p-4">2ª Limpeza (2025)</th>
                          <th className="p-4 text-right">Ação</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(activeTab === 'cisternas' ? cisternas : caixas).map((item: any) => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="p-4 font-medium">{item.local}<br/><span className="text-slate-400">{item.responsavel}</span></td>
                              <td className="p-4">{item.capacidade}</td>
                              <td className="p-4">
                                  Prev: {item.previsaoLimpeza1_2025} <br/>
                                  <span className="font-bold text-emerald-600">{item.dataLimpeza1 || 'Pendente'}</span>
                              </td>
                              <td className="p-4">
                                  Prev: {item.previsaoLimpeza2_2025} <br/>
                                  <span className="font-bold text-emerald-600">{item.dataLimpeza2 || 'Pendente'}</span>
                              </td>
                              <td className="p-4 text-right">
                                  <button onClick={() => handleEdit(item)} className="text-cyan-600 hover:underline">Editar</button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
           )}
      </div>

      {/* Generic Edit Modal */}
      {isModalOpen && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Atualizar Registro</h3>
                    <button onClick={() => setIsModalOpen(false)}><X /></button>
                </div>
                
                <div className="space-y-4">
                    {/* Dynamic Fields based on active tab */}
                    {activeTab === 'pocos' && (
                        <>
                           <div>
                               <label className="text-xs text-slate-500 font-bold">Data Limpeza</label>
                               <input type="date" className="w-full p-3 rounded-xl border border-slate-300 dark:bg-slate-800" value={editItem.dataLimpeza} onChange={e => setEditItem({...editItem, dataLimpeza: e.target.value})} />
                           </div>
                           <div>
                               <label className="text-xs text-slate-500 font-bold">Situação</label>
                               <input className="w-full p-3 rounded-xl border border-slate-300 dark:bg-slate-800" value={editItem.situacaoLimpeza} onChange={e => setEditItem({...editItem, situacaoLimpeza: e.target.value})} />
                           </div>
                        </>
                    )}

                    {(activeTab === 'cisternas' || activeTab === 'caixas') && (
                        <>
                           <div className="p-3 bg-slate-50 rounded-xl mb-2">
                               <p className="text-xs font-bold text-slate-500 mb-2">1ª Limpeza</p>
                               <input type="date" className="w-full p-2 rounded-lg border border-slate-300 mb-2" value={editItem.dataLimpeza1} onChange={e => setEditItem({...editItem, dataLimpeza1: e.target.value})} />
                           </div>
                           <div className="p-3 bg-slate-50 rounded-xl">
                               <p className="text-xs font-bold text-slate-500 mb-2">2ª Limpeza</p>
                               <input type="date" className="w-full p-2 rounded-lg border border-slate-300 mb-2" value={editItem.dataLimpeza2} onChange={e => setEditItem({...editItem, dataLimpeza2: e.target.value})} />
                           </div>
                        </>
                    )}

                    <button onClick={handleSave} className="w-full py-4 bg-cyan-600 text-white font-bold rounded-xl mt-4">
                        Salvar Alterações
                    </button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};