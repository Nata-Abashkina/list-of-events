import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface UndoProps {
  onUndo: () => void;
  onExpire: (pendingId: string) => void;
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
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    if (hidden || !pendingId) return;
    const timer = window.setTimeout(() => {
      onExpireRef.current(pendingId);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [hidden, pendingId, duration]);

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