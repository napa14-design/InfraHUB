
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Map, MapPin, Plus, Trash2, Edit2, Check, X, Layout, LocateFixed, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Organization, Region, Sede, Local } from '../types';
import { orgService } from '../services/orgService';

type Tab = 'org' | 'region' | 'sede' | 'local';

export const AdminOrgManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('org');
  const [isLoading, setIsLoading] = useState(false);
  
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

  const renderTabButton = (tab: Tab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => { setActiveTab(tab); setEditingId(null); setIsNew(false); }}
      className={`
        flex items-center px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap
        ${activeTab === tab 
          ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' 
          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}
      `}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );

  const getHeaderTitle = () => {
      switch(activeTab) {
          case 'org': return 'ID';
          case 'region': return 'Instituição Pai';
          case 'sede': return 'Região / Endereço';
          case 'local': return 'Sede / Tipo';
      }
  }

  const getButtonLabel = () => {
    switch(activeTab) {
        case 'org': return 'Instituição';
        case 'region': return 'Região';
        case 'sede': return 'Sede';
        case 'local': return 'Local';
    }
  }

  // Helper to render the select content for Region, Sede, Local
  const renderEditContent = () => {
      return (
        <div className="col-span-6 px-4">
            {activeTab === 'region' && (
            <select 
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white"
                value={editForm.organizationId}
                onChange={e => setEditForm({...editForm, organizationId: e.target.value})}
            >
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            )}
            {activeTab === 'sede' && (
            <div className="space-y-2">
                <select 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white"
                    value={editForm.regionId}
                    onChange={e => setEditForm({...editForm, regionId: e.target.value})}
                >
                    {regions.map(r => <option key={r.id} value={r.id}>{r.name} ({orgs.find(o => o.id === r.organizationId)?.name})</option>)}
                </select>
                <input 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white"
                    placeholder="Endereço"
                    value={editForm.address}
                    onChange={e => setEditForm({...editForm, address: e.target.value})}
                />
            </div>
            )}
            {activeTab === 'local' && (
            <div className="space-y-2">
                <select 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white"
                    value={editForm.sedeId}
                    onChange={e => setEditForm({...editForm, sedeId: e.target.value})}
                >
                    {sedes.map(s => <option key={s.id} value={s.id}>{s.name} ({regions.find(r => r.id === s.regionId)?.name})</option>)}
                </select>
                <input 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white"
                    placeholder="Tipo (Ex: Bebedouro)"
                    value={editForm.tipo}
                    onChange={e => setEditForm({...editForm, tipo: e.target.value})}
                />
            </div>
            )}
        </div>
      );
  }
  
  const activeData = activeTab === 'org' ? orgs : activeTab === 'region' ? regions : activeTab === 'sede' ? sedes : locais;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors text-sm font-bold mb-2"
          >
            <ArrowLeft size={16} className="mr-1" />
            Voltar
          </button>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Building2 className="text-brand-500" size={32} />
            Estrutura Organizacional
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Configure a hierarquia completa de acesso.</p>
        </div>
        
        <div className="flex gap-2">
            <button 
              onClick={handleForceRefresh}
              className="flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw size={20} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            {!editingId && (
              <button 
                onClick={handleStartNew}
                className="flex items-center justify-center px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg hover:shadow-brand-500/25"
              >
                <Plus size={20} className="mr-2" />
                Adicionar {getButtonLabel()}
              </button>
            )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {renderTabButton('org', 'Instituições', <Building2 size={18} />)}
        {renderTabButton('region', 'Regiões', <Map size={18} />)}
        {renderTabButton('sede', 'Sedes', <MapPin size={18} />)}
        {renderTabButton('local', 'Locais (Fim)', <LocateFixed size={18} />)}
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[300px]">
        {/* Header Row */}
        <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4 pl-4">Nome</div>
          <div className="col-span-6">{getHeaderTitle()}</div>
          <div className="col-span-2 text-right pr-4">Ações</div>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {(isNew && editingId) && (
            <div className="grid grid-cols-12 p-4 bg-brand-50 dark:bg-brand-900/10 items-center">
              {/* Form Render Logic */}
               <div className="col-span-4 pl-4">
                  <input 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                    placeholder="Nome"
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                  />
               </div>
               {renderEditContent()}
               <div className="col-span-2 flex justify-end gap-2 pr-4">
                 <button onClick={handleSave} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"><Check size={16}/></button>
                 <button onClick={() => { setEditingId(null); setIsNew(false); }} className="p-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"><X size={16}/></button>
               </div>
            </div>
          )}

          {activeData.length === 0 && !isNew ? (
             <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                 <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={24} />
                 </div>
                 <p className="font-bold text-slate-600 dark:text-slate-300">Nenhum registro encontrado</p>
                 <p className="text-sm mt-1">Se você tem dados no Supabase, verifique as permissões (RLS) ou tente "Atualizar".</p>
             </div>
          ) : (
             activeData.map((item: any) => (
             editingId === item.id ? (
               <div key={item.id} className="grid grid-cols-12 p-4 bg-brand-50 dark:bg-brand-900/10 items-center animate-in fade-in">
                 {/* Edit Mode for Row */}
                 <div className="col-span-4 pl-4">
                  <input 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:text-white"
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                  />
                 </div>
                 {renderEditContent()}
                 <div className="col-span-2 flex justify-end gap-2 pr-4">
                   <button onClick={handleSave} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"><Check size={16}/></button>
                   <button onClick={() => setEditingId(null)} className="p-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"><X size={16}/></button>
                 </div>
               </div>
             ) : (
               <div key={item.id} className="grid grid-cols-12 p-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                 <div className="col-span-4 pl-4 font-medium text-slate-900 dark:text-slate-200">{item.name}</div>
                 <div className="col-span-6 text-sm text-slate-500 dark:text-slate-400">
                    {activeTab === 'org' && <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{item.id}</span>}
                    {activeTab === 'region' && orgs.find(o => o.id === item.organizationId)?.name}
                    {activeTab === 'sede' && (
                      <div>
                        <span className="font-bold text-brand-600 dark:text-brand-400">{regions.find(r => r.id === item.regionId)?.name}</span>
                        <div className="text-xs">{item.address}</div>
                      </div>
                    )}
                     {activeTab === 'local' && (
                      <div>
                        <span className="font-bold text-brand-600 dark:text-brand-400">{sedes.find(s => s.id === item.sedeId)?.name}</span>
                        <div className="text-xs bg-slate-100 dark:bg-slate-800 inline-block px-1 rounded">{item.tipo}</div>
                      </div>
                    )}
                 </div>
                 <div className="col-span-2 flex justify-end gap-2 pr-4">
                   <button onClick={() => handleStartEdit(item)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg"><Edit2 size={16}/></button>
                   <button onClick={() => requestDelete(item.id, item.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16}/></button>
                 </div>
               </div>
             )
          ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50 dark:border-red-900/20">
                    <AlertCircle size={32} />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Excluir Item?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                    Você está prestes a remover <strong>{itemToDelete.name}</strong>. <br/>
                    <span className="text-red-500 font-bold">Cuidado:</span> Isso pode excluir dados vinculados (cascata).
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setDeleteModalOpen(false)}
                      className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                      onClick={confirmDelete}
                      className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-colors"
                    >
                        Sim, Excluir
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
