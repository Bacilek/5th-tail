/** True when a key event comes from a text field (name entry etc.), so game hotkeys must ignore it. */
export function isTyping(e: Event): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
}

export class Input {
  private keys = new Set<string>();
  private pressed = new Set<string>();
  private buttons = new Set<number>();
  private pressedButtons = new Set<number>();
  dx = 0;
  dy = 0;
  locked = false;

  constructor(private el: HTMLElement) {
    addEventListener('keydown', (e) => {
      if (e.repeat || isTyping(e)) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
      if (e.code === 'Space' || e.code === 'Tab') e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    el.addEventListener('mousedown', (e) => {
      if (!this.locked) { el.requestPointerLock(); return; }
      this.buttons.add(e.button);
      this.pressedButtons.add(e.button);
    });
    addEventListener('mouseup', (e) => this.buttons.delete(e.button));
    addEventListener('contextmenu', (e) => e.preventDefault());
    addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.dx += e.movementX;
      this.dy += e.movementY;
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.el;
      if (!this.locked) { this.keys.clear(); this.buttons.clear(); }
    });
  }

  isDown(code: string): boolean { return this.keys.has(code); }
  wasPressed(code: string): boolean { return this.pressed.has(code); }
  buttonDown(b: number): boolean { return this.buttons.has(b); }
  buttonPressed(b: number): boolean { return this.pressedButtons.has(b); }

  endFrame(): void {
    this.pressed.clear();
    this.pressedButtons.clear();
    this.dx = 0;
    this.dy = 0;
  }
}
