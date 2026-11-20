import type { BankDiagram } from './questionBank.ts';
import { countingTokenArt } from './countingTokens.ts';

/** Present the exact same pictured toy on the answer button. Do not turn an
 * unrelated text answer into a picture or add distractors absent from the scene.
 * The original written answer remains the value used by the grading logic.
 */
export function preschoolVerticalChoiceEmoji(diagram: BankDiagram | undefined,
  answer: string): string | undefined {
  if (diagram?.kind !== 'countingBoard' || diagram.arrangement !== 'vertical-position') return undefined;
  const token = diagram.rows.flatMap(row=>row.tokens)
    .find(candidate=>countingTokenArt[candidate][1]===answer);
  return token ? countingTokenArt[token][0] : undefined;
}
