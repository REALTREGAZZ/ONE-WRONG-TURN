import { pickRandom } from './helpers.js';
import { DEATH_MESSAGES } from './config.js';

export class UI {
  constructor({ onRestart, onPointerSteer, onMenuClick, onModeSelect }) {
    this.onRestart = onRestart;
    this.onPointerSteer = onPointerSteer;
    this.onMenuClick = onMenuClick;
    this.onModeSelect = onModeSelect;

    this.menuOverlay = document.getElementById('menu-overlay');
    this.crashOverlay = document.getElementById('crash-overlay');
    this.statsOverlay = document.getElementById('stats-overlay');
    this.hudOverlay = document.getElementById('hud-overlay');
    this.modeOverlay = document.getElementById('mode-overlay');

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

      el.addEventListener('pointerdown', (e) => {
        if (this.mode !== 'playing') return;
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        set(true);
      });

      const clear = () => set(false);
      el.addEventListener('pointerup', clear);
      el.addEventListener('pointercancel', clear);
      el.addEventListener('lostpointercapture', clear);
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
}
