import { useEffect, useRef, useState } from 'react';
import type { Event } from '../core/types';
import { validateDate, validateTime, validateTitle } from '../core/validation';
import { todayISO } from '../core/dateUtils';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';

interface EventFormProps {
  editingEvent: Event | null;
  initialDate: string;
  onSubmit: (data: { title: string; date: string; time?: string }) => void;
  onCancel: () => void;
}

function isoToDisplay(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function displayToISO(display: string): string {
  const parts = display.split('.');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts;
  if (d.length !== 2 || m.length !== 2 || y.length !== 4) return '';
  return `${y}-${m}-${d}`;
}

export function EventForm({ editingEvent, initialDate, onSubmit, onCancel }: EventFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dateWrapRef = useRef<HTMLDivElement>(null);

  const [dateDisplay, setDateDisplay] = useState<string>(
    editingEvent ? isoToDisplay(editingEvent.date) : isoToDisplay(initialDate),
  );
  const [time, setTime] = useState<string>(editingEvent?.time ?? '');
  const [title, setTitle] = useState<string>(editingEvent?.title ?? '');
  const [allDay, setAllDay] = useState<boolean>(
    editingEvent ? editingEvent.time === undefined : false,
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [dateError, setDateError] = useState<string>('');
  const [timeError, setTimeError] = useState<string>('');
  const [titleError, setTitleError] = useState<string>('');

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    if (!isCalendarOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (dateWrapRef.current && !dateWrapRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isCalendarOpen]);

  const handleAllDayChange = (checked: boolean) => {
    setAllDay(checked);
    if (checked) {
      setTime('');
      setTimeError('');
    }
  };

  const handleSubmit = () => {
    setDateError('');
    setTimeError('');
    setTitleError('');

    const isoDate = displayToISO(dateDisplay);

    const dateResult = validateDate(isoDate);
    if (!dateResult.valid) {
      setDateError(dateResult.error);
      return;
    }

    const timeValue = allDay ? undefined : time;

    const timeResult = validateTime(timeValue, isoDate, allDay, {
      originalDate: editingEvent?.date,
      allowPastIfUnchanged: editingEvent?.time,
    });
    if (!timeResult.valid) {
      setTimeError(timeResult.error);
      return;
    }

    const titleResult = validateTitle(title);
    if (!titleResult.valid) {
      setTitleError(titleResult.error);
      return;
    }

    onSubmit({
      title: title.trim(),
      date: isoDate,
      time: timeValue,
    });
  };

  const isoValue = displayToISO(dateDisplay) || initialDate;

  return (
    <dialog className="add modal" ref={dialogRef} onCancel={onCancel}>
      <h3 className="modal__title">
        {editingEvent ? 'Редактировать мероприятие' : 'Добавить мероприятие'}
      </h3>
      <form className="modal__form" onSubmit={(e) => e.preventDefault()}>
        <div className="form__input" ref={dateWrapRef}>
          <p className="input__title">Выберите день</p>
          <input
            className="add__date"
            type="text"
            placeholder="ДД.ММ.ГГГГ"
            inputMode="numeric"
            value={dateDisplay}
            onChange={(e) => setDateDisplay(e.target.value)}
            onClick={() => setIsCalendarOpen(true)}
          />
          {isCalendarOpen && (
            <DatePicker
              value={isoValue}
              onChange={(iso) => setDateDisplay(isoToDisplay(iso))}
              onPick={() => setIsCalendarOpen(false)}
              min={todayISO()}
            />
          )}
          <p className="modal__error" hidden={!dateError}>{dateError}</p>
        </div>

        <div className="form__input">
          <p className="input__title">Выберите время</p>
          <TimePicker value={time} onChange={setTime} disabled={allDay} />
          <label className="add__allday">
            <input
              className="add__allday-input"
              type="checkbox"
              checked={allDay}
              onChange={(e) => handleAllDayChange(e.target.checked)}
            />
            <span className="add__allday-box">
              <img className="add__allday-icon" src="/svg/check.svg" alt="" />
            </span>
            <span className="add__allday-text">Весь день</span>
          </label>
          <p className="modal__error" hidden={!timeError}>{timeError}</p>
        </div>

        <div className="form__input">
          <p className="input__title">Название</p>
          <input
            className="add__text"
            type="text"
            placeholder="Название"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className="modal__error" hidden={!titleError}>{titleError}</p>
        </div>

        <div className="modal__buttons">
          <button className="modal__button cancel" type="button" onClick={onCancel}>
            Отменить
          </button>
          <button className="modal__button save" type="button" onClick={handleSubmit}>
            Сохранить
          </button>
        </div>
      </form>
    </dialog>
  );
}