/**
 * Configurações de voz do jogo.
 *
 * Tipos, valores padrão e persistência em localStorage.
 * Extensível para outras categorias de configuração (#14).
 */

/* ── Tipos ── */

export type VoiceSpeed = "slow" | "normal" | "fast";

export interface VoiceSettings {
  /** Narração ativada/desativada. */
  enabled: boolean;
  /** Velocidade da fala. */
  speed: VoiceSpeed;
  /** Volume da voz (0 a 1). */
  volume: number;
  /** Intervalo de repetição em ms (10 000 a 30 000). */
  repeatDelay: number;
}

/* ── Constantes ── */

/** Mapa de velocidade → rate do speechSynthesis. */
export const VOICE_SPEED_RATES: Record<VoiceSpeed, number> = {
  slow: 0.7,
  normal: 0.9,
  fast: 1.1,
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  speed: "normal",
  volume: 1,
  repeatDelay: 15_000,
};

/* ── Persistência (localStorage) ── */

const STORAGE_KEY = "duo-math-voice-settings";

export function loadVoiceSettings(): VoiceSettings {
  if (typeof window === "undefined") return DEFAULT_VOICE_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VOICE_SETTINGS;
    return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
}

export function saveVoiceSettings(settings: VoiceSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage indisponível — falha silenciosa
  }
}
