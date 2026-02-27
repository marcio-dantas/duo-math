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
  "−": "menos",
  "×": "vezes",
  "÷": "dividido por",
};

/* ── Mapa de frações para narração em português (#46) ── */
const FRACTION_NARRATIONS: Record<string, string> = {
  "½": "metade",
  "¼": "um quarto",
  "¾": "três quartos",
};

/* ── Unicode helpers para narração (#47) ── */

const SUPERSCRIPTS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUBSCRIPTS = "₀₁₂₃₄₅₆₇₈₉";

/** Converte dígitos Unicode sobrescritos para string numérica: "²³" → "23" */
function fromSuperscript(s: string): string {
  return s
    .split("")
    .map((c) => {
      const idx = SUPERSCRIPTS.indexOf(c);
      return idx >= 0 ? String(idx) : c;
    })
    .join("");
}

/** Converte dígitos Unicode subscritos para string numérica: "₅" → "5" */
function fromSubscript(s: string): string {
  return s
    .split("")
    .map((c) => {
      const idx = SUBSCRIPTS.indexOf(c);
      return idx >= 0 ? String(idx) : c;
    })
    .join("");
}

/** Mapa de denominador para nomes em português (singular, plural). */
const DENOMINATOR_WORDS: Record<number, [string, string]> = {
  2: ["meio", "meios"],
  3: ["terço", "terços"],
  4: ["quarto", "quartos"],
  5: ["quinto", "quintos"],
  6: ["sexto", "sextos"],
  8: ["oitavo", "oitavos"],
  10: ["décimo", "décimos"],
};

/**
 * Narra um valor de resposta, convertendo formatos especiais em texto falado.
 *
 * - Decimal "3,8" → "3 vírgula 8"
 * - Fração Unicode "³⁄₅" → "3 quintos"
 * - Negativo "−8" → "menos 8"
 * - Número simples → string direta
 */
