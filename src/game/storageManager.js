// Storage Manager for localStorage
export class StorageManager {
    constructor() {
        this.storageKey = 'oneWrongTurnSave';
        this.defaultData = {
            coins: 0,
            unlockedSkins: ['red'],
            equippedSkin: 'red',
            audioEnabled: true,
            volume: 0.5,
            bestDistance: 0,
            totalGamesPlayed: 0
        };
        this.data = { ...this.defaultData };
    }
    
    loadData() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsedData = JSON.parse(saved);
                this.data = { ...this.defaultData, ...parsedData };
                
                // Update global game state
                if (window.Game) {
                    window.Game.coins = this.data.coins;
                    window.Game.unlockedSkins = this.data.unlockedSkins;
                    window.Game.equippedSkin = this.data.equippedSkin;
                    window.Game.audioEnabled = this.data.audioEnabled;
                    window.Game.volume = this.data.volume;
                }
                
                // Update audio manager
                if (window.audioManager) {
                    window.audioManager.setEnabled(this.data.audioEnabled);
                    window.audioManager.setVolume(this.data.volume);
                }
                
                console.log('Save data loaded:', this.data);
            }
        } catch (error) {
            console.error('Error loading save data:', error);
            this.data = { ...this.defaultData };
        }
    }
    
    saveData() {
        try {
            // Update data from current game state
            if (window.Game) {
                this.data.coins = window.Game.coins;
                this.data.unlockedSkins = window.Game.unlockedSkins;
                this.data.equippedSkin = window.Game.equippedSkin;
                this.data.audioEnabled = window.Game.audioEnabled;
                this.data.volume = window.Game.volume;
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            console.log('Save data saved:', this.data);
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }
    
    addCoins(amount) {
        this.data.coins += amount;
        this.saveData();
        
        if (window.Game) {
            window.Game.coins = this.data.coins;
        }
    }
    
    spendCoins(amount) {
        if (this.data.coins >= amount) {
            this.data.coins -= amount;
            this.saveData();
            
            if (window.Game) {
                window.Game.coins = this.data.coins;
            }
            return true;
        }
        return false;
    }
    
    unlockSkin(skinId) {
        if (!this.data.unlockedSkins.includes(skinId)) {
            this.data.unlockedSkins.push(skinId);
            this.saveData();
            
            if (window.Game) {
                window.Game.unlockedSkins = this.data.unlockedSkins;
            }
        }
    }
    
    equipSkin(skinId) {
        this.data.equippedSkin = skinId;
        this.saveData();
        
        if (window.Game) {
            window.Game.equippedSkin = skinId;
        }
    }
    
    updateBestDistance(distance) {
        if (distance > this.data.bestDistance) {
            this.data.bestDistance = distance;
            this.saveData();
        }
    }
    
    incrementGamesPlayed() {
        this.data.totalGamesPlayed++;
        this.saveData();
    }
    
    setAudioEnabled(enabled) {
        this.data.audioEnabled = enabled;
        this.saveData();
        
        if (window.audioManager) {
            window.audioManager.setEnabled(enabled);
        }
    }
    
    setVolume(volume) {
        this.data.volume = volume;
        this.saveData();
        
        if (window.audioManager) {
            window.audioManager.setVolume(volume);
        }
    }
    
    resetData() {
        this.data = { ...this.defaultData };
        this.saveData();
        
        // Update game state
        if (window.Game) {
            window.Game.coins = this.data.coins;
            window.Game.unlockedSkins = this.data.unlockedSkins;
            window.Game.equippedSkin = this.data.equippedSkin;
            window.Game.audioEnabled = this.data.audioEnabled;
            window.Game.volume = this.data.volume;
        }
    }
}

// Create global instance
window.storageManager = new StorageManager();