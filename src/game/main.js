import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { CONFIG, DEATH_MESSAGES } from './config.js';
import { difficulty01, lerp, pickRandom } from './helpers.js';
import { World } from './world.js';
import { Car } from './car.js';
import { checkWallCollision } from './collision.js';
import { UI } from './ui.js';
import { FollowCamera } from './camera.js';
import { AudioManager } from './audio.js';
<<<<<<< HEAD
import { commercialBreak, gameplayStart, gameplayStop } from './poki.js';

const app = document.getElementById('app');

=======
import { gameplayStart, gameplayStop, showInterstitialAd, showRewardedAd, adAnalytics } from './adSystem.js';

const app = document.getElementById('app');

// Mobile detection for performance optimizations
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

>>>>>>> b7d7fbace36095314956d6bccb3f3bca53b42b65
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: false,
  powerPreference: 'high-performance',
});
<<<<<<< HEAD
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
=======

// Adjust pixel ratio for mobile vs desktop
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
>>>>>>> b7d7fbace36095314956d6bccb3f3bca53b42b65
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

let lastTs = performance.now();
let mode = 'playing'; // 'playing' | 'crashed'
let freezeT = 0;
let showDeathAfterFreeze = false;
let distance = 0;
let best = Number(localStorage.getItem('owt_best') || '0');
let deaths = Number(localStorage.getItem('owt_deaths') || '0');

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
<<<<<<< HEAD
=======
  onRewardedAd: async (rewardType) => {
    // Handler for rewarded ads
    if (mode !== 'crashed') return;
    
    console.log(`🎁 Jugador eligió recompensa: ${rewardType}`);
    const success = await showRewardedAd(rewardType);
    
    if (success) {
      applyReward(rewardType);
    }
  },
>>>>>>> b7d7fbace36095314956d6bccb3f3bca53b42b65
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

<<<<<<< HEAD
function currentSpeed() {
  const d = difficulty01(distance, CONFIG.difficulty.maxDistance);
  // Eased to make the first few seconds readable, then ramp fast.
  const t = Math.pow(d, 0.72);
  return lerp(CONFIG.car.baseSpeed, CONFIG.car.maxSpeed, t);
=======
function getContextualDeathMessage() {
  const elapsedTime = distance / currentSpeed(); // Approximate time survived
  const lastSteerTime = ui.getLastSteerTime(); // Need to add this to UI class
  
  // If crashed quickly (first 10 seconds)
  if (elapsedTime < 10) {
    return 'You hesitated.';
  }
  
  // If survived long time (over 60 seconds)
  if (elapsedTime > 60) {
    return 'Too greedy.';
  }
  
  // If frontal collision (not turning or turning late)
  const steer = getSteer();
  if (steer === 0) {
    return 'Turned too late.';
  }
  
  // Default/fallback
  return pickRandom(DEATH_MESSAGES);
}

function currentSpeed() {
  // Progressive difficulty: +2 units/sec every 5 seconds, max 98 units/sec
  const elapsedTime = distance / CONFIG.difficulty.speed.baseSpeed; // Approximate time
  const speedIncrement = elapsedTime * CONFIG.difficulty.speed.incrementPerSecond;
  return Math.min(
    CONFIG.difficulty.speed.baseSpeed + speedIncrement,
    CONFIG.difficulty.speed.maxSpeed
  );
>>>>>>> b7d7fbace36095314956d6bccb3f3bca53b42b65
}

function crash() {
  if (mode !== 'playing') return;

  mode = 'crashed';
  freezeT = CONFIG.crash.freezeSeconds;
  showDeathAfterFreeze = true;
  hintT = 0;

  deaths += 1;
  localStorage.setItem('owt_deaths', String(deaths));

  audio.playCrash();
  followCamera.startCrashShake();
<<<<<<< HEAD
=======
  
>>>>>>> b7d7fbace36095314956d6bccb3f3bca53b42b65
  gameplayStop();
}

function restart() {
  if (mode === 'playing') return;

<<<<<<< HEAD
  // Poki hook (do not await: restart must stay instant).
  if (deaths > 0 && deaths % 3 === 0) commercialBreak();

=======
  // Show interstitial ad every 2-3 deaths (not on immediate restart after ad)
  if (deaths > 0 && deaths % 2 === 0) {
    // Use async function for ad display
    (async () => {
      await showInterstitialAd();
      // Continue restart after ad completes
      completeRestart();
    })();
    return;
  }

  completeRestart();
}

function completeRestart() {
>>>>>>> b7d7fbace36095314956d6bccb3f3bca53b42b65
  audio.playClick();

  mode = 'playing';
  freezeT = 0;
  showDeathAfterFreeze = false;
  distance = 0;
  hintT = 3.5;

  keys.left = false;
  keys.right = false;
  pointerSteer = 0;
  pointerSteerT = 0;

  car.reset();
  world.reset();

  ui.hideDeath();
  ui.setDistance(0);

  gameplayStart();
}

<<<<<<< HEAD
=======
function applyReward(rewardType) {
  console.log(`🎉 Aplicando recompensa: ${rewardType}`);
  
  switch (rewardType) {
    case 'retry':
      // Retry from last turn (simplified: just give extra life for now)
      console.log('⏮️ Recompensa: Retry from last turn');
      completeRestart();
      break;
      
    case 'slow':
      // Slow-motion boost (not implemented - would need slow-mo system)
      console.log('⏱️ Recompensa: Slow-motion boost');
      completeRestart();
      break;
      
    case 'ghost':
      // Ghost car replay (not implemented - would need replay system)
      console.log('👻 Recompensa: Ghost car replay');
      completeRestart();
      break;
      
    default:
      console.warn(`Recompensa desconocida: ${rewardType}`);
      completeRestart();
  }
}

>>>>>>> b7d7fbace36095314956d6bccb3f3bca53b42b65
function startRun() {
  mode = 'playing';
  freezeT = 0;
  showDeathAfterFreeze = false;
  distance = 0;
  hintT = 3.5;

  car.reset();
  world.reset();

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
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    keys.left = true;
    hintT = 0;
<<<<<<< HEAD
=======
    ui.updateSteerTime(); // Track steer time for contextual messages
>>>>>>> b7d7fbace36095314956d6bccb3f3bca53b42b65
    e.preventDefault();
  }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    keys.right = true;
    hintT = 0;
<<<<<<< HEAD
=======
    ui.updateSteerTime(); // Track steer time for contextual messages
>>>>>>> b7d7fbace36095314956d6bccb3f3bca53b42b65
    e.preventDefault();
  }

  if ((e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR') && mode === 'crashed') {
    restart();
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    keys.left = false;
    e.preventDefault();
  }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    keys.right = false;
    e.preventDefault();
  }
});

