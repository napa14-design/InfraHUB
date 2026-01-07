
import { UserRole, AppModule, ModuleStatus, User, ModuleType, Organization, Region, Sede, Local, HydroCertificado, HydroFiltro, HydroPoco, NotificationRule } from './types';

// --- ESTRUTURA ORGANIZACIONAL ---

// Nível 1: Instituição
export const MOCK_ORGS: Organization[] = [
  { id: 'org-colegio', name: 'Colégio', logoUrl: '' },
  { id: 'org-uni', name: 'Universidade', logoUrl: '' }
];

// Nível 2: Regiões
export const MOCK_REGIONS: Region[] = [
  // --- COLÉGIO ---
  { id: 'reg-dt', organizationId: 'org-colegio', name: 'Região Dionísio Torres' },
  { id: 'reg-ald-col', organizationId: 'org-colegio', name: 'Região Aldeota' }, // BS, SP, PNV
  { id: 'reg-pql-col', organizationId: 'org-colegio', name: 'Região Parquelândia' },
  { id: 'reg-sul', organizationId: 'org-colegio', name: 'Região Sul' },
  { id: 'reg-benfica', organizationId: 'org-colegio', name: 'Região Benfica' },
  
  // --- UNIVERSIDADE ---
  { id: 'reg-campus', organizationId: 'org-uni', name: 'Campus Universitários' }
];

// Nível 3: Sedes
export const MOCK_SEDES: Sede[] = [
  // ================= COLÉGIO =================

  // Região Dionísio Torres
  { id: 'DT', regionId: 'reg-dt', name: 'DT (Sede Principal)' },
  { id: 'DT1', regionId: 'reg-dt', name: 'DT 1' },
  { id: 'DT2', regionId: 'reg-dt', name: 'DT 2' },
  { id: 'PDT', regionId: 'reg-dt', name: 'PDT' },
  { id: 'IDIOMAS', regionId: 'reg-dt', name: 'IDIOMAS' },

  // Região Aldeota (Apenas os listados para Colégio)
  { id: 'BS', regionId: 'reg-ald-col', name: 'BS' },
  { id: 'SP', regionId: 'reg-ald-col', name: 'SP' },
  { id: 'PNV', regionId: 'reg-ald-col', name: 'PNV' },

  // Região Parquelândia (Colégio)
  { id: 'PQL1', regionId: 'reg-pql-col', name: 'PQL 1' },
  { id: 'PQL2', regionId: 'reg-pql-col', name: 'PQL 2' },
  { id: 'PJF', regionId: 'reg-pql-col', name: 'PJF' },

  // Região Sul
  { id: 'SUL1', regionId: 'reg-sul', name: 'SUL 1' },
  { id: 'SUL2', regionId: 'reg-sul', name: 'SUL 2' },
  { id: 'SUL3', regionId: 'reg-sul', name: 'SUL 3' },
  { id: 'PSUL', regionId: 'reg-sul', name: 'PSUL' },

  // Região Benfica (Colégio)
  { id: 'BN', regionId: 'reg-benfica', name: 'BN (Colégio)' },

  // ================= UNIVERSIDADE =================
  
  // Campus ALD (Unificado)
  { id: 'ALD', regionId: 'reg-campus', name: 'ALD (Campus Aldeota)' }, 

  // Campus PQL (Unificado)
  { id: 'PQL3', regionId: 'reg-campus', name: 'PQL 3 (Campus Parquelândia)' },

  // Outros Campus
  { id: 'BN-UNI', regionId: 'reg-campus', name: 'BN (Universidade)' },
  { id: 'DL', regionId: 'reg-campus', name: 'DL (Dom Luís)' },
  { id: 'EUS', regionId: 'reg-campus', name: 'EUS (Eusébio)' },
  { id: 'PE', regionId: 'reg-campus', name: 'PE (Parque Ecológico)' },
];

// Nível 4: Local (Exemplos Genéricos)
export const MOCK_LOCAIS: Local[] = [
  { id: 'loc-1', sedeId: 'DT', name: 'Bebedouro Hall', tipo: 'BEBEDOURO' },
  { id: 'loc-2', sedeId: 'PQL3', name: 'Piscina Hidro', tipo: 'PISCINA' },
];

// Mock Users
export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Roberto Admin',
    email: 'admin@nexus.com',
    role: UserRole.ADMIN,
    organizationId: 'org-colegio',
    regionId: 'reg-dt',
    sedeIds: ['DT'],
    status: 'ACTIVE',
    isFirstLogin: false
  },
  {
    id: '2',
    name: 'Glória Gestora (Colégio)',
    email: 'gestor@colegio.com',
    role: UserRole.GESTOR,
    organizationId: 'org-colegio',
    regionId: 'reg-ald-col',
    sedeIds: ['BS', 'SP', 'PNV'], // Gestor com múltiplas sedes
    status: 'ACTIVE',
    isFirstLogin: false
  },
  {
    id: '3',
    name: 'João Operacional (PQL3 Uni)',
    email: 'op@uni.com',
    role: UserRole.OPERATIONAL,
    organizationId: 'org-uni',
    regionId: 'reg-campus',
    sedeIds: ['PQL3'], 
    status: 'ACTIVE',
    isFirstLogin: false 
  },
  {
    id: '4',
    name: 'Carlos Gestor (ALD Uni)',
    email: 'ald@uni.com', 
    role: UserRole.GESTOR,
    organizationId: 'org-uni',
    regionId: 'reg-campus',
    sedeIds: ['ALD'], // Vê tudo que é mapeado para ALD
    status: 'ACTIVE',
    isFirstLogin: false 
  }
];

