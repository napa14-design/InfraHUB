
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
  tipo?: string; // Ex: BEBEDOURO, PISCINA, POCO, CISTERNA
}

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  isFirstLogin?: boolean; // Flag para forçar troca de senha via Modal
  
  // Link user to hierarchy
  organizationId?: string;
  regionId?: string;
  sedeIds: string[]; // IDs das sedes que o usuário tem acesso
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
  link?: string;
  moduleSource?: string;
}

export interface NotificationRule {
  id: string;
  moduleId: string;
  name: string;
  description: string;
  warningDays: number;
  criticalDays: number;
  enabled: boolean;
}

// --- LOGGING TYPES ---
export type LogActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'AUTH';

export interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  module: string; // 'HYDROSYS', 'AUTH', 'ADMIN', etc.
  action: LogActionType;
  target: string; // O que foi afetado (ex: "Certificado X", "Usuário Y")
  details?: string;
  timestamp: string; // ISO String
}

// --- HYDROSYS TYPES ---

export interface HydroSettings {
  validadeCertificadoMeses: number;
  validadeFiltroMeses: number;
  validadeLimpezaMeses: number;
  cloroMin: number;
  cloroMax: number;
  phMin: number;
  phMax: number;
}

export interface HydroCertificado {
  id: string;
  sedeId: string;
  parceiro: string;
  status: 'VIGENTE' | 'VENCIDO' | 'PROXIMO';
  semestre: string;
  validadeSemestre: string;
  dataAnalise: string;
  validade: string;
  linkMicro: string;
  linkFisico: string;
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

// RESERVATÓRIOS UNIFICADOS (Superset Type)
// Este tipo cobre Poços, Cisternas e Caixas d'água com campos opcionais
export type TipoReservatorio = 'POCO' | 'CISTERNA' | 'CAIXA';

export interface HydroReservatorio {
  id: string;
  sedeId: string;
  tipo: TipoReservatorio;
  local: string;
  responsavel: string;
  
  // Controle de Limpeza (Comum a todos)
  dataUltimaLimpeza?: string; // Data realizada
  proximaLimpeza: string; // Data prevista
  situacaoLimpeza: 'DENTRO DO PRAZO' | 'FORA DO PRAZO' | 'PENDENTE' | 'DESATIVADO';
  
  // Específico: Poços
  bairro?: string;
  referenciaBomba?: string;
  fichaOperacional?: string;
  
  // Específico: Filtro do Poço
  ultimaTrocaFiltro?: string;
  proximaTrocaFiltro?: string;
  situacaoFiltro?: string;
  refil?: string;

  // Específico: Cisternas e Caixas
  numCelulas?: number;
  capacidade?: string;
  
  // Campos de Cronograma Semestral (Comum para Caixas/Cisternas)
  previsaoLimpeza1?: string;
  dataLimpeza1?: string; // Realizado sem 1
  previsaoLimpeza2?: string;
  dataLimpeza2?: string; // Realizado sem 2
}

// Alias para manter compatibilidade com componentes antigos temporariamente, 
// mas idealmente o código deve migrar para usar HydroReservatorio
export type HydroPoco = HydroReservatorio;
export type HydroCisterna = HydroReservatorio;
export type HydroCaixa = HydroReservatorio;
