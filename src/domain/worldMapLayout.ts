import type { WorldStage } from './worldCatalog.ts';

export type MapPoint = { x: number; y: number };

const atlasLandscape = [
  [105, 646], [128, 493], [125, 300], [252, 153], [403, 278], [345, 467], [528, 590],
  [701, 463], [863, 351], [658, 274], [505, 124], [720, 91], [899, 150], [879, 540],
  [724, 662], [382, 675],
] as const;
const atlasPortrait = [
  [111, 100], [302, 182], [211, 294], [105, 401], [300, 472], [270, 590],
  [106, 666], [188, 781], [312, 887], [124, 963], [164, 1085], [306, 1172], [182, 1305],
  [100, 1420], [295, 1499], [217, 1620],
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

export type IslandStagePoint = MapPoint & {
  order: number;
  row: number;
  column: number;
};

export function islandStageLayout(width: number, stageCount = 65): {
  height: number;
  rowHeight: number;
  positions: readonly IslandStagePoint[];
} {
  if (!Number.isInteger(stageCount) || stageCount < 1) throw new RangeError('Invalid stage count');
  const safeWidth = Math.max(244, width || 360);
  const rowHeight = 119;
  const positions: IslandStagePoint[] = Array.from({ length: stageCount }, (_, order) => {
    const row = Math.floor(order / 5);
    const column = row % 2 === 0 ? order % 5 : 4 - order % 5;
    return {
      order,
      row,
      column,
      x: Math.round(safeWidth * (column + 0.5) / 5),
      y: 134 + row * rowHeight,
    };
  });
  return {
    rowHeight,
    height: Math.ceil(positions.at(-1)!.y + 90),
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
