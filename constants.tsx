import { UserRole, AppModule, ModuleStatus, User, ModuleType, Organization, Region, Sede, Local } from './types';

// --- ESTRUTURA ORGANIZACIONAL MOCKADA ---

// Nível 1: Instituição (Organization)
export const MOCK_ORGS: Organization[] = [
  { id: 'org-col', name: 'Colégio Farias Brito', logoUrl: '' },
  { id: 'org-uni', name: 'Centro Universitário FB', logoUrl: '' }
];

// Nível 2: Região
export const MOCK_REGIONS: Region[] = [
  // Colégio
  { id: 'reg-dt', organizationId: 'org-col', name: 'Dionísio Torres' },
  { id: 'reg-ald', organizationId: 'org-col', name: 'Aldeota' },
  { id: 'reg-pql', organizationId: 'org-col', name: 'Parquelândia' },
  { id: 'reg-sul', organizationId: 'org-col', name: 'Sul' },
  { id: 'reg-ben', organizationId: 'org-col', name: 'Benfica' },
  // Universidade
  { id: 'reg-uni-all', organizationId: 'org-uni', name: 'Campus Geral' } 
];

// Nível 3: Sede
export const MOCK_SEDES: Sede[] = [
  // Colégio - Dionísio Torres
  { id: 'sede-dt1', regionId: 'reg-dt', name: 'DT1 (Central)', address: 'Rua Principal' },
  { id: 'sede-dt2', regionId: 'reg-dt', name: 'DT2', address: '' },
  { id: 'sede-pdt', regionId: 'reg-dt', name: 'PDT (Pre-Vest)', address: '' },
  { id: 'sede-idi', regionId: 'reg-dt', name: 'Idiomas', address: '' },
  // Colégio - Aldeota
  { id: 'sede-bs', regionId: 'reg-ald', name: 'BS', address: '' },
  { id: 'sede-sp', regionId: 'reg-ald', name: 'SP', address: '' },
  { id: 'sede-pnv', regionId: 'reg-ald', name: 'PNV', address: '' },
  // Colégio - Sul
  { id: 'sede-sul1', regionId: 'reg-sul', name: 'SUL 1', address: '' },
  { id: 'sede-sul2', regionId: 'reg-sul', name: 'SUL 2', address: '' },
  // Universidade
  { id: 'sede-dl', regionId: 'reg-uni-all', name: 'Dom Luís (DL)', address: '' },
  { id: 'sede-pe', regionId: 'reg-uni-all', name: 'Parque Ecológico (PE)', address: '' },
  { id: 'sede-eus', regionId: 'reg-uni-all', name: 'Eusébio (EUS)', address: '' }
];

// Nível 4: Local (Exemplos)
export const MOCK_LOCAIS: Local[] = [
  { id: 'loc-1', sedeId: 'sede-dt1', name: 'Bebedouro Hall Entrada', tipo: 'BEBEDOURO' },
  { id: 'loc-2', sedeId: 'sede-dt1', name: 'Piscina Olímpica', tipo: 'PISCINA' },
  { id: 'loc-3', sedeId: 'sede-sul1', name: 'Cozinha Industrial', tipo: 'TORNEIRA' }
];

// Mock Users
export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Roberto Admin',
    email: 'admin@nexus.com',
    role: UserRole.ADMIN,
    organizationId: 'org-col',
    regionId: 'reg-dt',
    sedeId: 'sede-dt1',
    status: 'ACTIVE',
    password: '123',
    isFirstLogin: false
  },
  {
    id: '2',
    name: 'Glória Gestora',
    email: 'gestor@nexus.com',
    role: UserRole.GESTOR,
    organizationId: 'org-col',
    regionId: 'reg-dt',
    sedeId: 'sede-dt1',
    status: 'ACTIVE',
    password: '123',
    isFirstLogin: false
  },
  {
    id: '3',
    name: 'João Operacional',
    email: 'operacional@nexus.com',
    role: UserRole.OPERATIONAL,
    organizationId: 'org-col',
    regionId: 'reg-dt',
    sedeId: 'sede-dt1',
    status: 'ACTIVE',
    password: '123',
    isFirstLogin: true // Force password change
  }
];

// Initial Seed Data for Modules
export const INITIAL_MODULES: AppModule[] = [
  {
    id: 'hydrosys',
    title: 'HydroSys',
    description: 'Gestão completa de qualidade da água e reservatórios.',
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