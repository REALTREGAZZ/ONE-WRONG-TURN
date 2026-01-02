import * as THREE from 'three';

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

// ============================================================================
// GAME STATE
// ============================================================================
type GameState = 'PLAYING' | 'DEAD';

let gameState: GameState = 'PLAYING';
let elapsedTime = 0;
let coins = 0;
let distanceTraveled = 0;
let currentRoadWidth = INITIAL_ROAD_WIDTH;
let lastTimestamp = 0;

// ============================================================================
// THREE.JS SETUP
// ============================================================================
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let car: THREE.Mesh;
let road: THREE.Mesh;
let walls: THREE.Mesh[] = [];
let ambientLight: THREE.AmbientLight;
let cyanLight: THREE.PointLight;
let magentaLight: THREE.PointLight;

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
    
    // Create synthwave gradient background
    createSynthwaveBackground();
    
    // Setup lighting
    setupLights();
    
    // Create car
    car = createCar();
    scene.add(car);
    
    // Create road
    road = createRoad();
    scene.add(road);
    
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

function createSynthwaveBackground() {
  // Create canvas for gradient background
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  
  const context = canvas.getContext('2d');
  if (!context) return;
  
  // Create magenta to violet gradient
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#FF00FF');  // Magenta
  gradient.addColorStop(1, '#7700FF');  // Violet
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  const texture = new THREE.CanvasTexture(canvas);
  scene.background = texture;
}

function setupLights() {
  // Ambient light
  ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.5);
  scene.add(ambientLight);

  // Cyan point light
  cyanLight = new THREE.PointLight(0x00FFFF, 1.5, 40);
  scene.add(cyanLight);

  // Magenta point light
  magentaLight = new THREE.PointLight(0xFF00FF, 1.5, 40);
  scene.add(magentaLight);
}

function createCar(): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(CAR_WIDTH, CAR_HEIGHT, CAR_DEPTH);
  const material = new THREE.MeshPhongMaterial({
    color: 0xFF0033,  // Bright red
    shininess: 50
  });
  
  const carMesh = new THREE.Mesh(geometry, material);
  carMesh.position.y = CAR_HEIGHT / 2;  // Position above ground
  
  return carMesh;
}

function createRoad(): THREE.Mesh {
  // Create large black plane for road
  const roadGeometry = new THREE.PlaneGeometry(1000, 1000);
  const roadMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.DoubleSide
  });
  
  const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
  roadMesh.rotation.x = -Math.PI / 2;  // Make it horizontal
  roadMesh.position.y = -0.1;  // Slightly below car
  
  // Add neon grid overlay
  const gridCanvas = createNeonGrid();
  const gridTexture = new THREE.CanvasTexture(gridCanvas);
  gridTexture.repeat.set(10, 10);
  gridTexture.wrapS = THREE.RepeatWrapping;
  gridTexture.wrapT = THREE.RepeatWrapping;
  
  const gridMaterial = new THREE.MeshBasicMaterial({
    map: gridTexture,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
  });
  
  const gridMesh = new THREE.Mesh(roadGeometry, gridMaterial);
  gridMesh.rotation.x = -Math.PI / 2;
  gridMesh.position.y = -0.09;  // Just above road
  
  scene.add(gridMesh);
  
  return roadMesh;
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
    const leftWall = createWall();
    leftWall.position.x = -INITIAL_ROAD_WIDTH / 2 - 1;
    leftWall.position.z = zPosition;
    scene.add(leftWall);
    walls.push(leftWall);

    // Right wall
    const rightWall = createWall();
    rightWall.position.x = INITIAL_ROAD_WIDTH / 2 + 1;
    rightWall.position.z = zPosition;
    scene.add(rightWall);
    walls.push(rightWall);
  }
}

function createWall(): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(1, WALL_HEIGHT, WALL_DEPTH);
  const material = new THREE.MeshPhongMaterial({
    color: 0x00FFFF,  // Cyan
    emissive: 0x00FFFF,
    emissiveIntensity: 0.5
  });
  
  const wall = new THREE.Mesh(geometry, material);
  wall.position.y = WALL_HEIGHT / 2;  // Position above ground
  
  return wall;
}

// ============================================================================
// DYNAMIC ROAD NARROWING
// ============================================================================
function calculateRoadWidth(distanceTraveled: number): number {
  return Math.max(
    MINIMUM_ROAD_WIDTH,
    INITIAL_ROAD_WIDTH - (distanceTraveled / NARROWING_RATE)
  );
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
    
    // Restart game on any key when dead
    if (gameState === 'DEAD') {
      restartGame();
    }
  });
  
  window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
  });
  
  // Also handle touch/mobile input
  window.addEventListener('touchstart', (event) => {
    if (gameState === 'DEAD') {
      restartGame();
    }
  });
}

// ============================================================================
// GAME LOGIC
// ============================================================================
function restartGame() {
  // Reset game state
  gameState = 'PLAYING';
  elapsedTime = 0;
  coins = 0;
  distanceTraveled = 0;
  currentRoadWidth = INITIAL_ROAD_WIDTH;

  // Reset car position and rotation
  car.position.set(0, CAR_HEIGHT / 2, 0);
  car.rotation.y = 0;

  // Reset camera
  updateCamera();

  // Hide death screen
  const deathScreen = document.getElementById('death-screen');
  if (deathScreen) {
    deathScreen.style.display = 'none';
  }

  // Reset walls
  walls.forEach(wall => scene.remove(wall));
  walls = [];
  createInitialWalls();

  // Update HUD
  updateHUD();
}

