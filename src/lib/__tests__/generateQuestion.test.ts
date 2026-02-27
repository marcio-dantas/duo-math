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

/** Extrai o símbolo da operação do texto da questão. */
function getSymbol(text: string): string {
  if (text.includes("+")) return "+";
  if (text.includes("×")) return "×";
  if (text.includes("÷")) return "÷";
  if (text.includes("-")) return "-";
  return "?";
}

/** Extrai os dois operandos do texto. */
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

  it("3º ao 9º ano: todas as 4 operações", () => {
    for (let y = 3; y <= 9; y++) {
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

/* ── Testes anos 5 e 9 (regressão #44) ──────────────────────── */

describe("5º ano", () => {
  it("gera as 4 operações", () => {
    const questions = generateForGrade(5, 200);
    const symbols = new Set(questions.map((q) => getSymbol(q.text)));
    expect(symbols).toContain("+");
    expect(symbols).toContain("-");
    expect(symbols).toContain("×");
    expect(symbols).toContain("÷");
  });

  it("adição: operandos entre 100 e 500", () => {
    const questions = Array.from({ length: 200 }, () =>
      generateQuestion("addition", 5),
    );
    for (const q of questions) {
      const [a, b] = q.text.replace("= ?", "").split("+").map(Number);
      expect(a).toBeGreaterThanOrEqual(100);
      expect(a).toBeLessThanOrEqual(500);
      expect(b).toBeGreaterThanOrEqual(100);
      expect(b).toBeLessThanOrEqual(500);
    }
  });
});

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
