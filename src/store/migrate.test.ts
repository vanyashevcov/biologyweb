import { describe, it, expect } from 'vitest';

import { migrateState, type MigrationDefaults } from './migrate';

const defaults: MigrationDefaults = {
  settings: { spreadEnabled: true, hintsPerLevel: 2, freezeSeconds: 30, twoLessons: false },
  labs: {
    lab1: { dna: {}, dnaDone: false },
    lab2: { placed: {}, sortDone: false, group: '', groupDone: false, relative: '', relativeDone: false },
    lab3: { match: {}, question: '', questionDone: false },
    lab4: { picks: {} },
    lab5: { mother: '', father: '' },
  },
};

describe('міграція прогресу toxin → spread', () => {
  const saved = {
    team: 'Спіраль',
    toxin: 37,
    peakToxin: 52,
    components: ['ФАГ', 'Т4', '', '', ''],
    settings: { toxinEnabled: false, hintsPerLevel: 3, freezeSeconds: 20, twoLessons: true },
    lab2: { placed: { t4: 'dna|bacteria' }, sortDone: true, choice: 't4' },
    levels: { 1: { done: true } },
  };

  it('переносить лічильник і пік у нові поля, нічого не губить', () => {
    const state = migrateState(saved, 2, defaults);
    expect(state.spread).toBe(37);
    expect(state.peakSpread).toBe(52);
    expect('toxin' in state).toBe(false);
    expect('peakToxin' in state).toBe(false);
    expect(state.team).toBe('Спіраль');
    expect(state.components).toEqual(['ФАГ', 'Т4', '', '', '']);
    expect(state.levels).toEqual({ 1: { done: true } });
  });

  it('переносить налаштування викладача', () => {
    const settings = migrateState(saved, 2, defaults).settings as Record<string, unknown>;
    expect(settings.spreadEnabled).toBe(false);
    expect('toxinEnabled' in settings).toBe(false);
    expect(settings.hintsPerLevel).toBe(3);
    expect(settings.twoLessons).toBe(true);
  });

  it('доповнює стан рівнів новими полями, зберігаючи старі', () => {
    const lab2 = migrateState(saved, 2, defaults).lab2 as Record<string, unknown>;
    expect(lab2.placed).toEqual({ t4: 'dna|bacteria' });
    expect(lab2.sortDone).toBe(true);
    expect(lab2.group).toBe('');
    expect(lab2.relativeDone).toBe(false);
  });

  it('додає порожній список переглянутих відео', () => {
    expect(migrateState(saved, 2, defaults).videosSeen).toEqual({});
  });

  it('не чіпає вже нового стану', () => {
    const state = migrateState({ spread: 12, videosSeen: { lab1: true } }, 3, defaults);
    expect(state.spread).toBe(12);
    expect(state.videosSeen).toEqual({ lab1: true });
  });

  it('витримує порожнє або зіпсоване сховище', () => {
    expect(migrateState(null, 2, defaults).settings).toEqual(defaults.settings);
    expect(migrateState('зламано', 1, defaults).lab5).toEqual(defaults.labs.lab5);
  });
});