function updateCamera() {
  // Position camera behind car
  camera.position.x = car.position.x;
  camera.position.y = 5;
  camera.position.z = car.position.z - 15;
  
  // Look at point ahead of car
  camera.lookAt(car.position.x, car.position.y + 2, car.position.z + 5);
}

function updateLights() {
  // Update cyan light position (follows car with disco effect)
  cyanLight.position.copy(car.position).add(new THREE.Vector3(5, 5, -10));

  // Update magenta light position (follows car with disco effect)
  magentaLight.position.copy(car.position).add(new THREE.Vector3(-5, 5, -10));
}

function updateCar(deltaTime: number) {
  // Handle rotation input
  if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
    car.rotation.y -= TURN_SPEED * deltaTime;
  }
  if (keys['d'] || keys['D'] || keys['ArrowRight']) {
    car.rotation.y += TURN_SPEED * deltaTime;
  }

  // Calculate movement based on rotation
  const moveX = Math.sin(car.rotation.y) * CAR_SPEED * deltaTime;
  const moveZ = Math.cos(car.rotation.y) * CAR_SPEED * deltaTime;

  // Update car position
  car.position.x += moveX;
  car.position.z += moveZ;

  // Track distance traveled
  distanceTraveled = car.position.z;

  // Update elapsed time
  elapsedTime += deltaTime;

  // Update coins (based on distance traveled)
  coins = Math.floor(distanceTraveled / 10) + Math.floor(elapsedTime);
}

function updateWalls() {
  // Calculate current road width based on distance
  currentRoadWidth = calculateRoadWidth(distanceTraveled);

  // Remove walls that are behind the camera
  const cameraThreshold = camera.position.z - 50;

  walls = walls.filter(wall => {
    if (wall.position.z < cameraThreshold) {
      scene.remove(wall);
      return false;
    }
    return true;
  });

  // Add new walls ahead of the camera
  let farthestWall = Math.max(...walls.map(wall => wall.position.z), camera.position.z);

  while (farthestWall < camera.position.z + 100) {
    const zPosition = farthestWall + WALL_SPACING;

    // Left wall
    const leftWall = createWall();
    leftWall.position.x = -currentRoadWidth / 2 - 1;
    leftWall.position.z = zPosition;
    scene.add(leftWall);
    walls.push(leftWall);

    // Right wall
    const rightWall = createWall();
    rightWall.position.x = currentRoadWidth / 2 + 1;
    rightWall.position.z = zPosition;
    scene.add(rightWall);
    walls.push(rightWall);

    // Update farthestWall for the next iteration
    farthestWall = zPosition;
  }
}

function checkCollisions() {
  if (gameState !== 'PLAYING') return;

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
        x: wall.position.x - 0.5,
        y: wall.position.y - WALL_HEIGHT / 2,
        z: wall.position.z - WALL_DEPTH / 2
      },
      max: {
        x: wall.position.x + 0.5,
        y: wall.position.y + WALL_HEIGHT / 2,
        z: wall.position.z + WALL_DEPTH / 2
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
      // Collision detected!
      gameState = 'DEAD';

      // Show death screen
      const deathScreen = document.getElementById('death-screen') as HTMLElement;
      const deathMessage = document.getElementById('death-message') as HTMLElement;
      const deathStats = document.getElementById('death-stats') as HTMLElement;

      const messages = [
        'YOU TURNED TOO LATE.',
        'TOO GREEDY.',
        'YOU HESITATED.',
        'ALMOST.',
        'NOT FAST ENOUGH.',
        'PRECISION FAILED.'
      ];

      if (deathMessage) {
        deathMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
      }

      if (deathStats) {
        deathStats.textContent = `DISTANCE: ${Math.floor(distanceTraveled)}m | TIME: ${elapsedTime.toFixed(2)}s`;
      }

      if (deathScreen) {
        deathScreen.style.display = 'block';
      }

      break;
    }
  }
}

function updateHUD() {
  const distanceElement = document.getElementById('distance');
  const speedElement = document.getElementById('speed');
  const widthElement = document.getElementById('roadwidth');
  const timeElement = document.getElementById('time');

  if (distanceElement) {
    distanceElement.textContent = `DISTANCE: ${Math.floor(distanceTraveled)}m`;
  }

  if (speedElement) {
    speedElement.textContent = `SPEED: ${CAR_SPEED}u/s`;
  }

  if (widthElement) {
    widthElement.textContent = `WIDTH: ${currentRoadWidth.toFixed(1)}u`;
  }

  if (timeElement) {
    timeElement.textContent = `TIME: ${elapsedTime.toFixed(2)}s`;
  }
}

// ============================================================================
// GAME LOOP
// ============================================================================
function gameLoop() {
  try {
    const now = performance.now();
    const deltaTime = (now - lastTimestamp) / 1000;  // Convert to seconds
    lastTimestamp = now;

    if (gameState === 'PLAYING') {
      // Update game logic
      updateCar(deltaTime);
      updateCamera();
      updateLights();
      updateWalls();
      checkCollisions();
      updateHUD();

      // World reset to prevent float overflow
      if (distanceTraveled > WORLD_RESET_DISTANCE) {
        worldReset();
      }
    }

    // Render scene
    renderer.render(scene, camera);

    // Continue game loop
    requestAnimationFrame(gameLoop);

  } catch (error) {
    console.error('[ONE WRONG TURN] Error in game loop:', error);
    // Continue loop even if error occurs
    requestAnimationFrame(gameLoop);
  }
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