// --- HYDROSYS MOCK DATA ---

export const MOCK_HYDRO_CERTIFICADOS: HydroCertificado[] = [
  { id: 'cert-ald-vl', sedeId: 'ALD', parceiro: 'ALD - VL', status: 'VIGENTE', semestre: '2º/2025', validadeSemestre: '2026-02-18', dataAnalise: '2025-08-22', validade: '2026-02-18', linkMicro: '', linkFisico: '', empresa: 'Nexus Group', agendamento: '' },
  { id: 'cert-pe', sedeId: 'PE', parceiro: 'PE', status: 'VIGENTE', semestre: '2º/2025', validadeSemestre: '2026-03-25', dataAnalise: '2025-09-26', validade: '2026-03-25', linkMicro: '', linkFisico: '', empresa: 'Nexus Group', agendamento: '' },
  { id: 'cert-pjf', sedeId: 'PJF', parceiro: 'PJF', status: 'VENCIDO', semestre: '2º/2025', validadeSemestre: '', dataAnalise: '2024-01-01', validade: '2024-07-01', linkMicro: '', linkFisico: '', empresa: 'Nexus Group', agendamento: '' },
  { id: 'cert-dt', sedeId: 'DT', parceiro: 'DT', status: 'VIGENTE', semestre: '2º/2025', validadeSemestre: '2026-03-04', dataAnalise: '2025-09-05', validade: '2026-03-04', linkMicro: '', linkFisico: '', empresa: 'Nexus Group', agendamento: '' }
];

export const MOCK_HYDRO_FILTROS: HydroFiltro[] = [
  { id: 'pe-1', sedeId: 'PE', patrimonio: '1098', bebedouro: 'Bebedouro', local: '10º ANDAR', dataTroca: '2025-07-07', proximaTroca: '2026-01-01' },
  { id: 'pe-2', sedeId: 'PE', patrimonio: '1281', bebedouro: 'Bebedouro', local: '9º ANDAR', dataTroca: '2025-07-07', proximaTroca: '2026-01-01' }
];

export const MOCK_HYDRO_RESERVATORIOS: HydroPoco[] = [
  { id: 'p-1', sedeId: 'ALD', tipo: 'POCO', local: 'SUBSOLO', responsavel: 'JOSY', dataUltimaLimpeza: '2024-01-24', proximaLimpeza: '2026-07-09', situacaoLimpeza: 'DENTRO DO PRAZO', dataLimpeza1: '2025-07-09', proximaTrocaFiltro: '2026-01-05', situacaoFiltro: 'DENTRO DO PRAZO', refil: '10"' },
  { id: 'p-2', sedeId: 'ALD', tipo: 'POCO', local: 'SUBSOLO', responsavel: 'JOSY', dataUltimaLimpeza: '2024-01-24', proximaLimpeza: '2026-07-14', situacaoLimpeza: 'DENTRO DO PRAZO', dataLimpeza1: '2025-07-14', proximaTrocaFiltro: '2026-01-10', situacaoFiltro: 'DENTRO DO PRAZO', refil: '10"' },
  { id: 'p-3', sedeId: 'BN', tipo: 'POCO', local: 'CORREDOR (BOSQUE)', responsavel: 'REBECCA', dataUltimaLimpeza: '2024-01-01', proximaLimpeza: '2026-04-19', situacaoLimpeza: 'DENTRO DO PRAZO', dataLimpeza1: '2025-04-19', proximaTrocaFiltro: '2025-10-16', situacaoFiltro: 'DENTRO DO PRAZO', refil: '20"' }
];

export const MOCK_RULES: NotificationRule[] = [
  {
    id: 'rule_cert',
    moduleId: 'hydrosys',
    name: 'Certificados de Potabilidade',
    description: 'Monitora a data de validade dos laudos.',
    warningDays: 30,
    criticalDays: 0,
    enabled: true
  },
  {
    id: 'rule_filtros',
    moduleId: 'hydrosys',
    name: 'Troca de Filtros',
    description: 'Monitora a data da próxima troca de elementos filtrantes.',
    warningDays: 15,
    criticalDays: 0,
    enabled: true
  },
  {
    id: 'rule_res',
    moduleId: 'hydrosys',
    name: 'Limpeza de Reservatórios',
    description: 'Monitora datas de limpeza de Caixas e Cisternas.',
    warningDays: 30,
    criticalDays: 7,
    enabled: true
  }
];

