import { useRef, type PointerEvent } from 'react';
import type { InkSurfaceProps } from './inkSurfaceProps';

export default function InkSurface({ children, label = 'てがきエリア', start, move, finish, cancel }: InkSurfaceProps) {
  const active = useRef<number | null>(null);
  function point(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  return (
    <div aria-label={label} role="img"
      style={{ position: 'absolute', inset: 0, touchAction: 'none', userSelect: 'none', cursor: 'crosshair' }}
      onPointerDown={event => {
        if (active.current !== null || event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        active.current = event.pointerId;
        start(point(event));
      }}
      onPointerMove={event => {
        if (active.current === event.pointerId) move(point(event));
      }}
      onPointerUp={event => {
        if (active.current !== event.pointerId) return;
        move(point(event));
        active.current = null;
        finish();
      }}
      onPointerCancel={event => {
        if (active.current !== event.pointerId) return;
        active.current = null;
        cancel();
      }}
      onLostPointerCapture={event => {
        if (active.current !== event.pointerId) return;
        active.current = null;
        cancel();
      }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{children}</div>
    </div>
  );
}
