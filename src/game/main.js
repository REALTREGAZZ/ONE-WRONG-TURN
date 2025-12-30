import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { CONFIG, DEATH_MESSAGES } from './config.js';
import { difficulty01, lerp, pickRandom } from './helpers.js';
import { World } from './world.js';
import { Car } from './car.js';
import { checkWallCollision } from './collision.js';
import { UI } from './ui.js';
import { FollowCamera } from './camera.js';
import { AudioManager } from './audio.js';
import { gameplayStart, gameplayStop, showInterstitialAd } from './adSystem.js';
import { SpeedLines } from './speedLines.js';
import { Sparks } from './sparks.js';

const app = document.getElementById('app');

// Mobile detection for performance optimizations
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: false,
  powerPreference: 'high-performance',
});

// Adjust pixel ratio for mobile vs desktop
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x05060a, 1);

renderer.domElement.style.position = 'absolute';
renderer.domElement.style.inset = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.tabIndex = 0;

app?.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060a);
scene.fog = new THREE.Fog(0x05060a, 12, 180);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 420);

// Lights kept cheap: one ambient + one directional.
scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(5, 12, -4);
scene.add(sun);

const audio = new AudioManager();

const world = new World(scene, CONFIG);
const car = new Car(CONFIG.car);
scene.add(car.group);

const followCamera = new FollowCamera(camera, CONFIG.camera);
const speedLines = new SpeedLines(scene, CONFIG.speedLines);
const sparks = new Sparks(scene, CONFIG.sparks);

let lastTs = performance.now();
let lastGrazeTime = 0;
const GRAZE_COOLDOWN = 0.08;
let mode = 'playing'; // 'playing' | 'crashed'
let freezeT = 0;
let showDeathAfterFreeze = false;
let distance = 0;
let best = Number(localStorage.getItem('owt_best') || '0');

let hintT = 4.0;

const keys = {
  left: false,
  right: false,
};

let pointerSteer = 0;
let pointerSteerT = 0;

const ui = new UI({
  onRestart: () => restart(),
  onPointerSteer: (steer) => {
    if (mode !== 'playing') return;
    pointerSteer = steer;
    pointerSteerT = 0.14;
    hintT = 0;
  },
});
ui.setBest(best);

function getSteer() {
  const touch = ui.getSteerInput();
  
  const left = keys.left || touch.left;
  const right = keys.right || touch.right;
  
  let steer = 0;
  if (left && !right) steer = -1;
  if (right && !left) steer = 1;
  
  if (pointerSteerT > 0) steer = pointerSteer;
  
  return steer;
}

function currentSpeed() {
  // Progressive difficulty: speed increases over distance
  const elapsedTime = distance / CONFIG.difficulty.speed.baseSpeed;
  const speedIncrement = elapsedTime * CONFIG.difficulty.speed.incrementPerSecond;
  const speed = Math.min(
    CONFIG.difficulty.speed.baseSpeed + speedIncrement,
    CONFIG.difficulty.speed.maxSpeed
  );
  const speedRatio = (speed - CONFIG.difficulty.speed.baseSpeed) / (CONFIG.difficulty.speed.maxSpeed - CONFIG.difficulty.speed.baseSpeed);
  return { speed, speedRatio };
}

function crash() {
  if (mode !== 'playing') return;
  
  mode = 'crashed';
  freezeT = CONFIG.crash.freezeSeconds;
  showDeathAfterFreeze = true;
  hintT = 0;
  
  audio.playCrash();
  followCamera.startCrashShake();
  
  gameplayStop();
}

function restart() {
  if (mode === 'playing') return;
  completeRestart();
}

function completeRestart() {
  audio.playClick();

  mode = 'playing';
  freezeT = 0;
  showDeathAfterFreeze = false;
  distance = 0;
  hintT = 3.5;
  lastGrazeTime = 0;

  keys.left = false;
  keys.right = false;
  pointerSteer = 0;
  pointerSteerT = 0;

  car.reset();
  world.reset();
  speedLines.reset();
  sparks.reset();

  ui.hideDeath();
  ui.setDistance(0);

  gameplayStart();
}

function startRun() {
  mode = 'playing';
  freezeT = 0;
  showDeathAfterFreeze = false;
  distance = 0;
  hintT = 3.5;
  lastGrazeTime = 0;

  car.reset();
  world.reset();
  speedLines.reset();
  sparks.reset();

  ui.hideDeath();
  ui.setBest(best);
  ui.setDistance(0);

  gameplayStart();
}

function onResize() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', onResize);

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
    keys.right = true;
    hintT = 0;
    e.preventDefault();
  }
  if (e.code === 'KeyD' || e.code === 'ArrowRight') {
    keys.left = true;
    hintT = 0;
    e.preventDefault();
  }
  
  if ((e.code === 'Space' || e.code === 'Enter') && mode === 'crashed') {
    restart();
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.right = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.left = false;
});

window.addEventListener('pointerdown', (e) => {
  if (mode !== 'crashed') return;
  if (e.target instanceof Element && e.target.closest('button')) return;
  restart();
});

renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

function frame(ts) {
  requestAnimationFrame(frame);
  
  const dtRaw = Math.min(0.033, (ts - lastTs) / 1000);
  lastTs = ts;
  
  if (pointerSteerT > 0) {
    pointerSteerT = Math.max(0, pointerSteerT - dtRaw);
    if (pointerSteerT === 0) pointerSteer = 0;
  }
  
  if (hintT > 0) {
    hintT = Math.max(0, hintT - dtRaw);
    ui.setHintVisible(true);
  } else {
    ui.setHintVisible(false);
  }
  
  let simDt = dtRaw;
  if (mode === 'crashed' && freezeT > 0) {
    freezeT = Math.max(0, freezeT - dtRaw);
    simDt = 0;
  
    if (freezeT === 0 && showDeathAfterFreeze) {
      showDeathAfterFreeze = false;
      
      ui.showDeath(pickRandom(DEATH_MESSAGES));
      
      if (distance > best) {
        best = distance;
        localStorage.setItem('owt_best', String(best));
        ui.setBest(best);
      }
    }
  }
  
  if (mode === 'playing') {
    const { speed, speedRatio } = currentSpeed();
    const steer = getSteer();

    car.update(simDt, steer, speed);
    distance = car.group.position.z;

    world.update(distance);

    const road = world.sampleRoad(distance);
    const collision = checkWallCollision(car, road);

    if (collision.grazed) {
      const currentTime = ts / 1000;
      if (currentTime - lastGrazeTime >= GRAZE_COOLDOWN) {
        lastGrazeTime = currentTime;
        audio.playGraze();
        sparks.emit(car.group.position.clone(), collision.normal);
      }
    }

    if (collision.crashed) crash();

    ui.setDistance(distance);

    speedLines.emit(speedRatio);
    speedLines.update(simDt, speedRatio);
    sparks.update(simDt);

    followCamera.update(dtRaw, car.group, speedRatio);
  } else {
    followCamera.update(dtRaw, car.group, 0);
    sparks.update(simDt);
  }

  renderer.render(scene, camera);
}

startRun();
requestAnimationFrame(frame);

// Debug tools (clean, no ad testing)
window.gameDebug = {
  getPerformanceMetrics: () => {
    return { mobileMode: isMobile };
  },
};

console.log('One Wrong Turn - Ready for Poki');
