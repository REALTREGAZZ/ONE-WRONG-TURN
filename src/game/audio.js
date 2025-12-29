export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;

    this._ensureFromGesture = this._ensureFromGesture.bind(this);
    window.addEventListener('pointerdown', this._ensureFromGesture, { once: true });
    window.addEventListener('keydown', this._ensureFromGesture, { once: true });
  }

  async _ensureFromGesture() {
    if (!this.enabled || this.ctx) return;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;

    this.ctx = new AudioContextCtor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.25;
    this.master.connect(this.ctx.destination);

    try {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
    } catch {
      // ignore
    }
  }

  _beep({ freq = 440, duration = 0.08, type = 'square', gain = 0.8 } = {}) {
    if (!this.ctx || !this.master) return;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    g.gain.value = 0;
    osc.connect(g);
    g.connect(this.master);

    const now = this.ctx.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  playCrash() {
    // Harsh, instant cue.
    this._beep({ freq: 110, duration: 0.12, type: 'sawtooth', gain: 0.9 });
    this._beep({ freq: 55, duration: 0.18, type: 'square', gain: 0.65 });
  }

  playClick() {
    this._beep({ freq: 540, duration: 0.04, type: 'square', gain: 0.55 });
  }
}
