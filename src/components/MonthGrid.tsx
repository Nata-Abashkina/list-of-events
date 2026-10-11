import type { MonthConfig } from '../core/types';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface MonthGridProps {
  config: MonthConfig;
  selectedDate?: string | null;
  onDayClick?: (iso: string) => void;
  disabledBefore?: string;
}

export function MonthGrid({ config, selectedDate, onDayClick, disabledBefore }: MonthGridProps) {
  return (
    <div className="calendar__grid">
      {WEEKDAYS.map((label, i) => (
        <p
          key={label}
          className={i >= 5 ? 'calendar__day-week weekend' : 'calendar__day-week'}
        >
          {label}
        </p>
      ))}

      {config.matrix.map((cell, i) => {
        if (cell.isEmpty) {
          return <span key={i} className="calendar__day calendar__day--empty" />;
        }

        const classes = ['calendar__day'];
        if (cell.isFirstOfMonth) classes.push('calendar__day--first');
        if (cell.isWeekend) classes.push('weekend');
        if (cell.isToday) classes.push('today');
        if (cell.date === selectedDate) classes.push('selected');
        if (disabledBefore && cell.date && cell.date < disabledBefore) {
          classes.push('is-disabled');
        }

        return (
          <span
            key={cell.date}
            className={classes.join(' ')}
            onClick={() => {
              if (cell.date && onDayClick) onDayClick(cell.date);
            }}
          >
            {cell.day}
          </span>
        );
      })}
    </div>
  );
}