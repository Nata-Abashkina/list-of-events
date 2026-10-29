import type { ValidationResult } from './types';
import { compareISO, timeToMinutes, todayISO, fromISODate, toISODate } from './dateUtils';

const ok: ValidationResult = { valid: true };
const fail = (error: string): ValidationResult => ({ valid: false, error });

export function validateTitle(title: string): ValidationResult {
  if (title.trim().length === 0) {
    return fail('Название не может быть пустым');
  }
  return ok;
}

function isRealDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = fromISODate(iso);
  if (Number.isNaN(d.getTime())) return false;
  return toISODate(d) === iso;
}

function isRealTime(t: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function validateDate(date: string): ValidationResult {
  if (!date) {
    return fail('Укажите дату');
  }
  if (!isRealDate(date)) {
    return fail('Несуществующая дата');
  }
  if (compareISO(date, todayISO()) < 0) {
    return fail('Дата не может быть в прошлом');
  }
  return ok;
}

export interface ValidateTimeOptions {
  allowPastIfUnchanged?: string;
  originalDate?: string;
}

export function validateTime(
  time: string | undefined,
  date: string,
  allDay: boolean,
  options?: ValidateTimeOptions,
): ValidationResult {
  if (allDay) return ok;

  if (!time) {
    return fail('Укажите время или отметьте «Весь день»');
  }

  if (!isRealTime(time)) {
    return fail('Несуществующее время');
  }

  if (date !== todayISO()) return ok;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (timeToMinutes(time) < nowMinutes) {
    const unchangedToday =
      options?.originalDate === date &&
      options?.allowPastIfUnchanged !== undefined &&
      options.allowPastIfUnchanged === time;
    if (unchangedToday) return ok;
    return fail('Время не может быть в прошлом');
  }

  return ok;
}

export function parseTimeInput(raw: string): string | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}