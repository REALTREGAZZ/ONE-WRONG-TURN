import { CONFIG } from './config.js';
import { Car } from './car.js';
import { World } from './world.js';
import { GameLogic } from './gameLogic.js';
import { InputManager } from './inputManager.js';
import { AudioManager } from './audioManager.js';
import { StorageManager } from './storageManager.js';
import { UIManager } from './uiManager.js';

export class Main {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.car = null;
        this.world = null;
        this.gameLogic = null;
        this.clock = null;
        this.canvas = null;
        
        this.isInitialized = false;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setup();
            });
        } else {
            this.setup();
        }
    }
    
    setup() {
        try {
            console.log('Initializing ONE WRONG TURN...');
            
            // Setup Three.js
            this.setupThreeJS();
            
            // Setup lighting
            this.setupLighting();
            
            // Create game objects
            this.createGameObjects();
            
            // Setup game logic
            this.setupGameLogic();
            
            this.isInitialized = true;
            console.log('Game initialized successfully');
            
            // Make main instance globally available
            window.main = this;
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }
    
    setupThreeJS() {
        // Get canvas
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Game canvas not found');
        }
        
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, // FOV
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near plane
            1000 // Far plane
        );
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Set clear color
        this.renderer.setClearColor(CONFIG.SYNTHWAVE.SKY_BOTTOM);
        
        // Enable shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Set up resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Create clock for delta time
        this.clock = new THREE.Clock();
    }
    
    setupLighting() {
        // Ambient light (strong to prevent black models)
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambientLight);
        
        // Directional sun light
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(10, 20, 10);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -50;
        sunLight.shadow.camera.right = 50;
        sunLight.shadow.camera.top = 50;
        sunLight.shadow.camera.bottom = -50;
        this.scene.add(sunLight);
        
        // Cyan accent light
        const cyanLight = new THREE.PointLight(CONFIG.SYNTHWAVE.WALLS_CYAN, 2.5, 100);
        cyanLight.position.set(-15, 8, 0);
        this.scene.add(cyanLight);
        
        // Magenta accent light
        const magentaLight = new THREE.PointLight(CONFIG.SYNTHWAVE.WALLS_MAGENTA, 2.5, 100);
        magentaLight.position.set(15, 8, 0);
        this.scene.add(magentaLight);
        
        // Fill light for car
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-10, 5, -10);
        this.scene.add(fillLight);
        
        // Rim light for car
        const rimLight = new THREE.DirectionalLight(0x00ffff, 0.4);
        rimLight.position.set(0, 8, 10);
        this.scene.add(rimLight);
        
        // Hemisphere light for ambient sky color
        const hemisphereLight = new THREE.HemisphereLight(CONFIG.SYNTHWAVE.SKY_TOP, 0x222222, 0.3);
        this.scene.add(hemisphereLight);
    }
    
    createGameObjects() {
        // Create world
        this.world = new World(this.scene);
        
        // Create car
        this.car = new Car(this.scene);
        
        // Apply saved skin
        if (window.Game && window.Game.equippedSkin) {
            this.car.applySkin(window.Game.equippedSkin);
        }
    }
    
    setupGameLogic() {
        // Create input manager
        if (!window.inputManager) {
            window.inputManager = new InputManager();
        }
        
        // Create game logic
        this.gameLogic = new GameLogic(this.car, this.world, window.inputManager);
    }
    
    startGame() {
        if (!this.isInitialized) {
            console.error('Game not initialized');
            return;
        }
        
        console.log('Starting new game...');
        
        // Reset camera position
        this.resetCamera();
        
        // Start game logic
        this.gameLogic.startGame();
        
        // Start render loop
        this.startRenderLoop();
    }
    
    resetCamera() {
        // Position camera behind and above the car
        this.camera.position.set(0, 8, 10);
        this.camera.lookAt(0, 2, 0);
    }
    
    startRenderLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            
            const deltaTime = this.clock.getDelta();
            
            // Update game logic
            this.gameLogic.update(deltaTime);
            
            // Update camera to follow car
            this.updateCamera(deltaTime);
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }
    
    updateCamera(deltaTime) {
        if (!this.car) return;
        
        const carPosition = this.car.getPosition();
        const cameraOffset = {
            x: 0,
            y: CONFIG.GAME.CAMERA_FOLLOW_HEIGHT,
            z: CONFIG.GAME.CAMERA_FOLLOW_DISTANCE
        };
        
        // Target camera position
        const targetPosition = new THREE.Vector3(
            carPosition.x + cameraOffset.x,
            cameraOffset.y,
            carPosition.z + cameraOffset.z
        );
        
        // Smooth camera movement
        this.camera.position.lerp(targetPosition, CONFIG.GAME.CAMERA_FOLLOW_SPEED);
        
        // Look at car
        const lookAtTarget = new THREE.Vector3(
            carPosition.x,
            carPosition.y + 1,
            carPosition.z - 10
        );
        
        this.camera.lookAt(lookAtTarget);
    }
    
    updateCarSkin() {
        if (this.car && window.Game && window.Game.equippedSkin) {
            this.car.applySkin(window.Game.equippedSkin);
        }
    }
    
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Update camera aspect ratio
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(width, height);
        
        console.log('Game resized to:', width, 'x', height);
    }
    
    dispose() {
        // Cancel animation frame
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Dispose game logic
        if (this.gameLogic) {
            this.gameLogic.dispose();
        }
        
        // Dispose car
        if (this.car) {
            this.car.dispose();
        }
        
        // Dispose world
        if (this.world) {
            this.world.dispose();
        }
        
        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        console.log('Game disposed');
    }
}

// Initialize the game
new Main();