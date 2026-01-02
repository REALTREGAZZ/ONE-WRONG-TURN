import * as THREE from 'three';

// ============================================================================
// GAME STATE
// ============================================================================
const gameState = {
  isPlaying: false,
  score: 0,
  distance: 0,
  roadWidth: 10,
  crashed: false
};

// ============================================================================
// GAME CONSTANTS
// ============================================================================
const CAR_SPEED = 50;
const TURN_SPEED = 2;
const INITIAL_ROAD_WIDTH = 10;
const MINIMUM_ROAD_WIDTH = 3;
const NARROWING_RATE = 500;
const WALL_HEIGHT = 3;
const WALL_DEPTH = 5;
const WALL_SPACING = 20;
const CAR_WIDTH = 1;
const CAR_HEIGHT = 0.8;
const CAR_DEPTH = 2;
const WORLD_RESET_DISTANCE = 10000;
let lastTimestamp = 0;
let distanceTraveled = 0;
let elapsedTime = 0;
let coins = 0;
let currentRoadWidth = INITIAL_ROAD_WIDTH;

// ============================================================================
// THREE.JS SETUP
// ============================================================================
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let car: THREE.Mesh;
let road: THREE.Mesh;
let walls: any[] = [];
let lights: any;

// Input state
let keys: { [key: string]: boolean } = {};

// ============================================================================
// INITIALIZATION
// ============================================================================
function initScene() {
  try {
    console.log('[ONE WRONG TURN] Initializing scene...');
    
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    
    // Setup scene background and fog
    setupScene();
    
    // Setup lighting
    lights = setupLights();
    
    // Create car
    car = createCar();
    
    // Create road
    road = createRoad();
    
    // Create initial walls
    createInitialWalls();
    
    // Setup input
    setupInput();
    
    // Setup resize handler
    window.addEventListener('resize', onWindowResize);
    
    console.log('[ONE WRONG TURN] Scene initialization complete');
    
    // Start game loop
    lastTimestamp = performance.now();
    gameLoop();
    
  } catch (error) {
    console.error('[ONE WRONG TURN] Error during scene initialization:', error);
    showFatalError('Failed to initialize game. Please refresh.');
  }
}

function setupScene() {
  scene.background = new THREE.Color(0x1a001a); // Dark magenta/purple
  scene.fog = new THREE.Fog(0xff00ff, 200, 500); // Magenta fog
}

function setupLights() {
  // Ambient light (bright, no dark zones)
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  // Directional light (definition)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  // Cyan point light (disco left)
  const cyanLight = new THREE.PointLight(0x00ffff, 1.5, 50);
  scene.add(cyanLight);

  // Magenta point light (disco right)
  const magentaLight = new THREE.PointLight(0xff00ff, 1.5, 50);
  scene.add(magentaLight);

  return { cyanLight, magentaLight };
}

function createCar(): THREE.Mesh {
  const carGeometry = new THREE.BoxGeometry(1, 0.8, 2);
  const carMaterial = new THREE.MeshPhongMaterial({
    color: 0xFF0033, // Bright red
    emissive: 0xFF0033,
    emissiveIntensity: 0.3,
    shininess: 100
  });
  const car = new THREE.Mesh(carGeometry, carMaterial);
  car.position.set(0, 0.4, 0);
  car.userData = {
    velocity: new THREE.Vector3(0, 0, 0),
    speed: 50,
    turnSpeed: 2
  };
  return car;
}

function createRoad(): THREE.Mesh {
  // Black plane ground
  const groundGeometry = new THREE.PlaneGeometry(100, 1000);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.8,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid overlay (yellow neon)
  const gridGeometry = new THREE.BufferGeometry();
  const gridPoints = [];
  const gridSize = 100;
  const gridSpacing = 1;

  // Horizontal lines
  for (let z = -500; z <= 500; z += gridSpacing) {
    gridPoints.push(-gridSize, 0, z);
    gridPoints.push(gridSize, 0, z);
  }

  // Vertical lines
  for (let x = -gridSize; x <= gridSize; x += gridSpacing) {
    gridPoints.push(x, 0, -500);
    gridPoints.push(x, 0, 500);
  }

  gridGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gridPoints), 3));
  const gridMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
  const gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
  gridLines.position.y = -0.99;
  scene.add(gridLines);

  return ground;
}

function createNeonGrid(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  
  // Draw cyan neon grid
  context.strokeStyle = '#00FFFF';
  context.lineWidth = 2;
  
  // Draw horizontal lines
  for (let y = 0; y < canvas.height; y += 32) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }
  
  // Draw vertical lines
  for (let x = 0; x < canvas.width; x += 32) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  
  return canvas;
}

