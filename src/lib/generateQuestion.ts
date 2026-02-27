/**
 * Gerador de questões de matemática com as 4 operações básicas.
 *
 * Regras:
 * - Números adequados para 9º ano
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
 * Offset de ±1 a ±5, garantindo que seja diferente da correta e ≥ 0.
 */
function generateWrongAnswer(correct: number): number {
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    const offset = randInt(1, 5) * pick([1, -1]);
    const wrong = correct + offset;
    if (wrong !== correct && wrong >= 0) return wrong;
  }
  // Fallback: sempre diferente e ≥ 0
  return correct >= 1 ? correct - 1 : correct + 1;
}

/* ── Geradores por operação ──────────────────────────────────── */

function generateAddition(): { text: string; answer: number } {
  const a = randInt(10, 99);
  const b = randInt(10, 99);
  return { text: `${a} + ${b} = ?`, answer: a + b };
}

function generateSubtraction(): { text: string; answer: number } {
  // Garante resultado positivo colocando o maior primeiro
  let a = randInt(20, 99);
  let b = randInt(10, a);
  return { text: `${a} - ${b} = ?`, answer: a - b };
}

function generateMultiplication(): { text: string; answer: number } {
  const a = randInt(2, 12);
  const b = randInt(2, 12);
  return { text: `${a} × ${b} = ?`, answer: a * b };
}

function generateDivision(): { text: string; answer: number } {
  // Gera a partir do resultado para garantir divisão exata
  const answer = randInt(2, 12);
  const divisor = randInt(2, 12);
  const dividend = answer * divisor;
  return { text: `${dividend} ÷ ${divisor} = ?`, answer };
}

/* ── Função principal ────────────────────────────────────────── */

const generators = {
  addition: generateAddition,
  subtraction: generateSubtraction,
  multiplication: generateMultiplication,
  division: generateDivision,
};

/**
 * Gera uma questão de matemática aleatória.
 *
 * @param operation — operação específica, ou omita para sortear uma.
 */
export function generateQuestion(operation?: Operation): MathQuestion {
  const op = operation ?? pick<Operation>(["addition", "subtraction", "multiplication", "division"]);
  const { text, answer } = generators[op]();

  const wrongAnswer = generateWrongAnswer(answer);
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
