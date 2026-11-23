/** User-selected replacement atlas, 2026-11-23. The 16 pixel button labels are
 * baked into this exact PNG. Do not overlay the old SVG plaques on top.
 * The earlier approved image remains archived in approvedWorldMap.ts.
 */
export const richWorldMap = {
  width: 1448,
  height: 1086,
  filename: 'world-map-rich-20261123.png',
  sha256: '7f2573fe2850e626012d6d36c65d665e1e9a820d9f8ed2762663418abdfe564c',
} as const;

export const richWorldMapImageUrl =
  '/kazu-no-tobira/world-map-rich-20261123.png?v=7f2573fe';

// Center coordinates of the visible, prepainted pixel-art buttons (normalized).
export const richWorldMapHotspots = [
  {x:.161,y:.191}, // 01 ぬいぐるみの町
  {x:.260,y:.293}, // 02 おもちゃの島
  {x:.337,y:.438}, // 03 どうぶつの森
  {x:.101,y:.453}, // 04 おかしの国
  {x:.125,y:.607}, // 05 恐竜の島
  {x:.308,y:.606}, // 06 機械都市
  {x:.483,y:.591}, // 07 古代遺跡
  {x:.574,y:.466}, // 08 地底の迷宮
  {x:.724,y:.578}, // 09 鏡の国
  {x:.438,y:.265}, // 10 光と影の谷
  {x:.653,y:.258}, // 11 星座の高原
  {x:.855,y:.225}, // 12 大自然の秘境
  {x:.855,y:.440}, // 13 数学アカデミー
  {x:.852,y:.702}, // 14 魔法使いの塔
  {x:.529,y:.790}, // 15 天空の王国
  {x:.208,y:.805}, // 16 銀河の果て
] as const;

// Wider hit targets for the long rendered labels; keep their visual centers.
export const richWorldMapButtonWidths = [
  .164,.172,.174,.165,.170,.166,.164,.176,
  .179,.169,.168,.169,.171,.183,.167,.177,
] as const;
export const richWorldMapButtonHeight = .068;
