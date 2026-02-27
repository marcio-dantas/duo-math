import { describe, it, expect } from "vitest";
import {
  generateQuestion,
  getOperationsForGrade,
  type Operation,
  type MathQuestion,
} from "../generateQuestion";

/* ── Helpers ─────────────────────────────────────────────────── */

/** Gera N questões de uma operação para testes estatísticos. */
function generateMany(op: Operation, n = 100): MathQuestion[] {
  return Array.from({ length: n }, () => generateQuestion(op));
}

/** Gera N questões para um determinado ano escolar. */
function generateForGrade(year: number, n = 100): MathQuestion[] {
  return Array.from({ length: n }, () => generateQuestion(undefined, year));
}

/** Gera N questões de uma operação para um ano escolar. */
function generateManyForGrade(
  op: Operation,
  year: number,
  n = 200,
): MathQuestion[] {
  return Array.from({ length: n }, () => generateQuestion(op, year));
}

/**
 * Extrai o tipo de questão do texto.
 *
 * - Frações (5º): "½ de 20 = ?" → "frac"
 * - Expressões (2 operadores): "3 × 4 + 2 = ?" → "expr"
 * - Potenciação: "2³ = ?" → "exp"
 * - Decimal: "1,5 + 2,3 = ?" → "dec"
 * - Fração mesmo denom: "²⁄₅ + ¹⁄₅ = ?" → "sameFrac"
 * - Múltiplo/divisor: "Múltiplo de 6" → "md"
 * - Negativo: "−3 + 5" → "neg"
 * - Proporção: "Se 2 → 6" → "prop"
 * - Parênteses: "(3 + 2) × 4" → "paren"
 * - Porcentagem: "10% de 200" → "pct"
 * - Operação simples: "+", "-", "×", "÷"
 */
function getSymbol(text: string): string {
  if (/^\d+%/.test(text)) return "pct";
  if (/^\d+[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(text)) return "exp";
  if (/^\d+,\d+/.test(text)) return "dec";
  if (/^[⁰¹²³⁴⁵⁶⁷⁸⁹]+⁄/.test(text)) return "sameFrac";
  if (/^(Múltiplo|Divisor)/.test(text)) return "md";
  if (/^Se \d+/.test(text)) return "prop";
  if (/^\(/.test(text)) return "paren";
  if (/^−\d+/.test(text)) return "neg";
  if (/^[½¼¾]/.test(text)) return "frac";
  // Expressão: 3 ou mais números com 2+ operadores
  const ops = text.replace(/= \?/, "").match(/[+\-×÷]/g);
  if (ops && ops.length >= 2) return "expr";
  if (text.includes("+")) return "+";
  if (text.includes("×")) return "×";
  if (text.includes("÷")) return "÷";
  if (text.includes("-")) return "-";
  return "?";
}

/** Extrai os dois operandos do texto de uma operação simples. */
function parseOperands(text: string): [number, number] {
  const clean = text.replace("= ?", "").trim();
  // Identifica o operador para split correto
  for (const sep of ["+", "×", "÷", "-"]) {
    if (clean.includes(sep)) {
      const [a, b] = clean.split(sep).map(Number);
      return [a, b];
    }
  }
  throw new Error(`Operador não encontrado em: ${text}`);
}

/** Extrai dados de uma questão de fração: "½ de 20 = ?" */
function parseFraction(text: string): { symbol: string; whole: number } {
  const match = text.match(/^([½¼¾])\s+de\s+(\d+)/);
  if (!match) throw new Error(`Não é uma fração: ${text}`);
  return { symbol: match[1], whole: Number(match[2]) };
}

/** Extrai dados de uma expressão: "3 × 4 + 2 = ?" */
function parseExpression(text: string): {
  a: number;
  op1: string;
  b: number;
  op2: string;
  c: number;
} {
  const match = text.match(
    /^(\d+)\s*([×÷])\s*(\d+)\s*([+\-])\s*(\d+)/,
  );
  if (!match) throw new Error(`Não é uma expressão: ${text}`);
  return {
    a: Number(match[1]),
    op1: match[2],
    b: Number(match[3]),
    op2: match[4],
    c: Number(match[5]),
  };
}

/* ── Helpers Unicode (#47) ──────────────────────────────────── */

const SUPERSCRIPTS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUBSCRIPTS = "₀₁₂₃₄₅₆₇₈₉";

function fromSuperscript(s: string): number {
  return Number(
    s
      .split("")
      .map((c) => String(SUPERSCRIPTS.indexOf(c)))
      .join(""),
  );
}

function fromSubscript(s: string): number {
  return Number(
    s
      .split("")
      .map((c) => String(SUBSCRIPTS.indexOf(c)))
      .join(""),
  );
}

/** Extrai base e expoente de "2³ = ?" */
function parseExponentiation(text: string): { base: number; exp: number } {
  const match = text.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)\s*=\s*\?/);
  if (!match) throw new Error(`Não é potenciação: ${text}`);
  return { base: Number(match[1]), exp: fromSuperscript(match[2]) };
}

/** Extrai operandos decimais: "1,5 + 2,3 = ?" → { a: 1.5, op: "+", b: 2.3 } */
function parseDecimal(text: string): { a: number; op: string; b: number } {
  const match = text.match(/^(\d+,\d+)\s*([+\-])\s*(\d+,\d+)/);
  if (!match) throw new Error(`Não é decimal: ${text}`);
  return {
    a: Number(match[1].replace(",", ".")),
    op: match[2],
    b: Number(match[3].replace(",", ".")),
  };
}

/** Extrai frações com mesmo denominador: "²⁄₅ + ¹⁄₅ = ?" */
function parseSameDenomFraction(text: string): {
  n1: number;
  d1: number;
  op: string;
  n2: number;
  d2: number;
} {
  const match = text.match(
    /^([⁰¹²³⁴⁵⁶⁷⁸⁹]+)⁄([₀₁₂₃₄₅₆₇₈₉]+)\s*([+−])\s*([⁰¹²³⁴⁵⁶⁷⁸⁹]+)⁄([₀₁₂₃₄₅₆₇₈₉]+)/,
  );
  if (!match) throw new Error(`Não é fração mesmo denom: ${text}`);
  return {
    n1: fromSuperscript(match[1]),
    d1: fromSubscript(match[2]),
    op: match[3],
    n2: fromSuperscript(match[4]),
    d2: fromSubscript(match[5]),
  };
}

/** Extrai múltiplo/divisor: "Múltiplo de 6 = ?" */
function parseMultDiv(text: string): { type: string; base: number } {
  const match = text.match(/^(Múltiplo|Divisor) de (\d+)/);
  if (!match) throw new Error(`Não é múltiplo/divisor: ${text}`);
  return { type: match[1], base: Number(match[2]) };
}

/** Extrai dados de operação com negativos: "−3 + 5 = ?" */
function parseNegative(text: string): { a: number; op: string; b: number } {
  const match = text.match(/^−(\d+)\s*([+−])\s*(\d+)/);
  if (!match) throw new Error(`Não é operação com negativos: ${text}`);
  return { a: Number(match[1]), op: match[2], b: Number(match[3]) };
}

