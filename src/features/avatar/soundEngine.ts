// Simple, dependency-free sound engine
// Uses AudioContext or HTML5 Audio for subtle UI SFX

class SoundEngine {
    private enabled: boolean = false;
    private ctx: AudioContext | null = null;

    // OSCILLATOR BASED SOUNDS (No external assets required, keeps it lightweight)
    // This allows us to generate pleasant "blips" and "pops" programmatically.

    constructor() {
        // Initialize enabled state from local storage if window exists
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('nexus_avatar_sfx_enabled');
            this.enabled = saved === 'true';
        }
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (typeof window !== 'undefined') {
            localStorage.setItem('nexus_avatar_sfx_enabled', String(enabled));
        }
        // Init context on first enable if needed
        if (enabled && !this.ctx) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
    }

    public isEnabled() {
        return this.enabled;
    }

    private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.05) {
        if (!this.enabled || !this.ctx) return;

        try {
            // Resume context if suspended (browser autoplay policy)
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            // Envelope
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Silent fail if audio issue
            console.error(e);
        }
    }

    public playClickSoft() {
        // Very short, high pitch sine/triangle
        this.playTone(800, 'sine', 0.05, 0.02);
    }

    public playHover() {
        // Ultra subtle low frequency
        this.playTone(300, 'sine', 0.03, 0.01);
    }

    public playSuccessSoft() {
        // Major chord arpeggio-ish
        if (!this.enabled || !this.ctx) return;
        setTimeout(() => this.playTone(440, 'sine', 0.1, 0.03), 0);
        setTimeout(() => this.playTone(554, 'sine', 0.1, 0.03), 50);
        setTimeout(() => this.playTone(659, 'sine', 0.2, 0.03), 100);
    }

    public playAlertSoft() {
        // Dissonant or lower tone
        this.playTone(150, 'square', 0.15, 0.03);
    }

    public playSlide() {
        // Soft "whoosh" using a frequency sweep
        if (!this.enabled || !this.ctx) return;
        try {
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.frequency.setValueAtTime(200, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.2);

            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.02, this.ctx.currentTime + 0.1);
            gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.25);
        } catch (e) {
            console.error(e);
        }
    }

    public playError() {
        // Low "thud" or "bump"
        this.playTone(80, 'sawtooth', 0.15, 0.05);
    }
}

export const soundEngine = new SoundEngine();
