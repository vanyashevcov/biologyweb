import { describe, it, expect } from 'vitest';

import quest from '../content/quest.uk.json';
import { checkAnswer } from './answers.ts';
import { freezeSecondsLeft } from './cryo.ts';
import { daysToPeak, peakOf, peakRatio, smoothPath, type CurvePoint } from './immunology.ts';
import { fillTemplate, formatClock, makeEntry, unreadCount } from './journal.ts';
import { captionAt, embedUrl, parseVideoSource, shouldShowIntro } from './video.ts';
import {
  bandFor,
  cappedLoss,
  gradeFor,
  levelScore,
  lostOnStep,
  penaltyFor,
  pluralUk,
  summarizeLosses,
  type Loss,
  type StepDef,
} from './scoring.ts';
import {
  cellKey,
  checkPlacement,
  isSortComplete,
  otherOption,
  parseCellKey,
  trayItems,
  type SortCell,
} from './viruses.ts';

const answers = quest.answers as Record<string, string>;

describe('сортування вірусів', () => {
  const specimens = quest.lab2.sort.specimens;
  const ids = specimens.map((specimen) => specimen.id);
  const key: Record<string, SortCell> = {
    t4: { acid: 'dna', host: 'bacteria' },
    ms2: { acid: 'rna', host: 'bacteria' },
    tmv: { acid: 'rna', host: 'plants' },
    camv: { acid: 'dna', host: 'plants' },
    adeno: { acid: 'dna', host: 'animals' },
    herpes: { acid: 'dna', host: 'animals' },
    flu: { acid: 'rna', host: 'animals' },
    hiv: { acid: 'rna', host: 'animals' },
  };

  it('має вісім зразків і матрицю 2×3', () => {
    expect(ids).toHaveLength(8);
    expect(quest.lab2.sort.rows).toHaveLength(2);
    expect(quest.lab2.sort.cols).toHaveLength(3);
  });

  it('приймає правильне розміщення кожного зразка', () => {
    for (const id of ids) expect(checkPlacement(answers, id, key[id]).ok).toBe(true);
  });

  it('окремо ловить хибну кислоту і хибного хазяїна', () => {
    expect(checkPlacement(answers, 'flu', { acid: 'dna', host: 'animals' })).toEqual({
      acidOk: false,
      hostOk: true,
      ok: false,
    });
    expect(checkPlacement(answers, 'ms2', { acid: 'rna', host: 'animals' })).toEqual({
      acidOk: true,
      hostOk: false,
      ok: false,
    });
  });

  it('не всі фаги мають ДНК: MS2 містить РНК', () => {
    expect(checkPlacement(answers, 'ms2', { acid: 'dna', host: 'bacteria' }).acidOk).toBe(false);
  });

  it('знає, коли лоток порожній', () => {
    const placed: Record<string, string> = Object.fromEntries(ids.map((id) => [id, cellKey(key[id])]));
    expect(isSortComplete(ids, placed)).toBe(true);
    expect(trayItems(specimens, placed)).toHaveLength(0);
    const partial = { ...placed, hiv: '' };
    expect(isSortComplete(ids, partial)).toBe(false);
    expect(trayItems(specimens, partial).map((s) => s.id)).toEqual(['hiv']);
  });

  it('розбирає ключ клітинки і підказує протилежну кислоту', () => {
    expect(parseCellKey(cellKey({ acid: 'rna', host: 'plants' }))).toEqual({ acid: 'rna', host: 'plants' });
    expect(otherOption(['dna', 'rna'], 'dna')).toBe('rna');
  });

  it('«Химера» — ретровірус, найближчий родич — ВІЛ, а не грип', () => {
    expect(checkAnswer(answers, 'virus.group', 'option', 'retro')).toBe(true);
    expect(checkAnswer(answers, 'virus.group', 'option', 'phage')).toBe(false);
    expect(checkAnswer(answers, 'virus.relative', 'option', 'hiv')).toBe(true);
    expect(checkAnswer(answers, 'virus.relative', 'option', 'flu')).toBe(false);
  });

  it('паспорт «Химери» узгоджений з ВІЛ у матриці: РНК, людина', () => {
    expect(checkPlacement(answers, 'hiv', { acid: 'rna', host: 'animals' }).ok).toBe(true);
  });
});

