
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, Layout, Save, X, Globe, Laptop, AlertCircle, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppModule, UserRole, ModuleStatus, ModuleType } from '../types';
import { moduleService } from '../services/moduleService';

export const AdminModuleManagement: React.FC = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<AppModule[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<AppModule | null>(null);
  
  // Empty state for form
  const initialFormState: AppModule = {
    id: '',
    title: '',
    description: '',
    iconName: 'Box',
    minRole: UserRole.OPERATIONAL,
    path: '',
    status: ModuleStatus.NORMAL,
    category: 'OPERATIONAL',
    type: ModuleType.INTERNAL
  };

  const [formData, setFormData] = useState<AppModule>(initialFormState);

  useEffect(() => {
    setModules(moduleService.getAll());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const moduleToSave = { ...formData };
    
    // Generate ID if new
    if (!moduleToSave.id) {
        moduleToSave.id = `mod-${Date.now()}`;
    }

    moduleService.save(moduleToSave);
    setModules(moduleService.getAll());
    setIsEditing(false);
    setFormData(initialFormState);
  };

  const handleEdit = (module: AppModule) => {
    setFormData(module);
    setIsEditing(true);
  };

  const requestDelete = (module: AppModule) => {
    setModuleToDelete(module);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (moduleToDelete) {
      moduleService.delete(moduleToDelete.id);
      setModules(moduleService.getAll());
      setDeleteModalOpen(false);
      setModuleToDelete(null);
    }
  };

  return (
    <div className="relative min-h-screen space-y-6 pb-20">
      
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
            <Layout className="text-brand-600 dark:text-brand-400" size={28} />
            CATÁLOGO DE APLICAÇÕES
          </h1>
          <p className="text-sm text-slate-500 font-mono">Registro de ferramentas e dashboards.</p>
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => { setFormData(initialFormState); setIsEditing(true); }}
            className="flex items-center justify-center px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-mono text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-brand-500/20"
          >
            <Plus size={16} className="mr-2" />
            NOVO MÓDULO
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white dark:bg-[#0C0C0E] border border-slate-200 dark:border-slate-700 shadow-xl p-8 relative overflow-hidden max-w-4xl mx-auto">
          {/* Tech lines */}
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-600"></div>
          
          <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-mono font-bold text-slate-900 dark:text-white uppercase tracking-widest">
              {formData.id ? `EDITAR // ${formData.id}` : 'NOVO REGISTRO'}
            </h2>
            <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-600 dark:text-brand-500 uppercase tracking-widest">NOME DE EXIBIÇÃO</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:border-brand-500 outline-none"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-600 dark:text-brand-500 uppercase tracking-widest">ÍCONE (LUCIDE LIB)</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:border-brand-500 outline-none"
                  value={formData.iconName}
                  onChange={e => setFormData({...formData, iconName: e.target.value})}
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-mono text-brand-600 dark:text-brand-500 uppercase tracking-widest">DESCRIÇÃO FUNCIONAL</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:border-brand-500 outline-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-600 dark:text-brand-500 uppercase tracking-widest">TIPO DE APLICAÇÃO</label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono outline-none focus:border-brand-500"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as ModuleType})}
                >
                  <option value={ModuleType.INTERNAL}>ROTA INTERNA</option>
                  <option value={ModuleType.EXTERNAL}>LINK EXTERNO</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-600 dark:text-brand-500 uppercase tracking-widest">
                  {formData.type === ModuleType.INTERNAL ? 'ROTA INTERNA' : 'URL DE DESTINO'}
                </label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:border-brand-500 outline-none"
                  value={formData.path}
                  onChange={e => setFormData({...formData, path: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-600 dark:text-brand-500 uppercase tracking-widest">PERMISSÃO MÍNIMA</label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono outline-none focus:border-brand-500"
                  value={formData.minRole}
                  onChange={e => setFormData({...formData, minRole: e.target.value as UserRole})}
                >
                  {Object.values(UserRole).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

               <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-600 dark:text-brand-500 uppercase tracking-widest">STATUS DO SISTEMA</label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono outline-none focus:border-brand-500"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as ModuleStatus})}
                >
                  {Object.values(ModuleStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs uppercase hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center px-8 py-3 bg-brand-600 hover:bg-brand-700 dark:hover:bg-brand-500 text-white font-mono font-bold text-xs uppercase tracking-widest transition-colors shadow-lg shadow-brand-500/20"
              >
                <Save size={16} className="mr-2" />
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {modules.map(module => (
             <div key={module.id} className="group bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-brand-500 dark:hover:border-brand-500 transition-all duration-300 relative overflow-hidden">
               {/* Hover Accent */}
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
               
               <div className="flex items-center gap-5">
                 <div className={`w-12 h-12 flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-brand-500 group-hover:border-brand-500/50 transition-colors`}>
                    {module.type === ModuleType.EXTERNAL ? <Globe size={24} strokeWidth={1.5} /> : <Box size={24} strokeWidth={1.5} />}
                 </div>
                 <div>
                   <h3 className="font-mono font-bold text-slate-900 dark:text-white text-lg">{module.title}</h3>
                   <div className="flex gap-3 text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 uppercase">
                     <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5">{module.category}</span>
                     <span className="text-brand-600 dark:text-brand-400">REQ: {module.minRole}</span>
                     <span>{module.status}</span>
                   </div>
                 </div>
               </div>
               
               <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                 <button 
                  onClick={() => handleEdit(module)}
                  className="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                   <Edit2 size={18} />
                 </button>
                 <button 
                  onClick={() => requestDelete(module)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                   <Trash2 size={18} />
                 </button>
               </div>
             </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && moduleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#0C0C0E] border border-red-200 dark:border-red-900/50 w-full max-w-sm p-8 text-center relative">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                </div>
                
                <h3 className="text-lg font-mono font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-widest">CONFIRMAR REMOÇÃO</h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-6">
                    ALVO: <span className="text-slate-900 dark:text-white font-bold">[{moduleToDelete.title}]</span><br/>
                    O ACESSO SERÁ REVOGADO PARA TODOS.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setDeleteModalOpen(false)}
                      className="py-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-mono text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors uppercase"
                    >
                        Cancelar
                    </button>
                    <button 
                      onClick={confirmDelete}
                      className="py-3 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-colors uppercase"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};