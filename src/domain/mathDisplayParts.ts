import {formatMathText,type MathPart} from './mathNotation.ts';

/** Presentation-only marker for an actual square hole, never an OS font glyph.
 * Splitting source at every literal □ keeps its original text intact while
 * allowing an evenly sized, vertically centered native square in the UI.
 * The marker does not change answers, question IDs or mathematical notation.
 */
export type DisplayMathPart=MathPart|{kind:'square';text:'□'};

export function displayMathParts(value:string,format=true):DisplayMathPart[]{
  if(!value.includes('□')){
    return format?formatMathText(value):[{kind:'text',text:value}];
  }
  const chunks=value.split('□');
  const out:DisplayMathPart[]=[];
  for(let i=0;i<chunks.length;i++){
    const chunk=chunks[i];
    if(chunk)out.push(...(format?formatMathText(chunk):[{kind:'text' as const,text:chunk}]));
    if(i<chunks.length-1)out.push({kind:'square',text:'□'});
  }
  return out;
}
