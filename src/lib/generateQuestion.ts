/**
 * Gerador de questões de matemática por ano escolar.
 *
 * Cada ano (1º ao 9º) possui faixas de números e operações
 * adequadas ao nível do aluno. O padrão é 3º ano.
 *
 * Regras gerais:
 * - Divisões sempre com resultado inteiro
 * - Resposta incorreta plausível (próxima da correta)
 * - Posição da resposta correta (esquerda/direita) aleatória
 * - As duas opções são sempre diferentes
 */

export type Operation = "addition" | "subtraction" | "multiplication" | "division";

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
 * Configuração por ano escolar (#44)
 * ═══════════════════════════════════════════════════════ */

/**
 * Faixas numéricas para cada operação em um determinado ano.
 *
 * - `operations`: quais operações são habilitadas no ano
 * - `add`: [aMin, aMax, bMin, bMax]
 * - `sub`: [aMin, aMax, bMin] — bMax é limitado a `a` (resultado ≥ 0)
 * - `mul`: [aMin, aMax, bMin, bMax]
 * - `div`: [answerMin, answerMax, divisorMin, divisorMax]
 * - `wrongOffset`: offset máximo para a resposta errada
 */
interface GradeConfig {
  operations: Operation[];
  add: [number, number, number, number];
  sub: [number, number, number];
  mul: [number, number, number, number];
  div: [number, number, number, number];
  wrongOffset: number;
}

const GRADE_CONFIGS: Record<number, GradeConfig> = {
  /* 1º ano — soma e subtração com números até 10 */
  1: {
    operations: ["addition", "subtraction"],
    add: [1, 9, 1, 9],
    sub: [2, 10, 1],
    mul: [2, 3, 1, 3],
    div: [1, 5, 2, 3],
    wrongOffset: 3,
  },
  /* 2º ano — soma/subtração maiores, início da multiplicação */
  2: {
    operations: ["addition", "subtraction", "multiplication"],
    add: [5, 50, 5, 50],
    sub: [10, 50, 1],
    mul: [2, 5, 2, 5],
    div: [2, 5, 2, 5],
    wrongOffset: 4,
  },
  /* 3º ano — 4 operações básicas (nível padrão atual) */
  3: {
    operations: ["addition", "subtraction", "multiplication", "division"],
    add: [10, 99, 10, 99],
    sub: [20, 99, 10],
    mul: [2, 10, 2, 10],
    div: [2, 10, 2, 10],
    wrongOffset: 5,
  },
  /* 4º ano — números um pouco maiores, tabuada completa */
  4: {
    operations: ["addition", "subtraction", "multiplication", "division"],
    add: [50, 200, 50, 200],
    sub: [50, 300, 10],
    mul: [2, 12, 2, 12],
    div: [2, 12, 2, 12],
    wrongOffset: 5,
  },
  /* 5º ano — centenas, multiplicação/divisão ampliadas */
  5: {
    operations: ["addition", "subtraction", "multiplication", "division"],
    add: [100, 500, 100, 500],
    sub: [100, 500, 50],
    mul: [5, 15, 5, 15],
    div: [3, 15, 3, 12],
    wrongOffset: 8,
  },
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

/* ── Geradores por operação (parametrizados) ─────────────────── */

function generateAddition(cfg: GradeConfig): { text: string; answer: number } {
  const [aMin, aMax, bMin, bMax] = cfg.add;
  const a = randInt(aMin, aMax);
  const b = randInt(bMin, bMax);
  return { text: `${a} + ${b} = ?`, answer: a + b };
}

function generateSubtraction(cfg: GradeConfig): { text: string; answer: number } {
  const [aMin, aMax, bMin] = cfg.sub;
  const a = randInt(aMin, aMax);
  // b ≤ a para garantir resultado ≥ 0
  const b = randInt(bMin, a);
  return { text: `${a} - ${b} = ?`, answer: a - b };
}

function generateMultiplication(cfg: GradeConfig): { text: string; answer: number } {
  const [aMin, aMax, bMin, bMax] = cfg.mul;
  const a = randInt(aMin, aMax);
  const b = randInt(bMin, bMax);
  return { text: `${a} × ${b} = ?`, answer: a * b };
}

function generateDivision(cfg: GradeConfig): { text: string; answer: number } {
  const [ansMin, ansMax, divMin, divMax] = cfg.div;
  // Gera a partir do resultado para garantir divisão exata
  const answer = randInt(ansMin, ansMax);
  const divisor = randInt(divMin, divMax);
  const dividend = answer * divisor;
  return { text: `${dividend} ÷ ${divisor} = ?`, answer };
}

/* ── Função principal ────────────────────────────────────────── */

const generators: Record<Operation, (cfg: GradeConfig) => { text: string; answer: number }> = {
  addition: generateAddition,
  subtraction: generateSubtraction,
  multiplication: generateMultiplication,
  division: generateDivision,
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

  const { text, answer } = generators[op](cfg);

  const wrongAnswer = generateWrongAnswer(answer, cfg.wrongOffset);
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
