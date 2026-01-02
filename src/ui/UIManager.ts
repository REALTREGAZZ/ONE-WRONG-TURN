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
    this.gameEngine = gameEngine;

    this.homeScreen = document.getElementById('home-screen')!;
    this.deathScreen = document.getElementById('death-screen')!;
    this.statsScreen = document.getElementById('stats-screen')!;
    this.shopScreen = document.getElementById('shop-screen')!;
    this.settingsScreen = document.getElementById('settings-screen')!;
    this.gameHud = document.getElementById('game-hud')!;

    this.bestTimePreview = document.getElementById('best-time-preview')!;
    this.deathMessage = document.getElementById('death-message')!;
    this.runTime = document.getElementById('run-time')!;
    this.coinsEarned = document.getElementById('coins-earned')!;

    this.hudTime = document.getElementById('hud-time')!;
    this.hudCoins = document.getElementById('hud-coins')!;

    this.statBestTime = document.getElementById('stat-best-time')!;
    this.statCrashes = document.getElementById('stat-crashes')!;
    this.statAttempts = document.getElementById('stat-attempts')!;
    this.statCoins = document.getElementById('stat-coins')!;

    this.shopCoinBalance = document.getElementById('shop-coin-balance')!;
    this.shopGrid = document.getElementById('shop-grid')!;

    this.audioStatus = document.getElementById('audio-status')!;
    this.audioToggle = document.getElementById('audio-toggle')!;

    this.setupEventListeners();
    this.updateBestTimePreview();
    this.updateStats();
    this.updateShop();
    this.updateAudioStatus();
  }

  private setupEventListeners(): void {
    document.getElementById('btn-stats')!.addEventListener('click', () => {
      this.playClickSound();
      this.showStats();
    });

    document.getElementById('btn-shop')!.addEventListener('click', () => {
      this.playClickSound();
      this.showShop();
    });

    document.getElementById('btn-settings')!.addEventListener('click', () => {
      this.playClickSound();
      this.showSettings();
    });

    document.getElementById('btn-back-stats')!.addEventListener('click', () => {
      this.playClickSound();
      this.gameEngine.returnHome();
    });

    document.getElementById('btn-back-shop')!.addEventListener('click', () => {
      this.playClickSound();
      this.gameEngine.returnHome();
    });

    document.getElementById('btn-back-settings')!.addEventListener('click', () => {
      this.playClickSound();
      this.gameEngine.returnHome();
    });

    this.audioToggle.addEventListener('click', () => {
      this.playClickSound();
      const currentStatus = localStorage.getItem('audioEnabled') !== 'false';
      localStorage.setItem('audioEnabled', (!currentStatus).toString());
      this.updateAudioStatus();
    });
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
    const bestTime = parseFloat(localStorage.getItem('bestTime') || '0');
    if (bestTime > 0) {
      this.bestTimePreview.textContent = `Best: ${bestTime.toFixed(2)}s`;
    } else {
      this.bestTimePreview.textContent = '';
    }
  }

  private updateStats(): void {
    const bestTime = parseFloat(localStorage.getItem('bestTime') || '0');
    const crashes = parseInt(localStorage.getItem('totalCrashes') || '0');
    const attempts = parseInt(localStorage.getItem('totalAttempts') || '0');
    const coins = parseInt(localStorage.getItem('totalCoins') || '0');

    this.statBestTime.textContent = bestTime > 0 ? `${bestTime.toFixed(2)}s` : '0s';
    this.statCrashes.textContent = crashes.toString();
    this.statAttempts.textContent = attempts.toString();
    this.statCoins.textContent = coins.toString();
  }

  private updateShop(): void {
    const totalCoins = parseInt(localStorage.getItem('totalCoins') || '0');
    this.shopCoinBalance.textContent = totalCoins.toString();

    const ownedSkins = JSON.parse(localStorage.getItem('ownedSkins') || '["default"]');
    const selectedSkin = localStorage.getItem('selectedSkin') || 'default';

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
          localStorage.setItem('selectedSkin', skinId);
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
            localStorage.setItem('totalCoins', newTotal.toString());
            ownedSkins.push(skinId);
            localStorage.setItem('ownedSkins', JSON.stringify(ownedSkins));
            localStorage.setItem('selectedSkin', skinId);
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
  }

  private updateAudioStatus(): void {
    const enabled = localStorage.getItem('audioEnabled') !== 'false';
    this.audioStatus.textContent = enabled ? 'ON' : 'OFF';
  }
}
