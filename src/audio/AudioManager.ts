export class AudioManager {
  private audioContext: AudioContext | null = null;
  private engineOscillator: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    this.initAudio();
  }

  private initAudio(): void {
    if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
      return;
    }

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 0.3;
  }

  private isEnabled(): boolean {
    return localStorage.getItem('audioEnabled') !== 'false';
  }

  public playEngine(): void {
    if (!this.audioContext || !this.isEnabled()) return;

    this.stopEngine();

    this.engineOscillator = this.audioContext.createOscillator();
    this.engineGain = this.audioContext.createGain();

    this.engineOscillator.type = 'sawtooth';
    this.engineOscillator.frequency.value = 80;

    this.engineGain.gain.value = 0.15;

    this.engineOscillator.connect(this.engineGain);
    this.engineGain.connect(this.masterGain!);

    this.engineOscillator.start();
  }

  public stopEngine(): void {
    if (this.engineOscillator) {
      this.engineOscillator.stop();
      this.engineOscillator.disconnect();
      this.engineOscillator = null;
    }

    if (this.engineGain) {
      this.engineGain.disconnect();
      this.engineGain = null;
    }
  }

  public playCrash(): void {
    if (!this.audioContext || !this.isEnabled()) return;

    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.value = 100;

    gain.gain.value = 0.3;
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    oscillator.connect(gain);
    gain.connect(this.masterGain!);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  public playClick(): void {
    if (!this.audioContext || !this.isEnabled()) return;

    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 800;

    gain.gain.value = 0.1;
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

    oscillator.connect(gain);
    gain.connect(this.masterGain!);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }
}