describe('імунологія', () => {
  const chart = quest.lab3.chart;
  const primary = chart.primary as CurvePoint[];
  const secondary = chart.secondary as CurvePoint[];
  const revaccination = chart.events[1].day;

  it('первинна відповідь досягає піку на 14-ту добу, вторинна — на 33-тю', () => {
    expect(peakOf(primary)[0]).toBe(14);
    expect(peakOf(secondary)[0]).toBe(33);
    expect(revaccination).toBe(28);
  });

  it('вторинний пік приблизно втричі вищий', () => {
    const ratio = peakRatio(primary, secondary);
    expect(ratio).toBeGreaterThanOrEqual(2.8);
    expect(ratio).toBeLessThanOrEqual(3.2);
  });

  it('дані графіка сходяться з ключем компонента', () => {
    const days = daysToPeak(revaccination, secondary);
    expect(days).toBe(5);
    expect(checkAnswer(answers, 'lab3.component', 'number', String(days))).toBe(true);
  });

  it('зіставляє ситуації із засобами', () => {
    expect(checkAnswer(answers, 'immuno.nurse', 'option', 'mrna')).toBe(true);
    expect(checkAnswer(answers, 'immuno.patient', 'option', 'serum')).toBe(true);
    expect(checkAnswer(answers, 'immuno.student', 'option', 'live')).toBe(true);
  });

  it('вакцина пацієнтові в реанімації — помилка, інактивована вакцина — відволікач', () => {
    expect(checkAnswer(answers, 'immuno.patient', 'option', 'mrna')).toBe(false);
    expect(checkAnswer(answers, 'immuno.nurse', 'option', 'serum')).toBe(false);
    for (const id of ['nurse', 'patient', 'student']) {
      expect(checkAnswer(answers, `immuno.${id}`, 'option', 'inactivated')).toBe(false);
    }
  });

  it('ген антигену в ліпідній оболонці — це мРНК-вакцина', () => {
    expect(checkAnswer(answers, 'immuno.vaccine', 'option', 'mrna')).toBe(true);
    expect(checkAnswer(answers, 'immuno.vaccine', 'option', 'toxoid')).toBe(false);
  });

  it('будує згладжений шлях, що не виходить за пік', () => {
    const d = smoothPath(secondary, (day) => day * 10, (level) => 100 - level);
    expect(d.startsWith('M280.0 89.0')).toBe(true);
    const ys = Array.from(d.matchAll(/(-?\d+\.\d) (-?\d+\.\d)/g)).map((m) => Number(m[2]));
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(20);
  });
});

describe('бали і шкала', () => {
  const steps = quest.labs[4].steps as StepDef[];
  const probability = steps.find((step) => step.id === 'probability') as StepDef;

  it('кожна лабораторія вартує 20 балів', () => {
    for (const lab of quest.labs) {
      const sum = (lab.steps as StepDef[]).reduce((acc, step) => acc + step.points, 0);
      expect(sum).toBe(quest.scoring.perLevel);
    }
  });

  it('крок не забирає більше, ніж вартий', () => {
    expect(cappedLoss(6, 5, 1)).toBe(1);
    expect(cappedLoss(6, 6, 1)).toBe(0);
    expect(cappedLoss(4, 3, 2)).toBe(1);
  });

  it('спроби ймовірності дають 8, 5, 2 бали', () => {
    const losses: Loss[] = [];
    const earned: number[] = [];
    for (let attempt = 0; attempt < 3; attempt += 1) {
      earned.push(probability.points - lostOnStep(losses, 'probability'));
      losses.push({ step: 'probability', points: penaltyFor(probability, losses), reason: 'attempt' });
    }
    expect(earned).toEqual([8, 5, 2]);
    expect(lostOnStep(losses, 'probability')).toBe(8);
  });

  it('заморозки кріокамери знімають по 2, але не більше 4 за мікрофото', () => {
    const card = (quest.labs[3].steps as StepDef[])[0];
    const losses: Loss[] = [];
    for (let i = 0; i < 3; i += 1) {
      losses.push({ step: card.id, points: penaltyFor(card, losses), reason: 'freeze' });
    }
    expect(losses.map((loss) => loss.points)).toEqual([2, 2, 0]);
  });

  it('рахує бали рівня з бонусом у межах 0–20', () => {
    const losses: Loss[] = [
      { step: 'a', points: 2, reason: 'freeze' },
      { step: 'b', points: 2, reason: 'freeze' },
      { step: 'hint', points: 2, reason: 'hint' },
    ];
    expect(levelScore(20, losses, 2)).toBe(16);
    expect(levelScore(20, [], 2)).toBe(20);
    expect(levelScore(20, [{ step: 'x', points: 30, reason: 'wrong' }])).toBe(0);
  });

  it('групує втрати за причиною', () => {
    const summary = summarizeLosses([
      { step: 'dna', points: 1, reason: 'wrong' },
      { step: 'rna', points: 1, reason: 'wrong' },
      { step: 'hint', points: 2, reason: 'hint' },
      { step: 'dna', points: 0, reason: 'wrong' },
    ]);
    expect(summary).toEqual([
      { reason: 'wrong', count: 2, points: 2 },
      { reason: 'hint', count: 1, points: 2 },
    ]);
  });

  it('переводить бали в 12-бальну шкалу', () => {
    const scale = quest.scoring.scale;
    expect(gradeFor(84, scale).grade).toBe(11);
    expect(gradeFor(91, scale).grade).toBe(11);
    expect(gradeFor(92, scale).grade).toBe(12);
    expect(gradeFor(100, scale).grade).toBe(12);
    expect(gradeFor(0, scale).grade).toBe(1);
    expect(gradeFor(50, scale).grade).toBe(6);
    expect(bandFor(11, quest.scoring.bands)?.name).toBe('Високий');
    expect(bandFor(5, quest.scoring.bands)?.name).toBe('Середній');
  });

  it('шкала покриває кожен бал від 0 до 100 рівно один раз', () => {
    for (let score = 0; score <= 100; score += 1) {
      const rows = quest.scoring.scale.filter((row) => score >= row.min && score <= row.max);
      expect(rows).toHaveLength(1);
    }
  });

  it('узгоджує слово «бал» з числом', () => {
    const forms = quest.ui.pointsForms;
    expect(`84 ${pluralUk(84, forms)}`).toBe('84 бали');
    expect(`81 ${pluralUk(81, forms)}`).toBe('81 бал');
    expect(`85 ${pluralUk(85, forms)}`).toBe('85 балів');
    expect(`12 ${pluralUk(12, forms)}`).toBe('12 балів');
    expect(`100 ${pluralUk(100, forms)}`).toBe('100 балів');
  });
});

