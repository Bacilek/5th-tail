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
}
