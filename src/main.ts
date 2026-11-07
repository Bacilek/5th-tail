import * as THREE from 'three';

// Milestone 0 placeholder: proves the toolchain works. Replaced in milestone 1.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2030);
scene.fog = new THREE.Fog(0x1a2030, 20, 120);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0, 2, 6);

scene.add(new THREE.HemisphereLight(0xaabbff, 0x222222, 1.2));
const box = new THREE.Mesh(
  new THREE.ConeGeometry(1, 2, 5),
  new THREE.MeshStandardMaterial({ color: 0x884422, flatShading: true }),
);
scene.add(box);

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
renderer.setAnimationLoop((t) => {
  box.rotation.y = t / 1000;
  renderer.render(scene, camera);
});
