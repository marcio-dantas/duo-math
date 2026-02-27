/**
 * Gerador de questões de matemática por ano escolar.
 *
 * Cada ano (1º ao 9º) possui faixas de números e operações
 * adequadas ao nível do aluno, seguindo as diretrizes da BNCC.
 * O padrão é 3º ano.
 *
 * Regras gerais:
 * - Divisões sempre com resultado inteiro
 * - Frações sempre com resultado inteiro
 * - Expressões nunca com resultado negativo
 * - Resposta incorreta plausível (próxima da correta)
 * - Posição da resposta correta (esquerda/direita) aleatória
 * - As duas opções são sempre diferentes
 *
 * BNCC — Fundamental 1 (anos iniciais):
 * - 1º ano: soma/subtração com dígitos únicos, resultados ≤ 10
 * - 2º ano: +/- com resultados ≤ 50, tabuada do 2 e do 5
 * - 3º ano: 4 operações, números até 100, tabuada completa até 5
 *
 * BNCC — Fundamental 1 (anos avançados):
 * - 4º ano: tabuada completa até 10, números até 1000
 * - 5º ano: números até 10.000, frações (½, ¼, ¾), expressões simples
 */

export type Operation =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division"
  | "fraction"
  | "expression";

export interface MathQuestion {
  /** Texto da pergunta, ex: "12 + 15 = ?" */
  text: string;
  /** Resposta correta */
  correctAnswer: number;
  /** Resposta incorreta (plausível) */
  wrongAnswer: number;
  /** Lado onde a resposta correta aparece */
  correctSide: "left" | "right";
  /** Valor exibido na opção esquerda */
  leftValue: number;
  /** Valor exibido na opção direita */
  rightValue: number;
}

/* ── Helpers ─────────────────────────────────────────────────── */

/** Retorna inteiro aleatório entre min e max (inclusive). */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Escolhe um item aleatório do array. */
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

/**
 * Gera uma resposta incorreta plausível.
 * Offset de ±1 a ±maxOffset, garantindo que seja diferente da correta e ≥ 0.
 */
function generateWrongAnswer(correct: number, maxOffset: number = 5): number {
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    const offset = randInt(1, maxOffset) * pick([1, -1]);
    const wrong = correct + offset;
    if (wrong !== correct && wrong >= 0) return wrong;
  }
  // Fallback: sempre diferente e ≥ 0
  return correct >= 1 ? correct - 1 : correct + 1;
}

/* ═══════════════════════════════════════════════════════
 * Definição de frações (#46)
 * ═══════════════════════════════════════════════════════ */

/** Definição de uma fração simples para questões. */
export interface FractionDef {
  /** Símbolo Unicode da fração, ex: "½" */
  symbol: string;
  /** Numerador da fração */
  numerator: number;
  /** Denominador da fração */
  denominator: number;
  /** Texto para narração por voz, ex: "metade de" */
  narration: string;
}

/** Frações simples usadas no 5º ano. */
const FRACTIONS_5TH: FractionDef[] = [
  { symbol: "½", numerator: 1, denominator: 2, narration: "metade de" },
  { symbol: "¼", numerator: 1, denominator: 4, narration: "um quarto de" },
  { symbol: "¾", numerator: 3, denominator: 4, narration: "três quartos de" },
];

/* ═══════════════════════════════════════════════════════
 * Configuração por ano escolar (#44 + #45 + #46 BNCC)
 * ═══════════════════════════════════════════════════════ */

