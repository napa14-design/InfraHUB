import { User, UserRole, HydroCertificado, HydroCloroEntry, HydroFiltro, HydroPoco, HydroCisterna, HydroCaixa } from '../types';

// Mock Data Storage Keys
const KEYS = {
  CERT: 'hs_certificados',
  CLORO: 'hs_cloro',
  FILTRO: 'hs_filtros',
  POCO: 'hs_pocos',
  CISTERNA: 'hs_cisternas',
  CAIXA: 'hs_caixas'
};

// --- MOCK DATA GENERATORS ---
const mockCertificados: HydroCertificado[] = [
  {
    id: '1', sedeId: 'sede-dt1', parceiro: 'Lab Waters', status: 'VIGENTE', semestre: '1º/2024',
    validadeSemestre: '2024-06-30', dataAnalise: '2024-01-15', validade: '2024-07-15',
    linkMicro: 'https://example.com/micro1.pdf', linkFisico: 'https://example.com/fisico1.pdf', empresa: 'Nexus SP', agendamento: 'Mensal', observacao: 'Tudo ok'
  },
  {
    id: '2', sedeId: 'sede-dt1', parceiro: 'Bio Analise', status: 'VENCIDO', semestre: '2º/2023',
    validadeSemestre: '2023-12-31', dataAnalise: '2023-07-01', validade: '2024-01-01',
    linkMicro: 'https://example.com/micro2.pdf', linkFisico: '', empresa: 'Nexus RJ', agendamento: 'Bimestral', observacao: 'Renovar urgente'
  },
  {
    id: '3', sedeId: 'sede-sul1', parceiro: 'Lab Waters', status: 'VIGENTE', semestre: '1º/2024',
    validadeSemestre: '2024-06-30', dataAnalise: '2024-02-10', validade: '2024-08-10',
    linkMicro: '', linkFisico: 'https://example.com/fisico3.pdf', empresa: 'Nexus SP', agendamento: 'Mensal', observacao: 'Pendente Micro'
  }
];

const mockCloro: HydroCloroEntry[] = [
  { id: '1', sedeId: 'sede-1', date: new Date().toISOString().split('T')[0], cl: 1.5, ph: 7.2, responsavel: 'João Op.', medidaCorretiva: 'Nenhuma' },
  { id: '2', sedeId: 'sede-1', date: '2023-10-25', cl: 0.5, ph: 6.8, responsavel: 'João Op.', medidaCorretiva: 'Adicionado Cloro' }
];

const mockFiltros: HydroFiltro[] = [
  { id: '1', sedeId: 'sede-1', patrimonio: 'BEB-001', bebedouro: 'IBBL Industrial', local: 'Refeitório', dataTroca: '2023-12-01', proximaTroca: '2024-06-01' },
  { id: '2', sedeId: 'sede-2', patrimonio: 'BEB-009', bebedouro: 'Esmaltec', local: 'Recepção', dataTroca: '2024-01-15', proximaTroca: '2024-07-15' }
];

const mockPocos: HydroPoco[] = [
  { 
    id: '1', sedeId: 'sede-1', bairro: 'Centro', responsavel: 'Eng. Carlos', local: 'Subsolo', 
    dataUltimaLimpeza: '2023-11-20', referenciaBomba: 'Bomba A', dataLimpeza: '2023-11-20', situacaoLimpeza: 'OK',
    fichaOperacional: 'FO-10', previsaoLimpeza1_2026: '2026-05-20', ultimaTrocaFiltro: '2023-11-20',
    situacaoFiltro: 'OK', proximaTrocaFiltro: '2024-05-20', refil: 'Carvão Ativado'
  }
];

const mockCisternas: HydroCisterna[] = [
  {
    id: '1', sedeId: 'sede-1', responsavel: 'Carlos', local: 'Térreo', numCelulas: 2, capacidade: '10.000L',
    previsaoLimpeza1_2025: '2025-02-10', dataLimpeza1: '', previsaoLimpeza2_2025: '2025-08-10', dataLimpeza2: '', situacao: 'Regular'
  }
];

const mockCaixas: HydroCaixa[] = [
    {
    id: '1', sedeId: 'sede-1', responsavel: 'Carlos', local: 'Telhado', numCelulas: 4, capacidade: '5.000L',
    previsaoLimpeza1_2025: '2025-03-15', dataLimpeza1: '', previsaoLimpeza2_2025: '2025-09-15', dataLimpeza2: '', situacao: 'Regular'
  }
];


