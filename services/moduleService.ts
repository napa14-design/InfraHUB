import { AppModule } from '../types';
import { INITIAL_MODULES } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logService } from './logService';
import { authService } from './authService';
import { logger } from '../utils/logger';

const STORAGE_KEY = 'nexus_modules_v1';
const MODULE_TABLE_CANDIDATES = ['app_modules', 'modules'];

let resolvedModulesTable: string | null = null;

const parseModules = (raw: string | null): AppModule[] | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as AppModule[];
    return null;
  } catch {
    return null;
  }
};

const ensureLocalModules = (): AppModule[] => {
  const stored = parseModules(localStorage.getItem(STORAGE_KEY));
  if (stored && stored.length > 0) return stored;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MODULES));
  return [...INITIAL_MODULES];
};

const persistLocalModules = (modules: AppModule[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
};

const mapModuleFromDB = (row: any): AppModule => ({
  id: row.id,
  title: row.title,
  description: row.description,
  iconName: row.icon_name ?? row.iconName,
  minRole: row.min_role ?? row.minRole,
  path: row.path,
  status: row.status,
  category: row.category,
  type: row.type
});

const toSnakePayload = (module: AppModule) => ({
  id: module.id,
  title: module.title,
  description: module.description,
  icon_name: module.iconName,
  min_role: module.minRole,
  path: module.path,
  status: module.status,
  category: module.category,
  type: module.type
});

const toCamelPayload = (module: AppModule) => ({
  id: module.id,
  title: module.title,
  description: module.description,
  iconName: module.iconName,
  minRole: module.minRole,
  path: module.path,
  status: module.status,
  category: module.category,
  type: module.type
});

const isMissingTableError = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === 'PGRST205' ||
    message.includes('could not find the table') ||
    message.includes('relation') && message.includes('does not exist');
};

const isMissingColumnError = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('column') && (message.includes('does not exist') || message.includes('not found'));
};

const resolveModulesTable = async (): Promise<string | null> => {
  if (!isSupabaseConfigured()) return null;
  if (resolvedModulesTable) return resolvedModulesTable;

  for (const table of MODULE_TABLE_CANDIDATES) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (!error) {
      resolvedModulesTable = table;
      return table;
    }
    if (!isMissingTableError(error)) {
      logger.warn('[moduleService] Error probing table', table, error);
    }
  }

  return null;
};

const upsertRemoteModules = async (table: string, modules: AppModule[]) => {
  if (modules.length === 0) return;

  let { error } = await supabase.from(table).upsert(modules.map(toSnakePayload));
  if (error && isMissingColumnError(error)) {
    const retry = await supabase.from(table).upsert(modules.map(toCamelPayload));
    error = retry.error;
  }
  if (error) throw error;
};

const upsertRemoteModule = async (table: string, module: AppModule) => {
  let { error } = await supabase.from(table).upsert(toSnakePayload(module));
  if (error && isMissingColumnError(error)) {
    const retry = await supabase.from(table).upsert(toCamelPayload(module));
    error = retry.error;
  }
  if (error) throw error;
};

export const moduleService = {
  getAll: (): AppModule[] => {
    return ensureLocalModules();
  },

  sync: async (): Promise<AppModule[]> => {
    const localModules = ensureLocalModules();
    const table = await resolveModulesTable();
    if (!table) return localModules;

    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      logger.warn('[moduleService] Failed to sync modules from Supabase:', error);
      return localModules;
    }

    const remoteModules = (data || []).map(mapModuleFromDB);
    if (remoteModules.length === 0) {
      try {
        await upsertRemoteModules(table, localModules);
      } catch (seedError) {
        logger.warn('[moduleService] Failed to seed module table from local data:', seedError);
      }
      return localModules;
    }

    persistLocalModules(remoteModules);
    return remoteModules;
  },

  save: async (module: AppModule): Promise<void> => {
    const modules = ensureLocalModules();
    const index = modules.findIndex((m) => m.id === module.id);
    const action = index >= 0 ? 'UPDATE' : 'CREATE';

    if (index >= 0) modules[index] = module;
    else modules.push(module);
    persistLocalModules(modules);

    const table = await resolveModulesTable();
    if (table) {
      await upsertRemoteModule(table, module);
    }

    const u = authService.getCurrentUser();
    if (u) logService.logAction(u, 'ADMIN', action, `Modulo ${module.title}`, 'Catalogo de Aplicacoes');
  },

  delete: async (id: string): Promise<void> => {
    const modules = ensureLocalModules();
    const item = modules.find((m) => m.id === id);
    const filtered = modules.filter((m) => m.id !== id);
    persistLocalModules(filtered);

    const table = await resolveModulesTable();
    if (table) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    }

    const u = authService.getCurrentUser();
    if (u && item) logService.logAction(u, 'ADMIN', 'DELETE', `Modulo ${item.title}`, 'Catalogo de Aplicacoes');
  }
};
