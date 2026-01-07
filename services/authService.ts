
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';

const SESSION_KEY = 'nexus_auth_user';

export const authService = {
  // Login with Supabase or Mock
  login: async (email: string, passwordInput: string): Promise<{ user: User | null; error?: string }> => {
    try {
      // 1. Try Supabase Auth first if configured
      if (isSupabaseConfigured()) {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password: passwordInput,
          });

          if (!authError && authData.user) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();

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
      }

      // 2. Fallback to MOCK_USERS if Supabase failed or not configured
      console.warn("Using Mock Auth Login");
      const mockUser = MOCK_USERS.find(u => u.email === email);
      if (mockUser) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));
          return { user: mockUser };
      }

      return { user: null, error: 'E-mail ou senha incorretos.' };

    } catch (err) {
      console.error(err);
      return { user: null, error: 'Erro inesperado na conexão.' };
    }
  },

  logout: async () => {
    if (isSupabaseConfigured()) await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return data.map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email,
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
