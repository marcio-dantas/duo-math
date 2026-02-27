/**
 * Gerador de questões de matemática por ano escolar.
 *
 * Cada ano (1º ao 9º) possui faixas de números e operações
 * adequadas ao nível do aluno, seguindo as diretrizes da BNCC.
 * O padrão é 3º ano.
 *
 * Regras gerais:
 * - Divisões sempre com resultado inteiro
 * - Frações sempre com resultado inteiro (5º ano) ou fração simples (6º)
 * - Expressões nunca com resultado negativo (exceto 7º ano: negativeOps)
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
 *
 * BNCC — Fundamental 2 (inicial):
 * - 6º ano: potenciação, decimais, frações mesmo denominador, múltiplos/divisores
 * - 7º ano: negativos, proporções, expressões com parênteses, porcentagens
 */

export type Operation =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division"
  | "fraction"
  | "expression"
  /* 6º ano */
  | "exponentiation"
  | "decimal"
  | "sameDenomFraction"
  | "multiplesDivisors"
  /* 7º ano */
  | "negativeOps"
  | "proportion"
  | "parenthesesExpr"
  | "percentage"
  /* 8º ano */
  | "linearEquation"
  | "algebraExpr"
  | "powerRules"
  | "angles"
  /* 9º ano */
  | "squareRoot"
  | "quadraticEquation"
  | "scientificNotation"
  | "functionEval";

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
  /**
   * Display string para a opção esquerda (sobrescreve leftValue quando definida).
   * Usado para decimais ("3,8"), frações ("³⁄₅") e negativos ("−8").
   */
  leftDisplay?: string;
  /**
   * Display string para a opção direita (sobrescreve rightValue quando definida).
   */
  rightDisplay?: string;
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
 * Offset de ±1 a ±maxOffset, garantindo que seja diferente da correta.
 * Se allowNegative = false (padrão), resultado ≥ 0.
 */
function generateWrongAnswer(
  correct: number,
  maxOffset: number = 5,
  allowNegative: boolean = false,
): number {
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    const offset = randInt(1, maxOffset) * pick([1, -1]);
    const wrong = correct + offset;
    if (wrong !== correct && (allowNegative || wrong >= 0)) return wrong;
  }
  // Fallback: sempre diferente
  return correct >= 1 || allowNegative ? correct - 1 : correct + 1;
}

/** Máximo divisor comum (para porcentagens). */
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/* ── Unicode helpers ─────────────────────────────────────────── */

const SUPERSCRIPTS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUBSCRIPTS = "₀₁₂₃₄₅₆₇₈₉";

/** Converte número para dígitos Unicode sobrescritos: 23 → "²³" */
function toSuperscript(n: number): string {
  return String(n)
    .split("")
    .map((d) => SUPERSCRIPTS[Number(d)])
    .join("");
}

/** Converte número para dígitos Unicode subscritos: 5 → "₅" */
function toSubscript(n: number): string {
  return String(n)
    .split("")
    .map((d) => SUBSCRIPTS[Number(d)])
    .join("");
}

