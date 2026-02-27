/**
 * Narração por voz usando Web Speech API (speechSynthesis).
 *
 * Seleciona automaticamente a melhor voz pt-BR disponível
 * e narra perguntas e opções do jogo de forma natural.
 *
 * Configurável via `configureSpeech()`:
 * - enabled: liga/desliga narração
 * - rate: velocidade da fala (0.1 – 10)
 * - volume: volume da voz (0 – 1)
 *
 * Compatibilidade:
 * - Chrome 71+: exige ativação do usuário para o primeiro speak()
 * - Safari iOS: exige gesto do usuário para o primeiro speak()
 * - Chrome: cancel() seguido de speak() pode ser ignorado (fix: delay 50 ms)
 *
 * Estratégia de desbloqueio:
 * 1. Na montagem, registra listeners para desbloquear no primeiro gesto
 * 2. Antes do desbloqueio, armazena a última narração tentada
 * 3. No primeiro gesto do usuário (click/touch), fala a narração pendente
 *    (em keydown, a narração é descartada pois o jogador já está selecionando)
 * 4. Após desbloqueio, todas as narrações seguintes funcionam normalmente
 */

let selectedVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

/* ── Configuração interna ── */

let speechEnabled = true;
let speechRate = 0.9;
let speechVolume = 1;

/** Timer do workaround cancel()+speak() do Chrome. */
let speakTimer: ReturnType<typeof setTimeout> | null = null;

/** Timer da narração pendente disparada no unlock. */
let unlockTimer: ReturnType<typeof setTimeout> | null = null;

/** Indica se o speechSynthesis foi desbloqueado por gesto do usuário. */
let unlocked = false;

/** Texto da narração pendente (bloqueada antes do primeiro gesto). */
let pendingText: string | null = null;

/* ── Mapa de operadores para palavras em português ── */
const OPERATOR_WORDS: Record<string, string> = {
  "+": "mais",
  "-": "menos",
  "×": "vezes",
  "÷": "dividido por",
};

/* ── Mapa de frações para narração em português (#46) ── */
const FRACTION_NARRATIONS: Record<string, string> = {
  "½": "metade",
  "¼": "um quarto",
  "¾": "três quartos",
};

/* ── Gestão de vozes ── */

/**
 * Busca e armazena a melhor voz pt-BR disponível no browser.
 */
function loadVoice(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return;

  // Prioridade: pt-BR exato → qualquer pt-* → primeira disponível
  selectedVoice =
    voices.find((v) => v.lang === "pt-BR") ??
    voices.find((v) => v.lang.startsWith("pt")) ??
    voices[0];

  voicesLoaded = true;
}

/* ── Desbloqueio por gesto do usuário ── */

const UNLOCK_EVENTS = ["click", "touchstart", "keydown"] as const;

/**
 * Handler chamado no primeiro gesto do usuário.
 * Desbloqueia speechSynthesis e, se o gesto não for um
 * acionador (keydown), fala a narração pendente.
 */
function onUserGesture(event: Event): void {
  if (unlocked) return;
  unlocked = true;

  UNLOCK_EVENTS.forEach((e) =>
    document.removeEventListener(e, onUserGesture),
  );

  // Se o gesto é click/touch (não acionador), narra o texto pendente.
  // Se for keydown (acionador), descarta — o jogador já está respondendo
  // e handleSelect vai chamar cancelSpeech() logo em seguida.
  if (event.type !== "keydown" && pendingText) {
    const text = pendingText;
    pendingText = null;
    unlockTimer = setTimeout(() => {
      unlockTimer = null;
      doSpeak(text);
    }, 100);
  } else {
    pendingText = null;
  }
}

/* ── Fala interna (após desbloqueio) ── */

/**
 * Executa a fala de fato, com workaround para o bug
 * cancel()+speak() do Chrome.
 *
 * Usa speechRate e speechVolume da configuração atual.
 */
function doSpeak(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  if (!voicesLoaded) loadVoice();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = speechRate;
  utterance.pitch = 1;
  utterance.volume = speechVolume;

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  // Chrome bug: speak() logo após cancel() pode ser ignorado.
  // Delay mínimo de 50 ms resolve.
  if (speakTimer !== null) clearTimeout(speakTimer);
  speakTimer = setTimeout(() => {
    window.speechSynthesis.speak(utterance);
    speakTimer = null;
  }, 50);
}

/* ── API pública ── */

/**
 * Atualiza a configuração interna do módulo de voz.
 *
 * Chamado pelo componente sempre que as VoiceSettings mudam.
 * Não persiste — a persistência é responsabilidade do contexto.
 */
