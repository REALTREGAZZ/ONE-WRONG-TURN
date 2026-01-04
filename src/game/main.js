// Platform Detection
const isPoki = window.location.href.includes('poki.com');
const isCrazy = window.location.href.includes('crazygames.com');
const isItchio = window.location.href.includes('itch.io');
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

console.log(`Platform detected - Poki: ${isPoki}, CrazyGames: ${isCrazy}, Itch.io: ${isItchio}, Local: ${isLocal}`);

// Enhanced PlatformManager with better logging
window.PlatformManager = {
  // Gameplay lifecycle
  triggerGameplayStart() {
    try {
      if (isPoki && window.PokiSDK) {
        PokiSDK.gameplayStart();
        console.log('✓ Poki: gameplayStart triggered');
      } else if (isCrazy && window.CrazyGames && window.CrazyGames.SDK) {
        window.CrazyGames.SDK.game.gameplayStart();
        console.log('✓ CrazyGames: gameplayStart triggered');
      } else {
        console.log('No platform SDK detected - gameplay start skipped');
      }
    } catch (e) {
      console.error('Error triggering gameplay start:', e);
    }
  },

  triggerGameplayStop() {
    try {
      if (isPoki && window.PokiSDK) {
        PokiSDK.gameplayStop();
        console.log('✓ Poki: gameplayStop triggered');
      } else if (isCrazy && window.CrazyGames && window.CrazyGames.SDK) {
        window.CrazyGames.SDK.game.gameplayStop();
        console.log('✓ CrazyGames: gameplayStop triggered');
      } else {
        console.log('No platform SDK detected - gameplay stop skipped');
      }
    } catch (e) {
      console.error('Error triggering gameplay stop:', e);
    }
  },

  // Ad system wrapper
  async triggerAd(type = 'midroll') {
    try {
      if (isPoki && window.PokiSDK) {
        console.log('Poki: Requesting commercial break');
        return await PokiSDK.commercialBreak();
      } else if (isCrazy && window.CrazyGames && window.CrazyGames.SDK) {
        console.log('CrazyGames: Requesting ad');
        return await window.CrazyGames.SDK.ad.requestAd(type);
      } else {
        console.log('No platform SDK detected - ad skipped, game continues immediately');
        // If no platform, game continues without ad
        return { success: true };
      }
    } catch (e) {
      console.error('Error requesting ad:', e);
      // Gracefully handle ad failure
      return { success: false };
    }
  },

  // Initialize SDKs safely
  async initialize() {
    try {
      if (isPoki && window.PokiSDK) {
        console.log('Initializing Poki SDK...');
        // Poki SDK already loaded via script tag
        return true;
      } else if (isCrazy && window.CrazyGames && window.CrazyGames.SDK) {
        console.log('Initializing CrazyGames SDK...');
        // CrazyGames SDK already loaded via script tag
        return true;
      } else {
        console.log('Running in standalone mode (no platform SDK)');
        return true;
      }
    } catch (e) {
      console.error('Error initializing platform:', e);
      return true; // Allow game to continue even if SDK init fails
    }
  },

  // Rewarded ad wrapper
  async requestRewardedAd() {
    try {
      if (isPoki && window.PokiSDK && window.PokiSDK.rewardedBreak) {
        return await PokiSDK.rewardedBreak();
      } else if (isCrazy && window.CrazyGames && window.CrazyGames.SDK.ad) {
        return await window.CrazyGames.SDK.ad.requestAd('rewarded');
      }
      console.log('No platform SDK detected - rewarded ad skipped');
      return { success: false };
    } catch (e) {
      console.error('Error requesting rewarded ad:', e);
      return { success: false };
    }
  },

  // Platform info getter
  getPlatformName() {
    if (isPoki) return 'Poki';
    if (isCrazy) return 'CrazyGames';
    if (isItchio) return 'Itch.io';
    return 'Standalone';
  }
};

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { CONFIG, DEATH_MESSAGES } from './config.js';
import { difficulty01, lerp, pickRandom } from './helpers.js';
import { World } from './world.js';
import { Car } from './car.js';
import { checkWallCollision } from './collision.js';
import { UI } from './ui.js';
import { FollowCamera } from './camera.js';
import { AudioManager } from './audio.js';
import { SpeedLines } from './speedLines.js';
import { Sparks } from './sparks.js';
import { WheelTrails } from './wheelTrails.js';
import { CrashDebris } from './crashDebris.js';
import { CoinSystem } from './coinSystem.js';
import { ShopSystem, SHOP_ITEMS } from './shopSystem.js';

