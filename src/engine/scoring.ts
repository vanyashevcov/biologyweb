
export type LossReason = 'wrong' | 'hint' | 'freeze' | 'attempt' | 'critical';

export interface StepDef {
  id: string;
  points: number;
  penalty?: number;
  attemptPenalties?: number[];
}

export interface Loss {
  step: string;
  points: number;
  reason: LossReason;
}

export interface ScaleRow {
  grade: number;
  min: number;
  max: number;
}

export interface Band {
  name: string;
  from: number;
  to: number;
}

export function lostOnStep(losses: Loss[], step: string): number {
  return losses.filter((loss) => loss.step === step).reduce((sum, loss) => sum + loss.points, 0);
}

export function cappedLoss(stepPoints: number, alreadyLost: number, requested: number): number {
  return Math.max(0, Math.min(requested, stepPoints - alreadyLost));
}

export function penaltyFor(step: StepDef, losses: Loss[]): number {
  const lost = lostOnStep(losses, step.id);
  if (step.attemptPenalties) {
    const attempts = losses.filter((loss) => loss.step === step.id).length;
    const requested = step.attemptPenalties[attempts] ?? 0;
    return cappedLoss(step.points, lost, requested);
  }
  return cappedLoss(step.points, lost, step.penalty ?? 1);
}

export function levelScore(max: number, losses: Loss[], bonus = 0): number {
  const lost = losses.reduce((sum, loss) => sum + loss.points, 0);
  return Math.max(0, Math.min(max, max - lost + bonus));
}

export function gradeFor(score: number, scale: ScaleRow[]): ScaleRow {
  const sorted = [...scale].sort((a, b) => a.min - b.min);
  const rounded = Math.round(score);
  const found = sorted.find((row) => rounded >= row.min && rounded <= row.max);
  if (found) return found;
  return rounded < sorted[0].min ? sorted[0] : sorted[sorted.length - 1];
}

export function bandFor(grade: number, bands: Band[]): Band | undefined {
  return bands.find((band) => grade >= band.from && grade <= band.to);
}

export interface LossSummary {
  reason: LossReason;
  count: number;
  points: number;
}

export function summarizeLosses(losses: Loss[]): LossSummary[] {
  const order: LossReason[] = ['wrong', 'attempt', 'freeze', 'hint', 'critical'];
  return order
    .map((reason) => {
      const items = losses.filter((loss) => loss.reason === reason && loss.points > 0);
      return { reason, count: items.length, points: items.reduce((sum, loss) => sum + loss.points, 0) };
    })
    .filter((item) => item.count > 0);
}

export function pluralUk(n: number, forms: [string, string, string] | string[]): string {
  const abs = Math.abs(Math.trunc(n));
  const lastTwo = abs % 100;
  const last = abs % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}