/**
 * Faixas numéricas para cada operação em um determinado ano.
 *
 * - `operations`: quais operações são habilitadas no ano
 * - `add`: [aMin, aMax, bMin, bMax]
 * - `addMaxResult`: (opcional) limite máximo para a soma a+b
 * - `sub`: [aMin, aMax, bMin] — bMax é limitado a `a` (resultado ≥ 0)
 * - `mul`: [aMin, aMax, bMin, bMax]
 * - `mulTables`: (opcional) restringe o 1º operando a tabuadas específicas
 * - `div`: [answerMin, answerMax, divisorMin, divisorMax]
 * - `wrongOffset`: offset máximo para a resposta errada
 * - `fractions`: (opcional) definições de frações disponíveis
 * - `fractionWholeRange`: (opcional) [min, max] do número inteiro para frações
 * - `exprRange`: (opcional) [min, max] dos operandos para expressões
 */
interface GradeConfig {
  operations: Operation[];
  add: [number, number, number, number];
  addMaxResult?: number;
  sub: [number, number, number];
  mul: [number, number, number, number];
  mulTables?: number[];
  div: [number, number, number, number];
  wrongOffset: number;
  fractions?: FractionDef[];
  fractionWholeRange?: [number, number];
  exprRange?: [number, number];
}

const GRADE_CONFIGS: Record<number, GradeConfig> = {
  /* ── BNCC Fundamental 1 — anos iniciais ────────────────────── */

  /* 1º ano — BNCC: dígitos únicos, soma ≤ 10, subtração ≤ 10 */
  1: {
    operations: ["addition", "subtraction"],
    add: [1, 9, 1, 9],
    addMaxResult: 10,
    sub: [2, 9, 1],
    mul: [2, 3, 1, 3],
    div: [1, 5, 2, 3],
    wrongOffset: 3,
  },
  /* 2º ano — BNCC: +/− resultados ≤ 50, tabuada do 2 e do 5 */
  2: {
    operations: ["addition", "subtraction", "multiplication"],
    add: [2, 48, 2, 48],
    addMaxResult: 50,
    sub: [10, 50, 1],
    mul: [2, 5, 1, 10],
    mulTables: [2, 5],
    div: [2, 5, 2, 5],
    wrongOffset: 4,
  },
  /* 3º ano — BNCC: 4 operações, números até 100, tabuada até 5 */
  3: {
    operations: ["addition", "subtraction", "multiplication", "division"],
    add: [5, 95, 5, 95],
    addMaxResult: 100,
    sub: [10, 100, 1],
    mul: [2, 5, 1, 10],
    mulTables: [2, 3, 4, 5],
    div: [2, 10, 2, 5],
    wrongOffset: 5,
  },

  /* ── BNCC Fundamental 1 — anos avançados (#46) ─────────────── */

  /**
   * 4º ano — BNCC:
   * - Tabuada completa até 10
   * - Multiplicação com resultados até 100 (ex: 10 × 10 = 100)
   * - Divisão com números maiores (ex: 72 ÷ 9 = 8)
   * - Adição e subtração com números até 1000
   */
  4: {
    operations: ["addition", "subtraction", "multiplication", "division"],
    add: [10, 500, 10, 500],
    addMaxResult: 1000,
    sub: [10, 1000, 1],
    mul: [2, 10, 1, 10],
    mulTables: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    div: [2, 10, 2, 10],
    wrongOffset: 5,
  },

  /**
   * 5º ano — BNCC:
   * - Operações com números até 10.000
   * - Frações simples: ½, ¼, ¾ (ex: ½ de 20 = ?)
   * - Multiplicação e divisão com resultados maiores
   * - Expressões simples com duas operações (ex: 3 × 4 + 2 = ?)
   */
  5: {
    operations: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "fraction",
      "expression",
    ],
    add: [100, 5000, 100, 5000],
    addMaxResult: 10000,
    sub: [100, 10000, 50],
    mul: [5, 20, 5, 20],
    div: [5, 20, 5, 15],
    wrongOffset: 10,
    fractions: FRACTIONS_5TH,
    fractionWholeRange: [4, 100],
    exprRange: [2, 10],
  },

  /* ── Fundamental 2 ─────────────────────────────────────────── */

  /* 6º ano — números maiores */
  6: {
    operations: ["addition", "subtraction", "multiplication", "division"],
    add: [100, 999, 100, 999],
    sub: [200, 999, 100],
    mul: [5, 20, 5, 20],
    div: [5, 20, 3, 15],
    wrongOffset: 10,
  },
  /* 7º ano */
  7: {
    operations: ["addition", "subtraction", "multiplication", "division"],
    add: [200, 999, 200, 999],
    sub: [300, 999, 100],
    mul: [10, 25, 5, 20],
    div: [5, 25, 3, 20],
    wrongOffset: 10,
  },
  /* 8º ano */
  8: {
    operations: ["addition", "subtraction", "multiplication", "division"],
    add: [300, 999, 200, 999],
    sub: [300, 999, 200],
    mul: [10, 30, 10, 25],
    div: [10, 30, 5, 20],
    wrongOffset: 15,
  },
  /* 9º ano */
  9: {
    operations: ["addition", "subtraction", "multiplication", "division"],
    add: [500, 999, 200, 999],
    sub: [500, 999, 200],
    mul: [10, 30, 10, 30],
    div: [10, 30, 5, 25],
    wrongOffset: 15,
  },
};

