import type { EventItem, EventsStorage } from './types';
import { compareISO, timeToMinutes } from './dateUtils';

const STORAGE_KEY = 'list-of-events:events';
const STORAGE_VERSION = 1;

let events: EventItem[] = [];
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): EventItem[] {
  return events;
}

export function loadEvents(): EventItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      events = [];
    } else {
      const parsed = JSON.parse(raw) as EventsStorage;
      events = parsed && Array.isArray(parsed.events) ? parsed.events : [];
    }
  } catch {
    events = [];
  }
  notify();
  return events;
}

export function persistEvents(): void {
  try {
    const payload: EventsStorage = { version: STORAGE_VERSION, events };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // тихий фолбэк
  }
}

export function getEvents(): EventItem[] {
  return events;
}

export function getEventsByDate(date: string): EventItem[] {
  return sortEvents(events.filter((e) => e.date === date));
}

export function addEvent(input: Omit<EventItem, 'id'>): EventItem {
  const event: EventItem = { id: makeId(), ...input };
  events = [...events, event];
  persistEvents();
  notify();
  return event;
}

export function updateEvent(id: string, patch: Partial<Omit<EventItem, 'id'>>): EventItem | null {
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;
  const updated: EventItem = { ...events[index], ...patch, id };
  events = events.map((e, i) => (i === index ? updated : e));
  persistEvents();
  notify();
  return updated;
}

export function removeEvent(id: string): boolean {
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return false;
  events = events.filter((e) => e.id !== id);
  persistEvents();
  notify();
  return true;
}

export function sortEvents(list: EventItem[]): EventItem[] {
  return list
    .map((e, i) => ({ e, i }))
    .sort((a, b) => {
      const byDate = compareISO(a.e.date, b.e.date);
      if (byDate !== 0) return byDate;
      const ta = a.e.time ? timeToMinutes(a.e.time) : 0;
      const tb = b.e.time ? timeToMinutes(b.e.time) : 0;
      if (ta !== tb) return ta - tb;
      return a.i - b.i;
    })
    .map((x) => x.e);
}