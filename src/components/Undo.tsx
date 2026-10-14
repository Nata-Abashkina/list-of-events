import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface UndoProps {
  onUndo: () => void;
  onExpire: () => void;
  duration?: number;
  hidden?: boolean;
  pendingId?: string | null;
}

export function Undo({
  onUndo,
  onExpire,
  duration = 5000,
  hidden = false,
  pendingId = null,
}: UndoProps) {
  useEffect(() => {
    if (hidden) return;
    const timer = window.setTimeout(() => {
      onExpire();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [hidden, pendingId, onExpire, duration]);

  const node = (
    <div className="undo" hidden={hidden}>
      <p className="undo__text">Событие удалено</p>
      <div className="undo__timer">
        <div className="undo__timer-bar" />
      </div>
      <button className="undo__btn" type="button" onClick={onUndo}>
        Отмена
      </button>
    </div>
  );

  return createPortal(node, document.body);
}