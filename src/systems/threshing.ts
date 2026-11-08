import * as THREE from 'three';
import { createDragon, type Dragon } from '../entities/dragon';
import { rollSpecies, BOND_NAMES, type Species, type DragonSpec } from '../data/dragons';
import { heightAt } from '../world/terrain';
import type { Player } from '../entities/player';

export interface Bond { species: Species; spec: DragonSpec; }

interface Cand { species: Species; name: string; d: Dragon; accepted: boolean; }

const CENTER = new THREE.Vector3(236, 0, -15);

/**
 * The Threshing: dragons gather on the Flight Field and decide, one after another, whether to accept the rider.
 * Which species turns up follows Species.weight; each one accepts with Species.accept, otherwise it scorches
 * the rider (never lethal here) and leaves. Rarer, pickier dragons make for rarer bonds.
 */
export class Threshing {
  active = false;
  onMessage: (a: string, b: string) => void = () => {};
  onBond: (b: Bond) => void = () => {};
  private cands: Cand[] = [];
  private idx = 0;
  private phase: 'gather' | 'approach' | 'judge' | 'leave' | 'idle' = 'idle';
  private pt = 0;
  private from = new THREE.Vector3();

  constructor(private scene: THREE.Scene) {}

  start(player: Player): void {
    if (this.active) return;
    this.active = true; this.idx = 0; this.cands = [];
    const used: Species[] = [];
    const n = 4 + Math.floor(Math.random() * 4); // a random handful of the dragons turns up, not all of them
    for (let i = 0; i < n; i++) {
      const s = rollSpecies(used); used.push(s);
      const name = BOND_NAMES[Math.floor(Math.random() * BOND_NAMES.length)];
      const d = createDragon({ name, color: s.hex, tail: s.tail, size: s.size });
      const a = (i / n) * Math.PI * 2;
      d.group.position.set(CENTER.x + Math.cos(a) * 40, 0, CENTER.z + Math.sin(a) * 40);
      d.group.position.y = heightAt(d.group.position.x, d.group.position.z) + 1.5;
      d.group.rotation.y = Math.atan2(-(CENTER.x - d.group.position.x), -(CENTER.z - d.group.position.z));
      this.scene.add(d.group);
      this.cands.push({ species: s, name, d, accepted: false });
    }
    this.phase = 'gather'; this.pt = 0;
    this.onMessage('The Threshing', 'Dragons gather on the Flight Field. Stand your ground in the open.');
    void player;
  }

  update(dt: number, t: number, player: Player): void {
    for (const c of this.cands) c.d.update(t, 0.4);
    if (!this.active) return;
    this.pt += dt;
    const c = this.cands[this.idx];
    if (!c) return;
    const g = c.d.group;
    if (this.phase === 'gather') {
      if (this.pt > 5) {
        this.phase = 'approach'; this.pt = 0; this.from.copy(g.position);
        this.onMessage(`A ${c.species.color} ${c.species.tail}tail approaches`, `(${c.species.rarity}, ${c.species.note})`);
      }
    } else if (this.phase === 'approach') {
      const k = Math.min(1, this.pt / 5);
      const dir = new THREE.Vector3(player.pos.x - this.from.x, 0, player.pos.z - this.from.z);
      const len = dir.length();
      dir.normalize();
      const target = new THREE.Vector3(player.pos.x - dir.x * 6, 0, player.pos.z - dir.z * 6);
      g.position.lerpVectors(this.from, target, k);
      g.position.y = heightAt(g.position.x, g.position.z) + 1.5 + Math.sin(k * Math.PI) * 4;
      g.rotation.y = Math.atan2(-dir.x, -dir.z);
      if (k >= 1 || len < 8) { this.phase = 'judge'; this.pt = 0; }
    } else if (this.phase === 'judge') {
      if (this.pt > 1.8) {
        if (Math.random() < c.species.accept) {
          c.accepted = true;
          this.finish(c);
        } else {
          this.onMessage('Rejected', `The ${c.species.color} ${c.species.tail}tail burns you and flies off.`);
          player.damage(Math.min(35, Math.max(0, player.health - 5)));
          this.phase = 'leave'; this.pt = 0;
        }
      }
    } else if (this.phase === 'leave') {
      g.position.y += dt * 16;
      g.position.x += dt * 12;
      if (this.pt > 3) {
        g.visible = false;
        this.idx++;
        this.phase = 'gather'; this.pt = 3;
        if (this.idx >= this.cands.length) {
          // everybody refused: the field fills with fresh candidates
          this.cleanup();
          this.active = false;
          this.onMessage('No dragon chose you', 'Walk back into the field to try again.');
        }
      }
    }
  }

  private finish(c: Cand): void {
    this.active = false;
    this.phase = 'idle';
    for (const o of this.cands) { if (o !== c) o.d.group.visible = false; }
    // chosen dragon is replaced by the mount; remove the candidate
    this.scene.remove(c.d.group);
    this.cands = [];
    this.onBond({ species: c.species, spec: { name: c.name, color: c.species.hex, tail: c.species.tail, size: c.species.size } });
  }

  private cleanup(): void {
    for (const c of this.cands) this.scene.remove(c.d.group);
    this.cands = [];
  }
}
