import type { Look } from '../data/look';
import type { ClassId } from '../data/classes';

/** A created character: look + last chosen class. Only this is persisted (quest progress is not saved). */
export interface SavedChar { id: string; look: Look; classId?: ClassId; }

const KEY = '5thtail.characters.v1';

export function loadCharacters(): SavedChar[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((c) => c && c.id && c.look) : [];
  } catch { return []; }
}

function write(list: SavedChar[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(-12))); } catch { /* storage unavailable: no quick select */ }
}

export function saveCharacter(c: SavedChar): void {
  const list = loadCharacters();
  const i = list.findIndex((x) => x.id === c.id);
  if (i >= 0) list[i] = c; else list.push(c);
  write(list);
}

export function deleteCharacter(id: string): void {
  write(loadCharacters().filter((c) => c.id !== id));
  deleteSave(id);
}

/** Full game state for one character (quest progress, position, bond, flags). Versioned. */
export interface SaveData {
  version: 1;
  charId: string;
  savedAt: number;
  classId: ClassId;
  player: { x: number; y: number; z: number; yaw: number; health: number; magicka: number; stamina: number; hands: [string, string] };
  quests: { gold: number; entries: [string, { status: string; prog: number[] }][] };
  stage: string;
  wing: string;
  kills: number;
  hour: number;
  takenPickups: number[];
  catAdopted: boolean;
  bond: { species: number; name: string } | null;
  gauntlet: { done: boolean; best: number | null };
  raceBest: number | null;
}

const saveKey = (id: string) => `5thtail.save.${id}`;

export function readSave(id: string): SaveData | null {
  try {
    const raw = localStorage.getItem(saveKey(id));
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d && d.version === 1 ? (d as SaveData) : null;
  } catch { return null; }
}

export function writeSave(d: SaveData): boolean {
  try { localStorage.setItem(saveKey(d.charId), JSON.stringify(d)); return true; } catch { return false; }
}

export function deleteSave(id: string): void {
  try { localStorage.removeItem(saveKey(id)); } catch { /* ignore */ }
}
