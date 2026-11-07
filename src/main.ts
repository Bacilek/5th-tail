import * as THREE from 'three';
import { Input } from './engine/input';
import {
  buildTerrain, heightAt, inRect, onParapet, PARAPET, TOWER, PLATEAU, HEALERS, INFANTRY, SCRIBE, CITADEL, CITADEL_Y,
} from './world/terrain';
import { buildCollege, buildParapet, buildHealers, buildInfantry, buildScribes, buildCitadel } from './world/college';
import { buildSky } from './world/sky';
import { buildTrees } from './world/trees';
import { Player } from './entities/player';
import { Enemy } from './entities/enemy';
import { createDragon, type Dragon } from './entities/dragon';
import { DRAGONS, BOND_SPECIES, BOND_NAMES, TAIL_ATTACKS, type DragonSpec } from './data/dragons';
import { DragonMount } from './entities/mount';
import { CLASSES, type ClassId } from './data/classes';
import { Combat } from './systems/combat';
import { Hud } from './ui/hud';

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

scene.add(buildTerrain(), buildCollege(), buildHealers(), buildInfantry(), buildScribes(), buildCitadel(), buildParapet(), buildTrees());

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
let kills = 0;
combat.onKill = () => { hud.setKills(++kills); };

// ---- Story: Conscription Day, class choice, Parapet (Riders only), quadrant arrival, wing sorting
let chosen: ClassId | null = null;
type Stage = 'select' | 'go' | 'parapet' | 'citadel' | 'threshing' | 'done';
const FLIGHT_FIELD = { x0: 134, x1: 150, z0: -58, z1: 12 };
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
  player.setClass(id);
  hud.showMagicka(CLASSES[id].maxMagicka > 0);
  hud.setClassLabel(`Class: ${CLASSES[id].name}`);
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
hud.showClassSelect(onChosen);

player.onRespawn = () => {
  if (chosen === 'rider') { stage = 'parapet'; hud.setObjective('Cross the Parapet to the Riders Quadrant'); }
  hud.announce('You fell.', chosen === 'rider' ? 'The Parapet claims another. Try again.' : 'Try again.', 4);
};
player.onDeath = () => { hud.announce('You died', '', 3); };
player.onDamaged = () => hud.flashDamage();
player.onHandsChanged = () => hud.setHands(player.hands[0], player.hands[1]);
hud.setKills(0);

function bondDragon(): void {
  stage = 'done';
  const s = BOND_SPECIES[Math.floor(Math.random() * BOND_SPECIES.length)];
  const name = BOND_NAMES[Math.floor(Math.random() * BOND_NAMES.length)];
  const spec: DragonSpec = { name, color: s.hex, tail: s.tail, size: 1.0 };
  mount = new DragonMount(spec, scene, combat);
  hud.setObjective('');
  hud.setDragonLine(`Dragon: ${name} (${s.color} ${s.tail}tail) - R summon, F mount`);
  hud.announce('The Threshing', `${name}, a ${s.color} ${s.tail}tail, has chosen you.`, 8);
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
    hud.setObjective('Report to the Flight Field for the Threshing');
  } else if (stage === 'threshing') {
    if (inRect(FLIGHT_FIELD, x, z)) bondDragon();
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
  } else {
    // Parapet wind: strong gusts push sideways
    player.windZ = onParapet(player.pos.x, player.pos.y, player.pos.z)
      ? 0.55 * Math.sin(t * 0.9) + 0.4 * Math.sin(t * 2.3 + 1)
      : 0;
    if (mount && input.wasPressed('KeyR') && !mount.mounted) { mount.summon(player); hud.announce(mount.spec.name, 'answers your call...', 3); }
    if (mount && input.wasPressed('KeyF')) {
      if (mount.mounted) {
        if (!mount.dismount(player)) hud.announce('Too high', 'Land before dismounting.', 2);
        else hud.setHands(player.hands[0], player.hands[1]);
      } else if (mount.canMount(player)) {
        mount.mount(player);
        hud.announce('Mounted', `LMB fire breath - RMB ${TAIL_ATTACKS[mount.spec.tail].name} - Shift boost - F land+dismount`, 4);
      }
    }
    if (mount?.mounted) {
      mount.update(dt, input, player, camera);
    } else {
      player.update(dt, input);
      mount?.update(dt, input, player, camera);
    }
    story();
    const tgt = new THREE.Vector3(player.pos.x, player.pos.y, player.pos.z);
    for (const e of combat.enemies) {
      const dmg = e.update(dt, tgt, player.alive);
      if (dmg > 0) player.damage(dmg);
    }
    combat.update(dt);
  }

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
