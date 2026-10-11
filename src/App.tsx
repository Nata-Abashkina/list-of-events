import { useState } from 'react';
import { todayISO } from './core/dateUtils';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Calendar } from './components/Calendar';

export function App() {
  const [version, setVersion] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());

  const refresh = () => setVersion((v) => v + 1);

  void version;
  void refresh;

  return (
    <>
      <Header onAddClick={() => {}} onThemeToggle={() => {}} />
      <main className="main">
        <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <section className="events" />
      </main>
      <Footer />
    </>
  );
}