import { CONFIG } from './config.js';
import { AudioManager } from './audioManager.js';
import { StorageManager } from './storageManager.js';
import { UIManager } from './uiManager.js';

export class GameLogic {
    constructor(car, world, inputManager) {
        this.car = car;
        this.world = world;
        this.inputManager = inputManager;
        
        this.isPlaying = false;
        this.isCrashed = false;
        this.distance = 0;
        this.coinsEarned = 0;
        this.gameStartTime = 0;
        this.timeScale = 1.0;
        this.crashDelay = CONFIG.GAMEPLAY.CRASH_DELAY;
        this.crashTimeout = null;
    }
    
    startGame() {
        this.isPlaying = true;
        this.isCrashed = false;
        this.distance = 0;
        this.coinsEarned = 0;
        this.gameStartTime = Date.now();
        this.timeScale = 1.0;
        
        // Reset car
        this.car.reset();
        
        // Enable controls
        this.inputManager.enableControls();
        
        // Add touch controls for mobile
        this.inputManager.showMobileControls();
        
        // Clear any existing crash timeout
        if (this.crashTimeout) {
            clearTimeout(this.crashTimeout);
            this.crashTimeout = null;
        }
        
        console.log('Game started');
    }
    
    update(deltaTime) {
        if (!this.isPlaying) return;
        
        // Update time scale for slow motion
        const scaledDeltaTime = deltaTime * this.timeScale;
        
        // Update input
        this.inputManager.update();
        const steering = this.inputManager.getSteering();
        
        // Update car
        this.car.update(scaledDeltaTime, steering, this.timeScale);
        
        // Update distance
        this.distance = Math.abs(this.car.getPosition().z);
        this.coinsEarned = Math.floor(this.distance);
        
        // Update world
        this.world.update(this.car.getPosition().z);
        
        // Check collision
        if (this.checkCollision()) {
            this.handleCrash();
        }
        
        // Update UI
        this.updateUI();
    }
    
    checkCollision() {
        if (this.isCrashed) return false;
        
        const carPosition = this.car.getPosition();
        const carSize = { x: 2.0, y: 0.8, z: 1.2 }; // Car dimensions
        
        // Check collision with world boundaries
        return this.world.checkCollision(carPosition, carSize);
    }
    
    handleCrash() {
        if (this.isCrashed) return;
        
        this.isCrashed = true;
        this.isPlaying = false;
        
        // Stop car movement
        this.car.crash();
        
        // Play crash sound
        if (window.audioManager) {
            window.audioManager.playSound('crash');
        }
        
        // Disable controls
        this.inputManager.disableControls();
        
        // Remove touch controls
        this.inputManager.hideMobileControls();
        
        // Apply slow motion effect
        this.timeScale = CONFIG.GAMEPLAY.CAMERA_SLOWMO_SCALE;
        
        // Save best distance
        if (window.storageManager) {
            window.storageManager.updateBestDistance(this.distance);
            window.storageManager.addCoins(this.coinsEarned);
            window.storageManager.incrementGamesPlayed();
        }
        
        // Update game coins
        if (window.Game) {
            window.Game.coins = window.storageManager.data.coins;
        }
        
        // Show death screen after delay
        this.crashTimeout = setTimeout(() => {
            this.showDeathScreen();
        }, this.crashDelay);
        
        console.log('Crash detected! Distance:', this.distance);
    }
    
    showDeathScreen() {
        // Restore normal time scale
        this.timeScale = 1.0;
        
        // Show death UI
        if (window.uiManager) {
            window.uiManager.showDeathScreen(this.distance, this.coinsEarned);
        }
        
        // Show death screen in game controller
        if (window.Game) {
            window.Game.distance = this.distance;
            window.Game.showDeathScreen();
        }
    }
    
    updateUI() {
        // Update HUD
        if (window.uiManager) {
            window.uiManager.updateHUD({
                distance: this.distance,
                coins: window.Game ? window.Game.coins : 0,
                speed: CONFIG.GAME.START_SPEED
            });
        }
        
        // Update game controller
        if (window.Game) {
            window.Game.distance = this.distance;
            window.Game.updateHUD();
        }
    }
    
    endGame() {
        this.isPlaying = false;
        this.inputManager.disableControls();
        this.inputManager.hideMobileControls();
        
        if (this.crashTimeout) {
            clearTimeout(this.crashTimeout);
            this.crashTimeout = null;
        }
    }
    
    restartGame() {
        this.endGame();
        this.startGame();
    }
    
    getDistance() {
        return this.distance;
    }
    
    getCoinsEarned() {
        return this.coinsEarned;
    }
    
    isGamePlaying() {
        return this.isPlaying;
    }
    
    isGameCrashed() {
        return this.isCrashed;
    }
    
    getGameTime() {
        return Date.now() - this.gameStartTime;
    }
    
    dispose() {
        this.endGame();
        
        if (this.crashTimeout) {
            clearTimeout(this.crashTimeout);
            this.crashTimeout = null;
        }
    }
}