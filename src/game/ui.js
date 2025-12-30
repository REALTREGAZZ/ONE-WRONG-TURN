import { pickRandom } from './helpers.js';
import { DEATH_MESSAGES } from './config.js';

export class UI {
  constructor({ onRestart, onPointerSteer, onRewardedAd }) {
    this.onRestart = onRestart;
    this.onPointerSteer = onPointerSteer;
    this.onRewardedAd = onRewardedAd;

    this.elDistance = document.getElementById('distance');
    this.elBest = document.getElementById('best');

    this.elCenterMessage = document.getElementById('center-message');
    this.elDeathReason = document.getElementById('death-reason');
    this.elRestart = document.getElementById('restart');
    this.elHint = document.getElementById('hint');

    this.elTouchControls = document.getElementById('touch-controls');
    this.elTouchLeft = document.getElementById('touch-left');
    this.elTouchRight = document.getElementById('touch-right');

    this.mode = 'playing';

    this.steerLeft = false;
    this.steerRight = false;

    this.lastSteerTime = 0; // Track when player last steered

    this.elRestart.addEventListener('click', () => this.onRestart?.());

    this.bindTouchButtons();
    this.bindRewardedButtons();
    this.bindPointerSteer();
  }

  bindTouchButtons() {
    const bind = (el, side) => {
      const set = (active) => {
        if (side === 'left') {
          this.steerLeft = active;
          if (active) this.updateSteerTime();
        }
        if (side === 'right') {
          this.steerRight = active;
          if (active) this.updateSteerTime();
        }
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

  bindRewardedButtons() {
    const rewardButtons = document.querySelectorAll('.rewarded-btn');
    
    rewardButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const rewardType = btn.dataset.reward;
        if (this.onRewardedAd) this.onRewardedAd(rewardType);
      });
    });
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

  setDistance(meters) {
    this.elDistance.textContent = String(Math.floor(meters));
  }

  setBest(meters) {
    this.elBest.textContent = String(Math.floor(meters));
  }

  setHintVisible(visible) {
    this.elHint.style.display = visible ? '' : 'none';
  }

  getLastSteerTime() {
    return this.lastSteerTime;
  }

  updateSteerTime() {
    this.lastSteerTime = performance.now();
  }

  showDeath(reason = pickRandom(DEATH_MESSAGES)) {
    this.mode = 'crashed';
    this.elDeathReason.textContent = reason;
    this.elCenterMessage.classList.remove('hidden');
    
    // Show rewarded ad options after death screen
    setTimeout(() => {
      const options = document.getElementById('rewarded-options');
      if (options) {
        options.classList.remove('hidden');
      }
    }, 500); // Wait 0.5s as specified in requirements
  }

  hideDeath() {
    this.elCenterMessage.classList.add('hidden');
    this.mode = 'playing';
    
    // Hide rewarded options when restarting
    const options = document.getElementById('rewarded-options');
    if (options) {
      options.classList.add('hidden');
    }
  }
}
