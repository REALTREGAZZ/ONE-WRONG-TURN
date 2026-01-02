import { GameEngine } from '../game/GameEngine';
import { SKINS, SkinId } from '../game/Car';

const DEATH_MESSAGES = [
  'YOU TURNED TOO LATE.',
  'TOO GREEDY.',
  'YOU HESITATED.',
  'ALMOST.',
  'NOT FAST ENOUGH.',
  'PRECISION FAILED.',
];

export class UIManager {
  private gameEngine: GameEngine;

  private homeScreen: HTMLElement;
  private deathScreen: HTMLElement;
  private statsScreen: HTMLElement;
  private shopScreen: HTMLElement;
  private settingsScreen: HTMLElement;
  private gameHud: HTMLElement;

  private bestTimePreview: HTMLElement;
  private deathMessage: HTMLElement;
  private runTime: HTMLElement;
  private coinsEarned: HTMLElement;

  private hudTime: HTMLElement;
  private hudCoins: HTMLElement;

  private statBestTime: HTMLElement;
  private statCrashes: HTMLElement;
  private statAttempts: HTMLElement;
  private statCoins: HTMLElement;

  private shopCoinBalance: HTMLElement;
  private shopGrid: HTMLElement;

  private audioStatus: HTMLElement;
  private audioToggle: HTMLElement;

  constructor(gameEngine: GameEngine) {
    try {
      this.gameEngine = gameEngine;

      this.homeScreen = this.getElementById('home-screen');
      this.deathScreen = this.getElementById('death-screen');
      this.statsScreen = this.getElementById('stats-screen');
      this.shopScreen = this.getElementById('shop-screen');
      this.settingsScreen = this.getElementById('settings-screen');
      this.gameHud = this.getElementById('game-hud');

      this.bestTimePreview = this.getElementById('best-time-preview');
      this.deathMessage = this.getElementById('death-message');
      this.runTime = this.getElementById('run-time');
      this.coinsEarned = this.getElementById('coins-earned');

      this.hudTime = this.getElementById('hud-time');
      this.hudCoins = this.getElementById('hud-coins');

      this.statBestTime = this.getElementById('stat-best-time');
      this.statCrashes = this.getElementById('stat-crashes');
      this.statAttempts = this.getElementById('stat-attempts');
      this.statCoins = this.getElementById('stat-coins');

      this.shopCoinBalance = this.getElementById('shop-coin-balance');
      this.shopGrid = this.getElementById('shop-grid');

      this.audioStatus = this.getElementById('audio-status');
      this.audioToggle = this.getElementById('audio-toggle');

      this.setupEventListeners();
      this.updateBestTimePreview();
      this.updateStats();
      this.updateShop();
      this.updateAudioStatus();

      console.log('[ONE WRONG TURN] UIManager initialized');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error initializing UIManager:', error);
      throw error;
    }
  }

