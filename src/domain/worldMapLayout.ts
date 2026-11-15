import type { WorldStage } from './worldCatalog.ts';

export type MapPoint = { x: number; y: number };

export type WorldMapLayout = {
  columns: 2 | 3;
  rowHeight: number;
  height: number;
  positions: readonly MapPoint[];
};

export function worldMapLayout(width: number): WorldMapLayout {
  const safeWidth = Math.max(290, width || 360);
  const columns = safeWidth >= 700 ? 3 : 2;
  const rowHeight = columns === 3 ? 208 : 193;
  const positions = Array.from({ length: 12 }, (_, index) => {
    const row = Math.floor(index / columns);
    // Snaking from island to island keeps the grade order visible as a voyage.
    const column = row % 2 === 0 ? index % columns : columns - 1 - index % columns;
    return {
      x: Math.round(safeWidth * (column + 0.5) / columns),
      y: Math.round(104 + row * rowHeight),
    };
  });
  return {
    columns,
    rowHeight,
    height: Math.ceil(positions.at(-1)!.y + 129),
    positions,
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
  const safeWidth = Math.max(290, width || 360);
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