function createInitialWalls() {
  // Create walls along the road
  for (let i = 0; i < 20; i++) {
    const zPosition = i * WALL_SPACING;

    // Left wall
    const leftX = -(INITIAL_ROAD_WIDTH / 2 + 0.5);
    const rightX = +(INITIAL_ROAD_WIDTH / 2 + 0.5);

    createWall(leftX, zPosition);
    createWall(rightX, zPosition);

    // Track for collision detection
    walls.push({ x: leftX, z: zPosition, width: INITIAL_ROAD_WIDTH });
    walls.push({ x: rightX, z: zPosition, width: INITIAL_ROAD_WIDTH });
  }
}

function createWall(x: number, z: number): THREE.Mesh {
  const wallGeometry = new THREE.BoxGeometry(1, 3, 5);
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.8
  });
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.position.set(x, 1.5, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  wall.userData.isWall = true;
  scene.add(wall);
  return wall;
}

// ============================================================================
// DYNAMIC ROAD NARROWING
// ============================================================================
function calculateRoadWidth(distance: number): number {
  return Math.max(
    MINIMUM_ROAD_WIDTH,
    INITIAL_ROAD_WIDTH - (distance / NARROWING_RATE)
  );
}

function generateRoadSegments(roadWidth: number) {
  // Remove walls that are behind the camera
  const cameraThreshold = camera.position.z - 50;
  
  walls = walls.filter(wall => {
    if (wall.z < cameraThreshold) {
      return false;
    }
    return true;
  });
  
  // Add new walls ahead of the camera
  let farthestWall = walls.length > 0 ? Math.max(...walls.map(wall => wall.z)) : camera.position.z;
  
  while (farthestWall < camera.position.z + 100) {
    const zPosition = farthestWall + WALL_SPACING;
    
    // Left wall
    const leftX = -(roadWidth / 2 + 0.5);
    const rightX = +(roadWidth / 2 + 0.5);
    
    createWall(leftX, zPosition);
    createWall(rightX, zPosition);
    
    // Track for collision detection
    walls.push({ x: leftX, z: zPosition, width: roadWidth });
    walls.push({ x: rightX, z: zPosition, width: roadWidth });
    
    // Update farthestWall for the next iteration
    farthestWall = zPosition;
  }
}

function worldReset() {
  // Calculate visual offset to bring everything back near origin
  const visualOffset = Math.floor(car.position.z / WORLD_RESET_DISTANCE) * WORLD_RESET_DISTANCE;

  // Remove walls that are behind the new origin
  walls = walls.filter(wall => {
    if (wall.position.z < car.position.z - 100) {
      scene.remove(wall);
      return false;
    }
    return true;
  });

  // Shift remaining walls and car to keep coordinates reasonable
  if (visualOffset > 0) {
    car.position.z -= visualOffset;
    walls.forEach(wall => {
      wall.position.z -= visualOffset;
    });
  }
}

// ============================================================================
// INPUT HANDLING
// ============================================================================
function setupInput() {
  window.addEventListener('keydown', (event) => {
    keys[event.key] = true;

    // Start game on any key if not playing
    if (!gameState.isPlaying && !gameState.crashed) {
      gameState.isPlaying = true;
    }
  });

  window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
  });

  // Also handle touch/mobile input
  window.addEventListener('touchstart', (event) => {
    if (!gameState.isPlaying && !gameState.crashed) {
      gameState.isPlaying = true;
    }
  });
}

// ============================================================================
// GAME LOGIC
// ============================================================================
function restartGame() {
  car.position.set(0, 0.4, 0);
  car.rotation.y = 0;
  gameState.distance = 0;
  gameState.score = 0;
  gameState.roadWidth = INITIAL_ROAD_WIDTH;
  gameState.isPlaying = true;
  gameState.crashed = false;

  // Remove all wall objects from scene
  scene.children = scene.children.filter(child => {
    // Keep only non-wall objects
    if (child.userData && child.userData.isWall) {
      return false;
    }
    return true;
  });

  walls.length = 0;
  createInitialWalls();

  const deathScreen = document.getElementById('death-screen');
  if (deathScreen) {
    deathScreen.classList.remove('show');
  }
  }