window.addEventListener('pointerdown', (e) => {
  if (mode !== 'crashed') return;
  if (e.target instanceof Element && e.target.closest('button')) return;
  restart();
});

renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

function frame(ts) {
  requestAnimationFrame(frame);

  const dtRaw = Math.min(0.05, (ts - lastTs) / 1000);
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
<<<<<<< HEAD
      ui.showDeath(pickRandom(DEATH_MESSAGES));
=======
      // Use contextual death messages based on crash circumstances
      ui.showDeath(getContextualDeathMessage());
>>>>>>> b7d7fbace36095314956d6bccb3f3bca53b42b65

      if (distance > best) {
        best = distance;
        localStorage.setItem('owt_best', String(best));
        ui.setBest(best);
      }
    }
  }

  if (mode === 'playing') {
    const speed = currentSpeed();
    const steer = getSteer();

    car.update(simDt, steer, speed);
    distance = car.group.position.z;

    world.update(distance);

    const road = world.sampleRoad(distance);
    if (checkWallCollision(car, road)) crash();

    ui.setDistance(distance);
  }

  followCamera.update(dtRaw, car.group);
  renderer.render(scene, camera);
}

<<<<<<< HEAD
startRun();
requestAnimationFrame(frame);
=======
// Performance monitoring
let frameCount = 0;
let lastPerfTime = performance.now();
let frameTimes = [];

startRun();
requestAnimationFrame(frame);

// Expose debugging tools
window.gameDebug = {
  adAnalytics: adAnalytics,
  getPerformanceMetrics: () => {
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const fps = 1000 / avgFrameTime;
    return {
      fps: Math.round(fps),
      avgFrameTime: avgFrameTime.toFixed(2),
      frameCount: frameCount,
      mobileMode: isMobile
    };
  },
  
  testRewards: () => {
    console.log('🧪 Probando sistema de recompensas...');
    ui.showDeath('You turned too late.'); // Show death screen
    setTimeout(() => {
      applyReward('retry');
    }, 1500);
  },
  
  testInterstitial: () => {
    console.log('🧪 Probando anuncio intersticial...');
    showInterstitialAd();
  }
};

console.log('🎮 One Wrong Turn - Pulido, Optimizado y Listo para Poki');
console.log('📊 Disponibles herramientas de depuración: gameDebug.testRewards(), gameDebug.testInterstitial(), gameDebug.getPerformanceMetrics()');
>>>>>>> b7d7fbace36095314956d6bccb3f3bca53b42b65