// --- HELPER ---
const filterByScope = <T extends { sedeId: string }>(data: T[], user: User): T[] => {
  if (user.role === UserRole.ADMIN) return data;
  return data.filter(item => item.sedeId === user.sedeId);
};

export const hydroService = {
  // Certificados
  getCertificados: (user: User): HydroCertificado[] => {
    const stored = localStorage.getItem(KEYS.CERT);
    const data = stored ? JSON.parse(stored) : mockCertificados;
    return filterByScope(data, user);
  },
  saveCertificado: (item: HydroCertificado) => {
    const stored = localStorage.getItem(KEYS.CERT);
    const data: HydroCertificado[] = stored ? JSON.parse(stored) : mockCertificados;
    const index = data.findIndex(d => d.id === item.id);
    if (index >= 0) data[index] = item;
    else data.push(item);
    localStorage.setItem(KEYS.CERT, JSON.stringify(data));
  },

  // Cloro
  getCloro: (user: User): HydroCloroEntry[] => {
    const stored = localStorage.getItem(KEYS.CLORO);
    const data = stored ? JSON.parse(stored) : mockCloro;
    return filterByScope(data, user);
  },
  saveCloro: (entry: HydroCloroEntry) => {
    const stored = localStorage.getItem(KEYS.CLORO);
    const data: HydroCloroEntry[] = stored ? JSON.parse(stored) : mockCloro;
    const index = data.findIndex(d => d.date === entry.date && d.sedeId === entry.sedeId);
    if (index >= 0) data[index] = entry;
    else data.push(entry);
    localStorage.setItem(KEYS.CLORO, JSON.stringify(data));
  },

  // Filtros
  getFiltros: (user: User): HydroFiltro[] => {
    const stored = localStorage.getItem(KEYS.FILTRO);
    const data = stored ? JSON.parse(stored) : mockFiltros;
    return filterByScope(data, user);
  },
  saveFiltro: (item: HydroFiltro) => {
    const stored = localStorage.getItem(KEYS.FILTRO);
    const data: HydroFiltro[] = stored ? JSON.parse(stored) : mockFiltros;
    const index = data.findIndex(d => d.id === item.id);
    if (index >= 0) data[index] = item;
    else data.push(item);
    localStorage.setItem(KEYS.FILTRO, JSON.stringify(data));
  },

  // Reservatórios
  getPocos: (user: User): HydroPoco[] => {
    const stored = localStorage.getItem(KEYS.POCO);
    const data = stored ? JSON.parse(stored) : mockPocos;
    return filterByScope(data, user);
  },
  savePoco: (item: HydroPoco) => {
    const stored = localStorage.getItem(KEYS.POCO);
    const data: HydroPoco[] = stored ? JSON.parse(stored) : mockPocos;
    const index = data.findIndex(d => d.id === item.id);
    if (index >= 0) data[index] = item;
    else data.push(item);
    localStorage.setItem(KEYS.POCO, JSON.stringify(data));
  },

  getCisternas: (user: User): HydroCisterna[] => {
    const stored = localStorage.getItem(KEYS.CISTERNA);
    const data = stored ? JSON.parse(stored) : mockCisternas;
    return filterByScope(data, user);
  },
  saveCisterna: (item: HydroCisterna) => {
    const stored = localStorage.getItem(KEYS.CISTERNA);
    const data: HydroCisterna[] = stored ? JSON.parse(stored) : mockCisternas;
    const index = data.findIndex(d => d.id === item.id);
    if (index >= 0) data[index] = item;
    else data.push(item);
    localStorage.setItem(KEYS.CISTERNA, JSON.stringify(data));
  },

  getCaixas: (user: User): HydroCaixa[] => {
    const stored = localStorage.getItem(KEYS.CAIXA);
    const data = stored ? JSON.parse(stored) : mockCaixas;
    return filterByScope(data, user);
  },
  saveCaixa: (item: HydroCaixa) => {
    const stored = localStorage.getItem(KEYS.CAIXA);
    const data: HydroCaixa[] = stored ? JSON.parse(stored) : mockCaixas;
    const index = data.findIndex(d => d.id === item.id);
    if (index >= 0) data[index] = item;
    else data.push(item);
    localStorage.setItem(KEYS.CAIXA, JSON.stringify(data));
  },
};