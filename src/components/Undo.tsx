// Undo.tsx
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface UndoProps {
  onUndo: () => void;
  onExpire: () => void;
  duration?: number;
}

export function Undo({ onUndo, onExpire, duration = 5000 }: UndoProps) {
  useEffect(() => {
    const timer = window.setTimeout(onExpire, duration);
    return () => window.clearTimeout(timer);
  }, [onExpire, duration]);

  const node = (
    <div className="undo">
      <p className="undo__text">Событие удалено</p>
      <div className="undo__timer">
        <div className="undo__timer-bar" style={{ animationDuration: `${duration}ms` }} />
      </div>
      <button className="undo__btn" type="button" onClick={onUndo}>
        Отмена
      </button>
    </div>
  );

  return createPortal(node, document.body);
}