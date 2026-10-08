import type { Theme } from './types';

const STORAGE_KEY = 'list-of-events:theme';

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark') return value;
  } catch {
    // тихий фолбэк
  }
  return null;
}

export function resolveInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function saveTheme(t: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch {
    // тихий фолбэк
  }
}

export function applyTheme(root: HTMLElement, t: Theme): void {
  root.setAttribute('data-theme', t);
}