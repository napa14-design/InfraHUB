import {
  HydroCertificado,
  HydroCloroEntry,
  HydroFiltro,
  HydroReservatorio,
  HydroSettings,
} from '../types';
import { diffDaysFromToday, isBeforeToday, parseISODate } from '../utils/dateUtils';

export type HydroCriticalKind = 'CERTIFICADO' | 'FILTRO' | 'RESERVATORIO';

export interface HydroCriticalItem {
  id: string;
  kind: HydroCriticalKind;
  label: string;
  sedeId: string;
  local: string;
  dueDate: string;
  days: number;
  modulePath: string;
}

export interface HydroKpiSnapshot {
  certificadosVencidos: number;
  filtrosVencidos: number;
  reservatoriosAtrasados: number;
  limpezasProximas: number;
  conformidade: number;
  cloroTotal: number;
  totalAssets: number;
  expiredCount: number;
  warningCount: number;
  healthScore: number;
  criticalItems: HydroCriticalItem[];
}

export interface HydroKpiInput {
  certificados: HydroCertificado[];
  filtros: HydroFiltro[];
  cloro: HydroCloroEntry[];
  reservatorios: HydroReservatorio[];
  settings: HydroSettings;
  sedeId?: string;
  periodStartISO?: string;
  periodEndISO?: string;
}

const dateValue = (value?: string) => parseISODate(value)?.getTime() ?? 0;

const latestCertificados = (certificados: HydroCertificado[]) =>
  Array.from(
    certificados
      .reduce((map, item) => {
        const key = `${item.sedeId}-${item.parceiro}`;
        const current = map.get(key);
        if (!current || dateValue(item.validade) > dateValue(current.validade)) {
          map.set(key, item);
        }
        return map;
      }, new Map<string, HydroCertificado>())
      .values(),
  );

const latestFiltros = (filtros: HydroFiltro[]) =>
  Array.from(
    filtros
      .reduce((map, item) => {
        const key = `${item.sedeId}-${item.patrimonio}`;
        const current = map.get(key);
        if (!current || dateValue(item.dataTroca) > dateValue(current.dataTroca)) {
          map.set(key, item);
        }
        return map;
      }, new Map<string, HydroFiltro>())
      .values(),
  );

const withSedeInPath = (path: string, sedeId?: string) => {
  if (!sedeId) return path;
  const [basePath, queryString] = path.split('?');
  const params = new URLSearchParams(queryString || '');
  params.set('sede', sedeId);
  return `${basePath}?${params.toString()}`;
};

const buildCriticalItems = (
  certificados: HydroCertificado[],
  filtros: HydroFiltro[],
  reservatorios: HydroReservatorio[],
): HydroCriticalItem[] => {
  const criticalItems: HydroCriticalItem[] = [];

  certificados.forEach((item) => {
    const days = diffDaysFromToday(item.validade);
    if (!Number.isFinite(days) || days > 30) return;

    criticalItems.push({
      id: item.id,
      kind: 'CERTIFICADO',
      label: 'Certificado',
      sedeId: item.sedeId,
      local: item.parceiro,
      dueDate: item.validade,
      days,
      modulePath: withSedeInPath(
        `/module/hydrosys/certificados?status=${days < 0 ? 'VENCIDO' : 'PROXIMO'}`,
        item.sedeId,
      ),
    });
  });

  filtros.forEach((item) => {
    const days = diffDaysFromToday(item.proximaTroca);
    if (!Number.isFinite(days) || days > 15) return;

    criticalItems.push({
      id: item.id,
      kind: 'FILTRO',
      label: 'Filtro',
      sedeId: item.sedeId,
      local: `${item.local} (${item.patrimonio})`,
      dueDate: item.proximaTroca,
      days,
      modulePath: withSedeInPath(
        `/module/hydrosys/filtros?status=${days < 0 ? 'VENCIDO' : 'PROXIMO'}`,
        item.sedeId,
      ),
    });
  });

  reservatorios.forEach((item) => {
    const days = diffDaysFromToday(item.proximaLimpeza);
    if (!Number.isFinite(days) || days > 30) return;

    const labelByType: Record<string, string> = {
      POCO: 'Poço',
      CISTERNA: 'Cisterna',
      CAIXA: "Caixa d'água",
    };

    criticalItems.push({
      id: item.id,
      kind: 'RESERVATORIO',
      label: labelByType[item.tipo] || 'Reservatório',
      sedeId: item.sedeId,
      local: item.local,
      dueDate: item.proximaLimpeza,
      days,
      modulePath: withSedeInPath(
        `/module/hydrosys/reservatorios?situacao=${days < 0 ? 'ATRASADO' : 'PROXIMO_30D'}`,
        item.sedeId,
      ),
    });
  });

  return criticalItems.sort((a, b) => a.days - b.days);
};