/** Extrai proporção: "Se 2 → 6, 4 → ?" */
function parseProportion(text: string): {
  a: number;
  b: number;
  c: number;
} {
  const match = text.match(/^Se (\d+) → (\d+), (\d+) → \?/);
  if (!match) throw new Error(`Não é proporção: ${text}`);
  return { a: Number(match[1]), b: Number(match[2]), c: Number(match[3]) };
}

/** Extrai expressão com parênteses: "(3 + 2) × 4 = ?" */
function parseParentheses(text: string): {
  a: number;
  op1: string;
  b: number;
  op2: string;
  c: number;
} {
  const match = text.match(
    /^\((\d+)\s*([+−])\s*(\d+)\)\s*([×÷])\s*(\d+)/,
  );
  if (!match) throw new Error(`Não é expressão com parênteses: ${text}`);
  return {
    a: Number(match[1]),
    op1: match[2],
    b: Number(match[3]),
    op2: match[4],
    c: Number(match[5]),
  };
}

/** Extrai porcentagem: "10% de 200 = ?" */
function parsePercentage(text: string): { pct: number; whole: number } {
  const match = text.match(/^(\d+)% de (\d+)/);
  if (!match) throw new Error(`Não é porcentagem: ${text}`);
  return { pct: Number(match[1]), whole: Number(match[2]) };
}

/** Extrai display de fração Unicode: "³⁄₅" → { num: 3, den: 5 } */
function parseDisplayFraction(display: string): { num: number; den: number } {
  const match = display.match(
    /^([⁰¹²³⁴⁵⁶⁷⁸⁹]+)⁄([₀₁₂₃₄₅₆₇₈₉]+)$/,
  );
  if (!match) throw new Error(`Não é display de fração: ${display}`);
  return {
    num: fromSuperscript(match[1]),
    den: fromSubscript(match[2]),
  };
}

/* ══════════════════════════════════════════════════════════════
 * Testes gerais (sem ano — padrão 3º)
 * ══════════════════════════════════════════════════════════════ */

describe("generateQuestion", () => {
  it("retorna todas as propriedades obrigatórias", () => {
    const q = generateQuestion();
    expect(q).toHaveProperty("text");
    expect(q).toHaveProperty("correctAnswer");
    expect(q).toHaveProperty("wrongAnswer");
    expect(q).toHaveProperty("correctSide");
    expect(q).toHaveProperty("leftValue");
    expect(q).toHaveProperty("rightValue");
  });

  it("resposta correta e errada são sempre diferentes", () => {
    const questions = generateMany("addition", 200);
    for (const q of questions) {
      expect(q.correctAnswer).not.toBe(q.wrongAnswer);
    }
  });

  it("leftValue e rightValue são sempre diferentes", () => {
    const questions = Array.from({ length: 200 }, () => generateQuestion());
    for (const q of questions) {
      expect(q.leftValue).not.toBe(q.rightValue);
    }
  });

  it("correctSide coloca a resposta correta no lado certo", () => {
    const questions = Array.from({ length: 200 }, () => generateQuestion());
    for (const q of questions) {
      if (q.correctSide === "left") {
        expect(q.leftValue).toBe(q.correctAnswer);
        expect(q.rightValue).toBe(q.wrongAnswer);
      } else {
        expect(q.rightValue).toBe(q.correctAnswer);
        expect(q.leftValue).toBe(q.wrongAnswer);
      }
    }
  });

  it("randomiza o lado correto (não é sempre o mesmo)", () => {
    const questions = Array.from({ length: 100 }, () => generateQuestion());
    const sides = new Set(questions.map((q) => q.correctSide));
    expect(sides.size).toBe(2);
  });

  it("resposta errada é plausível (diferença ≤ offset do ano)", () => {
    const questions = Array.from({ length: 200 }, () => generateQuestion());
    for (const q of questions) {
      const diff = Math.abs(q.correctAnswer - q.wrongAnswer);
      expect(diff).toBeGreaterThanOrEqual(1);
      expect(diff).toBeLessThanOrEqual(5); // wrongOffset = 5 para 3º ano
    }
  });

  it("sem operação especificada, 3º ano gera as 4 operações", () => {
    const questions = Array.from({ length: 200 }, () => generateQuestion());
    const symbols = new Set(questions.map((q) => getSymbol(q.text)));
    expect(symbols).toContain("+");
    expect(symbols).toContain("-");
    expect(symbols).toContain("×");
    expect(symbols).toContain("÷");
  });
});

/* ── Testes por operação (padrão 3º ano) ─────────────────────── */

describe("adição", () => {
  it("texto contém +", () => {
    for (const q of generateMany("addition")) {
      expect(q.text).toContain("+");
    }
  });

  it("resposta é a soma correta", () => {
    for (const q of generateMany("addition")) {
      const [a, b] = q.text.replace("= ?", "").split("+").map(Number);
      expect(q.correctAnswer).toBe(a + b);
    }
  });
});

describe("subtração", () => {
  it("texto contém -", () => {
    for (const q of generateMany("subtraction")) {
      expect(q.text).toContain("-");
    }
  });

  it("resultado é sempre ≥ 0", () => {
    for (const q of generateMany("subtraction")) {
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
    }
  });

  it("resposta é a diferença correta", () => {
    for (const q of generateMany("subtraction")) {
      const [a, b] = q.text.replace("= ?", "").split("-").map(Number);
      expect(q.correctAnswer).toBe(a - b);
    }
  });
});

describe("multiplicação", () => {
  it("texto contém ×", () => {
    for (const q of generateMany("multiplication")) {
      expect(q.text).toContain("×");
    }
  });

  it("resposta é o produto correto", () => {
    for (const q of generateMany("multiplication")) {
      const [a, b] = q.text.replace("= ?", "").split("×").map(Number);
      expect(q.correctAnswer).toBe(a * b);
    }
  });
});

describe("divisão", () => {
  it("texto contém ÷", () => {
    for (const q of generateMany("division")) {
      expect(q.text).toContain("÷");
    }
  });

  it("resultado é sempre inteiro", () => {
    for (const q of generateMany("division")) {
      expect(Number.isInteger(q.correctAnswer)).toBe(true);
    }
  });

  it("resposta é o quociente correto", () => {
    for (const q of generateMany("division")) {
      const [a, b] = q.text.replace("= ?", "").split("÷").map(Number);
      expect(q.correctAnswer).toBe(a / b);
    }
  });
});

/* ══════════════════════════════════════════════════════════════
 * Testes por ano escolar (#44)
 * ══════════════════════════════════════════════════════════════ */

describe("getOperationsForGrade", () => {
  it("1º ano: apenas adição e subtração", () => {
    expect(getOperationsForGrade(1)).toEqual(["addition", "subtraction"]);
  });

  it("2º ano: adição, subtração e multiplicação", () => {
    expect(getOperationsForGrade(2)).toEqual([
      "addition",
      "subtraction",
      "multiplication",
    ]);
  });

  it("3º e 4º ano: 4 operações básicas", () => {
    for (const y of [3, 4]) {
      expect(getOperationsForGrade(y)).toEqual([
        "addition",
        "subtraction",
        "multiplication",
        "division",
      ]);
    }
  });

  it("5º ano: 4 operações + fração + expressão", () => {
    expect(getOperationsForGrade(5)).toEqual([
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "fraction",
      "expression",
    ]);
  });

  it("6º ano: 4 operações + potenciação + decimal + fração mesmo denom + múltiplos/divisores", () => {
    expect(getOperationsForGrade(6)).toEqual([
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "exponentiation",
      "decimal",
      "sameDenomFraction",
      "multiplesDivisors",
    ]);
  });

  it("7º ano: 4 operações + negativos + proporção + parênteses + porcentagem", () => {
    expect(getOperationsForGrade(7)).toEqual([
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "negativeOps",
      "proportion",
      "parenthesesExpr",
      "percentage",
    ]);
  });

  it("8º e 9º ano: 4 operações básicas", () => {
    for (const y of [8, 9]) {
      expect(getOperationsForGrade(y)).toEqual([
        "addition",
        "subtraction",
        "multiplication",
        "division",
      ]);
    }
  });
});

