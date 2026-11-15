import type { DigitRecognizer } from './contracts';

const digitRecognizer: DigitRecognizer = {
  available: false,
  async recognize() { return { status: 'unavailable' }; },
};

export default digitRecognizer;
