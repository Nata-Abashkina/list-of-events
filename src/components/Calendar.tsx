import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MonthConfig } from '../core/types';
import { buildMonthConfig } from '../core/dateUtils';
import { MonthGrid } from './MonthGrid';

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (iso: string) => void;
}

const INITIAL_BACK = 6;
const INITIAL_FORWARD = 6;
const LOAD_BACK = 3;
const LOAD_FORWARD = 3;
const ROOT_MARGIN = '300px 0px';

interface Anchor {
  key: string;
  offset: number;
}

function shiftMonth(year: number, month: number, delta: number) {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

function monthKey(year: number, month: number) {
  return `${year}-${month}`;
}

export function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
  const initialNowRef = useRef(new Date());
  const anchorRef = useRef<Anchor | null>(null);

  const [months, setMonths] = useState<MonthConfig[]>(() => {
    const now = initialNowRef.current;
    const list: MonthConfig[] = [];
    for (let i = -INITIAL_BACK; i <= INITIAL_FORWARD; i++) {
      const { year, month } = shiftMonth(now.getFullYear(), now.getMonth(), i);
      list.push(buildMonthConfig(year, month));
    }
    return list;
  });

  const isCurrentMonth = useCallback((config: MonthConfig) => {
    const now = initialNowRef.current;
    return config.year === now.getFullYear() && config.month === now.getMonth();
  }, []);

  const captureAnchor = useCallback(() => {
    if (anchorRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const monthEls = container.querySelectorAll<HTMLElement>('[data-month]');
    for (const el of monthEls) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > containerRect.top) {
        const key = el.dataset.month;
        if (!key) continue;
        anchorRef.current = { key, offset: rect.top - containerRect.top };
        return;
      }
    }
  }, []);

  const loadBack = useCallback(() => {
    captureAnchor();
    setMonths((prev) => {
      const first = prev[0];
      const older: MonthConfig[] = [];
      for (let i = LOAD_BACK; i >= 1; i--) {
        const { year, month } = shiftMonth(first.year, first.month, -i);
        older.push(buildMonthConfig(year, month));
      }
      const oldest = older[0];
      const exists = prev.some((m) => m.year === oldest.year && m.month === oldest.month);
      if (exists) return prev;
      return [...older, ...prev];
    });
  }, [captureAnchor]);

  const loadForward = useCallback(() => {
    setMonths((prev) => {
      const last = prev[prev.length - 1];
      const newer: MonthConfig[] = [];
      for (let i = 1; i <= LOAD_FORWARD; i++) {
        const { year, month } = shiftMonth(last.year, last.month, i);
        newer.push(buildMonthConfig(year, month));
      }
      const newest = newer[newer.length - 1];
      const exists = prev.some((m) => m.year === newest.year && m.month === newest.month);
      if (exists) return prev;
      return [...prev, ...newer];
    });
  }, []);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const container = containerRef.current;
    if (!anchor || !container) return;

    const el = container.querySelector<HTMLElement>(`[data-month="${anchor.key}"]`);
    if (el) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      container.scrollTop += elRect.top - containerRect.top - anchor.offset;
    }
    anchorRef.current = null;
  }, [months]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>('.calendar__month:not(.innactive)');
    if (!target) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    container.scrollTop += targetRect.top - containerRect.top;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const top = topSentinelRef.current;
    const bottom = bottomSentinelRef.current;
    if (!container || !top || !bottom) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (entry.target === top) loadBack();
          else if (entry.target === bottom) loadForward();
        }
      },
      { root: container, rootMargin: ROOT_MARGIN },
    );

    observer.observe(top);
    observer.observe(bottom);
    return () => observer.disconnect();
  }, [loadBack, loadForward]);

  return (
    <section className="calendar" ref={containerRef}>
      <div ref={topSentinelRef} aria-hidden="true" className="calendar__sentinel" />
      {months.map((config) => (
        <div
          key={monthKey(config.year, config.month)}
          data-month={monthKey(config.year, config.month)}
          className={isCurrentMonth(config) ? 'calendar__month' : 'calendar__month innactive'}
        >
          <h2 className="calendar__title">{config.label}</h2>
          <MonthGrid
            config={config}
            selectedDate={selectedDate}
            onDayClick={onSelectDate}
          />
        </div>
      ))}
      <div ref={bottomSentinelRef} aria-hidden="true" className="calendar__sentinel" />
    </section>
  );
}