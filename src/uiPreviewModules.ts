export const unitLessons = [];
export function lessonForStage() { return undefined; }

export function unavailable(): never {
  throw new Error('This feature is outside the sample-only UI preview.');
}
export const prepareStageRound = unavailable;
export const newLessonProgress = unavailable;
export const lessonStatus = unavailable;
export const lessonCheckStart = unavailable;
export const lessonEnd = unavailable;
export const expectedLessonAnswer = unavailable;
export default function HiddenScreen() { return null; }