describe('заморозка', () => {
  it('триває задану кількість секунд', () => {
    const now = 5_000_000;
    const until = now + quest.teacher.defaults.freezeSeconds * 1000;
    expect(freezeSecondsLeft(until, now)).toBe(30);
    expect(freezeSecondsLeft(until, until - 500)).toBe(1);
    expect(freezeSecondsLeft(until, until)).toBe(0);
  });
});

describe('журнал ГЕЛІКСА', () => {
  it('підставляє значення в шаблони', () => {
    expect(fillTemplate(quest.journal.component, { lab: 'Центрифуга рішень', num: 1, value: 'X', score: 18 })).toBe(
      'Центрифуга рішень: складова 1 «X» у штативі. Бали рівня: 18 з 20.',
    );
    expect(fillTemplate('{a} і {b}', { a: 1 })).toBe('1 і {b}');
  });

  it('рахує непрочитані записи', () => {
    const entries = [1, 2, 3].map((n) => makeEntry('запис {n}', { n }, 'info', n));
    expect(entries[2].text).toBe('запис 3');
    expect(unreadCount(entries, 0)).toBe(3);
    expect(unreadCount(entries, 3)).toBe(0);
    expect(unreadCount(entries, 5)).toBe(0);
  });

  it('форматує час як ГГ:ХХ', () => {
    expect(formatClock(new Date(2026, 0, 1, 9, 5).getTime())).toBe('09:05');
  });
});

describe('вступне відео рівня', () => {
  it('розпізнає YouTube, Vimeo і файл', () => {
    expect(parseVideoSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({ kind: 'youtube', id: 'dQw4w9WgXcQ' });
    expect(parseVideoSource('https://youtu.be/dQw4w9WgXcQ')).toEqual({ kind: 'youtube', id: 'dQw4w9WgXcQ' });
    expect(parseVideoSource('https://vimeo.com/76979871')).toEqual({ kind: 'vimeo', id: '76979871' });
    expect(parseVideoSource('/video/lab1.mp4')).toEqual({ kind: 'file', src: 'video/lab1.mp4' });
    expect(parseVideoSource('')).toEqual({ kind: 'none' });
    expect(parseVideoSource('   ')).toEqual({ kind: 'none' });
  });

  it('показує відео при першому вході, якщо воно задане', () => {
    expect(shouldShowIntro({ video: 'video/lab1.mp4', text: 'x' }, {}, 'lab1')).toBe(true);
  });

  it('пропускає переглянуте відео', () => {
    expect(shouldShowIntro({ video: 'video/lab1.mp4' }, { lab1: true }, 'lab1')).toBe(false);
  });

  it('не показує нічого, якщо поле відео порожнє', () => {
    expect(shouldShowIntro({ video: '' }, {}, 'lab1')).toBe(false);
    expect(shouldShowIntro(undefined, {}, 'lab1')).toBe(false);
  });

  it('у контенті кожен рівень, брифінг і фінал мають блок intro', () => {
    for (const lab of quest.labs) expect(typeof lab.intro.video).toBe('string');
    expect(typeof quest.briefing.intro.video).toBe('string');
    expect(typeof quest.vault.intro.video).toBe('string');
  });

  it('вмикає субтитри і вимикає автозапуск за потреби', () => {
    const source = parseVideoSource('https://youtu.be/dQw4w9WgXcQ');
    expect(embedUrl(source, true)).toContain('cc_load_policy=1');
    expect(embedUrl(source, true)).toContain('autoplay=1');
    expect(embedUrl(source, false)).toContain('autoplay=0');
  });

  it('знаходить репліку субтитрів за часом', () => {
    const cues = [
      { start: 0, end: 2, text: 'Перша' },
      { start: 2, end: 4.5, text: 'Друга' },
    ];
    expect(captionAt(cues, 1)).toBe('Перша');
    expect(captionAt(cues, 2)).toBe('Друга');
    expect(captionAt(cues, 5)).toBe('');
  });
});
