import { AppModule } from '../types';
import { INITIAL_MODULES } from '../constants';

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
    
    if (index >= 0) {
      modules[index] = module;
    } else {
      modules.push(module);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
  },

  delete: (id: string): void => {
    const modules = moduleService.getAll();
    const filtered = modules.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
};