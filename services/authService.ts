
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js'; 
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';
import { logService } from './logService';

const SESSION_KEY = 'nexus_auth_user';

// Helper for generating IDs safely in all environments
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// --- TRANSLATION HELPER ---
const translateAuthError = (message: string): string => {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
    if (m.includes("email not confirmed")) return "E-mail pendente de confirmação. Verifique sua caixa de entrada.";
    if (m.includes("user not found")) return "Usuário não encontrado.";
    if (m.includes("already registered")) return "Este e-mail já está cadastrado no sistema.";
    if (m.includes("password should be at least")) return "A senha deve ter no mínimo 6 caracteres.";
    if (m.includes("weak password")) return "Senha muito fraca. Tente uma combinação mais complexa.";
    if (m.includes("too many requests") || m.includes("rate limit")) return "Muitas tentativas consecutivas. Aguarde alguns instantes.";
    if (m.includes("session expired")) return "Sessão expirada. Faça login novamente.";
    if (m.includes("anonymous")) return "Acesso anônimo não permitido.";
    if (m.includes("network")) return "Erro de conexão. Verifique sua internet.";
    
    // Fallback amigável mantendo o erro original para debug se necessário
    return `Não foi possível completar a ação. (${message})`;
};

export const authService = {
  // Login with Supabase or Mock
  login: async (email: string, passwordInput: string): Promise<{ user: User | null; error?: string }> => {
    try {
      console.log(`[Auth] Attempting login for: ${email}`);
      let supabaseErrorMsg = '';

      // 1. Try Supabase Auth first if configured
      if (isSupabaseConfigured()) {
          console.log("[Auth] Supabase is configured. Sending request...");
          
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password: passwordInput,
          });

          if (authError) {
            console.warn("[Auth] Supabase SignIn failed (falling back to mock):", authError.message);
            supabaseErrorMsg = authError.message;
            // DO NOT RETURN HERE. Fall through to check Mocks.
          } else if (authData.user) {
              console.log("[Auth] User authenticated via Auth. Fetching profile...", authData.user.id);
              
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();

              if (profileError) {
                  console.error("[Auth] Profile Fetch Error:", profileError);
                  return { 
                      user: null, 
                      error: "Login realizado, mas o perfil de usuário não foi encontrado." 
                  };
              }

              if (profileData) {
                  // --- BLOCK IF INACTIVE ---
                  if (profileData.status !== 'ACTIVE') {
                      await supabase.auth.signOut(); // Kill the session immediately
                      return { 
                          user: null, 
                          error: "Acesso negado. Sua conta foi desativada pelo administrador." 
                      };
                  }

                  const appUser: User = {
                    id: authData.user.id,
                    email: authData.user.email || '',
                    name: profileData.name || 'Usuário',
                    role: profileData.role as UserRole,
                    status: profileData.status,
                    isFirstLogin: profileData.is_first_login ?? false, // Map from DB
                    organizationId: profileData.organization_id,
                    regionId: profileData.region_id,
                    sedeIds: profileData.sede_ids || [],
                  };
                  localStorage.setItem(SESSION_KEY, JSON.stringify(appUser));
                  
                  // LOG LOGIN ACTION
                  logService.logAction(appUser, 'AUTH', 'LOGIN', 'Sistema', 'Login via Supabase realizado com sucesso.');
                  
                  return { user: appUser };
              }
          }
      } else {
        console.warn("[Auth] Supabase NOT configured. Falling back to Mocks.");
      }

      // 2. Fallback to MOCK_USERS if Supabase failed or not configured
      const mockUser = MOCK_USERS.find(u => u.email === email);
      if (mockUser) {
          // --- BLOCK IF INACTIVE (MOCK) ---
          if (mockUser.status !== 'ACTIVE') {
              return { 
                  user: null, 
                  error: "Acesso negado. Sua conta foi desativada pelo administrador." 
              };
          }

          console.log("[Auth] Mock user found.");
          localStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));
          
          // LOG LOGIN ACTION
          logService.logAction(mockUser, 'AUTH', 'LOGIN', 'Sistema', 'Login (Mock Mode) realizado com sucesso.');

          return { user: mockUser };
      }

      // 3. If no mock user found, return the translated Supabase error if it exists
      if (supabaseErrorMsg) {
          return { user: null, error: translateAuthError(supabaseErrorMsg) };
      }

      return { user: null, error: 'E-mail ou senha incorretos.' };

    } catch (err: any) {
      console.error("[Auth] Unexpected Exception:", err);
      return { user: null, error: `Erro inesperado: ${err.message || err}` };
    }
  },

  logout: async () => {
    const user = authService.getCurrentUser();
    if (user) {
        logService.logAction(user, 'AUTH', 'LOGIN', 'Sistema', 'Logout realizado.');
    }
    if (isSupabaseConfigured()) await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Defensive check for name
            if (!parsed.name) parsed.name = 'Usuário';
            
            // Validate against Supabase session if configured (Basic check)
            // Note: Full async session check happens in App.tsx AuthObserver
            if (isSupabaseConfigured()) {
               // We trust localStorage temporarily for synchronous render, 
               // but App.tsx will redirect if session is invalid.
            }

            if (parsed.status !== 'ACTIVE') {
                localStorage.removeItem(SESSION_KEY);
                return null;
            }

            return parsed;
        } catch (e) {
            return null;
        }
    }
    return null;
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return data.map((p: any) => ({
            id: p.id,
            name: p.name || 'Sem Nome', 
            email: p.email || '',
            role: p.role as UserRole,
            status: p.status,
            isFirstLogin: p.is_first_login ?? false,
            organizationId: p.organization_id,
            regionId: p.region_id,
            sedeIds: p.sede_ids || []
        }));
    } catch (e) {
        return MOCK_USERS;
    }
  },

  createUser: async (userData: Partial<User>, customPassword?: string): Promise<any> => {
     let tempId: string = generateId(); 
     
     // Generate robust password
     const generatedPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
     const finalGeneratedPassword = generatedPassword.slice(0, 10).toUpperCase(); 
     
     const tempPassword = customPassword || finalGeneratedPassword;

     if (tempPassword.length < 6) {
         return { error: "A senha deve ter no mínimo 6 caracteres." };
     }

     const currentUser = authService.getCurrentUser();

     if (isSupabaseConfigured()) {
         try {
             // Accessing properties safely from the initialized client
             // @ts-ignore
             const sbUrl = supabase.supabaseUrl;
             // @ts-ignore
             const sbKey = supabase.supabaseKey;

             if (sbUrl && sbKey && userData.email) {
                 // Create a temporary client to avoid logging out the current admin
                 const tempClient = createClient(sbUrl, sbKey, {
                     auth: {
                         persistSession: false,
                         autoRefreshToken: false,
                         detectSessionInUrl: false
                     }
                 });

                 console.log("[Auth] Creating Auth User via Shadow Client...");
                 const { data: authData, error: authError } = await tempClient.auth.signUp({
                     email: userData.email,
                     password: tempPassword,
                     options: {
                         data: {
                             name: userData.name,
                             role: userData.role
                         }
                     }
                 });

                 if (authError) {
                     console.error("[Auth] Error creating Auth User:", authError.message);
                     return { error: translateAuthError(authError.message) };
                 } 
                 
                 let emailConfirmationRequired = false;

                 if (authData.user) {
                     tempId = authData.user.id; // USE THE REAL ID
                     if (!authData.session) {
                         emailConfirmationRequired = true;
                     }
                 } else {
                     return { error: "Falha na criação do usuário Auth. Verifique o email." };
                 }

                 // Insert into profiles table
                 const { error } = await supabase.from('profiles').upsert({
                     id: tempId, 
                     email: userData.email,
                     name: userData.name || 'Novo Usuário',
                     role: userData.role || 'OPERATIONAL',
                     organization_id: userData.organizationId || null,
                     region_id: userData.regionId || null,
                     sede_ids: userData.sedeIds || [],
                     status: 'ACTIVE',
                     is_first_login: true // FORCE FIRST LOGIN FLAG
                 }).select().single();

                 if (error) {
                     console.error("Error creating/updating profile in DB:", error.code, error.message);
                     return { error: "Erro ao salvar perfil do usuário no banco de dados." };
                 }

                 if (currentUser) {
                     logService.logAction(currentUser, 'ADMIN', 'CREATE', `Usuário ${userData.email}`, `Criou conta para ${userData.name} (${userData.role})`);
                 }

                 return { 
                    id: tempId, 
                    email: userData.email, 
                    password: tempPassword,
                    warning: emailConfirmationRequired ? "Este usuário requer confirmação de e-mail antes de logar." : undefined
                 };
             }
         } catch (e: any) {
             console.error("Unexpected error in createUser:", e);
             return { error: e.message || "Erro inesperado." };
         }
     }
     
     // Always update Mock/Local state so UI feels responsive
     MOCK_USERS.push({
         id: tempId,
         name: userData.name || 'Novo Usuário',
         email: userData.email || 'novo@email.com',
         role: userData.role || UserRole.OPERATIONAL,
         organizationId: userData.organizationId,
         regionId: userData.regionId,
         sedeIds: userData.sedeIds || [],
         status: 'ACTIVE',
         isFirstLogin: true
     });

     if (currentUser) {
         logService.logAction(currentUser, 'ADMIN', 'CREATE', `Usuário ${userData.email}`, `Criou conta (Mock) para ${userData.name}`);
     }

     return { 
         id: tempId, 
         email: userData.email, 
         password: tempPassword
     };
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User | null> => {
    const currentUser = authService.getCurrentUser();
    
    if (isSupabaseConfigured()) {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.role) dbUpdates.role = updates.role;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.sedeIds) dbUpdates.sede_ids = updates.sedeIds;
        if (updates.organizationId) dbUpdates.organization_id = updates.organizationId;
        if (updates.regionId) dbUpdates.region_id = updates.regionId;
        if (updates.isFirstLogin !== undefined) dbUpdates.is_first_login = updates.isFirstLogin;

        await supabase.from('profiles').update(dbUpdates).eq('id', id);
        
        if (currentUser) {
            logService.logAction(currentUser, 'ADMIN', 'UPDATE', `Usuário ID ${id}`, `Atualizou dados: ${Object.keys(updates).join(', ')}`);
        }
    }
    
    // Update local storage if self
    if (currentUser && currentUser.id === id) {
       const merged = { ...currentUser, ...updates };
       // If I updated my own status to inactive, logout immediately on next refresh/check
       if (merged.status !== 'ACTIVE') {
           localStorage.removeItem(SESSION_KEY);
       } else {
           localStorage.setItem(SESSION_KEY, JSON.stringify(merged));
       }
       return merged;
    }
    return null;
  },

  deleteUser: async (id: string) => {
    const currentUser = authService.getCurrentUser();
    
    if (isSupabaseConfigured()) {
        await supabase.from('profiles').delete().eq('id', id);
        // Note: Auth user deletion is restricted via client SDK. Usually handled by Edge Function or Admin API.
        // We delete the profile which effectively removes access from the app logic.
    } else {
        const idx = MOCK_USERS.findIndex(u => u.id === id);
        if (idx > -1) MOCK_USERS.splice(idx, 1);
    }

    if (currentUser) {
        logService.logAction(currentUser, 'ADMIN', 'DELETE', `Usuário ID ${id}`, 'Removeu conta do sistema');
    }
  },

  hasPermission: (userRole: UserRole, requiredRole: UserRole): boolean => {
    const levels = {
      [UserRole.OPERATIONAL]: 1,
      [UserRole.GESTOR]: 2,
      [UserRole.ADMIN]: 3
    };
    return levels[userRole] >= levels[requiredRole];
  },
  
  changePassword: async (userId: string, newPassword: string): Promise<boolean> => {
      if (isSupabaseConfigured()) {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (!error) {
              const currentUser = authService.getCurrentUser();
              if (currentUser) {
                  logService.logAction(currentUser, 'AUTH', 'UPDATE', 'Senha', 'Alterou a própria senha');
              }
              return true;
          }
          return false;
      }
      return true;
  },

  confirmPasswordReset: async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
      if (isSupabaseConfigured()) {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) return { success: false, error: translateAuthError(error.message) };
          return { success: true };
      }
      return { success: true };
  },

  resetPasswordRequest: async (email: string): Promise<{success: boolean, message?: string}> => {
      // Logic to detect "Dummy" or "Internal" accounts based on domain conventions
      if (email.endsWith('.local') || email.includes('interno')) {
          return { 
              success: false, 
              message: "Contas operacionais internas não recebem e-mail. Solicite o reset de senha diretamente ao seu Gestor." 
          };
      }

      if (isSupabaseConfigured()) {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/#/update-password`,
          });
          return { success: !error };
      }
      return { success: true };
  },

  // NEW FUNCTION: Admin Reset Password (Production Ready via Edge Function)
  // Calls 'admin-reset-password' Edge Function to bypass client-side restrictions
  adminResetPassword: async (targetUserId: string, newPassword: string): Promise<{success: boolean, error?: string}> => {
      const currentUser = authService.getCurrentUser();
      
      if (!isSupabaseConfigured()) {
          // Mock Mode: Update directly
          const u = MOCK_USERS.find(u => u.id === targetUserId);
          if (u) {
              u.isFirstLogin = true; 
          }
          return { success: true };
      } else {
          // Supabase Mode: Try Edge Function first
          try {
              
                          console.log('[ADMIN_RESET_PASSWORD] Attempting invoke:', { userId: targetUserId, passwordLength: newPassword.length });
              const { data, error } = await supabase.functions.invoke('admin-reset-password', {
                              headers: { 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}` },
                  body: { userId: targetUserId, newPassword: newPassword }
              });

              if (error) {
console.error('[ADMIN_RESET_PASSWORD] Edge Function Error:', { error: error?.message, code: error?.name, userId: targetUserId });                  // Fallback: Just mark as 'Force Reset', but warn admin that password wasn't changed on backend
                  await supabase.from('profiles').update({ is_first_login: true }).eq('id', targetUserId);
                  return { 
                      success: false, 
error: `Erro ao resetar senha: ${error?.message || 'Erro desconhecido'}. Verifique se a Edge Function 'admin-reset-password' está deployed no Supabase.`                  };
              }

              if (currentUser) {
                  logService.logAction(currentUser, 'AUTH', 'UPDATE', `Reset Senha ID ${targetUserId}`, 'Resetou senha via Edge Function');
              }
                          console.log('[ADMIN_RESET_PASSWORD] Success - Password reset completed for user:', targetUserId);
              
              return { success: true };

          } catch (e) {
              console.error("Invoke Error:", e);
              return { success: false, error: "Erro de conexão com o servidor de funções." };
          }
      }
  },

  completeFirstLogin: async (userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
      if (isSupabaseConfigured()) {
          // 1. Update Auth Password (User is logged in as themselves here, so this works)
          const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
          if (authError) return { success: false, error: translateAuthError(authError.message) };

          // 2. Update Profile Flag - REMOVE THE FLAG so it doesn't loop
          const { error: dbError } = await supabase.from('profiles')
            .update({ is_first_login: false })
            .eq('id', userId);
            
          if (dbError) return { success: false, error: "Senha alterada, mas falha ao atualizar status no perfil." };
      } else {
          // Mock Mode
          const u = MOCK_USERS.find(u => u.id === userId);
          if (u) u.isFirstLogin = false;
      }

      // Update Local Storage
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
          currentUser.isFirstLogin = false;
          localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
          logService.logAction(currentUser, 'AUTH', 'UPDATE', 'Primeiro Acesso', 'Definiu senha e ativou a conta');
      }

      return { success: true };
  }
};
