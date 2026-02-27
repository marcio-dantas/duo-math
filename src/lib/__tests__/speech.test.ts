import { describe, it, expect } from "vitest";
import { buildNarration } from "../speech";

/**
 * Testes do buildNarration (#46).
 *
 * Verifica que a narração por voz funciona para:
 * 1. Operações simples (adição, subtração, multiplicação, divisão)
 * 2. Frações (½, ¼, ¾)
 * 3. Expressões com duas operações
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

  /* ── Texto inválido ── */

  it("retorna string vazia para texto não reconhecido", () => {
    expect(buildNarration("texto aleatório", 1, 2)).toBe("");
  });
});
