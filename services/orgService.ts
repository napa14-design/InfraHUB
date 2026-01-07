
import { Organization, Region, Sede, Local } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_ORGS, MOCK_REGIONS, MOCK_SEDES, MOCK_LOCAIS } from '../constants';

// Cache em memória
let cache = {
  orgs: [] as Organization[],
  regions: [] as Region[],
  sedes: [] as Sede[],
  locais: [] as Local[]
};

export const orgService = {
  // Inicializa o cache buscando do Supabase ou usando Mocks
  initialize: async () => {
    try {
      if (!isSupabaseConfigured()) {
          console.warn("Supabase not configured. Using Mock Data for OrgService.");
          throw new Error("Mock Mode");
      }

      const [o, r, s, l] = await Promise.all([
        supabase.from('organizations').select('*'),
        supabase.from('regions').select('*'),
        supabase.from('sedes').select('*'),
        supabase.from('locais').select('*')
      ]);

      if (o.error || r.error || s.error || l.error) throw new Error("Database error");

      if (o.data) cache.orgs = o.data;
      if (r.data) cache.regions = r.data;
      if (s.data) cache.sedes = s.data;
      if (l.data) cache.locais = l.data;

    } catch (err) {
      console.log("Using Fallback Data for OrgService.");
      cache.orgs = MOCK_ORGS;
      cache.regions = MOCK_REGIONS;
      cache.sedes = MOCK_SEDES;
      cache.locais = MOCK_LOCAIS;
    }
  },

  // Leituras (Síncronas via Cache)
  getOrgs: () => [...cache.orgs],
  getRegions: () => [...cache.regions],
  getSedes: () => [...cache.sedes],
  getLocais: () => [...cache.locais],

  getOrgById: (id: string) => cache.orgs.find(o => o.id === id),
  getRegionById: (id: string) => cache.regions.find(r => r.id === id),
  getSedeById: (id: string) => cache.sedes.find(s => s.id === id),
  getLocalById: (id: string) => cache.locais.find(l => l.id === id),

  // Escritas (Assíncronas + Atualização de Cache)
  saveOrg: async (item: Organization) => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabase.from('organizations').upsert(item).select().single();
        if (data && !error) item = data;
    }
    // Update Cache
    const idx = cache.orgs.findIndex(x => x.id === item.id);
    if (idx >= 0) cache.orgs[idx] = item; else cache.orgs.push(item);
    return { data: item, error: null };
  },
  
  deleteOrg: async (id: string) => {
    if (isSupabaseConfigured()) await supabase.from('organizations').delete().eq('id', id);
    cache.orgs = cache.orgs.filter(x => x.id !== id);
  },

  saveRegion: async (item: Region) => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabase.from('regions').upsert(item).select().single();
        if (data && !error) item = data;
    }
    const idx = cache.regions.findIndex(x => x.id === item.id);
    if (idx >= 0) cache.regions[idx] = item; else cache.regions.push(item);
    return { data: item, error: null };
  },
  
  deleteRegion: async (id: string) => {
    if (isSupabaseConfigured()) await supabase.from('regions').delete().eq('id', id);
    cache.regions = cache.regions.filter(x => x.id !== id);
  },

  saveSede: async (item: Sede) => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabase.from('sedes').upsert(item).select().single();
        if (data && !error) item = data;
    }
    const idx = cache.sedes.findIndex(x => x.id === item.id);
    if (idx >= 0) cache.sedes[idx] = item; else cache.sedes.push(item);
    return { data: item, error: null };
  },
  
  deleteSede: async (id: string) => {
    if (isSupabaseConfigured()) await supabase.from('sedes').delete().eq('id', id);
    cache.sedes = cache.sedes.filter(x => x.id !== id);
  },

  saveLocal: async (item: Local) => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabase.from('locais').upsert(item).select().single();
        if (data && !error) item = data;
    }
    const idx = cache.locais.findIndex(x => x.id === item.id);
    if (idx >= 0) cache.locais[idx] = item; else cache.locais.push(item);
    return { data: item, error: null };
  },
  
  deleteLocal: async (id: string) => {
    if (isSupabaseConfigured()) await supabase.from('locais').delete().eq('id', id);
    cache.locais = cache.locais.filter(x => x.id !== id);
  }
};
