
export type CurvePoint = [number, number];

export function peakOf(points: CurvePoint[]): CurvePoint {
  return points.reduce((best, point) => (point[1] > best[1] ? point : best), points[0]);
}

export function daysToPeak(eventDay: number, points: CurvePoint[]): number {
  return peakOf(points)[0] - eventDay;
}

export function peakRatio(primary: CurvePoint[], secondary: CurvePoint[]): number {
  const low = peakOf(primary)[1];
  if (low <= 0) return 0;
  return Math.round((peakOf(secondary)[1] / low) * 10) / 10;
}

export function smoothPath(
  points: CurvePoint[],
  toX: (day: number) => number,
  toY: (level: number) => number,
): string {
  if (points.length === 0) return '';
  const xy = points.map(([day, level]) => [toX(day), toY(level)] as const);
  let d = `M${xy[0][0].toFixed(1)} ${xy[0][1].toFixed(1)}`;
  for (let i = 0; i < xy.length - 1; i += 1) {
    const p0 = xy[i - 1] ?? xy[i];
    const p1 = xy[i];
    const p2 = xy[i + 1];
    const p3 = xy[i + 2] ?? p2;
    const lo = Math.min(p1[1], p2[1]);
    const hi = Math.max(p1[1], p2[1]);
    const clampY = (y: number) => Math.max(lo, Math.min(hi, y));
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = clampY(p1[1] + (p2[1] - p0[1]) / 6);
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = clampY(p2[1] - (p3[1] - p1[1]) / 6);
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
