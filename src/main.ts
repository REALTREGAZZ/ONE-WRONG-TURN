import * as THREE from 'three';

// ============================================================================
// GAME CONSTANTS
// ============================================================================
const CAR_SPEED = 50;
const TURN_SPEED = 2;
const ROAD_WIDTH = 8;
const WALL_HEIGHT = 3;
const WALL_DEPTH = 5;
const WALL_SPACING = 20;
const CAR_WIDTH = 1;
const CAR_HEIGHT = 0.8;
const CAR_DEPTH = 2;

// ============================================================================
// GAME STATE
// ============================================================================
type GameState = 'PLAYING' | 'DEAD';

let gameState: GameState = 'PLAYING';
let elapsedTime = 0;
let coins = 0;
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
  ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
  scene.add(ambientLight);
  
  // Cyan point light
  cyanLight = new THREE.PointLight(0x00FFFF, 1.5, 30);
  scene.add(cyanLight);
  
  // Magenta point light
  magentaLight = new THREE.PointLight(0xFF00FF, 1.5, 30);
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
    leftWall.position.x = -ROAD_WIDTH / 2 - 1;
    leftWall.position.z = zPosition;
    scene.add(leftWall);
    walls.push(leftWall);
    
    // Right wall
    const rightWall = createWall();
    rightWall.position.x = ROAD_WIDTH / 2 + 1;
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
  
  // Reset car position and rotation
  car.position.set(0, CAR_HEIGHT / 2, 0);
  car.rotation.y = 0;
  
  // Reset camera
  updateCamera();
  
  // Hide death message
  const deathMessage = document.getElementById('death-message');
  if (deathMessage) {
    deathMessage.style.display = 'none';
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
  // Update cyan light position (follows car)
  cyanLight.position.x = car.position.x + 5;
  cyanLight.position.y = 5;
  cyanLight.position.z = car.position.z + 10;
  
  // Update magenta light position (follows car)
  magentaLight.position.x = car.position.x - 5;
  magentaLight.position.y = 5;
  magentaLight.position.z = car.position.z + 10;
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
  
  // Update elapsed time
  elapsedTime += deltaTime;
  
  // Update coins (based on distance traveled)
  coins = Math.floor(elapsedTime * 10);
}

function updateWalls() {
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
  const farthestWall = Math.max(...walls.map(wall => wall.position.z), camera.position.z);
  
  while (farthestWall < camera.position.z + 100) {
    const zPosition = farthestWall + WALL_SPACING;
    
    // Left wall
    const leftWall = createWall();
    leftWall.position.x = -ROAD_WIDTH / 2 - 1;
    leftWall.position.z = zPosition;
    scene.add(leftWall);
    walls.push(leftWall);
    
    // Right wall
    const rightWall = createWall();
    rightWall.position.x = ROAD_WIDTH / 2 + 1;
    rightWall.position.z = zPosition;
    scene.add(rightWall);
    walls.push(rightWall);
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
      
      // Show death message
      const deathMessage = document.getElementById('death-message');
      if (deathMessage) {
        deathMessage.innerHTML = `
          YOU TURNED TOO LATE.<br>
          TIME: ${elapsedTime.toFixed(2)}s<br>
          <small>(any key to restart)</small>
        `;
        deathMessage.style.display = 'block';
      }
      
      break;
    }
  }
}

function updateHUD() {
  const timeElement = document.getElementById('time');
  const coinsElement = document.getElementById('coins');
  
  if (timeElement) {
    timeElement.textContent = `TIME: ${elapsedTime.toFixed(2)}s`;
  }
  
  if (coinsElement) {
    coinsElement.textContent = `COINS: ${coins}`;
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