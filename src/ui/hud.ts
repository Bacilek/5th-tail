import * as THREE from 'three';
import { Humanoid } from '../entities/humanoid';
import { isTyping } from '../engine/input';
import { loadCharacters, saveCharacter, deleteCharacter, type SavedChar } from '../engine/saves';
import { ITEMS, type ItemId } from '../data/items';
import { CLASSES, type ClassId } from '../data/classes';
import { DEFAULT_LOOK, SKIN_TONES, HAIR_COLORS, HAIR_STYLES, CLOTH_COLORS, type Look } from '../data/look';

const CSS = `
#hud{position:fixed;inset:0;pointer-events:none;font-family:Georgia,serif;color:#f0e6d0;text-shadow:0 1px 3px #000}
#bars{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);display:flex;gap:14px;align-items:center}
.bar{height:12px;border:1px solid #d8c9a0aa;background:#0008;position:relative;overflow:hidden}
.bar i{position:absolute;inset:0;transform-origin:left;transition:transform .1s}
#bh{width:300px}#bh i{background:#b3262a}
#bm{width:200px}#bm i{background:#2f6fd6;transform-origin:right}
#bs{width:200px}#bs i{background:#3f9e4a}
.hand{position:absolute;bottom:20px;font-size:14px;background:#0007;padding:4px 10px;border:1px solid #d8c9a066}
#hl{left:20px}#hr{right:20px}
#warn{position:absolute;left:50%;top:38%;transform:translateX(-50%);font-size:64px;font-weight:bold;color:#ff2a1a;text-shadow:0 0 14px #ff2a1a,0 2px 4px #000;display:none}
#cross{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:#fff9;}
#ann{position:absolute;left:0;right:0;top:16%;text-align:center;opacity:0;transition:opacity .6s}
#ann h1{margin:0;font-size:38px;letter-spacing:3px}#ann p{margin:6px 0 0;font-size:18px;opacity:.9}
#hint{position:absolute;left:14px;top:12px;font-size:13px;line-height:1.5;background:#0006;padding:8px 12px;border:1px solid #d8c9a044}
#info{position:absolute;right:14px;top:212px;text-align:right;font-size:15px;line-height:1.5}
#start{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#000a;color:#f0e6d0;font-family:Georgia,serif;pointer-events:none}
#start h1{font-size:56px;letter-spacing:6px;margin:0}#start p{font-size:18px}
#cc{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(#000a,#000e);color:#f0e6d0;font-family:Georgia,serif;z-index:6}
#cc h1{font-size:40px;letter-spacing:5px;margin:0 0 24px}
#cc .ccrow{display:flex;gap:44px;align-items:center;flex-wrap:wrap;justify-content:center}
#cc .ccprev{position:relative;width:120px;height:230px}
#cc .ccrow .ccprev.live{width:240px;height:340px}
#cc .ccrow canvas.pv3{width:240px;height:340px;display:block}
#cc .ph{position:absolute;left:35px;top:20px;width:50px;height:50px;border-radius:50%;background:#d9b69a}
#cc .pf{position:absolute;left:30px;top:10px;width:60px;height:28px;border-radius:30px 30px 6px 6px;z-index:1;opacity:.95}
#cc .pb{position:absolute;left:25px;top:76px;width:70px;height:120px;border-radius:6px;background:#1d2030}
#cc .cctiles{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin:-8px 0 22px;max-width:92vw}
#cc .cctile{position:relative;width:96px;height:132px;border:1px solid #d8c9a0aa;background:#14121acc;cursor:pointer;text-align:center;overflow:hidden;transition:.15s}
#cc .cctile:hover{background:#2a2330;transform:translateY(-3px)}
#cc .cctile .mini{transform:scale(.42);transform-origin:top left;position:absolute;left:28px;top:6px}
#cc .cctile b{position:absolute;left:0;right:0;top:92px;font-size:13px}
#cc .cctile small{position:absolute;left:0;right:0;top:110px;font-size:11px;opacity:.7}
#cc .cctile u{position:absolute;right:4px;top:2px;text-decoration:none;opacity:.5;font-size:13px}
#cc .cctile u:hover{opacity:1;color:#f88}
#cc .ccopts{display:flex;flex-direction:column;gap:14px}
#cc label{font-size:18px}#cc input{margin-left:10px;padding:6px 10px;font:inherit;background:#14121a;color:#f0e6d0;border:1px solid #d8c9a0aa}
#cc .sw{display:flex;align-items:center;gap:8px}#cc .sw span{width:60px;opacity:.8}
#cc .opt{display:inline-block;min-width:28px;height:28px;line-height:28px;text-align:center;padding:0 6px;border:2px solid #0000;border-radius:4px;cursor:pointer;font-style:normal;font-size:13px;outline:1px solid #d8c9a044}
#cc .opt.sel{border-color:#ffd98a}
#cc button{margin-top:10px;padding:12px 18px;font:inherit;font-size:17px;background:#2a2330;color:#ffd98a;border:1px solid #d8c9a0aa;cursor:pointer}
#cc button:hover{background:#3a3040}
#cls{position:fixed;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(#000a,#000d);color:#f0e6d0;font-family:Georgia,serif;z-index:5}
#cls h1{font-size:46px;letter-spacing:5px;margin:0}#cls>p{opacity:.8;margin:6px 0 26px}
#cls .cards{display:flex;gap:16px;flex-wrap:wrap;justify-content:center}
#cls .card{width:210px;padding:16px;border:1px solid #d8c9a0aa;background:#14121acc;cursor:pointer;transition:.15s}
#cls .card:hover{background:#2a2330;transform:translateY(-4px)}
#cls .card b{font-size:22px}#cls .card kbd{float:right;opacity:.7}#cls .card p{font-size:14px;opacity:.85}
#obj{position:absolute;left:50%;top:12px;transform:translateX(-50%);font-size:15px;background:#0006;padding:4px 14px;border:1px solid #d8c9a044}
#dmg{position:absolute;inset:0;box-shadow:inset 0 0 120px #c00;opacity:0;transition:opacity .4s}
`;

