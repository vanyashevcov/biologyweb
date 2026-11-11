
type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function withDefaults(saved: unknown, defaults: Json): Json {
  return isObject(saved) ? { ...defaults, ...saved } : { ...defaults };
}

function rename(target: Json, from: string, to: string) {
  if (from in target) {
    if (!(to in target)) target[to] = target[from];
    delete target[from];
  }
}

export interface MigrationDefaults {
  settings: Json;
  labs: Record<'lab1' | 'lab2' | 'lab3' | 'lab4' | 'lab5', Json>;
}

export function migrateState(persisted: unknown, fromVersion: number, defaults: MigrationDefaults): Json {
  const state: Json = isObject(persisted) ? { ...persisted } : {};

  if (fromVersion < 3) {
    rename(state, 'toxin', 'spread');
    rename(state, 'peakToxin', 'peakSpread');
    const settings: Json = isObject(state.settings) ? { ...state.settings } : {};
    rename(settings, 'toxinEnabled', 'spreadEnabled');
    state.settings = settings;
  }

  state.settings = withDefaults(state.settings, defaults.settings);
  for (const key of Object.keys(defaults.labs) as Array<keyof MigrationDefaults['labs']>) {
    state[key] = withDefaults(state[key], defaults.labs[key]);
  }
  if (!isObject(state.videosSeen)) state.videosSeen = {};

  return state;
}
