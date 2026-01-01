// Audio Manager
export class AudioManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.5;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        
        // Audio context for Web Audio API
        this.audioContext = null;
        this.musicSource = null;
        this.soundBuffers = {};
        
        this.initAudioContext();
        this.createSounds();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }
    
    createSounds() {
        if (!this.enabled) return;
        
        // Create engine sound (low rumble)
        this.createEngineSound();
        
        // Create crash sound
        this.createCrashSound();
        
        // Create UI sounds
        this.createUISounds();
    }
    
    createEngineSound() {
        if (!this.audioContext) return;
        
        // Create a low frequency engine rumble
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.1 * this.volume, this.audioContext.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Loop the engine sound
        oscillator.start();
        
        this.engineOscillator = oscillator;
        this.engineGain = gainNode;
    }
    
    createCrashSound() {
        // Crash sound using Web Audio API
        this.soundBuffers.crash = this.createNoiseBuffer();
    }
    
    createUISounds() {
        // UI click sound
        this.soundBuffers.click = this.createToneBuffer(800, 0.1);
        this.soundBuffers.purchase = this.createToneBuffer(1200, 0.3);
        this.soundBuffers.error = this.createToneBuffer(300, 0.5);
    }
    
    createNoiseBuffer() {
        if (!this.audioContext) return null;
        
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
    
    createToneBuffer(frequency, duration) {
        if (!this.audioContext) return null;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / this.audioContext.sampleRate;
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 5);
        }
        
        return buffer;
    }
    
    playSound(soundName, volume = 1.0) {
        if (!this.enabled || !this.sfxEnabled || !this.soundBuffers[soundName]) return;
        
        if (this.audioContext && this.soundBuffers[soundName]) {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = this.soundBuffers[soundName];
            gainNode.gain.setValueAtTime(volume * this.volume * 0.5, this.audioContext.currentTime);
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            source.start();
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!enabled && this.engineOscillator) {
            this.engineOscillator.disconnect();
        } else if (enabled && !this.engineOscillator) {
            this.createEngineSound();
        }
    }
    
    setVolume(volume) {
        this.volume = volume;
        
        if (this.engineGain) {
            this.engineGain.gain.setValueAtTime(0.1 * this.volume, this.audioContext.currentTime);
        }
    }
    
    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
    }
    
    setSfxEnabled(enabled) {
        this.sfxEnabled = enabled;
    }
}

// Create global instance
window.audioManager = new AudioManager();