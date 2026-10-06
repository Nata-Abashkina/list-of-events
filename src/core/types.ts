// src/core/types.ts

export interface Event {
  id: string;
  title: string;
  date: string;       // YYYY-MM-DD
  time?: string;      // HH:mm, нет — значит весь день
}

export interface EventsStorage {
  version: number;
  events: Event[];
}

export interface CalendarCell {
  date: string | null;
  day: number | null;
  month: number | null;
  year: number | null;
  isToday: boolean;
  isWeekend: boolean;
  isOutside: boolean;
  isEmpty: boolean;
  isFirstOfMonth: boolean;
}

export interface MonthConfig {
  year: number;
  month: number;
  label: string;
  matrix: CalendarCell[];
  isCurrent: boolean;
  isYearStart: boolean;   // год в label только у января
}

export type Theme = 'light' | 'dark';

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export type EventFormMode =
  | { mode: 'add'; initialDate?: string }
  | { mode: 'edit'; event: Event };