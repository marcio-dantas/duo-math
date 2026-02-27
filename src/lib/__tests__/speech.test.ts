import { describe, it, expect } from "vitest";
import { buildNarration } from "../speech";

/**
 * Testes do buildNarration (#46 + #47).
 *
 * Verifica que a narração por voz funciona para:
 * 1. Operações simples (adição, subtração, multiplicação, divisão)
 * 2. Frações (½, ¼, ¾) — 5º ano
 * 3. Expressões com duas operações — 5º ano
 * 4. Potenciação — 6º ano
 * 5. Decimais — 6º ano
 * 6. Frações mesmo denominador — 6º ano
 * 7. Múltiplos/divisores — 6º ano
 * 8. Negativos — 7º ano
 * 9. Proporções — 7º ano
 * 10. Parênteses — 7º ano
 * 11. Porcentagens — 7º ano
 */
describe("buildNarration", () => {
  /* ── Operações simples ── */

  it("adição: narra corretamente", () => {
    expect(buildNarration("12 + 15 = ?", 27, 30)).toBe(
      "Quanto é 12 mais 15? À esquerda, 27. À direita, 30.",
    );
  });

  it("subtração: narra corretamente", () => {
    expect(buildNarration("50 - 23 = ?", 30, 27)).toBe(
      "Quanto é 50 menos 23? À esquerda, 30. À direita, 27.",
    );
  });

  it("multiplicação: narra corretamente", () => {
    expect(buildNarration("7 × 8 = ?", 56, 54)).toBe(
      "Quanto é 7 vezes 8? À esquerda, 56. À direita, 54.",
    );
  });

  it("divisão: narra corretamente", () => {
    expect(buildNarration("72 ÷ 9 = ?", 8, 10)).toBe(
      "Quanto é 72 dividido por 9? À esquerda, 8. À direita, 10.",
    );
  });

  /* ── Frações (#46) ── */

  it("fração ½: narra 'metade de'", () => {
    expect(buildNarration("½ de 20 = ?", 10, 12)).toBe(
      "Quanto é metade de 20? À esquerda, 10. À direita, 12.",
    );
  });

  it("fração ¼: narra 'um quarto de'", () => {
    expect(buildNarration("¼ de 12 = ?", 3, 5)).toBe(
      "Quanto é um quarto de 12? À esquerda, 3. À direita, 5.",
    );
  });

  it("fração ¾: narra 'três quartos de'", () => {
    expect(buildNarration("¾ de 40 = ?", 30, 28)).toBe(
      "Quanto é três quartos de 40? À esquerda, 30. À direita, 28.",
    );
  });

  /* ── Expressões (#46) ── */

  it("expressão com +: narra corretamente", () => {
    expect(buildNarration("3 × 4 + 2 = ?", 14, 12)).toBe(
      "Quanto é 3 vezes 4 mais 2? À esquerda, 14. À direita, 12.",
    );
  });

  it("expressão com -: narra corretamente", () => {
    expect(buildNarration("5 × 3 - 4 = ?", 11, 13)).toBe(
      "Quanto é 5 vezes 3 menos 4? À esquerda, 11. À direita, 13.",
    );
  });

  /* ── Potenciação (#47 — 6º ano) ── */

  it("potenciação 2²: narra 'elevado a 2'", () => {
    expect(buildNarration("2² = ?", 4, 6)).toBe(
      "Quanto é 2 elevado a 2? À esquerda, 4. À direita, 6.",
    );
  });

  it("potenciação 5³: narra 'elevado a 3'", () => {
    expect(buildNarration("5³ = ?", 125, 120)).toBe(
      "Quanto é 5 elevado a 3? À esquerda, 125. À direita, 120.",
    );
  });

  it("potenciação 10²: narra base 10", () => {
    expect(buildNarration("10² = ?", 100, 90)).toBe(
      "Quanto é 10 elevado a 2? À esquerda, 100. À direita, 90.",
    );
  });

  /* ── Decimais (#47 — 6º ano) ── */

  it("decimal com +: narra vírgula", () => {
    expect(buildNarration("1,5 + 2,3 = ?", "3,8", "4,1")).toBe(
      "Quanto é 1 vírgula 5 mais 2 vírgula 3? À esquerda, 3 vírgula 8. À direita, 4 vírgula 1.",
    );
  });

  it("decimal com -: narra vírgula e menos", () => {
    expect(buildNarration("5,7 - 2,4 = ?", "3,3", "3,5")).toBe(
      "Quanto é 5 vírgula 7 menos 2 vírgula 4? À esquerda, 3 vírgula 3. À direita, 3 vírgula 5.",
    );
  });

  /* ── Frações mesmo denominador (#47 — 6º ano) ── */

  it("fração mesmo denom +: narra numeradores e denominadores", () => {
    expect(buildNarration("²⁄₅ + ¹⁄₅ = ?", "³⁄₅", "⁴⁄₅")).toBe(
      "Quanto é 2 quintos mais 1 quinto? À esquerda, 3 quintos. À direita, 4 quintos.",
    );
  });

  it("fração mesmo denom −: narra subtração", () => {
    expect(buildNarration("³⁄₄ − ¹⁄₄ = ?", "²⁄₄", "³⁄₄")).toBe(
      "Quanto é 3 quartos menos 1 quarto? À esquerda, 2 quartos. À direita, 3 quartos.",
    );
  });

  it("fração com denominador 8: narra 'oitavos'", () => {
    expect(buildNarration("⁵⁄₈ + ²⁄₈ = ?", "⁷⁄₈", "⁶⁄₈")).toBe(
      "Quanto é 5 oitavos mais 2 oitavos? À esquerda, 7 oitavos. À direita, 6 oitavos.",
    );
  });

  it("fração com denominador 3: narra 'terço' (singular) e 'terços'", () => {
    expect(buildNarration("¹⁄₃ + ¹⁄₃ = ?", "²⁄₃", "¹⁄₃")).toBe(
      "Quanto é 1 terço mais 1 terço? À esquerda, 2 terços. À direita, 1 terço.",
    );
  });

  /* ── Múltiplos e divisores (#47 — 6º ano) ── */

  it("múltiplo: narra 'qual é o múltiplo de'", () => {
    expect(buildNarration("Múltiplo de 6 = ?", 18, 16)).toBe(
      "Qual é o múltiplo de 6? À esquerda, 18. À direita, 16.",
    );
  });

  it("divisor: narra 'qual é o divisor de'", () => {
    expect(buildNarration("Divisor de 24 = ?", 6, 5)).toBe(
      "Qual é o divisor de 24? À esquerda, 6. À direita, 5.",
    );
  });

  /* ── Negativos (#47 — 7º ano) ── */

  it("negativo com +: narra 'menos' para o número negativo", () => {
    expect(buildNarration("−3 + 5 = ?", "2", "4")).toBe(
      "Quanto é menos 3 mais 5? À esquerda, 2. À direita, 4.",
    );
  });

  it("negativo com −: narra 'menos' duas vezes", () => {
    expect(buildNarration("−4 − 3 = ?", "−7", "−5")).toBe(
      "Quanto é menos 4 menos 3? À esquerda, menos 7. À direita, menos 5.",
    );
  });

  /* ── Proporções (#47 — 7º ano) ── */

  it("proporção: narra 'se X dá Y, quanto dá Z'", () => {
    expect(buildNarration("Se 2 → 6, 4 → ?", 12, 10)).toBe(
      "Se 2 dá 6, quanto dá 4? À esquerda, 12. À direita, 10.",
    );
  });

  /* ── Expressões com parênteses (#47 — 7º ano) ── */

  it("parênteses com +: narra abre/fecha parênteses", () => {
    expect(buildNarration("(3 + 2) × 4 = ?", 20, 18)).toBe(
      "Quanto é, abre parênteses, 3 mais 2, fecha parênteses, vezes 4? À esquerda, 20. À direita, 18.",
    );
  });

  it("parênteses com −: narra subtração dentro dos parênteses", () => {
    expect(buildNarration("(7 − 3) × 5 = ?", 20, 25)).toBe(
      "Quanto é, abre parênteses, 7 menos 3, fecha parênteses, vezes 5? À esquerda, 20. À direita, 25.",
    );
  });

  /* ── Porcentagens (#47 — 7º ano) ── */

  it("porcentagem: narra 'X por cento de Y'", () => {
    expect(buildNarration("10% de 200 = ?", 20, 25)).toBe(
      "Quanto é 10 por cento de 200? À esquerda, 20. À direita, 25.",
    );
  });

  it("porcentagem 50%: narra corretamente", () => {
    expect(buildNarration("50% de 80 = ?", 40, 35)).toBe(
      "Quanto é 50 por cento de 80? À esquerda, 40. À direita, 35.",
    );
  });

  /* ── Equação de 1º grau (#48 — 8º ano) ── */

  it("equação 1º grau com +: narra 'x mais a igual a b, x é quanto?'", () => {
    expect(buildNarration("x + 3 = 7, x = ?", 4, 6)).toBe(
      "x mais 3 igual a 7, x é quanto? À esquerda, 4. À direita, 6.",
    );
  });

  it("equação 1º grau com −: narra 'x menos a igual a b, x é quanto?'", () => {
    expect(buildNarration("x − 5 = 3, x = ?", 8, 6)).toBe(
      "x menos 5 igual a 3, x é quanto? À esquerda, 8. À direita, 6.",
    );
  });

  it("equação 1º grau com ×: narra 'a vezes x igual a b, x é quanto?'", () => {
    expect(buildNarration("3 × x = 21, x = ?", 7, 9)).toBe(
      "3 vezes x igual a 21, x é quanto? À esquerda, 7. À direita, 9.",
    );
  });

  /* ── Expressão algébrica (#48 — 8º ano) ── */

  it("expressão algébrica simples: narra 'ax, quando x vale n, resultado?'", () => {
    expect(buildNarration("2x, x = 5 → ?", 10, 12)).toBe(
      "2x, quando x vale 5, resultado? À esquerda, 10. À direita, 12.",
    );
  });

  it("expressão algébrica com +: narra 'ax mais b, quando x vale n, resultado?'", () => {
    expect(buildNarration("3x + 2, x = 4 → ?", 14, 12)).toBe(
      "3x mais 2, quando x vale 4, resultado? À esquerda, 14. À direita, 12.",
    );
  });

  it("expressão algébrica com −: narra 'ax menos b, quando x vale n, resultado?'", () => {
    expect(buildNarration("4x − 3, x = 2 → ?", 5, 7)).toBe(
      "4x menos 3, quando x vale 2, resultado? À esquerda, 5. À direita, 7.",
    );
  });

  /* ── Potências mesma base (#48 — 8º ano) ── */

  it("potências mesma base: narra 'base elevado a m vezes base elevado a n'", () => {
    expect(buildNarration("2⁴ × 2² = 2?", 6, 8)).toBe(
      "2 elevado a 4 vezes 2 elevado a 2 igual a 2 elevado a quanto? À esquerda, 6. À direita, 8.",
    );
  });

  it("potências mesma base com base 10: narra corretamente", () => {
    expect(buildNarration("10³ × 10¹ = 10?", 4, 3)).toBe(
      "10 elevado a 3 vezes 10 elevado a 1 igual a 10 elevado a quanto? À esquerda, 4. À direita, 3.",
    );
  });

  /* ── Ângulos (#48 — 8º ano) ── */

  it("ângulo complementar: narra 'complementar de X graus é quanto?'", () => {
    expect(buildNarration("Complementar de 30° = ?°", 60, 50)).toBe(
      "Complementar de 30 graus é quanto? À esquerda, 60. À direita, 50.",
    );
  });

  it("ângulo suplementar: narra 'suplementar de X graus é quanto?'", () => {
    expect(buildNarration("Suplementar de 120° = ?°", 60, 70)).toBe(
      "Suplementar de 120 graus é quanto? À esquerda, 60. À direita, 70.",
    );
  });

  /* ── Raiz quadrada (#48 — 9º ano) ── */

  it("raiz quadrada: narra 'raiz quadrada de N?'", () => {
    expect(buildNarration("√49 = ?", 7, 8)).toBe(
      "Raiz quadrada de 49? À esquerda, 7. À direita, 8.",
    );
  });

  it("raiz quadrada de 100: narra corretamente", () => {
    expect(buildNarration("√100 = ?", 10, 12)).toBe(
      "Raiz quadrada de 100? À esquerda, 10. À direita, 12.",
    );
  });

  /* ── Equação de 2º grau (#48 — 9º ano) ── */

  it("equação 2º grau: narra 'x ao quadrado igual a N, x é quanto?'", () => {
    expect(buildNarration("x² = 16, x = ?", 4, 5)).toBe(
      "x ao quadrado igual a 16, x é quanto? À esquerda, 4. À direita, 5.",
    );
  });

  /* ── Notação científica (#48 — 9º ano) ── */

  it("notação científica: narra 'N vezes 10 elevado a exp?'", () => {
    expect(buildNarration("3 × 10² = ?", 300, 200)).toBe(
      "Quanto é 3 vezes 10 elevado a 2? À esquerda, 300. À direita, 200.",
    );
  });

  it("notação científica com exp 4: narra corretamente", () => {
    expect(buildNarration("5 × 10⁴ = ?", 50000, 40000)).toBe(
      "Quanto é 5 vezes 10 elevado a 4? À esquerda, 50000. À direita, 40000.",
    );
  });

  /* ── Funções (#48 — 9º ano) ── */

  it("função com +: narra 'f de x igual a ax mais b, f de n?'", () => {
    expect(buildNarration("f(x) = 2x + 1, f(3) = ?", 7, 5)).toBe(
      "f de x igual a 2x mais 1, f de 3? À esquerda, 7. À direita, 5.",
    );
  });

  it("função com −: narra 'f de x igual a ax menos b, f de n?'", () => {
    expect(buildNarration("f(x) = 3x − 2, f(4) = ?", 10, 8)).toBe(
      "f de x igual a 3x menos 2, f de 4? À esquerda, 10. À direita, 8.",
    );
  });

  /* ── Texto inválido ── */

  it("retorna string vazia para texto não reconhecido", () => {
    expect(buildNarration("texto aleatório", 1, 2)).toBe("");
  });
});
