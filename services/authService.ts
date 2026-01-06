import { User, UserRole, UserStatus } from '../types';
import { MOCK_USERS } from '../constants';

const SESSION_KEY = 'nexus_auth_user';
const USERS_DB_KEY = 'nexus_users_db';

// Helper to get users from "DB" (LocalStorage) or Init with Mock
const getUsersDB = (): User[] => {
  const stored = localStorage.getItem(USERS_DB_KEY);
  if (stored) return JSON.parse(stored);
  // Initialize DB with mocks
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(MOCK_USERS));
  return MOCK_USERS;
};

const saveUsersDB = (users: User[]) => {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
};

export const authService = {
  // Login with Password and Status Check
  login: async (email: string, passwordInput: string = '123'): Promise<{ user: User | null; error?: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const users = getUsersDB();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { user: null, error: 'Usuário não encontrado.' };
    }

    if (user.status === 'INACTIVE') {
      return { user: null, error: 'Conta inativa. Contate o administrador.' };
    }

    // In a real app, hash comparison happens here.
    // For mock, we check plain text or default '123' if not set
    const validPassword = user.password === passwordInput;
    
    if (!validPassword) {
      return { user: null, error: 'Senha incorreta.' };
    }

    // Don't save to session yet if it's first login (needs password change)
    if (!user.isFirstLogin) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }

    return { user };
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // --- USER MANAGEMENT ---

  getAllUsers: (): User[] => {
    return getUsersDB();
  },

  createUser: (userData: Partial<User>): User => {
    const users = getUsersDB();
    
    // Generate Random Password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name || 'Novo Usuário',
      email: userData.email || '',
      role: userData.role || UserRole.OPERATIONAL,
      status: 'ACTIVE',
      isFirstLogin: true, // Forces password change
      password: tempPassword,
      avatarUrl: '', // Default no avatar
      organizationId: userData.organizationId,
      regionId: userData.regionId,
      sedeIds: userData.sedeIds || [],
    };

    users.push(newUser);
    saveUsersDB(users);
    return newUser;
  },

  updateUser: (id: string, updates: Partial<User>): User | null => {
    const users = getUsersDB();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;

    users[index] = { ...users[index], ...updates };
    saveUsersDB(users);
    
    // If updating current user, update session too
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.id === id) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(users[index]));
    }
    
    return users[index];
  },

  deleteUser: (id: string) => {
    const users = getUsersDB();
    const filtered = users.filter(u => u.id !== id);
    saveUsersDB(filtered);
  },

  // --- PASSWORD OPERATIONS ---

  changePassword: (userId: string, newPassword: string): boolean => {
    const users = getUsersDB();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return false;

    users[index].password = newPassword;
    users[index].isFirstLogin = false; // Clear first login flag
    saveUsersDB(users);

    // Set session immediately after password change
    localStorage.setItem(SESSION_KEY, JSON.stringify(users[index]));
    
    return true;
  },

  resetPasswordRequest: async (email: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const users = getUsersDB();
    const user = users.find(u => u.email === email);
    // In real app, send email. Here just return true if user exists.
    return !!user;
  },

  hasPermission: (userRole: UserRole, requiredRole: UserRole): boolean => {
    const levels = {
      [UserRole.OPERATIONAL]: 1,
      [UserRole.GESTOR]: 2,
      [UserRole.ADMIN]: 3
    };
    return levels[userRole] >= levels[requiredRole];
  }
};