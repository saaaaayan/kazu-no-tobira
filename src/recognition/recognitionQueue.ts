import type { DigitInk, DigitRecognizer, RecognitionResult } from './contracts.ts';

export const recognitionDelayMs = 650;

export function createRecognitionQueue(
  recognize: DigitRecognizer['recognize'],
  receive: (result: RecognitionResult) => void,
  delay = recognitionDelayMs,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let revision = 0;

  function cancel() {
    revision++;
    clearTimeout(timer);
  }

  return {
    cancel,
    schedule(ink: DigitInk) {
      cancel();
      const scheduledRevision = revision;
      timer = setTimeout(async () => {
        let result: RecognitionResult;
        try {
          result = await recognize(ink);
        } catch {
          result = { status: 'uncertain' };
        }
        if (revision === scheduledRevision) receive(result);
      }, delay);
    },
  };
}
