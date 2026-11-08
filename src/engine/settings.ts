export type Difficulty = 'story' | 'normal' | 'hard';
export type Quality = 'low' | 'medium' | 'high';

export interface Settings {
  master: number;      // 0..1
  music: number;       // 0..1
  sens: number;        // mouse sensitivity multiplier
  fov: number;         // degrees
  quality: Quality;
  difficulty: Difficulty;
  invertY: boolean;
}

const KEY = '5thtail.settings.v1';
const DEFAULTS: Settings = { master: 0.7, music: 1, sens: 1, fov: 72, quality: 'medium', difficulty: 'normal', invertY: false };

/** Damage multipliers by difficulty. No difficulty has permadeath. */
export const DIFFICULTY: Record<Difficulty, { taken: number; dealt: number; label: string }> = {
  story: { taken: 0.5, dealt: 1.5, label: 'Story (relaxed)' },
  normal: { taken: 1, dealt: 1, label: 'Normal' },
  hard: { taken: 1.5, dealt: 0.8, label: 'Hard' },
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* use defaults */ }
  return { ...DEFAULTS };
}

/** Live settings object shared by all systems. Mutate then call saveSettings(). */
export const settings: Settings = load();

export function saveSettings(): void {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* storage unavailable */ }
}
