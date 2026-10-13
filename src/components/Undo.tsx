// Undo.tsx
import { useEffect, useRef } from 'react';
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
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hidden) return;
    const timer = window.setTimeout(() => {
      onExpire();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [hidden, pendingId, onExpire, duration]);

  useEffect(() => {
    if (hidden) return;
    const bar = barRef.current;
    if (!bar) return;

    const logState = (tag: string) => {
      const cs = window.getComputedStyle(bar);
      const anims = bar.getAnimations();
      console.log(`[Undo] ${tag}`, {
        inlineSize: cs.inlineSize,
        width: cs.width,
        playState: cs.animationPlayState,
        animTime: anims[0]?.currentTime,
      });
    };

    logState('t=0');
    const t1 = window.setTimeout(() => logState('t=1000'), 1000);
    const t2 = window.setTimeout(() => logState('t=2500'), 2500);
    const t3 = window.setTimeout(() => logState('t=4000'), 4000);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [hidden, pendingId]);

  const node = (
    <div className="undo" hidden={hidden}>
      <p className="undo__text">Событие удалено</p>
      <div className="undo__timer">
        <div className="undo__timer-bar" ref={barRef} />
      </div>
      <button className="undo__btn" type="button" onClick={onUndo}>
        Отмена
      </button>
    </div>
  );

  return createPortal(node, document.body);
}