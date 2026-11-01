import type { EventItem } from '../core/types';
import { compareISO, todayISO } from '../core/dateUtils';
import { sortEvents } from '../core/eventStore';

interface EventListProps {
  selectedDate: string;
  events: EventItem[];
  pendingDelete: string | null;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

function formatDisplayDate(iso: string): string {
  return iso.split('-').reverse().join('.');
}

export function EventList({ selectedDate, events, pendingDelete, onDelete, onEdit }: EventListProps) {
  const today = todayISO();
  const visibleEvents = sortEvents(
    events.filter((e) => e.date === selectedDate && e.id !== pendingDelete),
  );

  return (
    <section className="events">
      <ul className="events__list">
        {visibleEvents.length === 0 ? (
          <li className="events__empty">На этот день пока ничего не запланировано</li>
        ) : (
          visibleEvents.map((event) => {
            const isPast = compareISO(event.date, today) < 0;
            return (
              <li key={event.id} className="events__item">
                <p className="events__info">
                  <time className="events__date" dateTime={event.date}>
                    {formatDisplayDate(event.date)}
                  </time>
                  {event.time && (
                    <time className="events__time" dateTime={event.time}>
                      {event.time}
                    </time>
                  )}
                  {event.title}
                </p>
                <div className="events__button">
                  <button
                    className="events__button-edit"
                    type="button"
                    disabled={isPast}
                    onClick={() => onEdit(event.id)}
                  >
                    <img className="events__button-logo" src="/svg/edit.svg" alt="Редактировать" />
                  </button>
                  <button
                    className="events__button-delete"
                    type="button"
                    onClick={() => onDelete(event.id)}
                  >
                    <img className="events__button-logo" src="/svg/delete.svg" alt="Удалить" />
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}