/* ── Resultado interno dos geradores ─────────────────────────── */

interface GeneratorResult {
  text: string;
  answer: number;
  /** Offset custom para a resposta errada (sobrescreve cfg.wrongOffset). */
  wrongOffset?: number;
}

/* ── Geradores por operação (parametrizados) ─────────────────── */

function generateAddition(cfg: GradeConfig): GeneratorResult {
  const [aMin, aMax, bMin, bMax] = cfg.add;

  if (cfg.addMaxResult !== undefined) {
    // Limita operandos para garantir soma ≤ addMaxResult
    const effectiveAMax = Math.min(aMax, cfg.addMaxResult - bMin);
    const a = randInt(aMin, effectiveAMax);
    const effectiveBMax = Math.min(bMax, cfg.addMaxResult - a);
    const b = randInt(bMin, effectiveBMax);
    return { text: `${a} + ${b} = ?`, answer: a + b };
  }

  const a = randInt(aMin, aMax);
  const b = randInt(bMin, bMax);
  return { text: `${a} + ${b} = ?`, answer: a + b };
}

function generateSubtraction(cfg: GradeConfig): GeneratorResult {
  const [aMin, aMax, bMin] = cfg.sub;
  const a = randInt(aMin, aMax);
  // b ≤ a para garantir resultado ≥ 0
  const b = randInt(bMin, a);
  return { text: `${a} - ${b} = ?`, answer: a - b };
}

function generateMultiplication(cfg: GradeConfig): GeneratorResult {
  const [aMin, aMax, bMin, bMax] = cfg.mul;
  // Se mulTables definido, usa apenas as tabuadas especificadas (BNCC)
  const a = cfg.mulTables ? pick(cfg.mulTables) : randInt(aMin, aMax);
  const b = randInt(bMin, bMax);
  return { text: `${a} × ${b} = ?`, answer: a * b };
}

function generateDivision(cfg: GradeConfig): GeneratorResult {
  const [ansMin, ansMax, divMin, divMax] = cfg.div;
  // Gera a partir do resultado para garantir divisão exata
  const answer = randInt(ansMin, ansMax);
  const divisor = randInt(divMin, divMax);
  const dividend = answer * divisor;
  return { text: `${dividend} ÷ ${divisor} = ?`, answer };
}

/**
 * Gera uma questão de fração simples.
 *
 * Exemplo: "½ de 20 = ?" → resposta 10.
 * O número inteiro é sempre múltiplo do denominador,
 * garantindo resultado inteiro.
 *
 * Usa um offset de distração proporcional à resposta para
 * que o distrator seja plausível mesmo com respostas pequenas.
 */
