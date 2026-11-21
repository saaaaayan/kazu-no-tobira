/** Shared child-facing map standard, originally approved on the preschool
 * island. New island themes should extend this catalogue and supply their
 * own art, but NEVER fork the 65-position geometry or checkpoint layout.
 * Other islands keep their legacy map until their theme is implemented.
 */
export const STANDARD_PIXEL_ISLANDS={
  preschool:{title:'ぬいぐるみの島',grade:'就学前',symbol:'paws',art:'plush'},
  e1:{title:'おもちゃの島',grade:'小学1年生',symbol:'blocks',art:'toys'},
} as const;
export type StandardPixelIslandId=keyof typeof STANDARD_PIXEL_ISLANDS;
export function isStandardPixelIsland(id:string):id is StandardPixelIslandId {
  return Object.prototype.hasOwnProperty.call(STANDARD_PIXEL_ISLANDS,id);
}
export function standardPixelIslandConfig(id:string){
  return isStandardPixelIsland(id)?STANDARD_PIXEL_ISLANDS[id]:undefined;
}
