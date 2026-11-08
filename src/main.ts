import * as THREE from 'three';
import { Input, isTyping } from './engine/input';
import {
  buildTerrain, heightAt, towerStairAt, inRect, onParapet, PARAPET, TOWER, PLATEAU, CAMP, VILLAGE, HEALERS, INFANTRY, SCRIBE, CITADEL, CITADEL_Y, FIELD,
} from './world/terrain';
import { buildVillage, buildCamp } from './world/areas';
import { makeLabel, buildCollege, buildParapet, buildHealers, buildInfantry, buildScribes, buildCitadel } from './world/college';
import { Sky } from './world/sky';
import { DayNight } from './systems/daynight';
import { buildTrees } from './world/trees';
import { Player } from './entities/player';
import { Enemy, type EnemyKind } from './entities/enemy';
import { createDragon, type Dragon } from './entities/dragon';
import { DRAGONS, TAIL_ATTACKS, BOND_SPECIES } from './data/dragons';
import { DragonMount } from './entities/mount';
import { CLASSES, type ClassId } from './data/classes';
import { Combat } from './systems/combat';
import { Hud } from './ui/hud';
import { Panels } from './ui/panels';
import { QuestLog } from './systems/quests';
import { QUESTS } from './data/quests';
import { NPCS } from './data/npcs';
import { Npc } from './entities/npc';
import { Cat } from './entities/cat';
import { buildPickups } from './systems/pickups';
import { Broom } from './entities/broom';
import { Race } from './systems/race';
import { audio } from './engine/audio';
import { PerfOverlay } from './ui/perf';
import { Humanoid, type HumanoidState } from './entities/humanoid';
import { ITEMS, type ItemId } from './data/items';
import { Minimap, type Marker } from './ui/minimap';
import { saveCharacter, readSave, writeSave, type SavedChar, type SaveData } from './engine/saves';
import { settings } from './engine/settings';
import { Menus } from './ui/menu';
import { Gauntlet } from './systems/gauntlet';
import { FlightField } from './world/field';
import { buildQuadrantDetails } from './world/quadrants';
import { Threshing, type Bond } from './systems/threshing';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x8a8c9a, 90, 520);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 1500);

const sky = new Sky();
scene.add(sky.group);
const hemi = new THREE.HemisphereLight(0xb8c4ee, 0x3a3328, 1.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd7a8, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera;
sc.left = -70; sc.right = 70; sc.top = 70; sc.bottom = -70; sc.near = 1; sc.far = 400;
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);
const dn = new DayNight(sky, sun, hemi, scene);

scene.add(buildTerrain(), buildCollege(), buildHealers(), buildInfantry(), buildScribes(), buildCitadel(), buildParapet(), buildVillage(), buildCamp(), buildTrees());
const field = new FlightField();
scene.add(field.group, buildQuadrantDetails());
dn.collectLights();

// Decorative dragons circling the Citadel ridge (species/tails from Fourth Wing lore)
const circling: { d: Dragon; r: number; alt: number; speed: number; phase: number }[] = [];
// only a random selection of the dragons is around on any given day (not all of them gather)
const todaysDragons = [...DRAGONS].sort(() => Math.random() - 0.5).slice(0, 4 + Math.floor(Math.random() * 3));
todaysDragons.forEach((spec, i) => {
  const d = createDragon(spec);
  scene.add(d.group);
  circling.push({ d, r: 70 + (i % 3) * 25, alt: 85 + i * 8, speed: (i % 2 ? 1 : -1) * (0.05 + i * 0.004), phase: i * 0.9 });
});

const input = new Input(renderer.domElement);
const hud = new Hud();
const combat = new Combat(scene);
const player = new Player(camera, combat, scene);