const app = document.getElementById('app');

// Mobile detection for performance optimizations
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: false,
  powerPreference: 'high-performance',
});

// Detect device type and performance tier
function getDeviceConfig() {
  const width = window.innerWidth;
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent);
  const isTablet = /iPad|Android/i.test(navigator.userAgent) && width > 600;
  
  if (isTablet) {
    return {
      type: 'tablet',
      segmentCount: 120,
      maxParticles: 60,
      pixelRatio: 1.5,
      buildingLOD: 1,
      controlOpacity: 0.40
    };
  } else if (isMobile && width < 600) {
    return {
      type: 'mobile',
      segmentCount: 80,
      maxParticles: 40,
      pixelRatio: 1.0,
      buildingLOD: 1.5,
      controlOpacity: 0.50
    };
  } else {
    return {
      type: 'desktop',
      segmentCount: 150,
      maxParticles: 100,
      pixelRatio: 2.0,
      buildingLOD: 0.5,
      controlOpacity: 0.25
    };
  }
}

const deviceConfig = getDeviceConfig();

// Dynamic canvas sizing based on device and window resizing
function handleWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  // Adjust pixel ratio based on device
  const isMobileDevice = /Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent);
  const pixelRatio = isMobileDevice ? 
    Math.min(window.devicePixelRatio, 1.5) :  // Mobile: max 1.5x
    Math.min(window.devicePixelRatio, 2);     // Desktop: max 2x
  
  renderer.setPixelRatio(pixelRatio);
}

// Call on load and resize
handleWindowResize();
window.addEventListener('resize', handleWindowResize);

// Adjust pixel ratio based on device type
renderer.setPixelRatio(deviceConfig.pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0a0f, 1);

renderer.domElement.style.position = 'absolute';
renderer.domElement.style.inset = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.tabIndex = 0;

app?.prepend(renderer.domElement);

const scene = new THREE.Scene();

// Create aggressive synthwave gradient background
function createGradientTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const toCssHex = (hex) => `#${hex.toString(16).padStart(6, '0')}`;
  const { topColor, middleColor, bottomColor } = CONFIG.synthwave.sky;

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, toCssHex(topColor));
  gradient.addColorStop(0.5, toCssHex(middleColor));
  gradient.addColorStop(1, toCssHex(bottomColor));

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

scene.background = createGradientTexture();
scene.fog = new THREE.Fog(CONFIG.synthwave.fog, 12, 180);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 420);

// Adjust camera FOV based on device and aspect ratio
function adjustCameraForDevice() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;
  
  // Adjust FOV for different screen types
  if (aspect < 1) {
    // Portrait mode (mobile)
    camera.fov = 65;
  } else if (aspect < 1.5) {
    // Standard aspect ratio (desktop/tablet)
    camera.fov = 62;
  } else {
    // Wide screen (ultrawide monitor)
    camera.fov = 58;
  }
  
  camera.updateProjectionMatrix();
}

adjustCameraForDevice();
window.addEventListener('resize', adjustCameraForDevice);

// Reactive synthwave lighting system
scene.add(new THREE.AmbientLight(0xffffff, CONFIG.synthwave.lights.ambient.intensity));

// Cyan point light (left side)
const cyanCfg = CONFIG.synthwave.lights.pointLights.cyan;
const cyanLight = new THREE.PointLight(cyanCfg.color, cyanCfg.intensity, cyanCfg.distance);
cyanLight.position.set(-4, 3, 2);
scene.add(cyanLight);

// Magenta point light (right side)
const magentaCfg = CONFIG.synthwave.lights.pointLights.magenta;
const magentaLight = new THREE.PointLight(magentaCfg.color, magentaCfg.intensity, magentaCfg.distance);
magentaLight.position.set(4, 3, 2);
scene.add(magentaLight);

// Directional sun (for definition)
const sun = new THREE.DirectionalLight(0xffffff, 0.4);
sun.position.set(5, 12, -4);
scene.add(sun);

const audio = new AudioManager();

const coinSystem = new CoinSystem();
const shopSystem = new ShopSystem(coinSystem);

const world = new World(scene, CONFIG);
const car = new Car(CONFIG);
scene.add(car.group);

const followCamera = new FollowCamera(camera, CONFIG.camera);
const speedLines = new SpeedLines(scene, CONFIG.speedLines);
const sparks = new Sparks(scene, CONFIG.sparks);
const wheelTrails = new WheelTrails(scene, CONFIG.wheelTrails);
const crashDebris = new CrashDebris(scene, {
  colors: [CONFIG.synthwave.walls.left.color, CONFIG.synthwave.walls.right.color, CONFIG.synthwave.car.color],
});