// Initial Seed Data for Modules
export const INITIAL_MODULES: AppModule[] = [
  {
    id: 'hydrosys',
    title: 'HydroSys',
    description: 'Gestão completa de qualidade da água, certificados e reservatórios.',
    iconName: 'Droplets',
    minRole: UserRole.OPERATIONAL,
    path: '/module/hydrosys',
    status: ModuleStatus.NORMAL,
    category: 'OPERATIONAL',
    type: ModuleType.INTERNAL
  },
  {
    id: 'user-management',
    title: 'Gestão de Usuários',
    description: 'Controle de acesso, criação e auditoria de contas.',
    iconName: 'Users',
    minRole: UserRole.ADMIN,
    path: '/admin/users',
    status: ModuleStatus.NORMAL,
    category: 'ADMIN',
    type: ModuleType.INTERNAL
  },
  {
    id: 'org-structure',
    title: 'Estrutura Organizacional',
    description: 'Gerenciar Instituições, Regiões, Sedes e Locais.',
    iconName: 'Building2',
    minRole: UserRole.ADMIN,
    path: '/admin/org',
    status: ModuleStatus.NORMAL,
    category: 'ADMIN',
    type: ModuleType.INTERNAL
  },
  {
    id: 'audit-logs',
    title: 'Logs de Auditoria',
    description: 'Rastreamento de atividades e segurança do sistema.',
    iconName: 'FileText',
    minRole: UserRole.ADMIN,
    path: '/admin/logs',
    status: ModuleStatus.WARNING, 
    category: 'ADMIN',
    type: ModuleType.INTERNAL
  },
  {
    id: 'sales-dashboard',
    title: 'Vendas & Metas',
    description: 'Acompanhamento de performance comercial em tempo real.',
    iconName: 'BarChart3',
    minRole: UserRole.GESTOR,
    path: '/module/sales',
    status: ModuleStatus.NORMAL,
    category: 'ANALYTICS',
    type: ModuleType.INTERNAL
  },
  {
    id: 'google-analytics',
    title: 'Google Analytics',
    description: 'Acesso externo aos dados de tráfego web.',
    iconName: 'Globe',
    minRole: UserRole.GESTOR,
    path: 'https://analytics.google.com',
    status: ModuleStatus.NORMAL,
    category: 'ANALYTICS',
    type: ModuleType.EXTERNAL
  },
  {
    id: 'inventory',
    title: 'Controle de Estoque',
    description: 'Entrada, saída e balanço de mercadorias.',
    iconName: 'Box',
    minRole: UserRole.OPERATIONAL,
    path: '/module/inventory',
    status: ModuleStatus.NORMAL,
    category: 'OPERATIONAL',
    type: ModuleType.INTERNAL
  },
  {
    id: 'logistics',
    title: 'Logística e Frota',
    description: 'Gestão de entregas e manutenção de veículos.',
    iconName: 'Truck',
    minRole: UserRole.OPERATIONAL,
    path: '/module/logistics',
    status: ModuleStatus.CRITICAL, 
    category: 'OPERATIONAL',
    type: ModuleType.INTERNAL
  },
  {
    id: 'support-tickets',
    title: 'Central de Chamados',
    description: 'Atendimento interno e externo.',
    iconName: 'LifeBuoy',
    minRole: UserRole.OPERATIONAL,
    path: '/module/support',
    status: ModuleStatus.NORMAL,
    category: 'OPERATIONAL',
    type: ModuleType.INTERNAL
  }
];

export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 3,
  [UserRole.GESTOR]: 2,
  [UserRole.OPERATIONAL]: 1
};

// HydroSys Specific Sub-modules
export const HYDROSYS_SUBMODULES = [
  {
    id: 'hs-certificados',
    title: 'Certificados',
    description: 'Gestão de certificados de potabilidade.',
    iconName: 'Award',
    roles: [UserRole.OPERATIONAL, UserRole.GESTOR, UserRole.ADMIN]
  },
  {
    id: 'hs-cloro',
    title: 'Medição de Cloro',
    description: 'Registro diário de níveis de cloro.',
    iconName: 'TestTube',
    roles: [UserRole.OPERATIONAL, UserRole.GESTOR, UserRole.ADMIN]
  },
  {
    id: 'hs-filtros',
    title: 'Manutenção de Filtros',
    description: 'Cronograma e troca de elementos filtrantes.',
    iconName: 'Filter',
    roles: [UserRole.OPERATIONAL, UserRole.GESTOR, UserRole.ADMIN]
  },
  {
    id: 'hs-limpeza',
    title: 'Limpeza de Reservatório',
    description: 'Agendamento e laudos de higienização.',
    iconName: 'Droplet',
    roles: [UserRole.OPERATIONAL, UserRole.GESTOR, UserRole.ADMIN]
  },
  {
    id: 'hs-config',
    title: 'Configurações',
    description: 'Parâmetros de alertas e limites.',
    iconName: 'Settings',
    roles: [UserRole.ADMIN]
  },
  {
    id: 'hs-dashboard',
    title: 'Analytics HydroSys',
    description: 'Visão geral de qualidade e conformidade.',
    iconName: 'PieChart',
    roles: [UserRole.ADMIN]
  }
];