// Hostiles: a mixed roster along the roads and at the Venin camp (with a boss commander)
function makeEnemy(x: number, z: number, kind: EnemyKind = 'venin'): Enemy {
  const e = new Enemy(x, z, kind);
  e.onShoot = (origin, dir) => combat.arrow(origin, dir, 34, e.def.dmg, true, e);
  scene.add(e.group);
  combat.enemies.push(e);
  e.upgrade();
  return e;
}
for (const [x, z, k] of [[-20, 130, 'venin'], [20, 140, 'archer'], [0, 160, 'brute'], [-70, 90, 'wolf'], [-73, 87, 'wolf'], [75, 70, 'soldier'], [-60, -150, 'venin'], [60, 150, 'wolf']] as [number, number, EnemyKind][]) makeEnemy(x, z, k);
for (const [x, z, k] of [[84, 118, 'venin'], [108, 116, 'soldier'], [92, 140, 'archer'], [112, 138, 'venin'], [98, 128, 'brute']] as [number, number, EnemyKind][]) makeEnemy(x, z, k);
{
  const boss = makeEnemy(96, 108, 'boss');
  boss.onPhase = () => {
    hud.announce('The Commander roars', 'Reinforcements arrive!', 3);
    audio.roar();
    makeEnemy(boss.group.position.x - 8, boss.group.position.z + 6, 'venin').alert();
    makeEnemy(boss.group.position.x + 8, boss.group.position.z + 6, 'archer').alert();
  };
}
combat.getPlayerPos = () => player.pos;
combat.onPlayerHit = (dmg, from) => player.damage(dmg, false, from); // arrows: no melee source, so a perfect block never staggers bystanders
let kills = 0;
let gauntletDone = false;
let wingLabel = '';
let lastBond: { species: number; name: string } | null = null;
const broom = new Broom(scene);
const race = new Race(scene);
const gauntlet = new Gauntlet();
scene.add(gauntlet.group);
const fieldLabel = makeLabel('The Flight Field', '#ffe9b0', 40); fieldLabel.position.set(234, CITADEL_Y + 22, -15); scene.add(fieldLabel);
gauntlet.onMessage = (a, b) => hud.announce(a, b, 4);
const threshing = new Threshing(scene);
threshing.onMessage = (a, b) => { hud.announce(a, b, 5); if (a.includes('approaches') || a === 'Rejected') audio.roar(); };
threshing.onBond = (b) => bondDragon(b);
race.onMessage = (a, b) => hud.announce(a, b, 4);
const quests = new QuestLog();
const perf = new PerfOverlay(renderer, () => `pos ${player.pos.x.toFixed(0)}, ${player.pos.y.toFixed(0)}, ${player.pos.z.toFixed(0)}  hour ${dn.clock}`);
const minimap = new Minimap();
const panels = new Panels(quests);
const npcs = NPCS.map((d) => new Npc(d));
npcs.forEach((n) => scene.add(n.group));
const cat = new Cat(8, 20);
scene.add(cat.group);
const pickups = buildPickups(scene);
combat.onKill = () => { audio.hit(); hud.setKills(++kills, quests.gold); quests.kill(); };
quests.onChange = ((prev) => () => { prev(); hud.setKills(kills, quests.gold); })(quests.onChange);

function talkTo(npc: Npc): void {
  const id = npc.def.id, name = npc.def.name;
  quests.talk(id);
  const ready = QUESTS.find((q) => (q.turnIn ?? q.giver) === id && quests.status(q.id) === 'ready');
  if (ready) {
    panels.open(name, ready.outro, [{ label: 'Thank you.', cb: () => { const g = quests.turnIn(ready.id); hud.announce('Quest complete', `${ready.title}  +${g} gold`, 4); audio.quest(); } }]);
    return;
  }
  const offer = QUESTS.find((q) => q.giver === id && quests.status(q.id) === 'none' && (!q.requires || quests.status(q.requires) === 'done'));
  if (offer) {
    panels.open(name, offer.intro, [
      { label: 'I will do it.', cb: () => { quests.start(offer.id); hud.announce('Quest started', offer.title, 3); } },
      { label: 'Not now.' },
    ]);
    return;
  }
  const active = QUESTS.find((q) => q.giver === id && (quests.status(q.id) === 'active' || quests.status(q.id) === 'ready'));
  if (active) { panels.open(name, active.remind, [{ label: 'Understood.' }]); return; }
  panels.open(name, npc.def.chat[Math.floor(Math.random() * npc.def.chat.length)], [{ label: 'Farewell.' }]);
}

