
import { AppModule } from '../types';
import { INITIAL_MODULES } from '../constants';
import { logService } from './logService';
import { authService } from './authService';

const STORAGE_KEY = 'nexus_modules_v1';

export const moduleService = {
  getAll: (): AppModule[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MODULES));
      return INITIAL_MODULES;
    }
    return JSON.parse(stored);
  },

  save: (module: AppModule): void => {
    const modules = moduleService.getAll();
    const index = modules.findIndex(m => m.id === module.id);
    const action = index >= 0 ? 'UPDATE' : 'CREATE';
    
    if (index >= 0) {
      modules[index] = module;
    } else {
      modules.push(module);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
    
    const u = authService.getCurrentUser();
    if(u) logService.logAction(u, 'ADMIN', action, `Módulo ${module.title}`, 'Catálogo de Aplicações');
  },

  delete: (id: string): void => {
    const modules = moduleService.getAll();
    const item = modules.find(m => m.id === id);
    const filtered = modules.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    const u = authService.getCurrentUser();
    if(u && item) logService.logAction(u, 'ADMIN', 'DELETE', `Módulo ${item.title}`, 'Catálogo de Aplicações');
  }
};
