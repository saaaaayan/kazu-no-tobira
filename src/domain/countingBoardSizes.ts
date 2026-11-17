/**
 * 見て数える教材のタップ対象と図の大きさ。
 * 1〜3個の物を横一列に置き、小さいスマホでもはみ出さないことを優先する。
 */
export function countingBoardSizes(viewportWidth: number, guided: boolean) {
  if (!guided) return { tile:48, symbol:30, gap:8 };
  if (viewportWidth < 360) return { tile:62, symbol:43, gap:8 };
  if (viewportWidth < 480) return { tile:72, symbol:50, gap:10 };
  if (viewportWidth < 700) return { tile:88, symbol:62, gap:12 };
  return { tile:112, symbol:82, gap:16 };
}

/**
 * 表示する図の実際の横幅に、指定個数を収める。
 * 画面幅だけで計算すると、細い「こたえの わけ」の欄からはみ出すため、
 * CountingBoardのonLayoutで得た幅を使用する。横方向の余白20pxも引く。
 */
export function fitCountingBoardSizes(containerWidth: number, guided: boolean, columns: number) {
  const base=countingBoardSizes(containerWidth,guided);
  const count=Math.max(1,Math.floor(columns));
  const innerWidth=Math.max(1,containerWidth-20);
  const gap=Math.min(base.gap,Math.max(0,Math.floor(innerWidth/(count*6))));
  const tile=Math.max(1,Math.min(base.tile,Math.floor((innerWidth-gap*(count-1))/count)));
  const symbol=Math.min(base.symbol,Math.max(1,Math.floor(tile*0.73)));
  return { tile, symbol, gap };
}

/** すべての数え上げ図で素材だけを表示する。透明タップ領域は呼び出し側で確保する。 */
export function countingTileAppearance() {
  return { borderWidth:0, borderColor:'transparent', borderRadius:0, backgroundColor:'transparent' };
}
