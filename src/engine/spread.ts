export interface SpreadConfig {
  start: number;
  perMinute: number;
  perWrong: number;
  criticalAt: number;
  resetTo: number;
  criticalPenalty: number;
  bonusRelief: number;
}

export interface SpreadResult {
  value: number;
  critical: boolean;
}

export function applySpreadDelta(current: number, delta: number, config: SpreadConfig): SpreadResult {
  const raw = current + delta;
  if (raw >= config.criticalAt) {
    return { value: config.resetTo, critical: true };
  }
  return { value: Math.max(0, Math.min(config.criticalAt, Math.round(raw))), critical: false };
}

export function minutesElapsed(fromMs: number, nowMs: number): number {
  if (!fromMs || nowMs <= fromMs) return 0;
  return Math.floor((nowMs - fromMs) / 60_000);
}