/** Formata número com 1 casa decimal no padrão brasileiro: 3.8 → "3,8" */
function formatDecimalBR(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

/** Formata número com sinal Unicode menos: -8 → "−8", 2 → "2" */
function formatNegative(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : String(n);
}

/** Retorna todos os divisores de n (excluindo 1 e n). */
function getDivisorsInner(n: number): number[] {
  const divs: number[] = [];
  for (let i = 2; i < n; i++) {
    if (n % i === 0) divs.push(i);
  }
  return divs;
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
 * Configuração por ano escolar (#44 + #45 + #46 + #47 BNCC)
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
 *
 * Campos do 6º ano (#47):
 * - `expBases`: [min, max] para a base de potenciação
 * - `expExponents`: expoentes permitidos (ex: [2, 3])
 * - `decimalRange`: [min, max] dos operandos em décimos (ex: [10, 99] → 1,0 a 9,9)
 * - `sameDenomDenominators`: denominadores permitidos (ex: [3, 4, 5, 6, 8])
 * - `multiplesRange`: [min, max] para a base de múltiplos/divisores
 *
 * Campos do 7º ano (#47):
 * - `negativeRange`: [min, max] dos operandos positivos (exibidos com sinal −)
 * - `proportionRatios`: razões permitidas (ex: [2, 3, 4, 5])
 * - `parenthesesRange`: [min, max] dos operandos em expressões com parênteses
 * - `percentages`: porcentagens permitidas (ex: [10, 20, 25, 50, 75])
 * - `percentageWholeRange`: [min, max] do número inteiro para porcentagens
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
  /* 6º ano */
  expBases?: [number, number];
  expExponents?: number[];
  decimalRange?: [number, number];
  sameDenomDenominators?: number[];
  multiplesRange?: [number, number];
  /* 7º ano */
  negativeRange?: [number, number];
  proportionRatios?: number[];
  parenthesesRange?: [number, number];
  percentages?: number[];
  percentageWholeRange?: [number, number];
  /* 8º ano */
  linearEqRange?: [number, number];
  algebraExprRange?: [number, number];
  powerRuleBases?: number[];
  powerRuleExpRange?: [number, number];
  /* 9º ano */
  perfectSquares?: number[];
  quadraticSquares?: number[];
  sciNotCoeffRange?: [number, number];
  sciNotExpRange?: [number, number];
  functionCoeffRange?: [number, number];
  functionConstRange?: [number, number];
  functionInputRange?: [number, number];
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

  /* ── Fundamental 2 — inicial (#47) ─────────────────────────── */

  /**
   * 6º ano — BNCC:
   * - Potenciação simples (ex: 2³ = 8)
   * - Operações com decimais (ex: 1,5 + 2,3 = 3,8)
   * - Frações: adição/subtração com mesmo denominador (ex: ²⁄₅ + ¹⁄₅ = ³⁄₅)
   * - Múltiplos e divisores (ex: múltiplo de 6 = ?)
   * - Mantém as 4 operações básicas com números maiores
   */
  6: {
    operations: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "exponentiation",
      "decimal",
      "sameDenomFraction",
      "multiplesDivisors",
    ],
    add: [100, 999, 100, 999],
    sub: [200, 999, 100],
    mul: [5, 20, 5, 20],
    div: [5, 20, 3, 15],
    wrongOffset: 10,
    expBases: [2, 10],
    expExponents: [2, 3],
    decimalRange: [10, 99],
    sameDenomDenominators: [3, 4, 5, 6, 8],
    multiplesRange: [2, 12],
  },

  /**
   * 7º ano — BNCC:
   * - Números negativos: operações básicas (ex: −3 + 5 = 2)
   * - Proporções simples (ex: Se 2 → 6, 4 → ?)
   * - Expressões com parênteses (ex: (3 + 2) × 4 = 20)
   * - Porcentagens simples (ex: 10% de 200 = 20)
   * - Mantém as 4 operações básicas com números maiores
   */
  7: {
    operations: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "negativeOps",
      "proportion",
      "parenthesesExpr",
      "percentage",
    ],
    add: [200, 999, 200, 999],
    sub: [300, 999, 100],
    mul: [10, 25, 5, 20],
    div: [5, 25, 3, 20],
    wrongOffset: 10,
    negativeRange: [1, 10],
    proportionRatios: [2, 3, 4, 5],
    parenthesesRange: [2, 10],
    percentages: [10, 20, 25, 50, 75],
    percentageWholeRange: [20, 500],
  },

  /* ── Fundamental 2 — avançado (#48) ─────────────────────────── */

  /**
   * 8º ano — BNCC:
   * - Equações de 1º grau simples (ex: x + 3 = 7, x = ?)
   * - Expressões algébricas (ex: 2x quando x = 5, resultado = ?)
   * - Operações com potências de mesma base (ex: 2⁴ × 2² = 2? → expoente?)
   * - Ângulos complementares (soma = 90°) e suplementares (soma = 180°)
   * - Mantém 4 operações básicas com números maiores
   */
  8: {
    operations: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "linearEquation",
      "algebraExpr",
      "powerRules",
      "angles",
    ],
    add: [300, 999, 200, 999],
    sub: [300, 999, 200],
    mul: [10, 30, 10, 25],
    div: [10, 30, 5, 20],
    wrongOffset: 15,
    linearEqRange: [1, 20],
    algebraExprRange: [1, 10],
    powerRuleBases: [2, 3, 5, 10],
    powerRuleExpRange: [1, 5],
  },

  /**
   * 9º ano — BNCC:
   * - Raízes quadradas (ex: √49 = ?)
   * - Equações de 2º grau simples (ex: x² = 16, x = ?)
   * - Notação científica (ex: 3 × 10² = ?)
   * - Funções: dado f(x) = 2x + 1, f(3) = ?
   * - Mantém 4 operações básicas com números maiores
   */
  9: {
    operations: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "squareRoot",
      "quadraticEquation",
      "scientificNotation",
      "functionEval",
    ],
    add: [500, 999, 200, 999],
    sub: [500, 999, 200],
    mul: [10, 30, 10, 30],
    div: [10, 30, 5, 25],
    wrongOffset: 15,
    perfectSquares: [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144],
    quadraticSquares: [1, 4, 9, 16, 25, 36, 49, 64, 81, 100],
    sciNotCoeffRange: [1, 9],
    sciNotExpRange: [1, 4],
    functionCoeffRange: [2, 5],
    functionConstRange: [1, 10],
    functionInputRange: [1, 10],
  },
};

