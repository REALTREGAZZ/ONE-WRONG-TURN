export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.musicPlaying = false;
    this.musicTimer = null;
    this.noiseBuffer = null;

    this._ensureFromGesture = this._ensureFromGesture.bind(this);
    window.addEventListener('pointerdown', this._ensureFromGesture, { once: true });
    window.addEventListener('keydown', this._ensureFromGesture, { once: true });
  }

  async _ensureFromGesture() {
    if (this.ctx) return;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;

    this.ctx = new AudioContextCtor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.25;
    this.master.connect(this.ctx.destination);

    // Pre-create noise buffer for snare
    this.noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    try {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      if (this.enabled) this.startMusic();
    } catch {
      // ignore
    }
  }

  _beep({ freq = 440, duration = 0.08, type = 'square', gain = 0.8 } = {}) {
    if (!this.ctx || !this.master || !this.enabled) return;

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
    if (!this.ctx || !this.master || !this.enabled) return;

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

  _kick(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.master);
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  _snare(t) {
    if (!this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, t);
    
    const gain = this.ctx.createGain();
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    noise.start(t);
    noise.stop(t + 0.1);
  }

  _bass(t, freq) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    
    osc.start(t);
    osc.stop(t + 0.2);
  }

  startMusic() {
    if (!this.ctx || this.musicPlaying || !this.enabled) return;
    this.musicPlaying = true;
    
    const tempo = 115;
    const beatLen = 60 / tempo;
    let nextBeat = this.ctx.currentTime + 0.1;
    let beatCount = 0;

    const schedule = () => {
      if (!this.musicPlaying) return;
      while (nextBeat < this.ctx.currentTime + 0.2) {
        // Kick on every beat
        this._kick(nextBeat);
        
        // Snare on 2 and 4
        if (beatCount % 4 === 1 || beatCount % 4 === 3) {
          this._snare(nextBeat);
        }
        
        // Driving Bass (8th notes)
        const bassFreqs = [41.20, 41.20, 48.99, 48.99, 55.00, 55.00, 48.99, 61.74]; // E1, G1, A1, G1, B1...
        const freq = bassFreqs[Math.floor(beatCount / 2) % bassFreqs.length];
        this._bass(nextBeat, freq);
        this._bass(nextBeat + beatLen/2, freq);

        nextBeat += beatLen;
        beatCount++;
      }
      this.musicTimer = setTimeout(schedule, 100);
    };
    schedule();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  toggleAudio() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.enabled;
  }
}
