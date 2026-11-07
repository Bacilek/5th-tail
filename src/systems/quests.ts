import { QUESTS, type QuestDef } from '../data/quests';

export type Status = 'none' | 'active' | 'ready' | 'done';

interface State { status: Status; prog: number[]; }

export class QuestLog {
  private state = new Map<string, State>();
  onChange: () => void = () => {};
  gold = 0;

  def(id: string): QuestDef { return QUESTS.find((q) => q.id === id)!; }
  status(id: string): Status { return this.state.get(id)?.status ?? 'none'; }

  start(id: string): void {
    const q = this.def(id);
    this.state.set(id, { status: 'active', prog: q.objectives.map(() => 0) });
    this.recheck(id);
    this.onChange();
  }

  private recheck(id: string): void {
    const s = this.state.get(id);
    if (!s || s.status !== 'active') return;
    const q = this.def(id);
    if (q.objectives.every((o, i) => s.prog[i] >= (o.n ?? 1))) s.status = 'ready';
  }

  turnIn(id: string): number {
    const s = this.state.get(id);
    if (!s || s.status !== 'ready') return 0;
    s.status = 'done';
    const g = this.def(id).gold;
    this.gold += g;
    this.onChange();
    return g;
  }

  private bump(type: 'kill' | 'collect', item?: string): void {
    for (const [id, s] of this.state) {
      if (s.status !== 'active') continue;
      this.def(id).objectives.forEach((o, i) => {
        if (o.type === type && (type === 'kill' || o.item === item) && s.prog[i] < (o.n ?? 1)) s.prog[i]++;
      });
      this.recheck(id);
    }
    this.onChange();
  }

  kill(): void { this.bump('kill'); }
  collect(item: string): void { this.bump('collect', item); }

  /** Checks 'reach' objectives (call every frame). */
  reach(check: string, ok: boolean): void {
    if (!ok) return;
    let changed = false;
    for (const [id, s] of this.state) {
      if (s.status !== 'active') continue;
      this.def(id).objectives.forEach((o, i) => {
        if (o.type === 'reach' && o.check === check && s.prog[i] < 1) { s.prog[i] = 1; changed = true; }
      });
      this.recheck(id);
    }
    if (changed) this.onChange();
  }

  /** Objective lines for the tracker / quest log. */
  lines(id: string): string[] {
    const q = this.def(id), s = this.state.get(id);
    if (!s) return [];
    if (s.status === 'ready') return [`Report to ${q.turnIn ?? q.giver}`];
    if (s.status === 'done') return ['Completed'];
    return q.objectives.map((o, i) => {
      const n = o.n ?? 1;
      return n > 1 ? `${o.text} (${Math.min(s.prog[i], n)}/${n})` : o.text;
    });
  }

  all(): { id: string; status: Status }[] {
    return QUESTS.map((q) => ({ id: q.id, status: this.status(q.id) })).filter((q) => q.status !== 'none');
  }
}
