/**
 * Coordinates measured from the user-approved 1448×1086 world map artwork.
 * These are the clickable island centers, in the same order as worldIslands.
 * All values are normalized; render dimensions can be scaled without changing
 * the route, the image artwork, or island names.
 */
export const approvedWorldMap = {
  width: 1448,
  height: 1086,
  filename: 'world-map-approved.avif',
  sha256: 'dc70d6bc856477e05e85d2c02fa244338de792b62560fcf425b99a8083d8d661',
} as const;
export const approvedWorldMapHotspots = [
  {x:.118,y:.180}, // 01 preschool – plush toys
  {x:.349,y:.180}, // 02 elementary 1 – toys
  {x:.578,y:.180}, // 03 elementary 2 – animals
  {x:.830,y:.180}, // 04 elementary 3 – sweets
  {x:.830,y:.398}, // 05 elementary 4 – dinosaurs
  {x:.578,y:.398}, // 06 elementary 5 – machines
  {x:.349,y:.398}, // 07 elementary 6 – ancient ruins
  {x:.118,y:.398}, // 08 junior high 1 – labyrinth
  {x:.118,y:.610}, // 09 junior high 2 – mirrors
  {x:.349,y:.610}, // 10 junior high 3 – light and shadow
  {x:.578,y:.610}, // 11 high school 1 – stars
  {x:.830,y:.610}, // 12 high school 2 – nature
  {x:.830,y:.824}, // 13 high school 3 – academy
  {x:.578,y:.824}, // 14 sage – sorcerers
  {x:.349,y:.824}, // 15 champion – kingdom
  {x:.118,y:.824}, // 16 cosmos – outer space
] as const;

export const approvedWorldMapImageUrl =
  '/kazu-no-tobira/world-map-approved.avif?v=dc70d6bc';

export function approvedWorldMapDimensions(viewWidth:number,zoomed:boolean) {
  const actualWidth=Math.max(244,viewWidth||360);
  const compact=actualWidth<700;
  const imageWidth=compact&&zoomed?Math.max(960,actualWidth*2.5):actualWidth;
  return {
    compact,imageWidth,
    imageHeight:Math.round(imageWidth*approvedWorldMap.height/approvedWorldMap.width),
  };
}