/* ── Resultado interno dos geradores ─────────────────────────── */

interface GeneratorResult {
  text: string;
  answer: number;
  /** Offset custom para a resposta errada (sobrescreve cfg.wrongOffset). */
  wrongOffset?: number;
  /** Resposta errada pré-calculada (bypassa generateWrongAnswer). */
  wrongAnswer?: number;
  /** Display string para a resposta correta. */
  displayCorrect?: string;
  /** Display string para a resposta errada. */
  displayWrong?: string;
  /** Se true, a resposta errada pode ser negativa. */
  allowNegativeWrong?: boolean;
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
  const adaptiveOffset = Math.max(
    2,
    Math.min(cfg.wrongOffset, Math.ceil(answer / 3)),
  );

  return {
    text: `${frac.symbol} de ${whole} = ?`,
    answer,
    wrongOffset: adaptiveOffset,
  };
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

/* ═══════════════════════════════════════════════════════
 * Geradores do 6º ano (#47)
 * ═══════════════════════════════════════════════════════ */

/**
 * Potenciação simples.
 *
 * Exemplo: "2³ = ?" → resposta 8.
 * Exibe o expoente com sobrescrito Unicode para acessibilidade visual.
 * Narração: "2 elevado a 3".
 */
function generateExponentiation(cfg: GradeConfig): GeneratorResult {
  const [baseMin, baseMax] = cfg.expBases ?? [2, 10];
  const exponents = cfg.expExponents ?? [2, 3];

  const base = randInt(baseMin, baseMax);
  const exp = pick(exponents);
  const answer = Math.pow(base, exp);

  return {
    text: `${base}${toSuperscript(exp)} = ?`,
    answer,
  };
}

/**
 * Operações com decimais (1 casa decimal, formato brasileiro).
 *
 * Exemplo: "1,5 + 2,3 = ?" → resposta 3,8.
 * Toda aritmética é feita em décimos (inteiros) para evitar
 * imprecisão de ponto flutuante.
 *
 * Ambas as opções de resposta exibem display com vírgula.
 */
function generateDecimal(cfg: GradeConfig): GeneratorResult {
  const [min10, max10] = cfg.decimalRange ?? [10, 99];
  const isAdd = pick([true, false]);

  let a10: number, b10: number, result10: number;

  if (isAdd) {
    a10 = randInt(min10, max10);
    b10 = randInt(min10, max10);
    result10 = a10 + b10;
  } else {
    a10 = randInt(min10, max10);
    b10 = randInt(min10, a10); // resultado ≥ 0
    result10 = a10 - b10;
  }

  const a = a10 / 10;
  const b = b10 / 10;
  const answer = result10 / 10;

  const op = isAdd ? "+" : "-";
  const text = `${formatDecimalBR(a)} ${op} ${formatDecimalBR(b)} = ?`;

  // Resposta errada: offset de ±1 a ±3 em décimos
  let wrong10 = result10;
  for (let i = 0; i < 20; i++) {
    const offset = randInt(1, 3) * pick([1, -1]);
    const candidate = result10 + offset;
    if (candidate !== result10 && candidate >= 0) {
      wrong10 = candidate;
      break;
    }
  }
  if (wrong10 === result10) wrong10 = result10 + 1;

  const wrongAnswer = wrong10 / 10;

  return {
    text,
    answer,
    wrongAnswer,
    displayCorrect: formatDecimalBR(answer),
    displayWrong: formatDecimalBR(wrongAnswer),
  };
}

/**
 * Frações com mesmo denominador (adição e subtração).
 *
 * Exemplo: "²⁄₅ + ¹⁄₅ = ?" → resposta ³⁄₅.
 * O resultado é uma fração própria ou igual a 1 (≤ denominador).
 * Exibe numeradores e denominadores com Unicode sobrescrito/subscrito.
 *
 * A resposta interna (correctAnswer) é o numerador do resultado,
 * facilitando a geração do distrator (numerador ± 1).
 */
function generateSameDenomFraction(cfg: GradeConfig): GeneratorResult {
  const denoms = cfg.sameDenomDenominators ?? [3, 4, 5, 6, 8];
  const d = pick(denoms);
  const isAdd = pick([true, false]);

  let n1: number, n2: number, resultNum: number;

  if (isAdd) {
    // n1 + n2 ≤ d (fração própria ou = 1)
    n1 = randInt(1, d - 1);
    n2 = randInt(1, d - n1);
    resultNum = n1 + n2;
  } else {
    // n1 > n2, resultado > 0
    n1 = randInt(2, d - 1);
    n2 = randInt(1, n1 - 1);
    resultNum = n1 - n2;
  }

  const opChar = isAdd ? "+" : "−";
  const text = `${toSuperscript(n1)}⁄${toSubscript(d)} ${opChar} ${toSuperscript(n2)}⁄${toSubscript(d)} = ?`;

  // Distrator: numerador ± 1, limitado a [1, d]
  let wrongNum = resultNum + pick([1, -1]);
  if (wrongNum === resultNum || wrongNum < 1) wrongNum = resultNum + 1;
  if (wrongNum > d) wrongNum = resultNum - 1;
  if (wrongNum < 1) wrongNum = 1;
  // Garante diferente
  if (wrongNum === resultNum) wrongNum = resultNum === d ? d - 1 : resultNum + 1;

  return {
    text,
    answer: resultNum,
    wrongAnswer: wrongNum,
    displayCorrect: `${toSuperscript(resultNum)}⁄${toSubscript(d)}`,
    displayWrong: `${toSuperscript(wrongNum)}⁄${toSubscript(d)}`,
  };
}

/**
 * Múltiplos e divisores.
 *
 * Dois subtipos alternados:
 * - "Múltiplo de 6 = ?" → opção correta é múltiplo, incorreta não é
 * - "Divisor de 24 = ?" → opção correta é divisor, incorreta não é
 *
 * Distratores são números próximos que NÃO são múltiplos/divisores,
 * o que exige raciocínio e não apenas aproximação numérica.
 */
function generateMultiplesDivisors(cfg: GradeConfig): GeneratorResult {
  const [min, max] = cfg.multiplesRange ?? [2, 12];

  if (pick([true, false])) {
    /* ── Múltiplo ── */
    const base = randInt(min, max);
    const multiplier = randInt(2, 10);
    const answer = base * multiplier;

    // Distrator: número próximo que NÃO é múltiplo de base
    let wrong = answer + 1;
    for (let offset = 1; offset <= 5; offset++) {
      for (const dir of [1, -1]) {
        const candidate = answer + offset * dir;
        if (candidate > 0 && candidate % base !== 0) {
          wrong = candidate;
          offset = 6; // break outer
          break;
        }
      }
    }

    return { text: `Múltiplo de ${base} = ?`, answer, wrongAnswer: wrong };
  } else {
    /* ── Divisor ── */
    // Números com vários divisores internos
    const numbers = [12, 18, 20, 24, 30, 36, 48, 60];
    const n = pick(numbers);
    const divisors = getDivisorsInner(n);
    if (divisors.length === 0) {
      // Fallback raro: troca para múltiplo
      return generateMultiplesDivisors(cfg);
    }

    const answer = pick(divisors);

    // Distrator: número próximo que NÃO é divisor de n
    let wrong = answer + 1;
    for (let offset = 1; offset <= 5; offset++) {
      for (const dir of [1, -1]) {
        const candidate = answer + offset * dir;
        if (candidate > 1 && n % candidate !== 0) {
          wrong = candidate;
          offset = 6; // break outer
          break;
        }
      }
    }

    return { text: `Divisor de ${n} = ?`, answer, wrongAnswer: wrong };
  }
}

/* ═══════════════════════════════════════════════════════
 * Geradores do 7º ano (#47)
 * ═══════════════════════════════════════════════════════ */

/**
 * Operações com números negativos.
 *
 * Formatos:
 * - "−a + b = ?" (negativo + positivo)
 * - "−a − b = ?" (negativo − positivo, resultado sempre negativo)
 *
 * Respostas podem ser negativas. Exibe números negativos com
 * sinal Unicode (−) para clareza visual.
 */
function generateNegativeOps(cfg: GradeConfig): GeneratorResult {
  const [min, max] = cfg.negativeRange ?? [1, 10];

  const a = randInt(min, max);
  const b = randInt(min, max);

  let answer: number;
  let text: string;

  if (pick([true, false])) {
    // −a + b
    answer = -a + b;
    text = `−${a} + ${b} = ?`;
  } else {
    // −a − b (sempre negativo)
    answer = -(a + b);
    text = `−${a} − ${b} = ?`;
  }

  // Gera resposta errada permitindo negativo
  const maxOffset = cfg.wrongOffset;
  let wrongAnswer = answer + 1;
  for (let i = 0; i < 20; i++) {
    const offset = randInt(1, maxOffset) * pick([1, -1]);
    const candidate = answer + offset;
    if (candidate !== answer) {
      wrongAnswer = candidate;
      break;
    }
  }

  return {
    text,
    answer,
    wrongAnswer,
    displayCorrect: formatNegative(answer),
    displayWrong: formatNegative(wrongAnswer),
  };
}

/**
 * Proporções simples.
 *
 * Exemplo: "Se 2 → 6, 4 → ?" → resposta 12.
 * O aluno identifica a razão (×3) e aplica ao novo valor.
 * Sempre com resultado inteiro.
 */
function generateProportion(cfg: GradeConfig): GeneratorResult {
  const ratios = cfg.proportionRatios ?? [2, 3, 4, 5];
  const ratio = pick(ratios);

  const a = randInt(2, 5);
  const b = a * ratio;

  // c é um múltiplo de a (diferente de a e de b)
  const multipliers = [2, 3, 4, 5].filter((m) => m * a !== b && m !== 1);
  const multiplier = pick(multipliers.length > 0 ? multipliers : [2, 3]);
  const c = a * multiplier;
  const answer = c * ratio;

  return {
    text: `Se ${a} → ${b}, ${c} → ?`,
    answer,
  };
}

/**
 * Expressões com parênteses.
 *
 * Exemplo: "(3 + 2) × 4 = ?" → resposta 20.
 * Os parênteses mudam a ordem de operações — o aluno deve
 * resolver o que está dentro primeiro.
 *
 * Formatos: (a + b) × c ou (a − b) × c (subtração só se a > b).
 */
function generateParenthesesExpr(cfg: GradeConfig): GeneratorResult {
  const [min, max] = cfg.parenthesesRange ?? [2, 10];

  const a = randInt(min, max);
  const b = randInt(min, max);
  const c = randInt(min, max);

  if (pick([true, false]) && a > b) {
    return {
      text: `(${a} − ${b}) × ${c} = ?`,
      answer: (a - b) * c,
    };
  }

  return {
    text: `(${a} + ${b}) × ${c} = ?`,
    answer: (a + b) * c,
  };
}

/**
 * Porcentagens simples.
 *
 * Exemplo: "10% de 200 = ?" → resposta 20.
 * O inteiro é sempre escolhido para que o resultado seja inteiro.
 * Porcentagens usadas: 10%, 20%, 25%, 50%, 75%.
 */
function generatePercentage(cfg: GradeConfig): GeneratorResult {
  const pcts = cfg.percentages ?? [10, 20, 25, 50, 75];
  const pct = pick(pcts);
  const [wholeMin, wholeMax] = cfg.percentageWholeRange ?? [20, 500];

  // Factor mínimo do inteiro para resultado inteiro
  const factor = 100 / gcd(pct, 100);
  const minM = Math.ceil(wholeMin / factor);
  const maxM = Math.floor(wholeMax / factor);
  const whole = randInt(minM, maxM) * factor;

  const answer = (whole * pct) / 100;

  return {
    text: `${pct}% de ${whole} = ?`,
    answer,
  };
}

/* ═══════════════════════════════════════════════════════
 * Geradores do 8º ano (#48)
 * ═══════════════════════════════════════════════════════ */

/**
 * Equação de 1º grau simples.
 *
 * Formatos:
 * - "x + a = b" → resposta: b − a
 * - "x − a = b" → resposta: b + a
 * - "a × x = b" → resposta: b ÷ a (sempre inteiro)
 *
 * Exibe a incógnita 'x' de forma clara e grande.
 * Narração: "x mais 3 igual a 7, x é quanto?"
 */
function generateLinearEquation(cfg: GradeConfig): GeneratorResult {
  const [min, max] = cfg.linearEqRange ?? [1, 20];
  const type = pick(["add", "sub", "mul"] as const);

  if (type === "add") {
    // x + a = b → x = b − a
    const x = randInt(min, max);
    const a = randInt(min, max);
    const b = x + a;
    return { text: `x + ${a} = ${b}, x = ?`, answer: x };
  } else if (type === "sub") {
    // x − a = b → x = b + a
    const a = randInt(min, Math.floor(max / 2));
    const b = randInt(min, max);
    const x = b + a;
    return { text: `x − ${a} = ${b}, x = ?`, answer: x };
  } else {
    // a × x = b → x = b ÷ a
    const a = randInt(2, Math.min(10, max));
    const x = randInt(min, max);
    const b = a * x;
    return { text: `${a} × x = ${b}, x = ?`, answer: x };
  }
}

/**
 * Expressões algébricas.
 *
 * Formatos:
 * - "ax, x = n" → resposta: a × n
 * - "ax + b, x = n" → resposta: a × n + b
 * - "ax − b, x = n" → resposta: a × n − b (sempre ≥ 0)
 *
 * Narração: "2x quando x vale 5, resultado?"
 */
function generateAlgebraExpr(cfg: GradeConfig): GeneratorResult {
  const [min, max] = cfg.algebraExprRange ?? [1, 10];

  const a = randInt(2, Math.min(9, max));
  const xVal = randInt(min, max);

  // 3 subtipos: simples, com adição, com subtração
  const type = pick(["simple", "add", "sub"] as const);

  if (type === "simple") {
    return { text: `${a}x, x = ${xVal} → ?`, answer: a * xVal };
  } else if (type === "add") {
    const b = randInt(1, max);
    return { text: `${a}x + ${b}, x = ${xVal} → ?`, answer: a * xVal + b };
  } else {
    const product = a * xVal;
    const b = randInt(1, Math.min(max, product));
    return { text: `${a}x − ${b}, x = ${xVal} → ?`, answer: product - b };
  }
}

/**
 * Operações com potências de mesma base.
 *
 * Formato: "b^m × b^n = b^?" → resposta: m + n (expoente)
 *
 * Exibe com sobrescritos Unicode: "2⁴ × 2² = 2?"
 * Narração: "2 elevado a 4 vezes 2 elevado a 2 igual a 2 elevado a quanto?"
 */
function generatePowerRules(cfg: GradeConfig): GeneratorResult {
  const bases = cfg.powerRuleBases ?? [2, 3, 5, 10];
  const [expMin, expMax] = cfg.powerRuleExpRange ?? [1, 5];

  const base = pick(bases);
  const m = randInt(expMin, expMax);
  const n = randInt(expMin, expMax);
  const answer = m + n;

  return {
    text: `${base}${toSuperscript(m)} × ${base}${toSuperscript(n)} = ${base}?`,
    answer,
  };
}

/**
 * Ângulos complementares e suplementares.
 *
 * - Complementar: "Complementar de 30° = ?" → 90° − 30° = 60°
 * - Suplementar: "Suplementar de 120° = ?" → 180° − 120° = 60°
 *
 * Garante resultado > 0 e inteiro (múltiplos de 5° ou 10°).
 */
function generateAngles(cfg: GradeConfig): GeneratorResult {
  const isComplementary = pick([true, false]);

  if (isComplementary) {
    // Complementar: ângulo de 5° a 85° (múltiplo de 5)
    const angle = randInt(1, 17) * 5; // 5, 10, ..., 85
    const answer = 90 - angle;
    return {
      text: `Complementar de ${angle}° = ?°`,
      answer,
    };
  } else {
    // Suplementar: ângulo de 10° a 170° (múltiplo de 10)
    const angle = randInt(1, 17) * 10; // 10, 20, ..., 170
    const answer = 180 - angle;
    return {
      text: `Suplementar de ${angle}° = ?°`,
      answer,
    };
  }
}

/* ═══════════════════════════════════════════════════════
 * Geradores do 9º ano (#48)
 * ═══════════════════════════════════════════════════════ */

/**
 * Raízes quadradas.
 *
 * Formato: "√49 = ?" → resposta: 7
 *
 * Usa apenas quadrados perfeitos para resultado inteiro.
 * Exibe símbolo √ grande para acessibilidade visual.
 * Narração: "raiz quadrada de 49?"
 */
function generateSquareRoot(cfg: GradeConfig): GeneratorResult {
  const squares = cfg.perfectSquares ?? [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
  const n = pick(squares);
  const answer = Math.round(Math.sqrt(n));

  return {
    text: `√${n} = ?`,
    answer,
  };
}

/**
 * Equação de 2º grau simples.
 *
 * Formato: "x² = 16, x = ?" → resposta: 4 (raiz positiva)
 *
 * Usa apenas quadrados perfeitos.
 * Narração: "x ao quadrado igual a 16, x é quanto?"
 */
function generateQuadraticEquation(cfg: GradeConfig): GeneratorResult {
  const squares = cfg.quadraticSquares ?? [1, 4, 9, 16, 25, 36, 49, 64, 81, 100];
  const n = pick(squares);
  const answer = Math.round(Math.sqrt(n));

  return {
    text: `x² = ${n}, x = ?`,
    answer,
  };
}

/**
 * Notação científica.
 *
 * Formato: "a × 10^n = ?" → resposta: a × 10^n (expandido)
 *
 * Exemplo: "3 × 10² = ?" → 300
 * Exibe expoente com sobrescrito Unicode.
 * Narração: "3 vezes 10 elevado a 2?"
 */
function generateScientificNotation(cfg: GradeConfig): GeneratorResult {
  const [coeffMin, coeffMax] = cfg.sciNotCoeffRange ?? [1, 9];
  const [expMin, expMax] = cfg.sciNotExpRange ?? [1, 4];

  const coeff = randInt(coeffMin, coeffMax);
  const exp = randInt(expMin, expMax);
  const answer = coeff * Math.pow(10, exp);

  return {
    text: `${coeff} × 10${toSuperscript(exp)} = ?`,
    answer,
  };
}

/**
 * Funções (avaliação).
 *
 * Formato: "f(x) = ax + b, f(n) = ?" → resposta: a × n + b
 *
 * Exemplo: "f(x) = 2x + 1, f(3) = ?" → 7
 * Narração: "f de x igual a 2x mais 1, f de 3?"
 */
function generateFunctionEval(cfg: GradeConfig): GeneratorResult {
  const [coeffMin, coeffMax] = cfg.functionCoeffRange ?? [2, 5];
  const [constMin, constMax] = cfg.functionConstRange ?? [1, 10];
  const [inputMin, inputMax] = cfg.functionInputRange ?? [1, 10];

  const a = randInt(coeffMin, coeffMax);
  const b = randInt(constMin, constMax);
  const x = randInt(inputMin, inputMax);
  const answer = a * x + b;

  // Alternates between + and −, ensuring non-negative result
  if (pick([true, false]) && a * x > b) {
    return {
      text: `f(x) = ${a}x − ${b}, f(${x}) = ?`,
      answer: a * x - b,
    };
  }

  return {
    text: `f(x) = ${a}x + ${b}, f(${x}) = ?`,
    answer,
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
  /* 6º ano */
  exponentiation: generateExponentiation,
  decimal: generateDecimal,
  sameDenomFraction: generateSameDenomFraction,
  multiplesDivisors: generateMultiplesDivisors,
  /* 7º ano */
  negativeOps: generateNegativeOps,
  proportion: generateProportion,
  parenthesesExpr: generateParenthesesExpr,
  percentage: generatePercentage,
  /* 8º ano */
  linearEquation: generateLinearEquation,
  algebraExpr: generateAlgebraExpr,
  powerRules: generatePowerRules,
  angles: generateAngles,
  /* 9º ano */
  squareRoot: generateSquareRoot,
  quadraticEquation: generateQuadraticEquation,
  scientificNotation: generateScientificNotation,
  functionEval: generateFunctionEval,
};

/**
 * Gera uma questão de matemática adequada ao ano escolar.
 *
 * @param operation — operação específica, ou omita para sortear entre as disponíveis no ano.
 * @param schoolYear — ano escolar (1 a 9). Padrão: 3.
 */
export function generateQuestion(
  operation?: Operation,
  schoolYear: number = 3,
): MathQuestion {
  const grade = Math.max(1, Math.min(9, Math.round(schoolYear)));
  const cfg = GRADE_CONFIGS[grade] ?? GRADE_CONFIGS[3];

  // Se a operação solicitada não está disponível no ano, sorteia uma válida
  const op =
    operation && cfg.operations.includes(operation)
      ? operation
      : pick<Operation>(cfg.operations);

  const result = generators[op](cfg);

  // Resposta errada: usa a pré-calculada ou gera via offset
  const wrongAnswer =
    result.wrongAnswer !== undefined
      ? result.wrongAnswer
      : generateWrongAnswer(
          result.answer,
          result.wrongOffset ?? cfg.wrongOffset,
          result.allowNegativeWrong,
        );

  const correctSide: "left" | "right" = pick(["left", "right"]);

  const leftValue = correctSide === "left" ? result.answer : wrongAnswer;
  const rightValue = correctSide === "right" ? result.answer : wrongAnswer;

  const question: MathQuestion = {
    text: result.text,
    correctAnswer: result.answer,
    wrongAnswer,
    correctSide,
    leftValue,
    rightValue,
  };

  // Adiciona display strings quando o gerador as fornece
  if (result.displayCorrect !== undefined && result.displayWrong !== undefined) {
    question.leftDisplay =
      correctSide === "left" ? result.displayCorrect : result.displayWrong;
    question.rightDisplay =
      correctSide === "right" ? result.displayCorrect : result.displayWrong;
  }

  return question;
}

/**
 * Retorna as operações disponíveis para um dado ano escolar.
 * Útil para testes e validação.
 */
export function getOperationsForGrade(schoolYear: number): Operation[] {
  const grade = Math.max(1, Math.min(9, Math.round(schoolYear)));
  return (GRADE_CONFIGS[grade] ?? GRADE_CONFIGS[3]).operations;
}
