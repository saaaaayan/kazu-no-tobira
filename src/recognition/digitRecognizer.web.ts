import { recognizeDigits } from './recognizeDigits';
import type { DigitRecognizer } from './contracts';

const digitRecognizer: DigitRecognizer = {
  available: true,
  async recognize(cells) { return recognizeDigits(cells); },
};

export default digitRecognizer;
