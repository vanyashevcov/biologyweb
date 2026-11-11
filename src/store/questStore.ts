import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import quest from '../content/quest.uk.json';
import { migrateState } from './migrate';
import {
  applySpreadDelta,
  levelScore,
  makeEntry,
  minutesElapsed,
  penaltyFor,
  type JournalEntry,
  type JournalTone,
  type Loss,
  type LossReason,
  type StepDef,
} from '../engine';

export type LabNum = 1 | 2 | 3 | 4 | 5;
export type LabStatus = 'locked' | 'open' | 'done';

export const LAB_NUMS: LabNum[] = [1, 2, 3, 4, 5];

export interface Notice {
  text: string;
  points: number;
  tone: 'bad' | 'info';
}

export interface CriticalNotice {
  message: string;
  hint: string;
}

interface LevelState {
  done: boolean;
  hintsTaken: number;
  losses: Loss[];
  bonus: number;
  notice: Notice | null;
  lastHint: string | null;
}

type Checked = Record<string, string>;

export interface Lab1State {
  dna: Record<string, string>;
  dnaDone: boolean;
  rna: Record<string, string>;
  rnaDone: boolean;
  amino: Record<string, string>;
  aminoDone: boolean;
  checked: Checked;
}

export interface Lab2State {
  placed: Record<string, string>;
  sortDone: boolean;
  group: string;
  groupDone: boolean;
  relative: string;
  relativeDone: boolean;
}

export interface Lab3State {
  match: Record<string, string>;
  matched: Record<string, boolean>;
  question: string;
  questionDone: boolean;
}

export interface Lab4State {
  picks: Record<string, string>;
  solved: Record<string, number | null>;
  frozenUntil: Record<string, number>;
  bonusChoice: string;
  bonusAnswered: boolean;
  bonusCorrect: boolean;
}

export interface Lab5State {
  mother: string;
  father: string;
  genotypesDone: boolean;
  punnett: string[];
  punnettDone: boolean;
  attempts: number;
  checked: Checked;
}

export interface Settings {
  spreadEnabled: boolean;
  soundEnabled: boolean;
  hintsPerLevel: number;
  freezeSeconds: number;
  twoLessons: boolean;
}

interface FailOptions {
  reason?: LossReason;
  journal?: string;
  journalVars?: Record<string, string | number>;
}

export interface QuestState {
  team: string;
  startedAt: number | null;
  finishedAt: number | null;
  lastMinuteAt: number;
  pausedAt: number | null;
  pausedMs: number;

  spread: number;
  peakSpread: number;
  critical: CriticalNotice | null;

  journal: JournalEntry[];
  journalSeen: number;
  videosSeen: Record<string, boolean>;
  enteredLabs: Record<string, boolean>;

  components: string[];
  levels: Record<LabNum, LevelState>;
  currentLab: LabNum | null;
  vaultOpen: boolean;
  reflection: string;

  lab1: Lab1State;
  lab2: Lab2State;
  lab3: Lab3State;
  lab4: Lab4State;
  lab5: Lab5State;

  settings: Settings;
  teacherUnlocked: boolean;

  setTeam: (team: string) => void;
  startQuest: () => void;
  tick: () => void;
  enterLab: (lab: LabNum | null) => void;
  markVideoSeen: (key: string) => void;
  fail: (lab: LabNum, step: string, text: string, options?: FailOptions) => number;
  notify: (lab: LabNum, text: string) => void;
  clearNotice: (lab: LabNum) => void;
  takeHint: (lab: LabNum) => string | null;
  addBonus: (lab: LabNum, points: number) => void;
  complete: (lab: LabNum, value: string) => void;
  dismissCritical: () => void;
  markJournalSeen: () => void;
  resumeLessonTwo: () => void;
  synthesize: () => void;

  setLab1: (patch: Partial<Lab1State>) => void;
  setLab2: (patch: Partial<Lab2State>) => void;
  setLab3: (patch: Partial<Lab3State>) => void;
  setLab4: (patch: Partial<Lab4State>) => void;
  setLab5: (patch: Partial<Lab5State>) => void;

