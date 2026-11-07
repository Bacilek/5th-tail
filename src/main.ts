import * as THREE from 'three';
import { Input } from './engine/input';
import { buildTerrain, heightAt } from './world/terrain';
import { buildCollege, buildParapet } from './world/college';
import { buildSky } from './world/sky';
import { buildTrees } from './world/trees';
import { Player } from './entities/player';
import { Enemy } from './entities/enemy';
import { createDragon, type Dragon } from './entities/dragon';
import { DRAGONS } from './data/dragons';
import { Combat } from './systems/combat';
import { Hud } from './ui/hud';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const FOG = 0x8a8c9a;
scene.fog = new THREE.Fog(FOG, 90, 520);
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

scene.add(buildTerrain(), buildCollege(), buildParapet(), buildTrees());

// Decorative dragons circling the college (species/tails from Fourth Wing lore)
const circling: { d: Dragon; r: number; alt: number; speed: number; phase: number }[] = [];
DRAGONS.forEach((spec, i) => {
  const d = createDragon(spec);
  scene.add(d.group);
  circling.push({ d, r: 90 + (i % 3) * 30, alt: 70 + i * 9, speed: (i % 2 ? 1 : -1) * (0.05 + i * 0.004), phase: i * 0.9 });
});

const input = new Input(renderer.domElement);
const hud = new Hud();
const combat = new Combat(scene);
const player = new Player(camera, combat, scene);

// Enemies (Venin) around the courtyard
for (const [x, z] of [[-15, 10], [18, 6], [0, -8], [-24, -28], [26, -30], [8, -60 + 8]]) {
  const e = new Enemy(x, z);
  scene.add(e.group);
  combat.enemies.push(e);
}
let kills = 0;
combat.onKill = () => { hud.setKills(++kills); };

// Story beats: Parapet crossing and wing sorting
const WINGS = ['First Wing', 'Second Wing', 'Third Wing', 'Fourth Wing'];
let stage = 0; // 0 start, 1 on parapet, 2 crossed, 3 sorted
function resetStage(): void { stage = 0; }
player.onRespawn = () => { resetStage(); hud.announce('You fell.', 'Few survive the Parapet. Try again.', 4); };
player.onDeath = () => { hud.announce('You died', '', 3); };
player.onDamaged = () => hud.flashDamage();
player.onHandsChanged = () => hud.setHands(player.hands[0], player.hands[1]);
hud.setHands(player.hands[0], player.hands[1]);
hud.setKills(0);
hud.announce('Basgiath War College', 'Cross the Parapet to reach the gates.', 6);

function story(): void {
  const { x, z } = player.pos;
  if (stage === 0 && z < 76 && Math.abs(x) < 3) {
    stage = 1;
    hud.announce('Crossing the Parapet', 'Do not look down. Do not fall.', 4);
  } else if (stage === 1 && z < 34 && player.alive) {
    stage = 2;
    hud.announce('You crossed the Parapet', 'Report to the courtyard.', 4);
  } else if (stage === 2 && z < 15) {
    stage = 3;
    const wing = WINGS[Math.floor(Math.random() * WINGS.length)];
    hud.setWing(wing);
    hud.announce(`Sorted into ${wing}`, 'Riders Quadrant', 6);
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

  player.update(dt, input);
  story();
  const tgt = new THREE.Vector3(player.pos.x, player.pos.y, player.pos.z);
  for (const e of combat.enemies) {
    const dmg = e.update(dt, tgt, player.alive);
    if (dmg > 0) player.damage(dmg);
  }
  combat.update(dt);

  circling.forEach((c, i) => {
    const a = c.phase + t * c.speed;
    const x = Math.cos(a) * c.r, z = -20 + Math.sin(a) * c.r;
    const y = c.alt + Math.sin(a * 2 + i) * 8;
    const vx = -Math.sin(a) * Math.sign(c.speed), vz = Math.cos(a) * Math.sign(c.speed);
    c.d.group.position.set(x, y, z);
    c.d.group.rotation.set(0, Math.atan2(-vx, -vz), 0.15 * Math.sign(c.speed));
    c.d.update(t + i);
  });

  sun.position.copy(player.pos).add(SUN_OFFSET);
  sun.target.position.copy(player.pos);

  hud.update(player.health / player.maxHealth, player.magicka / player.maxMagicka, player.stamina / player.maxStamina, dt);
  renderer.render(scene, camera);
  input.endFrame();
});

// debug hook for automated testing
(window as unknown as { __game: unknown }).__game = { player, combat, heightAt };
