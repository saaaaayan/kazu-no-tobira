import type { CountingToken } from './countingTokens.ts';

export type PictureNumberMatch = {
  pictures: readonly { token:CountingToken; count:number }[];
  numbers: readonly number[];
};

/** A matching answer is the ordered list of digits for the three picture
 * groups from top to bottom. This can be checked by the normal answer flow. */
export function pictureNumberMatchAnswer(match:PictureNumberMatch):string {
  return match.pictures.map(p=>p.count).join('-');
}

/** Each number may be linked to one picture only. A partial or duplicate
 * connection is not a complete answer and must not be graded. */
export function pictureNumberConnectedAnswer(match:PictureNumberMatch,links:Readonly<Record<number,number>>):string {
  const indexes=match.pictures.map((_,i)=>links[i]);
  if(indexes.some(i=>i===undefined||i<0||i>=match.numbers.length) ||
    new Set(indexes).size!==match.pictures.length)return '';
  return indexes.map(i=>match.numbers[i]).join('-');
}
