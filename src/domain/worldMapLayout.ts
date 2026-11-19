import type { WorldStage } from './worldCatalog.ts';

export type MapPoint = { x: number; y: number };

// World route: 01→16 follows a simple, non-crossing serpentine path.
// Four clear rows on desktop; two columns and eight rows on phones.
// Small coordinate offsets prevent labels from stacking on top of one another.
const atlasLandscape = [
  [120,145],[372,148],[624,151],[876,154],
  [868,317],[616,321],[364,325],[112,329],
  [128,479],[380,483],[632,487],[884,491],
  [860,645],[608,649],[356,653],[104,657],
] as const;
const atlasPortrait = [
  [91,112],[329,124],
  [326,317],[94,329],
  [97,522],[323,534],
  [320,727],[100,739],
  [103,932],[317,944],
  [314,1137],[106,1149],
  [109,1342],[311,1354],
  [308,1547],[112,1559],
] as const;

export function worldMapLayout(width: number) {
  const actualWidth = Math.max(244, width || 360);
  const compact = actualWidth < 700;
  const height = compact ? 1730 : Math.round(actualWidth * 0.80);
  const baseWidth = compact ? 420 : 1000;
  const baseHeight = compact ? 1730 : 800;
  const targetWidth = compact ? Math.min(124, Math.floor(actualWidth * 0.43)) : Math.min(156, Math.floor(actualWidth * 0.16));
  return {
    width: actualWidth, height, compact, targetWidth,
    positions: (compact ? atlasPortrait : atlasLandscape).map(([x, y]) => ({
      x: Math.round(x / baseWidth * actualWidth),
      y: Math.round(y / baseHeight * height),
    })),
  };
}

// Reserved space above the preschool stages for a readable in-map island title.
export const PRESCHOOL_MAP_TITLE_INSET = 86;

export function compactIslandStageMap(width:number): boolean {
  return Math.max(244,width||360) < 620;
}

/**
 * Checkpoints have their own lane on narrow devices, beneath the centered
 * row's learning topic. Preserve the original desktop placement.
 */
export function islandCheckpointLayout(width:number,point:MapPoint,marker:number,nextPoint?:MapPoint,expandedDesktop=false) {
  const compact=compactIslandStageMap(width);
  const boxWidth=compact?56:66;
  const boxHeight=44; // Preserve a 44px touch target on narrow screens.
  return {
    compact,
    left:compact
      ? Math.max(8,Math.min(width-boxWidth-8,point.x-boxWidth/2))
      : Math.min(width-boxWidth-2,Math.max(2,point.x-boxWidth/2)),
    // In portrait, center the checkpoint vertically in the connecting path
    // between the two stage rows rather than attaching it to the lower row.
    top:compact&&nextPoint
      ? Math.round((point.y+nextPoint.y-boxHeight)/2)
      : compact?point.y+marker/2+60:point.y+(expandedDesktop?82:37),
    width:boxWidth,
    height:boxHeight,
  };
}

export type IslandStagePoint = MapPoint & {
  order: number;
  row: number;
  column: number;
};

export function islandStageLayout(width: number, stageCount = 65, topInset = 0, desktopRowHeight?:number): {
  height: number;
  rowHeight: number;
  positions: readonly IslandStagePoint[];
} {
  if (!Number.isInteger(stageCount) || stageCount < 1) throw new RangeError('Invalid stage count');
  if (!Number.isFinite(topInset) || topInset < 0) throw new RangeError('Invalid top inset');
  const safeWidth = Math.max(244, width || 360);
  // Five stage pins remain across each row, but compact screens need a
  // separate lane for the row title and the checkpoint after stage 05/10/etc.
  const compact = compactIslandStageMap(safeWidth);
  const rowHeight = compact ? 166 : (desktopRowHeight ?? 119);
  const areaGap = compact ? 58 : (desktopRowHeight ? 50 : 0);
  const positions: IslandStagePoint[] = Array.from({ length: stageCount }, (_, order) => {
    const row = Math.floor(order / 5);
    const column = row % 2 === 0 ? order % 5 : 4 - order % 5;
    return {
      order,
      row,
      column,
      x: Math.round(safeWidth * (column + 0.5) / 5),
      y: 134 + topInset + row * rowHeight + (row >= 10 ? areaGap : 0) + (row >= 12 ? areaGap : 0),
    };
  });
  return {
    rowHeight,
    height: Math.ceil(positions.at(-1)!.y + (compact ? 135 : 90)),
    positions,
  };
}

export function routeThrough(points: readonly MapPoint[], curvature = 0.14): string {
  if (!points.length) return '';
  return points.slice(1).reduce((path, end, index) => {
    const start = points[index];
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const drift = Math.abs(end.x - start.x) > Math.abs(end.y - start.y)
      ? Math.sign(end.x - start.x) * (end.y - start.y) * curvature
      : Math.sign(end.y - start.y) * (end.x - start.x) * curvature;
    const cx = Math.abs(end.x - start.x) > Math.abs(end.y - start.y) ? midX : midX + drift;
    const cy = Math.abs(end.x - start.x) > Math.abs(end.y - start.y) ? midY + drift : midY;
    return path + ` Q${cx} ${cy} ${end.x} ${end.y}`;
  }, `M${points[0].x} ${points[0].y}`);
}

export function islandRouteByKind(stages: readonly WorldStage[], positions: readonly IslandStagePoint[]) {
  const groups: { normal: MapPoint[]; extra: MapPoint[]; secret: MapPoint[] } = {
    normal: [], extra: [], secret: [],
  };
  stages.forEach((stage, index) => groups[stage.kind].push(positions[index]));
  return groups;
}