  private getElementById(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Required DOM element not found: ${id}`);
    }
    return element;
  }

  private safeLocalStorageGet(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[ONE WRONG TURN] Error reading localStorage:', error);
      return null;
    }
  }

  private safeLocalStorageSet(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[ONE WRONG TURN] Error writing to localStorage:', error);
    }
  }

  private safeLocalStorageParse<T>(key: string, defaultValue: T): T {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      return JSON.parse(value);
    } catch (error) {
      console.error('[ONE WRONG TURN] Error parsing localStorage:', error);
      return defaultValue;
    }
  }

  private setupEventListeners(): void {
    try {
      const btnStats = document.getElementById('btn-stats');
      const btnShop = document.getElementById('btn-shop');
      const btnSettings = document.getElementById('btn-settings');
      const btnBackStats = document.getElementById('btn-back-stats');
      const btnBackShop = document.getElementById('btn-back-shop');
      const btnBackSettings = document.getElementById('btn-back-settings');

      if (btnStats) {
        btnStats.addEventListener('click', () => {
          this.playClickSound();
          this.showStats();
        });
      }

      if (btnShop) {
        btnShop.addEventListener('click', () => {
          this.playClickSound();
          this.showShop();
        });
      }

      if (btnSettings) {
        btnSettings.addEventListener('click', () => {
          this.playClickSound();
          this.showSettings();
        });
      }

      if (btnBackStats) {
        btnBackStats.addEventListener('click', () => {
          this.playClickSound();
          this.gameEngine.returnHome();
        });
      }

      if (btnBackShop) {
        btnBackShop.addEventListener('click', () => {
          this.playClickSound();
          this.gameEngine.returnHome();
        });
      }

      if (btnBackSettings) {
        btnBackSettings.addEventListener('click', () => {
          this.playClickSound();
          this.gameEngine.returnHome();
        });
      }

      this.audioToggle.addEventListener('click', () => {
        this.playClickSound();
        const currentStatus = this.safeLocalStorageGet('audioEnabled') !== 'false';
        this.safeLocalStorageSet('audioEnabled', (!currentStatus).toString());
        this.updateAudioStatus();
      });

      console.log('[ONE WRONG TURN] Event listeners setup complete');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error setting up event listeners:', error);
    }
  }

  private playClickSound(): void {
    this.gameEngine.getAudioManager()?.playClick();
  }

  public showHome(): void {
    this.hideAllScreens();
    this.homeScreen.classList.add('active');
    this.updateBestTimePreview();
    this.gameEngine.setState('home');
  }

  public showGame(): void {
    this.hideAllScreens();
    this.gameHud.classList.add('active');
  }

  public showDeath(time: number, coins: number): void {
    this.hideAllScreens();
    this.deathScreen.classList.add('active');

    const randomMessage = DEATH_MESSAGES[Math.floor(Math.random() * DEATH_MESSAGES.length)];
    this.deathMessage.textContent = randomMessage;
    this.runTime.textContent = time.toFixed(2);
    this.coinsEarned.textContent = coins.toString();
  }

  public showStats(): void {
    this.hideAllScreens();
    this.statsScreen.classList.add('active');
    this.updateStats();
    this.gameEngine.setState('stats');
  }

  public showShop(): void {
    this.hideAllScreens();
    this.shopScreen.classList.add('active');
    this.updateShop();
    this.gameEngine.setState('shop');
  }

  public showSettings(): void {
    this.hideAllScreens();
    this.settingsScreen.classList.add('active');
    this.gameEngine.setState('settings');
  }

  private hideAllScreens(): void {
    this.homeScreen.classList.remove('active');
    this.deathScreen.classList.remove('active');
    this.statsScreen.classList.remove('active');
    this.shopScreen.classList.remove('active');
    this.settingsScreen.classList.remove('active');
    this.gameHud.classList.remove('active');
  }

  public updateHUD(time: number, coins: number): void {
    this.hudTime.textContent = time.toFixed(1);
    this.hudCoins.textContent = coins.toString();
  }

  private updateBestTimePreview(): void {
    try {
      const bestTime = parseFloat(this.safeLocalStorageGet('bestTime') || '0');
      if (bestTime > 0) {
        this.bestTimePreview.textContent = `Best: ${bestTime.toFixed(2)}s`;
      } else {
        this.bestTimePreview.textContent = '';
      }
    } catch (error) {
      console.error('[ONE WRONG TURN] Error updating best time preview:', error);
    }
  }

  private updateStats(): void {
    try {
      const bestTime = parseFloat(this.safeLocalStorageGet('bestTime') || '0');
      const crashes = parseInt(this.safeLocalStorageGet('totalCrashes') || '0');
      const attempts = parseInt(this.safeLocalStorageGet('totalAttempts') || '0');
      const coins = parseInt(this.safeLocalStorageGet('totalCoins') || '0');

      this.statBestTime.textContent = bestTime > 0 ? `${bestTime.toFixed(2)}s` : '0s';
      this.statCrashes.textContent = crashes.toString();
      this.statAttempts.textContent = attempts.toString();
      this.statCoins.textContent = coins.toString();
    } catch (error) {
      console.error('[ONE WRONG TURN] Error updating stats:', error);
    }
  }

  private updateShop(): void {
    try {
      const totalCoins = parseInt(this.safeLocalStorageGet('totalCoins') || '0');
      this.shopCoinBalance.textContent = totalCoins.toString();

      const ownedSkins = this.safeLocalStorageParse<string[]>('ownedSkins', ['default']);
      const selectedSkin = this.safeLocalStorageGet('selectedSkin') || 'default';

      this.shopGrid.innerHTML = '';

      Object.keys(SKINS).forEach((skinId) => {
        const isOwned = ownedSkins.includes(skinId);
        const isSelected = skinId === selectedSkin;

        const shopItem = document.createElement('div');
        shopItem.className = 'shop-item';
        if (isSelected) shopItem.classList.add('selected');

        const colorPreview = document.createElement('div');
        colorPreview.className = 'color-preview';
        colorPreview.style.backgroundColor = `#${SKINS[skinId as SkinId].toString(16).padStart(6, '0')}`;

        const skinName = document.createElement('div');
        skinName.textContent = skinId.toUpperCase();
        skinName.style.marginBottom = '0.5rem';

        const button = document.createElement('button');

        if (isSelected) {
          button.textContent = 'SELECTED';
          button.disabled = true;
        } else if (isOwned) {
          button.textContent = 'SELECT';
          button.addEventListener('click', () => {
            this.playClickSound();
            this.safeLocalStorageSet('selectedSkin', skinId);
            this.gameEngine.updateCarSkin(skinId);
            this.updateShop();
          });
        } else {
          button.textContent = 'BUY (1000)';
          if (totalCoins < 1000) {
            button.disabled = true;
          } else {
            button.addEventListener('click', () => {
              this.playClickSound();
              const newTotal = totalCoins - 1000;
              this.safeLocalStorageSet('totalCoins', newTotal.toString());
              const newOwnedSkins = [...ownedSkins, skinId];
              this.safeLocalStorageSet('ownedSkins', JSON.stringify(newOwnedSkins));
              this.safeLocalStorageSet('selectedSkin', skinId);
              this.gameEngine.updateCarSkin(skinId);
              this.updateShop();
            });
          }
        }

        shopItem.appendChild(colorPreview);
        shopItem.appendChild(skinName);
        shopItem.appendChild(button);
        this.shopGrid.appendChild(shopItem);
      });
    } catch (error) {
      console.error('[ONE WRONG TURN] Error updating shop:', error);
    }
  }

  private updateAudioStatus(): void {
    try {
      const enabled = this.safeLocalStorageGet('audioEnabled') !== 'false';
      this.audioStatus.textContent = enabled ? 'ON' : 'OFF';
    } catch (error) {
      console.error('[ONE WRONG TURN] Error updating audio status:', error);
    }
  }
}
