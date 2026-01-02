export class AudioManager {
  private audioContext: AudioContext | null = null;
  private engineOscillator: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private initialized = false;

  constructor() {
    try {
      this.initAudio();
      console.log('[ONE WRONG TURN] Audio initialized');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error initializing audio:', error);
    }
  }

  private initAudio(): void {
    if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
      console.warn('[ONE WRONG TURN] Web Audio API not supported');
      return;
    }

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.3;
      this.initialized = true;
    } catch (error) {
      console.error('[ONE WRONG TURN] Error creating AudioContext:', error);
      this.initialized = false;
    }
  }

  private isEnabled(): boolean {
    try {
      return localStorage.getItem('audioEnabled') !== 'false';
    } catch (error) {
      console.error('[ONE WRONG TURN] Error reading audio setting:', error);
      return true;
    }
  }

  private resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch((error) => {
        console.error('[ONE WRONG TURN] Error resuming AudioContext:', error);
      });
    }
  }

  public playEngine(): void {
    if (!this.initialized || !this.audioContext || !this.isEnabled()) return;

    try {
      this.resumeAudioContext();
      this.stopEngine();

      this.engineOscillator = this.audioContext.createOscillator();
      this.engineGain = this.audioContext.createGain();

      this.engineOscillator.type = 'sawtooth';
      this.engineOscillator.frequency.value = 80;

      this.engineGain.gain.value = 0.15;

      this.engineOscillator.connect(this.engineGain);
      this.engineGain.connect(this.masterGain!);

      this.engineOscillator.start();
    } catch (error) {
      console.error('[ONE WRONG TURN] Error playing engine sound:', error);
    }
  }

  public stopEngine(): void {
    try {
      if (this.engineOscillator) {
        try {
          this.engineOscillator.stop();
        } catch (e) {
          // Oscillator may already be stopped
        }
        this.engineOscillator.disconnect();
        this.engineOscillator = null;
      }

      if (this.engineGain) {
        this.engineGain.disconnect();
        this.engineGain = null;
      }
    } catch (error) {
      console.error('[ONE WRONG TURN] Error stopping engine sound:', error);
    }
  }

  public playCrash(): void {
    if (!this.initialized || !this.audioContext || !this.isEnabled()) return;

    try {
      this.resumeAudioContext();

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
    } catch (error) {
      console.error('[ONE WRONG TURN] Error playing crash sound:', error);
    }
  }

  public playClick(): void {
    if (!this.initialized || !this.audioContext || !this.isEnabled()) return;

    try {
      this.resumeAudioContext();

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
    } catch (error) {
      console.error('[ONE WRONG TURN] Error playing click sound:', error);
    }
  }

  public dispose(): void {
    try {
      this.stopEngine();
      if (this.masterGain) {
        this.masterGain.disconnect();
        this.masterGain = null;
      }
      if (this.audioContext) {
        this.audioContext.close().catch((error) => {
          console.error('[ONE WRONG TURN] Error closing AudioContext:', error);
        });
        this.audioContext = null;
      }
      this.initialized = false;
      console.log('[ONE WRONG TURN] Audio disposed');
    } catch (error) {
      console.error('[ONE WRONG TURN] Error during audio disposal:', error);
    }
  }
}
