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
    if (!dateStr || dateStr.trim() === '') return '';
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

// Converts "mmm./yyyy" (e.g. "jan./2026") to YYYY-MM-DD
const parseMonthYear = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.trim().split('/');
    if (parts.length !== 2) return '';
    
    const monthMap: Record<string, string> = {
        'jan.': '01', 'fev.': '02', 'mar.': '03', 'abr.': '04', 'mai.': '05', 'jun.': '06',
        'jul.': '07', 'ago.': '08', 'set.': '09', 'out.': '10', 'nov.': '11', 'dez.': '12'
    };
    
    const month = monthMap[parts[0].toLowerCase()] || '01';
    const year = parts[1];
    
    return `${year}-${month}-01`;
};

// --- REAL CERTIFICADOS DATA (Sample maintained as provided manually, user didn't provide full CSV for this) ---
const mockCertificados: HydroCertificado[] = [
  {
    id: 'cert-ald-vl', sedeId: 'ALD', parceiro: 'ALD - VL', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('22/08/2025'), validade: parseDate('18/02/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  {
    id: 'cert-pe', sedeId: 'PE', parceiro: 'PE', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('26/09/2025'), validade: parseDate('25/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
  {
    id: 'cert-pjf', sedeId: 'PJF', parceiro: 'PJF', status: 'VENCIDO', semestre: '2º/2025',
    validadeSemestre: parseDate('19/11/2025'), dataAnalise: '', validade: '', 
    linkMicro: '', linkFisico: '', empresa: 'Nexus Group', agendamento: 'AGENDAR', observacao: 'Não Certificado'
  },
  {
    id: 'cert-dt', sedeId: 'DT', parceiro: 'DT', status: 'VIGENTE', semestre: '2º/2025',
    validadeSemestre: '', dataAnalise: parseDate('05/09/2025'), validade: parseDate('04/03/2026'),
    linkMicro: '#', linkFisico: '#', empresa: 'Nexus Group', agendamento: '', observacao: ''
  },
];

const mockCloro: HydroCloroEntry[] = [
  { id: '1', sedeId: 'DT', date: new Date().toISOString().split('T')[0], cl: 1.5, ph: 7.2, responsavel: 'João Op.', medidaCorretiva: 'Nenhuma' },
  { id: '2', sedeId: 'ALD', date: '2023-10-25', cl: 0.5, ph: 6.8, responsavel: 'Maria Op.', medidaCorretiva: 'Adicionado Cloro' }
];

const mockFiltros: HydroFiltro[] = [
  { id: 'pe-1', sedeId: 'PE', patrimonio: '1098', bebedouro: 'Bebedouro', local: '10º ANDAR', dataTroca: parseDate('07/07/2025'), proximaTroca: parseMonthYear('jan./2026') },
  { id: 'pe-2', sedeId: 'PE', patrimonio: '1281', bebedouro: 'Bebedouro', local: '9º ANDAR', dataTroca: parseDate('07/07/2025'), proximaTroca: parseMonthYear('jan./2026') },
];

// --- FULL CSV DATA IMPORTS ---

// 3. POÇOS / BOMBAS / BEBEDOUROS (Full CSV)
const mockPocos: HydroPoco[] = [
  { id: 'p-1', sedeId: 'ALD', bairro: '', responsavel: 'JOSY', local: 'SUBSOLO', dataUltimaLimpeza: parseDate('24/01/2024'), referenciaBomba: '', dataLimpeza: parseDate('09/07/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('09/07/2026'), ultimaTrocaFiltro: parseDate('09/07/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('05/01/2026'), refil: '10"' },
  { id: 'p-2', sedeId: 'ALD', bairro: '', responsavel: 'JOSY', local: 'SUBSOLO', dataUltimaLimpeza: parseDate('24/01/2024'), referenciaBomba: '', dataLimpeza: parseDate('14/07/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('14/07/2026'), ultimaTrocaFiltro: parseDate('14/07/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('10/01/2026'), refil: '10"' },
  { id: 'p-3', sedeId: 'BN', bairro: '', responsavel: 'REBECCA', local: 'CORREDOR (BOSQUE)', dataUltimaLimpeza: parseDate('01/01/2024'), referenciaBomba: '', dataLimpeza: parseDate('19/04/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('19/04/2026'), ultimaTrocaFiltro: parseDate('19/04/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('16/10/2025'), refil: '20"' },
  { id: 'p-4', sedeId: 'BS', bairro: '', responsavel: '', local: 'RESIDÊNCIA', dataUltimaLimpeza: parseDate('01/01/2024'), referenciaBomba: '', dataLimpeza: '', situacaoLimpeza: 'FORA DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: '', situacaoFiltro: 'NÃO POSSUI', proximaTrocaFiltro: '', refil: '-' },
  { id: 'p-5', sedeId: 'BS', bairro: '', responsavel: '', local: 'JARDIM', dataUltimaLimpeza: parseDate('14/12/2024'), referenciaBomba: '', dataLimpeza: '', situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: parseDate('12/06/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('09/12/2025'), refil: '10"' },
  { id: 'p-6', sedeId: 'BS', bairro: '', responsavel: '', local: 'SUBSOLO', dataUltimaLimpeza: parseDate('20/12/2024'), referenciaBomba: '', dataLimpeza: '', situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: parseDate('18/06/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('15/12/2025'), refil: '10"' },
  { id: 'p-7', sedeId: 'DL', bairro: '', responsavel: 'RAYANNE', local: 'NPJ', dataUltimaLimpeza: parseDate('25/01/2024'), referenciaBomba: '', dataLimpeza: parseDate('26/02/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('26/02/2026'), ultimaTrocaFiltro: '', situacaoFiltro: 'NÃO POSSUI', proximaTrocaFiltro: '', refil: '-' },
  { id: 'p-8', sedeId: 'DL', bairro: '', responsavel: 'RAYANNE', local: 'NPT', dataUltimaLimpeza: parseDate('30/01/2024'), referenciaBomba: '', dataLimpeza: parseDate('11/03/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('11/03/2026'), ultimaTrocaFiltro: '', situacaoFiltro: 'NÃO POSSUI', proximaTrocaFiltro: '', refil: '-' },
  { id: 'p-9', sedeId: 'DL', bairro: '', responsavel: 'RAYANNE', local: 'SUBSOLO 02', dataUltimaLimpeza: parseDate('01/04/2024'), referenciaBomba: '', dataLimpeza: parseDate('05/02/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('05/02/2026'), ultimaTrocaFiltro: parseDate('28/09/2024'), situacaoFiltro: 'FORA DO PRAZO', proximaTrocaFiltro: parseDate('27/03/2025'), refil: '20"' },
  { id: 'p-10', sedeId: 'DL', bairro: '', responsavel: 'RAYANNE', local: 'ESTACIONAMENTO (GUARITA)', dataUltimaLimpeza: parseDate('04/04/2024'), referenciaBomba: '', dataLimpeza: parseDate('17/02/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('17/02/2026'), ultimaTrocaFiltro: parseDate('01/10/2024'), situacaoFiltro: 'FORA DO PRAZO', proximaTrocaFiltro: parseDate('30/03/2025'), refil: '10"' },
  { id: 'p-11', sedeId: 'DL', bairro: '', responsavel: 'RAYANNE', local: 'ESTACIONAMENTO (EXTERNO)', dataUltimaLimpeza: parseDate('09/04/2024'), referenciaBomba: '', dataLimpeza: parseDate('12/02/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('12/02/2026'), ultimaTrocaFiltro: parseDate('06/10/2024'), situacaoFiltro: 'FORA DO PRAZO', proximaTrocaFiltro: parseDate('04/04/2025'), refil: '10"' },
  { id: 'p-12', sedeId: 'DL', bairro: '', responsavel: 'RAYANNE', local: 'QUADRA (AV. VIRGÍLIO TÁVORA)', dataUltimaLimpeza: parseDate('15/04/2024'), referenciaBomba: '', dataLimpeza: parseDate('17/03/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('17/03/2026'), ultimaTrocaFiltro: parseDate('12/10/2024'), situacaoFiltro: 'FORA DO PRAZO', proximaTrocaFiltro: parseDate('10/04/2025'), refil: '10"' },
  { id: 'p-13', sedeId: 'DT', bairro: '', responsavel: 'ELANO', local: 'PORTARIA 03', dataUltimaLimpeza: parseDate('28/08/2024'), referenciaBomba: 'MB-37', dataLimpeza: '', situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: parseDate('24/02/2025'), situacaoFiltro: 'FORA DO PRAZO', proximaTrocaFiltro: parseDate('23/08/2025'), refil: '20"' },
  { id: 'p-14', sedeId: 'DT', bairro: '', responsavel: 'ELANO', local: 'CPA', dataUltimaLimpeza: parseDate('31/10/2024'), referenciaBomba: 'MB-133', dataLimpeza: '', situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: parseDate('29/04/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('26/10/2025'), refil: '10"' },
  { id: 'p-15', sedeId: 'DT', bairro: '', responsavel: 'ELANO', local: 'PORTARIA 02', dataUltimaLimpeza: parseDate('09/11/2024'), referenciaBomba: 'MB-117', dataLimpeza: '', situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: parseDate('08/05/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('04/11/2025'), refil: '10"' },
  { id: 'p-16', sedeId: 'DT', bairro: '', responsavel: 'ELANO', local: 'JARDIM (INFANTIL)', dataUltimaLimpeza: parseDate('22/11/2024'), referenciaBomba: 'MB-151', dataLimpeza: '', situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: parseDate('21/05/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('17/11/2025'), refil: '20"' },
  { id: 'p-17', sedeId: 'DT', bairro: '', responsavel: 'ELANO', local: 'PORTARIA 04', dataUltimaLimpeza: parseDate('05/12/2024'), referenciaBomba: '', dataLimpeza: '', situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: parseDate('03/06/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('30/11/2025'), refil: '10"' },
  { id: 'p-18', sedeId: 'EUS', bairro: '', responsavel: 'DÂNIA', local: 'UNIVERSIDADE', dataUltimaLimpeza: parseDate('17/12/2024'), referenciaBomba: '', dataLimpeza: '', situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: parseDate('15/06/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('12/12/2025'), refil: '10"' },
  { id: 'p-19', sedeId: 'EUS', bairro: '', responsavel: 'DÂNIA', local: 'CONSTRUTORA', dataUltimaLimpeza: parseDate('17/12/2024'), referenciaBomba: '', dataLimpeza: '', situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: parseDate('15/06/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('12/12/2025'), refil: '10"' },
  { id: 'p-20', sedeId: 'PE', bairro: '', responsavel: 'DANIELLE', local: 'SUBSOLO 2 (RAMPA)', dataUltimaLimpeza: parseDate('18/03/2024'), referenciaBomba: '', dataLimpeza: parseDate('29/08/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: parseDate('14/09/2024'), situacaoFiltro: 'FORA DO PRAZO', proximaTrocaFiltro: parseDate('13/03/2025'), refil: '10"' },
  { id: 'p-21', sedeId: 'PE', bairro: '', responsavel: 'DANIELLE', local: 'COPA (CAJUEIRO)', dataUltimaLimpeza: parseDate('01/10/2024'), referenciaBomba: '', dataLimpeza: parseDate('28/08/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('28/08/2026'), ultimaTrocaFiltro: parseDate('30/03/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('26/09/2025'), refil: '20"' },
  { id: 'p-22', sedeId: 'PE', bairro: '', responsavel: 'DANIELLE', local: 'PORTARIA', dataUltimaLimpeza: parseDate('16/10/2024'), referenciaBomba: '', dataLimpeza: parseDate('26/08/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('26/08/2026'), ultimaTrocaFiltro: parseDate('14/04/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('11/10/2025'), refil: '10"' },
  { id: 'p-23', sedeId: 'PJF', bairro: '', responsavel: 'ALVARO', local: 'PÁTIO (CANTINA)', dataUltimaLimpeza: parseDate('01/01/2024'), referenciaBomba: '', dataLimpeza: parseDate('24/03/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('24/03/2026'), ultimaTrocaFiltro: parseDate('29/06/2024'), situacaoFiltro: 'FORA DO PRAZO', proximaTrocaFiltro: parseDate('26/12/2024'), refil: '10"' },
  { id: 'p-24', sedeId: 'PNV', bairro: '', responsavel: '', local: 'ESTACIONAMENTO (LATERAL)', dataUltimaLimpeza: parseDate('26/12/2024'), referenciaBomba: '', dataLimpeza: '', situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: parseDate('24/06/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('21/12/2025'), refil: '10"' },
  { id: 'p-25', sedeId: 'PQL1', bairro: '', responsavel: 'ALVARO', local: 'INFRA (COPA)', dataUltimaLimpeza: parseDate('11/06/2024'), referenciaBomba: '', dataLimpeza: parseDate('16/08/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: parseDate('08/12/2024'), situacaoFiltro: 'FORA DO PRAZO', proximaTrocaFiltro: parseDate('06/06/2025'), refil: '20"' },
  { id: 'p-26', sedeId: 'PQL2', bairro: '', responsavel: 'ALVARO', local: 'LOJINHA', dataUltimaLimpeza: parseDate('22/05/2024'), referenciaBomba: '', dataLimpeza: '', situacaoLimpeza: 'FORA DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: parseDate('18/11/2024'), situacaoFiltro: 'FORA DO PRAZO', proximaTrocaFiltro: parseDate('17/05/2025'), refil: '10"' },
  { id: 'p-27', sedeId: 'PQL3', bairro: '', responsavel: 'JOÃO VICTOR', local: 'PÁTIO (CANTINA)', dataUltimaLimpeza: parseDate('27/05/2024'), referenciaBomba: '', dataLimpeza: '', situacaoLimpeza: 'FORA DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: parseDate('23/11/2024'), situacaoFiltro: 'FORA DO PRAZO', proximaTrocaFiltro: parseDate('22/05/2025'), refil: '10"' },
  { id: 'p-28', sedeId: 'PQL3', bairro: '', responsavel: 'JOÃO VICTOR', local: 'CLÍNICA DE FISIOTERAPIA', dataUltimaLimpeza: '', referenciaBomba: '', dataLimpeza: parseDate('18/08/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: '', previsaoLimpeza1_2026: '', ultimaTrocaFiltro: parseDate('28/06/1900'), situacaoFiltro: '', proximaTrocaFiltro: parseDate('25/12/1900'), refil: '' },
  { id: 'p-29', sedeId: 'PSUL', bairro: '', responsavel: 'LARISSA', local: 'SALA 03 (AUDITÓRIO)', dataUltimaLimpeza: parseDate('01/01/2024'), referenciaBomba: '', dataLimpeza: parseDate('11/10/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('11/10/2026'), ultimaTrocaFiltro: parseDate('29/06/2024'), situacaoFiltro: 'FORA DO PRAZO', proximaTrocaFiltro: parseDate('26/12/2024'), refil: '20"' },
  { id: 'p-30', sedeId: 'SP', bairro: '', responsavel: '', local: 'JARDIM (JV)', dataUltimaLimpeza: '', referenciaBomba: '', dataLimpeza: parseDate('02/01/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('02/01/2026'), ultimaTrocaFiltro: parseDate('02/01/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('01/07/2025'), refil: '10"' },
  { id: 'p-31', sedeId: 'SP', bairro: '', responsavel: '', local: 'PORTARIA (CAPELA)', dataUltimaLimpeza: '', referenciaBomba: '', dataLimpeza: parseDate('09/01/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('09/01/2026'), ultimaTrocaFiltro: parseDate('09/01/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('08/07/2025'), refil: '10"' },
  { id: 'p-32', sedeId: 'SUL2', bairro: '', responsavel: 'LARISSA', local: 'INFRA (GUARITA)', dataUltimaLimpeza: parseDate('06/05/2024'), referenciaBomba: '', dataLimpeza: parseDate('02/09/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('02/09/2026'), ultimaTrocaFiltro: parseDate('02/09/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('01/03/2026'), refil: '20"' },
  { id: 'p-33', sedeId: 'SUL2', bairro: '', responsavel: 'LARISSA', local: 'QUADRA 01', dataUltimaLimpeza: parseDate('15/05/2024'), referenciaBomba: '', dataLimpeza: parseDate('28/08/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('28/08/2026'), ultimaTrocaFiltro: parseDate('28/08/2025'), situacaoFiltro: 'DENTRO DO PRAZO', proximaTrocaFiltro: parseDate('24/02/2026'), refil: '10"' },
  { id: 'p-34', sedeId: 'SUL3', bairro: '', responsavel: 'LARISSA', local: 'ESTACIONAMENTO (QUADRA)', dataUltimaLimpeza: parseDate('24/04/2024'), referenciaBomba: '', dataLimpeza: parseDate('08/09/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('08/09/2026'), ultimaTrocaFiltro: parseDate('21/10/2024'), situacaoFiltro: 'FORA DO PRAZO', proximaTrocaFiltro: parseDate('19/04/2025'), refil: '10"' },
  { id: 'p-35', sedeId: 'SUL3', bairro: '', responsavel: 'LARISSA', local: 'ESTACIONAMENTO (GUARITA)', dataUltimaLimpeza: parseDate('29/04/2024'), referenciaBomba: '', dataLimpeza: parseDate('03/09/2025'), situacaoLimpeza: 'DENTRO DO PRAZO', fichaOperacional: 'LINK', previsaoLimpeza1_2026: parseDate('03/09/2026'), ultimaTrocaFiltro: parseDate('26/10/2024'), situacaoFiltro: 'FORA DO PRAZO', proximaTrocaFiltro: parseDate('24/04/2025'), refil: '10"' },
];

// 1. CISTERNAS (Full CSV)
const mockCisternas: HydroCisterna[] = [
  { id: 'c-1', sedeId: 'ALD', responsavel: 'JOZY', local: 'BLOCO A', numCelulas: 2, capacidade: '80.000', previsaoLimpeza1_2025: parseDate('30/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: parseDate('30/08/2025'), dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
  { id: 'c-2', sedeId: 'BN', responsavel: 'REBECCA', local: 'BLOCO A (1º ANDAR)', numCelulas: 2, capacidade: '79.000', previsaoLimpeza1_2025: parseDate('28/05/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
  { id: 'c-3', sedeId: 'BN', responsavel: 'REBECCA', local: 'QUADRA', numCelulas: 1, capacidade: '', previsaoLimpeza1_2025: '', dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'DESATIVADO' },
  { id: 'c-4', sedeId: 'BN', responsavel: 'REBECCA', local: 'BOSQUE (BIBLIOTECA)', numCelulas: 1, capacidade: '10.000', previsaoLimpeza1_2025: '', dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'DESATIVADO' },
  { id: 'c-5', sedeId: 'BS', responsavel: 'HÉRIC', local: 'BLOCO C', numCelulas: 2, capacidade: '40.000', previsaoLimpeza1_2025: parseDate('11/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
  { id: 'c-6', sedeId: 'BS', responsavel: 'HÉRIC', local: 'OBSERVATÓRIO', numCelulas: 2, capacidade: '80.000', previsaoLimpeza1_2025: '', dataLimpeza1: parseDate('18/01/2025'), previsaoLimpeza2_2025: parseDate('17/07/2025'), dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
  { id: 'c-7', sedeId: 'DL', responsavel: 'RAYANNE', local: '16º ANDAR', numCelulas: 2, capacidade: '138.400', previsaoLimpeza1_2025: parseDate('28/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: parseDate('15/08/2025'), dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
  { id: 'c-8', sedeId: 'DT', responsavel: 'ALVARO', local: '2º ANDAR (PDT)', numCelulas: 1, capacidade: '10.000', previsaoLimpeza1_2025: '', dataLimpeza1: parseDate('05/03/2025'), previsaoLimpeza2_2025: parseDate('01/09/2025'), dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
  { id: 'c-9', sedeId: 'DT', responsavel: 'ALVARO', local: '3º ANDAR (DT1 VELHO)', numCelulas: 2, capacidade: '50.000', previsaoLimpeza1_2025: '', dataLimpeza1: parseDate('05/03/2025'), previsaoLimpeza2_2025: parseDate('01/09/2025'), dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
  { id: 'c-10', sedeId: 'DT', responsavel: 'ALVARO', local: '5º ANDAR (DT1 NOVO)', numCelulas: 2, capacidade: '44.000', previsaoLimpeza1_2025: parseDate('11/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
  { id: 'c-11', sedeId: 'DT', responsavel: 'ALVARO', local: '10º ANDAR', numCelulas: 1, capacidade: '60.000', previsaoLimpeza1_2025: '', dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'FORA DO PRAZO' },
  { id: 'c-12', sedeId: 'DT', responsavel: 'ALVARO', local: 'CPA', numCelulas: 2, capacidade: '4.000', previsaoLimpeza1_2025: '', dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'FORA DO PRAZO' },
  { id: 'c-13', sedeId: 'DT', responsavel: 'ALVARO', local: 'IDIOMAS', numCelulas: 1, capacidade: '2.000', previsaoLimpeza1_2025: '', dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'FORA DO PRAZO' },
  { id: 'c-14', sedeId: 'DT', responsavel: 'ALVARO', local: 'VIVÊNCIA DOS FUNCIONÁRIOS', numCelulas: 2, capacidade: '20.000', previsaoLimpeza1_2025: '', dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'DESATIVADO' },
  { id: 'c-15', sedeId: 'EUS', responsavel: 'DÂNIA', local: '4º ANDAR (ABASTECIMENTO)', numCelulas: 2, capacidade: '16.400', previsaoLimpeza1_2025: '', dataLimpeza1: parseDate('08/03/2025'), previsaoLimpeza2_2025: parseDate('04/09/2025'), dataLimpeza2: parseDate('26/07/2025'), situacao: 'DENTRO DO PRAZO' },
  { id: 'c-16', sedeId: 'EUS', responsavel: 'DÂNIA', local: '4º ANDAR (REÚSO)', numCelulas: 2, capacidade: '16.400', previsaoLimpeza1_2025: '', dataLimpeza1: parseDate('05/04/2025'), previsaoLimpeza2_2025: parseDate('02/10/2025'), dataLimpeza2: parseDate('26/07/2025'), situacao: 'DENTRO DO PRAZO' },
  { id: 'c-17', sedeId: 'PE', responsavel: 'DANIELLE', local: '5º ANDAR', numCelulas: 2, capacidade: '79.000', previsaoLimpeza1_2025: '', dataLimpeza1: parseDate('17/01/2025'), previsaoLimpeza2_2025: parseDate('16/07/2025'), dataLimpeza2: parseDate('07/07/2025'), situacao: 'DENTRO DO PRAZO' },
  { id: 'c-18', sedeId: 'PE', responsavel: 'DANIELLE', local: '12º ANDAR', numCelulas: 2, capacidade: '81.000', previsaoLimpeza1_2025: '', dataLimpeza1: parseDate('22/01/2025'), previsaoLimpeza2_2025: parseDate('21/07/2025'), dataLimpeza2: parseDate('07/07/2025'), situacao: 'DENTRO DO PRAZO' },
  { id: 'c-19', sedeId: 'PE', responsavel: 'DANIELLE', local: 'ESTACIONAMENTO (CES)', numCelulas: 3, capacidade: '7.500', previsaoLimpeza1_2025: '', dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'DESATIVADO' },
  { id: 'c-20', sedeId: 'PE', responsavel: 'DANIELLE', local: 'GASTRONOMIA', numCelulas: 1, capacidade: '10.000', previsaoLimpeza1_2025: '', dataLimpeza1: parseDate('24/01/2025'), previsaoLimpeza2_2025: parseDate('23/07/2025'), dataLimpeza2: parseDate('15/07/2025'), situacao: 'DENTRO DO PRAZO' },
  { id: 'c-21', sedeId: 'PJF', responsavel: 'RAFAEL', local: 'CANTINA', numCelulas: 1, capacidade: '21.000', previsaoLimpeza1_2025: '', dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'FORA DO PRAZO' },
  { id: 'c-22', sedeId: 'PJF', responsavel: 'RAFAEL', local: 'BIBLIOTECA', numCelulas: 1, capacidade: '9.000', previsaoLimpeza1_2025: '', dataLimpeza1: parseDate('15/01/2025'), previsaoLimpeza2_2025: parseDate('14/07/2025'), dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
  { id: 'c-23', sedeId: 'PNV', responsavel: 'HÉRIC', local: '4º ANDAR', numCelulas: 1, capacidade: '24.500', previsaoLimpeza1_2025: parseDate('26/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
  { id: 'c-24', sedeId: 'PQL1', responsavel: 'RAFAEL', local: '4º ANDAR', numCelulas: 2, capacidade: '69.900', previsaoLimpeza1_2025: parseDate('30/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
  { id: 'c-25', sedeId: 'PQL2', responsavel: 'RAFAEL', local: '5º ANDAR', numCelulas: 2, capacidade: '56.600', previsaoLimpeza1_2025: parseDate('26/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
  { id: 'c-26', sedeId: 'PQL3', responsavel: 'NERISSA', local: '4º ANDAR', numCelulas: 2, capacidade: '68.400', previsaoLimpeza1_2025: '', dataLimpeza1: parseDate('03/01/2025'), previsaoLimpeza2_2025: parseDate('02/07/2025'), dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
  { id: 'c-27', sedeId: 'PSUL', responsavel: 'LARISSA', local: '1º ANDAR', numCelulas: 2, capacidade: '21.600', previsaoLimpeza1_2025: parseDate('18/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: parseDate('22/07/2025'), situacao: 'DENTRO DO PRAZO' },
  { id: 'c-28', sedeId: 'SP', responsavel: 'HÉRIC', local: 'JV', numCelulas: 2, capacidade: '132.000', previsaoLimpeza1_2025: parseDate('30/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: parseDate('25/07/2025'), situacao: 'DENTRO DO PRAZO' },
  { id: 'c-29', sedeId: 'SP', responsavel: 'HÉRIC', local: 'SP', numCelulas: 2, capacidade: '25.000', previsaoLimpeza1_2025: '', dataLimpeza1: parseDate('07/01/2025'), previsaoLimpeza2_2025: parseDate('06/07/2025'), dataLimpeza2: parseDate('14/08/2025'), situacao: 'DENTRO DO PRAZO' },
  { id: 'c-30', sedeId: 'SUL2', responsavel: 'LARISSA', local: '5º ANDAR', numCelulas: 2, capacidade: '118.000', previsaoLimpeza1_2025: parseDate('28/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: parseDate('16/08/2025'), situacao: 'DENTRO DO PRAZO' },
  { id: 'c-31', sedeId: 'SUL3', responsavel: 'LARISSA', local: '6º ANDAR', numCelulas: 2, capacidade: '63.000', previsaoLimpeza1_2025: '', dataLimpeza1: parseDate('02/01/2025'), previsaoLimpeza2_2025: parseDate('01/07/2025'), dataLimpeza2: parseDate('24/07/2025'), situacao: 'DENTRO DO PRAZO' },
  { id: 'c-32', sedeId: 'SUL3', responsavel: 'LARISSA', local: '6º ANDAR (REÚSO)', numCelulas: 1, capacidade: '21.000', previsaoLimpeza1_2025: '', dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'DESATIVADO' },
];

// 2. CAIXAS D'ÁGUA (Full CSV)
const mockCaixas: HydroCaixa[] = [
    { id: 'cx-1', sedeId: 'ALD', responsavel: 'JOSY', local: 'SUBSOLO', numCelulas: 2, capacidade: '80.000', previsaoLimpeza1_2025: '', dataLimpeza1: parseDate('07/01/2025'), previsaoLimpeza2_2025: parseDate('06/07/2025'), dataLimpeza2: parseDate('11/08/2025'), situacao: 'DENTRO DO PRAZO' },
    { id: 'cx-2', sedeId: 'BS', responsavel: 'HÉRIC', local: 'SUBSOLO', numCelulas: 1, capacidade: '116.000', previsaoLimpeza1_2025: parseDate('14/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: parseDate('05/07/2025'), situacao: 'DENTRO DO PRAZO' },
    { id: 'cx-3', sedeId: 'DL', responsavel: 'RAYANNE', local: 'SUBSOLO 02', numCelulas: 2, capacidade: '57.600', previsaoLimpeza1_2025: parseDate('07/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: parseDate('15/08/2025'), situacao: 'DENTRO DO PRAZO' },
    { id: 'cx-4', sedeId: 'DT', responsavel: 'ALVÁRO', local: 'PÁTIO DOS ELEVADORES', numCelulas: 1, capacidade: '50.600', previsaoLimpeza1_2025: '', dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'FORA DO PRAZO' },
    { id: 'cx-5', sedeId: 'PE', responsavel: 'DANIELLE', local: 'TERRENO PRÓX. ALMOX.', numCelulas: 2, capacidade: '101.200', previsaoLimpeza1_2025: parseDate('17/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: parseDate('05/07/2025'), situacao: 'DENTRO DO PRAZO' },
    { id: 'cx-6', sedeId: 'PE', responsavel: 'DANIELLE', local: 'SUBSOLO 01', numCelulas: 4, capacidade: '30.000', previsaoLimpeza1_2025: parseDate('17/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: parseDate('03/07/2025'), situacao: 'DENTRO DO PRAZO' },
    { id: 'cx-7', sedeId: 'PJF', responsavel: 'RAFAEL', local: 'PÁTIO (ENTRADA)', numCelulas: 1, capacidade: '15.200', previsaoLimpeza1_2025: '', dataLimpeza1: parseDate('04/04/2025'), previsaoLimpeza2_2025: parseDate('01/10/2025'), dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
    { id: 'cx-8', sedeId: 'PNV', responsavel: 'HÉRIC', local: 'PÁTIO (TÉRREO)', numCelulas: 2, capacidade: '31.200', previsaoLimpeza1_2025: parseDate('26/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: parseDate('23/07/2025'), situacao: 'DENTRO DO PRAZO' },
    { id: 'cx-9', sedeId: 'PQL1', responsavel: 'RAFAEL', local: 'ENTRADA (AV. HUMB. MONTE)', numCelulas: 1, capacidade: '78.500', previsaoLimpeza1_2025: parseDate('27/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
    { id: 'cx-10', sedeId: 'PQL2', responsavel: 'RAFAEL', local: 'PÁTIO (CANTINA)', numCelulas: 1, capacidade: '50.400', previsaoLimpeza1_2025: parseDate('18/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
    { id: 'cx-11', sedeId: 'PQL3', responsavel: 'NERISSA', local: 'SUBSOLO (CAPELA)', numCelulas: 2, capacidade: '68.000', previsaoLimpeza1_2025: '', dataLimpeza1: parseDate('23/01/2025'), previsaoLimpeza2_2025: parseDate('22/07/2025'), dataLimpeza2: '', situacao: 'DENTRO DO PRAZO' },
    { id: 'cx-12', sedeId: 'SUL2', responsavel: 'LARISSA', local: 'SUBSOLO', numCelulas: 2, capacidade: '105.000', previsaoLimpeza1_2025: parseDate('23/06/2025'), dataLimpeza1: '', previsaoLimpeza2_2025: '', dataLimpeza2: parseDate('26/07/2025'), situacao: 'DENTRO DO PRAZO' }
];

// --- HELPER: SMART FILTERING ---
const filterByScope = <T extends { sedeId: string }>(data: T[], user: User): T[] => {
  if (user.role === UserRole.ADMIN) return data;
  const userSedes = user.sedeIds || [];
  return data.filter(item => {
      const itemSede = item.sedeId ? item.sedeId.toUpperCase() : '';
      if (!itemSede) return false;
      if (userSedes.includes(itemSede)) return true;
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
  
  getAllCertificados: (): HydroCertificado[] => { // For Analytics
    const stored = localStorage.getItem(KEYS.CERT);
    return stored ? JSON.parse(stored) : mockCertificados;
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
  getAllFiltros: (): HydroFiltro[] => { // For Analytics
    const stored = localStorage.getItem(KEYS.FILTRO);
    return stored ? JSON.parse(stored) : mockFiltros;
  },
  saveFiltro: (item: HydroFiltro) => {
    const stored = localStorage.getItem(KEYS.FILTRO);
    const data: HydroFiltro[] = stored ? JSON.parse(stored) : mockFiltros;
    const index = data.findIndex(d => d.id === item.id);
    if (index >= 0) data[index] = item;
    else data.push(item);
    localStorage.setItem(KEYS.FILTRO, JSON.stringify(data));
  },
  deleteFiltro: (id: string) => {
    const stored = localStorage.getItem(KEYS.FILTRO);
    const data: HydroFiltro[] = stored ? JSON.parse(stored) : mockFiltros;
    const filtered = data.filter(d => d.id !== id);
    localStorage.setItem(KEYS.FILTRO, JSON.stringify(filtered));
  },

  // Reservatórios
  getPocos: (user: User): HydroPoco[] => {
    const stored = localStorage.getItem(KEYS.POCO);
    const data = stored ? JSON.parse(stored) : mockPocos;
    return filterByScope(data, user);
  },
  getAllPocos: (): HydroPoco[] => {
    const stored = localStorage.getItem(KEYS.POCO);
    return stored ? JSON.parse(stored) : mockPocos;
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