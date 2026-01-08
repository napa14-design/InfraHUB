
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Building2, Map, MapPin, Plus, Trash2, Edit2, Check, X, Layout, LocateFixed, RefreshCw, AlertCircle, Database, Upload, FileUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Organization, Region, Sede, Local } from '../types';
import { orgService } from '../services/orgService';

type Tab = 'org' | 'region' | 'sede' | 'local';

export const AdminOrgManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('org');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [locais, setLocais] = useState<Local[]>([]);

  // Simple Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isNew, setIsNew] = useState(false);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setOrgs(orgService.getOrgs());
    setRegions(orgService.getRegions());
    setSedes(orgService.getSedes());
    setLocais(orgService.getLocais());
  };

  const handleForceRefresh = async () => {
    setIsLoading(true);
    await orgService.initialize();
    refreshData();
    setIsLoading(false);
  };

  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm({ ...item });
    setIsNew(false);
  };

  const handleStartNew = () => {
    setIsNew(true);
    const newId = Date.now().toString();
    setEditingId(newId);
    
    if (activeTab === 'org') setEditForm({ id: newId, name: '' });
    if (activeTab === 'region') setEditForm({ id: newId, name: '', organizationId: orgs[0]?.id || '' });
    if (activeTab === 'sede') setEditForm({ id: newId, name: '', address: '', regionId: regions[0]?.id || '' });
    if (activeTab === 'local') setEditForm({ id: newId, name: '', tipo: 'BEBEDOURO', sedeId: sedes[0]?.id || '' });
  };

  const handleSave = async () => {
    if (activeTab === 'org') await orgService.saveOrg(editForm as Organization);
    if (activeTab === 'region') await orgService.saveRegion(editForm as Region);
    if (activeTab === 'sede') await orgService.saveSede(editForm as Sede);
    if (activeTab === 'local') await orgService.saveLocal(editForm as Local);
    
    setEditingId(null);
    setIsNew(false);
    refreshData();
  };

  const requestDelete = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      if (activeTab === 'org') await orgService.deleteOrg(itemToDelete.id);
      if (activeTab === 'region') await orgService.deleteRegion(itemToDelete.id);
      if (activeTab === 'sede') await orgService.deleteSede(itemToDelete.id);
      if (activeTab === 'local') await orgService.deleteLocal(itemToDelete.id);
      
      refreshData();
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  // --- CSV IMPORT LOGIC ---
  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (activeTab !== 'local') {
          alert("Importação em massa disponível apenas para LOCAIS no momento.");
          return;
      }

      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
          const text = event.target?.result as string;
          const lines = text.split('\n');
          let successCount = 0;
          let errorCount = 0;

          // Expect CSV Format: SEDE_ID, NOME, TIPO
          // Skip Header if present (simple check: if first line has 'SEDE' or 'TIPO')
          const startIndex = lines[0].toUpperCase().includes('SEDE') ? 1 : 0;

          for (let i = startIndex; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;

              const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
              
              if (parts.length >= 3) {
                  const [sedeId, name, tipoRaw] = parts;
                  const tipo = tipoRaw.toUpperCase(); // Normalize type

                  // Validate Sede
                  if (sedes.some(s => s.id === sedeId)) {
                      // Generate ID manually to avoid DB null error
                      const newId = `loc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                      
                      await orgService.saveLocal({
                          id: newId,
                          sedeId,
                          name,
                          tipo
                      });
                      successCount++;
                  } else {
                      console.warn(`Sede ID invalido na linha ${i + 1}: ${sedeId}`);
                      errorCount++;
                  }
              } else {
                  errorCount++;
              }
          }

          setIsLoading(false);
          alert(`Processamento Finalizado!\n\n✅ Importados: ${successCount}\n❌ Falhas/Ignorados: ${errorCount}\n\nNota: Certifique-se que o SEDE_ID existe.`);
          refreshData();
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      // FIX: Force ISO-8859-1 for Excel/Brazil compatibility
      reader.readAsText(file, 'ISO-8859-1');
  };

  const renderTabButton = (tab: Tab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => { setActiveTab(tab); setEditingId(null); setIsNew(false); }}
      className={`
        relative flex items-center px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest transition-all
        ${activeTab === tab 
          ? 'bg-brand-600 text-white border-b-2 border-brand-400' 
          : 'bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-brand-500 border-b-2 border-transparent'}
      `}
    >
      {icon}
      <span className="ml-2">{label}</span>
      {/* Tech corner if active */}
      {activeTab === tab && <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/50" />}
    </button>
  );

  const getHeaderTitle = () => {
      switch(activeTab) {
          case 'org': return 'REF. ID';
          case 'region': return 'INSTITUIÇÃO PAI';
          case 'sede': return 'REGIÃO / ENDEREÇO';
          case 'local': return 'SEDE / TIPO';
      }
  }

  const renderEditContent = () => {
      return (
        <div className="col-span-6 px-4">
            {activeTab === 'region' && (
            <select 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs p-2 outline-none focus:border-brand-500"
                value={editForm.organizationId}
                onChange={e => setEditForm({...editForm, organizationId: e.target.value})}
            >
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            )}
            {activeTab === 'sede' && (
            <div className="space-y-2">
                <select 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs p-2 outline-none focus:border-brand-500"
                    value={editForm.regionId}
                    onChange={e => setEditForm({...editForm, regionId: e.target.value})}
                >
                    {regions.map(r => <option key={r.id} value={r.id}>{r.name} ({orgs.find(o => o.id === r.organizationId)?.name})</option>)}
                </select>
                <input 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs p-2 outline-none focus:border-brand-500"
                    placeholder="ENDEREÇO FÍSICO"
                    value={editForm.address}
                    onChange={e => setEditForm({...editForm, address: e.target.value})}
                />
            </div>
            )}
            {activeTab === 'local' && (
            <div className="space-y-2">
                <select 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs p-2 outline-none focus:border-brand-500"
                    value={editForm.sedeId}
                    onChange={e => setEditForm({...editForm, sedeId: e.target.value})}
                >
                    {sedes.map(s => <option key={s.id} value={s.id}>{s.name} ({regions.find(r => r.id === s.regionId)?.name})</option>)}
                </select>
                <select
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs p-2 outline-none focus:border-brand-500"
                    value={editForm.tipo}
                    onChange={e => setEditForm({...editForm, tipo: e.target.value})}
                >
                    <option value="BEBEDOURO">BEBEDOURO / FILTRO</option>
                    <option value="POCO">POÇO ARTESIANO</option>
                    <option value="CISTERNA">CISTERNA</option>
                    <option value="CAIXA">CAIXA D'ÁGUA</option>
                    <option value="PISCINA">PISCINA</option>
                </select>
            </div>
            )}
        </div>
      );
  }
  
  const activeData = activeTab === 'org' ? orgs : activeTab === 'region' ? regions : activeTab === 'sede' ? sedes : locais;

  return (
    <div className="relative min-h-screen space-y-8 pb-20">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept=".csv" 
      />

      {/* ARCHITECTURAL BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none -z-10 fixed">
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] text-brand-600 dark:text-brand-500"
          style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '60px 60px' }}
        />
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.02] text-slate-900 dark:text-white"
          style={{ backgroundImage: `linear-gradient(currentColor 0.5px, transparent 0.5px), linear-gradient(90deg, currentColor 0.5px, transparent 0.5px)`, backgroundSize: '12px 12px' }}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div>
          <button onClick={() => navigate('/')} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors text-xs font-mono uppercase tracking-widest mb-2">
            <ArrowLeft size={14} className="mr-1" /> Voltar
          </button>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            <Database className="text-brand-500" size={28} />
            ESTRUTURA FÍSICA
          </h1>
          <p className="text-sm text-slate-500 font-mono">Topologia de locais e acessos.</p>
        </div>
        
        <div className="flex gap-2">
            <button 
              onClick={handleForceRefresh}
              className="flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              SINCRONIZAR
            </button>
            
            {activeTab === 'local' && (
                <button 
                    onClick={handleImportClick}
                    className="flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20"
                    title="CSV Format: SEDE_ID, NOME, TIPO"
                >
                    <FileUp size={16} className="mr-2" />
                    IMPORTAR CSV
                </button>
            )}

            {!editingId && (
              <button 
                onClick={handleStartNew}
                className="flex items-center justify-center px-6 py-3 bg-brand-600 text-white font-mono text-xs font-bold uppercase tracking-widest hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"
              >
                <Plus size={16} className="mr-2" />
                ADD {activeTab === 'org' ? 'INSTITUIÇÃO' : activeTab === 'region' ? 'REGIÃO' : activeTab === 'sede' ? 'SEDE' : 'LOCAL'}
              </button>
            )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {renderTabButton('org', 'INSTITUIÇÕES', <Building2 size={16} />)}
        {renderTabButton('region', 'REGIÕES', <Map size={16} />)}
        {renderTabButton('sede', 'SEDES', <MapPin size={16} />)}
        {renderTabButton('local', 'LOCAIS', <LocateFixed size={16} />)}
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm relative">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand-500/50"></div>

        {/* Header Row */}
        <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-950 p-3 border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
          <div className="col-span-4 pl-4">NOME / IDENTIFICAÇÃO</div>
          <div className="col-span-6">{getHeaderTitle()}</div>
          <div className="col-span-2 text-right pr-4">AÇÕES</div>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-sm">
          {(isNew && editingId) && (
            <div className="grid grid-cols-12 p-3 bg-brand-50 dark:bg-brand-900/10 items-center animate-in slide-in-from-left-4">
               <div className="col-span-4 pl-4">
                  <input 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2 text-xs focus:border-brand-500 outline-none text-slate-900 dark:text-white"
                    placeholder="NOME DO ITEM"
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    autoFocus
                  />
               </div>
               {renderEditContent()}
               <div className="col-span-2 flex justify-end gap-2 pr-4">
                 <button onClick={handleSave} className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-500"><Check size={14}/></button>
                 <button onClick={() => { setEditingId(null); setIsNew(false); }} className="p-1.5 bg-slate-600 text-white hover:bg-slate-500"><X size={14}/></button>
               </div>
            </div>
          )}

          {activeData.length === 0 && !isNew ? (
             <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                 <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 border border-dashed border-slate-300 dark:border-slate-700">
                    <AlertCircle size={24} />
                 </div>
                 <p className="font-mono text-xs uppercase">NENHUM REGISTRO</p>
             </div>
          ) : (
             activeData.map((item: any) => (
             editingId === item.id ? (
               <div key={item.id} className="grid grid-cols-12 p-3 bg-brand-50 dark:bg-brand-900/10 items-center animate-in fade-in">
                 <div className="col-span-4 pl-4">
                  <input 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2 text-xs focus:border-brand-500 outline-none text-slate-900 dark:text-white"
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                  />
                 </div>
                 {renderEditContent()}
                 <div className="col-span-2 flex justify-end gap-2 pr-4">
                   <button onClick={handleSave} className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-500"><Check size={14}/></button>
                   <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-600 text-white hover:bg-slate-500"><X size={14}/></button>
                 </div>
               </div>
             ) : (
               <div key={item.id} className="grid grid-cols-12 p-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                 <div className="col-span-4 pl-4 font-bold text-slate-800 dark:text-slate-200 uppercase">{item.name}</div>
                 <div className="col-span-6 text-xs text-slate-500 dark:text-slate-400">
                    {activeTab === 'org' && <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5">{item.id}</span>}
                    {activeTab === 'region' && (orgs.find(o => o.id === item.organizationId)?.name || 'N/A').toUpperCase()}
                    {activeTab === 'sede' && (
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-600 dark:text-brand-400">{(regions.find(r => r.id === item.regionId)?.name || 'N/A').toUpperCase()}</span>
                        <span className="text-[10px] opacity-70">{item.address || 'SEM ENDEREÇO'}</span>
                      </div>
                    )}
                     {activeTab === 'local' && (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-600 dark:text-brand-400">{(sedes.find(s => s.id === item.sedeId)?.name || 'N/A').toUpperCase()}</span>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1 text-slate-600 dark:text-slate-300">{item.tipo}</span>
                      </div>
                    )}
                 </div>
                 <div className="col-span-2 flex justify-end gap-2 pr-4 opacity-50 group-hover:opacity-100">
                   <button onClick={() => handleStartEdit(item)} className="text-slate-400 hover:text-brand-500"><Edit2 size={16}/></button>
                   <button onClick={() => requestDelete(item.id, item.name)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                 </div>
               </div>
             )
          ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal - Industrial */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#0C0C0E] border border-red-200 dark:border-red-900/50 w-full max-w-sm p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                </div>
                
                <h3 className="text-lg font-mono font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-widest">ATENÇÃO CRÍTICA</h3>
                <p className="text-xs font-mono text-red-500 dark:text-slate-400 mb-6">
                    EXCLUIR REGISTRO <span className="text-slate-900 dark:text-white font-bold">[{itemToDelete.name}]</span>?<br/>
                    DADOS VINCULADOS PODEM SER PERDIDOS.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setDeleteModalOpen(false)}
                      className="py-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-mono text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors uppercase"
                    >
                        CANCELAR
                    </button>
                    <button 
                      onClick={confirmDelete}
                      className="py-3 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-colors uppercase"
                    >
                        CONFIRMAR EXCLUSÃO
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
