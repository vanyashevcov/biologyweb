import { normalizeSequence } from './normalize.ts';

export type CodonTable = Record<string, string>;

const DNA_PAIR: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
const DNA_TO_RNA: Record<string, string> = { A: 'U', T: 'A', G: 'C', C: 'G' };

export function complementBase(base: string): string {
  return DNA_PAIR[base] ?? '';
}

export function complementDna(sequence: string): string {
  return Array.from(normalizeSequence(sequence))
    .map((base) => complementBase(base))
    .join('');
}

export function transcribe(templateStrand: string): string {
  return Array.from(normalizeSequence(templateStrand))
    .map((base) => DNA_TO_RNA[base] ?? '')
    .join('');
}

export function splitCodons(sequence: string): string[] {
  const clean = normalizeSequence(sequence);
  const codons: string[] = [];
  for (let i = 0; i + 3 <= clean.length; i += 3) codons.push(clean.slice(i, i + 3));
  return codons;
}

export function translateCodon(codon: string, table: CodonTable): string {
  return table[normalizeSequence(codon)] ?? '';
}

export function translate(mrna: string, table: CodonTable, stopCode = 'Stop'): string[] {
  const chain: string[] = [];
  for (const codon of splitCodons(mrna)) {
    const amino = translateCodon(codon, table);
    chain.push(amino);
    if (amino === stopCode) break;
  }
  return chain;
}

export function passwordFromNames(names: string[]): string {
  return names
    .filter(Boolean)
    .map((name) => name.trim().charAt(0).toUpperCase())
    .join('');
}
