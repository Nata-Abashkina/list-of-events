import { useState, useCallback, useSyncExternalStore } from 'react';
import { todayISO } from './core/dateUtils';
import {
  removeEvent,
  addEvent,
  updateEvent,
  subscribe,
  getSnapshot,
} from './core/eventStore';
import { resolveInitialTheme, saveTheme, applyTheme } from './core/theme';
import type { Theme } from './core/types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Calendar } from './components/Calendar';
import { EventList } from './components/EventList';
import { Undo } from './components/Undo';
import { EventForm } from './components/EventForm';

export function App() {
  const events = useSyncExternalStore(subscribe, getSnapshot);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => resolveInitialTheme());

  const handleThemeToggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      saveTheme(next);
      applyTheme(document.documentElement, next);
      return next;
    });
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (pendingDelete && pendingDelete !== id) removeEvent(pendingDelete);
      setPendingDelete(id);
    },
    [pendingDelete],
  );

  const handleUndo = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const handleExpire = useCallback((id: string) => {
    removeEvent(id);
    setPendingDelete(null);
  }, []);

  const handleAddClick = useCallback(() => {
    setEditingId(null);
    setIsModalOpen(true);
  }, []);

  const handleEditClick = useCallback((id: string) => {
    setEditingId(id);
    setIsModalOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsModalOpen(false);
    setEditingId(null);
  }, []);

  const handleSubmit = useCallback(
    (data: { title: string; date: string; time?: string }) => {
      if (editingId) {
        updateEvent(editingId, data);
      } else {
        addEvent(data);
      }
      setIsModalOpen(false);
      setEditingId(null);
    },
    [editingId],
  );

  const editingEvent = editingId
    ? events.find((e) => e.id === editingId) ?? null
    : null;

  return (
    <>
      <Header
        onAddClick={handleAddClick}
        onThemeToggle={handleThemeToggle}
        theme={theme}
      />
      <main className="main">
        <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <EventList
          selectedDate={selectedDate}
          events={events}
          pendingDelete={pendingDelete}
          onDelete={handleDelete}
          onEdit={handleEditClick}
        />
      </main>
      <Footer />
      <Undo
        hidden={!pendingDelete}
        pendingId={pendingDelete}
        onUndo={handleUndo}
        onExpire={handleExpire}
      />
      {isModalOpen && (
        <EventForm
          editingEvent={editingEvent}
          initialDate={selectedDate}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}