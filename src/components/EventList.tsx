// EventList.tsx
import { getEventsByDate } from '../core/eventStore';

interface EventListProps {
  selectedDate: string;
  version: number;
  pendingDelete: string | null;
  onDelete: (id: string) => void;
}

function formatDisplayDate(iso: string): string {
  return iso.split('-').reverse().join('.');
}

export function EventList({ selectedDate, version, pendingDelete, onDelete }: EventListProps) {
  void version;
  const events = getEventsByDate(selectedDate);

  return (
    <section className="events">
      <ul className="events__list">
        {events.map((event) => {
          if (event.id === pendingDelete) return null;
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
                <button className="events__button-edit" type="button">
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
        })}
      </ul>
    </section>
  );
}