let lastTs = performance.now();
let lastGrazeTime = 0;
const GRAZE_COOLDOWN = 0.08;
let mode = 'menu'; // 'menu' | 'playing' | 'crashed' | 'shop' | 'stats' | 'mode-select'
let freezeT = 0;
let showDeathAfterFreeze = false;
let distance = 0;
let best = Number(localStorage.getItem('owt_best') || '0');
let lastRun = 0;
let gamesPlayed = Number(localStorage.getItem('owt_games_played') || '0');
let totalDistance = Number(localStorage.getItem('owt_total_distance') || '0');

let lastRoadWidth = CONFIG.road.baseWidth; // Track road width changes

// Game mode state
let currentGameMode = localStorage.getItem('owt_selected_mode') || 'normal';
let normalModeCompleted = localStorage.getItem('owt_normal_completed') === 'true';

// For Poki testing: always unlock hard mode on Poki platform
let hardModeUnlocked = normalModeCompleted || isPoki;

let hintT = 4.0;
let pulseTime = 0;

const keys = {
  left: false,
  right: false,
};

let pointerSteer = 0;
let pointerSteerT = 0;

// Apply game mode configuration to CONFIG
function applyGameModeConfig(modeId) {
  const modeConfig = CONFIG.gameModes[modeId];
  if (!modeConfig) return;

  // Apply difficulty settings
  CONFIG.difficulty = { ...modeConfig.difficulty };

  // Apply curve settings
  if (modeConfig.curve) {
    CONFIG.curve = { ...modeConfig.curve };
  }

  // Apply road settings
  if (modeConfig.road) {
    CONFIG.road.baseWidth = modeConfig.road.baseWidth;
    CONFIG.road.minWidth = modeConfig.road.minWidth;
  }

  // Apply turn settings
  if (modeConfig.turns) {
    CONFIG.turns.baseInterval = modeConfig.turns.baseInterval;
    CONFIG.turns.minInterval = modeConfig.turns.minInterval;
    CONFIG.turns.baseDeltaX = modeConfig.turns.baseDeltaX;
    CONFIG.turns.maxDeltaX = modeConfig.turns.maxDeltaX;
  }

  // Update car speed limits
  CONFIG.car.baseSpeed = CONFIG.difficulty.speed.baseSpeed;
  CONFIG.car.maxSpeed = CONFIG.difficulty.speed.maxSpeed;

  console.log(`Game mode applied: ${modeId}`, CONFIG.difficulty);
}

const ui = new UI({
  onRestart: () => restart(),
  onMenuClick: () => showMenu(),
  onModeSelect: (modeId) => selectGameMode(modeId),
  onShopClick: () => showShop(),
  onPointerSteer: (steer) => {
    if (mode !== 'playing') return;
    pointerSteer = steer;
    pointerSteerT = 0.14;
    hintT = 0;
  },
});

// Initialize HUD for device
ui.adjustHUDForDevice();

const crashFlashEl = document.getElementById('crash-flash');
let crashFlashTimer = 0;

function crashFlash() {
  if (!crashFlashEl) return;
  window.clearTimeout(crashFlashTimer);

  crashFlashEl.style.transition = 'opacity 0.1s linear';
  crashFlashEl.style.opacity = '0.6';

  crashFlashTimer = window.setTimeout(() => {
    crashFlashEl.style.transition = 'opacity 0.6s ease-out';
    crashFlashEl.style.opacity = '0';
  }, 100);
}

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
  
  const speedRange = CONFIG.difficulty.speed.maxSpeed - CONFIG.difficulty.speed.baseSpeed;
  const speedRatio = speedRange <= 0 ? 0 : (speed - CONFIG.difficulty.speed.baseSpeed) / speedRange;
  
  return { speed, speedRatio };
}

