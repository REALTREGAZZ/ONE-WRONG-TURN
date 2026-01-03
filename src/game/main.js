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

// Adjust pixel ratio for mobile vs desktop
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
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
let mode = 'menu'; // 'menu' | 'playing' | 'crashed' | 'shop' | 'stats'
let freezeT = 0;
let showDeathAfterFreeze = false;
let distance = 0;
let best = Number(localStorage.getItem('owt_best') || '0');
let lastRun = 0;
let gamesPlayed = Number(localStorage.getItem('owt_games_played') || '0');
let totalDistance = Number(localStorage.getItem('owt_total_distance') || '0');

// Game mode state
let currentGameMode = localStorage.getItem('owt_selected_mode') || 'normal';
let normalModeCompleted = localStorage.getItem('owt_normal_completed') === 'true';
let hardModeUnlocked = normalModeCompleted;

let hintT = 4.0;
let pulseTime = 0;

const keys = {
  left: false,
  right: false,
};

let pointerSteer = 0;
let pointerSteerT = 0;

const coinSystem = new CoinSystem();
const shopSystem = new ShopSystem(coinSystem);

// Guardar SHOP_ITEMS en CONFIG para acceso global
CONFIG.SHOP_ITEMS = SHOP_ITEMS;

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
  onPointerSteer: (steer) => {
    if (mode !== 'playing') return;
    pointerSteer = steer;
    pointerSteerT = 0.14;
    hintT = 0;
  },
});

const crashFlashEl = document.getElementById('crash-flash');
let crashFlashTimer = 0;

function updateCoinDisplays() {
  const totalCoins = coinSystem.getTotal();
  const menuCoinsEl = document.getElementById('menu-coins');
  const shopCoinCountEl = document.getElementById('shop-coin-count');
  const statsTotalCoinsEl = document.getElementById('stats-total-coins');
  
  if (menuCoinsEl) menuCoinsEl.textContent = totalCoins;
  if (shopCoinCountEl) shopCoinCountEl.textContent = totalCoins;
  if (statsTotalCoinsEl) statsTotalCoinsEl.textContent = totalCoins;
}

// Renderizar tienda
function renderShop() {
  const skinsContainer = document.getElementById('shop-skins');
  const accessoriesContainer = document.getElementById('shop-accessories');
  
  if (!skinsContainer || !accessoriesContainer) return;
  
  // Limpiar contenedores
  skinsContainer.innerHTML = '';
  accessoriesContainer.innerHTML = '';
  
  // Renderizar skins
  SHOP_ITEMS.skins.forEach(skin => {
    const itemEl = createShopItem(skin, 'skin');
    skinsContainer.appendChild(itemEl);
  });
  
  // Renderizar accesorios
  SHOP_ITEMS.accessories.forEach(accessory => {
    const itemEl = createShopItem(accessory, 'accessory');
    accessoriesContainer.appendChild(itemEl);
  });
}

