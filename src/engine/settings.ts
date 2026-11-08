export type Difficulty = 'story' | 'normal' | 'hard';
export type Quality = 'low' | 'medium' | 'high';

export type Action = 'dodge' | 'block' | 'sprint' | 'jump' | 'interact' | 'summon' | 'broom' | 'camera';
export const ACTION_LABELS: Record<Action, string> = {
  dodge: 'Dodge', block: 'Block (hold)', sprint: 'Sprint', jump: 'Jump', interact: 'Interact / mount',
  summon: 'Summon dragon', broom: 'Broom', camera: '1st / 3rd person',
};
export const DEFAULT_KEYS: Record<Action, string> = {
  dodge: 'AltLeft', block: 'KeyX', sprint: 'ShiftLeft', jump: 'Space', interact: 'KeyF', summon: 'KeyR', broom: 'KeyB', camera: 'KeyV',
};

export interface Settings {
  keys: Record<Action, string>;
  master: number;      // 0..1
  music: number;       // 0..1
  sens: number;        // mouse sensitivity multiplier
  fov: number;         // degrees
  quality: Quality;
  difficulty: Difficulty;
  invertY: boolean;
  noNight: boolean;   // skip the night entirely (the clock jumps from evening to morning)
}

const KEY = '5thtail.settings.v1';
const DEFAULTS: Settings = { keys: { ...DEFAULT_KEYS }, master: 0.7, music: 1, sens: 1, fov: 72, quality: 'medium', difficulty: 'normal', invertY: false, noNight: false };

/** Damage multipliers by difficulty. No difficulty has permadeath. */
export const DIFFICULTY: Record<Difficulty, { taken: number; dealt: number; label: string }> = {
  story: { taken: 0.5, dealt: 1.5, label: 'Story (relaxed)' },
  normal: { taken: 1, dealt: 1, label: 'Normal' },
  hard: { taken: 1.5, dealt: 0.8, label: 'Hard' },
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const d = JSON.parse(raw); return { ...DEFAULTS, ...d, keys: { ...DEFAULT_KEYS, ...(d.keys ?? {}) } }; }
  } catch { /* use defaults */ }
  return { ...DEFAULTS, keys: { ...DEFAULT_KEYS } };
}

/** Live settings object shared by all systems. Mutate then call saveSettings(). */
export const settings: Settings = load();

export function saveSettings(): void {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* storage unavailable */ }
}
