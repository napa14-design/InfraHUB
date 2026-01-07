
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus, Trash2, Edit2, Shield, X, User as UserIcon, Building, Key, Copy, Check, Save, Map, MapPin, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, UserStatus, Sede, Organization, Region } from '../types';
import { authService } from '../services/authService';
import { orgService } from '../services/orgService';
import { notificationService } from '../services/notificationService';

export const AdminUserManagement: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser(); // Get logged in user
  
  const [users, setUsers] = useState<User[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  
  const [filter, setFilter] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form State
  const initialFormState: Partial<User> = {
    name: '',
    email: '',
    role: UserRole.OPERATIONAL,
    organizationId: '',
    regionId: '',
    sedeIds: [],
    status: 'ACTIVE'
  };
  const [formData, setFormData] = useState<Partial<User>>(initialFormState);
  
  // New User Created Password Display
  const [createdUserPass, setCreatedUserPass] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    loadData();
  }, [currentUser?.id]);

  const loadData = async () => {
    // FORCE REFRESH ORG STRUCTURE TO ENSURE DROPDOWNS ARE UP TO DATE
    await orgService.initialize();

    let allUsers = await authService.getAllUsers();
    
    // Permission Logic: Gestor sees only users from their Sede(s) logic?
    // Simplified: Gestors can see everyone in their Organization
    if (currentUser?.role === UserRole.GESTOR) {
        allUsers = allUsers.filter(u => u.organizationId === currentUser.organizationId);
    }

    setUsers(allUsers);
    setOrgs(orgService.getOrgs());
    setRegions(orgService.getRegions());
    setSedes(orgService.getSedes());
  };

  // --- ACTIONS ---

  const handleStartNew = async () => {
    // REFRESH DATA BEFORE OPENING TO CATCH NEW SQL INSERTS
    await loadData();

    setIsEditing(false);
    setEditingId(null);
    setCreatedUserPass(null);
    
    // Default Org if Gestor
    const defaultOrg = currentUser?.role === UserRole.GESTOR ? currentUser.organizationId : '';
    
    setFormData({ ...initialFormState, organizationId: defaultOrg });
    setIsModalOpen(true);
  };

  const handleStartEdit = async (user: User) => {
      // Permission Check: Gestor cannot edit Admin
      if (currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN) {
          alert("Você não tem permissão para editar Administradores.");
          return;
      }

      await loadData(); // Refresh data

      setIsEditing(true);
      setEditingId(user.id);
      setCreatedUserPass(null);
      setFormData({
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          regionId: user.regionId,
          sedeIds: user.sedeIds || [],
          status: user.status
      });
      setIsModalOpen(true);
  };

  const requestDelete = (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
        alert("Você não pode excluir a si mesmo.");
        return;
    }
    if (currentUser?.role !== UserRole.ADMIN && targetUser.role === UserRole.ADMIN) {
        alert("Você não tem permissão para excluir Administradores.");
        return;
    }
    setUserToDelete(targetUser);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await authService.deleteUser(userToDelete.id);
      
      // Notify
      await notificationService.add({
        id: `del-user-${Date.now()}`,
        title: 'Usuário Removido',
        message: `${userToDelete.name} foi removido do sistema por ${currentUser?.name}.`,
        type: 'WARNING',
        read: false,
        timestamp: new Date(),
        moduleSource: 'UserManagement'
      });

      loadData();
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && editingId) {
        // UPDATE
        await authService.updateUser(editingId, formData);
        
        await notificationService.add({
            id: `upd-user-${Date.now()}`,
            title: 'Usuário Atualizado',
            message: `Dados de ${formData.name} atualizados por ${currentUser?.name}.`,
            type: 'INFO',
            read: false,
            timestamp: new Date(),
            moduleSource: 'UserManagement'
        });

        loadData();
        setIsModalOpen(false); // Close immediately on edit
    } else {
        // CREATE
        const created = await authService.createUser(formData);
        
        await notificationService.add({
            id: `new-user-${Date.now()}`,
            title: 'Novo Usuário',
            message: `${formData.name} foi adicionado ao sistema por ${currentUser?.name}.`,
            type: 'SUCCESS',
            read: false,
            timestamp: new Date(),
            moduleSource: 'UserManagement'
        });

        loadData();
        if (created) {
           setCreatedUserPass(created.password || 'Erro'); // Show password screen
        }
    }
  };

  const closeAndReset = () => {
    setIsModalOpen(false);
    setCreatedUserPass(null);
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const toggleStatus = async (user: User) => {
    // Permission check
    if (currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN) {
        return; 
    }
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await authService.updateUser(user.id, { status: newStatus });
    
    // Optional: Notify on status change
    if (newStatus === 'INACTIVE') {
         await notificationService.add({
            id: `status-user-${Date.now()}`,
            title: 'Acesso Revogado',
            message: `O acesso de ${user.name} foi inativado.`,
            type: 'WARNING',
            read: false,
            timestamp: new Date(),
            moduleSource: 'UserManagement'
        });
    }

    loadData();
  };

  // --- MULTI-SELECT HELPER ---
  const toggleSedeSelection = (sedeId: string) => {
      const current = formData.sedeIds || [];
      if (current.includes(sedeId)) {
          setFormData({ ...formData, sedeIds: current.filter(id => id !== sedeId) });
      } else {
          setFormData({ ...formData, sedeIds: [...current, sedeId] });
      }
  };

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(filter.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(filter.toLowerCase())
  );

  // Derived options for Cascading Dropdowns
  // Using explicit check for organizationId to handle possible mismatches during loading
  const availableRegions = regions.filter(r => !formData.organizationId || r.organizationId === formData.organizationId);
  const availableSedes = sedes.filter(s => !formData.regionId || s.regionId === formData.regionId);

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <Shield className="text-brand-600" />
            Gestão de Usuários
          </h1>
          <p className="text-sm text-slate-500">
             Controle de acesso e atribuição de unidades.
          </p>
        </div>
        
        <button 
          onClick={handleStartNew}
          className="flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Novo Usuário
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Função</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acesso</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user) => {
                  const userSedes = user.sedeIds || [];
                  const locationDisplay = userSedes.length > 1 
                    ? `${userSedes.length} Sedes` 
                    : userSedes.length === 1 
                        ? sedes.find(s => s.id === userSedes[0])?.name || userSedes[0]
                        : 'Sem Sede';
                  
                  // Safe access to name
                  const displayName = user.name || 'Sem Nome';
                  const initial = displayName.charAt(0) || '?';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full mr-3 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-600">
                            {initial}
                        </div>
                        <div>
                            <div className="font-medium text-slate-900 dark:text-white">{displayName}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                        </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${user.role === UserRole.ADMIN ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' : 
                            user.role === UserRole.GESTOR ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}
                        `}>
                        {user.role}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {locationDisplay}
                    </td>
                    <td className="px-6 py-4">
                        <button 
                            onClick={() => toggleStatus(user)} 
                            disabled={currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN}
                            className="focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className={`inline-flex items-center text-sm font-medium ${user.status === 'ACTIVE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                            </span>
                        </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                        <button 
                            onClick={() => handleStartEdit(user)}
                            className={`text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors ${currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                        <Edit2 size={18} />
                        </button>
                        <button 
                        onClick={() => requestDelete(user)}
                        className={`text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors ${currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                        <Trash2 size={18} />
                        </button>
                    </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                Nenhum usuário encontrado.
            </div>
        )}
      </div>

      {/* --- USER MODAL --- */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                      <button onClick={closeAndReset}><X className="text-slate-500 hover:text-slate-700" /></button>
                  </div>

                  {createdUserPass ? (
                      // SHOW PASSWORD SCREEN (Same as before)
                      <div className="p-8 text-center bg-emerald-50/50 dark:bg-emerald-900/10">
                          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800">
                              <Key size={32} />
                          </div>
                          <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Usuário Criado com Sucesso!</h4>
                          <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                              Esta é a senha temporária para o primeiro acesso. <br/> 
                              <span className="font-bold text-red-500">Copie e envie para o usuário agora</span>.
                          </p>
                          
                          <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 flex items-center justify-between mb-8">
                              <code className="text-2xl font-mono font-black text-slate-800 dark:text-slate-200 tracking-widest pl-2">
                                  {createdUserPass}
                              </code>
                              <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(createdUserPass);
                                    alert("Senha copiada!");
                                }} 
                                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-600 rounded-lg text-sm font-bold flex items-center gap-2"
                              >
                                  <Copy size={18} /> Copiar
                              </button>
                          </div>
                          <button onClick={closeAndReset} className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl">
                              Entendido
                          </button>
                      </div>
                  ) : (
                      // EDIT/CREATE FORM - CASCADING LOGIC
                      <form onSubmit={handleSubmit} className="p-6 space-y-5">
                          {/* Name & Email */}
                          <div className="grid grid-cols-1 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                                  <div className="relative">
                                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                      <input 
                                          required
                                          className="w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                                          placeholder="Ex: João Silva"
                                          value={formData.name}
                                          onChange={e => setFormData({...formData, name: e.target.value})}
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail Corporativo</label>
                                  <input 
                                      required
                                      type="email"
                                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                                      placeholder="joao@nexus.com"
                                      value={formData.email}
                                      onChange={e => setFormData({...formData, email: e.target.value})}
                                  />
                              </div>
                          </div>

                          {/* Role & Org */}
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Função</label>
                                  <select 
                                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                                      value={formData.role}
                                      onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                                      disabled={currentUser?.role !== UserRole.ADMIN && isEditing}
                                  >
                                      {Object.values(UserRole).map(role => (
                                          (currentUser?.role !== UserRole.ADMIN && role === UserRole.ADMIN) 
                                          ? null 
                                          : <option key={role} value={role}>{role}</option>
                                      ))}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Instituição</label>
                                  <div className="relative">
                                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                      <select 
                                          className="w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-500 dark:text-white appearance-none disabled:opacity-60"
                                          value={formData.organizationId}
                                          onChange={e => setFormData({...formData, organizationId: e.target.value, regionId: '', sedeIds: []})} // Reset region/sedes on change
                                          disabled={currentUser?.role === UserRole.GESTOR}
                                      >
                                          <option value="">Selecione...</option>
                                          {orgs.map(org => (
                                              <option key={org.id} value={org.id}>{org.name}</option>
                                          ))}
                                      </select>
                                  </div>
                              </div>
                          </div>

                          {/* Region Selection (Cascading) */}
                          <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Região de Atuação</label>
                                <div className="relative">
                                    <Map className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select 
                                        className="w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-500 dark:text-white appearance-none disabled:opacity-60"
                                        value={formData.regionId}
                                        onChange={e => setFormData({...formData, regionId: e.target.value, sedeIds: []})} // Reset sedes on change
                                        disabled={!formData.organizationId}
                                    >
                                        <option value="">Selecione a Região...</option>
                                        {availableRegions.map(reg => (
                                            <option key={reg.id} value={reg.id}>{reg.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {formData.organizationId && availableRegions.length === 0 && (
                                    <p className="text-xs text-amber-500 mt-1">Nenhuma região encontrada para esta instituição.</p>
                                )}
                          </div>

                          {/* Multi-Sede Selection */}
                          <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Sedes de Acesso <span className="text-xs text-slate-500 font-normal">(Selecione múltiplas se necessário)</span>
                                </label>
                                {formData.regionId ? (
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                                        {availableSedes.length > 0 ? (
                                            <div className="space-y-2">
                                                {availableSedes.map(sede => (
                                                    <label key={sede.id} className="flex items-center space-x-3 p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                                                        <input 
                                                            type="checkbox"
                                                            checked={formData.sedeIds?.includes(sede.id)}
                                                            onChange={() => toggleSedeSelection(sede.id)}
                                                            className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{sede.name}</div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500 text-center py-4">Nenhuma sede cadastrada nesta região.</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-sm">
                                        Selecione uma Região primeiro.
                                    </div>
                                )}
                          </div>

                          {/* Buttons */}
                          <div className="pt-4 flex gap-3">
                              <button type="button" onClick={closeAndReset} className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
                              <button type="submit" className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2">
                                  {isEditing ? <Save size={18}/> : <Plus size={18}/>}
                                  {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
                              </button>
                          </div>
                      </form>
                  )}
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50 dark:border-red-900/20">
                    <AlertCircle size={32} />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Excluir Usuário?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                    Você está prestes a remover o acesso de <strong>{userToDelete.name}</strong>. <br/>
                    Esta ação não pode ser desfeita.
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
