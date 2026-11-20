/** タップした順序を1,2,3…として表示。取り消し時は残りの番号を詰める。 */
export function countingTapNumber(selected: ReadonlySet<string>, id: string): number | undefined {
  if (!selected.has(id)) return undefined;
  let number=0;
  for(const selectedId of selected) {
    number++;
    if(selectedId===id) return number;
  }
  return undefined;
}

/** タップ済みをもう一度押すと外し、再タップでは最後の順番に加える。 */
export function toggleCountingTap(selected: ReadonlySet<string>, id: string): Set<string> {
  const next=new Set(selected);
  if(next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** 左右の比較図は、それぞれ1から数える。
 * Each tile is keyed as "row:column"; taps in the opposite row do not
 * affect the badge number, even after tapping/untapping out of order.
 */
export function countingTapNumberInRow(selected: ReadonlySet<string>, id: string): number | undefined {
  if (!selected.has(id)) return undefined;
  const row=id.split(':',1)[0];
  let number=0;
  for(const selectedId of selected) {
    if(selectedId.split(':',1)[0] !== row) continue;
    number++;
    if(selectedId===id) return number;
  }
  return undefined;
}
