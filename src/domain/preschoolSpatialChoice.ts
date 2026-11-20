import type { BankDiagram } from './questionBank.ts';
import { countingTokenArt } from './countingTokens.ts';

/** Match a pictured spatial answer to the exact toy in the question diagram.
 * Do not convert other text/numeric questions, and never add an unseen toy.
 * Grading keeps the original Japanese label, not the emoji glyph.
 */
export function preschoolSpatialChoiceEmoji(diagram: BankDiagram | undefined,
  answer: string): string | undefined {
  if (diagram?.kind !== 'countingBoard' ||
      !['vertical-position','position-row'].includes(diagram.arrangement??'')) return undefined;
  const token = diagram.rows.flatMap(row=>row.tokens)
    .find(candidate=>countingTokenArt[candidate][1]===answer);
  return token ? countingTokenArt[token][0] : undefined;
}

/** Keep the published stage-41 helper available for existing callers/tests. */
export const preschoolVerticalChoiceEmoji = preschoolSpatialChoiceEmoji;
