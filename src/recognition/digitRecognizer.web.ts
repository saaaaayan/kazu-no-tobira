import { recognizeLine } from './recognizeLine';
import type { DigitRecognizer } from './contracts';

const digitRecognizer: DigitRecognizer = {
  available: true,
  async recognize(ink) { return recognizeLine(ink); },
};

export default digitRecognizer;
