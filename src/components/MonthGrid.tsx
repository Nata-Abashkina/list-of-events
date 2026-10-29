import type { MonthConfig } from '../core/types';
import { compareISO } from '../core/dateUtils';

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

        const isDisabled =
          !!disabledBefore && !!cell.date && compareISO(cell.date, disabledBefore) < 0;

        const classes = ['calendar__day'];
        if (cell.isFirstOfMonth) classes.push('calendar__day--first');
        if (cell.isWeekend) classes.push('weekend');
        if (cell.isToday) classes.push('today');
        if (cell.date === selectedDate) classes.push('selected');
        if (isDisabled) classes.push('is-disabled');

        return (
          <span
            key={cell.date}
            className={classes.join(' ')}
            aria-disabled={isDisabled || undefined}
            onClick={
              isDisabled || !cell.date || !onDayClick
                ? undefined
                : () => onDayClick(cell.date as string)
            }
          >
            {cell.day}
          </span>
        );
      })}
    </div>
  );
}