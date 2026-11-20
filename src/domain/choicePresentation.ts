/** Preserve the question bank's answer options, but render spatial comparison
 * buttons in their physical left–center–right positions.
 *
 * Do not reorder the source question/choices: grading and bank validation
 * may rely on their original indexes. Only the presentation order changes.
 */
export function displayedChoiceOptions(choices: readonly string[] | undefined): readonly string[] | undefined {
  if (!choices) return undefined;
  const directional = ['ひだり','おなじ','みぎ'] as const;
  if (choices.length === 3 && directional.every(value => choices.includes(value)))
    return directional;
  // Two-box equalizing questions should also keep the LEFT answer button
  // to the left of the RIGHT one, never scramble these spatial labels.
  if (choices.length === 2 && choices.includes('ひだり') && choices.includes('みぎ'))
    return ['ひだり','みぎ'];
  return choices;
}