  setReflection: (text: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setTeacherUnlocked: (value: boolean) => void;
  resetProgress: () => void;
}

const spreadConfig = quest.spread;
const defaults = quest.teacher.defaults;
const templates = quest.journal;

export function labDef(lab: LabNum) {
  return quest.labs[lab - 1];
}

function stepDef(lab: LabNum, step: string): StepDef {
  const found = (labDef(lab).steps as StepDef[]).find((item) => item.id === step);
  return found ?? { id: step, points: quest.scoring.perLevel, penalty: 1 };
}

const entry = (template: string, vars: Record<string, string | number> = {}, tone: JournalTone = 'info') =>
  makeEntry(template, vars, tone, Date.now());

const emptyLevel = (): LevelState => ({
  done: false,
  hintsTaken: 0,
  losses: [],
  bonus: 0,
  notice: null,
  lastHint: null,
});

const emptyLevels = (): Record<LabNum, LevelState> => ({
  1: emptyLevel(),
  2: emptyLevel(),
  3: emptyLevel(),
  4: emptyLevel(),
  5: emptyLevel(),
});

const initialProgress = () => ({
  startedAt: null as number | null,
  finishedAt: null as number | null,
  lastMinuteAt: 0,
  pausedAt: null as number | null,
  pausedMs: 0,
  spread: spreadConfig.start,
  peakSpread: spreadConfig.start,
  critical: null as CriticalNotice | null,
  journal: [] as JournalEntry[],
  journalSeen: 0,
  videosSeen: {} as Record<string, boolean>,
  enteredLabs: {} as Record<string, boolean>,
  components: ['', '', '', '', ''],
  levels: emptyLevels(),
  currentLab: null as LabNum | null,
  vaultOpen: false,
  reflection: '',
  lab1: { dna: {}, dnaDone: false, rna: {}, rnaDone: false, amino: {}, aminoDone: false, checked: {} } as Lab1State,
  lab2: { placed: {}, sortDone: false, group: '', groupDone: false, relative: '', relativeDone: false } as Lab2State,
  lab3: { match: {}, matched: {}, question: '', questionDone: false } as Lab3State,
  lab4: {
    picks: {},
    solved: Object.fromEntries(quest.lab4.cards.map((card) => [card.id, null])),
    frozenUntil: {},
    bonusChoice: '',
    bonusAnswered: false,
    bonusCorrect: false,
  } as Lab4State,
  lab5: {
    mother: '',
    father: '',
    genotypesDone: false,
    punnett: ['', '', '', ''],
    punnettDone: false,
    attempts: 0,
    checked: {},
  } as Lab5State,
});

export const useQuest = create<QuestState>()(
  persist(
    (set, get) => {
      const shiftSpread = (delta: number): boolean => {
        const state = get();
        if (!state.settings.spreadEnabled || state.vaultOpen) return false;
        const result = applySpreadDelta(state.spread, delta, spreadConfig);
        const reached = Math.min(spreadConfig.criticalAt, state.spread + delta);
        set({ spread: result.value, peakSpread: Math.max(state.peakSpread, reached) });
        if (result.critical) raiseCritical();
        return result.critical;
      };

      const raiseCritical = () => {
        const state = get();
        const lab = state.currentLab;
        const hints = lab ? labDef(lab).hints : [];
        const level = lab ? state.levels[lab] : null;
        const hint = level ? hints[Math.min(level.hintsTaken, hints.length - 1)] ?? '' : '';
        const target = lab && !state.levels[lab].done ? lab : nextLab(state);
        let points = 0;
        if (target) {
          const targetLevel = state.levels[target];
          const available = levelScore(quest.scoring.perLevel, targetLevel.losses, targetLevel.bonus);
          points = Math.min(spreadConfig.criticalPenalty, available);
          patchLevel(target, {
            losses: [...targetLevel.losses, { step: 'critical', points, reason: 'critical' }],
          });
        }
        set((current) => ({
          critical: { message: spreadConfig.criticalMessage, hint },
          journal: [...current.journal, entry(templates.critical, { points }, 'bad')],
        }));
      };

      const patchLevel = (lab: LabNum, patch: Partial<LevelState>) =>
        set((state) => ({ levels: { ...state.levels, [lab]: { ...state.levels[lab], ...patch } } }));

      return {
        team: '',
        ...initialProgress(),
        settings: { ...defaults },
        teacherUnlocked: false,

        setTeam: (team) => set({ team }),

        startQuest: () => {
          const state = get();
          if (state.startedAt) return;
          const now = Date.now();
          set({
            startedAt: now,
            lastMinuteAt: now,
            journal: [
              entry(templates.start),
              entry(templates.spread, {}, 'bad'),
              entry(templates.enter, { team: state.team || '—' }),
            ],
          });
        },

        tick: () => {
          const state = get();
          const now = Date.now();
          if (!state.startedAt || state.vaultOpen || state.pausedAt) return;
          if (!state.settings.spreadEnabled) {
            set({ lastMinuteAt: now });
            return;
          }
          const minutes = minutesElapsed(state.lastMinuteAt, now);
          if (minutes <= 0) return;
          set({ lastMinuteAt: state.lastMinuteAt + minutes * 60_000 });
          shiftSpread(minutes * spreadConfig.perMinute);
        },

        enterLab: (currentLab) => {
          const state = get();
          if (currentLab === null || state.enteredLabs[currentLab]) {
            set({ currentLab });
            return;
          }
          const notes = (labDef(currentLab).journalEnter ?? []).map((note) =>
            entry(note.text, { spread: Math.round(state.spread) }, note.tone as JournalTone),
          );
          set({
            currentLab,
            enteredLabs: { ...state.enteredLabs, [currentLab]: true },
            journal: [...state.journal, ...notes],
          });
        },

        markVideoSeen: (key) => set((state) => ({ videosSeen: { ...state.videosSeen, [key]: true } })),

        fail: (lab, step, text, options = {}) => {
          const state = get();
          const level = state.levels[lab];
          const points = penaltyFor(stepDef(lab, step), level.losses);
          const reason = options.reason ?? 'wrong';
          const spreadOn = state.settings.spreadEnabled;
          const labTitle = labDef(lab).title;
          const template = options.journal ?? (spreadOn ? templates.wrong : templates.wrongNoSpread);

          patchLevel(lab, {
            losses: [...level.losses, { step, points, reason }],
            notice: { text, points, tone: 'bad' },
          });
          set((current) => ({
            journal: [
              ...current.journal,
              entry(
                template,
                { lab: labTitle, points, spread: spreadConfig.perWrong, ...options.journalVars },
                'bad',
              ),
            ],
          }));
          shiftSpread(spreadConfig.perWrong);
          return points;
        },

        notify: (lab, text) => patchLevel(lab, { notice: { text, points: 0, tone: 'info' } }),

        clearNotice: (lab) => patchLevel(lab, { notice: null }),

        takeHint: (lab) => {
          const state = get();
          const level = state.levels[lab];
          const hints = labDef(lab).hints;
          if (level.done || level.hintsTaken >= state.settings.hintsPerLevel || hints.length === 0) return null;

          const text = hints[Math.min(level.hintsTaken, hints.length - 1)];
          const available = levelScore(quest.scoring.perLevel, level.losses, level.bonus);
          const points = Math.min(quest.scoring.hintCost, available);
          patchLevel(lab, {
            hintsTaken: level.hintsTaken + 1,
            losses: [...level.losses, { step: 'hint', points, reason: 'hint' }],
            lastHint: text,
          });
          set((current) => ({
            journal: [...current.journal, entry(templates.hint, { lab: labDef(lab).title, points })],
          }));
          return text;
        },

        addBonus: (lab, points) => {
          const level = get().levels[lab];
          patchLevel(lab, { bonus: level.bonus + points });
          set((state) => ({
            journal: [
              ...state.journal,
              entry(templates.bonus, { points, spread: spreadConfig.bonusRelief }, 'good'),
            ],
          }));
          shiftSpread(-spreadConfig.bonusRelief);
        },

        complete: (lab, value) => {
          const state = get();
          if (state.levels[lab].done) return;
          const components = [...state.components];
          components[lab - 1] = value;
          const level = state.levels[lab];
          const score = levelScore(quest.scoring.perLevel, level.losses, level.bonus);
          const now = Date.now();
          const pause = lab === 3 && state.settings.twoLessons;

          const journal = [
            ...state.journal,
            entry(templates.component, { lab: labDef(lab).title, num: lab, value, score }, 'good'),
          ];
          if (pause) journal.push(entry(templates.lessonBreak));
          else if (lab < 5) journal.push(entry(templates.unlocked, { lab: labDef((lab + 1) as LabNum).title }));

          set({
            components,
            levels: { ...state.levels, [lab]: { ...level, done: true, notice: null } },
            journal,
            pausedAt: pause ? now : state.pausedAt,
          });
        },

        dismissCritical: () => set({ critical: null }),

        markJournalSeen: () => set((state) => ({ journalSeen: state.journal.length })),

        resumeLessonTwo: () => {
          const state = get();
          if (!state.pausedAt) return;
          const now = Date.now();
          set({
            pausedMs: state.pausedMs + (now - state.pausedAt),
            pausedAt: null,
            lastMinuteAt: now,
            journal: [
              ...state.journal,
              entry(templates.lessonResume, {}, 'bad'),
              entry(templates.unlocked, { lab: labDef(4).title }),
            ],
          });
        },

        synthesize: () => {
          const state = get();
          if (state.vaultOpen) return;
          set({
            vaultOpen: true,
            finishedAt: Date.now(),
            spread: 0,
            journal: [...state.journal, entry(templates.vault, {}, 'good')],
          });
        },

        setLab1: (patch) => set((state) => ({ lab1: { ...state.lab1, ...patch } })),
        setLab2: (patch) => set((state) => ({ lab2: { ...state.lab2, ...patch } })),
        setLab3: (patch) => set((state) => ({ lab3: { ...state.lab3, ...patch } })),
        setLab4: (patch) => set((state) => ({ lab4: { ...state.lab4, ...patch } })),
        setLab5: (patch) => set((state) => ({ lab5: { ...state.lab5, ...patch } })),

        setReflection: (reflection) => set({ reflection }),
        setSettings: (patch) =>
          set((state) => {
            const settings = { ...state.settings, ...patch };
            if (!settings.twoLessons && state.pausedAt) {
              const now = Date.now();
              return {
                settings,
                pausedMs: state.pausedMs + (now - state.pausedAt),
                pausedAt: null,
                lastMinuteAt: now,
              };
            }
            return { settings };
          }),
        setTeacherUnlocked: (teacherUnlocked) => set({ teacherUnlocked }),

        resetProgress: () => set({ team: '', ...initialProgress() }),
      };
    },
    {
      name: quest.meta.storageKey,
      version: 3,
      migrate: (persisted, version) =>
        migrateState(persisted, version, {
          settings: { ...defaults },
          labs: {
            lab1: initialProgress().lab1 as unknown as Record<string, unknown>,
            lab2: initialProgress().lab2 as unknown as Record<string, unknown>,
            lab3: initialProgress().lab3 as unknown as Record<string, unknown>,
            lab4: initialProgress().lab4 as unknown as Record<string, unknown>,
            lab5: initialProgress().lab5 as unknown as Record<string, unknown>,
          },
        }) as unknown as QuestState,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<QuestState>;
        return { ...current, ...saved, settings: { ...current.settings, ...saved.settings } };
      },
      partialize: (state) => ({
        team: state.team,
        startedAt: state.startedAt,
        finishedAt: state.finishedAt,
        lastMinuteAt: state.lastMinuteAt,
        pausedAt: state.pausedAt,
        pausedMs: state.pausedMs,
        spread: state.spread,
        peakSpread: state.peakSpread,
        journal: state.journal,
        journalSeen: state.journalSeen,
        videosSeen: state.videosSeen,
        enteredLabs: state.enteredLabs,
        components: state.components,
        levels: state.levels,
        vaultOpen: state.vaultOpen,
        reflection: state.reflection,
        lab1: state.lab1,
        lab2: state.lab2,
        lab3: state.lab3,
        lab4: state.lab4,
        lab5: state.lab5,
        settings: state.settings,
      }),
    },
  ),
);