export function configureSpeech(config: {
  enabled?: boolean;
  rate?: number;
  volume?: number;
}): void {
  if (config.enabled !== undefined) speechEnabled = config.enabled;
  if (config.rate !== undefined) speechRate = config.rate;
  if (config.volume !== undefined) speechVolume = config.volume;
}

/**
 * Inicializa o sistema de voz.
 * Retorna função de cleanup para useEffect.
 */
export function initSpeech(): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return () => {};
  }

  loadVoice();
  window.speechSynthesis.addEventListener("voiceschanged", loadVoice);

  // Registra listeners para desbloquear no primeiro gesto
  UNLOCK_EVENTS.forEach((e) => document.addEventListener(e, onUserGesture));

  return () => {
    cancelSpeech();
    window.speechSynthesis.removeEventListener("voiceschanged", loadVoice);
    UNLOCK_EVENTS.forEach((e) =>
      document.removeEventListener(e, onUserGesture),
    );
  };
}

/**
 * Cancela qualquer narração em andamento ou pendente.
 */
export function cancelSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  if (unlockTimer !== null) {
    clearTimeout(unlockTimer);
    unlockTimer = null;
  }

  if (speakTimer !== null) {
    clearTimeout(speakTimer);
    speakTimer = null;
  }

  pendingText = null;
  window.speechSynthesis.cancel();
}

/**
 * Fala o texto em pt-BR.
 * Cancela automaticamente qualquer narração anterior.
 *
 * Se a narração estiver desativada (configureSpeech), é no-op.
 *
 * Se speechSynthesis ainda não foi desbloqueado (nenhum gesto do
 * usuário), armazena o texto como pendente — será falado
 * automaticamente no primeiro click/touch.
 *
 * @param text  Texto para narrar.
 */
export function speak(text: string): void {
  if (!speechEnabled) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (!text) return;

  // Limpa pendências anteriores
  if (unlockTimer !== null) {
    clearTimeout(unlockTimer);
    unlockTimer = null;
  }
  if (speakTimer !== null) {
    clearTimeout(speakTimer);
    speakTimer = null;
  }
  window.speechSynthesis.cancel();

  if (!unlocked) {
    // Armazena para falar no primeiro gesto do usuário
    pendingText = text;
    return;
  }

  pendingText = null;
  doSpeak(text);
}

/* ── Construção de frases ── */

/**
 * Constrói a frase de narração para uma questão de matemática.
 *
 * Suporta três formatos (#46):
 *
 * 1. Operação simples: "12 + 15 = ?"
 *    → "Quanto é 12 mais 15? À esquerda, 27. À direita, 30."
 *
 * 2. Fração: "½ de 20 = ?"
 *    → "Quanto é metade de 20? À esquerda, 10. À direita, 12."
 *
 * 3. Expressão: "3 × 4 + 2 = ?"
 *    → "Quanto é 3 vezes 4 mais 2? À esquerda, 14. À direita, 12."
 */
export function buildNarration(
  questionText: string,
  leftValue: number | string,
  rightValue: number | string,
): string {
  const suffix = `À esquerda, ${leftValue}. À direita, ${rightValue}.`;

  // 1. Fração: "½ de 20 = ?"
  const fracMatch = questionText.match(/^([½¼¾])\s+de\s+(\d+)/);
  if (fracMatch) {
    const [, symbol, whole] = fracMatch;
    const word = FRACTION_NARRATIONS[symbol] ?? symbol;
    return `Quanto é ${word} de ${whole}? ${suffix}`;
  }

  // 2. Expressão: "3 × 4 + 2 = ?"
  const exprMatch = questionText.match(
    /^(\d+)\s*([+\-×÷])\s*(\d+)\s*([+\-×÷])\s*(\d+)/,
  );
  if (exprMatch) {
    const [, a, op1, b, op2, c] = exprMatch;
    const word1 = OPERATOR_WORDS[op1] ?? op1;
    const word2 = OPERATOR_WORDS[op2] ?? op2;
    return `Quanto é ${a} ${word1} ${b} ${word2} ${c}? ${suffix}`;
  }

  // 3. Operação simples: "12 + 15 = ?"
  const match = questionText.match(/^(\d+)\s*([+\-×÷])\s*(\d+)/);
  if (!match) return "";

  const [, a, op, b] = match;
  const word = OPERATOR_WORDS[op] ?? op;

  return `Quanto é ${a} ${word} ${b}? ${suffix}`;
}
