import type { Drawing, Size } from '../domain/ink.ts';

export interface DigitInk {
  drawing: Drawing;
  size: Size;
}

export type RecognitionResult =
  | { status: 'recognized'; value: string }
  | { status: 'ambiguous'; candidates: readonly string[] }
  | { status: 'empty' | 'gap' | 'uncertain' | 'unavailable' };

export interface DigitRecognizer {
  available: boolean;
  recognize(cells: readonly DigitInk[]): Promise<RecognitionResult>;
}