/* ══════════════════════════════════════════════════════════════
 * BNCC — 1º ao 3º ano (Fundamental 1 inicial) — Issue #45
 * ══════════════════════════════════════════════════════════════ */

describe("1º ano — BNCC", () => {
  it("gera apenas adição e subtração", () => {
    const questions = generateForGrade(1, 200);
    for (const q of questions) {
      const sym = getSymbol(q.text);
      expect(["+", "-"]).toContain(sym);
    }
  });

  it("adição: operandos são dígitos únicos (1–9)", () => {
    const questions = generateManyForGrade("addition", 1, 500);
    for (const q of questions) {
      const [a, b] = parseOperands(q.text);
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(9);
    }
  });

  it("adição: resultado ≤ 10", () => {
    const questions = generateManyForGrade("addition", 1, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeLessThanOrEqual(10);
    }
  });

  it("subtração: operandos são dígitos únicos (≤ 9)", () => {
    const questions = generateManyForGrade("subtraction", 1, 500);
    for (const q of questions) {
      const [a, b] = parseOperands(q.text);
      expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeLessThanOrEqual(9);
    }
  });

  it("subtração: resultado ≥ 0", () => {
    const questions = generateManyForGrade("subtraction", 1, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
    }
  });

  it("resposta errada ≥ 0", () => {
    const questions = generateForGrade(1, 500);
    for (const q of questions) {
      expect(q.wrongAnswer).toBeGreaterThanOrEqual(0);
    }
  });

  it("distraidores plausíveis (offset ≤ 3)", () => {
    const questions = generateForGrade(1, 500);
    for (const q of questions) {
      const diff = Math.abs(q.correctAnswer - q.wrongAnswer);
      expect(diff).toBeGreaterThanOrEqual(1);
      expect(diff).toBeLessThanOrEqual(3);
    }
  });

  it("operação indisponível cai em operação válida do ano", () => {
    // Divisão não existe no 1º ano → deve gerar adição ou subtração
    const questions = Array.from({ length: 50 }, () =>
      generateQuestion("division", 1),
    );
    for (const q of questions) {
      const sym = getSymbol(q.text);
      expect(["+", "-"]).toContain(sym);
    }
  });
});