export function isLessonBreak(state: QuestState): boolean {
  return state.pausedAt !== null && !state.levels[4].done;
}

export function labStatus(state: QuestState, lab: LabNum): LabStatus {
  if (state.levels[lab].done) return 'done';
  if (!state.startedAt) return 'locked';
  if (lab === 1) return 'open';
  if (!state.levels[(lab - 1) as LabNum].done) return 'locked';
  if (lab === 4 && isLessonBreak(state)) return 'locked';
  return 'open';
}

export function allDone(state: QuestState): boolean {
  return LAB_NUMS.every((lab) => state.levels[lab].done);
}

export function nextLab(state: QuestState): LabNum | null {
  return LAB_NUMS.find((lab) => !state.levels[lab].done) ?? null;
}

export function scoreOf(state: QuestState, lab: LabNum): number {
  const level = state.levels[lab];
  return levelScore(quest.scoring.perLevel, level.losses, level.bonus);
}

export function totalScore(state: QuestState): number {
  return LAB_NUMS.reduce((sum, lab) => sum + scoreOf(state, lab), 0);
}

export function hintsLeft(state: QuestState, lab: LabNum): number {
  return Math.max(0, state.settings.hintsPerLevel - state.levels[lab].hintsTaken);
}

export function hintsUsed(state: QuestState): number {
  return LAB_NUMS.reduce((sum, lab) => sum + state.levels[lab].hintsTaken, 0);
}

export function freezesCount(state: QuestState): number {
  return state.levels[4].losses.filter((loss) => loss.reason === 'freeze').length;
}

export function elapsedMinutes(state: QuestState, now = Date.now()): number {
  if (!state.startedAt) return 0;
  const end = state.finishedAt ?? now;
  const paused = state.pausedMs + (state.pausedAt ? end - state.pausedAt : 0);
  return Math.max(0, Math.round((end - state.startedAt - paused) / 60_000));
}