function talkToCat(): void {
  if (!cat.adopted) {
    panels.open('Broccoli', 'A scrawny orange kitten stares up at you, thoroughly unimpressed, then decides you will do.', [
      { label: 'Adopt Broccoli.', cb: () => { cat.adopted = true; hud.announce('Broccoli joins you', 'The cat will follow you around.', 4); } },
      { label: 'Leave it.' },
    ]);
  } else {
    panels.open('Broccoli', 'Mrrrow.', [{ label: 'Pet Broccoli.' }]);
  }
}

type Target = { name: string; dist: number; act: () => void };
function nearestInteractable(): Target | null {
  let best: Target | null = null;
  const p = player.pos;
  for (const n of npcs) {
    const d = Math.hypot(n.pos.x - p.x, n.pos.z - p.z);
    if (d < 3.5 && Math.abs(n.pos.y - p.y) < 4 && (!best || d < best.dist)) best = { name: n.def.name, dist: d, act: () => talkTo(n) };
  }
  const dc = Math.hypot(cat.pos.x - p.x, cat.pos.z - p.z);
  if (dc < 2.5 && Math.abs(cat.pos.y - p.y) < 3 && (!best || dc < best.dist)) best = { name: 'Broccoli', dist: dc, act: talkToCat };
  return best;
}

// ---- Story: Conscription Day, class choice, Parapet (Riders only), quadrant arrival, wing sorting
let chosen: ClassId | null = null;
type Stage = 'select' | 'go' | 'parapet' | 'citadel' | 'threshing' | 'done';
let mount: DragonMount | null = null;
let stage: Stage = 'select';

const SECTIONS = ['Flame', 'Claw', 'Tail'];
const WING_NAMES = ['First', 'Second', 'Third', 'Fourth'];

// Players start in the lower college assembly square, looking north at the administration keep.
player.setSpawn(0, heightAt(0, 24), 24, 0);
player.teleportToSpawn();
camera.far = 1500;
hud.setObjective('');

function onChosen(id: ClassId): void {
  chosen = id;
  minimap.show();
  if (currentChar) { currentChar.classId = id; saveCharacter(currentChar); }
  panels.enabled = true;
  player.setClass(id);
  hud.showMagicka(CLASSES[id].maxMagicka > 0);
  hud.setClassLabel(`${player.name} - ${CLASSES[id].name}`);
  hud.setHands(player.hands[0], player.hands[1]);
  if (id === 'rider') {
    // Riders go up the Conscription Tower and cross the Parapet
    player.setSpawn(TOWER.x + 3.2, TOWER.top, TOWER.z, -Math.PI / 2);
    player.teleportToSpawn();
    stage = 'parapet';
    hud.setObjective('Cross the Parapet to the Riders Quadrant');
    hud.announce('Conscription Day', 'Riders cross the Parapet. Many do not survive. Wind gusts push sideways: correct with A and D.', 6);
  } else {
    stage = 'go';
    const dir = { infantry: 'north', healer: 'south', scribe: 'west tunnel' }[id];
    hud.setObjective(`Report to the ${CLASSES[id].name} Quadrant (${dir})`);
    hud.announce('Conscription Day', `You chose the ${CLASSES[id].name} Quadrant.`, 5);
  }
  renderer.domElement.requestPointerLock();
}
// Quick select: remember the character's look and chosen class (quest progress is not saved)
let currentChar: SavedChar | null = null;
function startCreator(): void {
  hud.showCharacterCreator((look, id) => {
    currentChar = { id, look };
    player.applyLook(look);
    hud.showClassSelect(onChosen);
  }, (c) => {
    currentChar = c;
    player.applyLook(c.look);
    const sv = readSave(c.id);
    if (sv && c.classId) applySave(sv);
    else if (c.classId) onChosen(c.classId);
    else hud.showClassSelect(onChosen);
  });
}

