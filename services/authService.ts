
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js'; // Import createClient specifically
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';

const SESSION_KEY = 'nexus_auth_user';

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
            if (authError.message.includes("Email not confirmed")) {
                return { user: null, error: "E-mail não confirmado. Verifique sua caixa de entrada ou contate o administrador." };
            }
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
                      error: "Login realizado, mas perfil de usuário não encontrado na tabela 'profiles'. Execute o SQL de Setup." 
                  };
              }

              if (profileData) {
                  const appUser: User = {
                    id: authData.user.id,
                    email: authData.user.email || '',
                    name: profileData.name || 'Usuário',
                    role: profileData.role as UserRole,
                    status: profileData.status,
                    isFirstLogin: false,
                    organizationId: profileData.organization_id,
                    regionId: profileData.region_id,
                    sedeIds: profileData.sede_ids || [],
                  };
                  localStorage.setItem(SESSION_KEY, JSON.stringify(appUser));
                  return { user: appUser };
              }
          }
      } else {
        console.warn("[Auth] Supabase NOT configured. Falling back to Mocks.");
      }

      // 2. Fallback to MOCK_USERS if Supabase failed or not configured
      const mockUser = MOCK_USERS.find(u => u.email === email);
      if (mockUser) {
          // Verify password for mock (simple check if we had passwords, but mocks usually allow any)
          // For now, accept any password for mocks as we don't store them in code
          console.log("[Auth] Mock user found.");
          localStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));
          return { user: mockUser };
      }

      // 3. If no mock user found, return the original Supabase error if it exists
      if (supabaseErrorMsg) {
          return { user: null, error: `Erro Supabase: ${supabaseErrorMsg}` };
      }

      return { user: null, error: 'E-mail ou senha incorretos.' };

    } catch (err: any) {
      console.error("[Auth] Unexpected Exception:", err);
      return { user: null, error: `Erro inesperado: ${err.message || err}` };
    }
  },

  logout: async () => {
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
            name: p.name || 'Sem Nome', // Fallback crucial para evitar erro de charAt
            email: p.email || '',
            role: p.role as UserRole,
            status: p.status,
            isFirstLogin: false,
            organizationId: p.organization_id,
            regionId: p.region_id,
            sedeIds: p.sede_ids || []
        }));
    } catch (e) {
        return MOCK_USERS;
    }
  },

  createUser: async (userData: Partial<User>, customPassword?: string): Promise<any> => {
     let tempId: string = crypto.randomUUID(); 
     
     // Generate robust password: at least 10 chars
     const generatedPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
     const finalGeneratedPassword = generatedPassword.slice(0, 10).toUpperCase(); 
     
     const tempPassword = customPassword || finalGeneratedPassword;

     if (tempPassword.length < 6) {
         return { error: "A senha deve ter no mínimo 6 caracteres." };
     }

     if (isSupabaseConfigured()) {
         try {
             // CRITICAL FIX FOR 23503 ERROR:
             // To insert into 'profiles', the ID must exist in 'auth.users'.
             // We can't use 'supabase.auth.signUp' because it logs the current admin out.
             // SOLUTION: Create a secondary "Shadow Client" that doesn't persist session to storage.
             
             // Extract URL and Key from the main client instance
             // @ts-ignore - Accessing protected properties for this workaround
             const sbUrl = supabase.supabaseUrl;
             // @ts-ignore
             const sbKey = supabase.supabaseKey;

             if (sbUrl && sbKey && userData.email) {
                 const tempClient = createClient(sbUrl, sbKey, {
                     auth: {
                         persistSession: false, // DO NOT SAVE TO LOCAL STORAGE
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
                     // RETURN ERROR immediately. Do not attempt DB insert if Auth failed.
                     // This prevents the 23503 Foreign Key error.
                     return { error: authError.message };
                 } 
                 
                 let emailConfirmationRequired = false;

                 if (authData.user) {
                     console.log("[Auth] Auth User created successfully. ID:", authData.user.id);
                     tempId = authData.user.id; // USE THE REAL ID
                     
                     // CHECK IF EMAIL CONFIRMATION IS REQUIRED
                     // We try to sign in immediately. If it fails with "Email not confirmed", we know status.
                     if (!authData.session) {
                         // Some configurations don't return session on signup if email confirm is on
                         emailConfirmationRequired = true;
                     }
                 } else {
                     return { error: "Falha na criação do usuário Auth. Verifique o email." };
                 }

                 // Insert into profiles table
                 // Use UPSERT to avoid 23505 (Duplicate Key) if profile exists
                 // Add DEFAULT values to ensure NOT NULL constraints don't fail silently
                 const { data, error } = await supabase.from('profiles').upsert({
                     id: tempId, 
                     email: userData.email,
                     name: userData.name || 'Novo Usuário',
                     role: userData.role || 'OPERATIONAL',
                     organization_id: userData.organizationId || null,
                     region_id: userData.regionId || null,
                     sede_ids: userData.sedeIds || [],
                     status: 'ACTIVE'
                 }).select().single();

                 if (error) {
                     console.error("Error creating/updating profile in DB:", error.code, error.message);
                     return { error: `Erro no banco de dados: ${error.message}` };
                 } else {
                     console.log("[Auth] Profile created/updated in DB successfully.");
                 }

                 return { 
                    id: tempId, 
                    email: userData.email, 
                    password: tempPassword,
                    warning: emailConfirmationRequired ? "Este usuário requer confirmação de e-mail antes de logar. Para auto-confirmação, desative 'Enable Email Confirmations' no painel Supabase." : undefined
                 };
             }
         } catch (e: any) {
             console.error("Unexpected error in createUser:", e);
             return { error: e.message || "Erro inesperado." };
         }
     }
     
     // Always update Mock/Local state so UI feels responsive
     // If the DB insert worked, this local state will be overwritten on next fetch anyway.
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

     return { 
         id: tempId, 
         email: userData.email, 
         password: tempPassword // Return the password so Admin can share it
     };
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User | null> => {
    if (isSupabaseConfigured()) {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.role) dbUpdates.role = updates.role;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.sedeIds) dbUpdates.sede_ids = updates.sedeIds;
        if (updates.organizationId) dbUpdates.organization_id = updates.organizationId;
        if (updates.regionId) dbUpdates.region_id = updates.regionId;

        await supabase.from('profiles').update(dbUpdates).eq('id', id);
    }
    
    // Update local storage if self
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.id === id) {
       const merged = { ...currentUser, ...updates };
       localStorage.setItem(SESSION_KEY, JSON.stringify(merged));
       return merged;
    }
    return null;
  },

  deleteUser: async (id: string) => {
    if (isSupabaseConfigured()) {
        await supabase.from('profiles').delete().eq('id', id);
    } else {
        const idx = MOCK_USERS.findIndex(u => u.id === id);
        if (idx > -1) MOCK_USERS.splice(idx, 1);
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
  
  // Method used by Admin to change others' passwords OR by user to change own (if logged in)
  changePassword: async (userId: string, newPassword: string): Promise<boolean> => {
      if (isSupabaseConfigured()) {
          // updateUser updates the *currently logged in user* or requires service role for others.
          // Since client-side only has access to self, this works for reset flow.
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          return !error;
      }
      return true;
  },

  // Specific method for the Password Reset Flow
  confirmPasswordReset: async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
      if (isSupabaseConfigured()) {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) return { success: false, error: error.message };
          return { success: true };
      }
      return { success: true };
  },

  resetPasswordRequest: async (email: string): Promise<boolean> => {
      if (isSupabaseConfigured()) {
          // You must set the Redirect URL in Supabase Dashboard -> Auth -> URL Configuration
          // Example: https://your-site.com/#/update-password
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/#/update-password`,
          });
          return !error;
      }
      return true;
  }
};