export class Hud {
  private el = (id: string) => document.getElementById(id)!;
  private annTimer = 0;
  chosen = false;

  constructor() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    const root = document.createElement('div');
    root.id = 'hud';
    root.innerHTML = `
      <div id="dmg"></div><div id="cross"></div><div id="warn">!</div>
      <div id="hint"><b>WASD</b> move &middot; <b>Shift</b> sprint &middot; <b>Space</b> jump &middot; <b>V</b> 1st/3rd person<br>
        <b>LMB</b> left hand &middot; <b>RMB</b> right hand (hold = power attack) &middot; <b>X</b>/<b>MMB</b> hold to block, then attack = bash &middot; <b>Alt</b> dodge (red ! = unblockable) &middot; <b>Q</b>/<b>E</b> cycle items<br><b>F</b> talk/mount &middot; <b>R</b> summon dragon &middot; <b>B</b> broom &middot; <b>J</b> quests &middot; <b>M</b> map &middot; <b>Z</b> rest (night) &middot; <b>N</b> sound &middot; <b>H</b> hide this</div>
      <div id="info"><div id="cls2"></div><div id="drg"></div><div id="race"></div><div id="wing"></div><div id="kills"></div></div>
      <div id="obj"></div><div id="ann"><h1></h1><p></p></div>
      <div class="hand" id="hl"></div><div class="hand" id="hr"></div>
      <div id="bars">
        <div class="bar" id="bm"><i></i></div><div class="bar" id="bh"><i></i></div><div class="bar" id="bs"><i></i></div>
      </div>`;
    document.body.appendChild(root);
    const start = document.createElement('div');
    start.id = 'start';
    start.innerHTML = '<h1>FIFTH TAIL</h1><p>Click to begin &middot; Esc to release the mouse</p>';
    start.style.display = 'none';
    document.body.appendChild(start);
    document.addEventListener('pointerlockchange', () => {
      start.style.display = document.pointerLockElement || !this.chosen ? 'none' : 'flex';
    });
    addEventListener('keydown', (e) => { if (isTyping(e)) return; if (e.code === 'KeyH') this.el('hint').style.display = this.el('hint').style.display === 'none' ? '' : 'none'; });
  }

  private setBar(id: string, f: number): void {
    (this.el(id).firstElementChild as HTMLElement).style.transform = `scaleX(${Math.max(0, Math.min(1, f))})`;
  }

  update(h: number, m: number, s: number, dt: number): void {
    this.setBar('bh', h); this.setBar('bm', m); this.setBar('bs', s);
    if (this.annTimer > 0) {
      this.annTimer -= dt;
      if (this.annTimer <= 0) this.el('ann').style.opacity = '0';
    }
  }

  setHands(l: ItemId, r: ItemId): void {
    this.el('hl').textContent = 'L: ' + ITEMS[l].name;
    this.el('hr').textContent = 'R: ' + ITEMS[r].name;
  }

  /**
   * Character creation: name, skin, hair, outfit. Previously created characters appear as tiles on top;
   * clicking one calls onQuick (straight into the game when it remembers a class). New characters call onDone.
   */
  showCharacterCreator(onDone: (look: Look, id: string) => void, onQuick: (c: SavedChar) => void): void {
    const look: Look = { ...DEFAULT_LOOK };
    const el = document.createElement('div');
    el.id = 'cc';
    const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
    el.innerHTML = `<h1>CREATE YOUR CADET</h1>
      <div class="cctiles"></div>
      <div class="ccrow"><div class="ccprev"><div class="ph"></div><div class="pf"></div><div class="pb"></div></div>
      <div class="ccopts">
        <label>Name <input id="ccname" maxlength="16" value="${look.name}"></label>
        <div class="sw" data-k="skin"><span>Skin</span></div>
        <div class="sw" data-k="hair"><span>Hair</span></div>
        <div class="sw" data-k="female"><span>Body</span></div>
        <div class="sw" data-k="hairStyle"><span>Style</span></div>
        <div class="sw" data-k="beard"><span>Beard</span></div>
        <div class="sw" data-k="cloth"><span>Outfit</span></div>
        <button id="ccgo">Continue to Conscription Day</button>
      </div></div>`;
    // live 3D preview of the rigged humanoid (falls back to the CSS silhouette if the models did not load)
    let live: { update: () => void; dispose: () => void } | null = null;
    if (Humanoid.ready) {
      const holder = el.querySelector('.ccrow .ccprev') as HTMLElement;
      holder.classList.add('live'); holder.innerHTML = '';
      const canvas = document.createElement('canvas'); canvas.className = 'pv3'; holder.appendChild(canvas);
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(240, 340, false);
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xdde4ff, 0x40362e, 1.6));
      const key = new THREE.DirectionalLight(0xfff0d8, 2.4); key.position.set(2, 3, 4); scene.add(key);
      const cam = new THREE.PerspectiveCamera(28, 240 / 340, 0.1, 50); cam.position.set(0, 1.05, 5.6); cam.lookAt(0, 0.95, 0);
      let human: Humanoid | null = null, builtKey = '', raf = 0, t0 = performance.now();
      const rebuild = () => {
        const k = JSON.stringify([look.female, look.skin, look.hair, look.hairStyle, look.beard, look.cloth]);
        if (k === builtKey) return;
        builtKey = k;
        const rot = human ? human.root.rotation.y : 0;
        if (human) scene.remove(human.root);
        human = new Humanoid({ female: look.female, skin: look.skin, hair: look.hair, hairStyle: look.hairStyle, beard: look.beard });
        human.dress(look.cloth);
        human.root.rotation.y = rot;
        scene.add(human.root);
      };
      const loop = () => {
        if (!el.isConnected) { live?.dispose(); return; }
        rebuild();
        if (human) { human.pose({ speed: 0, swing: 0, power: false, blocking: false, ride: false }, 0.016); human.root.rotation.y = Math.sin((performance.now() - t0) / 1800) * 0.7; }
        renderer.render(scene, cam);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      live = { update: rebuild, dispose: () => { cancelAnimationFrame(raf); renderer.dispose(); renderer.forceContextLoss(); } };
    }
    const paint = () => {
      if (live) live.update();
      const q = (s: string) => el.querySelector('.ccrow ' + s) as HTMLElement; // scoped: saved-character tiles also contain .ph/.pf/.pb
      if (!live) {
        q('.ph').style.background = hex(look.skin);
        q('.pf').style.background = look.hairStyle === 'bald' ? 'transparent' : hex(look.hair);
        q('.pf').style.height = look.hairStyle === 'long' ? '86px' : '28px';
        q('.pb').style.background = hex(look.cloth);
      }
      el.querySelectorAll('.sw .opt').forEach((o) => {
        const b = o as HTMLElement;
        const k = b.parentElement!.dataset.k as keyof Look;
        b.classList.toggle('sel', String(look[k]) === b.dataset.v);
      });
    };
    const rows: [keyof Look, (number | string | boolean)[]][] = [
      ['skin', SKIN_TONES], ['hair', HAIR_COLORS], ['female', [false, true]], ['hairStyle', HAIR_STYLES], ['beard', [false, true]], ['cloth', CLOTH_COLORS],
    ];
    for (const [k, vals] of rows) {
      const row = el.querySelector(`.sw[data-k="${k}"]`)!;
      for (const v of vals) {
        const b = document.createElement('i');
        b.className = 'opt'; b.dataset.v = String(v);
        if (typeof v === 'number') b.style.background = hex(v); else b.textContent = typeof v === 'boolean' ? (k === 'beard' ? (v ? 'Beard' : 'None') : v ? 'Female' : 'Male') : v;
        b.addEventListener('click', () => { (look as unknown as Record<string, unknown>)[k] = v; paint(); });
        row.appendChild(b);
      }
    }
    let done = false;
    const go = () => {
      if (done) return; done = true;
      const n = (el.querySelector('#ccname') as HTMLInputElement).value.trim();
      look.name = n || 'Cadet';
      const id = Date.now().toString(36);
      saveCharacter({ id, look: { ...look } });
      el.remove(); onDone(look, id);
    };
    el.querySelector('#ccgo')!.addEventListener('click', go);
    // quick-select tiles of already created characters
    const tiles = el.querySelector('.cctiles') as HTMLElement;
    const renderTiles = () => {
      tiles.innerHTML = '';
      for (const c of loadCharacters()) {
        const t = document.createElement('div');
        t.className = 'cctile';
        const cls = c.classId ? CLASSES[c.classId].name : 'no class yet';
        t.innerHTML = `<div class="ccprev mini"><div class="ph" style="background:${hex(c.look.skin)}"></div>` +
          `<div class="pf" style="background:${c.look.hairStyle === 'bald' ? 'transparent' : hex(c.look.hair)};height:${c.look.hairStyle === 'long' ? 86 : 28}px"></div>` +
          `<div class="pb" style="background:${hex(c.look.cloth)}"></div></div><b></b><small>${cls}</small><u title="Delete">x</u>`;
        (t.querySelector('b') as HTMLElement).textContent = c.look.name;
        t.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).tagName === 'U') { deleteCharacter(c.id); renderTiles(); return; }
          if (done) return; done = true;
          el.remove(); onQuick(c);
        });
        tiles.appendChild(t);
      }
    };
    renderTiles();
    paint();
    document.body.appendChild(el);
  }

  showClassSelect(onPick: (id: ClassId) => void): void {
    const el = document.createElement('div');
    el.id = 'cls';
    const order: ClassId[] = ['rider', 'infantry', 'healer', 'scribe'];
    el.innerHTML = '<h1>CONSCRIPTION DAY</h1><p>Basgiath War College. Choose your quadrant.</p><div class="cards"></div>';
    const cards = el.querySelector('.cards')!;
    let done = false;
    const pick = (id: ClassId) => {
      if (done) return; done = true; this.chosen = true;
      el.remove(); onPick(id);
    };
    order.forEach((id, i) => {
      const c = CLASSES[id];
      const d = document.createElement('div');
      d.className = 'card';
      d.innerHTML = `<kbd>${i + 1}</kbd><b>${c.name}</b><p>${c.tagline}</p>`;
      d.addEventListener('click', () => pick(id));
      cards.appendChild(d);
    });
    addEventListener('keydown', (e) => {
      if (isTyping(e)) return;
      const i = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
      if (i >= 0) pick(order[i]);
    });
    el.style.display = 'flex';
    document.body.appendChild(el);
  }

  /** red '!' = an unblockable attack is coming: dodge, do not block */
  setWarning(on: boolean): void { this.el('warn').style.display = on ? 'block' : 'none'; }
  setRaceLine(t: string): void { this.el('race').textContent = t; }
  setDragonLine(t: string): void { this.el('drg').textContent = t; }
  setObjective(t: string): void { this.el('obj').textContent = t; this.el('obj').style.display = t ? '' : 'none'; }
  setClassLabel(t: string): void { this.el('cls2').textContent = t; }
  showMagicka(v: boolean): void { this.el('bm').style.visibility = v ? 'visible' : 'hidden'; }

  setWing(text: string): void { this.el('wing').textContent = text; }
  setKills(n: number, gold = 0): void { this.el('kills').textContent = `Venin slain: ${n}  |  Gold: ${gold}`; }

  announce(title: string, sub = '', seconds = 4): void {
    const a = this.el('ann');
    a.querySelector('h1')!.textContent = title;
    a.querySelector('p')!.textContent = sub;
    a.style.opacity = '1';
    this.annTimer = seconds;
  }

  flashDamage(): void {
    const d = this.el('dmg');
    d.style.opacity = '1';
    setTimeout(() => { d.style.opacity = '0'; }, 120);
  }
}