function crash() {
  if (mode !== 'playing') return;

  mode = 'crashed';
  freezeT = CONFIG.crash.freezeSeconds;
  showDeathAfterFreeze = true;
  hintT = 0;

  gamesPlayed++;
  totalDistance += distance;
  lastRun = distance;

  // Earn coins based on distance
  coinSystem.earnCoins(distance);

  if (distance > best) {
    best = distance;
    localStorage.setItem('owt_best', String(best));
  }

  // Check if Normal Mode was completed (reached at least 100m) to unlock Hard Mode
  if (currentGameMode === 'normal' && distance >= 100 && !normalModeCompleted) {
    normalModeCompleted = true;
    hardModeUnlocked = true;
    localStorage.setItem('owt_normal_completed', 'true');
    console.log('Normal Mode completed! Hard Mode unlocked!');
  }

  localStorage.setItem('owt_games_played', String(gamesPlayed));
  localStorage.setItem('owt_total_distance', String(totalDistance));

  audio.playCrash();
  followCamera.startCrashShake();
  crashFlash();
  crashDebris.spawn(car.group.position, camera.position);

  PlatformManager.triggerGameplayStop();
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
  lastRoadWidth = CONFIG.road.baseWidth; // Reset road width tracker

  keys.left = false;
  keys.right = false;
  pointerSteer = 0;
  pointerSteerT = 0;

  car.reset();
  world.reset();
  wheelTrails.reset();
  speedLines.reset();
  sparks.reset();
  crashDebris.reset();

  if (crashFlashEl) crashFlashEl.style.opacity = '0';

  PlatformManager.triggerGameplayStart();
}

function selectGameMode(modeId) {
  // Check if mode is unlocked
  if (modeId === 'hard' && !hardModeUnlocked) {
    console.log('Hard Mode is locked!');
    return;
  }

  currentGameMode = modeId;
  localStorage.setItem('owt_selected_mode', modeId);
  
  // Apply the mode configuration
  applyGameModeConfig(modeId);
  
  // Recreate world with new config
  world.reset();
  
  console.log(`Mode selected: ${modeId}`);
  
  // Start the game
  startRun();
}

function showModeSelect() {
  mode = 'mode-select';
  ui.showModeSelect();
  
  // Update mode card states
  updateModeCards();
}

function updateModeCards() {
  const normalCard = document.getElementById('mode-normal');
  const hardCard = document.getElementById('mode-hard');
  const hardLockedOverlay = hardCard?.querySelector('.mode-locked');
  
  // Update selected state
  document.querySelectorAll('.mode-card').forEach(card => {
    card.classList.remove('selected');
    if (card.dataset.mode === currentGameMode) {
      card.classList.add('selected');
    }
  });
  
  // Update hard mode lock state
  if (hardCard && hardLockedOverlay) {
    if (hardModeUnlocked) {
      hardCard.classList.remove('locked');
      hardLockedOverlay.classList.add('hidden');
    } else {
      hardCard.classList.add('locked');
      hardLockedOverlay.classList.remove('hidden');
    }
  }
}

function startRun() {
  mode = 'playing';
  freezeT = 0;
  showDeathAfterFreeze = false;
  distance = 0;
  hintT = 3.5;
  lastGrazeTime = 0;
  lastRoadWidth = CONFIG.road.baseWidth; // Reset road width tracker

  car.reset();
  world.reset();
  wheelTrails.reset();
  speedLines.reset();
  sparks.reset();
  crashDebris.reset();

  if (crashFlashEl) crashFlashEl.style.opacity = '0';

  ui.hideMenu();
  ui.hideModeSelect();

  PlatformManager.triggerGameplayStart();
}

function showMenu() {
  mode = 'menu';
  ui.showMenu();
  document.getElementById('menu-best').textContent = Math.floor(best) + 'M';
}

function showShop() {
  mode = 'shop';
  ui.showShop();
  // Render shop items with current state
  ui.renderShopItems(
    SHOP_ITEMS.skins,
    shopSystem.ownedSkins,
    shopSystem.selectedSkin,
    coinSystem.getTotal(),
    purchaseSkin,
    selectSkin
  );
}

function selectSkin(skinId) {
  audio.playClick();
  if (shopSystem.applySkin(skinId)) {
    const skin = shopSystem.findItem(skinId);
    if (skin) {
      car.applySkin(skinId, skin.color);
    }
    // Re-render shop UI to update selected state
    ui.renderShopItems(
      SHOP_ITEMS.skins,
      shopSystem.ownedSkins,
      shopSystem.selectedSkin,
      coinSystem.getTotal(),
      purchaseSkin,
      selectSkin
    );
  }
}

function purchaseSkin(skinId) {
  audio.playClick();
  if (shopSystem.purchaseItem(skinId)) {
    const skin = shopSystem.findItem(skinId);
    if (skin) {
      car.applySkin(skinId, skin.color);
    }
    // Re-render shop UI
    ui.renderShopItems(
      SHOP_ITEMS.skins,
      shopSystem.ownedSkins,
      shopSystem.selectedSkin,
      coinSystem.getTotal(),
      purchaseSkin,
      selectSkin
    );
  }
}