// ---- Settings, saving, pause menu and title screen
function applyQuality(): void {
  const q = settings.quality;
  renderer.setPixelRatio(q === 'low' ? 0.7 : q === 'medium' ? Math.min(devicePixelRatio, 1) : Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  const size = q === 'high' ? 2048 : 1024;
  if (sun.shadow.mapSize.x !== size) { sun.shadow.map?.dispose(); sun.shadow.map = null; sun.shadow.mapSize.set(size, size); }
}
function applySettings(): void {
  camera.fov = settings.fov;
  camera.updateProjectionMatrix();
  applyQuality();
  audio.applySettings();
}

function objectiveFor(st: Stage): string {
  if (st === 'parapet') return 'Cross the Parapet to the Riders Quadrant';
  if (st === 'citadel' || st === 'threshing') return 'Run the Gauntlet east of the Citadel to reach the Flight Field';
  if (st === 'go' && chosen) {
    const dir = { infantry: 'north', healer: 'south', scribe: 'west tunnel', rider: '' }[chosen];
    return `Report to the ${CLASSES[chosen].name} Quadrant (${dir})`;
  }
  return '';
}

function snapshot(): SaveData | null {
  if (!chosen || !currentChar) return null;
  return {
    version: 1, charId: currentChar.id, savedAt: Date.now(), classId: chosen,
    player: { x: player.pos.x, y: player.pos.y, z: player.pos.z, yaw: player.yaw, health: player.health, magicka: player.magicka, stamina: player.stamina, hands: [player.hands[0], player.hands[1]] },
    quests: quests.snapshot(), stage, wing: wingLabel, kills, hour: dn.hour,
    takenPickups: pickups.map((p, i) => (p.taken ? i : -1)).filter((i) => i >= 0),
    catAdopted: cat.adopted, bond: lastBond,
    gauntlet: { done: gauntletDone, best: Number.isFinite(gauntlet.best) ? gauntlet.best : null },
    raceBest: Number.isFinite(race.best) ? race.best : null,
  };
}

function saveGame(): boolean {
  const d = snapshot();
  return d ? writeSave(d) : false;
}

function applySave(d: SaveData): void {
  chosen = d.classId;
  minimap.show();
  panels.enabled = true;
  player.setClass(d.classId);
  player.setHands(d.player.hands[0] as ItemId, d.player.hands[1] as ItemId);
  player.health = d.player.health; player.magicka = d.player.magicka; player.stamina = d.player.stamina;
  player.pos.set(d.player.x, d.player.y, d.player.z); player.yaw = d.player.yaw; player.vel.set(0, 0, 0);
  hud.showMagicka(CLASSES[d.classId].maxMagicka > 0);
  hud.setClassLabel(`${player.name} - ${CLASSES[d.classId].name}`);
  hud.setHands(player.hands[0], player.hands[1]);
  quests.restore(d.quests);
  kills = d.kills; hud.setKills(kills, quests.gold);
  pickups.forEach((p, i) => { p.taken = d.takenPickups.includes(i); });
  cat.adopted = d.catAdopted;
  if (cat.adopted) cat.pos.set(player.pos.x + 2, player.pos.y, player.pos.z + 2);
  dn.setHour(d.hour);
  gauntletDone = d.gauntlet.done; gauntlet.best = d.gauntlet.best ?? Infinity; race.best = d.raceBest ?? Infinity;
  if (d.bond) {
    const sp = BOND_SPECIES[d.bond.species] ?? BOND_SPECIES[0];
    bondDragon({ species: sp, spec: { name: d.bond.name, color: sp.hex, tail: sp.tail, size: sp.size } }, true);
  }
  stage = d.stage as Stage;
  wingLabel = d.wing; if (wingLabel) hud.setWing(wingLabel);
  hud.setObjective(objectiveFor(stage));
  player.setSpawn(player.pos.x, player.pos.y, player.pos.z, player.yaw);
  hud.announce('Welcome back', player.name, 3);
  renderer.domElement.requestPointerLock();
}

const menus = new Menus({
  onNew: () => startCreator(),
  onSettingsChanged: () => applySettings(),
  onResume: () => { renderer.domElement.requestPointerLock(); },
  onSave: () => saveGame(),
  onQuit: () => { saveGame(); location.reload(); },
});
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && chosen && !panels.dialogOpen && !minimap.mapOpen && !menus.pauseOpen) menus.showPause();
});
addEventListener('keydown', (e) => { if (e.code === 'Escape' && menus.pauseOpen) menus.hidePause(); });
addEventListener('beforeunload', () => { saveGame(); });
let autosaveT = 0;
applySettings();
menus.showTitle();

