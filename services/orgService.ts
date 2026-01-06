import { Organization, Region, Sede, Local } from '../types';
import { MOCK_ORGS, MOCK_REGIONS, MOCK_SEDES, MOCK_LOCAIS } from '../constants';

const ORG_KEY = 'nexus_orgs';
const REGION_KEY = 'nexus_regions';
const SEDE_KEY = 'nexus_sedes';
const LOCAL_KEY = 'nexus_locais';

export const orgService = {
  // Organizations
  getOrgs: (): Organization[] => {
    const stored = localStorage.getItem(ORG_KEY);
    return stored ? JSON.parse(stored) : MOCK_ORGS;
  },
  saveOrg: (org: Organization) => {
    const all = orgService.getOrgs();
    const index = all.findIndex(i => i.id === org.id);
    if (index >= 0) all[index] = org;
    else all.push(org);
    localStorage.setItem(ORG_KEY, JSON.stringify(all));
  },
  deleteOrg: (id: string) => {
    const all = orgService.getOrgs().filter(i => i.id !== id);
    localStorage.setItem(ORG_KEY, JSON.stringify(all));
  },

  // Regions
  getRegions: (): Region[] => {
    const stored = localStorage.getItem(REGION_KEY);
    return stored ? JSON.parse(stored) : MOCK_REGIONS;
  },
  saveRegion: (item: Region) => {
    const all = orgService.getRegions();
    const index = all.findIndex(i => i.id === item.id);
    if (index >= 0) all[index] = item;
    else all.push(item);
    localStorage.setItem(REGION_KEY, JSON.stringify(all));
  },
  deleteRegion: (id: string) => {
    const all = orgService.getRegions().filter(i => i.id !== id);
    localStorage.setItem(REGION_KEY, JSON.stringify(all));
  },

  // Sedes
  getSedes: (): Sede[] => {
    const stored = localStorage.getItem(SEDE_KEY);
    return stored ? JSON.parse(stored) : MOCK_SEDES;
  },
  saveSede: (item: Sede) => {
    const all = orgService.getSedes();
    const index = all.findIndex(i => i.id === item.id);
    if (index >= 0) all[index] = item;
    else all.push(item);
    localStorage.setItem(SEDE_KEY, JSON.stringify(all));
  },
  deleteSede: (id: string) => {
    const all = orgService.getSedes().filter(i => i.id !== id);
    localStorage.setItem(SEDE_KEY, JSON.stringify(all));
  },

  // Locais
  getLocais: (): Local[] => {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? JSON.parse(stored) : MOCK_LOCAIS;
  },
  saveLocal: (item: Local) => {
    const all = orgService.getLocais();
    const index = all.findIndex(i => i.id === item.id);
    if (index >= 0) all[index] = item;
    else all.push(item);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  },
  deleteLocal: (id: string) => {
    const all = orgService.getLocais().filter(i => i.id !== id);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  },

  // Helpers
  getSedeById: (id: string) => orgService.getSedes().find(s => s.id === id),
  getRegionById: (id: string) => orgService.getRegions().find(r => r.id === id),
  getOrgById: (id: string) => orgService.getOrgs().find(o => o.id === id),
  getLocalById: (id: string) => orgService.getLocais().find(l => l.id === id),
};