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
