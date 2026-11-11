import { normalizeGenotype } from './normalize.ts';

export function gametes(genotype: string): string[] {
  const canonical = normalizeGenotype(genotype);
  const out: string[] = [];
  for (let i = 0; i < canonical.length; i += 1) {
    const base = canonical[i];
    if (base !== 'X' && base !== 'Y') continue;
    const next = canonical[i + 1];
    if (next && /[A-Za-z]/.test(next) && next !== 'X' && next !== 'Y') {
      out.push(base + next);
      i += 1;
    } else {
      out.push(base);
    }
  }
  return out;
}

export function buildPunnett(motherGenotype: string, fatherGenotype: string): string[] {
  const rows = gametes(motherGenotype);
  const cols = gametes(fatherGenotype);
  const cells: string[] = [];
  for (const row of rows) {
    for (const col of cols) cells.push(normalizeGenotype(row + col));
  }
  return cells;
}

export function isAffected(genotype: string): boolean {
  const xAlleles = gametes(genotype).filter((allele) => allele.startsWith('X'));
  if (xAlleles.length === 0) return false;
  return xAlleles.every((allele) => allele.length === 2 && allele[1] === allele[1].toLowerCase());
}

export function probabilityUnaffected(cells: string[]): number {
  const valid = cells.filter(Boolean);
  if (valid.length === 0) return 0;
  const healthy = valid.filter((cell) => !isAffected(cell)).length;
  return Math.round((healthy / valid.length) * 100);
}
