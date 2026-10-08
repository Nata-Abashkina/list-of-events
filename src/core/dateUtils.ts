import type { CalendarCell, MonthConfig } from './types';

const MONTH_LABELS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const mm = month < 10 ? `0${month}` : `${month}`;
  const dd = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${mm}-${dd}`;
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y: number, m: number): number {
  const lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (m === 1 && isLeapYear(y)) return 29;
  return lengths[m];
}

export function firstWeekdayOfMonth(y: number, m: number): number {
  const jsDay = new Date(y, m, 1).getDay(); // 0 = Вс
  return (jsDay + 6) % 7;                    // 0 = Пн
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function compareISO(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function isWeekendDate(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function buildMonthMatrix(y: number, m: number): CalendarCell[] {
  const cells: CalendarCell[] = [];
  const today = todayISO();
  const total = daysInMonth(y, m);
  const offset = firstWeekdayOfMonth(y, m);

  for (let i = 0; i < offset; i++) {
    cells.push(emptyCell());
  }

  for (let day = 1; day <= total; day++) {
    const date = toISODate(new Date(y, m, day));
    const isWeekend = isWeekendDate(new Date(y, m, day));
    cells.push({
      date,
      day,
      month: m,
      year: y,
      isToday: date === today,
      isWeekend,
      isOutside: false,
      isEmpty: false,
      isFirstOfMonth: day === 1,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(emptyCell());
  }

  return cells;
}

function emptyCell(): CalendarCell {
  return {
    date: null,
    day: null,
    month: null,
    year: null,
    isToday: false,
    isWeekend: false,
    isOutside: false,
    isEmpty: true,
    isFirstOfMonth: false,
  };
}

export function buildMonthConfig(y: number, m: number): MonthConfig {
  const now = new Date();
  const isCurrent = now.getFullYear() === y && now.getMonth() === m;
  const label = m === 0 ? `${MONTH_LABELS[m]} ${y}` : MONTH_LABELS[m];
  return {
    year: y,
    month: m,
    label,
    matrix: buildMonthMatrix(y, m),
    isCurrent,
    isYearStart: m === 0,
  };
}

export function buildMonthsRange(
  centerY: number,
  centerM: number,
  back: number,
  forward: number,
): MonthConfig[] {
  const result: MonthConfig[] = [];
  for (let i = -back; i <= forward; i++) {
    const d = new Date(centerY, centerM + i, 1);
    result.push(buildMonthConfig(d.getFullYear(), d.getMonth()));
  }
  return result;
}