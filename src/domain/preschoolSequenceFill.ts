/** Interactive preschool stage 20: each question contains a true consecutive
 * run in 1..10, with one or two missing numerals. Each slot is filled separately.
 * These are unreviewed public-prototype activities, not approved bank content.
 */
export type PreschoolSequenceFill = {
  start: number;
  length: number;
  missingIndices: readonly number[];
  options: readonly string[];
};

const patterns = [
  {start:1,length:7, missingIndices:[2]},
  {start:2,length:7, missingIndices:[4]},
  {start:1,length:9, missingIndices:[6]},
  {start:1,length:8, missingIndices:[2,5]},
  {start:2,length:8, missingIndices:[2,6]},
  {start:1,length:9, missingIndices:[3,7]},
  {start:1,length:10,missingIndices:[4,8]},
  {start:1,length:9, missingIndices:[4,5]},
  {start:2,length:9, missingIndices:[5,6]},
  {start:1,length:10,missingIndices:[2,3]},
] as const;

export function stage20SequenceFill(index:number):PreschoolSequenceFill {
  if(!Number.isInteger(index)||index<0||index>=patterns.length)
    throw new Error('Stage 20 has exactly ten prototype activities.');
  const {start,length,missingIndices}=patterns[index];
  if(start<1||start+length-1>10)throw new Error('Sequence must stay within 1..10.');
  const answers=missingIndices.map(position=>start+position);
  const distractors=Array.from({length:10},(_,i)=>i+1)
    .filter(number=>!answers.includes(number))
    .sort((a,b)=>Math.min(...answers.map(answer=>Math.abs(a-answer)))-
      Math.min(...answers.map(answer=>Math.abs(b-answer)))||a-b);
  return {
    start,length,missingIndices,
    options:[...answers,...distractors.slice(0,2)].sort((a,b)=>a-b).map(String),
  };
}
export const sequenceFillCorrect = (task:PreschoolSequenceFill):string =>
  task.missingIndices.map(index=>String(task.start+index)).join('・');

/** Choice-type scoring accepts every possible combination of the visible
 * number cards, so an incorrect pair is graded incorrect, not invalid.
 */
export function sequenceFillChoices(task:PreschoolSequenceFill):string[] {
  if(task.missingIndices.length===1)return [...task.options];
  if(task.missingIndices.length===2)
    return task.options.flatMap(first=>task.options.map(second=>first+'・'+second));
  throw new Error('A sequence needs one or two blanks.');
}
