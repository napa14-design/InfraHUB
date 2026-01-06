export enum UserRole {
  ADMIN = 'ADMIN',
  GESTOR = 'GESTOR',
  OPERATIONAL = 'OPERATIONAL'
}

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface Region {
  id: string;
  organizationId: string;
  name: string;
}

export interface Sede {
  id: string;
  regionId: string;
  name: string;
  address?: string;
}

export interface Local {
  id: string;
  sedeId: string;
  name: string;
  tipo?: string; // Ex: Bebedouro, Piscina, Cozinha
}

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  status: UserStatus;
  
  // Auth fields (Mock only - in real app password is never exposed like this)
  password?: string; 
  isFirstLogin: boolean;

  // Link user to hierarchy
  organizationId?: string;
  regionId?: string;
  sedeId?: string;
}

export enum ModuleStatus {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  MAINTENANCE = 'MAINTENANCE'
}

export enum ModuleType {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL'
}

export interface AppModule {
  id: string;
  title: string;
  description: string;
  iconName: string; 
  minRole: UserRole; 
  path: string; 
  status: ModuleStatus;
  category: 'ADMIN' | 'OPERATIONAL' | 'ANALYTICS';
  type: ModuleType;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: Date;
  link?: string; // Optional link to navigate to the issue
  moduleSource?: string;
}

export interface NotificationRule {
  id: string;
  moduleId: string;
  name: string; // Ex: "Validade de Certificados"
  description: string;
  warningDays: number; // Ex: 30 dias antes
  criticalDays: number; // Ex: 0 dias (Vencido) ou 7 dias antes
  enabled: boolean;
}

// --- HYDROSYS TYPES ---

export interface HydroCertificado {
  id: string;
  sedeId: string; // Para controle de acesso
  parceiro: string;
  status: 'VIGENTE' | 'VENCIDO' | 'PROXIMO';
  semestre: string;
  validadeSemestre: string;
  dataAnalise: string;
  validade: string;
  linkMicro: string; // Link Drive
  linkFisico: string; // Link Drive
  empresa: string;
  agendamento: string;
  observacao?: string;
}

export interface HydroCloroEntry {
  id: string;
  sedeId: string;
  date: string; // YYYY-MM-DD
  cl: number;
  ph: number;
  medidaCorretiva?: string;
  responsavel: string;
}

export interface HydroFiltro {
  id: string;
  sedeId: string;
  patrimonio: string;
  bebedouro: string;
  local: string;
  dataTroca: string;
  proximaTroca: string;
}

// Reservatórios divididos em 3 tipos
export interface HydroPoco {
  id: string;
  sedeId: string;
  bairro: string;
  responsavel: string;
  local: string;
  dataUltimaLimpeza: string;
  referenciaBomba: string;
  dataLimpeza: string;
  situacaoLimpeza: string;
  fichaOperacional: string;
  previsaoLimpeza1_2026: string;
  ultimaTrocaFiltro: string;
  situacaoFiltro: string;
  proximaTrocaFiltro: string;
  refil: string;
}

export interface HydroCisterna {
  id: string;
  sedeId: string;
  responsavel: string;
  local: string;
  numCelulas: number;
  capacidade: string;
  previsaoLimpeza1_2025: string;
  dataLimpeza1: string;
  previsaoLimpeza2_2025: string;
  dataLimpeza2: string;
  situacao: string;
}

export interface HydroCaixa {
  id: string;
  sedeId: string;
  responsavel: string;
  local: string;
  numCelulas: number;
  capacidade: string;
  previsaoLimpeza1_2025: string;
  dataLimpeza1: string;
  previsaoLimpeza2_2025: string;
  dataLimpeza2: string;
  situacao: string;
}