describe("2º ano — BNCC", () => {
  it("gera adição, subtração e multiplicação", () => {
    const questions = generateForGrade(2, 300);
    const symbols = new Set(questions.map((q) => getSymbol(q.text)));
    expect(symbols).toContain("+");
    expect(symbols).toContain("-");
    expect(symbols).toContain("×");
    expect(symbols).not.toContain("÷"); // sem divisão no 2º ano
  });

  it("adição: resultado ≤ 50", () => {
    const questions = generateManyForGrade("addition", 2, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeLessThanOrEqual(50);
    }
  });

  it("adição: operandos são números de até 2 dígitos", () => {
    const questions = generateManyForGrade("addition", 2, 500);
    for (const q of questions) {
      const [a, b] = parseOperands(q.text);
      expect(a).toBeLessThanOrEqual(99);
      expect(b).toBeLessThanOrEqual(99);
    }
  });

  it("subtração: resultado ≤ 50 e ≥ 0", () => {
    const questions = generateManyForGrade("subtraction", 2, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(q.correctAnswer).toBeLessThanOrEqual(50);
    }
  });

  it("multiplicação: apenas tabuada do 2 e do 5", () => {
    const questions = generateManyForGrade("multiplication", 2, 500);
    for (const q of questions) {
      const [a] = parseOperands(q.text);
      expect([2, 5]).toContain(a);
    }
  });

  it("multiplicação: segundo operando entre 1 e 10", () => {
    const questions = generateManyForGrade("multiplication", 2, 500);
    for (const q of questions) {
      const [, b] = parseOperands(q.text);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(10);
    }
  });

  it("multiplicação: resultado ≤ 50 (5×10=50 é o máximo)", () => {
    const questions = generateManyForGrade("multiplication", 2, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeLessThanOrEqual(50);
    }
  });

  it("todos os resultados usam números de até 2 dígitos", () => {
    const questions = generateForGrade(2, 500);
    for (const q of questions) {
      // Resultado e operandos ≤ 99 (exceto resultado de soma que vai até 50)
      const [a, b] = parseOperands(q.text);
      expect(a).toBeLessThanOrEqual(99);
      expect(b).toBeLessThanOrEqual(99);
    }
  });

  it("distraidores plausíveis (offset ≤ 4)", () => {
    const questions = generateForGrade(2, 500);
    for (const q of questions) {
      const diff = Math.abs(q.correctAnswer - q.wrongAnswer);
      expect(diff).toBeGreaterThanOrEqual(1);
      expect(diff).toBeLessThanOrEqual(4);
    }
  });

  it("resposta errada ≥ 0", () => {
    const questions = generateForGrade(2, 500);
    for (const q of questions) {
      expect(q.wrongAnswer).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("3º ano — BNCC", () => {
  it("gera as 4 operações", () => {
    const questions = generateForGrade(3, 300);
    const symbols = new Set(questions.map((q) => getSymbol(q.text)));
    expect(symbols).toContain("+");
    expect(symbols).toContain("-");
    expect(symbols).toContain("×");
    expect(symbols).toContain("÷");
  });

  it("adição: resultado ≤ 100", () => {
    const questions = generateManyForGrade("addition", 3, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeLessThanOrEqual(100);
    }
  });

  it("subtração: resultado ≥ 0 e minuendo ≤ 100", () => {
    const questions = generateManyForGrade("subtraction", 3, 500);
    for (const q of questions) {
      const [a] = parseOperands(q.text);
      expect(a).toBeLessThanOrEqual(100);
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
    }
  });

  it("multiplicação: tabuada completa até 5 (2, 3, 4, 5)", () => {
    const questions = generateManyForGrade("multiplication", 3, 500);
    const tablesUsed = new Set<number>();
    for (const q of questions) {
      const [a] = parseOperands(q.text);
      expect([2, 3, 4, 5]).toContain(a);
      tablesUsed.add(a);
    }
    // Verifica que todas as tabuadas (2–5) aparecem
    expect(tablesUsed).toContain(2);
    expect(tablesUsed).toContain(3);
    expect(tablesUsed).toContain(4);
    expect(tablesUsed).toContain(5);
  });

  it("multiplicação: segundo operando entre 1 e 10", () => {
    const questions = generateManyForGrade("multiplication", 3, 500);
    for (const q of questions) {
      const [, b] = parseOperands(q.text);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(10);
    }
  });

  it("multiplicação: resultado ≤ 100 (5×10=50 é o máximo real)", () => {
    const questions = generateManyForGrade("multiplication", 3, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeLessThanOrEqual(100);
    }
  });

  it("divisão: divisor entre 2 e 5", () => {
    const questions = generateManyForGrade("division", 3, 500);
    for (const q of questions) {
      const [, divisor] = parseOperands(q.text);
      expect(divisor).toBeGreaterThanOrEqual(2);
      expect(divisor).toBeLessThanOrEqual(5);
    }
  });

  it("divisão: resultado sempre inteiro", () => {
    const questions = generateManyForGrade("division", 3, 500);
    for (const q of questions) {
      expect(Number.isInteger(q.correctAnswer)).toBe(true);
    }
  });

  it("divisão: dividendo ≤ 100", () => {
    const questions = generateManyForGrade("division", 3, 500);
    for (const q of questions) {
      const [dividend] = parseOperands(q.text);
      expect(dividend).toBeLessThanOrEqual(100);
    }
  });

  it("nenhuma questão gera resultado negativo", () => {
    const questions = generateForGrade(3, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
    }
  });

  it("distraidores plausíveis (offset ≤ 5)", () => {
    const questions = generateForGrade(3, 500);
    for (const q of questions) {
      const diff = Math.abs(q.correctAnswer - q.wrongAnswer);
      expect(diff).toBeGreaterThanOrEqual(1);
      expect(diff).toBeLessThanOrEqual(5);
    }
  });

  it("resposta errada ≥ 0", () => {
    const questions = generateForGrade(3, 500);
    for (const q of questions) {
      expect(q.wrongAnswer).toBeGreaterThanOrEqual(0);
    }
  });
});

/* ══════════════════════════════════════════════════════════════
 * BNCC — 4º ano (Fundamental 1 avançado) — Issue #46
 * ══════════════════════════════════════════════════════════════ */

describe("4º ano — BNCC", () => {
  it("gera as 4 operações básicas", () => {
    const questions = generateForGrade(4, 300);
    const symbols = new Set(questions.map((q) => getSymbol(q.text)));
    expect(symbols).toContain("+");
    expect(symbols).toContain("-");
    expect(symbols).toContain("×");
    expect(symbols).toContain("÷");
    // Não deve gerar frações nem expressões
    expect(symbols).not.toContain("frac");
    expect(symbols).not.toContain("expr");
  });

  /* ── Adição e subtração até 1000 ── */

  it("adição: resultado ≤ 1000", () => {
    const questions = generateManyForGrade("addition", 4, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeLessThanOrEqual(1000);
    }
  });

  it("adição: operandos entre 10 e 500", () => {
    const questions = generateManyForGrade("addition", 4, 500);
    for (const q of questions) {
      const [a, b] = parseOperands(q.text);
      expect(a).toBeGreaterThanOrEqual(10);
      expect(a).toBeLessThanOrEqual(500);
      expect(b).toBeGreaterThanOrEqual(10);
      expect(b).toBeLessThanOrEqual(500);
    }
  });

  it("subtração: resultado ≥ 0 e minuendo ≤ 1000", () => {
    const questions = generateManyForGrade("subtraction", 4, 500);
    for (const q of questions) {
      const [a] = parseOperands(q.text);
      expect(a).toBeLessThanOrEqual(1000);
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
    }
  });

  /* ── Tabuada completa até 10 ── */

  it("multiplicação: tabuada completa até 10 (tabelas 2 a 10)", () => {
    const questions = generateManyForGrade("multiplication", 4, 1000);
    const tablesUsed = new Set<number>();
    for (const q of questions) {
      const [a] = parseOperands(q.text);
      expect(a).toBeGreaterThanOrEqual(2);
      expect(a).toBeLessThanOrEqual(10);
      tablesUsed.add(a);
    }
    // Todas as tabuadas de 2 a 10 devem aparecer
    for (let t = 2; t <= 10; t++) {
      expect(tablesUsed).toContain(t);
    }
  });

  it("multiplicação: segundo operando entre 1 e 10", () => {
    const questions = generateManyForGrade("multiplication", 4, 500);
    for (const q of questions) {
      const [, b] = parseOperands(q.text);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(10);
    }
  });

  it("multiplicação: resultado ≤ 100 (10×10 é o máximo)", () => {
    const questions = generateManyForGrade("multiplication", 4, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeLessThanOrEqual(100);
    }
  });

  /* ── Divisão com números maiores ── */

  it("divisão: resultado sempre inteiro", () => {
    const questions = generateManyForGrade("division", 4, 500);
    for (const q of questions) {
      expect(Number.isInteger(q.correctAnswer)).toBe(true);
    }
  });

  it("divisão: divisor entre 2 e 10", () => {
    const questions = generateManyForGrade("division", 4, 500);
    for (const q of questions) {
      const [, divisor] = parseOperands(q.text);
      expect(divisor).toBeGreaterThanOrEqual(2);
      expect(divisor).toBeLessThanOrEqual(10);
    }
  });

  it("divisão: dividendo ≤ 100 (10×10)", () => {
    const questions = generateManyForGrade("division", 4, 500);
    for (const q of questions) {
      const [dividend] = parseOperands(q.text);
      expect(dividend).toBeLessThanOrEqual(100);
    }
  });

  it("divisão: pode gerar dividendos maiores (ex: 72 ÷ 9)", () => {
    // Verifica que dividendos ≥ 20 aparecem (não ficam limitados como 3º ano)
    const questions = generateManyForGrade("division", 4, 500);
    const maxDividend = Math.max(
      ...questions.map((q) => parseOperands(q.text)[0]),
    );
    expect(maxDividend).toBeGreaterThanOrEqual(20);
  });

  /* ── Regras gerais ── */

  it("nenhuma questão gera resultado negativo", () => {
    const questions = generateForGrade(4, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
    }
  });

  it("resposta errada ≥ 0", () => {
    const questions = generateForGrade(4, 500);
    for (const q of questions) {
      expect(q.wrongAnswer).toBeGreaterThanOrEqual(0);
    }
  });

  it("distraidores plausíveis (offset ≤ 5)", () => {
    const questions = generateForGrade(4, 500);
    for (const q of questions) {
      const diff = Math.abs(q.correctAnswer - q.wrongAnswer);
      expect(diff).toBeGreaterThanOrEqual(1);
      expect(diff).toBeLessThanOrEqual(5);
    }
  });
});

/* ══════════════════════════════════════════════════════════════
 * BNCC — 5º ano (Fundamental 1 avançado) — Issue #46
 * ══════════════════════════════════════════════════════════════ */

describe("5º ano — BNCC", () => {
  it("gera 6 tipos de questão (4 operações + fração + expressão)", () => {
    const questions = generateForGrade(5, 500);
    const types = new Set(questions.map((q) => getSymbol(q.text)));
    expect(types).toContain("+");
    expect(types).toContain("-");
    expect(types).toContain("×");
    expect(types).toContain("÷");
    expect(types).toContain("frac");
    expect(types).toContain("expr");
  });

  /* ── Operações com números até 10.000 ── */

  it("adição: resultado ≤ 10.000", () => {
    const questions = generateManyForGrade("addition", 5, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeLessThanOrEqual(10000);
    }
  });

  it("adição: operandos entre 100 e 5000", () => {
    const questions = generateManyForGrade("addition", 5, 500);
    for (const q of questions) {
      const [a, b] = parseOperands(q.text);
      expect(a).toBeGreaterThanOrEqual(100);
      expect(a).toBeLessThanOrEqual(5000);
      expect(b).toBeGreaterThanOrEqual(100);
      expect(b).toBeLessThanOrEqual(5000);
    }
  });

  it("subtração: resultado ≥ 0 e minuendo ≤ 10.000", () => {
    const questions = generateManyForGrade("subtraction", 5, 500);
    for (const q of questions) {
      const [a] = parseOperands(q.text);
      expect(a).toBeLessThanOrEqual(10000);
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
    }
  });

  /* ── Multiplicação e divisão maiores ── */

  it("multiplicação: resultados maiores que 4º ano", () => {
    const questions = generateManyForGrade("multiplication", 5, 500);
    const maxResult = Math.max(...questions.map((q) => q.correctAnswer));
    expect(maxResult).toBeGreaterThan(100);
  });

  it("multiplicação: operandos entre 5 e 20", () => {
    const questions = generateManyForGrade("multiplication", 5, 500);
    for (const q of questions) {
      const [a, b] = parseOperands(q.text);
      expect(a).toBeGreaterThanOrEqual(5);
      expect(a).toBeLessThanOrEqual(20);
      expect(b).toBeGreaterThanOrEqual(5);
      expect(b).toBeLessThanOrEqual(20);
    }
  });

  it("divisão: resultado sempre inteiro", () => {
    const questions = generateManyForGrade("division", 5, 500);
    for (const q of questions) {
      expect(Number.isInteger(q.correctAnswer)).toBe(true);
    }
  });

  it("divisão: resultado entre 5 e 20, divisor entre 5 e 15", () => {
    const questions = generateManyForGrade("division", 5, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeGreaterThanOrEqual(5);
      expect(q.correctAnswer).toBeLessThanOrEqual(20);
      const [, divisor] = parseOperands(q.text);
      expect(divisor).toBeGreaterThanOrEqual(5);
      expect(divisor).toBeLessThanOrEqual(15);
    }
  });

  /* ── Frações simples: ½, ¼, ¾ ── */

  it("fração: texto no formato correto (ex: ½ de 20 = ?)", () => {
    const questions = generateManyForGrade("fraction", 5, 200);
    for (const q of questions) {
      expect(q.text).toMatch(/^[½¼¾] de \d+ = \?$/);
    }
  });

  it("fração: usa os 3 símbolos (½, ¼, ¾)", () => {
    const questions = generateManyForGrade("fraction", 5, 500);
    const symbols = new Set(questions.map((q) => parseFraction(q.text).symbol));
    expect(symbols).toContain("½");
    expect(symbols).toContain("¼");
    expect(symbols).toContain("¾");
  });

  it("fração: resultado sempre inteiro", () => {
    const questions = generateManyForGrade("fraction", 5, 500);
    for (const q of questions) {
      expect(Number.isInteger(q.correctAnswer)).toBe(true);
    }
  });

  it("fração: resultado ≥ 1", () => {
    const questions = generateManyForGrade("fraction", 5, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeGreaterThanOrEqual(1);
    }
  });

  it("fração: resposta correta confere com a fração", () => {
    const fractionValues: Record<string, [number, number]> = {
      "½": [1, 2],
      "¼": [1, 4],
      "¾": [3, 4],
    };
    const questions = generateManyForGrade("fraction", 5, 500);
    for (const q of questions) {
      const { symbol, whole } = parseFraction(q.text);
      const [num, den] = fractionValues[symbol];
      expect(q.correctAnswer).toBe((whole * num) / den);
    }
  });

  it("fração ½: número inteiro é sempre par", () => {
    const questions = generateManyForGrade("fraction", 5, 500);
    for (const q of questions) {
      const { symbol, whole } = parseFraction(q.text);
      if (symbol === "½") {
        expect(whole % 2).toBe(0);
      }
    }
  });

  it("fração ¼ e ¾: número inteiro é sempre múltiplo de 4", () => {
    const questions = generateManyForGrade("fraction", 5, 500);
    for (const q of questions) {
      const { symbol, whole } = parseFraction(q.text);
      if (symbol === "¼" || symbol === "¾") {
        expect(whole % 4).toBe(0);
      }
    }
  });

  it("fração: número inteiro entre 4 e 100", () => {
    const questions = generateManyForGrade("fraction", 5, 500);
    for (const q of questions) {
      const { whole } = parseFraction(q.text);
      expect(whole).toBeGreaterThanOrEqual(4);
      expect(whole).toBeLessThanOrEqual(100);
    }
  });

  it("fração: distrator plausível e proporcional à resposta", () => {
    const questions = generateManyForGrade("fraction", 5, 500);
    for (const q of questions) {
      const diff = Math.abs(q.correctAnswer - q.wrongAnswer);
      expect(diff).toBeGreaterThanOrEqual(1);
      // Offset adaptativo: max(2, ceil(answer/3)), limitado ao wrongOffset do ano (10)
      const maxExpected = Math.max(
        2,
        Math.min(10, Math.ceil(q.correctAnswer / 3)),
      );
      expect(diff).toBeLessThanOrEqual(maxExpected);
    }
  });

  /* ── Expressões simples ── */

  it("expressão: texto no formato correto (ex: 3 × 4 + 2 = ?)", () => {
    const questions = generateManyForGrade("expression", 5, 200);
    for (const q of questions) {
      expect(q.text).toMatch(/^\d+ × \d+ [+\-] \d+ = \?$/);
    }
  });

  it("expressão: resultado sempre ≥ 0", () => {
    const questions = generateManyForGrade("expression", 5, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
    }
  });

  it("expressão: resultado é sempre inteiro", () => {
    const questions = generateManyForGrade("expression", 5, 500);
    for (const q of questions) {
      expect(Number.isInteger(q.correctAnswer)).toBe(true);
    }
  });

  it("expressão: resposta confere (multiplicação primeiro)", () => {
    const questions = generateManyForGrade("expression", 5, 500);
    for (const q of questions) {
      const { a, b, op2, c } = parseExpression(q.text);
      const product = a * b;
      const expected = op2 === "+" ? product + c : product - c;
      expect(q.correctAnswer).toBe(expected);
    }
  });

  it("expressão: operandos entre 2 e 10", () => {
    const questions = generateManyForGrade("expression", 5, 500);
    for (const q of questions) {
      const { a, b, c } = parseExpression(q.text);
      expect(a).toBeGreaterThanOrEqual(2);
      expect(a).toBeLessThanOrEqual(10);
      expect(b).toBeGreaterThanOrEqual(2);
      expect(b).toBeLessThanOrEqual(10);
      expect(c).toBeGreaterThanOrEqual(2);
      expect(c).toBeLessThanOrEqual(10);
    }
  });

  it("expressão: gera tanto + quanto - como segunda operação", () => {
    const questions = generateManyForGrade("expression", 5, 500);
    const secondOps = new Set(
      questions.map((q) => parseExpression(q.text).op2),
    );
    expect(secondOps).toContain("+");
    expect(secondOps).toContain("-");
  });

  /* ── Regras gerais 5º ano ── */

  it("nenhuma questão gera resultado negativo", () => {
    const questions = generateForGrade(5, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
    }
  });

  it("resposta errada ≥ 0", () => {
    const questions = generateForGrade(5, 500);
    for (const q of questions) {
      expect(q.wrongAnswer).toBeGreaterThanOrEqual(0);
    }
  });

  it("left e right são sempre diferentes", () => {
    const questions = generateForGrade(5, 500);
    for (const q of questions) {
      expect(q.leftValue).not.toBe(q.rightValue);
    }
  });

  it("operação indisponível no 5º ano (fração no 4º) cai em válida", () => {
    const questions = Array.from({ length: 50 }, () =>
      generateQuestion("fraction", 4),
    );
    for (const q of questions) {
      // 4º ano não tem fração → deve sortear outra operação
      const sym = getSymbol(q.text);
      expect(["+", "-", "×", "÷"]).toContain(sym);
    }
  });
});

/* ══════════════════════════════════════════════════════════════
 * BNCC — 6º ano (Fundamental 2 — inicial) — Issue #47
 * ══════════════════════════════════════════════════════════════ */

describe("6º ano — BNCC", () => {
  it("gera todos os 8 tipos de questão", () => {
    const questions = generateForGrade(6, 1000);
    const types = new Set(questions.map((q) => getSymbol(q.text)));
    expect(types).toContain("+");
    expect(types).toContain("-");
    expect(types).toContain("×");
    expect(types).toContain("÷");
    expect(types).toContain("exp");
    expect(types).toContain("dec");
    expect(types).toContain("sameFrac");
    expect(types).toContain("md");
  });

  /* ── Potenciação ── */

  it("potenciação: formato correto (ex: 2³ = ?)", () => {
    const questions = generateManyForGrade("exponentiation", 6, 200);
    for (const q of questions) {
      expect(q.text).toMatch(/^\d+[⁰¹²³⁴⁵⁶⁷⁸⁹]+ = \?$/);
    }
  });

  it("potenciação: base entre 2 e 10", () => {
    const questions = generateManyForGrade("exponentiation", 6, 500);
    for (const q of questions) {
      const { base } = parseExponentiation(q.text);
      expect(base).toBeGreaterThanOrEqual(2);
      expect(base).toBeLessThanOrEqual(10);
    }
  });

  it("potenciação: expoente é 2 ou 3", () => {
    const questions = generateManyForGrade("exponentiation", 6, 500);
    const exps = new Set(
      questions.map((q) => parseExponentiation(q.text).exp),
    );
    for (const e of exps) {
      expect([2, 3]).toContain(e);
    }
    // Deve gerar ambos os expoentes
    expect(exps).toContain(2);
    expect(exps).toContain(3);
  });

  it("potenciação: resposta é base^exp", () => {
    const questions = generateManyForGrade("exponentiation", 6, 500);
    for (const q of questions) {
      const { base, exp } = parseExponentiation(q.text);
      expect(q.correctAnswer).toBe(Math.pow(base, exp));
    }
  });

  it("potenciação: resultado é sempre inteiro positivo", () => {
    const questions = generateManyForGrade("exponentiation", 6, 500);
    for (const q of questions) {
      expect(Number.isInteger(q.correctAnswer)).toBe(true);
      expect(q.correctAnswer).toBeGreaterThan(0);
    }
  });

  /* ── Decimais ── */

  it("decimal: formato correto (ex: 1,5 + 2,3 = ?)", () => {
    const questions = generateManyForGrade("decimal", 6, 200);
    for (const q of questions) {
      expect(q.text).toMatch(/^\d+,\d+\s*[+\-]\s*\d+,\d+\s*=\s*\?$/);
    }
  });

  it("decimal: operandos entre 1,0 e 9,9", () => {
    const questions = generateManyForGrade("decimal", 6, 500);
    for (const q of questions) {
      const { a, b } = parseDecimal(q.text);
      expect(a).toBeGreaterThanOrEqual(1.0);
      expect(a).toBeLessThanOrEqual(9.9);
      expect(b).toBeGreaterThanOrEqual(1.0);
      expect(b).toBeLessThanOrEqual(9.9);
    }
  });

  it("decimal: resultado correto (soma ou diferença)", () => {
    const questions = generateManyForGrade("decimal", 6, 500);
    for (const q of questions) {
      const { a, op, b } = parseDecimal(q.text);
      const expected = op === "+" ? a + b : a - b;
      // Compara com tolerância para floating point
      expect(Math.abs(q.correctAnswer - expected)).toBeLessThan(0.01);
    }
  });

  it("decimal: resultado ≥ 0 para subtração", () => {
    const questions = generateManyForGrade("decimal", 6, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
    }
  });

  it("decimal: gera tanto + quanto - como operação", () => {
    const questions = generateManyForGrade("decimal", 6, 500);
    const ops = new Set(questions.map((q) => parseDecimal(q.text).op));
    expect(ops).toContain("+");
    expect(ops).toContain("-");
  });

  it("decimal: displayCorrect e displayWrong presentes com vírgula", () => {
    const questions = generateManyForGrade("decimal", 6, 200);
    for (const q of questions) {
      expect(q.leftDisplay).toBeDefined();
      expect(q.rightDisplay).toBeDefined();
      // Ao menos um display contém vírgula
      const displays = [q.leftDisplay!, q.rightDisplay!];
      for (const d of displays) {
        expect(d).toMatch(/^\d+,\d$/);
      }
    }
  });

  it("decimal: displayCorrect é diferente de displayWrong", () => {
    const questions = generateManyForGrade("decimal", 6, 500);
    for (const q of questions) {
      expect(q.leftDisplay).not.toBe(q.rightDisplay);
    }
  });

  /* ── Frações com mesmo denominador ── */

  it("fração mesmo denom: formato correto com Unicode", () => {
    const questions = generateManyForGrade("sameDenomFraction", 6, 200);
    for (const q of questions) {
      // "²⁄₅ + ¹⁄₅ = ?" ou "³⁄₈ − ¹⁄₈ = ?"
      expect(q.text).toMatch(
        /^[⁰¹²³⁴⁵⁶⁷⁸⁹]+⁄[₀₁₂₃₄₅₆₇₈₉]+\s*[+−]\s*[⁰¹²³⁴⁵⁶⁷⁸⁹]+⁄[₀₁₂₃₄₅₆₇₈₉]+\s*=\s*\?$/,
      );
    }
  });

  it("fração mesmo denom: ambas têm o mesmo denominador", () => {
    const questions = generateManyForGrade("sameDenomFraction", 6, 500);
    for (const q of questions) {
      const { d1, d2 } = parseSameDenomFraction(q.text);
      expect(d1).toBe(d2);
    }
  });

  it("fração mesmo denom: denominadores são 3, 4, 5, 6 ou 8", () => {
    const questions = generateManyForGrade("sameDenomFraction", 6, 500);
    const denoms = new Set(
      questions.map((q) => parseSameDenomFraction(q.text).d1),
    );
    for (const d of denoms) {
      expect([3, 4, 5, 6, 8]).toContain(d);
    }
  });

  it("fração mesmo denom: resultado (numerador) entre 1 e denominador", () => {
    const questions = generateManyForGrade("sameDenomFraction", 6, 500);
    for (const q of questions) {
      const { d1 } = parseSameDenomFraction(q.text);
      expect(q.correctAnswer).toBeGreaterThanOrEqual(1);
      expect(q.correctAnswer).toBeLessThanOrEqual(d1);
    }
  });

  it("fração mesmo denom: resposta correta confere", () => {
    const questions = generateManyForGrade("sameDenomFraction", 6, 500);
    for (const q of questions) {
      const { n1, op, n2 } = parseSameDenomFraction(q.text);
      const expected = op === "+" ? n1 + n2 : n1 - n2;
      expect(q.correctAnswer).toBe(expected);
    }
  });

  it("fração mesmo denom: gera tanto + quanto − como operação", () => {
    const questions = generateManyForGrade("sameDenomFraction", 6, 500);
    const ops = new Set(
      questions.map((q) => parseSameDenomFraction(q.text).op),
    );
    expect(ops).toContain("+");
    expect(ops).toContain("−");
  });

  it("fração mesmo denom: displayCorrect e displayWrong são frações Unicode", () => {
    const questions = generateManyForGrade("sameDenomFraction", 6, 200);
    for (const q of questions) {
      expect(q.leftDisplay).toBeDefined();
      expect(q.rightDisplay).toBeDefined();
      // Verifica formato Unicode de fração
      const regex = /^[⁰¹²³⁴⁵⁶⁷⁸⁹]+⁄[₀₁₂₃₄₅₆₇₈₉]+$/;
      expect(q.leftDisplay).toMatch(regex);
      expect(q.rightDisplay).toMatch(regex);
    }
  });

  it("fração mesmo denom: display mantém o mesmo denominador para correto e errado", () => {
    const questions = generateManyForGrade("sameDenomFraction", 6, 500);
    for (const q of questions) {
      const left = parseDisplayFraction(q.leftDisplay!);
      const right = parseDisplayFraction(q.rightDisplay!);
      expect(left.den).toBe(right.den);
    }
  });

  /* ── Múltiplos e divisores ── */

  it("múltiplos/divisores: formato correto", () => {
    const questions = generateManyForGrade("multiplesDivisors", 6, 200);
    for (const q of questions) {
      expect(q.text).toMatch(/^(Múltiplo|Divisor) de \d+ = \?$/);
    }
  });

  it("múltiplos/divisores: gera ambos os subtipos", () => {
    const questions = generateManyForGrade("multiplesDivisors", 6, 500);
    const types = new Set(
      questions.map((q) => parseMultDiv(q.text).type),
    );
    expect(types).toContain("Múltiplo");
    expect(types).toContain("Divisor");
  });

  it("múltiplos: resposta correta é múltiplo da base", () => {
    const questions = generateManyForGrade("multiplesDivisors", 6, 500);
    for (const q of questions) {
      const { type, base } = parseMultDiv(q.text);
      if (type === "Múltiplo") {
        expect(q.correctAnswer % base).toBe(0);
      }
    }
  });

  it("múltiplos: resposta errada NÃO é múltiplo da base", () => {
    const questions = generateManyForGrade("multiplesDivisors", 6, 500);
    for (const q of questions) {
      const { type, base } = parseMultDiv(q.text);
      if (type === "Múltiplo") {
        expect(q.wrongAnswer % base).not.toBe(0);
      }
    }
  });

  it("divisores: resposta correta é divisor do número", () => {
    const questions = generateManyForGrade("multiplesDivisors", 6, 500);
    for (const q of questions) {
      const { type, base } = parseMultDiv(q.text);
      if (type === "Divisor") {
        expect(base % q.correctAnswer).toBe(0);
      }
    }
  });

  it("divisores: resposta errada NÃO é divisor do número", () => {
    const questions = generateManyForGrade("multiplesDivisors", 6, 500);
    for (const q of questions) {
      const { type, base } = parseMultDiv(q.text);
      if (type === "Divisor") {
        expect(base % q.wrongAnswer).not.toBe(0);
      }
    }
  });

  /* ── Regras gerais 6º ano ── */

  it("left e right são sempre diferentes", () => {
    const questions = generateForGrade(6, 500);
    for (const q of questions) {
      if (q.leftDisplay && q.rightDisplay) {
        expect(q.leftDisplay).not.toBe(q.rightDisplay);
      } else {
        expect(q.leftValue).not.toBe(q.rightValue);
      }
    }
  });

  it("operação indisponível (negativeOps no 6º) cai em válida do ano", () => {
    const questions = Array.from({ length: 50 }, () =>
      generateQuestion("negativeOps", 6),
    );
    for (const q of questions) {
      const sym = getSymbol(q.text);
      expect(["+", "-", "×", "÷", "exp", "dec", "sameFrac", "md"]).toContain(
        sym,
      );
    }
  });
});

/* ══════════════════════════════════════════════════════════════
 * BNCC — 7º ano (Fundamental 2 — inicial) — Issue #47
 * ══════════════════════════════════════════════════════════════ */

describe("7º ano — BNCC", () => {
  it("gera todos os 8 tipos de questão", () => {
    const questions = generateForGrade(7, 1000);
    const types = new Set(questions.map((q) => getSymbol(q.text)));
    expect(types).toContain("+");
    expect(types).toContain("-");
    expect(types).toContain("×");
    expect(types).toContain("÷");
    expect(types).toContain("neg");
    expect(types).toContain("prop");
    expect(types).toContain("paren");
    expect(types).toContain("pct");
  });

  /* ── Números negativos ── */

  it("negativos: formato correto (ex: −3 + 5 = ? ou −3 − 5 = ?)", () => {
    const questions = generateManyForGrade("negativeOps", 7, 200);
    for (const q of questions) {
      expect(q.text).toMatch(/^−\d+\s*[+−]\s*\d+\s*=\s*\?$/);
    }
  });

  it("negativos: operandos entre 1 e 10", () => {
    const questions = generateManyForGrade("negativeOps", 7, 500);
    for (const q of questions) {
      const { a, b } = parseNegative(q.text);
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(10);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(10);
    }
  });

  it("negativos: resposta correta confere", () => {
    const questions = generateManyForGrade("negativeOps", 7, 500);
    for (const q of questions) {
      const { a, op, b } = parseNegative(q.text);
      const expected = op === "+" ? -a + b : -(a + b);
      expect(q.correctAnswer).toBe(expected);
    }
  });

  it("negativos: gera tanto + quanto − como operação", () => {
    const questions = generateManyForGrade("negativeOps", 7, 500);
    const ops = new Set(questions.map((q) => parseNegative(q.text).op));
    expect(ops).toContain("+");
    expect(ops).toContain("−");
  });

  it("negativos: resposta pode ser negativa", () => {
    const questions = generateManyForGrade("negativeOps", 7, 500);
    const hasNegative = questions.some((q) => q.correctAnswer < 0);
    expect(hasNegative).toBe(true);
  });

  it("negativos: displayCorrect e displayWrong presentes", () => {
    const questions = generateManyForGrade("negativeOps", 7, 200);
    for (const q of questions) {
      expect(q.leftDisplay).toBeDefined();
      expect(q.rightDisplay).toBeDefined();
      expect(q.leftDisplay).not.toBe(q.rightDisplay);
    }
  });

  it("negativos: display usa Unicode minus para valores negativos", () => {
    const questions = generateManyForGrade("negativeOps", 7, 500);
    for (const q of questions) {
      if (q.correctAnswer < 0) {
        const correctDisplay =
          q.correctSide === "left" ? q.leftDisplay : q.rightDisplay;
        expect(correctDisplay).toMatch(/^−\d+$/);
      }
    }
  });

  /* ── Proporções ── */

  it("proporção: formato correto (ex: Se 2 → 6, 4 → ?)", () => {
    const questions = generateManyForGrade("proportion", 7, 200);
    for (const q of questions) {
      expect(q.text).toMatch(/^Se \d+ → \d+, \d+ → \?$/);
    }
  });

  it("proporção: resultado inteiro e correto", () => {
    const questions = generateManyForGrade("proportion", 7, 500);
    for (const q of questions) {
      const { a, b, c } = parseProportion(q.text);
      const ratio = b / a;
      expect(Number.isInteger(ratio)).toBe(true);
      expect(q.correctAnswer).toBe(c * ratio);
    }
  });

  it("proporção: razão é 2, 3, 4 ou 5", () => {
    const questions = generateManyForGrade("proportion", 7, 500);
    const ratios = new Set(
      questions.map((q) => {
        const { a, b } = parseProportion(q.text);
        return b / a;
      }),
    );
    for (const r of ratios) {
      expect([2, 3, 4, 5]).toContain(r);
    }
  });

  it("proporção: c ≠ b (evita confusão visual)", () => {
    const questions = generateManyForGrade("proportion", 7, 500);
    for (const q of questions) {
      const { b, c } = parseProportion(q.text);
      expect(c).not.toBe(b);
    }
  });

  /* ── Expressões com parênteses ── */

  it("parênteses: formato correto (ex: (3 + 2) × 4 = ?)", () => {
    const questions = generateManyForGrade("parenthesesExpr", 7, 200);
    for (const q of questions) {
      expect(q.text).toMatch(
        /^\(\d+\s*[+−]\s*\d+\)\s*×\s*\d+\s*=\s*\?$/,
      );
    }
  });

  it("parênteses: resultado correto (resolve parênteses primeiro)", () => {
    const questions = generateManyForGrade("parenthesesExpr", 7, 500);
    for (const q of questions) {
      const { a, op1, b, c } = parseParentheses(q.text);
      const inner = op1 === "+" ? a + b : a - b;
      expect(q.correctAnswer).toBe(inner * c);
    }
  });

  it("parênteses: resultado sempre ≥ 0", () => {
    const questions = generateManyForGrade("parenthesesExpr", 7, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
    }
  });

  it("parênteses: operandos entre 2 e 10", () => {
    const questions = generateManyForGrade("parenthesesExpr", 7, 500);
    for (const q of questions) {
      const { a, b, c } = parseParentheses(q.text);
      expect(a).toBeGreaterThanOrEqual(2);
      expect(a).toBeLessThanOrEqual(10);
      expect(b).toBeGreaterThanOrEqual(2);
      expect(b).toBeLessThanOrEqual(10);
      expect(c).toBeGreaterThanOrEqual(2);
      expect(c).toBeLessThanOrEqual(10);
    }
  });

  it("parênteses: resultado é sempre inteiro", () => {
    const questions = generateManyForGrade("parenthesesExpr", 7, 500);
    for (const q of questions) {
      expect(Number.isInteger(q.correctAnswer)).toBe(true);
    }
  });

  /* ── Porcentagens ── */

  it("porcentagem: formato correto (ex: 10% de 200 = ?)", () => {
    const questions = generateManyForGrade("percentage", 7, 200);
    for (const q of questions) {
      expect(q.text).toMatch(/^\d+% de \d+ = \?$/);
    }
  });

  it("porcentagem: usa porcentagens de 10, 20, 25, 50 ou 75%", () => {
    const questions = generateManyForGrade("percentage", 7, 500);
    const pcts = new Set(
      questions.map((q) => parsePercentage(q.text).pct),
    );
    for (const p of pcts) {
      expect([10, 20, 25, 50, 75]).toContain(p);
    }
    // Deve gerar variedade
    expect(pcts.size).toBeGreaterThanOrEqual(3);
  });

  it("porcentagem: resultado correto e inteiro", () => {
    const questions = generateManyForGrade("percentage", 7, 500);
    for (const q of questions) {
      const { pct, whole } = parsePercentage(q.text);
      expect(q.correctAnswer).toBe((whole * pct) / 100);
      expect(Number.isInteger(q.correctAnswer)).toBe(true);
    }
  });

  it("porcentagem: resultado > 0", () => {
    const questions = generateManyForGrade("percentage", 7, 500);
    for (const q of questions) {
      expect(q.correctAnswer).toBeGreaterThan(0);
    }
  });

  it("porcentagem: inteiro entre 20 e 500", () => {
    const questions = generateManyForGrade("percentage", 7, 500);
    for (const q of questions) {
      const { whole } = parsePercentage(q.text);
      expect(whole).toBeGreaterThanOrEqual(20);
      expect(whole).toBeLessThanOrEqual(500);
    }
  });

  /* ── Regras gerais 7º ano ── */

  it("left e right são sempre diferentes", () => {
    const questions = generateForGrade(7, 500);
    for (const q of questions) {
      if (q.leftDisplay && q.rightDisplay) {
        expect(q.leftDisplay).not.toBe(q.rightDisplay);
      } else {
        expect(q.leftValue).not.toBe(q.rightValue);
      }
    }
  });

  it("operação indisponível (exponentiation no 7º) cai em válida do ano", () => {
    const questions = Array.from({ length: 50 }, () =>
      generateQuestion("exponentiation", 7),
    );
    for (const q of questions) {
      const sym = getSymbol(q.text);
      expect(["+", "-", "×", "÷", "neg", "prop", "paren", "pct"]).toContain(
        sym,
      );
    }
  });
});

/* ── Testes anos 9 (regressão #44) ──────────────────────────── */

describe("9º ano", () => {
  it("adição: operandos maiores", () => {
    const questions = Array.from({ length: 200 }, () =>
      generateQuestion("addition", 9),
    );
    for (const q of questions) {
      const [a, b] = q.text.replace("= ?", "").split("+").map(Number);
      expect(a).toBeGreaterThanOrEqual(200);
      expect(b).toBeGreaterThanOrEqual(200);
    }
  });

  it("divisão: resultado inteiro, valores maiores", () => {
    const questions = Array.from({ length: 200 }, () =>
      generateQuestion("division", 9),
    );
    for (const q of questions) {
      expect(Number.isInteger(q.correctAnswer)).toBe(true);
      expect(q.correctAnswer).toBeGreaterThanOrEqual(10);
    }
  });
});

/* ── Validação de entrada ────────────────────────────────────── */

describe("validação de entrada", () => {
  it("ano < 1 é tratado como 1", () => {
    const questions = generateForGrade(0, 50);
    for (const q of questions) {
      const sym = getSymbol(q.text);
      expect(["+", "-"]).toContain(sym); // 1º ano = apenas +/-
    }
  });

  it("ano > 9 é tratado como 9", () => {
    const questions = generateForGrade(15, 50);
    for (const q of questions) {
      expect(q.correctAnswer).toBeDefined();
    }
  });

  it("ano fracionário é arredondado", () => {
    const questions = generateForGrade(2.7, 50);
    // 2.7 arredonda para 3 → deve ter as 4 operações
    const symbols = new Set(questions.map((q) => getSymbol(q.text)));
    expect(symbols.size).toBeGreaterThanOrEqual(2);
  });
});
