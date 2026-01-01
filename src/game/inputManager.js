// Input Manager for handling keyboard and touch controls
export class InputManager {
    constructor() {
        this.keys = {
            left: false,
            right: false,
            forward: false,
            backward: false,
            restart: false
        };
        
        this.touchControls = {
            left: false,
            right: false
        };
        
        this.steering = 0;
        this.isEnabled = true;
        
        this.setupEventListeners();
        this.setupTouchControls();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            if (!this.isEnabled) return;
            
            switch (event.code) {
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = true;
                    event.preventDefault();
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = true;
                    event.preventDefault();
                    break;
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = true;
                    event.preventDefault();
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = true;
                    event.preventDefault();
                    break;
                case 'Space':
                case 'Enter':
                    this.keys.restart = true;
                    event.preventDefault();
                    break;
                case 'KeyR':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        return;
                    }
                    this.keys.restart = true;
                    event.preventDefault();
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            if (!this.isEnabled) return;
            
            switch (event.code) {
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = false;
                    event.preventDefault();
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = false;
                    event.preventDefault();
                    break;
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = false;
                    event.preventDefault();
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = false;
                    event.preventDefault();
                    break;
                case 'Space':
                case 'Enter':
                case 'KeyR':
                    this.keys.restart = false;
                    event.preventDefault();
                    break;
            }
        });
        
        // Prevent context menu on canvas
        document.addEventListener('contextmenu', (event) => {
            if (event.target.tagName === 'CANVAS') {
                event.preventDefault();
            }
        });
    }
    
    setupTouchControls() {
        // Create touch control buttons
        this.createTouchControls();
        
        // Touch events for canvas
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('touchstart', (event) => {
                event.preventDefault();
                this.handleCanvasTouch(event);
            });
            
            canvas.addEventListener('touchmove', (event) => {
                event.preventDefault();
                this.handleCanvasTouch(event);
            });
            
            canvas.addEventListener('touchend', (event) => {
                event.preventDefault();
                this.resetTouchControls();
            });
        }
    }
    
    createTouchControls() {
        // Create left control zone
        const leftControl = document.createElement('div');
        leftControl.id = 'touchLeft';
        leftControl.className = 'touch-control';
        leftControl.style.cssText = `
            position: fixed;
            left: 0;
            top: 0;
            width: 50%;
            height: 100%;
            z-index: 1000;
            background: transparent;
            touch-action: none;
        `;
        
        // Create right control zone
        const rightControl = document.createElement('div');
        rightControl.id = 'touchRight';
        rightControl.className = 'touch-control';
        rightControl.style.cssText = `
            position: fixed;
            right: 0;
            top: 0;
            width: 50%;
            height: 100%;
            z-index: 1000;
            background: transparent;
            touch-action: none;
        `;
        
        // Touch events for left control
        leftControl.addEventListener('touchstart', (event) => {
            event.preventDefault();
            this.touchControls.left = true;
        });
        
        leftControl.addEventListener('touchend', (event) => {
            event.preventDefault();
            this.touchControls.left = false;
        });
        
        // Touch events for right control
        rightControl.addEventListener('touchstart', (event) => {
            event.preventDefault();
            this.touchControls.right = true;
        });
        
        rightControl.addEventListener('touchend', (event) => {
            event.preventDefault();
            this.touchControls.right = false;
        });
        
        // Add controls to body when game starts
        document.addEventListener('DOMContentLoaded', () => {
            // Controls will be added dynamically by the game
        });
    }
    
    handleCanvasTouch(event) {
        const canvas = document.getElementById('gameCanvas');
        const canvasRect = canvas.getBoundingClientRect();
        const touch = event.touches[0];
        
        if (!touch) return;
        
        const x = touch.clientX - canvasRect.left;
        const canvasWidth = canvasRect.width;
        
        // Split screen: left side = left, right side = right
        if (x < canvasWidth / 2) {
            this.touchControls.left = true;
            this.touchControls.right = false;
        } else {
            this.touchControls.right = true;
            this.touchControls.left = false;
        }
    }
    
    resetTouchControls() {
        this.touchControls.left = false;
        this.touchControls.right = false;
    }
    
    update() {
        if (!this.isEnabled) {
            this.steering = 0;
            return;
        }
        
        // Calculate steering based on input
        let steering = 0;
        
        // Keyboard input
        if (this.keys.left) steering -= 1;
        if (this.keys.right) steering += 1;
        
        // Touch input
        if (this.touchControls.left) steering -= 1;
        if (this.touchControls.right) steering += 1;
        
        // Clamp steering to -1, 0, or 1
        if (steering > 0) {
            this.steering = 1;
        } else if (steering < 0) {
            this.steering = -1;
        } else {
            this.steering = 0;
        }
        
        // Handle restart key
        if (this.keys.restart) {
            if (window.Game && window.Game.state === 'death') {
                window.Game.retry();
                this.keys.restart = false;
            }
        }
    }
    
    getSteering() {
        return this.steering;
    }
    
    getRestartPressed() {
        return this.keys.restart;
    }
    
    isLeftPressed() {
        return this.keys.left || this.touchControls.left;
    }
    
    isRightPressed() {
        return this.keys.right || this.touchControls.right;
    }
    
    isForwardPressed() {
        return this.keys.forward;
    }
    
    isBackwardPressed() {
        return this.keys.backward;
    }
    
    enableControls() {
        this.isEnabled = true;
    }
    
    disableControls() {
        this.isEnabled = false;
        this.resetAllControls();
    }
    
    resetAllControls() {
        // Reset keyboard
        Object.keys(this.keys).forEach(key => {
            this.keys[key] = false;
        });
        
        // Reset touch
        this.resetTouchControls();
        
        // Reset steering
        this.steering = 0;
    }
    
    addTouchControlsToDOM() {
        const leftControl = document.getElementById('touchLeft');
        const rightControl = document.getElementById('touchRight');
        
        if (leftControl && rightControl) {
            document.body.appendChild(leftControl);
            document.body.appendChild(rightControl);
        }
    }
    
    removeTouchControlsFromDOM() {
        const leftControl = document.getElementById('touchLeft');
        const rightControl = document.getElementById('touchRight');
        
        if (leftControl) {
            document.body.removeChild(leftControl);
        }
        
        if (rightControl) {
            document.body.removeChild(rightControl);
        }
    }
    
    showMobileControls() {
        this.addTouchControlsToDOM();
        
        // Add visual feedback for mobile
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.style.touchAction = 'none';
        }
    }
    
    hideMobileControls() {
        this.removeTouchControlsFromDOM();
        
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.style.touchAction = 'auto';
        }
    }
    
    dispose() {
        this.disableControls();
        // Remove event listeners would go here if needed
    }
}

// Create global instance
window.inputManager = new InputManager();