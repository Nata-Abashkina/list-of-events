import { useState } from 'react';
import type { MonthConfig } from '../core/types';
import {
  buildMonthConfig,
  compareISO,
  daysInMonth,
  fromISODate,
  todayISO,
  toISODate,
  MONTH_NAMES,
} from '../core/dateUtils';
import { MonthGrid } from './MonthGrid';

const YEARS_WINDOW = 12;

interface DatePickerProps {
  value: string;
  onChange: (iso: string) => void;
  onPick: () => void;
  min?: string;
}

type Mode = 'days' | 'months' | 'years';

function lastDayOfMonthISO(year: number, month: number): string {
  return toISODate(new Date(year, month, daysInMonth(year, month)));
}

function lastDayOfYearISO(year: number): string {
  return `${year}-12-31`;
}

export function DatePicker({ value, onChange, onPick, min }: DatePickerProps) {
  const initial = value ? fromISODate(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [mode, setMode] = useState<Mode>('days');
  const [lastValue, setLastValue] = useState(value);

  if (value !== lastValue) {
    setLastValue(value);
    if (value) {
      const d = fromISODate(value);
      if (!Number.isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }

  const minDate = min ?? todayISO();

  const canGoPrev = (() => {
    if (mode === 'days') {
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      return compareISO(lastDayOfMonthISO(prevYear, prevMonth), minDate) >= 0;
    }
    if (mode === 'months') {
      return compareISO(lastDayOfYearISO(viewYear - 1), minDate) >= 0;
    }

    const prevWindowEnd = viewYear - 1;
    return compareISO(lastDayOfYearISO(prevWindowEnd), minDate) >= 0;
  })();

  const goPrev = () => {
    if (!canGoPrev) return;
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
    if (compareISO(iso, minDate) < 0) return;
    onChange(iso);
    onPick();
  };

  const handleMonthClick = (m: number) => {
    if (compareISO(lastDayOfMonthISO(viewYear, m), minDate) < 0) return;
    setViewMonth(m);
    setMode('days');
  };

  const handleYearClick = (y: number) => {
    if (compareISO(lastDayOfYearISO(y), minDate) < 0) return;
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
        <button
          className="navigation__prev"
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
        >
          <img className="navigation__button" src="/svg/prev.svg" alt="Назад" />
        </button>
        <button
          className="navigation__title"
          type="button"
          onClick={onTitleClick}
        >
          {title}
        </button>
        <button className="navigation__next" type="button" onClick={goNext}>
          <img
            className="navigation__button"
            src="/svg/next.svg"
            alt="Вперёд"
          />
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
          {MONTH_NAMES.map((name, i) => {
            const isDisabled =
              compareISO(lastDayOfMonthISO(viewYear, i), minDate) < 0;
            return (
              <button
                key={name}
                className={isDisabled ? 'modal__month-item is-disabled' : 'modal__month-item'}
                type="button"
                disabled={isDisabled}
                onClick={() => handleMonthClick(i)}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      {mode === 'years' && (
        <div className="modal__years">
          {years.map((y) => {
            const isDisabled = compareISO(lastDayOfYearISO(y), minDate) < 0;
            return (
              <button
                key={y}
                className={isDisabled ? 'modal__year-item is-disabled' : 'modal__year-item'}
                type="button"
                disabled={isDisabled}
                onClick={() => handleYearClick(y)}
              >
                {y}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}