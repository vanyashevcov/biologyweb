import { checkAnswer, type AnswerMap } from './answers.ts';

export interface SortCell {
  acid: string;
  host: string;
}

export interface PlacementResult {
  acidOk: boolean;
  hostOk: boolean;
  ok: boolean;
}

export function cellKey(cell: SortCell): string {
  return `${cell.acid}|${cell.host}`;
}

export function parseCellKey(key: string): SortCell {
  const [acid = '', host = ''] = key.split('|');
  return { acid, host };
}

export function checkPlacement(answers: AnswerMap, specimenId: string, cell: SortCell): PlacementResult {
  const acidOk = checkAnswer(answers, `virus.${specimenId}.acid`, 'option', cell.acid);
  const hostOk = checkAnswer(answers, `virus.${specimenId}.host`, 'option', cell.host);
  return { acidOk, hostOk, ok: acidOk && hostOk };
}

export function otherOption(options: string[], chosen: string): string {
  return options.find((option) => option !== chosen) ?? '';
}

export function isSortComplete(ids: string[], placed: Record<string, string>): boolean {
  return ids.every((id) => Boolean(placed[id]));
}

export function trayItems<T extends { id: string }>(specimens: T[], placed: Record<string, string>): T[] {
  return specimens.filter((specimen) => !placed[specimen.id]);
}
