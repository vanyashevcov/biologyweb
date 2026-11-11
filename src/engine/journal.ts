
export type JournalTone = 'info' | 'good' | 'bad';

export interface JournalEntry {
  ts: number;
  text: string;
  tone: JournalTone;
}

export function fillTemplate(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

export function makeEntry(
  template: string,
  vars: Record<string, string | number>,
  tone: JournalTone,
  now: number,
): JournalEntry {
  return { ts: now, text: fillTemplate(template, vars), tone };
}

export function unreadCount(entries: JournalEntry[], seen: number): number {
  return Math.max(0, entries.length - Math.max(0, seen));
}

export function formatClock(ts: number): string {
  const date = new Date(ts);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
