/**
 * Exact user-approved world map artwork (2026-11-22).
 * Coordinates are normalized positions of the sixteen labeled regions in the
 * irregular fantasy treasure map, not the old four-column island grid.
 * Never re-render or recolor this original without explicit user approval.
 */
export const approvedWorldMap = {
  width: 2048,
  height: 1522,
  filename: 'world-map-approved-20261122.png',
  sha256: '5e91554bc4de79192d5a1b04994149e866c7c8e1b0f17963dc21f9cc88cddc2c',
} as const;
export const approvedWorldMapAreaNames = [
  'ぬいぐるみの町','おもちゃの島','どうぶつの森','おかしの国',
  '恐竜の島','機械都市','古代遺跡','地底の迷宮',
  '鏡の国','光と影の谷','星座の高原','大自然の秘境',
  '数学アカデミー','魔法使いの塔','天空の王国','銀河の果て',
] as const;
/** Measured from the image's actual nameplate centers (2048×1522). */
export const approvedWorldMapHotspots = [
  {x:.182,y:.213}, // 01 ぬいぐるみの町
  {x:.281,y:.314}, // 02 おもちゃの島
  {x:.353,y:.459}, // 03 どうぶつの森
  {x:.113,y:.479}, // 04 おかしの国
  {x:.136,y:.635}, // 05 恐竜の島
  {x:.325,y:.639}, // 06 機械都市
  {x:.499,y:.623}, // 07 古代遺跡
  {x:.601,y:.490}, // 08 地底の迷宮
  {x:.744,y:.607}, // 09 鏡の国
  {x:.463,y:.282}, // 10 光と影の谷
  {x:.674,y:.277}, // 11 星座の高原
  {x:.876,y:.244}, // 12 大自然の秘境
  {x:.878,y:.464}, // 13 数学アカデミー
  {x:.882,y:.734}, // 14 魔法使いの塔
  {x:.554,y:.822}, // 15 天空の王国
  {x:.226,y:.840}, // 16 銀河の果て
] as const;

export const approvedWorldMapImageUrl =
  '/kazu-no-tobira/world-map-approved-20261122.png?v=5e91554b';

export function approvedWorldMapDimensions(viewWidth:number,zoomed:boolean) {
  const actualWidth=Math.max(244,viewWidth||360);
  const compact=actualWidth<700;
  const imageWidth=compact&&zoomed?Math.max(960,actualWidth*2.5):actualWidth;
  return {
    compact,imageWidth,
    imageHeight:Math.round(imageWidth*approvedWorldMap.height/approvedWorldMap.width),
  };
}
