/** Tiny procedural audio: ambient music loop, NPC "babble" voices and simple sound effects (no assets). */
export class GameAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicGain!: GainNode;
  private musicOn = false;
  muted = false;

  /** Call from a user gesture (click/keypress). */
  start(): void {
    if (this.ctx) { void this.ctx.resume(); return; }
    try {
      this.ctx = new AudioContext();
    } catch { return; }
    this.master = this.ctx.createGain(); this.master.gain.value = 0.7; this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.18; this.musicGain.connect(this.master);
    this.startMusic();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.7;
    return this.muted;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, dest: AudioNode, when = 0, slideTo?: number): void {
    const c = this.ctx!; const t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.03, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.05);
  }

  private noise(dur: number, vol: number, lo: number, hi: number, when = 0): void {
    const c = this.ctx!; const t = c.currentTime + when;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(hi, t); f.frequency.exponentialRampToValueAtTime(lo, t + dur); f.Q.value = 0.8;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t);
  }

  // ---- music: a slow minor-mode drone with a sparse random arpeggio (D minor pentatonic-ish)
  private startMusic(): void {
    if (this.musicOn) return;
    this.musicOn = true;
    const c = this.ctx!;
    const drone = [73.42, 110];
    for (const f of drone) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.value = f; g.gain.value = 0.05;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
      o.connect(lp); lp.connect(g); g.connect(this.musicGain); o.start();
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 0.07; lg.gain.value = 120; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    }
    const scale = [146.83, 174.61, 196, 220, 261.63, 293.66, 349.23];
    let step = 0;
    const tick = () => {
      if (!this.ctx) return;
      if (Math.random() < 0.55) {
        const f = scale[Math.floor(Math.random() * scale.length)] * (Math.random() < 0.25 ? 2 : 1);
        this.tone(f, 2.4, 'triangle', 0.16, this.musicGain);
      }
      step++;
      if (step % 8 === 0) this.tone(drone[0] * 0.5, 5, 'sine', 0.3, this.musicGain);
      setTimeout(tick, 1100 + Math.random() * 900);
    };
    tick();
  }

  // ---- voices
  /** Nonsense babble so NPCs seem to speak. `pitch` ~ 0.7 (deep) .. 1.6 (high). */
  babble(pitch = 1, syllables = 12): void {
    if (!this.ctx) return;
    for (let i = 0; i < syllables; i++) {
      const f = (170 + Math.random() * 130) * pitch;
      this.tone(f, 0.08 + Math.random() * 0.05, 'square', 0.05, this.master, i * 0.095, f * (0.8 + Math.random() * 0.5));
    }
  }

  // ---- sfx
  swing(): void { if (this.ctx) this.noise(0.18, 0.25, 600, 2400); }
  hit(): void { if (this.ctx) { this.noise(0.12, 0.3, 200, 900); this.tone(120, 0.12, 'square', 0.12, this.master, 0, 60); } }
  fire(): void { if (this.ctx) { this.noise(0.5, 0.3, 300, 1500); this.tone(180, 0.4, 'sawtooth', 0.08, this.master, 0, 90); } }
  lightning(): void { if (this.ctx) { this.noise(0.25, 0.4, 800, 6000); this.tone(900, 0.2, 'sawtooth', 0.08, this.master, 0, 120); } }
  heal(): void { if (this.ctx) { this.tone(523, 0.3, 'sine', 0.14, this.master); this.tone(784, 0.4, 'sine', 0.14, this.master, 0.12); } }
  pickup(): void { if (this.ctx) { this.tone(880, 0.12, 'triangle', 0.15, this.master); this.tone(1320, 0.2, 'triangle', 0.15, this.master, 0.09); } }
  quest(): void { if (this.ctx) [392, 494, 587, 784].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.16, this.master, i * 0.12)); }
  roar(): void { if (this.ctx) { this.tone(95, 1.2, 'sawtooth', 0.22, this.master, 0, 45); this.noise(1.0, 0.18, 120, 700); } }
  meow(): void { if (this.ctx) this.tone(700, 0.4, 'sine', 0.12, this.master, 0, 420); }
  hurt(): void { if (this.ctx) this.tone(220, 0.25, 'sawtooth', 0.15, this.master, 0, 110); }
  step(): void { if (this.ctx) this.noise(0.06, 0.08, 150, 500); }
}

export const audio = new GameAudio();
