import { useState, useCallback } from 'react';
import { todayISO } from './core/dateUtils';
import { removeEvent, addEvent, updateEvent, getEvents } from './core/eventStore';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Calendar } from './components/Calendar';
import { EventList } from './components/EventList';
import { Undo } from './components/Undo';
import { EventForm } from './components/EventForm';

export function App() {
  const [version, setVersion] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const handleDelete = (id: string) => {
    if (pendingDelete && pendingDelete !== id) {
      removeEvent(pendingDelete);
    }
    setPendingDelete(id);
  };

  const handleUndo = () => {
    setPendingDelete(null);
  };

  const handleExpire = () => {
    if (pendingDelete) {
      removeEvent(pendingDelete);
      setPendingDelete(null);
      refresh();
    }
  };

  const handleAddClick = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (id: string) => {
    setEditingId(id);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (data: { title: string; date: string; time?: string }) => {
    if (editingId) {
      updateEvent(editingId, data);
    } else {
      addEvent(data);
    }
    setIsModalOpen(false);
    setEditingId(null);
    refresh();
  };

  const editingEvent = editingId
    ? getEvents().find((e) => e.id === editingId) ?? null
    : null;

  return (
    <>
      <Header onAddClick={handleAddClick} onThemeToggle={() => {}} />
      <main className="main">
        <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <EventList
          selectedDate={selectedDate}
          version={version}
          pendingDelete={pendingDelete}
          onDelete={handleDelete}
          onEdit={handleEditClick}
        />
      </main>
      <Footer />
      {pendingDelete && (
        <Undo key={pendingDelete} onUndo={handleUndo} onExpire={handleExpire} />
      )}
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