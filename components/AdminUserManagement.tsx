import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus, Trash2, Edit2, Shield, X, User as UserIcon, Building, Key, Copy, Check, Save, Map, MapPin, AlertCircle, Terminal, MailWarning, Globe, Lock, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, UserStatus, Sede, Organization, Region } from '../types';
import { authService } from '../services/authService';
import { orgService } from '../services/orgService';
import { notificationService } from '../services/notificationService';
import { useToast } from './Shared/ToastContext';

export const AdminUserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const currentUser = authService.getCurrentUser(); 
  
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

  // Reset Password Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [newGeneratedPassword, setNewGeneratedPassword] = useState<string | null>(null);

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
  const [manualPassword, setManualPassword] = useState('');
  
  // New User Created Password Display
  const [createdUserPass, setCreatedUserPass] = useState<string | null>(null);
  const [creationWarning, setCreationWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    loadData();
  }, [currentUser?.id]);

  const loadData = async () => {
    await orgService.initialize();
    let allUsers = await authService.getAllUsers();
    
    if (currentUser?.role === UserRole.GESTOR) {
        allUsers = allUsers.filter(u => u.organizationId === currentUser.organizationId);
    }

    setUsers(allUsers);
    setOrgs(orgService.getOrgs());
    setRegions(orgService.getRegions());
    setSedes(orgService.getSedes());
  };

  const handleStartNew = async () => {
    await loadData();
    setIsEditing(false);
    setEditingId(null);
    setCreatedUserPass(null);
    setCreationWarning(null);
    setManualPassword(''); 
    const defaultOrg = currentUser?.role === UserRole.GESTOR ? currentUser.organizationId : '';
    setFormData({ ...initialFormState, organizationId: defaultOrg });
    setIsModalOpen(true);
  };

  const handleStartEdit = async (user: User) => {
      if (currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN) {
          addToast("Você não tem permissão para editar Administradores.", "error");
          return;
      }
      await loadData();
      setIsEditing(true);
      setEditingId(user.id);
      setCreatedUserPass(null);
      setCreationWarning(null);
      setManualPassword('');
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
        addToast("Você não pode excluir a si mesmo.", "warning");
        return;
    }
    if (currentUser?.role !== UserRole.ADMIN && targetUser.role === UserRole.ADMIN) {
        addToast("Você não tem permissão para excluir Administradores.", "error");
        return;
    }
    setUserToDelete(targetUser);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await authService.deleteUser(userToDelete.id);
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
      addToast("Usuário removido com sucesso.", "success");
    }
  };

  const handleResetPassword = (user: User) => {
      if (currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN) {
          addToast("Você não tem permissão para resetar Administradores.", "error");
          return;
      }
      setUserToReset(user);
      setNewGeneratedPassword(null);
      setResetModalOpen(true);
  };

  const confirmResetPassword = async () => {
      if (userToReset) {
          const randomPass = Math.random().toString(36).slice(-8).toUpperCase();
          const result = await authService.adminResetPassword(userToReset.id, randomPass);
          if (result.success) {
              setNewGeneratedPassword(randomPass);
          } else {
              addToast("Erro ao resetar senha. Verifique conexão.", "error");
          }
      }
  };

  const closeResetModal = () => {
      setResetModalOpen(false);
      setUserToReset(null);
      setNewGeneratedPassword(null);
  };

  const validateForm = () => {
      if (!formData.name || formData.name.trim().length < 3) {
          addToast("Nome deve ter no mínimo 3 caracteres.", "warning");
          return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email || !emailRegex.test(formData.email)) {
          addToast("E-mail inválido.", "warning");
          return false;
      }
      if (!formData.role) {
          addToast("Selecione um nível de acesso.", "warning");
          return false;
      }
      if (formData.role !== UserRole.ADMIN) {
          if (!formData.organizationId) {
              addToast("Usuários Operacionais e Gestores devem pertencer a uma Instituição.", "warning");
              return false;
          }
          if (formData.role === UserRole.OPERATIONAL && (!formData.sedeIds || formData.sedeIds.length === 0)) {
              addToast("Usuários Operacionais devem estar vinculados a pelo menos uma Unidade/Sede.", "warning");
              return false;
          }
      }
      if (!isEditing && manualPassword && manualPassword.length < 6) {
          addToast("A senha manual deve ter no mínimo 6 caracteres.", "warning");
          return false;
      }
      return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditing && editingId) {
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
        setIsModalOpen(false);
        addToast("Usuário atualizado com sucesso.", "success");
    } else {
        const created = await authService.createUser(formData, manualPassword || undefined);
        if (created.error) {
            addToast(`Falha ao criar usuário: ${created.error}`, "error");
            return;
        }
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
        if (created && created.password) {
           setCreatedUserPass(created.password);
           if (created.warning) setCreationWarning(created.warning);
           addToast("Usuário criado com sucesso! Salve as credenciais exibidas.", "success");
        } else {
           setIsModalOpen(false);
           addToast(`Usuário "${formData.name}" criado com sucesso!`, "success");
        }
    }
  };

  const closeAndReset = () => {
    setIsModalOpen(false);
    setCreatedUserPass(null);
    setCreationWarning(null);
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialFormState);
    setManualPassword('');
  };

  const toggleStatus = async (user: User) => {
    if (currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN) {
        addToast("Ação não permitida em Administradores.", "error");
        return; 
    }
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await authService.updateUser(user.id, { status: newStatus });
    
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
    addToast(`Status de ${user.name} alterado para ${newStatus}.`, "info");
  };

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

  const availableRegions = regions.filter(r => !formData.organizationId || r.organizationId === formData.organizationId);
  
  // FIX: Ensure sedes are filtered by selected organization if region is not selected yet
  const availableSedes = sedes.filter(s => {
      if (formData.regionId) {
          return s.regionId === formData.regionId;
      }
      if (formData.organizationId) {
          // If no region selected, show all sedes for this organization
          // We find regions belonging to this org first
          const orgRegionIds = regions.filter(r => r.organizationId === formData.organizationId).map(r => r.id);
          return orgRegionIds.includes(s.regionId);
      }
      return false; 
  });

  // --- RENDER HELPERS ---
  const UserStatusBadge = ({ status }: { status: string }) => (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
          status === 'ACTIVE' 
          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
      }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
          {status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
      </span>
  );

  const UserRoleBadge = ({ role }: { role: string }) => (
      <span className={`inline-block px-2 py-1 text-[10px] font-bold border uppercase tracking-wider rounded
        ${role === UserRole.ADMIN ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' : 
          role === UserRole.GESTOR ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 
          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}
      `}>
        {role}
      </span>
  );

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div>
          <button onClick={() => navigate('/')} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors text-xs font-mono uppercase tracking-widest mb-2">
            <ArrowLeft size={14} className="mr-2" /> Voltar ao Hub
          </button>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            <Shield className="text-brand-600 dark:text-brand-400" size={28} />
            CONTROLE DE ACESSO
          </h1>
          <p className="text-sm text-slate-500 font-mono">
             Gerenciamento de credenciais e permissões.
          </p>
        </div>
        
        <button 
          onClick={handleStartNew}
          className="flex items-center justify-center px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-none border border-brand-400 dark:border-brand-500 font-bold uppercase tracking-widest text-xs transition-all hover:shadow-[0_0_15px_rgba(14,165,233,0.3)] w-full sm:w-auto"
        >
          <Plus size={16} className="mr-2" /> Novo Usuário
        </button>
      </div>

      {/* Filter */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-cyan-500 rounded opacity-20 group-hover:opacity-40 transition duration-300"></div>
        <div className="relative flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1">
          <div className="pl-3 text-slate-400"><Search size={18} /></div>
          <input 
            type="text"
            placeholder="BUSCAR USUÁRIO..."
            className="w-full bg-transparent border-none outline-none px-3 py-3 text-sm font-mono text-slate-700 dark:text-slate-200 placeholder:text-slate-400 uppercase"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {/* --- DESKTOP TABLE VIEW (md and up) --- */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">Identidade / Nome</th>
                <th className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cargo</th>
                <th className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">Acesso Local</th>
                <th className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredUsers.map((user) => {
                  const userSedes = user.sedeIds || [];
                  let locationDisplay = 'SEM LOCAL';
                  if (user.role === UserRole.ADMIN) locationDisplay = 'ACESSO GLOBAL';
                  else if (userSedes.length > 1) locationDisplay = `${userSedes.length} UNIDADES`;
                  else if (userSedes.length === 1) locationDisplay = sedes.find(s => s.id === userSedes[0])?.name || userSedes[0];
                  
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold border border-slate-300 dark:border-slate-700">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white uppercase">{user.name}</div>
                                <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4"><UserRoleBadge role={user.role} /></td>
                    <td className="px-6 py-4 text-xs">
                        {locationDisplay === 'ACESSO GLOBAL' ? (
                            <span className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold"><Globe size={14} /> ACESSO GLOBAL</span>
                        ) : (
                            <span className="text-slate-600 dark:text-slate-400 uppercase">{locationDisplay}</span>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        <button onClick={() => toggleStatus(user)} disabled={currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN}>
                            <UserStatusBadge status={user.status} />
                        </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleResetPassword(user)} className="text-amber-500 hover:text-amber-600 disabled:opacity-30" title="Resetar Senha" disabled={currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN}><Lock size={16} /></button>
                        <button onClick={() => handleStartEdit(user)} className="text-brand-600 hover:text-brand-400 disabled:opacity-30" disabled={currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN}><Edit2 size={16} /></button>
                        <button onClick={() => requestDelete(user)} className="text-red-600 hover:text-red-400 disabled:opacity-30" disabled={currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN}><Trash2 size={16} /></button>
                    </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MOBILE CARD VIEW (xs to sm) --- */}
      <div className="md:hidden grid grid-cols-1 gap-4">
          {filteredUsers.map((user) => {
              const userSedes = user.sedeIds || [];
              let locationDisplay = 'SEM LOCAL';
              if (user.role === UserRole.ADMIN) locationDisplay = 'ACESSO GLOBAL';
              else if (userSedes.length > 1) locationDisplay = `${userSedes.length} UNIDADES`;
              else if (userSedes.length === 1) locationDisplay = sedes.find(s => s.id === userSedes[0])?.name || userSedes[0];

              return (
                  <div key={user.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold border border-slate-200 dark:border-slate-700 rounded-lg text-lg">
                                  {user.name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                  <div className="font-black text-slate-900 dark:text-white uppercase text-sm">{user.name}</div>
                                  <div className="text-xs text-slate-500">{user.email}</div>
                              </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                              <UserRoleBadge role={user.role} />
                              <button onClick={() => toggleStatus(user)} disabled={currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN}>
                                  <UserStatusBadge status={user.status} />
                              </button>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
                          {locationDisplay === 'ACESSO GLOBAL' ? <Globe size={14} className="text-purple-500" /> : <MapPin size={14} />}
                          <span className="uppercase font-mono">{locationDisplay}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => handleResetPassword(user)} disabled={currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN} className="flex flex-col items-center justify-center py-2 bg-amber-50 dark:bg-amber-900/10 text-amber-600 rounded-lg text-[10px] font-bold uppercase hover:bg-amber-100 disabled:opacity-50">
                              <Lock size={16} className="mb-1" /> Senha
                          </button>
                          <button onClick={() => handleStartEdit(user)} disabled={currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN} className="flex flex-col items-center justify-center py-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-100 disabled:opacity-50">
                              <Edit2 size={16} className="mb-1" /> Editar
                          </button>
                          <button onClick={() => requestDelete(user)} disabled={currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN} className="flex flex-col items-center justify-center py-2 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-lg text-[10px] font-bold uppercase hover:bg-red-100 disabled:opacity-50">
                              <Trash2 size={16} className="mb-1" /> Excluir
                          </button>
                      </div>
                  </div>
              );
          })}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#0C0C0E] w-full max-w-xl border border-slate-200 dark:border-slate-700 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-3">
                          <Terminal className="text-brand-600 dark:text-brand-500" size={20} />
                          <h3 className="text-lg font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">{isEditing ? 'ATUALIZAR PERFIL' : 'NOVO CADASTRO'}</h3>
                      </div>
                      <button onClick={closeAndReset}><X className="text-slate-500 hover:text-slate-900 dark:hover:text-white" /></button>
                  </div>
                  {createdUserPass ? (
                      <div className="p-8 text-center bg-white dark:bg-[#0C0C0E]">
                          {/* Success View */}
                          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-6 border border-emerald-500/30"><Check size={32} /></div>
                          <h4 className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-500 mb-2 uppercase tracking-widest">Sucesso!</h4>
                          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm font-mono">Copie a chave de acesso abaixo.<br/><span className="text-red-500">Esta informação não será exibida novamente.</span></p>
                          <div className="bg-slate-100 dark:bg-black border border-emerald-500/50 p-6 mb-8 flex items-center justify-between group relative">
                              <code className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.2em]">{createdUserPass}</code>
                              <button onClick={() => { navigator.clipboard.writeText(createdUserPass); addToast("Copiado!", "success"); }} className="text-emerald-600"><Copy size={20} /></button>
                          </div>
                          <button onClick={closeAndReset} className="w-full py-3 bg-brand-600 text-white font-mono font-bold uppercase">CIENTE</button>
                      </div>
                  ) : (
                      <form onSubmit={handleSubmit} className="p-6 space-y-5 relative z-10 bg-white dark:bg-[#0C0C0E]">
                          <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-1"><label className="text-[10px] font-mono text-brand-600 uppercase">NOME COMPLETO</label><input required className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono" placeholder="DIGITE O NOME..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                              <div className="space-y-1"><label className="text-[10px] font-mono text-brand-600 uppercase">E-MAIL</label><input required type="email" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono" placeholder="USER@NEXUS.COM" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                              {!isEditing && <div className="space-y-1"><label className="text-[10px] font-mono text-brand-600 uppercase">SENHA INICIAL (OPCIONAL)</label><input type="text" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono" placeholder="VAZIO P/ AUTO-GERAR" value={manualPassword} onChange={e => setManualPassword(e.target.value)} minLength={6} /></div>}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1"><label className="text-[10px] font-mono text-brand-600 uppercase">NÍVEL</label><select className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} disabled={currentUser?.role !== UserRole.ADMIN && isEditing}>{Object.values(UserRole).map(role => (currentUser?.role !== UserRole.ADMIN && role === UserRole.ADMIN) ? null : <option key={role} value={role}>{role}</option>)}</select></div>
                              <div className="space-y-1"><label className="text-[10px] font-mono text-brand-600 uppercase">INSTITUIÇÃO</label><select className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono" value={formData.organizationId} onChange={e => setFormData({...formData, organizationId: e.target.value, regionId: '', sedeIds: []})} disabled={currentUser?.role === UserRole.GESTOR || formData.role === UserRole.ADMIN}><option value="">{formData.role === UserRole.ADMIN ? 'GLOBAL' : 'SELECIONE...'}</option>{orgs.map(org => <option key={org.id} value={org.id}>{org.name.toUpperCase()}</option>)}</select></div>
                          </div>
                          {formData.role !== UserRole.ADMIN && (
                              <>
                                <div className="space-y-1"><label className="text-[10px] font-mono text-brand-600 uppercase">REGIÃO</label><select className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono" value={formData.regionId} onChange={e => setFormData({...formData, regionId: e.target.value, sedeIds: []})} disabled={!formData.organizationId}><option value="">SELECIONE...</option>{availableRegions.map(reg => <option key={reg.id} value={reg.id}>{reg.name.toUpperCase()}</option>)}</select></div>
                                <div className="space-y-1"><label className="text-[10px] font-mono text-brand-600 uppercase mb-2 block">UNIDADES (MULTI)</label>{formData.organizationId ? <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-2 max-h-32 overflow-y-auto">{availableSedes.length > 0 ? <div className="space-y-1">{availableSedes.map(sede => <label key={sede.id} className="flex items-center space-x-3 p-2 hover:bg-slate-200 dark:hover:bg-white/5 cursor-pointer"><input type="checkbox" checked={formData.sedeIds?.includes(sede.id)} onChange={() => toggleSedeSelection(sede.id)} className="w-4 h-4" /><div className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 uppercase">{sede.name}</div></label>)}</div> : <p className="text-xs text-slate-500 text-center">NENHUM DADO</p>}</div> : <div className="p-3 text-center border border-dashed border-slate-300 text-slate-500 text-xs font-mono uppercase">AGUARDANDO ORG...</div>}</div>
                              </>
                          )}
                          <div className="pt-4 flex gap-3 border-t border-slate-200 dark:border-slate-800 mt-2"><button type="button" onClick={closeAndReset} className="flex-1 py-3 text-slate-500 font-mono text-xs uppercase hover:bg-slate-100 transition-colors">CANCELAR</button><button type="submit" className="flex-1 py-3 bg-brand-600 text-white font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">{isEditing ? <Save size={14}/> : <Plus size={14}/>}<span>{isEditing ? 'SALVAR' : 'CRIAR'}</span></button></div>
                      </form>
                  )}
              </div>
          </div>
      )}
      
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#0C0C0E] border border-red-200 dark:border-red-900/50 w-full max-w-sm p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 flex items-center justify-center mx-auto mb-6"><AlertCircle size={32} /></div>
                <h3 className="text-xl font-mono font-bold text-slate-900 dark:text-white mb-2 uppercase">CONFIRMAR EXCLUSÃO</h3>
                <p className="text-xs font-mono text-red-500 dark:text-red-400 mb-8">AÇÃO IRREVERSÍVEL. REMOVER ACESSO DE <br/> <span className="text-slate-900 dark:text-white font-bold text-sm">[{userToDelete.name}]</span>?</p>
                <div className="grid grid-cols-2 gap-3"><button onClick={() => setDeleteModalOpen(false)} className="py-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-mono text-xs hover:bg-slate-200 transition-colors">CANCELAR</button><button onClick={confirmDelete} className="py-3 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-colors">CONFIRMAR</button></div>
            </div>
        </div>
      )}
      {resetModalOpen && userToReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-[#0C0C0E] w-full max-w-md border border-amber-200 dark:border-amber-900/50 shadow-2xl relative p-8 text-center">
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                  {newGeneratedPassword ? (
                      <div className="animate-in zoom-in-95">
                          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 flex items-center justify-center mx-auto mb-6"><Check size={32} /></div>
                          <h3 className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-500 mb-2 uppercase">Senha Redefinida</h3>
                          <div className="bg-slate-100 dark:bg-black p-4 mb-6 flex items-center justify-between border border-emerald-500/30"><code className="text-2xl font-mono font-bold text-slate-800 dark:text-white tracking-[0.2em]">{newGeneratedPassword}</code><button onClick={() => { navigator.clipboard.writeText(newGeneratedPassword!); addToast("Copiado!", "success"); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-emerald-600"><Copy size={20} /></button></div>
                          <button onClick={closeResetModal} className="w-full py-3 bg-emerald-600 text-white font-mono font-bold uppercase tracking-wider hover:bg-emerald-700">Concluir</button>
                      </div>
                  ) : (
                      <div>
                          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 flex items-center justify-center mx-auto mb-6"><Key size={32} /></div>
                          <h3 className="text-xl font-mono font-bold text-slate-900 dark:text-white mb-2 uppercase">Resetar Senha</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-8">Gerar nova senha para <strong>{userToReset.name}</strong>?<br/>A senha anterior será invalidada.</p>
                          <div className="grid grid-cols-2 gap-3"><button onClick={closeResetModal} className="py-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-mono text-xs hover:bg-slate-200 transition-colors uppercase">Cancelar</button><button onClick={confirmResetPassword} className="py-3 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-bold transition-colors uppercase">Gerar Nova Senha</button></div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};