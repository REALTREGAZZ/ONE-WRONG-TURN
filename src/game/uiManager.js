// UI Manager
export class UIManager {
    constructor() {
        this.activeScreen = 'mainMenu';
        this.crashEffect = null;
        this.createCrashEffect();
    }
    
    createCrashEffect() {
        this.crashEffect = document.createElement('div');
        this.crashEffect.className = 'crash-effect';
        document.body.appendChild(this.crashEffect);
    }
    
    showScreen(screenId) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.activeScreen = screenId;
        }
    }
    
    updateHUD(data) {
        if (this.activeScreen === 'gameScreen') {
            if (data.distance !== undefined) {
                document.getElementById('distanceDisplay').textContent = Math.floor(data.distance);
            }
            if (data.coins !== undefined) {
                document.getElementById('coinsDisplay').textContent = Math.floor(data.coins);
            }
            if (data.speed !== undefined) {
                document.getElementById('speedDisplay').textContent = data.speed;
            }
        }
    }
    
    showDeathScreen(distance, coinsEarned) {
        this.showScreen('deathScreen');
        
        // Show random humilliating message
        const messages = ['YOU TURNED TOO LATE', 'TOO GREEDY', 'YOU HESITATED', 'ALMOST'];
        document.getElementById('deathMessage').textContent = messages[Math.floor(Math.random() * messages.length)];
        
        // Update stats
        document.getElementById('finalDistance').textContent = Math.floor(distance);
        document.getElementById('coinsEarned').textContent = Math.floor(coinsEarned);
        
        // Show crash visual effect
        this.showCrashEffect();
        
        // Auto restart after 0.3 seconds
        setTimeout(() => {
            this.showScreen('mainMenu');
        }, 300);
    }
    
    showCrashEffect() {
        if (this.crashEffect) {
            this.crashEffect.classList.add('visible');
            setTimeout(() => {
                this.crashEffect.classList.remove('visible');
            }, 500);
        }
    }
    
    updateShopDisplay(coins, skins, equippedSkin) {
        if (this.activeScreen === 'shopScreen') {
            document.getElementById('shopCoins').textContent = Math.floor(coins);
            
            const skinsList = document.getElementById('skinsList');
            if (skinsList) {
                skinsList.innerHTML = '';
                
                Object.entries(skins).forEach(([skinId, skin]) => {
                    const skinElement = this.createSkinElement(skinId, skin, equippedSkin, coins);
                    skinsList.appendChild(skinElement);
                });
            }
        }
    }
    
    createSkinElement(skinId, skin, equippedSkin, coins) {
        const skinElement = document.createElement('div');
        skinElement.className = 'skin-item';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'skin-color';
        colorBox.style.backgroundColor = skin.color;
        
        const skinInfo = document.createElement('div');
        skinInfo.className = 'skin-info';
        
        const skinName = document.createElement('h3');
        skinName.textContent = skin.name;
        
        const skinPrice = document.createElement('p');
        skinPrice.textContent = `${skin.price} COINS`;
        
        const skinButton = document.createElement('button');
        
        // Check if skin is unlocked
        const isUnlocked = window.Game && window.Game.unlockedSkins.includes(skinId);
        
        if (isUnlocked) {
            if (equippedSkin === skinId) {
                skinButton.textContent = 'EQUIPPED';
                skinButton.disabled = true;
            } else {
                skinButton.textContent = 'EQUIP';
                skinButton.onclick = () => {
                    if (window.Game) {
                        window.Game.equipSkin(skinId);
                    }
                };
            }
        } else {
            skinButton.textContent = 'BUY';
            skinButton.onclick = () => {
                if (window.Game) {
                    window.Game.buySkin(skinId);
                }
            };
            
            if (coins < skin.price) {
                skinButton.disabled = true;
            }
        }
        
        skinInfo.appendChild(skinName);
        skinInfo.appendChild(skinPrice);
        skinInfo.appendChild(skinButton);
        
        skinElement.appendChild(colorBox);
        skinElement.appendChild(skinInfo);
        
        return skinElement;
    }
    
    updateSettingsDisplay(audioEnabled, volume) {
        if (this.activeScreen === 'settingsScreen') {
            const audioToggle = document.getElementById('audioToggle');
            const volumeSlider = document.getElementById('volumeSlider');
            const volumeValue = document.getElementById('volumeValue');
            
            if (audioToggle) {
                audioToggle.textContent = audioEnabled ? 'ON' : 'OFF';
            }
            
            if (volumeSlider && volumeValue) {
                const sliderValue = Math.floor(volume * 100);
                volumeSlider.value = sliderValue;
                volumeValue.textContent = sliderValue;
            }
        }
    }
    
    showMainMenu() {
        this.showScreen('mainMenu');
    }
    
    showShop() {
        this.showScreen('shopScreen');
    }
    
    showSettings() {
        this.showScreen('settingsScreen');
    }
    
    showCredits() {
        this.showScreen('creditsScreen');
    }
    
    showGameScreen() {
        this.showScreen('gameScreen');
    }
    
    isGameScreen() {
        return this.activeScreen === 'gameScreen';
    }
    
    isMenuScreen() {
        return ['mainMenu', 'shopScreen', 'settingsScreen', 'creditsScreen'].includes(this.activeScreen);
    }
}

// Create global instance
window.uiManager = new UIManager();