import { describe, it, expect } from "vitest";
import { generateQuestion, type Operation, type MathQuestion } from "../generateQuestion";

/* ── Helpers ─────────────────────────────────────────────────── */

/** Gera N questões de uma operação para testes estatísticos. */
function generateMany(op: Operation, n = 100): MathQuestion[] {
  return Array.from({ length: n }, () => generateQuestion(op));
}

/* ── Testes gerais ───────────────────────────────────────────── */

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

  it("resposta errada é plausível (diferença ≤ 5)", () => {
    const questions = Array.from({ length: 200 }, () => generateQuestion());
    for (const q of questions) {
      const diff = Math.abs(q.correctAnswer - q.wrongAnswer);
      expect(diff).toBeGreaterThanOrEqual(1);
      expect(diff).toBeLessThanOrEqual(5);
    }
  });

  it("sem operação especificada, gera as 4 operações", () => {
    const questions = Array.from({ length: 200 }, () => generateQuestion());
    const symbols = new Set(
      questions.map((q) => {
        if (q.text.includes("+")) return "+";
        if (q.text.includes("-")) return "-";
        if (q.text.includes("×")) return "×";
        if (q.text.includes("÷")) return "÷";
        return "?";
      })
    );
    expect(symbols).toContain("+");
    expect(symbols).toContain("-");
    expect(symbols).toContain("×");
    expect(symbols).toContain("÷");
  });
});

/* ── Testes por operação ─────────────────────────────────────── */

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
