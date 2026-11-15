import type { ReactNode } from 'react';
import type { Point } from '../domain/ink';

export interface InkSurfaceProps {
  children: ReactNode;
  start: (point: Point) => void;
  move: (point: Point) => void;
  finish: () => void;
  cancel: () => void;
}
