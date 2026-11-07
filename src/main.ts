import * as THREE from 'three';
import { Input, isTyping } from './engine/input';
import {
  buildTerrain, heightAt, inRect, onParapet, PARAPET, TOWER, PLATEAU, CAMP, VILLAGE, HEALERS, INFANTRY, SCRIBE, CITADEL, CITADEL_Y, FIELD,
} from './world/terrain';
import { buildVillage, buildCamp } from './world/areas';
import { makeLabel, buildCollege, buildParapet, buildHealers, buildInfantry, buildScribes, buildCitadel } from './world/college';
import { buildSky } from './world/sky';
import { buildTrees } from './world/trees';
import { Player } from './entities/player';
import { Enemy } from './entities/enemy';
import { createDragon, type Dragon } from './entities/dragon';
import { DRAGONS, TAIL_ATTACKS } from './data/dragons';
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
import { Gauntlet } from './systems/gauntlet';
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

scene.add(buildSky());
scene.add(new THREE.HemisphereLight(0xb8c4ee, 0x3a3328, 1.1));
const sun = new THREE.DirectionalLight(0xffd7a8, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera;
sc.left = -70; sc.right = 70; sc.top = 70; sc.bottom = -70; sc.near = 1; sc.far = 400;
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);
const SUN_OFFSET = new THREE.Vector3(-80, 120, 60);

scene.add(buildTerrain(), buildCollege(), buildHealers(), buildInfantry(), buildScribes(), buildCitadel(), buildParapet(), buildVillage(), buildCamp(), buildTrees());

// Decorative dragons circling the Citadel ridge (species/tails from Fourth Wing lore)
const circling: { d: Dragon; r: number; alt: number; speed: number; phase: number }[] = [];
DRAGONS.forEach((spec, i) => {
  const d = createDragon(spec);
  scene.add(d.group);
  circling.push({ d, r: 70 + (i % 3) * 25, alt: 85 + i * 8, speed: (i % 2 ? 1 : -1) * (0.05 + i * 0.004), phase: i * 0.9 });
});

const input = new Input(renderer.domElement);
const hud = new Hud();
const combat = new Combat(scene);
const player = new Player(camera, combat, scene);

// Venin lurk outside the college walls (south road + hills)
for (const [x, z] of [[-20, 130], [20, 140], [0, 160], [-70, 90], [75, 70], [-60, -150]]) {
  const e = new Enemy(x, z);
  scene.add(e.group);
  combat.enemies.push(e);
}
// Venin camp: scouts plus a commander
for (const [x, z] of [[84, 118], [108, 116], [92, 140], [112, 138], [98, 108]]) {
  const e = new Enemy(x, z); scene.add(e.group); combat.enemies.push(e);
}
{
  const cmd = new Enemy(96, 108); cmd.hp = 180; cmd.group.scale.setScalar(1.35); scene.add(cmd.group); combat.enemies.push(cmd);
}
let kills = 0;
let gauntletDone = false;
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
    panels.open('Broccoli', 'A scruffy orange cat inspects you, then decides you will do. (Its origin in the books is uncertain, so it is a stray here.)', [
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
    hud.announce('Conscription Day', 'Riders cross the Parapet. Many do not survive.', 6);
  } else {
    stage = 'go';
    const dir = { infantry: 'north', healer: 'south', scribe: 'west tunnel' }[id];
    hud.setObjective(`Report to the ${CLASSES[id].name} Quadrant (${dir})`);
    hud.announce('Conscription Day', `You chose the ${CLASSES[id].name} Quadrant.`, 5);
  }
  renderer.domElement.requestPointerLock();
}
hud.showCharacterCreator((look) => {
  player.applyLook(look);
  hud.showClassSelect(onChosen);
});

player.onRespawn = () => {
  if (chosen === 'rider') { stage = 'parapet'; hud.setObjective('Cross the Parapet to the Riders Quadrant'); }
  hud.announce('You fell.', chosen === 'rider' ? 'The Parapet claims another. Try again.' : 'Try again.', 4);
};
player.onDeath = () => { hud.announce('You died', '', 3); };
player.onDamaged = () => { hud.flashDamage(); audio.hurt(); };
player.onAttack = (k) => { if (k === 'melee') audio.swing(); else if (k === 'fireball') audio.fire(); else if (k === 'lightning') audio.lightning(); else audio.heal(); };
panels.onOpen = (name) => {
  if (name === 'Broccoli') { audio.meow(); return; }
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 97;
  audio.babble(0.75 + (h % 10) * 0.09, 10 + (h % 6));
};
addEventListener('pointerdown', () => audio.start());
addEventListener('keydown', (e) => { if (isTyping(e)) return; audio.start(); if (e.code === 'KeyM') hud.announce(audio.toggleMute() ? 'Sound off' : 'Sound on', '', 1.5); });
player.onHandsChanged = () => hud.setHands(player.hands[0], player.hands[1]);
hud.setKills(0);

function bondDragon(b: Bond): void {
  stage = 'done';
  const spec = b.spec;
  mount = new DragonMount(spec, scene, combat);
  audio.roar();
  hud.setObjective('');
  hud.setDragonLine(`Dragon: ${spec.name} (${b.species.color} ${b.species.tail}tail, ${b.species.rarity}) - R summon, F mount`);
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

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (!chosen) {
    player.sync(dt);
  } else if (panels.dialogOpen) {
    player.sync(dt);
  } else {
    // Parapet wind: strong gusts push sideways
    player.windZ = onParapet(player.pos.x, player.pos.y, player.pos.z)
      ? 0.55 * Math.sin(t * 0.9) + 0.4 * Math.sin(t * 2.3 + 1)
      : 0;
    if (mount && input.wasPressed('KeyR') && !mount.mounted) { mount.summon(player); hud.announce(mount.spec.name, 'answers your call...', 3); }
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
    if (input.wasPressed('KeyB') && !mount?.mounted) {
      if (broom.active) {
        if (!broom.dismount(player)) hud.announce('Too high', 'Land before dismounting.', 2);
        else hud.setHands(player.hands[0], player.hands[1]);
      } else {
        broom.mount(player);
        hud.announce('Broom', 'Mouse steers - W/S speed - Shift boost - V camera - B land', 4);
      }
    }
    if (broom.active && input.wasPressed('KeyV')) player.thirdPerson = !player.thirdPerson;
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
      const dmg = e.update(dt, tgt, player.alive);
      if (dmg > 0) player.damage(dmg);
    }
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

  sun.position.copy(player.pos).add(SUN_OFFSET);
  sun.target.position.copy(player.pos);

  hud.update(
    player.health / player.maxHealth,
    player.maxMagicka > 0 ? player.magicka / player.maxMagicka : 0,
    player.stamina / player.maxStamina,
    dt,
  );
  renderer.render(scene, camera);
  input.endFrame();
});

// debug hook for automated testing
(window as unknown as { __game: unknown }).__game = { player, combat, heightAt, PARAPET, PLATEAU, onChosen };
