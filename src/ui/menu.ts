import { settings, saveSettings, DIFFICULTY, type Difficulty, type Quality } from '../engine/settings';
import { loadCharacters } from '../engine/saves';

const CSS = `
.menu{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Georgia,serif;color:#f0e6d0;z-index:8}
#title{background:radial-gradient(ellipse at 50% 60%,#2a1f3acc,#05040a 70%);z-index:7}
#title h1{font-size:76px;letter-spacing:10px;margin:0;text-shadow:0 0 30px #ff8a3a66}
#title .sub{opacity:.7;letter-spacing:4px;margin:6px 0 40px}
#pause{background:#000c}
#pause h2,#settings h2{letter-spacing:5px;margin:0 0 20px}
.mbtn{display:block;min-width:260px;margin:7px 0;padding:12px 20px;font:inherit;font-size:19px;color:#ffd98a;background:#14121add;border:1px solid #d8c9a0aa;cursor:pointer;text-align:center}
.mbtn:hover{background:#2a2330}.mbtn[disabled]{opacity:.35;cursor:default}
#settings{background:#000e;z-index:9}
#settings .row{display:flex;align-items:center;gap:14px;margin:8px 0;min-width:420px;justify-content:space-between}
#settings label{font-size:17px}#settings input[type=range]{width:200px}
#settings select{font:inherit;padding:4px 8px;background:#14121a;color:#f0e6d0;border:1px solid #d8c9a0aa}
#toast{position:fixed;left:50%;bottom:120px;transform:translateX(-50%);background:#000c;border:1px solid #d8c9a0aa;padding:8px 18px;color:#f0e6d0;font-family:Georgia,serif;z-index:10;opacity:0;transition:opacity .4s;pointer-events:none}
`;

export interface MenuHooks {
  onNew: () => void;
  onSettingsChanged: () => void;
  onResume: () => void;
  onSave: () => boolean;
  onQuit: () => void;
}

/** Title screen, pause menu, settings panel and toast. Pure DOM; game logic stays in main. */
export class Menus {
  private pauseEl: HTMLElement | null = null;
  private settingsEl: HTMLElement | null = null;
  private toastEl: HTMLElement;
  pauseOpen = false;

  constructor(private hooks: MenuHooks) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    this.toastEl = document.createElement('div');
    this.toastEl.id = 'toast';
    document.body.appendChild(this.toastEl);
  }

  toast(text: string): void {
    this.toastEl.textContent = text;
    this.toastEl.style.opacity = '1';
    setTimeout(() => { this.toastEl.style.opacity = '0'; }, 1800);
  }

  private btn(parent: HTMLElement, label: string, id: string, cb: () => void, disabled = false): HTMLButtonElement {
    const b = document.createElement('button');
    b.className = 'mbtn'; b.id = id; b.textContent = label; b.disabled = disabled;
    b.addEventListener('click', () => { if (!b.disabled) cb(); });
    parent.appendChild(b);
    return b;
  }

  showTitle(): void {
    const el = document.createElement('div');
    el.className = 'menu'; el.id = 'title';
    el.innerHTML = '<h1>FIFTH TAIL</h1><div class="sub">A TALE OF BASGIATH</div>';
    const hasSaves = loadCharacters().length > 0;
    this.btn(el, 'New Game', 'tnew', () => { el.remove(); this.hooks.onNew(); });
    this.btn(el, 'Continue', 'tcont', () => { el.remove(); this.hooks.onNew(); }, !hasSaves);
    this.btn(el, 'Settings', 'tset', () => this.showSettings());
    document.body.appendChild(el);
  }

  showPause(): void {
    if (this.pauseOpen) return;
    this.pauseOpen = true;
    const el = document.createElement('div');
    el.className = 'menu'; el.id = 'pause';
    el.innerHTML = '<h2>PAUSED</h2>';
    this.btn(el, 'Resume', 'presume', () => this.hidePause());
    this.btn(el, 'Save game', 'psave', () => this.toast(this.hooks.onSave() ? 'Game saved' : 'Saving failed'));
    this.btn(el, 'Settings', 'pset', () => this.showSettings());
    this.btn(el, 'Quit to title', 'pquit', () => this.hooks.onQuit());
    document.body.appendChild(el);
    this.pauseEl = el;
  }

  hidePause(): void {
    this.pauseEl?.remove(); this.pauseEl = null;
    this.pauseOpen = false;
    this.hooks.onResume();
  }

  showSettings(): void {
    if (this.settingsEl) return;
    const el = document.createElement('div');
    el.className = 'menu'; el.id = 'settings';
    el.innerHTML = '<h2>SETTINGS</h2>';
    const row = (label: string, ctl: HTMLElement) => {
      const r = document.createElement('div'); r.className = 'row';
      const l = document.createElement('label'); l.textContent = label;
      r.append(l, ctl); el.appendChild(r);
    };
    const slider = (min: number, max: number, step: number, get: () => number, set: (v: number) => void) => {
      const i = document.createElement('input');
      i.type = 'range'; i.min = String(min); i.max = String(max); i.step = String(step); i.value = String(get());
      i.addEventListener('input', () => { set(Number(i.value)); saveSettings(); this.hooks.onSettingsChanged(); });
      return i;
    };
    const select = <T extends string>(opts: [T, string][], get: () => T, set: (v: T) => void) => {
      const s = document.createElement('select');
      for (const [v, l] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = l; s.appendChild(o); }
      s.value = get();
      s.addEventListener('change', () => { set(s.value as T); saveSettings(); this.hooks.onSettingsChanged(); });
      return s;
    };
    row('Master volume', slider(0, 1, 0.05, () => settings.master, (v) => { settings.master = v; }));
    row('Music volume', slider(0, 1, 0.05, () => settings.music, (v) => { settings.music = v; }));
    row('Mouse sensitivity', slider(0.3, 2.5, 0.1, () => settings.sens, (v) => { settings.sens = v; }));
    row('Field of view', slider(55, 100, 1, () => settings.fov, (v) => { settings.fov = v; }));
    const inv = document.createElement('input'); inv.type = 'checkbox'; inv.checked = settings.invertY;
    inv.addEventListener('change', () => { settings.invertY = inv.checked; saveSettings(); });
    row('Invert Y axis', inv);
    row('Graphics quality', select<Quality>([['low', 'Low (best FPS)'], ['medium', 'Medium'], ['high', 'High']], () => settings.quality, (v) => { settings.quality = v; }));
    row('Difficulty', select<Difficulty>(
      (Object.keys(DIFFICULTY) as Difficulty[]).map((k) => [k, DIFFICULTY[k].label] as [Difficulty, string]),
      () => settings.difficulty, (v) => { settings.difficulty = v; }));
    row('Language', select<'en'>([['en', 'English']], () => 'en', () => {}));
    this.btn(el, 'Back', 'sback', () => { el.remove(); this.settingsEl = null; });
    document.body.appendChild(el);
    this.settingsEl = el;
  }
}
