import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, Layout, Save, X, Globe, Laptop } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppModule, UserRole, ModuleStatus, ModuleType } from '../types';
import { moduleService } from '../services/moduleService';

export const AdminModuleManagement: React.FC = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<AppModule[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
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

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza? Isso removerá o acesso ao módulo para todos.')) {
      moduleService.delete(id);
      setModules(moduleService.getAll());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors text-sm font-medium mb-2"
          >
            <ArrowLeft size={16} className="mr-1" />
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layout className="text-brand-600" />
            Gestão de Módulos
          </h1>
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => { setFormData(initialFormState); setIsEditing(true); }}
            className="flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Plus size={18} className="mr-2" />
            Novo Módulo
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              {formData.id ? 'Editar Módulo' : 'Novo Módulo'}
            </h2>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ícone (Nome Lucide)</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                  value={formData.iconName}
                  onChange={e => setFormData({...formData, iconName: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Aplicação</label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as ModuleType})}
                >
                  <option value={ModuleType.INTERNAL}>Interna (App View)</option>
                  <option value={ModuleType.EXTERNAL}>Externa (Link)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {formData.type === ModuleType.INTERNAL ? 'Rota Interna (/module/...)' : 'URL Externa (https://...)'}
                </label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                  value={formData.path}
                  onChange={e => setFormData({...formData, path: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Permissão Mínima</label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                  value={formData.minRole}
                  onChange={e => setFormData({...formData, minRole: e.target.value as UserRole})}
                >
                  {Object.values(UserRole).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

               <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as ModuleStatus})}
                >
                  {Object.values(ModuleStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-md transition-all hover:shadow-lg"
              >
                <Save size={18} className="mr-2" />
                Salvar Módulo
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {modules.map(module => (
             <div key={module.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-brand-200 dark:hover:border-slate-700 transition-colors">
               <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${module.type === ModuleType.EXTERNAL ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'}`}>
                    {module.type === ModuleType.EXTERNAL ? <Globe size={20} /> : <Laptop size={20} />}
                 </div>
                 <div>
                   <h3 className="font-semibold text-slate-900 dark:text-white">{module.title}</h3>
                   <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                     <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">{module.category}</span>
                     <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">{module.minRole}</span>
                     <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">{module.status}</span>
                   </div>
                 </div>
               </div>
               
               <div className="flex gap-2">
                 <button 
                  onClick={() => handleEdit(module)}
                  className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10 rounded-lg transition-colors"
                >
                   <Edit2 size={18} />
                 </button>
                 <button 
                  onClick={() => handleDelete(module.id)}
                  className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                >
                   <Trash2 size={18} />
                 </button>
               </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};