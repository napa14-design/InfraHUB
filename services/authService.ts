
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
          console.log("[Auth] Mock user found.");
          localStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));
          return { user: mockUser };
      }

      // 3. If no mock user found, return the original Supabase error if it exists
      if (supabaseErrorMsg) {
          return { user: null, error: `Erro Supabase: ${supabaseErrorMsg}` };
      }

      return { user: null, error: 'E-mail ou senha incorretos (Mock/Supabase).' };

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

  createUser: async (userData: Partial<User>): Promise<any> => {
     console.warn("Create user not fully supported in frontend-only mode.");
     return null;
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
          return !error;
      }
      return true;
  },

  resetPasswordRequest: async (email: string): Promise<boolean> => {
      if (isSupabaseConfigured()) {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          return !error;
      }
      return true;
  }
};
