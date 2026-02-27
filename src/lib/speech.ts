/**
 * Narração por voz usando Web Speech API (speechSynthesis).
 *
 * Seleciona automaticamente a melhor voz pt-BR disponível
 * e narra perguntas e opções do jogo de forma natural.
 *
 * Chrome é o browser alvo principal.
 */

let selectedVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

/* ── Mapa de operadores para palavras em português ── */
const OPERATOR_WORDS: Record<string, string> = {
  "+": "mais",
  "-": "menos",
  "×": "vezes",
  "÷": "dividido por",
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

/**
 * Inicializa o sistema de voz.
 * Chame uma vez no lado do cliente (useEffect de montagem).
 */
export function initSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  loadVoice();

  // Chrome carrega vozes de forma assíncrona — escuta o evento
  if (!voicesLoaded) {
    window.speechSynthesis.addEventListener("voiceschanged", loadVoice);
  }
}

/* ── Controle de narração ── */

/**
 * Cancela qualquer narração em andamento.
 */
export function cancelSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

/**
 * Fala o texto em pt-BR usando speechSynthesis.
 * Cancela automaticamente qualquer narração anterior.
 *
 * @param text  Texto para narrar.
 * @param rate  Velocidade (padrão 0,9 — levemente mais lento para clareza).
 */
export function speak(text: string, rate = 0.9): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (!text) return;

  cancelSpeech();

  // Tenta carregar voz se ainda não carregou
  if (!voicesLoaded) loadVoice();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  window.speechSynthesis.speak(utterance);
}

/* ── Construção de frases ── */

/**
 * Constrói a frase de narração para uma questão de matemática.
 *
 * Entrada: texto "12 + 15 = ?", leftValue 27, rightValue 30
 * Saída:   "Quanto é 12 mais 15? À esquerda, 27. À direita, 30."
 */
export function buildNarration(
  questionText: string,
  leftValue: number | string,
  rightValue: number | string,
): string {
  const match = questionText.match(/^(\d+)\s*([+\-×÷])\s*(\d+)/);
  if (!match) return "";

  const [, a, op, b] = match;
  const word = OPERATOR_WORDS[op] ?? op;

  return `Quanto é ${a} ${word} ${b}? À esquerda, ${leftValue}. À direita, ${rightValue}.`;
}
