
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
  isFirstLogin?: boolean;
  organizationId?: string;
  regionId?: string;
  sedeIds: string[];
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

export type LogActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'AUTH';

export interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  module: string;
  action: LogActionType;
  target: string;
  details?: string;
  timestamp: string;
}

export interface HydroSettings {
  validadeCertificadoMeses: number;
  validadeFiltroMeses: number;
  validadeLimpezaCaixa: number;
  validadeLimpezaCisterna: number;
  validadeLimpezaPoco: number;
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
  date: string;
  cl: number;
  ph: number;
  medidaCorretiva?: string;
  responsavel: string;
  photoUrl?: string; 
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

// --- TIPAGEM AVANÇADA FICHA POÇO ---
export interface DadosPrePos {
  profundidade: string;
  nivelEstatico: string;
  nivelDinamico: string;
  tempo: string;
  vazao: string;
}

export interface MaterialPoco {
  item: string;
  situacao: 'BOM' | 'REGULAR' | 'RUIM';
  obs: string;
}

export interface ChecklistPoco {
  epis: string[]; // IDs dos EPIs marcados
  dia1: string[]; // IDs das etapas dia 1
  dia2: string[]; // IDs das etapas dia 2
  dia3: string[]; // IDs das etapas dia 3
}

export interface FichaPoco {
  // Cabeçalho
  inicioLimpeza: string;
  terminoLimpeza: string;
  supervisor: string;
  coordenador: string;
  bombeiro: string;
  // Dados Bomba
  profundidadeBomba: string;
  potenciaBomba: string;
  numEstagios: string;
  patrimonioBomba: string;
  marcaBomba: string;
  modeloBomba: string;
  // Especificação Poço
  preLimpeza: DadosPrePos;
  posLimpeza: DadosPrePos;
  // Materiais
  materiais: MaterialPoco[];
  // Checklist
  checklist: ChecklistPoco;
  // Necessidades / Obs
  necessidades: string[]; // IDs das necessidades marcadas
  observacoes: string;
}

export type TipoReservatorio = 'POCO' | 'CISTERNA' | 'CAIXA';

export interface HydroReservatorio {
  id: string;
  sedeId: string;
  tipo: TipoReservatorio;
  local: string;
  responsavel: string;
  dataUltimaLimpeza?: string;
  proximaLimpeza: string;
  situacaoLimpeza: 'DENTRO DO PRAZO' | 'FORA DO PRAZO' | 'PENDENTE' | 'DESATIVADO';
  bairro?: string;
  referenciaBomba?: string;
  fichaOperacional?: string; // Link antigo (manter compatibilidade)
  dadosFicha?: FichaPoco; // NOVO: Dados estruturados do PDF
  ultimaTrocaFiltro?: string;
  proximaTrocaFiltro?: string;
  situacaoFiltro?: string;
  refil?: string;
  numCelulas?: number;
  capacidade?: string;
  previsaoLimpeza1?: string;
  dataLimpeza1?: string;
  previsaoLimpeza2?: string;
  dataLimpeza2?: string;
}

export type HydroPoco = HydroReservatorio;
export type HydroCisterna = HydroReservatorio;
export type HydroCaixa = HydroReservatorio;

export interface PestTechnician {
  name: string;
  sedeId?: string;
}

export interface PestControlSettings {
  pestTypes: string[];
  technicians: PestTechnician[];
  globalFrequencies: Record<string, number>;
  sedeFrequencies: Record<string, Record<string, number>>;
}

export interface PestControlEntry {
  id: string;
  sedeId: string;
  item: string; 
  target: string; 
  product: string; 
  frequency: string; 
  method: string; 
  technician: string; 
  scheduledDate: string; 
  performedDate?: string; 
  observation?: string;
  status: 'PENDENTE' | 'REALIZADO' | 'ATRASADO';
  photoUrl?: string;
}