function showStats() {
  mode = 'stats';
  ui.showStats();
  document.getElementById('stats-best').textContent = `${Math.floor(best)}m`;
  document.getElementById('stats-games-played').textContent = gamesPlayed;
  document.getElementById('stats-total-distance').textContent = `${Math.floor(totalDistance)}m`;
}

function onResize() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', onResize);

window.addEventListener('keydown', (e) => {
  // INVERTIDOS: A = derecha, D = izquierda
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
    keys.right = true;  // A gira a la DERECHA
    hintT = 0;
    e.preventDefault();
  }
  if (e.code === 'KeyD' || e.code === 'ArrowRight') {
    keys.left = true;   // D gira a la IZQUIERDA
    hintT = 0;
    e.preventDefault();
  }
  
  if ((e.code === 'Space' || e.code === 'Enter')) {
    if (mode === 'crashed') {
      restart();
      e.preventDefault();
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.right = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.left = false;
});

document.getElementById('btn-start')?.addEventListener('click', () => {
  showModeSelect();
});

document.getElementById('btn-shop')?.addEventListener('click', () => {
  showShop();
});

document.getElementById('btn-stats')?.addEventListener('click', () => {
  showStats();
});

document.getElementById('btn-toggle-audio')?.addEventListener('click', () => {
  const isEnabled = audio.toggleAudio();
  const icon = document.getElementById('audio-icon');
  if (icon) icon.textContent = isEnabled ? '🔊' : '🔈';
  audio.playClick();
});

// Mode selection handlers
document.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', () => {
    const modeId = card.dataset.mode;
    if (modeId) {
      selectGameMode(modeId);
    }
  });
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

      const { speed } = currentSpeed();
      ui.showCrash(distance, speed, lastRun);
    }
  }
  
  if (mode === 'playing') {
    const { speed, speedRatio } = currentSpeed();
    const steer = getSteer();

    // Update light pulse effect based on speed
    pulseTime += dtRaw * 3;
    const pulseFactor = 0.8 + Math.sin(pulseTime) * 0.2;
    cyanLight.intensity = cyanCfg.intensity * pulseFactor;
    magentaLight.intensity = magentaCfg.intensity * pulseFactor;

    car.update(simDt, steer, speed);
    distance = car.group.position.z;

    world.update(distance);

    const road = world.sampleRoad(distance);
    const collision = checkWallCollision(car, road);

    // Check for road width narrowing and trigger camera shake
    if (road.width < lastRoadWidth - 0.3) { // Significant narrowing detected
      followCamera.startNarrowingShake();
    }
    lastRoadWidth = road.width;

    if (collision.grazed) {
      const currentTime = ts / 1000;
      if (currentTime - lastGrazeTime >= GRAZE_COOLDOWN) {
        lastGrazeTime = currentTime;
        audio.playGraze();
        sparks.emit(car.group.position.clone(), collision.normal);
        followCamera.startGrazeShake(); // Add graze shake
      }
    }

    if (collision.crashed) crash();

    ui.updateStats(distance, speed, best, lastRun, currentGameMode);

    wheelTrails.update(simDt, car, speed, CONFIG.difficulty.speed.maxSpeed);
    speedLines.emit(speedRatio);
    speedLines.update(simDt, speedRatio);
    
    // Update sparks system with narrow road detection
    sparks.update(simDt);
    sparks.updateNarrowRoadSparks(simDt, car.group.position, CONFIG.car.width, road.width);

    followCamera.updateVelocityShake(dtRaw, speedRatio);
    followCamera.update(dtRaw, car.group, speedRatio);
  } else {
    followCamera.update(dtRaw, car.group, 0);
    wheelTrails.update(simDt, car, 0, CONFIG.difficulty.speed.maxSpeed);
    sparks.update(simDt);
  }

  crashDebris.update(dtRaw);

  renderer.render(scene, camera);
}

// Apply initial game mode configuration
applyGameModeConfig(currentGameMode);

// Apply selected skin
const initialSkin = shopSystem.findItem(shopSystem.selectedSkin);
if (initialSkin) {
  car.applySkin(shopSystem.selectedSkin, initialSkin.color);
}

// Initialize platform manager before game starts
PlatformManager.initialize();

// Iniciar con el menú
showMenu();
requestAnimationFrame(frame);

// Debug tools (clean, no ad testing)
window.gameDebug = {
  getPerformanceMetrics: () => {
    return { mobileMode: isMobile };
  },
  getPlatform() {
    return window.PlatformManager ? window.PlatformManager.getPlatformName() : 'Unknown';
  }
};

console.log(`One Wrong Turn - Ready for ${window.PlatformManager ? window.PlatformManager.getPlatformName() : 'Standalone'} mode`);