player.onRespawn = () => {
  if (chosen === 'rider') { stage = 'parapet'; hud.setObjective('Cross the Parapet to the Riders Quadrant'); }
  hud.announce('You fell.', chosen === 'rider' ? 'The Parapet claims another. Try again.' : 'Try again.', 4);
};
player.onDeath = () => { hud.announce('You died', '', 3); };
player.onDamaged = () => { hud.flashDamage(); audio.hurt(); };
player.onStep = () => audio.step();
player.onBlock = (kind, _from, source) => {
  audio.hit();
  if (kind === 'perfect') { hud.announce('Perfect block', '', 0.8); source?.stagger(1.2, 0, 0); hitStop = 0.08; } // only the attacker that was blocked is staggered
  else if (kind === 'break') hud.announce('Guard broken', 'Out of stamina', 1);
};
player.onDodge = (perfect) => {
  audio.swing();
  if (perfect) { hud.announce('Perfect dodge', '', 0.8); player.stamina = Math.min(player.maxStamina, player.stamina + 14); hitStop = 0.1; }
};
player.onDodgeStart = () => audio.swing();
combat.onHit = (_e, power) => { audio.hit(); hitStop = power ? 0.09 : 0.04; };
player.onAttack = (k) => { if (k === 'melee') audio.swing(); else if (k === 'fireball') audio.fire(); else if (k === 'lightning') audio.lightning(); else audio.heal(); };
panels.onOpen = (name) => {
  if (name === 'Broccoli') { audio.meow(); return; }
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 97;
  audio.babble(0.75 + (h % 10) * 0.09, 10 + (h % 6));
};
addEventListener('pointerdown', () => audio.start());
addEventListener('keydown', (e) => {
  if (isTyping(e)) return;
  audio.start();
  if (e.code === 'KeyN') hud.announce(audio.toggleMute() ? 'Sound off' : 'Sound on', '', 1.5);
  if (e.code === 'KeyM' && chosen && !panels.dialogOpen) {
    minimap.toggle();
    if (!minimap.mapOpen) renderer.domElement.requestPointerLock();
  }
});

// waypoint beam in the world
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 140, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xff40c0, transparent: true, opacity: 0.4, depthWrite: false, fog: false }));
beam.visible = false;
scene.add(beam);
minimap.onWaypoint = (w) => {
  beam.visible = !!w;
  if (w) beam.position.set(w.x, heightAt(w.x, w.z) + 70, w.z);
};

