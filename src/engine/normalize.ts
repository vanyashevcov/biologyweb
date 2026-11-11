
export type AnswerKind = 'nucleotide' | 'text' | 'latin' | 'number' | 'genotype' | 'option';

const NUCLEOTIDE_MAP: Record<string, string> = {
  А: 'A', а: 'A',
  Т: 'T', т: 'T',
  С: 'C', с: 'C',
  Ц: 'C', ц: 'C',
  Г: 'G', г: 'G',
  У: 'U', у: 'U',
};

const VALID_NUCLEOTIDES = new Set(['A', 'T', 'G', 'C', 'U']);

export function normalizeNucleotide(raw: string): string {
  const ch = (raw ?? '').trim().slice(-1);
  if (!ch) return '';
  const mapped = NUCLEOTIDE_MAP[ch] ?? ch.toUpperCase();
  return VALID_NUCLEOTIDES.has(mapped) ? mapped : '';
}

export function normalizeSequence(raw: string): string {
  return Array.from(raw ?? '')
    .map((ch) => normalizeNucleotide(ch))
    .filter(Boolean)
    .join('');
}

const LATIN_TO_CYRILLIC: Record<string, string> = {
  A: 'А', B: 'В', C: 'С', E: 'Е', H: 'Н', I: 'І', K: 'К',
  M: 'М', O: 'О', P: 'Р', T: 'Т', X: 'Х', Y: 'У',
};

export function normalizeText(raw: string): string {
  return Array.from((raw ?? '').toUpperCase())
    .map((ch) => LATIN_TO_CYRILLIC[ch] ?? ch)
    .filter((ch) => /[\p{L}\p{N}]/u.test(ch))
    .join('');
}

export function normalizeNumber(raw: string): string {
  const digits = (raw ?? '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  return String(Number.parseInt(digits, 10));
}

export function normalizeOption(raw: string): string {
  return (raw ?? '').trim().toLowerCase();
}

const SUPERSCRIPT_MAP: Record<string, string> = {
  'ᴰ': 'D', 'ᵈ': 'd', 'ᴴ': 'H', 'ʰ': 'h', 'ᴬ': 'A', 'ᵃ': 'a',
  Н: 'H', н: 'h',
};

const ALLELE_LETTERS = new Set(['D', 'd', 'H', 'h', 'A', 'a']);

function alleleRank(allele: string): number {
  const chromosome = allele[0] === 'X' ? 0 : 10;
  const letter = allele[1];
  if (!letter) return chromosome + 5;
  return chromosome + (letter === letter.toUpperCase() ? 1 : 2);
}

export function normalizeGenotype(raw: string): string {
  const cleaned = Array.from(raw ?? '')
    .map((ch) => SUPERSCRIPT_MAP[ch] ?? ch)
    .map((ch) => (ch === 'Х' || ch === 'х' ? 'X' : ch))
    .map((ch) => (ch === 'У' || ch === 'у' ? 'Y' : ch))
    .map((ch) => (ch === 'x' ? 'X' : ch === 'y' ? 'Y' : ch))
    .filter((ch) => ch === 'X' || ch === 'Y' || ALLELE_LETTERS.has(ch))
    .join('');

  const alleles: string[] = [];
  for (let i = 0; i < cleaned.length; i += 1) {
    const base = cleaned[i];
    if (base !== 'X' && base !== 'Y') continue;
    const next = cleaned[i + 1];
    if (next && ALLELE_LETTERS.has(next)) {
      alleles.push(base + next);
      i += 1;
    } else {
      alleles.push(base);
    }
  }

  return alleles.sort((a, b) => alleleRank(a) - alleleRank(b) || a.localeCompare(b)).join('');
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  А: 'A', В: 'B', С: 'C', Е: 'E', Н: 'H', І: 'I', К: 'K', М: 'M', О: 'O', Р: 'P', Т: 'T', Х: 'X', У: 'Y',
};

export function normalizeLatin(raw: string): string {
  return Array.from((raw ?? '').toUpperCase())
    .map((ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
    .filter((ch) => /[A-Z]/.test(ch))
    .join('');
}

export function normalizeByKind(kind: AnswerKind, raw: string): string {
  switch (kind) {
    case 'nucleotide':
      return normalizeNucleotide(raw);
    case 'number':
      return normalizeNumber(raw);
    case 'genotype':
      return normalizeGenotype(raw);
    case 'option':
      return normalizeOption(raw);
    case 'latin':
      return normalizeLatin(raw);
    case 'text':
    default:
      return normalizeText(raw);
  }
}

const SUPERSCRIPT_OUT: Record<string, string> = { D: 'ᴰ', d: 'ᵈ', H: 'ᴴ', h: 'ʰ', A: 'ᴬ', a: 'ᵃ' };

export function formatGenotype(raw: string): string {
  return normalizeGenotype(raw).replace(/X([A-Za-z])/g, (_, letter: string) => `X${SUPERSCRIPT_OUT[letter] ?? letter}`);
}
