import { sha256Hex } from './sha256.ts';
import { normalizeByKind, type AnswerKind } from './normalize.ts';

export type AnswerMap = Record<string, string>;

export function fingerprint(id: string, normalized: string): string {
  return sha256Hex(`${id}::${normalized}`);
}

export function checkAnswer(
  answers: AnswerMap,
  id: string,
  kind: AnswerKind,
  raw: string,
): boolean {
  const expected = answers[id];
  if (!expected) return false;
  const normalized = normalizeByKind(kind, raw);
  if (!normalized) return false;
  return fingerprint(id, normalized) === expected;
}

export function checkAll(
  answers: AnswerMap,
  kind: AnswerKind,
  entries: Array<{ id: string; value: string }>,
): boolean {
  return entries.every((entry) => checkAnswer(answers, entry.id, kind, entry.value));
}
