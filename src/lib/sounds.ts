/**
 * Feedback sonoro sintetizado com Web Audio API.
 *
 * Não usa arquivos externos — os sons são gerados em tempo real,
 * garantindo playback instantâneo e funcionamento offline.
 *
 * Sons curtos (< 1 segundo) e não punitivos:
 * - Acerto: duas notas ascendentes (C5 → E5), alegre
 * - Erro: "boop" suave descendente, neutro
 */

let audioCtx: AudioContext | null = null;

/**
 * Retorna o AudioContext singleton (lazy init).
 * Resume automaticamente se estiver suspenso (política de autoplay).
 */
function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Som de acerto — duas notas ascendentes (C5 → E5).
 * Alegre e positivo. ~0,5 s.
 */
export function playCorrectSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Nota 1: C5 (523 Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.value = 523.25;
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.3);

  // Nota 2: E5 (659 Hz) — começa antes da nota 1 terminar
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.value = 659.26;
  gain2.gain.setValueAtTime(0, now + 0.12);
  gain2.gain.linearRampToValueAtTime(0.3, now + 0.14);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.12);
  osc2.stop(now + 0.55);
}

/**
 * Som de erro — "boop" suave descendente.
 * Neutro e gentil, não punitivo. ~0,35 s.
 */
export function playWrongSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.linearRampToValueAtTime(200, now + 0.3);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.4);
}
