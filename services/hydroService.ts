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

// --- HELPER: CSV DATE PARSER ---
// Converts DD/MM/YYYY to YYYY-MM-DD
const parseDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

// --- REAL CERTIFICADOS DATA (FROM CSV) ---
const mockCertificados: HydroCertificado[] = [
  // 1. ALD - VL (MAPPED TO ALD)
  {
    id: 'cert-ald-vl', sedeId: 'ALD', parceiro: 'ALD - VL', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('22/08/2025'), validade: parseDate('18/02/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 2. ALD - TP (MAPPED TO ALD)
  {
    id: 'cert-ald-tp', sedeId: 'ALD', parceiro: 'ALD - TP', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('17/09/2025'), validade: parseDate('16/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 3. ALD - VM (MAPPED TO ALD)
  {
    id: 'cert-ald-vm', sedeId: 'ALD', parceiro: 'ALD - VM', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('17/09/2025'), validade: parseDate('16/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 4. BN
  {
    id: 'cert-bn', sedeId: 'BN', parceiro: 'BN', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('17/09/2025'), validade: parseDate('16/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 5. BS
  {
    id: 'cert-bs', sedeId: 'BS', parceiro: 'BS', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('05/09/2025'), validade: parseDate('04/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 6. DL
  {
    id: 'cert-dl', sedeId: 'DL', parceiro: 'DL', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('26/09/2025'), validade: parseDate('25/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 7. DT
  {
    id: 'cert-dt', sedeId: 'DT', parceiro: 'DT', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('05/09/2025'), validade: parseDate('04/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 8. EUS
  {
    id: 'cert-eus', sedeId: 'EUS', parceiro: 'EUS', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('29/08/2025'), validade: parseDate('25/02/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 9. PE
  {
    id: 'cert-pe', sedeId: 'PE', parceiro: 'PE', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('26/09/2025'), validade: parseDate('25/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 10. PJF (Não Certificado)
  {
    id: 'cert-pjf', sedeId: 'PJF', parceiro: 'PJF', status: 'VENCIDO', semestre: '2º/2025',
    validadeSemestre: parseDate('19/11/2025'), dataAnalise: '', validade: '', 
    linkMicro: '', linkFisico: '', empresa: 'Nexus Group', agendamento: 'AGENDAR', observacao: 'Não Certificado'
  },
  // 11. PNV
  {
    id: 'cert-pnv', sedeId: 'PNV', parceiro: 'PNV', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('05/09/2025'), validade: parseDate('04/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 12. PQL1
  {
    id: 'cert-pql1', sedeId: 'PQL1', parceiro: 'PQL1', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('10/09/2025'), validade: parseDate('09/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 13. PQL2
  {
    id: 'cert-pql2', sedeId: 'PQL2', parceiro: 'PQL2', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('10/09/2025'), validade: parseDate('09/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 14. PQL3
  {
    id: 'cert-pql3', sedeId: 'PQL3', parceiro: 'PQL3', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('10/09/2025'), validade: parseDate('09/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 15. FISIOTERAPIA - PQL3 (MAPPED TO PQL3)
  {
    id: 'cert-fisio-pql3', sedeId: 'PQL3', parceiro: 'FISIOTERAPIA - PQL3', status: 'VENCIDO', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: '', validade: '', 
    linkMicro: '', linkFisico: '', empresa: 'Nexus Group', agendamento: 'REAGENDAR', observacao: 'Não Certificado'
  },
  // 16. PSUL
  {
    id: 'cert-psul', sedeId: 'PSUL', parceiro: 'PSUL', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('29/09/2025'), validade: parseDate('28/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 17. SP
  {
    id: 'cert-sp', sedeId: 'SP', parceiro: 'SP', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('05/09/2025'), validade: parseDate('04/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 18. SUL1
  {
    id: 'cert-sul1', sedeId: 'SUL1', parceiro: 'SUL1', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('10/09/2025'), validade: parseDate('09/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 19. SUL2
  {
    id: 'cert-sul2', sedeId: 'SUL2', parceiro: 'SUL2', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('30/09/2025'), validade: parseDate('29/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  // 20. SUL3
  {
    id: 'cert-sul3', sedeId: 'SUL3', parceiro: 'SUL3', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('29/09/2025'), validade: parseDate('28/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
];

const mockCloro: HydroCloroEntry[] = [
  { id: '1', sedeId: 'DT', date: new Date().toISOString().split('T')[0], cl: 1.5, ph: 7.2, responsavel: 'João Op.', medidaCorretiva: 'Nenhuma' },
  { id: '2', sedeId: 'ALD', date: '2023-10-25', cl: 0.5, ph: 6.8, responsavel: 'Maria Op.', medidaCorretiva: 'Adicionado Cloro' }
];

const mockFiltros: HydroFiltro[] = [
  { id: '1', sedeId: 'DT', patrimonio: 'BEB-001', bebedouro: 'IBBL Industrial', local: 'Refeitório', dataTroca: '2023-12-01', proximaTroca: '2024-06-01' },
  { id: '2', sedeId: 'PQL3', patrimonio: 'BEB-009', bebedouro: 'Esmaltec', local: 'Recepção Fisio', dataTroca: '2024-01-15', proximaTroca: '2024-07-15' }
];

const mockPocos: HydroPoco[] = [
  { 
    id: '1', sedeId: 'SUL1', bairro: 'Sul', responsavel: 'Eng. Carlos', local: 'Subsolo', 
    dataUltimaLimpeza: '2023-11-20', referenciaBomba: 'Bomba A', dataLimpeza: '2023-11-20', situacaoLimpeza: 'OK',
    fichaOperacional: 'FO-10', previsaoLimpeza1_2026: '2026-05-20', ultimaTrocaFiltro: '2023-11-20',
    situacaoFiltro: 'OK', proximaTrocaFiltro: '2024-05-20', refil: 'Carvão Ativado'
  }
];

const mockCisternas: HydroCisterna[] = [
  {
    id: '1', sedeId: 'BN', responsavel: 'Carlos', local: 'Térreo', numCelulas: 2, capacidade: '10.000L',
    previsaoLimpeza1_2025: '2025-02-10', dataLimpeza1: '', previsaoLimpeza2_2025: '2025-08-10', dataLimpeza2: '', situacao: 'Regular'
  }
];

const mockCaixas: HydroCaixa[] = [
    {
    id: '1', sedeId: 'SP', responsavel: 'Carlos', local: 'Telhado', numCelulas: 4, capacidade: '5.000L',
    previsaoLimpeza1_2025: '2025-03-15', dataLimpeza1: '', previsaoLimpeza2_2025: '2025-09-15', dataLimpeza2: '', situacao: 'Regular'
  }
];


// --- HELPER: SMART FILTERING ---
const filterByScope = <T extends { sedeId: string }>(data: T[], user: User): T[] => {
  if (user.role === UserRole.ADMIN) return data;
  
  // Logic: 
  // Check if item's sede is in user's assigned sedes list
  const userSedes = user.sedeIds || [];

  return data.filter(item => {
      const itemSede = item.sedeId ? item.sedeId.toUpperCase() : '';
      if (!itemSede) return false;

      // 1. Direct Match in Array
      if (userSedes.includes(itemSede)) return true;

      // 2. Sub-string match (e.g. User has 'ALD', item is 'ALD-VL' -> Not needed anymore due to normalization, 
      // but kept if legacy data exists).
      // We check if ANY of the user's sedes is a substring of the item sede
      // or if the item sede is a substring of the user's sede (less likely)
      const isSubMatch = userSedes.some(us => itemSede.includes(us));
      
      return isSubMatch;
  });
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