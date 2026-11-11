import { normalizeNucleotide } from './normalize.ts';

export interface StrandCell {
  position: number;
  base: string | null;
  blank: boolean;
}

export interface StrandCodon {
  index: number;
  cells: StrandCell[];
}

export function parseMaskedStrand(masked: string): StrandCodon[] {
  const groups = masked.trim().split(/\s+/).filter(Boolean);
  let position = 0;
  return groups.map((group, index) => ({
    index,
    cells: Array.from(group).map((ch) => {
      position += 1;
      const blank = ch === '_';
      return {
        position,
        base: blank ? null : normalizeNucleotide(ch),
        blank,
      };
    }),
  }));
}

export function blankPositions(codons: StrandCodon[]): number[] {
  return codons.flatMap((codon) => codon.cells.filter((cell) => cell.blank).map((cell) => cell.position));
}

export function assembleStrand(codons: StrandCodon[], filled: Record<number, string>): string {
  return codons
    .flatMap((codon) => codon.cells)
    .map((cell) => (cell.blank ? normalizeNucleotide(filled[cell.position] ?? '') : cell.base ?? ''))
    .join('');
}
