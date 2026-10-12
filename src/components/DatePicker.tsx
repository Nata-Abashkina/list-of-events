import { useEffect, useState } from 'react';
import type { MonthConfig } from '../core/types';
import { buildMonthConfig, fromISODate, todayISO } from '../core/dateUtils';
import { MonthGrid } from './MonthGrid';

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const YEARS_WINDOW = 12;

interface DatePickerProps {
  value: string;
  onChange: (iso: string) => void;
  onPick: () => void;
  min?: string;
}

type Mode = 'days' | 'months' | 'years';

export function DatePicker({ value, onChange, onPick, min }: DatePickerProps) {
  const initial = value ? fromISODate(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [mode, setMode] = useState<Mode>('days');

  useEffect(() => {
    if (!value) return;
    const d = fromISODate(value);
    if (Number.isNaN(d.getTime())) return;
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  const minDate = min ?? todayISO();

  const goPrev = () => {
    if (mode === 'days') {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear(viewYear - 1);
      } else {
        setViewMonth(viewMonth - 1);
      }
    } else if (mode === 'months') {
      setViewYear(viewYear - 1);
    } else {
      setViewYear(viewYear - YEARS_WINDOW);
    }
  };

  const goNext = () => {
    if (mode === 'days') {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear(viewYear + 1);
      } else {
        setViewMonth(viewMonth + 1);
      }
    } else if (mode === 'months') {
      setViewYear(viewYear + 1);
    } else {
      setViewYear(viewYear + YEARS_WINDOW);
    }
  };

  const handleDayClick = (iso: string) => {
    onChange(iso);
    onPick();
  };

  const handleMonthClick = (m: number) => {
    setViewMonth(m);
    setMode('days');
  };

  const handleYearClick = (y: number) => {
    setViewYear(y);
    setMode('months');
  };

  const config: MonthConfig = buildMonthConfig(viewYear, viewMonth);

  const title =
    mode === 'days'
      ? `${MONTH_NAMES[viewMonth]} ${viewYear}`
      : String(viewYear);

  const onTitleClick = () => {
    if (mode === 'days') setMode('months');
    else if (mode === 'months') setMode('years');
  };

  const yearsStart = viewYear - Math.floor(YEARS_WINDOW / 2);
  const years = Array.from({ length: YEARS_WINDOW }, (_, i) => yearsStart + i);

  return (
    <div className="modal__calendar open">
      <div className="modal__navigation">
        <button className="navigation__prev" type="button" onClick={goPrev}>
          <img className="navigation__button" src="/svg/prev.svg" alt="Назад" />
        </button>
        <button className="navigation__title" type="button" onClick={onTitleClick}>
          {title}
        </button>
        <button className="navigation__next" type="button" onClick={goNext}>
          <img className="navigation__button" src="/svg/next.svg" alt="Вперёд" />
        </button>
      </div>

      {mode === 'days' && (
        <MonthGrid
          config={config}
          selectedDate={value || null}
          onDayClick={handleDayClick}
          disabledBefore={minDate}
        />
      )}

      {mode === 'months' && (
        <div className="modal__months">
          {MONTH_NAMES.map((name, i) => (
            <button
              key={name}
              className="modal__month-item"
              type="button"
              onClick={() => handleMonthClick(i)}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {mode === 'years' && (
        <div className="modal__years">
          {years.map((y) => (
            <button
              key={y}
              className="modal__year-item"
              type="button"
              onClick={() => handleYearClick(y)}
            >
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}