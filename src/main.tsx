import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/style.scss';
import { App } from './App';
import { loadEvents } from './core/eventStore';
import { applyTheme, resolveInitialTheme } from './core/theme';

loadEvents();
applyTheme(document.documentElement, resolveInitialTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);