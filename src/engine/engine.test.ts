import { describe, it, expect } from 'vitest';

import quest from '../content/quest.uk.json';
import {
  formatGenotype,
  normalizeGenotype,
  normalizeLatin,
  normalizeNucleotide,
  normalizeNumber,
  normalizeSequence,
  normalizeText,
} from './normalize.ts';
import { complementBase, complementDna, splitCodons, transcribe, translate, translateCodon } from './genetics.ts';
import { assembleStrand, blankPositions, parseMaskedStrand } from './sequence.ts';
import { buildPunnett, gametes, isAffected, probabilityUnaffected } from './punnett.ts';
import { applySpreadDelta, minutesElapsed } from './spread.ts';
import { assembleKey, freezeSecondsLeft, isCryoComplete } from './cryo.ts';
import { checkAnswer, fingerprint } from './answers.ts';
import { sha256Hex } from './sha256.ts';

const codons = quest.geneticCode.codons as Record<string, string>;
const answers = quest.answers as Record<string, string>;

const CODING = 'ATGTCTCCTATTAAAGAATAA';
const TEMPLATE = 'TACAGAGGATAATTTCTTATT';
const MRNA = 'AUGUCUCCUAUUAAAGAAUAA';

describe('sha256', () => {
  it('дає відомі контрольні значення', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('обробляє кирилицю як UTF-8', () => {
    expect(sha256Hex('РЕТРО')).toHaveLength(64);
    expect(sha256Hex('РЕТРО')).not.toBe(sha256Hex('PETPO'));
  });
});

describe('нормалізація нуклеотидів', () => {
  it('приймає латиницю в будь-якому регістрі', () => {
    expect(normalizeNucleotide('a')).toBe('A');
    expect(normalizeNucleotide(' g ')).toBe('G');
  });

  it('переводить кирилицю в латиницю', () => {
    expect(normalizeNucleotide('А')).toBe('A');
    expect(normalizeNucleotide('Т')).toBe('T');
    expect(normalizeNucleotide('С')).toBe('C');
    expect(normalizeNucleotide('Ц')).toBe('C');
    expect(normalizeNucleotide('Г')).toBe('G');
    expect(normalizeNucleotide('У')).toBe('U');
  });

  it('відкидає сторонні символи й чистить послідовність', () => {
    expect(normalizeNucleotide('X')).toBe('');
    expect(normalizeNucleotide('5')).toBe('');
    expect(normalizeSequence('ATG TCT-CCT')).toBe('ATGTCTCCT');
  });
});

describe('нормалізація кодів складових', () => {
  it('SPIKE приймається латиницею в будь-якому регістрі', () => {
    expect(normalizeLatin('spike')).toBe('SPIKE');
    expect(normalizeLatin(' S-P-I-K-E ')).toBe('SPIKE');
    expect(checkAnswer(answers, 'lab1.component', 'latin', 'Spike')).toBe(true);
    expect(checkAnswer(answers, 'lab1.component', 'latin', 's p i k e')).toBe(true);
  });

  it('SPIKE з кириличними двійниками теж зараховується', () => {
    expect(checkAnswer(answers, 'lab1.component', 'latin', 'SРІКЕ')).toBe(true);
  });

  it('пароль українськими назвами не проходить', () => {
    expect(checkAnswer(answers, 'lab1.component', 'latin', 'СПІЛГ')).toBe(false);
    expect(checkAnswer(answers, 'lab1.component', 'latin', 'SPIK')).toBe(false);
  });

  it('РЕТРО приймається кирилицею, латинські двійники зводяться до кирилиці', () => {
    expect(normalizeText('ретро')).toBe('РЕТРО');
    expect(checkAnswer(answers, 'lab2.component', 'text', 'Ретро')).toBe(true);
    expect(checkAnswer(answers, 'lab2.component', 'text', 'PETPO')).toBe(true);
    expect(checkAnswer(answers, 'lab2.component', 'text', 'РЕТРОВІРУС')).toBe(false);
  });

  it('читає число зі знаком відсотка і пробілами', () => {
    expect(normalizeNumber(' 75 % ')).toBe('75');
    expect(normalizeNumber('075')).toBe('75');
    expect(normalizeNumber('нема')).toBe('');
  });
});

describe('генотипи Xᴴ / Xʰ', () => {
  const canonical = normalizeGenotype('XᴴXʰ');

  it('зводить різні записи до канонічного', () => {
    expect(normalizeGenotype('XʰXᴴ')).toBe(canonical);
    expect(normalizeGenotype('X^H X^h')).toBe(canonical);
    expect(normalizeGenotype('XHXh')).toBe(canonical);
    expect(normalizeGenotype('ХhХH')).toBe(canonical);
    expect(normalizeGenotype('XНXн')).toBe(canonical);
  });

  it('відрізняє носійку від вразливої і від захищеної', () => {
    expect(canonical).not.toBe(normalizeGenotype('XʰXʰ'));
    expect(canonical).not.toBe(normalizeGenotype('XᴴXᴴ'));
    expect(normalizeGenotype('YXᴴ')).toBe(normalizeGenotype('XᴴY'));
  });

  it('показує генотип з верхніми індексами', () => {
    expect(formatGenotype('XhXH')).toBe('XᴴXʰ');
    expect(formatGenotype('X^h Y')).toBe('XʰY');
  });

  it('старий запис Xᴰ / Xᵈ теж розуміється', () => {
    expect(normalizeGenotype('XᵈXᴰ')).toBe(normalizeGenotype('XDXd'));
  });

  it('приймає відповіді рівня 5 у різних записах', () => {
    expect(checkAnswer(answers, 'mendel.mother', 'genotype', 'XʰXᴴ')).toBe(true);
    expect(checkAnswer(answers, 'mendel.mother', 'genotype', 'X^H X^h')).toBe(true);
    expect(checkAnswer(answers, 'mendel.mother', 'genotype', 'XHXH')).toBe(false);
    expect(checkAnswer(answers, 'mendel.father', 'genotype', 'XHY')).toBe(true);
    expect(checkAnswer(answers, 'punnett.3', 'genotype', 'X^h Y')).toBe(true);
  });
});

describe('комплементарність і транскрипція', () => {
  it('утворює пари A-T і G-C', () => {
    expect(complementBase('A')).toBe('T');
    expect(complementBase('G')).toBe('C');
  });

  it('добудовує матричний ланцюг гена шипового білка', () => {
    expect(complementDna(CODING)).toBe(TEMPLATE);
    expect(complementDna(TEMPLATE)).toBe(CODING);
  });

  it('зчитує іРНК з матричного ланцюга', () => {
    expect(transcribe(TEMPLATE)).toBe(MRNA);
    expect(transcribe(MRNA)).not.toContain('T');
  });
});

describe('трансляція', () => {
  it('містить усі 64 кодони', () => {
    expect(Object.keys(codons)).toHaveLength(64);
  });

  it('знає старт- і стоп-кодони', () => {
    expect(translateCodon('AUG', codons)).toBe('Met');
    expect(translateCodon('UAA', codons)).toBe('Stop');
  });

  it('розбиває іРНК на 7 триплетів', () => {
    expect(splitCodons(MRNA)).toEqual(['AUG', 'UCU', 'CCU', 'AUU', 'AAA', 'GAA', 'UAA']);
  });

  it('перекладає білок: Мет – Сер – Про – Іле – Ліз – Глу – СТОП', () => {
    expect(translate(MRNA, codons)).toEqual(['Met', 'Ser', 'Pro', 'Ile', 'Lys', 'Glu', 'Stop']);
  });

  it('однолітерні коди після старту дають SPIKE', () => {
    const letters = Object.fromEntries(quest.geneticCode.aminoAcids.map((a) => [a.code, a.letter]));
    const word = translate(MRNA, codons)
      .slice(1, -1)
      .map((code) => letters[code])
      .join('');
    expect(word).toBe('SPIKE');
    expect(checkAnswer(answers, 'lab1.component', 'latin', word)).toBe(true);
  });

  it('кожна амінокислота має однолітерний код', () => {
    for (const amino of quest.geneticCode.aminoAcids) expect(amino.letter).toMatch(/^[A-Z*]$/);
  });

  it('відповіді на слоти амінокислот збігаються з трансляцією', () => {
    const chain = translate(MRNA, codons).slice(1, -1);
    chain.forEach((code, index) => {
      expect(checkAnswer(answers, `amino.${index + 2}`, 'option', code)).toBe(true);
    });
  });
});

describe('маски ланцюгів рівня 1', () => {
  const coding = parseMaskedStrand(quest.lab1.step1.codingMasked);
  const template = parseMaskedStrand(quest.lab1.step1.templateMasked);
  const rna = parseMaskedStrand(quest.lab1.step2.rnaMasked);

  it('має сім кодонів по три нуклеотиди', () => {
    expect(coding).toHaveLength(7);
    expect(template).toHaveLength(7);
    expect(rna).toHaveLength(7);
    expect(coding.every((codon) => codon.cells.length === 3)).toBe(true);
  });

  it('пропуски на заявлених позиціях: 8 пошкоджених нуклеотидів у ДНК', () => {
    expect(blankPositions(coding)).toEqual([5, 8, 13, 17]);
    expect(blankPositions(template)).toEqual([3, 10, 15, 20]);
  });

  it('у іРНК дано перші 2 кодони', () => {
    expect(blankPositions(rna)).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
  });

  it('правильні відповіді збирають повні комплементарні ланцюги', () => {
    const filledCoding = assembleStrand(coding, { 5: 'C', 8: 'C', 13: 'A', 17: 'A' });
    const filledTemplate = assembleStrand(template, { 3: 'C', 10: 'T', 15: 'T', 20: 'T' });
    expect(filledCoding).toBe(CODING);
    expect(filledTemplate).toBe(TEMPLATE);
    expect(complementDna(filledCoding)).toBe(filledTemplate);
  });

  it('відбитки пропусків відповідають ланцюгам', () => {
    for (const p of blankPositions(coding)) {
      expect(checkAnswer(answers, `dna.coding.${p}`, 'nucleotide', CODING[p - 1])).toBe(true);
    }
    for (const p of blankPositions(template)) {
      expect(checkAnswer(answers, `dna.template.${p}`, 'nucleotide', TEMPLATE[p - 1])).toBe(true);
    }
    for (const p of blankPositions(rna)) {
      expect(checkAnswer(answers, `rna.${p}`, 'nucleotide', MRNA[p - 1])).toBe(true);
    }
  });
});

describe('решітка Пеннета і ймовірність', () => {
  it('дає гамети батьків', () => {
    expect(gametes('XᴴXʰ')).toEqual(['XH', 'Xh']);
    expect(gametes('XᴴY')).toEqual(['XH', 'Y']);
  });

  it('будує решітку для носійки і захищеного батька', () => {
    expect(buildPunnett('XᴴXʰ', 'XᴴY')).toEqual(
      ['XᴴXᴴ', 'XᴴY', 'XᴴXʰ', 'XʰY'].map((genotype) => normalizeGenotype(genotype)),
    );
  });

  it('визначає, хто має вразливість', () => {
    expect(isAffected('XʰY')).toBe(true);
    expect(isAffected('XʰXʰ')).toBe(true);
    expect(isAffected('XᴴXʰ')).toBe(false);
    expect(isAffected('XᴴY')).toBe(false);
  });

  it('дає 75 відсотків без вразливості', () => {
    expect(probabilityUnaffected(buildPunnett('XᴴXʰ', 'XᴴY'))).toBe(75);
    expect(checkAnswer(answers, 'mendel.probability', 'number', '75%')).toBe(true);
    expect(checkAnswer(answers, 'mendel.probability', 'number', '50')).toBe(false);
  });

  it('перевіряє інші типові схрещування', () => {
    expect(probabilityUnaffected(buildPunnett('XᴴXᴴ', 'XʰY'))).toBe(100);
    expect(probabilityUnaffected(buildPunnett('XᴴXʰ', 'XʰY'))).toBe(50);
  });
});

describe('поширення інфекції', () => {
  const config = quest.spread;

  it('стартує з 8% і додає 5% за хибну відповідь', () => {
    expect(config.start).toBe(8);
    const result = applySpreadDelta(40, config.perWrong, config);
    expect(result).toEqual({ value: 45, critical: false });
  });

  it('на критичному рівні скидається до 80%, а не програє', () => {
    const result = applySpreadDelta(98, config.perWrong, config);
    expect(result.critical).toBe(true);
    expect(result.value).toBe(80);
    expect(config.criticalPenalty).toBe(3);
  });

  it('не опускається нижче нуля', () => {
    expect(applySpreadDelta(5, -config.bonusRelief, config).value).toBe(0);
  });

  it('рахує повні хвилини', () => {
    const base = 1_000_000;
    expect(minutesElapsed(base, base + 59_000)).toBe(0);
    expect(minutesElapsed(base, base + 185_000)).toBe(3);
  });
});

describe('ключ кріокамери', () => {
  const order = quest.lab4.cards.map((card) => card.id);

  it('складає ключ 435216 у порядку карток', () => {
    const solved = { a: 4, b: 3, c: 5, d: 2, e: 1, f: 6 };
    expect(assembleKey(order, solved).join('')).toBe('435216');
    expect(isCryoComplete(order, solved)).toBe(true);
  });

  it('лишає порожні позиції для нерозгаданих карток', () => {
    expect(assembleKey(order, { a: 4, b: 3, c: null, d: null, e: null, f: null })).toEqual(['4', '3', '', '', '', '']);
  });

  it('рахує секунди заморозки', () => {
    const now = 1_000_000;
    expect(freezeSecondsLeft(now + 30_000, now)).toBe(30);
    expect(freezeSecondsLeft(0, now)).toBe(0);
  });

  it('бонус: мРНК працює в цитоплазмі', () => {
    expect(checkAnswer(answers, 'cryo.bonus', 'option', 'cytoplasm')).toBe(true);
    expect(checkAnswer(answers, 'cryo.bonus', 'option', 'nucleus')).toBe(false);
  });
});

describe('звірка відповідей за відбитками', () => {
  it('у контенті немає відповідей відкритим текстом', () => {
    const raw = JSON.stringify(quest);
    expect(raw).not.toContain('SPIKE-');
    expect(raw).not.toContain('435216');
    expect(raw).not.toContain('РЕТРО');
    expect(Object.values(answers).every((hash) => /^[0-9a-f]{64}$/.test(hash))).toBe(true);
  });

  it('солить відбиток ідентифікатором поля', () => {
    expect(fingerprint('rna.7', 'C')).not.toBe(fingerprint('rna.8', 'C'));
  });

  it('відхиляє порожнє введення і невідомі поля', () => {
    expect(checkAnswer(answers, 'rna.7', 'nucleotide', '')).toBe(false);
    expect(checkAnswer(answers, 'немає.такого', 'text', 'РЕТРО')).toBe(false);
  });
});
