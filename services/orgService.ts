
import { Organization, Region, Sede, Local } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_ORGS, MOCK_REGIONS, MOCK_SEDES, MOCK_LOCAIS } from '../constants';
import { logService } from './logService';
import { authService } from './authService';

// Cache em memória
let cache = {
  orgs: [] as Organization[],
  regions: [] as Region[],
  sedes: [] as Sede[],
  locais: [] as Local[]
};

let usingMocks = false;

const getCurrentUser = () => authService.getCurrentUser();

export const orgService = {
  // Inicializa o cache buscando do Supabase ou usando Mocks
  initialize: async () => {
    usingMocks = false;
    try {
      if (!isSupabaseConfigured()) {
          console.warn("Supabase not configured. Using Mock Data for OrgService.");
          throw new Error("Mock Mode");
      }

      console.log("[OrgService] Fetching data...");
      const [o, r, s, l] = await Promise.all([
        supabase.from('organizations').select('*'),
        supabase.from('regions').select('*'),
        supabase.from('sedes').select('*'),
        supabase.from('locais').select('*')
      ]);

      if (o.error) console.error("[OrgService] Error fetching Orgs:", o.error);
      if (r.error) console.error("[OrgService] Error fetching Regions:", r.error);
      
      if (o.error || r.error || s.error || l.error) throw new Error("Database error");

      // MAPPING: Convert Supabase snake_case to Frontend camelCase
      if (o.data) {
          cache.orgs = o.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              logoUrl: item.logo_url // Map logo_url -> logoUrl
          }));
      }

      if (r.data) {
          cache.regions = r.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              organizationId: item.organization_id // CRITICAL FIX: organization_id -> organizationId
          }));
      }

      if (s.data) {
          cache.sedes = s.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              address: item.address,
              regionId: item.region_id // CRITICAL FIX: region_id -> regionId
          }));
      }

      if (l.data) {
          cache.locais = l.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              tipo: item.tipo,
              sedeId: item.sede_id // CRITICAL FIX: sede_id -> sedeId
          }));
      }

      console.log(`[OrgService] Loaded: ${cache.orgs.length} Orgs, ${cache.regions.length} Regions`);

    } catch (err) {
      console.log("Using Fallback Data for OrgService due to error or config.");
      usingMocks = true;
      cache.orgs = MOCK_ORGS;
      cache.regions = MOCK_REGIONS;
      cache.sedes = MOCK_SEDES;
      cache.locais = MOCK_LOCAIS;
    }
  },

  // Verifica se está usando dados mockados
  isMockMode: () => usingMocks,

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
  // Nota: Ao salvar, convertemos de volta para snake_case para o Supabase
  saveOrg: async (item: Organization) => {
    if (isSupabaseConfigured()) {
        const payload = { id: item.id, name: item.name, logo_url: item.logoUrl };
        await supabase.from('organizations').upsert(payload);
    }
    const idx = cache.orgs.findIndex(x => x.id === item.id);
    const action = idx >= 0 ? 'UPDATE' : 'CREATE';
    if (idx >= 0) cache.orgs[idx] = item; else cache.orgs.push(item);
    
    const u = getCurrentUser();
    if(u) logService.logAction(u, 'ADMIN', action, `Organização ${item.name}`, 'Estrutura Organizacional');
    
    return { data: item, error: null };
  },
  
  deleteOrg: async (id: string) => {
    const u = getCurrentUser();
    const item = cache.orgs.find(x => x.id === id);
    if (isSupabaseConfigured()) await supabase.from('organizations').delete().eq('id', id);
    cache.orgs = cache.orgs.filter(x => x.id !== id);
    if(u && item) logService.logAction(u, 'ADMIN', 'DELETE', `Organização ${item.name}`, 'Estrutura Organizacional');
  },

  saveRegion: async (item: Region) => {
    if (isSupabaseConfigured()) {
        const payload = { id: item.id, name: item.name, organization_id: item.organizationId };
        await supabase.from('regions').upsert(payload);
    }
    const idx = cache.regions.findIndex(x => x.id === item.id);
    const action = idx >= 0 ? 'UPDATE' : 'CREATE';
    if (idx >= 0) cache.regions[idx] = item; else cache.regions.push(item);
    
    const u = getCurrentUser();
    if(u) logService.logAction(u, 'ADMIN', action, `Região ${item.name}`, 'Estrutura Organizacional');

    return { data: item, error: null };
  },
  
  deleteRegion: async (id: string) => {
    const u = getCurrentUser();
    const item = cache.regions.find(x => x.id === id);
    if (isSupabaseConfigured()) await supabase.from('regions').delete().eq('id', id);
    cache.regions = cache.regions.filter(x => x.id !== id);
    if(u && item) logService.logAction(u, 'ADMIN', 'DELETE', `Região ${item.name}`, 'Estrutura Organizacional');
  },

  saveSede: async (item: Sede) => {
    if (isSupabaseConfigured()) {
        const payload = { id: item.id, name: item.name, address: item.address, region_id: item.regionId };
        await supabase.from('sedes').upsert(payload);
    }
    const idx = cache.sedes.findIndex(x => x.id === item.id);
    const action = idx >= 0 ? 'UPDATE' : 'CREATE';
    if (idx >= 0) cache.sedes[idx] = item; else cache.sedes.push(item);
    
    const u = getCurrentUser();
    if(u) logService.logAction(u, 'ADMIN', action, `Sede ${item.name}`, 'Estrutura Organizacional');

    return { data: item, error: null };
  },
  
  deleteSede: async (id: string) => {
    const u = getCurrentUser();
    const item = cache.sedes.find(x => x.id === id);
    if (isSupabaseConfigured()) await supabase.from('sedes').delete().eq('id', id);
    cache.sedes = cache.sedes.filter(x => x.id !== id);
    if(u && item) logService.logAction(u, 'ADMIN', 'DELETE', `Sede ${item.name}`, 'Estrutura Organizacional');
  },

  saveLocal: async (item: Local) => {
    if (isSupabaseConfigured()) {
        const payload = { id: item.id, name: item.name, tipo: item.tipo, sede_id: item.sedeId };
        await supabase.from('locais').upsert(payload);
    }
    const idx = cache.locais.findIndex(x => x.id === item.id);
    const action = idx >= 0 ? 'UPDATE' : 'CREATE';
    if (idx >= 0) cache.locais[idx] = item; else cache.locais.push(item);
    
    const u = getCurrentUser();
    if(u) logService.logAction(u, 'ADMIN', action, `Local ${item.name}`, `Tipo: ${item.tipo}`);

    return { data: item, error: null };
  },
  
  deleteLocal: async (id: string) => {
    const u = getCurrentUser();
    const item = cache.locais.find(x => x.id === id);
    if (isSupabaseConfigured()) await supabase.from('locais').delete().eq('id', id);
    cache.locais = cache.locais.filter(x => x.id !== id);
    if(u && item) logService.logAction(u, 'ADMIN', 'DELETE', `Local ${item.name}`, 'Estrutura Organizacional');
  }
};