export const hydroKpiService = {
  buildSnapshot: ({
    certificados,
    filtros,
    cloro,
    reservatorios,
    settings,
    sedeId,
    periodStartISO,
    periodEndISO,
  }: HydroKpiInput): HydroKpiSnapshot => {
    const scopedCertificados = sedeId
      ? certificados.filter((item) => item.sedeId === sedeId)
      : certificados;
    const scopedFiltros = sedeId ? filtros.filter((item) => item.sedeId === sedeId) : filtros;
    const scopedCloro = sedeId ? cloro.filter((item) => item.sedeId === sedeId) : cloro;
    const scopedReservatorios = sedeId
      ? reservatorios.filter((item) => item.sedeId === sedeId)
      : reservatorios;

    const uniqueCertificados = latestCertificados(scopedCertificados);
    const uniqueFiltros = latestFiltros(scopedFiltros);
    const reservatoriosAtivos = scopedReservatorios.filter(
      (item) => item.situacaoLimpeza !== 'DESATIVADO',
    );

    const certificadosVencidos = uniqueCertificados.filter((item) => {
      const diff = diffDaysFromToday(item.validade);
      return Number.isFinite(diff) && diff < 0;
    }).length;

    const filtrosVencidos = uniqueFiltros.filter(
      (item) => item.proximaTroca && isBeforeToday(item.proximaTroca),
    ).length;

    const reservatoriosAtrasados = reservatoriosAtivos.filter(
      (item) => item.proximaLimpeza && isBeforeToday(item.proximaLimpeza),
    ).length;

    const limpezasProximas = reservatoriosAtivos.filter((item) => {
      const diff = diffDaysFromToday(item.proximaLimpeza);
      return Number.isFinite(diff) && diff >= 0 && diff <= 30;
    }).length;

    const cloroPeriodo = scopedCloro.filter((item) => {
      if (periodStartISO && item.date < periodStartISO) return false;
      if (periodEndISO && item.date > periodEndISO) return false;
      return true;
    });

    const cloroValidos = cloroPeriodo.filter(
      (item) => Number.isFinite(Number(item.cl)) && Number.isFinite(Number(item.ph)),
    );

    const cloroConforme = cloroValidos.filter((item) => {
      const cl = Number(item.cl);
      const ph = Number(item.ph);
      return (
        cl >= settings.cloroMin &&
        cl <= settings.cloroMax &&
        ph >= settings.phMin &&
        ph <= settings.phMax
      );
    }).length;

    const conformidade =
      cloroValidos.length > 0 ? Math.round((cloroConforme / cloroValidos.length) * 100) : 0;

    const criticalItems = buildCriticalItems(uniqueCertificados, uniqueFiltros, reservatoriosAtivos);

    const totalAssets = uniqueCertificados.length + uniqueFiltros.length + reservatoriosAtivos.length;
    const expiredCount = criticalItems.filter((item) => item.days < 0).length;
    const warningCount = criticalItems.filter((item) => item.days >= 0).length;

    const healthScore = Math.round(
      Math.max(
        0,
        100 -
          (totalAssets > 0
            ? ((expiredCount * 10 + warningCount * 2) / totalAssets) * 20
            : 0),
      ),
    );

    return {
      certificadosVencidos,
      filtrosVencidos,
      reservatoriosAtrasados,
      limpezasProximas,
      conformidade,
      cloroTotal: cloroValidos.length,
      totalAssets,
      expiredCount,
      warningCount,
      healthScore,
      criticalItems,
    };
  },
};