function checkCollisions(car: THREE.Mesh) {
  // Create car bounding box
  const carBox = {
    min: {
      x: car.position.x - CAR_WIDTH / 2,
      y: car.position.y - CAR_HEIGHT / 2,
      z: car.position.z - CAR_DEPTH / 2
    },
    max: {
      x: car.position.x + CAR_WIDTH / 2,
      y: car.position.y + CAR_HEIGHT / 2,
      z: car.position.z + CAR_DEPTH / 2
    }
  };

  // Check collision with each wall
  for (const wall of walls) {
    const wallBox = {
      min: {
        x: wall.x - 0.5,
        y: -1.5,
        z: wall.z - 2.5
      },
      max: {
        x: wall.x + 0.5,
        y: 1.5,
        z: wall.z + 2.5
      }
    };

    // AABB collision detection
    if (
      carBox.min.x < wallBox.max.x &&
      carBox.max.x > wallBox.min.x &&
      carBox.min.y < wallBox.max.y &&
      carBox.max.y > wallBox.min.y &&
      carBox.min.z < wallBox.max.z &&
      carBox.max.z > wallBox.min.z
    ) {
      return true;
    }
  }
  return false;
}

function showDeathScreen() {
  const deathScreen = document.getElementById('death-screen');
  const deathMessage = document.getElementById('death-message');
  const deathStats = document.getElementById('death-stats');

  if (!deathScreen || !deathMessage || !deathStats) return;

  const messages = [
    'YOU TURNED TOO LATE.',
    'TOO GREEDY.',
    'YOU HESITATED.',
    'ALMOST.',
    'NOT FAST ENOUGH.',
    'PRECISION FAILED.'
  ];

  deathMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
  deathStats.textContent = `DISTANCE: ${Math.floor(gameState.distance)}m | TIME: ${(gameState.distance / 50).toFixed(2)}s`;

  deathScreen.classList.add('show');

  const handler = (e: KeyboardEvent) => {
    document.removeEventListener('keydown', handler);
    deathScreen.classList.remove('show');
    restartGame();
  };
  document.addEventListener('keydown', handler);
}

function updateHUD() {
  const scoreEl = document.getElementById('score');
  const distanceEl = document.getElementById('distance');
  const speedEl = document.getElementById('speed');
  const widthEl = document.getElementById('roadwidth');

  if (scoreEl) scoreEl.textContent = `SCORE: ${gameState.score}`;
  if (distanceEl) distanceEl.textContent = `DISTANCE: ${Math.floor(gameState.distance)}m`;
  if (speedEl) speedEl.textContent = `SPEED: ${car.userData.speed}u/s`;
  if (widthEl) widthEl.textContent = `WIDTH: ${gameState.roadWidth.toFixed(1)}u`;
}

// ============================================================================
// GAME LOOP
// ============================================================================
function gameLoop() {
  requestAnimationFrame(gameLoop);
  const deltaTime = 1 / 60;

  if (gameState.isPlaying) {
    // Move car forward
    car.position.z += car.userData.speed * deltaTime;

    // Input
    if (keys['a'] || keys['A']) {
      car.rotation.y += car.userData.turnSpeed * deltaTime;
    }
    if (keys['d'] || keys['D']) {
      car.rotation.y -= car.userData.turnSpeed * deltaTime;
    }

    // Update game state
    gameState.distance = car.position.z;
    gameState.roadWidth = calculateRoadWidth(gameState.distance);
    gameState.score = Math.floor(gameState.distance * 10);

    // Spawn walls
    generateRoadSegments(gameState.roadWidth);

    // Collision check
    if (checkCollisions(car)) {
      gameState.isPlaying = false;
      gameState.crashed = true;
      showDeathScreen();
    }

    // Update lights follow car
    lights.cyanLight.position.copy(car.position).add(new THREE.Vector3(5, 5, -10));
    lights.magentaLight.position.copy(car.position).add(new THREE.Vector3(-5, 5, -10));

    // Update camera
    camera.position.copy(car.position).add(new THREE.Vector3(0, 5, -15));
    camera.lookAt(car.position.clone().add(new THREE.Vector3(0, 2, 5)));

    // Update HUD
    updateHUD();
  }

  renderer.render(scene, camera);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function onWindowResize() {
  try {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  } catch (error) {
    console.error('[ONE WRONG TURN] Error handling resize:', error);
  }
}

function showFatalError(message: string) {
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'absolute';
  errorDiv.style.top = '50%';
  errorDiv.style.left = '50%';
  errorDiv.style.transform = 'translate(-50%, -50%)';
  errorDiv.style.color = 'white';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.style.textAlign = 'center';
  errorDiv.style.fontSize = '24px';
  errorDiv.innerHTML = `
    <h1>ERROR</h1>
    <p>${message}</p>
    <p style="font-size: 16px; opacity: 0.7;">Check console for details</p>
  `;
  
  document.body.appendChild(errorDiv);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
console.log('[ONE WRONG TURN] Starting game...');

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScene);
} else {
  initScene();
}