function createShopItem(item, type) {
  const itemEl = document.createElement('div');
  itemEl.className = 'shop-item';
  
  const isSelected = type === 'skin' ? shopSystem.selectedSkin === item.id : shopSystem.isAccessoryActive(item.id);
  const isOwned = item.owned;
  
  if (isSelected) itemEl.classList.add('selected');
  if (isOwned) itemEl.classList.add('owned');
  
  itemEl.innerHTML = `
    <div class="item-name">${item.name}</div>
    <div class="item-description">${item.description}</div>
    <div class="item-price ${isOwned ? 'owned' : ''}">${isOwned ? 'OWNED' : item.price}</div>
  `;
  
  itemEl.addEventListener('click', () => {
    if (isOwned) {
      if (type === 'skin') {
        shopSystem.applySkin(item.id);
        car.applySkin(item.id);
      } else {
        shopSystem.toggleAccessory(item.id);
        // Re-apply all active accessories
        const activeAccessories = shopSystem.selectedAccessories || [];
        car.applyAccessories(activeAccessories);
      }
      renderShop();
    } else {
      if (coinSystem.getTotal() >= item.price) {
        shopSystem.purchaseItem(item.id);
        updateCoinDisplays();
        renderShop();
      }
    }
  });
  
  return itemEl;
}

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

  const earned = coinSystem.earnCoins(distance);
  gamesPlayed++;
  totalDistance += distance;
  lastRun = distance;
  
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
  coinSystem.reset();
  hintT = 3.5;
  lastGrazeTime = 0;

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

  // APLICAR SKIN Y ACCESORIOS
  const selectedSkin = shopSystem.selectedSkin || 'yellow-neon';
  const selectedAccessories = shopSystem.selectedAccessories || [];
  car.applySkin(selectedSkin);
  car.applyAccessories(selectedAccessories);

  if (crashFlashEl) crashFlashEl.style.opacity = '0';

  updateCoinDisplays();

  gameplayStart();
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
  coinSystem.reset();
  hintT = 3.5;
  lastGrazeTime = 0;

  car.reset();
  world.reset();
  wheelTrails.reset();
  speedLines.reset();
  sparks.reset();
  crashDebris.reset();

  // APLICAR SKIN Y ACCESORIOS
  const selectedSkin = shopSystem.selectedSkin || 'yellow-neon';
  const selectedAccessories = shopSystem.selectedAccessories || [];
  car.applySkin(selectedSkin);
  car.applyAccessories(selectedAccessories);

  if (crashFlashEl) crashFlashEl.style.opacity = '0';

  ui.hideMenu();
  ui.hideModeSelect();

  gameplayStart();
}

function showMenu() {
  mode = 'menu';
  ui.showMenu();
  ui.hideShop();
  ui.hideStats();
  document.getElementById('menu-best').textContent = Math.floor(best) + 'M';
  updateCoinDisplays();
}

function showShop() {
  mode = 'shop';
  ui.showShop();
  renderShop();
  updateCoinDisplays();
}

function showStats() {
  mode = 'stats';
  ui.showStats();
  document.getElementById('stats-best').textContent = `${Math.floor(best)}m`;
  document.getElementById('stats-total-coins').textContent = coinSystem.getTotal();
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

document.getElementById('btn-back-shop')?.addEventListener('click', () => {
  showMenu();
});

document.getElementById('btn-back-stats')?.addEventListener('click', () => {
  showMenu();
});

document.getElementById('btn-back-mode')?.addEventListener('click', () => {
  showMenu();
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

// Tabs de tienda
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    
    // Actualizar tabs activos
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Mostrar contenido correspondiente
    document.querySelectorAll('.shop-content').forEach(content => {
      content.classList.add('hidden');
    });
    document.getElementById(`shop-${tab}`).classList.remove('hidden');
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
      ui.showCrash(distance, coinSystem.getCurrentEarned(), speed, lastRun);
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

    if (collision.grazed) {
      const currentTime = ts / 1000;
      if (currentTime - lastGrazeTime >= GRAZE_COOLDOWN) {
        lastGrazeTime = currentTime;
        audio.playGraze();
        sparks.emit(car.group.position.clone(), collision.normal);
      }
    }

    if (collision.crashed) crash();

    ui.updateStats(distance, speed, best, lastRun, currentGameMode);

    wheelTrails.update(simDt, car, speed, CONFIG.difficulty.speed.maxSpeed);
    speedLines.emit(speedRatio);
    speedLines.update(simDt, speedRatio);
    sparks.update(simDt);

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

// Aplicar skin inicial
car.applySkin(shopSystem.selectedSkin);
car.applyAccessories(shopSystem.selectedAccessories);

// Iniciar con el menú
showMenu();
requestAnimationFrame(frame);

// Debug tools (clean, no ad testing)
window.gameDebug = {
  getPerformanceMetrics: () => {
    return { mobileMode: isMobile };
  },
  coinSystem,
  shopSystem
};

console.log('One Wrong Turn - Ready for Poki');
