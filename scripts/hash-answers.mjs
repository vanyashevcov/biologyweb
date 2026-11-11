#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const sourcePath = resolve(root, 'answers.source.json');
const questPath = resolve(root, 'src/content/quest.uk.json');

if (!existsSync(sourcePath)) {
  console.error('Не знайдено answers.source.json. Створіть його за зразком із README.');
  process.exit(1);
}

const { fingerprint } = await import('../src/engine/answers.ts');
const { normalizeByKind } = await import('../src/engine/normalize.ts');

const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
const entries = source.entries ?? [];
if (!Array.isArray(entries) || entries.length === 0) {
  console.error('У answers.source.json порожній масив entries.');
  process.exit(1);
}

const seen = new Set();
const lines = [];

for (const entry of entries) {
  const { id, kind, value } = entry;
  if (!id || !kind || value === undefined) {
    console.error(`Неповний запис: ${JSON.stringify(entry)}`);
    process.exit(1);
  }
  if (seen.has(id)) {
    console.error(`Дубльований id: ${id}`);
    process.exit(1);
  }
  seen.add(id);

  const normalized = normalizeByKind(kind, String(value));
  if (!normalized) {
    console.error(`Значення "${value}" для ${id} нормалізується в порожній рядок. Перевірте kind.`);
    process.exit(1);
  }
  lines.push(`    ${JSON.stringify(id)}: ${JSON.stringify(fingerprint(id, normalized))}`);
}

const text = readFileSync(questPath, 'utf8');
const marker = '  "answers":';
const index = text.indexOf(marker);
if (index === -1) {
  console.error('У quest.uk.json немає ключа "answers" на верхньому рівні.');
  process.exit(1);
}

const next = `${text.slice(0, index)}${marker} {\n${lines.join(',\n')}\n  }\n}\n`;
writeFileSync(questPath, next, 'utf8');

console.log(`Записано ${lines.length} відбитків у src/content/quest.uk.json`);