function questMarkers(): Marker[] {
  const out: Marker[] = [];
  for (const q of QUESTS) {
    const st = quests.status(q.id);
    if (st === 'none' && (!q.requires || quests.status(q.requires) === 'done')) {
      const n = npcs.find((m) => m.def.id === q.giver);
      if (n) out.push({ x: n.pos.x, z: n.pos.z, kind: 'give' });
    } else if (st === 'ready') {
      const n = npcs.find((m) => m.def.id === (q.turnIn ?? q.giver));
      if (n) out.push({ x: n.pos.x, z: n.pos.z, kind: 'turnin' });
    }
  }
  return out;
}
player.onHandsChanged = () => hud.setHands(player.hands[0], player.hands[1]);
hud.setKills(0);

function bondDragon(b: Bond, silent = false): void {
  stage = 'done';
  const spec = b.spec;
  lastBond = { species: BOND_SPECIES.indexOf(b.species), name: spec.name };
  mount = new DragonMount(spec, scene, combat);
  hud.setObjective('');
  hud.setDragonLine(`Dragon: ${spec.name} (${b.species.color} ${b.species.tail}tail, ${b.species.rarity}) - R summon, F mount`);
  if (silent) return;
  audio.roar();
  hud.announce('The Threshing', `${spec.name}, a ${b.species.color} ${b.species.tail}tail (${b.species.rarity}), has chosen you.`, 8);
}

