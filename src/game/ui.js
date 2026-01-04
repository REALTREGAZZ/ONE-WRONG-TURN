import { pickRandom } from './helpers.js';
import { DEATH_MESSAGES } from './config.js';

export class UI {
  constructor({ onRestart, onPointerSteer, onMenuClick, onModeSelect, onShopClick }) {
    this.onRestart = onRestart;
    this.onPointerSteer = onPointerSteer;
    this.onMenuClick = onMenuClick;
    this.onModeSelect = onModeSelect;
    this.onShopClick = onShopClick;

    this.menuOverlay = document.getElementById('menu-overlay');
    this.crashOverlay = document.getElementById('crash-overlay');
    this.statsOverlay = document.getElementById('stats-overlay');
    this.hudOverlay = document.getElementById('hud-overlay');
    this.modeOverlay = document.getElementById('mode-overlay');
    this.shopOverlay = document.getElementById('shop-overlay');

    this.elTouchControls = document.getElementById('touch-controls');
    this.elTouchLeft = document.getElementById('touch-left');
    this.elTouchRight = document.getElementById('touch-right');

    this.mode = 'menu';
    this.steerLeft = false;
    this.steerRight = false;
    this.restartCountdownInterval = null;

    this.setupEventListeners();
    this.bindTouchButtons();
    this.bindPointerSteer();
  }

