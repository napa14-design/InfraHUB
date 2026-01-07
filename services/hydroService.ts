
import { User, UserRole, HydroCertificado, HydroCloroEntry, HydroFiltro, HydroPoco, HydroCisterna, HydroCaixa, HydroSettings } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_HYDRO_CERTIFICADOS, MOCK_HYDRO_FILTROS, MOCK_HYDRO_RESERVATORIOS } from '../constants';

// Helper de filtragem por escopo de usuário
const filterByScope = <T extends { sedeId: string }>(data: T[], user: User): T[] => {
  if (user.role === UserRole.ADMIN) return data;
  const userSedes = user.sedeIds || [];
  return data.filter(item => {
      const itemSede = item.sedeId ? item.sedeId : ''; 
      if (!itemSede) return false;
      return userSedes.includes(itemSede);
  });
};

export const hydroService = {
  // --- CERTIFICADOS ---
  getCertificados: async (user: User): Promise<HydroCertificado[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data, error } = await supabase.from('hydro_certificados').select('*');
        if (error) throw error;
        return filterByScope(data || [], user);
    } catch (e) {
        return filterByScope(MOCK_HYDRO_CERTIFICADOS, user);
    }
  },
  saveCertificado: async (item: HydroCertificado) => {
    if (isSupabaseConfigured()) await supabase.from('hydro_certificados').upsert(item);
    // In Mock mode, we don't persist writes permanently
  },
  deleteCertificado: async (id: string) => {
    if (isSupabaseConfigured()) await supabase.from('hydro_certificados').delete().eq('id', id);
  },

  // --- CLORO ---
  getCloro: async (user: User): Promise<HydroCloroEntry[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data, error } = await supabase.from('hydro_cloro').select('*');
        if (error) throw error;
        return filterByScope(data || [], user);
    } catch (e) {
        return []; // No mock data for Cloro initially
    }
  },
  saveCloro: async (entry: HydroCloroEntry) => {
    if (isSupabaseConfigured()) await supabase.from('hydro_cloro').upsert(entry);
  },

  // --- FILTROS ---
  getFiltros: async (user: User): Promise<HydroFiltro[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data, error } = await supabase.from('hydro_filtros').select('*');
        if (error) throw error;
        return filterByScope(data || [], user);
    } catch (e) {
        return filterByScope(MOCK_HYDRO_FILTROS, user);
    }
  },
  saveFiltro: async (item: HydroFiltro) => {
    if (isSupabaseConfigured()) await supabase.from('hydro_filtros').upsert(item);
  },
  deleteFiltro: async (id: string) => {
    if (isSupabaseConfigured()) await supabase.from('hydro_filtros').delete().eq('id', id);
  },

  // --- RESERVATÓRIOS ---
  
  // Poços
  getPocos: async (user: User): Promise<HydroPoco[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data, error } = await supabase.from('hydro_reservatorios').select('*').eq('tipo', 'POCO');
        if (error) throw error;
        return filterByScope((data || []) as HydroPoco[], user);
    } catch (e) {
        return filterByScope(MOCK_HYDRO_RESERVATORIOS.filter(r => r.tipo === 'POCO'), user);
    }
  },
  savePoco: async (item: HydroPoco) => {
    if (isSupabaseConfigured()) await supabase.from('hydro_reservatorios').upsert({ ...item, tipo: 'POCO' });
  },

  // Cisternas
  getCisternas: async (user: User): Promise<HydroCisterna[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data, error } = await supabase.from('hydro_reservatorios').select('*').eq('tipo', 'CISTERNA');
        if (error) throw error;
        return filterByScope((data || []) as HydroCisterna[], user);
    } catch (e) {
        return filterByScope(MOCK_HYDRO_RESERVATORIOS.filter(r => r.tipo === 'CISTERNA'), user);
    }
  },
  saveCisterna: async (item: HydroCisterna) => {
    if (isSupabaseConfigured()) await supabase.from('hydro_reservatorios').upsert({ ...item, tipo: 'CISTERNA' });
  },

  // Caixas
  getCaixas: async (user: User): Promise<HydroCaixa[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data, error } = await supabase.from('hydro_reservatorios').select('*').eq('tipo', 'CAIXA');
        if (error) throw error;
        return filterByScope((data || []) as HydroCaixa[], user);
    } catch (e) {
        return filterByScope(MOCK_HYDRO_RESERVATORIOS.filter(r => r.tipo === 'CAIXA'), user);
    }
  },
  saveCaixa: async (item: HydroCaixa) => {
    if (isSupabaseConfigured()) await supabase.from('hydro_reservatorios').upsert({ ...item, tipo: 'CAIXA' });
  },

  // --- SETTINGS ---
  getSettings: async (): Promise<HydroSettings> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data } = await supabase.from('hydro_settings').select('*').single();
        if (data) return data;
        throw new Error("No settings");
    } catch (e) {
        return {
            validadeCertificadoMeses: 6,
            validadeFiltroMeses: 6,
            validadeLimpezaMeses: 6,
            cloroMin: 1.0,
            cloroMax: 3.0,
            phMin: 7.4,
            phMax: 7.6
        };
    }
  },

  saveSettings: async (settings: HydroSettings) => {
    if (isSupabaseConfigured()) await supabase.from('hydro_settings').upsert({ ...settings, id: 'default' });
  }
};
