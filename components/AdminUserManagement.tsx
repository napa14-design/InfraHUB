
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus, Trash2, Edit2, Shield, X, User as UserIcon, Building, Key, Copy, Check, Save, Map, MapPin, AlertCircle, Terminal, MailWarning, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, UserStatus, Sede, Organization, Region } from '../types';
import { authService } from '../services/authService';
import { orgService } from '../services/orgService';
import { notificationService } from '../services/notificationService';
import { useToast } from './Shared/ToastContext';

export const AdminUserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
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
  const [manualPassword, setManualPassword] = useState(''); // New state for custom password
  
  // New User Created Password Display
  const [createdUserPass, setCreatedUserPass] = useState<string | null>(null);
  const [creationWarning, setCreationWarning] = useState<string | null>(null);

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
    setCreationWarning(null);
    setManualPassword(''); // Reset password field
    
    // Default Org if Gestor
    const defaultOrg = currentUser?.role === UserRole.GESTOR ? currentUser.organizationId : '';
    
    setFormData({ ...initialFormState, organizationId: defaultOrg });
    setIsModalOpen(true);
  };

  const handleStartEdit = async (user: User) => {
      // Permission Check: Gestor cannot edit Admin
      if (currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN) {
          addToast("Você não tem permissão para editar Administradores.", "error");
          return;
      }

      await loadData(); // Refresh data

      setIsEditing(true);
      setEditingId(user.id);
      setCreatedUserPass(null);
      setCreationWarning(null);
      setManualPassword(''); // No password on edit
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
      addToast("Usuário removido com sucesso.", "success");
    }
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
      
      // Role validation
      if (!formData.role) {
          addToast("Selecione um nível de acesso.", "warning");
          return false;
      }

      // Hierarchy validation
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

      // Manual Password validation on creation
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
        addToast("Usuário atualizado com sucesso.", "success");
    } else {
        // CREATE
        // Pass manualPassword if set, otherwise undefined (auto-generate)
        const created = await authService.createUser(formData, manualPassword || undefined);
        
        // Handle Errors from Service
        if (created.error) {
            addToast(`Falha ao criar usuário: ${created.error}`, "error");
            return; // STOP execution, keep modal open
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
           setCreatedUserPass(created.password); // Show password screen
           if (created.warning) setCreationWarning(created.warning);
           addToast("Usuário criado. Copie a senha gerada.", "success");
        } else {
           setIsModalOpen(false); // Should rarely happen if no password returned
           addToast("Usuário criado com sucesso.", "success");
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
    // Permission check
    if (currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN) {
        addToast("Ação não permitida em Administradores.", "error");
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
    addToast(`Status de ${user.name} alterado para ${newStatus}.`, "info");
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
  const availableRegions = regions.filter(r => !formData.organizationId || r.organizationId === formData.organizationId);
  const availableSedes = sedes.filter(s => !formData.regionId || s.regionId === formData.regionId);

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
          className="flex items-center justify-center px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-none border border-brand-400 dark:border-brand-500 font-bold uppercase tracking-widest text-xs transition-all hover:shadow-[0_0_15px_rgba(14,165,233,0.3)]"
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

      {/* Technical Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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

                  // --- FIX FOR ADMIN DISPLAY ---
                  if (user.role === UserRole.ADMIN) {
                      locationDisplay = 'ACESSO GLOBAL';
                  } else if (userSedes.length > 1) {
                      locationDisplay = `${userSedes.length} UNIDADES`;
                  } else if (userSedes.length === 1) {
                      locationDisplay = sedes.find(s => s.id === userSedes[0])?.name || userSedes[0];
                  }
                  
                  const displayName = user.name || 'Sem Nome';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold border border-slate-300 dark:border-slate-700">
                                {displayName.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white uppercase">{displayName}</div>
                                <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 text-[10px] font-bold border uppercase tracking-wider
                        ${user.role === UserRole.ADMIN ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' : 
                            user.role === UserRole.GESTOR ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}
                        `}>
                        {user.role}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                        {/* STYLE FOR GLOBAL ACCESS */}
                        {locationDisplay === 'ACESSO GLOBAL' ? (
                            <span className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
                                <Globe size={14} /> ACESSO GLOBAL
                            </span>
                        ) : (
                            <span className="text-slate-600 dark:text-slate-400 uppercase">{locationDisplay}</span>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        <button 
                            onClick={() => toggleStatus(user)} 
                            disabled={currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN}
                            title="Clique para alterar status"
                            className={`
                                relative inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-200
                                ${user.status === 'ACTIVE' 
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'}
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            {user.status === 'ACTIVE' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />}
                            {user.status === 'ACTIVE' ? 'ATIVO' : 'INATIVO'}
                        </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleStartEdit(user)} className="text-brand-600 hover:text-brand-400 disabled:opacity-30" disabled={currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN}>
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => requestDelete(user)} className="text-red-600 hover:text-red-400 disabled:opacity-30" disabled={currentUser?.role !== UserRole.ADMIN && user.role === UserRole.ADMIN}>
                            <Trash2 size={16} />
                        </button>
                    </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- USER MODAL (Blueprint Style - Adaptive Light/Dark) --- */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#0C0C0E] w-full max-w-xl border border-slate-200 dark:border-slate-700 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto">
                  {/* Grid Overlay */}
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
                  
                  <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-3">
                          <Terminal className="text-brand-600 dark:text-brand-500" size={20} />
                          <h3 className="text-lg font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">{isEditing ? 'ATUALIZAR PERFIL' : 'NOVO CADASTRO'}</h3>
                      </div>
                      <button onClick={closeAndReset}><X className="text-slate-500 hover:text-slate-900 dark:hover:text-white" /></button>
                  </div>

                  {createdUserPass ? (
                      <div className="p-8 text-center bg-white dark:bg-[#0C0C0E]">
                          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                              <Key size={32} />
                          </div>
                          <h4 className="text-xl font-mono font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-widest">Credenciais Geradas</h4>
                          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm font-mono">
                              Copie a chave de acesso abaixo. <br/> 
                              <span className="text-red-500 dark:text-red-400">Esta informação não será exibida novamente.</span>
                          </p>
                          
                          <div className="bg-slate-100 dark:bg-black border border-emerald-500/50 p-6 mb-8 flex items-center justify-between group relative">
                              <code className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.2em]">
                                  {createdUserPass}
                              </code>
                              <button 
                                onClick={() => { navigator.clipboard.writeText(createdUserPass); addToast("Copiado para área de transferência", "success"); }} 
                                className="text-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                              >
                                  <Copy size={20} />
                              </button>
                              {/* Corner Accents */}
                              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-emerald-500"></div>
                              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-emerald-500"></div>
                          </div>

                          {creationWarning && (
                              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-left rounded-lg flex gap-3">
                                  <MailWarning className="text-amber-600 flex-shrink-0" />
                                  <p className="text-xs text-amber-700 dark:text-amber-400 font-mono leading-relaxed">
                                      <strong>ATENÇÃO:</strong> {creationWarning}
                                  </p>
                              </div>
                          )}

                          <button onClick={closeAndReset} className="w-full py-3 bg-brand-600 hover:bg-brand-700 dark:hover:bg-brand-500 text-white font-mono font-bold uppercase tracking-wider transition-colors">
                              CIENTE
                          </button>
                      </div>
                  ) : (
                      <form onSubmit={handleSubmit} className="p-6 space-y-5 relative z-10 bg-white dark:bg-[#0C0C0E]">
                          {/* Inputs with Tech Style */}
                          <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-mono text-brand-600 dark:text-brand-500 uppercase tracking-widest">NOME COMPLETO</label>
                                  <input 
                                      required
                                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                                      placeholder="DIGITE O NOME..."
                                      value={formData.name}
                                      onChange={e => setFormData({...formData, name: e.target.value})}
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-mono text-brand-600 dark:text-brand-500 uppercase tracking-widest">E-MAIL CORPORATIVO</label>
                                  <input 
                                      required
                                      type="email"
                                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:border-brand-500 outline-none"
                                      placeholder="USER@NEXUS.COM"
                                      value={formData.email}
                                      onChange={e => setFormData({...formData, email: e.target.value})}
                                  />
                              </div>
                              
                              {!isEditing && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-brand-600 dark:text-brand-500 uppercase tracking-widest">SENHA INICIAL (OPCIONAL, MIN 6 CARACTERES)</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:border-brand-500 outline-none"
                                        placeholder="VAZIO PARA GERAR AUTOMATICAMENTE"
                                        value={manualPassword}
                                        onChange={e => setManualPassword(e.target.value)}
                                        minLength={6}
                                    />
                                </div>
                              )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-mono text-brand-600 dark:text-brand-500 uppercase tracking-widest">NÍVEL DE ACESSO</label>
                                  <select 
                                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono outline-none focus:border-brand-500"
                                      value={formData.role}
                                      onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                                      disabled={currentUser?.role !== UserRole.ADMIN && isEditing}
                                  >
                                      {Object.values(UserRole).map(role => (
                                          (currentUser?.role !== UserRole.ADMIN && role === UserRole.ADMIN) ? null : <option key={role} value={role}>{role}</option>
                                      ))}
                                  </select>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-mono text-brand-600 dark:text-brand-500 uppercase tracking-widest">INSTITUIÇÃO</label>
                                  <select 
                                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono outline-none focus:border-brand-500 disabled:opacity-50"
                                      value={formData.organizationId}
                                      onChange={e => setFormData({...formData, organizationId: e.target.value, regionId: '', sedeIds: []})}
                                      disabled={currentUser?.role === UserRole.GESTOR || formData.role === UserRole.ADMIN}
                                  >
                                      <option value="">{formData.role === UserRole.ADMIN ? 'GLOBAL' : 'SELECIONE...'}</option>
                                      {orgs.map(org => (
                                          <option key={org.id} value={org.id}>{org.name.toUpperCase()}</option>
                                      ))}
                                  </select>
                              </div>
                          </div>

                          {formData.role === UserRole.ADMIN ? (
                              /* ADMIN GLOBAL BANNER */
                              <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg flex items-center justify-center gap-3 text-purple-700 dark:text-purple-300">
                                  <Globe size={24} />
                                  <div className="text-center">
                                      <p className="text-sm font-bold uppercase">Acesso Irrestrito Habilitado</p>
                                      <p className="text-xs opacity-70">Administradores possuem visão de todas as sedes.</p>
                                  </div>
                              </div>
                          ) : (
                              /* REGULAR LOCATION SELECTORS */
                              <>
                                <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-brand-600 dark:text-brand-500 uppercase tracking-widest">REGIÃO DE OPERAÇÃO</label>
                                        <select 
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono outline-none focus:border-brand-500 disabled:opacity-50"
                                            value={formData.regionId}
                                            onChange={e => setFormData({...formData, regionId: e.target.value, sedeIds: []})}
                                            disabled={!formData.organizationId}
                                        >
                                            <option value="">SELECIONE A REGIÃO...</option>
                                            {availableRegions.map(reg => (
                                                <option key={reg.id} value={reg.id}>{reg.name.toUpperCase()}</option>
                                            ))}
                                        </select>
                                </div>

                                <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-brand-600 dark:text-brand-500 uppercase tracking-widest mb-2 block">
                                            UNIDADES VINCULADAS [MULTI-SELEÇÃO]
                                        </label>
                                        {formData.regionId ? (
                                            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-2 max-h-32 overflow-y-auto">
                                                {availableSedes.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {availableSedes.map(sede => (
                                                            <label key={sede.id} className="flex items-center space-x-3 p-2 hover:bg-slate-200 dark:hover:bg-white/5 cursor-pointer transition-colors">
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={formData.sedeIds?.includes(sede.id)}
                                                                    onChange={() => toggleSedeSelection(sede.id)}
                                                                    className="w-4 h-4 rounded-none border border-slate-500 bg-transparent text-brand-600 focus:ring-0 checked:bg-brand-500"
                                                                />
                                                                <div className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 uppercase">{sede.name}</div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs font-mono text-slate-500 text-center py-2">NENHUM DADO ENCONTRADO</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-3 text-center border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-xs font-mono uppercase">
                                                AGUARDANDO REGIÃO...
                                            </div>
                                        )}
                                </div>
                              </>
                          )}

                          {/* Footer Actions */}
                          <div className="pt-4 flex gap-3 border-t border-slate-200 dark:border-slate-800 mt-2">
                              <button type="button" onClick={closeAndReset} className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs uppercase hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">CANCELAR</button>
                              <button type="submit" className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 dark:hover:bg-brand-500 text-white font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                  {isEditing ? <Save size={14}/> : <Plus size={14}/>}
                                  <span>{isEditing ? 'SALVAR ALTERAÇÕES' : 'CRIAR USUÁRIO'}</span>
                              </button>
                          </div>
                      </form>
                  )}
              </div>
          </div>
      )}

      {/* Delete Modal - Adaptive */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#0C0C0E] border border-red-200 dark:border-red-900/50 w-full max-w-sm p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={32} />
                </div>
                
                <h3 className="text-xl font-mono font-bold text-slate-900 dark:text-white mb-2 uppercase">CONFIRMAR EXCLUSÃO</h3>
                <p className="text-xs font-mono text-red-500 dark:text-red-400 mb-8">
                    AÇÃO IRREVERSÍVEL. REMOVER ACESSO DE <br/> <span className="text-slate-900 dark:text-white font-bold text-sm">[{userToDelete.name}]</span>?
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setDeleteModalOpen(false)}
                      className="py-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-mono text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                        CANCELAR
                    </button>
                    <button 
                      onClick={confirmDelete}
                      className="py-3 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-colors"
                    >
                        CONFIRMAR
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