function narrateValue(value: number | string): string {
  const s = String(value);

  // Decimal brasileiro: "3,8" → "3 vírgula 8"
  const decMatch = s.match(/^(\d+),(\d+)$/);
  if (decMatch) return `${decMatch[1]} vírgula ${decMatch[2]}`;

  // Fração Unicode: "³⁄₅" → "3 quintos"
  const fracMatch = s.match(/^([⁰¹²³⁴⁵⁶⁷⁸⁹]+)⁄([₀₁₂₃₄₅₆₇₈₉]+)$/);
  if (fracMatch) {
    const num = Number(fromSuperscript(fracMatch[1]));
    const den = Number(fromSubscript(fracMatch[2]));
    const words = DENOMINATOR_WORDS[den];
    if (words) {
      return `${num} ${num === 1 ? words[0] : words[1]}`;
    }
    return `${num} sobre ${den}`;
  }

  // Negativo com Unicode minus: "−8" → "menos 8"
  if (s.startsWith("−")) return `menos ${s.slice(1)}`;

  return s;
}

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
 * Suporta todos os formatos implementados (#46 + #47):
 *
 * 1. Operação simples: "12 + 15 = ?"
 *    → "Quanto é 12 mais 15? À esquerda, 27. À direita, 30."
 *
 * 2. Fração (5º): "½ de 20 = ?"
 *    → "Quanto é metade de 20? À esquerda, 10. À direita, 12."
 *
 * 3. Expressão (5º): "3 × 4 + 2 = ?"
 *    → "Quanto é 3 vezes 4 mais 2? À esquerda, 14. À direita, 12."
 *
 * 4. Potenciação (6º): "2³ = ?"
 *    → "Quanto é 2 elevado a 3? À esquerda, 8. À direita, 6."
 *
 * 5. Decimal (6º): "1,5 + 2,3 = ?"
 *    → "Quanto é 1 vírgula 5 mais 2 vírgula 3? À esquerda, ..."
 *
 * 6. Fração mesmo denom. (6º): "²⁄₅ + ¹⁄₅ = ?"
 *    → "Quanto é 2 quintos mais 1 quinto? À esquerda, ..."
 *
 * 7. Múltiplos/divisores (6º): "Múltiplo de 6 = ?"
 *    → "Qual é o múltiplo de 6? À esquerda, 18. À direita, 16."
 *
 * 8. Negativos (7º): "−3 + 5 = ?"
 *    → "Quanto é menos 3 mais 5? À esquerda, 2. À direita, 4."
 *
 * 9. Proporção (7º): "Se 2 → 6, 4 → ?"
 *    → "Se 2 dá 6, quanto dá 4? À esquerda, 12. À direita, 10."
 *
 * 10. Parênteses (7º): "(3 + 2) × 4 = ?"
 *     → "Quanto é, abre parênteses, 3 mais 2, fecha parênteses, vezes 4?"
 *
 * 11. Porcentagem (7º): "10% de 200 = ?"
 *     → "Quanto é 10 por cento de 200? À esquerda, 20. À direita, 25."
 */
export function buildNarration(
  questionText: string,
  leftValue: number | string,
  rightValue: number | string,
): string {
  const suffix = `À esquerda, ${narrateValue(leftValue)}. À direita, ${narrateValue(rightValue)}.`;

  // 1. Porcentagem: "10% de 200 = ?"
  const pctMatch = questionText.match(/^(\d+)% de (\d+)/);
  if (pctMatch) {
    return `Quanto é ${pctMatch[1]} por cento de ${pctMatch[2]}? ${suffix}`;
  }

  // 2. Potenciação: "2³ = ?" (dígitos + sobrescritos)
  const expMatch = questionText.match(
    /^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)\s*=\s*\?/,
  );
  if (expMatch) {
    const base = expMatch[1];
    const exp = fromSuperscript(expMatch[2]);
    return `Quanto é ${base} elevado a ${exp}? ${suffix}`;
  }

  // 3. Decimal: "1,5 + 2,3 = ?"
  const decMatch = questionText.match(
    /^(\d+,\d+)\s*([+\-])\s*(\d+,\d+)/,
  );
  if (decMatch) {
    const a = decMatch[1].replace(",", " vírgula ");
    const op = OPERATOR_WORDS[decMatch[2]] ?? decMatch[2];
    const b = decMatch[3].replace(",", " vírgula ");
    return `Quanto é ${a} ${op} ${b}? ${suffix}`;
  }

  // 4. Fração mesmo denominador: "²⁄₅ + ¹⁄₅ = ?"
  const sameFracMatch = questionText.match(
    /^([⁰¹²³⁴⁵⁶⁷⁸⁹]+)⁄([₀₁₂₃₄₅₆₇₈₉]+)\s*([+−])\s*([⁰¹²³⁴⁵⁶⁷⁸⁹]+)⁄([₀₁₂₃₄₅₆₇₈₉]+)/,
  );
  if (sameFracMatch) {
    const n1 = Number(fromSuperscript(sameFracMatch[1]));
    const d1 = Number(fromSubscript(sameFracMatch[2]));
    const op = sameFracMatch[3] === "+" ? "mais" : "menos";
    const n2 = Number(fromSuperscript(sameFracMatch[4]));
    const d2 = Number(fromSubscript(sameFracMatch[5]));
    const w1 = DENOMINATOR_WORDS[d1];
    const w2 = DENOMINATOR_WORDS[d2];
    const dWord1 = w1 ? (n1 === 1 ? w1[0] : w1[1]) : `sobre ${d1}`;
    const dWord2 = w2 ? (n2 === 1 ? w2[0] : w2[1]) : `sobre ${d2}`;
    return `Quanto é ${n1} ${dWord1} ${op} ${n2} ${dWord2}? ${suffix}`;
  }

  // 5. Múltiplos/divisores: "Múltiplo de 6 = ?" ou "Divisor de 24 = ?"
  const mdMatch = questionText.match(/^(Múltiplo|Divisor) de (\d+)/);
  if (mdMatch) {
    return `Qual é o ${mdMatch[1].toLowerCase()} de ${mdMatch[2]}? ${suffix}`;
  }

  // 6. Proporção: "Se 2 → 6, 4 → ?"
  const propMatch = questionText.match(/^Se (\d+) → (\d+), (\d+) → \?/);
  if (propMatch) {
    return `Se ${propMatch[1]} dá ${propMatch[2]}, quanto dá ${propMatch[3]}? ${suffix}`;
  }

  // 7. Expressão com parênteses: "(3 + 2) × 4 = ?"
  const parenMatch = questionText.match(
    /^\((\d+)\s*([+\-−])\s*(\d+)\)\s*([×÷])\s*(\d+)/,
  );
  if (parenMatch) {
    const [, a, op1, b, op2, c] = parenMatch;
    const word1 = OPERATOR_WORDS[op1] ?? op1;
    const word2 = OPERATOR_WORDS[op2] ?? op2;
    return `Quanto é, abre parênteses, ${a} ${word1} ${b}, fecha parênteses, ${word2} ${c}? ${suffix}`;
  }

  // 8. Negativos: "−3 + 5 = ?" ou "−3 − 5 = ?"
  const negMatch = questionText.match(/^−(\d+)\s*([+−])\s*(\d+)/);
  if (negMatch) {
    const [, a, op, b] = negMatch;
    const opWord = op === "+" ? "mais" : "menos";
    return `Quanto é menos ${a} ${opWord} ${b}? ${suffix}`;
  }

  // 9. Fração (5º ano): "½ de 20 = ?"
  const fracMatch = questionText.match(/^([½¼¾])\s+de\s+(\d+)/);
  if (fracMatch) {
    const [, symbol, whole] = fracMatch;
    const word = FRACTION_NARRATIONS[symbol] ?? symbol;
    return `Quanto é ${word} de ${whole}? ${suffix}`;
  }

  // 10. Expressão (5º ano): "3 × 4 + 2 = ?"
  const exprMatch = questionText.match(
    /^(\d+)\s*([+\-×÷])\s*(\d+)\s*([+\-×÷])\s*(\d+)/,
  );
  if (exprMatch) {
    const [, a, op1, b, op2, c] = exprMatch;
    const word1 = OPERATOR_WORDS[op1] ?? op1;
    const word2 = OPERATOR_WORDS[op2] ?? op2;
    return `Quanto é ${a} ${word1} ${b} ${word2} ${c}? ${suffix}`;
  }

  // 11. Operação simples: "12 + 15 = ?"
  const match = questionText.match(/^(\d+)\s*([+\-×÷])\s*(\d+)/);
  if (!match) return "";

  const [, a, op, b] = match;
  const word = OPERATOR_WORDS[op] ?? op;

  return `Quanto é ${a} ${word} ${b}? ${suffix}`;
}
