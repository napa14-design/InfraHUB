const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const startOfDay = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const parseISODate = (dateStr?: string) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
};

export const formatDateBR = (dateStr?: string) => {
  const date = parseISODate(dateStr);
  if (!date) return '--/--/--';
  return date.toLocaleDateString('pt-BR');
};

export const diffDaysFromToday = (dateStr?: string) => {
  const target = parseISODate(dateStr);
  if (!target) return 999;
  const today = startOfDay();
  return Math.ceil((target.getTime() - today.getTime()) / MS_PER_DAY);
};

export const diffDaysBetween = (from?: string, to?: string) => {
  const start = parseISODate(from);
  const end = parseISODate(to);
  if (!start || !end) return null;
  return Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY);
};

export const isOnOrBefore = (dateStr?: string, compareTo?: string) => {
  const left = parseISODate(dateStr);
  const right = parseISODate(compareTo);
  if (!left || !right) return false;
  return left.getTime() <= right.getTime();
};

export const isBeforeToday = (dateStr?: string) => {
  const target = parseISODate(dateStr);
  if (!target) return false;
  return target.getTime() < startOfDay().getTime();
};

export const addDays = (dateStr: string, days: number) => {
  const base = parseISODate(dateStr) || startOfDay();
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next.toISOString().split('T')[0];
};

export const firstDayOfMonthISO = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];

export const lastDayOfMonthISO = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
