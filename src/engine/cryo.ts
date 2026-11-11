export type CardStatus = 'idle' | 'solved' | 'frozen';

export function assembleKey(order: string[], solved: Record<string, number | null>): string[] {
  return order.map((id) => {
    const value = solved[id];
    return value == null ? '' : String(value);
  });
}

export function isCryoComplete(order: string[], solved: Record<string, number | null>): boolean {
  return order.every((id) => solved[id] != null);
}

export function freezeSecondsLeft(frozenUntilMs: number, nowMs: number): number {
  if (!frozenUntilMs || nowMs >= frozenUntilMs) return 0;
  return Math.ceil((frozenUntilMs - nowMs) / 1000);
}
