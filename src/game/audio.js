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
    if (!this.ctx || !this.master) return;

    const now = this.ctx.currentTime;
    const out = this.ctx.createGain();
    out.gain.value = 1;
    out.connect(this.master);

    const boomOsc = this.ctx.createOscillator();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(70, now);
    boomOsc.frequency.exponentialRampToValueAtTime(20, now + 0.3);

    const boomGain = this.ctx.createGain();
    boomGain.gain.setValueAtTime(0.0001, now);
    boomGain.gain.exponentialRampToValueAtTime(0.8, now + 0.05);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    boomOsc.connect(boomGain);
    boomGain.connect(out);
    boomOsc.start(now);
    boomOsc.stop(now + 0.31);

    const ringOsc = this.ctx.createOscillator();
    ringOsc.type = 'triangle';
    ringOsc.frequency.setValueAtTime(220, now);
    ringOsc.frequency.exponentialRampToValueAtTime(110, now + 0.25);

    const ringGain = this.ctx.createGain();
    ringGain.gain.setValueAtTime(0.0001, now);
    ringGain.gain.exponentialRampToValueAtTime(0.32, now + 0.02);
    ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    const ringFilter = this.ctx.createBiquadFilter();
    ringFilter.type = 'bandpass';
    ringFilter.frequency.setValueAtTime(750, now);
    ringFilter.Q.setValueAtTime(10, now);

    ringOsc.connect(ringGain);
    ringGain.connect(ringFilter);
    ringFilter.connect(out);
    ringOsc.start(now);
    ringOsc.stop(now + 0.26);

    const dingStart = now + 0.03;
    const dingOsc = this.ctx.createOscillator();
    dingOsc.type = 'sine';
    dingOsc.frequency.setValueAtTime(200, dingStart);
    dingOsc.frequency.exponentialRampToValueAtTime(120, dingStart + 0.18);

    const dingGain = this.ctx.createGain();
    dingGain.gain.setValueAtTime(0.0001, dingStart);
    dingGain.gain.exponentialRampToValueAtTime(0.42, dingStart + 0.02);
    dingGain.gain.exponentialRampToValueAtTime(0.0001, dingStart + 0.18);

    dingOsc.connect(dingGain);
    dingGain.connect(out);
    dingOsc.start(dingStart);
    dingOsc.stop(dingStart + 0.19);

    const overtoneOsc = this.ctx.createOscillator();
    overtoneOsc.type = 'sine';
    overtoneOsc.frequency.setValueAtTime(400, dingStart);
    overtoneOsc.frequency.exponentialRampToValueAtTime(240, dingStart + 0.16);

    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.0001, dingStart);
    overtoneGain.gain.exponentialRampToValueAtTime(0.18, dingStart + 0.02);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, dingStart + 0.16);

    overtoneOsc.connect(overtoneGain);
    overtoneGain.connect(out);
    overtoneOsc.start(dingStart);
    overtoneOsc.stop(dingStart + 0.17);
  }

  playClick() {
    this._beep({ freq: 540, duration: 0.04, type: 'square', gain: 0.55 });
  }

  playGraze() {
    this._beep({ freq: 280, duration: 0.03, type: 'square', gain: 0.35 });
  }
}
