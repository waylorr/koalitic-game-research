/**
 * Menu sounds synthesised with Web Audio, so there are no audio files yet.
 * Browsers only allow sound after the first click or key press.
 */
let context: AudioContext | null = null;
let enabled = readPreference();

function readPreference(): boolean {
  try {
    return localStorage.getItem('koalitic.sfx') !== 'off';
  } catch {
    return true;
  }
}

function audio(): AudioContext | null {
  if (!enabled || typeof window === 'undefined') return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === 'suspended') void context.resume().catch(() => undefined);
  return context.state === 'running' ? context : null;
}

function tone(ctx: AudioContext, from: number, to: number, seconds: number, gain: number, type: OscillatorType, delay = 0) {
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + seconds);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(amp).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

function hiss(ctx: AudioContext, seconds: number, gain: number, fromHz: number, toHz: number, delay = 0) {
  const start = ctx.currentTime + delay;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.4;
  filter.frequency.setValueAtTime(fromHz, start);
  filter.frequency.exponentialRampToValueAtTime(toHz, start + seconds);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + seconds * 0.3);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  source.connect(filter).connect(amp).connect(ctx.destination);
  source.start(start);
}

export const sfx = {
  unlock() {
    audio();
  },
  isEnabled: () => enabled,
  setEnabled(value: boolean) {
    enabled = value;
    try {
      localStorage.setItem('koalitic.sfx', value ? 'on' : 'off');
    } catch {
      /* preference only */
    }
  },
  select() {
    const ctx = audio();
    if (!ctx) return;
    tone(ctx, 2400, 1700, 0.05, 0.03, 'square');
    tone(ctx, 5200, 5000, 0.03, 0.008, 'sine', 0.01);
  },
  confirm() {
    const ctx = audio();
    if (!ctx) return;
    tone(ctx, 520, 1040, 0.12, 0.05, 'triangle');
    tone(ctx, 1320, 1760, 0.16, 0.035, 'sine', 0.07);
    hiss(ctx, 0.35, 0.05, 900, 5200);
  },
  back() {
    const ctx = audio();
    if (!ctx) return;
    tone(ctx, 1100, 480, 0.14, 0.045, 'triangle');
  },
  boot() {
    const ctx = audio();
    if (!ctx) return;
    tone(ctx, 70, 220, 1.1, 0.07, 'sawtooth');
    hiss(ctx, 1.2, 0.04, 300, 3000, 0.1);
    tone(ctx, 1760, 2640, 0.2, 0.025, 'sine', 0.95);
  },
  shutdown() {
    const ctx = audio();
    if (!ctx) return;
    tone(ctx, 420, 55, 0.9, 0.06, 'sawtooth');
    hiss(ctx, 0.7, 0.03, 2400, 200);
  },
};
