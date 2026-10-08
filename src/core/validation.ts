import type { Event, ValidationResult, EventFormMode } from './types';
import { compareISO, timeToMinutes, todayISO } from './dateUtils';

const ok: ValidationResult = { valid: true };
const fail = (error: string): ValidationResult => ({ valid: false, error });

export function validateTitle(title: string): ValidationResult {
  if (title.trim().length === 0) {
    return fail('Название не может быть пустым');
  }
  return ok;
}

export function validateDate(date: string): ValidationResult {
  if (!date) {
    return fail('Укажите дату');
  }
  if (compareISO(date, todayISO()) < 0) {
    return fail('Дата не может быть в прошлом');
  }
  return ok;
}

export function validateTime(time: string | undefined, date: string): ValidationResult {
  if (!time) return ok;
  if (date !== todayISO()) return ok;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (timeToMinutes(time) < nowMinutes) {
    return fail('Время не может быть в прошлом');
  }
  return ok;
}

export function validateEvent(
  input: Pick<Event, 'title' | 'date' | 'time'>,
  _mode: EventFormMode,
): ValidationResult {
  const t = validateTitle(input.title);
  if (!t.valid) return t;

  const d = validateDate(input.date);
  if (!d.valid) return d;

  const tm = validateTime(input.time, input.date);
  if (!tm.valid) return tm;

  return ok;
}