function story(): void {
  if (!chosen) return;
  const { x, y, z } = player.pos;
  if (stage === 'go') {
    const target = { infantry: INFANTRY, healer: HEALERS, scribe: SCRIBE }[chosen as 'infantry' | 'healer' | 'scribe'];
    if (inRect(target, x, z)) {
      stage = 'done';
      hud.setObjective('');
      hud.announce(`${CLASSES[chosen].name} Quadrant`, 'Your training begins.', 5);
    }
  } else if (stage === 'parapet') {
    if (inRect(CITADEL, x, z) && y > CITADEL_Y - 1 && x > CITADEL.x0 + 4) {
      stage = 'citadel';
      const wing = Math.floor(Math.random() * 4), section = Math.floor(Math.random() * 3), squad = 1 + Math.floor(Math.random() * 3);
      const label = `${WING_NAMES[wing]} Wing - ${SECTIONS[section]} Section - Squad ${squad}`;
      wingLabel = label;
      hud.setWing(label);
      hud.setObjective('');
      hud.announce('You crossed the Parapet', `Assigned to the ${label}`, 7);
    }
  } else if (stage === 'citadel') {
    stage = 'threshing';
    hud.setObjective('Run the Gauntlet east of the Citadel to reach the Flight Field');
  } else if (stage === 'threshing') {
    if (inRect(FIELD, x, z) && y > CITADEL_Y - 2 && !threshing.active) {
      hud.setObjective('Stand in the field. The dragons will choose.');
      threshing.start(player);
    }
  }
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

const demo: { h: Humanoid; st: HumanoidState }[] = [];
void Humanoid.preload().then(() => { player.enableModel(); npcs.forEach((n) => n.upgrade()); combat.enemies.forEach((e) => e.upgrade()); });
const clock = new THREE.Clock();
let hitStop = 0;
renderer.setAnimationLoop(() => {
  const rawDt = Math.min(clock.getDelta(), 0.05);
  const dt = hitStop > 0 ? rawDt * 0.12 : rawDt;
  hitStop = Math.max(0, hitStop - rawDt);
  const t = clock.elapsedTime;

  if (!chosen) {
    player.sync(dt);
  } else if (panels.dialogOpen || minimap.mapOpen || menus.pauseOpen) {
    player.sync(dt);
  } else {
    // Parapet wind: strong gusts push sideways
    player.windZ = onParapet(player.pos.x, player.pos.y, player.pos.z)
      ? 1.0 * Math.sin(t * 0.9) + 0.7 * Math.sin(t * 2.3 + 1)
      : 0;
    if (mount && input.wasPressed(settings.keys.summon) && !mount.mounted) { mount.summon(player); hud.announce(mount.spec.name, 'answers your call...', 3); }
    const near = mount?.mounted ? null : nearestInteractable();
    panels.setPrompt(near ? `F - Talk to ${near.name}` : '');
    if (near && input.wasPressed('KeyF')) { near.act(); }
    else if (mount && !broom.active && input.wasPressed('KeyF')) {
      if (mount.mounted) {
        if (!mount.dismount(player)) hud.announce('Too high', 'Land before dismounting.', 2);
        else hud.setHands(player.hands[0], player.hands[1]);
      } else if (mount.canMount(player)) {
        mount.mount(player);
        hud.announce('Mounted', `LMB fire breath - RMB ${TAIL_ATTACKS[mount.spec.tail].name} - Shift boost - F land+dismount`, 4);
      }
    }
    if (input.wasPressed(settings.keys.broom) && !mount?.mounted) {
      if (broom.active) {
        if (!broom.dismount(player)) hud.announce('Too high', 'Land before dismounting.', 2);
        else hud.setHands(player.hands[0], player.hands[1]);
      } else {
        broom.mount(player);
        hud.announce('Broom', 'Mouse steers - W/S speed - Shift boost - V camera - B land', 4);
      }
    }
    if (broom.active && input.wasPressed(settings.keys.camera)) player.thirdPerson = !player.thirdPerson;
    if (mount?.mounted || broom.active) player.tickRegen(dt);
    if (mount?.mounted) {
      mount.update(dt, input, player, camera);
    } else if (broom.active) {
      broom.update(dt, input, player, camera);
      mount?.update(dt, input, player, camera);
    } else {
      player.update(dt, input);
      mount?.update(dt, input, player, camera);
    }
    for (const n of npcs) {
      if (Math.abs(n.pos.y - player.pos.y) < 2) {
        const dx = player.pos.x - n.pos.x, dz = player.pos.z - n.pos.z, d = Math.hypot(dx, dz), min = 0.85;
        if (d < min && d > 1e-4) { player.pos.x = n.pos.x + (dx / d) * min; player.pos.z = n.pos.z + (dz / d) * min; }
      }
    }
    if (gauntlet.update(dt, t, player)) gauntletDone = true;
    threshing.update(dt, t, player);
    field.update(t);
    race.update(dt, player.pos, broom.active);
    hud.setRaceLine(race.label || gauntlet.label);
    story();
    // quest world logic
    quests.reach('gauntletDone', gauntletDone);
    quests.reach('raceDone', race.completed);
    quests.reach('campFound', inRect(CAMP, player.pos.x, player.pos.z));
    quests.reach('villageFound', inRect(VILLAGE, player.pos.x, player.pos.z));
    quests.reach('flyTower', !!mount?.mounted && mount.pos.distanceTo(new THREE.Vector3(TOWER.x, TOWER.top, TOWER.z)) < 14);
    for (const pk of pickups) {
      const st = quests.status(pk.quest);
      pk.mesh.visible = !pk.taken && st === 'active';
      pk.mesh.position.y = pk.base + Math.sin(t * 2 + pk.mesh.position.x) * 0.15;
      pk.mesh.rotation.y = t;
      if (pk.mesh.visible && pk.mesh.position.distanceTo(player.pos) < 2.6) { pk.taken = true; pk.mesh.visible = false; audio.pickup(); quests.collect(pk.item); }
    }
    const tgt = new THREE.Vector3(player.pos.x, player.pos.y, player.pos.z);
    for (const e of combat.enemies) {
      if (e.justAlerted) { e.justAlerted = false; for (const o of combat.enemies) if (o !== e && o.alive && o.group.position.distanceTo(e.group.position) < 16) o.alert(); }
      const dmg = e.update(dt, tgt, player.alive);
      if (dmg > 0) player.damage(dmg, false, e.group.position, e, e.lastUnblockable);
    }
    hud.setWarning(combat.enemies.some((e) => e.alive && e.telegraphUnblockable && e.group.position.distanceTo(player.pos) < 9));
    combat.update(dt);
  }

  npcs.forEach((n) => n.update(t, player.pos, dt));
  cat.update(dt, t, player.pos);
  circling.forEach((c, i) => {
    const a = c.phase + t * c.speed;
    const x = 110 + Math.cos(a) * c.r, z = -20 + Math.sin(a) * c.r;
    const y = c.alt + Math.sin(a * 2 + i) * 8;
    const vx = -Math.sin(a) * Math.sign(c.speed), vz = Math.cos(a) * Math.sign(c.speed);
    c.d.group.position.set(x, y, z);
    c.d.group.rotation.set(0, Math.atan2(-vx, -vz), 0.15 * Math.sign(c.speed));
    c.d.update(t + i);
  });

  if (chosen && !menus.pauseOpen) { autosaveT += dt; if (autosaveT > 45) { autosaveT = 0; saveGame(); } }
  for (const d of demo) d.h.pose(d.st, dt);
  dn.update(dt, player.pos, camera.position);
  minimap.clock = (dn.day > 0.5 ? 'Day ' : 'Night ') + dn.clock;

  if (chosen) minimap.update({ x: player.pos.x, z: player.pos.z, yaw: player.yaw }, questMarkers());
  hud.update(
    player.health / player.maxHealth,
    player.maxMagicka > 0 ? player.magicka / player.maxMagicka : 0,
    player.stamina / player.maxStamina,
    dt,
  );
  renderer.render(scene, camera);
  perf.tick();
  input.endFrame();
});

// debug hook for automated testing
(window as unknown as { __game: unknown }).__game = { player, combat, camera, heightAt, towerStairAt, TOWER, PARAPET, PLATEAU, onChosen, setHour: (h: number) => dn.setHour(h),
  teleport: (x: number, z: number) => { player.pos.set(x, heightAt(x, z) + 0.2, z); player.vel.set(0, 0, 0); },
  give: (hand: 0 | 1, item: ItemId) => { if (ITEMS[item]) { player.hands[hand] = item; player.onHandsChanged(); } },
  startQuest: (id: string) => quests.start(id),
  bond: (i = 0) => { const sp = BOND_SPECIES[i % BOND_SPECIES.length]; bondDragon({ species: sp, spec: { name: 'Testdrake', color: sp.hex, tail: sp.tail, size: sp.size } }); },
  spawnEnemy: (x: number, z: number, kind: EnemyKind = 'venin') => makeEnemy(x, z, kind),
  perf, saveGame, snapshot, applySave, settings, input,
  /** debug: spawn a rigged humanoid 3 m ahead of the player, with a pose state */
  demoHumanoid: (st: Partial<HumanoidState> = {}, female = false, look: Record<string, unknown> = {}) => {
    const h = new Humanoid({ female, skin: 0xd9b69a, hair: 0x3a2418, ...look });
    h.dress(0x7a2a22);
    const fwd = player.forward; fwd.y = 0; fwd.normalize();
    h.root.position.set(player.pos.x + fwd.x * 3, player.pos.y, player.pos.z + fwd.z * 3);
    h.root.rotation.y = Math.atan2(-fwd.x, -fwd.z) + Math.PI;
    scene.add(h.root);
    const bb = new THREE.Box3().setFromObject(h.root);
    console.log("humanoid bbox", JSON.stringify([bb.min.toArray().map((v) => +v.toFixed(2)), bb.max.toArray().map((v) => +v.toFixed(2))]), "ready", Humanoid.ready, "player", player.pos.toArray().map((v) => +v.toFixed(1)).join(","));
    (window as unknown as { __h?: Humanoid }).__h = h;
    demo.push({ h, st: { speed: 0, swing: 0, power: false, blocking: false, ride: false, ...st } });
  },
};
