/**
 * Self-contained audio + confetti feedback effects (no external dependencies).
 * Sounds use the Web Audio API (synthesized, no asset files).
 * Confetti uses a transient full-screen canvas that cleans itself up.
 */

const MUTE_KEY = 'colegium_sound_muted';
let muted = typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === 'true';

export const isSoundMuted = (): boolean => muted;
export const setSoundMuted = (m: boolean): void => {
    muted = m;
    try { localStorage.setItem(MUTE_KEY, String(m)); } catch { /* ignore */ }
};

let audioCtx: AudioContext | null = null;
const getCtx = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    } catch {
        return null;
    }
};

const tone = (ctx: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = 'sine', peak = 0.18) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur + 0.02);
};

export type SoundKind = 'correct' | 'wrong' | 'levelup' | 'win' | 'click';

export const playSound = (kind: SoundKind): void => {
    if (muted) return;
    const ctx = getCtx();
    if (!ctx) return;
    switch (kind) {
        case 'correct':
            tone(ctx, 660, 0, 0.12, 'sine');
            tone(ctx, 880, 0.08, 0.16, 'sine');
            break;
        case 'wrong':
            tone(ctx, 220, 0, 0.18, 'sawtooth', 0.12);
            tone(ctx, 160, 0.1, 0.22, 'sawtooth', 0.1);
            break;
        case 'levelup':
            [523, 659, 784, 1047].forEach((f, i) => tone(ctx, f, i * 0.1, 0.2, 'triangle', 0.16));
            break;
        case 'win':
            [659, 784, 988, 1319].forEach((f, i) => tone(ctx, f, i * 0.12, 0.25, 'triangle', 0.18));
            break;
        case 'click':
            tone(ctx, 440, 0, 0.05, 'square', 0.06);
            break;
    }
};

/** Fires a confetti burst that cleans up after itself. */
export const fireConfetti = (durationMs = 2200): void => {
    if (typeof document === 'undefined') return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) { canvas.remove(); return; }

    const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#38bdf8'];
    const count = 140;
    type P = { x: number; y: number; vx: number; vy: number; size: number; color: string; rot: number; vrot: number; shape: number };
    const particles: P[] = Array.from({ length: count }, () => ({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 3,
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -14 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.3,
        shape: Math.floor(Math.random() * 2),
    }));

    const gravity = 0.35;
    const start = performance.now();

    const frame = (now: number) => {
        const elapsed = now - start;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const p of particles) {
            p.vy += gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.99;
            p.rot += p.vrot;
            const fade = Math.max(0, 1 - elapsed / durationMs);
            ctx.save();
            ctx.globalAlpha = fade;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            if (p.shape === 0) ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
            ctx.restore();
        }
        if (elapsed < durationMs) {
            requestAnimationFrame(frame);
        } else {
            canvas.remove();
        }
    };
    requestAnimationFrame(frame);
};
