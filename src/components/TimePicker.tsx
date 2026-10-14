import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { parseTimeInput } from '../core/validation';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function triple<T>(arr: T[]): T[] {
  return [...arr, ...arr, ...arr];
}

interface TimePickerProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  const [h, m] = value ? value.split(':') : ['', ''];

  // Синхронизация с внешним value через "adjusting state during render".
  if (value !== lastValue) {
    setLastValue(value);
    setInputText(value);
  }

  useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const center = (el: HTMLDivElement | null, idx: number, total: number) => {
      if (!el) return;
      const item = el.children[idx + total] as HTMLElement | undefined;
      if (item) {
        el.scrollTop =
          item.offsetTop - el.clientHeight / 2 + item.clientHeight / 2;
      }
    };
    center(hoursRef.current, h ? Number(h) : 0, HOURS.length);
    center(minutesRef.current, m ? Number(m) : 0, MINUTES.length);
  }, [isOpen, h, m]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const commitInput = () => {
    const parsed = parseTimeInput(inputText);
    if (parsed) {
      onChange(parsed);
    } else {
      setInputText(value);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitInput();
      setIsOpen(false);
    }
  };

  const handleInputClick = () => {
    if (disabled) return;
    setIsOpen((v) => !v);
  };

  const handleHourPick = (hour: string) => {
    const minute = m || '00';
    onChange(`${hour}:${minute}`);
  };

  const handleMinutePick = (minute: string) => {
    const hour = h || '00';
    onChange(`${hour}:${minute}`);
    setIsOpen(false);
  };

  const handleScroll = (el: HTMLDivElement | null, total: number) => {
    if (!el) return;
    const item = el.children[0] as HTMLElement | undefined;
    if (!item) return;
    const itemHeight = item.offsetHeight;
    const middleTop = itemHeight * total;
    const middleBottom = itemHeight * total * 2;
    if (el.scrollTop < middleTop - itemHeight) {
      el.scrollTop += itemHeight * total;
    } else if (el.scrollTop >= middleBottom) {
      el.scrollTop -= itemHeight * total;
    }
  };

  return (
    <div className="add__time-wrap" ref={rootRef}>
      <input
        className="add__time"
        type="text"
        placeholder="ЧЧ:ММ"
        inputMode="numeric"
        value={inputText}
        disabled={disabled}
        onChange={handleInputChange}
        onBlur={commitInput}
        onKeyDown={handleInputKeyDown}
        onClick={handleInputClick}
      />

      {isOpen && !disabled && (
        <div className="add__time-list open">
          <div
            className="add__time-column add__time-column--hours"
            ref={hoursRef}
            onScroll={() => handleScroll(hoursRef.current, HOURS.length)}
          >
            {triple(HOURS).map((hour, i) => (
              <button
                key={i}
                className="add__time-item"
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleHourPick(hour);
                }}
              >
                {hour}
              </button>
            ))}
          </div>
          <div
            className="add__time-column add__time-column--minutes"
            ref={minutesRef}
            onScroll={() => handleScroll(minutesRef.current, MINUTES.length)}
          >
            {triple(MINUTES).map((minute, i) => (
              <button
                key={i}
                className="add__time-item"
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleMinutePick(minute);
                }}
              >
                {minute}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}