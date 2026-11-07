import { ITEMS, type ItemId } from '../data/items';

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
#cross{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:#fff9;}
#ann{position:absolute;left:0;right:0;top:16%;text-align:center;opacity:0;transition:opacity .6s}
#ann h1{margin:0;font-size:38px;letter-spacing:3px}#ann p{margin:6px 0 0;font-size:18px;opacity:.9}
#hint{position:absolute;left:14px;top:12px;font-size:13px;line-height:1.5;background:#0006;padding:8px 12px;border:1px solid #d8c9a044}
#info{position:absolute;right:14px;top:12px;text-align:right;font-size:15px;line-height:1.5}
#start{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#000a;color:#f0e6d0;font-family:Georgia,serif;pointer-events:none}
#start h1{font-size:56px;letter-spacing:6px;margin:0}#start p{font-size:18px}
#dmg{position:absolute;inset:0;box-shadow:inset 0 0 120px #c00;opacity:0;transition:opacity .4s}
`;

export class Hud {
  private el = (id: string) => document.getElementById(id)!;
  private annTimer = 0;

  constructor() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    const root = document.createElement('div');
    root.id = 'hud';
    root.innerHTML = `
      <div id="dmg"></div><div id="cross"></div>
      <div id="hint"><b>WASD</b> move &middot; <b>Shift</b> sprint &middot; <b>Space</b> jump &middot; <b>V</b> 1st/3rd person<br>
        <b>LMB</b> left hand &middot; <b>RMB</b> right hand &middot; <b>Q</b>/<b>E</b> cycle left/right item<br><b>H</b> hide this</div>
      <div id="info"><div id="wing"></div><div id="kills"></div></div>
      <div id="ann"><h1></h1><p></p></div>
      <div class="hand" id="hl"></div><div class="hand" id="hr"></div>
      <div id="bars">
        <div class="bar" id="bm"><i></i></div><div class="bar" id="bh"><i></i></div><div class="bar" id="bs"><i></i></div>
      </div>`;
    document.body.appendChild(root);
    const start = document.createElement('div');
    start.id = 'start';
    start.innerHTML = '<h1>5TH TAIL</h1><p>Click to begin &middot; Esc to release the mouse</p>';
    document.body.appendChild(start);
    document.addEventListener('pointerlockchange', () => {
      start.style.display = document.pointerLockElement ? 'none' : 'flex';
    });
    addEventListener('keydown', (e) => { if (e.code === 'KeyH') this.el('hint').style.display = this.el('hint').style.display === 'none' ? '' : 'none'; });
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

  setWing(text: string): void { this.el('wing').textContent = text; }
  setKills(n: number): void { this.el('kills').textContent = `Venin slain: ${n}`; }

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
