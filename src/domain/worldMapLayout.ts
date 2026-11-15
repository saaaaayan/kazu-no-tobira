import type { WorldStage } from './worldCatalog.ts';

export type MapPoint = { x: number; y: number };

const atlasLandscape = [
  [128, 510], [125, 330], [252, 195], [403, 283], [332, 471], [528, 551],
  [701, 474], [852, 366], [661, 287], [510, 136], [711, 102], [893, 157],
] as const;
const atlasPortrait = [
  [111, 111], [302, 177], [211, 304], [105, 425], [300, 482], [270, 610],
  [106, 676], [188, 801], [312, 894], [124, 956], [164, 1089], [306, 1169],
] as const;

export function worldMapLayout(width: number) {
  const actualWidth = Math.max(244, width || 360);
  const compact = actualWidth < 700;
  const height = compact ? 1265 : Math.round(actualWidth * 0.68);
  const baseWidth = compact ? 420 : 1000;
  const baseHeight = compact ? 1265 : 680;
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
