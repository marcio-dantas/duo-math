/**
 * Configurações do jogo: voz + jogo.
 *
 * Tipos, valores padrão, persistência em localStorage
 * e mapeamentos de classes CSS para tamanho de fonte.
 */

/* ═══════════════════════════════════════════════════════
 * Configurações de VOZ (#37)
 * ═══════════════════════════════════════════════════════ */

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

const VOICE_STORAGE_KEY = "duo-math-voice-settings";

export function loadVoiceSettings(): VoiceSettings {
  if (typeof window === "undefined") return DEFAULT_VOICE_SETTINGS;
  try {
    const raw = localStorage.getItem(VOICE_STORAGE_KEY);
    if (!raw) return DEFAULT_VOICE_SETTINGS;
    return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
}

export function saveVoiceSettings(settings: VoiceSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage indisponível — falha silenciosa
  }
}

/* ═══════════════════════════════════════════════════════
 * Configurações do JOGO (#14)
 * ═══════════════════════════════════════════════════════ */

export type FontSize = "small" | "medium" | "large" | "xlarge";

export interface GameSettings {
  /** Tamanho da fonte: P, M, G, GG. */
  fontSize: FontSize;
  /** Volume dos sons de feedback (0 – 1). */
  soundVolume: number;
  /** Tempo de exibição do feedback antes da próxima questão (ms). */
  questionDelay: number;
  /** Ano escolar do aluno: 1 a 9 (Ensino Fundamental). */
  schoolYear: number;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  fontSize: "medium",
  soundVolume: 1,
  questionDelay: 3_000,
  schoolYear: 3,
};

const GAME_STORAGE_KEY = "duo-math-game-settings";

export function loadGameSettings(): GameSettings {
  if (typeof window === "undefined") return DEFAULT_GAME_SETTINGS;
  try {
    const raw = localStorage.getItem(GAME_STORAGE_KEY);
    if (!raw) return DEFAULT_GAME_SETTINGS;
    return { ...DEFAULT_GAME_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GAME_SETTINGS;
  }
}

export function saveGameSettings(settings: GameSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage indisponível — falha silenciosa
  }
}

/* ── Mapeamentos de tamanho de fonte → classes Tailwind ── */

/**
 * Classes para o texto da pergunta (Question).
 * Base (M): text-7xl sm:text-8xl md:text-9xl  (~4.5 rem → 8 rem)
 */
export const QUESTION_TEXT_CLASSES: Record<FontSize, string> = {
  small: "text-5xl sm:text-6xl md:text-7xl",
  medium: "text-7xl sm:text-8xl md:text-9xl",
  large: "text-8xl sm:text-9xl md:text-[11rem]",
  xlarge: "text-[7rem] sm:text-[10rem] md:text-[13rem]",
};

/**
 * Classes para os valores das opções de resposta (AnswerOption).
 * Base (M): text-7xl sm:text-8xl md:text-9xl
 */
export const ANSWER_TEXT_CLASSES: Record<FontSize, string> = {
  small: "text-5xl sm:text-6xl md:text-7xl",
  medium: "text-7xl sm:text-8xl md:text-9xl",
  large: "text-8xl sm:text-9xl md:text-[11rem]",
  xlarge: "text-[7rem] sm:text-[10rem] md:text-[13rem]",
};

/**
 * Classes para o emoji do overlay de feedback (FeedbackOverlay).
 * Base (M): text-[10rem] sm:text-[14rem] md:text-[16rem]
 */
export const FEEDBACK_EMOJI_CLASSES: Record<FontSize, string> = {
  small: "text-[7rem] sm:text-[10rem] md:text-[12rem]",
  medium: "text-[10rem] sm:text-[14rem] md:text-[16rem]",
  large: "text-[12rem] sm:text-[16rem] md:text-[18rem]",
  xlarge: "text-[14rem] sm:text-[18rem] md:text-[20rem]",
};