  setupEventListeners() {
    // Poki testing: Press 'H' to toggle hard mode lock for testing
    document.addEventListener('keydown', (e) => {
      if (e.key === 'h' || e.key === 'H') {
        // Unlock hard mode for testing
        localStorage.setItem('owt_normal_completed', 'true');
        console.log('Hard Mode unlocked for testing - press H again to re-lock');
        
        // Update the hard mode unlock state globally
        if (window.hardModeUnlocked !== undefined) {
          window.hardModeUnlocked = true;
        }
      }
    });

    document.getElementById('btn-restart-now').addEventListener('click', () => {
      this.clearRestartCountdown();
      this.hideCrash();
      this.onRestart?.();
    });

    document.getElementById('btn-menu-from-crash')?.addEventListener('click', () => {
      this.clearRestartCountdown();
      this.hideCrash();
      this.onMenuClick?.();
    });

    document.getElementById('btn-back-stats')?.addEventListener('click', () => {
      this.onMenuClick?.();
    });

    document.getElementById('btn-back-shop')?.addEventListener('click', () => {
      this.onMenuClick?.();
    });

    document.getElementById('btn-back-mode')?.addEventListener('click', () => {
      this.onMenuClick?.();
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.crashOverlay.classList.contains('hidden')) {
        e.preventDefault();
        this.clearRestartCountdown();
        this.hideCrash();
        this.onRestart?.();
      }
    });
  }

  bindTouchButtons() {
    const bind = (el, side) => {
      const set = (active) => {
        if (side === 'left') this.steerLeft = active;
        if (side === 'right') this.steerRight = active;
      };

      // Touch/click handlers
      const onPressed = (e) => {
        if (this.mode !== 'playing') return;
        e.preventDefault();
        set(true);
        if (el.setPointerCapture && e.pointerId !== undefined) {
          el.setPointerCapture(e.pointerId);
        }
      };

      const onReleased = (e) => {
        if (this.mode !== 'playing') return;
        e.preventDefault();
        set(false);
      };

      // Mouse events (desktop click)
      el.addEventListener('mousedown', onPressed);
      el.addEventListener('mouseup', onReleased);
      el.addEventListener('mouseleave', onReleased);

      // Touch events (mobile)
      el.addEventListener('touchstart', onPressed, { passive: false });
      el.addEventListener('touchend', onReleased, { passive: false });
      el.addEventListener('touchcancel', onReleased, { passive: false });

      // Pointer events (modern browsers)
      el.addEventListener('pointerdown', onPressed);
      el.addEventListener('pointerup', onReleased);
      el.addEventListener('pointercancel', onReleased);
      el.addEventListener('lostpointercapture', onReleased);
    };

    bind(this.elTouchLeft, 'left');
    bind(this.elTouchRight, 'right');
  }

  bindPointerSteer() {
    const app = document.getElementById('app');
    if (!app) return;

    const isInteractive = (target) => {
      if (!(target instanceof Element)) return false;
      return !!target.closest('button');
    };

    const handle = (e) => {
      if (this.mode !== 'playing') return;
      if (isInteractive(e.target)) return;

      const x = e.clientX;
      const steer = x < window.innerWidth * 0.5 ? -1 : 1;
      this.onPointerSteer?.(steer);
    };

    app.addEventListener('pointerdown', handle);
  }

  getSteerInput() {
    return {
      left: this.steerLeft,
      right: this.steerRight,
    };
  }

  showMenu() {
    this.mode = 'menu';
    this.menuOverlay.classList.remove('hidden');
    this.hudOverlay.classList.add('hidden');
    this.crashOverlay.classList.add('hidden');
    this.statsOverlay.classList.add('hidden');
    this.modeOverlay.classList.add('hidden');
    this.shopOverlay.classList.add('hidden');
  }

  hideMenu() {
    this.menuOverlay.classList.add('hidden');
    this.hudOverlay.classList.remove('hidden');
  }

  showCrash(distance, speed, lastRun) {
    this.mode = 'crashed';

    const message = pickRandom(DEATH_MESSAGES);
    document.getElementById('crash-msg').textContent = message;
    document.getElementById('crash-distance').textContent = Math.floor(distance) + 'M';
    document.getElementById('crash-speed').textContent = Math.floor(speed);

    this.crashOverlay.classList.remove('hidden');

    this.restartCountdown(3);
  }

  hideCrash() {
    this.clearRestartCountdown();
    this.crashOverlay.classList.add('hidden');
    this.mode = 'playing';
  }

  clearRestartCountdown() {
    if (this.restartCountdownInterval) {
      clearInterval(this.restartCountdownInterval);
      this.restartCountdownInterval = null;
    }
  }

  restartCountdown(seconds) {
    this.clearRestartCountdown();
    
    let count = seconds;
    const timer = document.getElementById('restart-timer');
    timer.textContent = count;

    this.restartCountdownInterval = setInterval(() => {
      count--;
      timer.textContent = count;

      if (count <= 0) {
        this.clearRestartCountdown();
        this.hideCrash();
        this.onRestart?.();
      }
    }, 1000);
  }

  updateStats(distance, speed, highscore, lastRun, gameMode) {
    document.getElementById('stat-distance').textContent = Math.floor(distance) + 'M';
    document.getElementById('stat-speed').textContent = Math.floor(speed);
    document.getElementById('stat-highscore').textContent = Math.floor(highscore) + 'M';
    document.getElementById('stat-lastrun').textContent = Math.floor(lastRun) + 'M';
    
    if (gameMode) {
      const modeText = gameMode === 'hard' ? 'HARD' : 'NORMAL';
      document.getElementById('stat-mode').textContent = modeText;
    }
  }

  setHintVisible(visible) {
    const hint = document.getElementById('hint');
    hint.style.opacity = visible ? '1' : '0';
  }

  showStats() {
    this.mode = 'stats';
    this.statsOverlay.classList.remove('hidden');
    this.menuOverlay.classList.add('hidden');
  }

  hideStats() {
    this.statsOverlay.classList.add('hidden');
  }

  showModeSelect() {
    this.mode = 'mode-select';
    this.modeOverlay.classList.remove('hidden');
    this.menuOverlay.classList.add('hidden');
  }

  hideModeSelect() {
    this.modeOverlay.classList.add('hidden');
  }

  showShop() {
    this.mode = 'shop';
    this.shopOverlay.classList.remove('hidden');
    this.menuOverlay.classList.add('hidden');
  }

  hideShop() {
    this.shopOverlay.classList.add('hidden');
  }

  renderShopItems(skins, ownedSkins, selectedSkin, totalCoins, onPurchase, onSelect) {
    const container = document.getElementById('shop-items');
    if (!container) return;

    // Update coin display
    const coinsEl = document.getElementById('shop-coins');
    if (coinsEl) coinsEl.textContent = totalCoins;

    container.innerHTML = '';

    skins.forEach(skin => {
      const isOwned = ownedSkins.has(skin.id);
      const isSelected = selectedSkin === skin.id;
      const canAfford = totalCoins >= skin.price;

      const card = document.createElement('div');
      card.className = `shop-card ${isSelected ? 'selected' : ''}`;
      if (isOwned) card.classList.add('owned');
      if (skin.id === 'diamond') card.classList.add('brilliant-diamond');

      const colorHex = '#' + skin.color.toString(16).padStart(6, '0');

      card.innerHTML = `
        <div class="shop-card-preview">
          <div class="shop-car-preview" style="background-color: ${colorHex}; box-shadow: 0 0 20px ${colorHex};"></div>
        </div>
        <div class="shop-card-info">
          <div class="shop-card-name">${skin.name}</div>
          <div class="shop-card-desc">${skin.description}</div>
          <div class="shop-card-price">
            ${isOwned ? 'OWNED' : skin.price + ' COINS'}
          </div>
        </div>
        <button class="shop-card-btn ${isOwned ? 'btn-owned' : 'btn-buy'}" ${!isOwned && !canAfford ? 'disabled' : ''}>
          ${isOwned ? (isSelected ? 'SELECTED' : 'SELECT') : 'BUY'}
        </button>
      `;

      const btn = card.querySelector('.shop-card-btn');
      btn.addEventListener('click', () => {
        if (isOwned) {
          onSelect(skin.id);
        } else if (canAfford) {
          onPurchase(skin.id);
        }
      });

      container.appendChild(card);
    });
  }
}
