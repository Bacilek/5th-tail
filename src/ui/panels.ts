import { isTyping } from '../engine/input';
import type { QuestLog } from '../systems/quests';

const CSS = `
#dlg{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);width:min(760px,92vw);background:#100e16ee;border:1px solid #d8c9a0aa;padding:16px 22px;color:#f0e6d0;font-family:Georgia,serif;display:none;z-index:4}
#dlg h2{margin:0 0 8px;font-size:20px;color:#ffd98a;letter-spacing:1px}
#dlg p{margin:0 0 12px;font-size:17px;line-height:1.5}
#dlg .ch{font-size:16px;opacity:.95;padding:3px 0;cursor:pointer}#dlg .ch:hover{color:#ffd98a}
#prompt{position:fixed;left:50%;top:62%;transform:translateX(-50%);color:#fff;font-family:Georgia,serif;font-size:17px;text-shadow:0 1px 4px #000;display:none;z-index:3}
#trk{position:fixed;right:14px;top:92px;text-align:right;font-family:Georgia,serif;font-size:14px;color:#f0e6d0;text-shadow:0 1px 3px #000;max-width:300px}
#trk b{color:#ffd98a}
#qlog{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,90vw);max-height:70vh;overflow:auto;background:#100e16f0;border:1px solid #d8c9a0aa;padding:18px 24px;color:#f0e6d0;font-family:Georgia,serif;display:none;z-index:4}
#qlog h2{margin:0 0 10px;color:#ffd98a}#qlog .q{margin:10px 0}#qlog .q b{font-size:17px}#qlog .q div{opacity:.85;font-size:14px;margin-left:10px}
#qlog .done b{opacity:.5;text-decoration:line-through}
`;

export interface Choice { label: string; cb?: () => void; }

export class Panels {
  private dlg: HTMLElement;
  private prompt: HTMLElement;
  private trk: HTMLElement;
  private qlog: HTMLElement;
  private choices: Choice[] = [];
  onOpen: (name: string) => void = () => {};
  enabled = false; // off during character creation / class select
  dialogOpen = false;
  logOpen = false;

  constructor(private quests: QuestLog) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    const mk = (id: string) => { const d = document.createElement('div'); d.id = id; document.body.appendChild(d); return d; };
    this.dlg = mk('dlg'); this.prompt = mk('prompt'); this.trk = mk('trk'); this.qlog = mk('qlog');
    addEventListener('keydown', (e) => {
      if (isTyping(e) || !this.enabled) return;
      if (this.dialogOpen) {
        const i = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
        if (i >= 0 && i < this.choices.length) this.pick(i);
        else if (e.code === 'Enter') this.pick(0);
      }
      if (e.code === 'KeyJ' && !this.dialogOpen) this.toggleLog();
    });
    quests.onChange = () => { this.renderTracker(); if (this.logOpen) this.renderLog(); };
    this.renderTracker();
  }

  open(name: string, text: string, choices: Choice[]): void {
    this.choices = choices;
    this.dialogOpen = true;
    this.onOpen(name);
    this.dlg.innerHTML = '';
    const h = document.createElement('h2'); h.textContent = name; this.dlg.appendChild(h);
    const p = document.createElement('p'); p.textContent = text; this.dlg.appendChild(p);
    choices.forEach((c, i) => {
      const d = document.createElement('div');
      d.className = 'ch'; d.textContent = `${i + 1}. ${c.label}`;
      d.addEventListener('click', () => this.pick(i));
      this.dlg.appendChild(d);
    });
    this.dlg.style.display = 'block';
    this.prompt.style.display = 'none';
  }

  private pick(i: number): void {
    const c = this.choices[i];
    this.close();
    c.cb?.();
  }

  close(): void {
    this.dialogOpen = false;
    this.dlg.style.display = 'none';
  }

  setPrompt(text: string): void {
    this.prompt.textContent = text;
    this.prompt.style.display = text && !this.dialogOpen ? 'block' : 'none';
  }

  private toggleLog(): void {
    this.logOpen = !this.logOpen;
    this.qlog.style.display = this.logOpen ? 'block' : 'none';
    if (this.logOpen) this.renderLog();
  }

  private renderLog(): void {
    const q = this.quests.all();
    let html = '<h2>Quest Log <small style="font-size:12px;opacity:.6">(J to close)</small></h2>';
    if (!q.length) html += '<p style="opacity:.7">No quests yet. Talk to people (F).</p>';
    for (const { id, status } of q) {
      const d = this.quests.def(id);
      html += `<div class="q ${status === 'done' ? 'done' : ''}"><b>${d.title}</b>` +
        this.quests.lines(id).map((l) => `<div>- ${l}</div>`).join('') + '</div>';
    }
    html += `<p style="margin-top:16px">Gold: ${this.quests.gold}</p>`;
    this.qlog.innerHTML = html;
  }

  private renderTracker(): void {
    const act = this.quests.all().filter((q) => q.status === 'active' || q.status === 'ready');
    this.trk.innerHTML = act.map(({ id }) =>
      `<div><b>${this.quests.def(id).title}</b>${this.quests.lines(id).map((l) => `<br>${l}`).join('')}</div>`).join('<br>');
  }
}
