import * as THREE from 'three';
import { Car } from './Car';
import { Road } from './Road';
import { Camera } from './Camera';
import { Collision } from './Collision';
import { AudioManager } from '../audio/AudioManager';
import { UIManager } from '../ui/UIManager';

export type GameState = 'home' | 'playing' | 'dead' | 'stats' | 'shop' | 'settings';

export class GameEngine {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: Camera;
  private car: Car;
  private road: Road;
  private collision: Collision;
  private audioManager: AudioManager | null = null;
  private uiManager: UIManager | null = null;

  private state: GameState = 'home';
  private runStartTime = 0;
  private currentRunTime = 0;
  private coinsThisRun = 0;
  private distanceTraveled = 0;

  private keys = {
    left: false,
    right: false,
  };

  private lastTime = 0;
  private slowMotionActive = false;
  private slowMotionTimer = 0;
  private freezeTimer = 0;
  private restartPending = false;

  constructor() {
    console.log('[ONE WRONG TURN] Initializing...');
    try {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000000);
      this.scene.fog = new THREE.Fog(0x000000, 50, 200);
      console.log('[ONE WRONG TURN] Scene created');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error creating scene:', error);
      throw error;
    }

    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      console.log('[ONE WRONG TURN] Renderer created');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error creating renderer:', error);
      throw error;
    }

    try {
      const container = document.getElementById('game-container');
      if (!container) {
        throw new Error('Game container not found');
      }
      container.appendChild(this.renderer.domElement);
      console.log('[ONE WRONG TURN] Canvas added to DOM');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error setting up canvas:', error);
      throw error;
    }

    try {
      const selectedSkin = localStorage.getItem('selectedSkin') || 'default';
      this.car = new Car(selectedSkin);
      if (!this.car || !this.car.getMesh()) {
        throw new Error('Failed to create car mesh');
      }
      this.scene.add(this.car.getMesh());
      console.log('[ONE WRONG TURN] Car created');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error creating car:', error);
      throw error;
    }

    try {
      this.road = new Road();
      if (!this.road || !this.road.getMesh()) {
        throw new Error('Failed to create road mesh');
      }
      this.scene.add(this.road.getMesh());
      console.log('[ONE WRONG TURN] Road generated');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error creating road:', error);
      throw error;
    }

    try {
      this.collision = new Collision();
      console.log('[ONE WRONG TURN] Collision system initialized');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error creating collision system:', error);
      throw error;
    }

    try {
      this.camera = new Camera();
      if (!this.camera || !this.camera.getCamera()) {
        throw new Error('Failed to create camera');
      }
      this.camera.setTarget(this.car.getMesh());
      console.log('[ONE WRONG TURN] Camera created');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error creating camera:', error);
      throw error;
    }

    try {
      this.setupLights();
      console.log('[ONE WRONG TURN] Lighting setup complete');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error setting up lights:', error);
      throw error;
    }

    try {
      this.setupInputs();
      console.log('[ONE WRONG TURN] Input handlers registered');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error setting up inputs:', error);
      throw error;
    }

    try {
      this.handleResize();
      console.log('[ONE WRONG TURN] Initial resize handled');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error handling initial resize:', error);
      throw error;
    }
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    const fillLight = new THREE.PointLight(0xff00ff, 0.5);
    fillLight.position.set(-20, 10, 0);
    this.scene.add(fillLight);

    const backLight = new THREE.PointLight(0x00ffff, 0.5);
    backLight.position.set(20, 10, -20);
    this.scene.add(backLight);
  }

  private setupInputs(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    window.addEventListener('click', () => this.handleClick());

    const container = document.getElementById('game-container')!;
    container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    container.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.state === 'home') {
      if (e.code === 'Space') {
        this.startGame();
      }
    } else if (this.state === 'playing') {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        this.keys.left = true;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        this.keys.right = true;
      }
    } else if (this.state === 'dead') {
      if (!this.restartPending) {
        this.restartPending = true;
        setTimeout(() => this.startGame(), 300);
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      this.keys.left = false;
    }
    if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      this.keys.right = false;
    }
  }

  private handleClick(): void {
    if (this.state === 'home') {
      this.startGame();
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    if (this.state === 'playing') {
      e.preventDefault();
      const touch = e.touches[0];
      const screenWidth = window.innerWidth;
      if (touch.clientX < screenWidth / 2) {
        this.keys.left = true;
      } else {
        this.keys.right = true;
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (this.state === 'playing') {
      e.preventDefault();
      this.keys.left = false;
      this.keys.right = false;
    }
  }

  public setAudioManager(manager: AudioManager): void {
    this.audioManager = manager;
  }

  public setUIManager(manager: UIManager): void {
    this.uiManager = manager;
  }

  public getAudioManager(): AudioManager | null {
    return this.audioManager;
  }

  public setState(state: GameState): void {
    this.state = state;
  }

  public getState(): GameState {
    return this.state;
  }

  public startGame(): void {
    this.state = 'playing';
    this.runStartTime = Date.now();
    this.currentRunTime = 0;
    this.coinsThisRun = 0;
    this.distanceTraveled = 0;
    this.restartPending = false;

    this.car.reset();
    this.road.reset();
    this.camera.reset();

    this.uiManager?.showGame();
    this.audioManager?.playEngine();

    const attempts = parseInt(localStorage.getItem('totalAttempts') || '0') + 1;
    localStorage.setItem('totalAttempts', attempts.toString());
  }

  public returnHome(): void {
    this.state = 'home';
    this.uiManager?.showHome();
    this.audioManager?.stopEngine();
  }

  private handleCrash(): void {
    if (this.state !== 'playing') return;

    this.state = 'dead';
    this.slowMotionActive = true;
    this.slowMotionTimer = 0;
    this.freezeTimer = 0;

    this.audioManager?.playCrash();
    this.audioManager?.stopEngine();

    const crashes = parseInt(localStorage.getItem('totalCrashes') || '0') + 1;
    localStorage.setItem('totalCrashes', crashes.toString());

    const totalCoins = parseInt(localStorage.getItem('totalCoins') || '0');
    localStorage.setItem('totalCoins', (totalCoins + this.coinsThisRun).toString());

    const bestTime = parseFloat(localStorage.getItem('bestTime') || '0');
    if (this.currentRunTime > bestTime) {
      localStorage.setItem('bestTime', this.currentRunTime.toFixed(2));
    }

    setTimeout(() => {
      this.uiManager?.showDeath(this.currentRunTime, this.coinsThisRun);
    }, 500);
  }

  public handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.handleResize(width, height);
    this.renderer.setSize(width, height);
  }

  public init(): void {
    try {
      console.log('[ONE WRONG TURN] Starting game loop...');
      this.animate(0);
      console.log('[ONE WRONG TURN] Game loop started');
      console.log('[ONE WRONG TURN] Game ready - press SPACE to start');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error initializing game loop:', error);
      throw error;
    }
  }

  private animate(time: number): void {
    try {
      requestAnimationFrame((t) => this.animate(t));

      let deltaTime = (time - this.lastTime) / 1000;
      this.lastTime = time;

      if (deltaTime > 0.1) deltaTime = 0.1;

      if (this.state === 'playing') {
        this.update(deltaTime);
        if (this.camera) {
          this.camera.update(deltaTime, false, 0);
        }
      } else if (this.state === 'dead' && this.slowMotionActive) {
        const slowDelta = deltaTime * 0.3;
        this.slowMotionTimer += deltaTime;

        if (this.slowMotionTimer < 0.3) {
          this.update(slowDelta);
          if (this.camera) {
            this.camera.update(slowDelta, true, 10);
          }
        } else if (this.freezeTimer < 0.5) {
          this.freezeTimer += deltaTime;
          if (this.camera) {
            this.camera.update(0, true, 10);
          }
        } else {
          this.slowMotionActive = false;
        }
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera.getCamera());
      }
    } catch (error) {
      console.error('[ONE WRONG TURN] Error in game loop:', error);
      // Don't rethrow - keep the game loop running
    }
  }

  private update(deltaTime: number): void {
    try {
      if (!this.car) {
        console.error('[ONE WRONG TURN] Car not initialized in update');
        return;
      }

      if (!this.road) {
        console.error('[ONE WRONG TURN] Road not initialized in update');
        return;
      }

      if (!this.collision) {
        console.error('[ONE WRONG TURN] Collision system not initialized in update');
        return;
      }

      const turnInput = (this.keys.left ? -1 : 0) + (this.keys.right ? 1 : 0);
      this.car.update(deltaTime, turnInput);

      const carPos = this.car.getPosition();
      this.road.update(carPos);

      this.distanceTraveled += this.car.getSpeed() * deltaTime;
      this.currentRunTime = (Date.now() - this.runStartTime) / 1000;
      this.coinsThisRun = Math.floor(this.distanceTraveled / 10 + this.currentRunTime);

      this.uiManager?.updateHUD(this.currentRunTime, this.coinsThisRun);

      const walls = this.road.getWalls();
      const carBounds = this.car.getBounds();

      if (this.collision.checkCollision(carBounds, walls)) {
        this.handleCrash();
      }
    } catch (error) {
      console.error('[ONE WRONG TURN] Error in update:', error);
      this.handleCrash();
    }
  }

  public updateCarSkin(skinId: string): void {
    try {
      if (!this.car || !this.camera) {
        console.error('[ONE WRONG TURN] Cannot update car skin - objects not initialized');
        return;
      }

      const oldMesh = this.car.getMesh();
      this.scene.remove(oldMesh);

      // Dispose old mesh and its children
      oldMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });

      this.car = new Car(skinId);
      this.scene.add(this.car.getMesh());
      this.camera.setTarget(this.car.getMesh());

      console.log('[ONE WRONG TURN] Car skin updated:', skinId);
    } catch (error) {
      console.error('[ONE WRONG TURN] Error updating car skin:', error);
    }
  }

  public dispose(): void {
    // Cleanup Three.js objects to prevent memory leaks
    try {
      if (this.renderer) {
        this.renderer.dispose();
      }

      if (this.scene) {
        this.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
      console.log('[ONE WRONG TURN] Game disposed');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error during disposal:', error);
    }
  }
}