function generateFraction(cfg: GradeConfig): GeneratorResult {
  if (!cfg.fractions || cfg.fractions.length === 0) {
    return generateAddition(cfg);
  }

  const frac = pick(cfg.fractions);
  const [wholeMin, wholeMax] = cfg.fractionWholeRange ?? [4, 100];

  // Gera um inteiro que é múltiplo do denominador → resultado sempre inteiro
  const minMultiple = Math.ceil(wholeMin / frac.denominator);
  const maxMultiple = Math.floor(wholeMax / frac.denominator);
  const multiple = randInt(minMultiple, maxMultiple);
  const whole = multiple * frac.denominator;

  const answer = (whole * frac.numerator) / frac.denominator;

  // Offset proporcional à resposta (mín 2, máx wrongOffset do ano)
  const adaptiveOffset = Math.max(2, Math.min(cfg.wrongOffset, Math.ceil(answer / 3)));

  return { text: `${frac.symbol} de ${whole} = ?`, answer, wrongOffset: adaptiveOffset };
}

/**
 * Gera uma expressão simples com duas operações.
 *
 * Padrão: a × b + c ou a × b − c (multiplicação sempre primeiro).
 * Segue a ordem natural de operações (PEMDAS) sem ambiguidade:
 * a criança lê da esquerda para a direita e a resposta é correta.
 *
 * Resultado é sempre ≥ 0 (subtração só quando produto ≥ c).
 */
function generateExpression(cfg: GradeConfig): GeneratorResult {
  const [min, max] = cfg.exprRange ?? [2, 10];

  const a = randInt(min, max);
  const b = randInt(min, max);
  const c = randInt(min, max);

  const product = a * b;

  // Usa subtração somente se o resultado for ≥ 0
  if (pick([true, false]) && product >= c) {
    return {
      text: `${a} × ${b} - ${c} = ?`,
      answer: product - c,
    };
  }

  return {
    text: `${a} × ${b} + ${c} = ?`,
    answer: product + c,
  };
}

/* ── Função principal ────────────────────────────────────────── */

const generators: Record<Operation, (cfg: GradeConfig) => GeneratorResult> = {
  addition: generateAddition,
  subtraction: generateSubtraction,
  multiplication: generateMultiplication,
  division: generateDivision,
  fraction: generateFraction,
  expression: generateExpression,
};

/**
 * Gera uma questão de matemática adequada ao ano escolar.
 *
 * @param operation — operação específica, ou omita para sortear entre as disponíveis no ano.
 * @param schoolYear — ano escolar (1 a 9). Padrão: 3.
 */
export function generateQuestion(operation?: Operation, schoolYear: number = 3): MathQuestion {
  const grade = Math.max(1, Math.min(9, Math.round(schoolYear)));
  const cfg = GRADE_CONFIGS[grade] ?? GRADE_CONFIGS[3];

  // Se a operação solicitada não está disponível no ano, sorteia uma válida
  const op =
    operation && cfg.operations.includes(operation)
      ? operation
      : pick<Operation>(cfg.operations);

  const { text, answer, wrongOffset: customOffset } = generators[op](cfg);
  const effectiveOffset = customOffset ?? cfg.wrongOffset;

  const wrongAnswer = generateWrongAnswer(answer, effectiveOffset);
  const correctSide: "left" | "right" = pick(["left", "right"]);

  const leftValue = correctSide === "left" ? answer : wrongAnswer;
  const rightValue = correctSide === "right" ? answer : wrongAnswer;

  return {
    text,
    correctAnswer: answer,
    wrongAnswer,
    correctSide,
    leftValue,
    rightValue,
  };
}

/**
 * Retorna as operações disponíveis para um dado ano escolar.
 * Útil para testes e validação.
 */
export function getOperationsForGrade(schoolYear: number): Operation[] {
  const grade = Math.max(1, Math.min(9, Math.round(schoolYear)));
  return (GRADE_CONFIGS[grade] ?? GRADE_CONFIGS[3]).operations;
}
