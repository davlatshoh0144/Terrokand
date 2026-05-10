let audioCtx: AudioContext | null = null;

export function playClickSfx(enabled = true) {
  if (!enabled) return;
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
    }
    const ctx = audioCtx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    o.frequency.setValueAtTime(560, now);
    g.gain.setValueAtTime(0.05, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    o.start(now);
    o.stop(now + 0.06);
  } catch {
    // no-op
  }
}
