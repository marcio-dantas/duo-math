"use client";

import { useCallback, useState } from "react";
import Question from "./Question";
import AnswerOption from "./AnswerOption";
import FeedbackOverlay from "./FeedbackOverlay";
import { useSwitch } from "@/hooks/useSwitch";
import { generateQuestion, type MathQuestion } from "@/lib/generateQuestion";

import type { AnswerFeedback } from "./AnswerOption";

type GamePhase = "playing" | "feedback";

/**
 * Tela principal do jogo.
 *
 * Fluxo:
 * 1. Exibe questão gerada aleatoriamente
 * 2. Jogador pressiona ← ou → (acionadores)
 * 3. Valida resposta e mostra feedback visual:
 *    - Acerto → fundo verde + ✅
 *    - Erro   → fundo vermelho + ❌ + destaque na resposta certa
 * 4. Input bloqueado durante o feedback
 */
export default function GameScreen() {
  const [question] = useState<MathQuestion>(() => generateQuestion());
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [selectedSide, setSelectedSide] = useState<"left" | "right" | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSelect = useCallback(
    (side: "left" | "right") => {
      if (phase !== "playing") return;

      const correct = side === question.correctSide;
      setSelectedSide(side);
      setIsCorrect(correct);
      setPhase("feedback");
    },
    [phase, question.correctSide]
  );

  useSwitch({ onSelect: handleSelect, enabled: phase === "playing" });

  /* ── Feedback por opção ── */
  function getFeedback(side: "left" | "right"): AnswerFeedback {
    if (phase !== "feedback" || selectedSide === null) return null;

    // Opção que o jogador escolheu
    if (side === selectedSide) {
      return isCorrect ? "correct" : "wrong";
    }

    // Opção que o jogador NÃO escolheu — destaca se era a correta
    if (!isCorrect && side === question.correctSide) {
      return "correct";
    }

    return null;
  }

  return (
    <div className="relative flex flex-col h-full w-full">
      {/* ── Overlay de feedback ── */}
      {phase === "feedback" && isCorrect !== null && (
        <FeedbackOverlay result={isCorrect ? "correct" : "wrong"} />
      )}

      {/* ── Pergunta ── */}
      <section
        className="flex flex-[2] items-center justify-center px-6"
        aria-label="Pergunta"
      >
        <Question text={question.text} />
      </section>

      {/* ── Opções de resposta ── */}
      <section
        className="flex flex-[3] gap-4 px-4 pb-4 sm:gap-6 sm:px-6 sm:pb-6"
        aria-label="Opções de resposta"
      >
        <div className="flex-1 min-w-0">
          <AnswerOption
            value={question.leftValue}
            side="left"
            selected={phase === "playing" && selectedSide === "left"}
            feedback={getFeedback("left")}
            onSelect={() => handleSelect("left")}
          />
        </div>
        <div className="flex-1 min-w-0">
          <AnswerOption
            value={question.rightValue}
            side="right"
            selected={phase === "playing" && selectedSide === "right"}
            feedback={getFeedback("right")}
            onSelect={() => handleSelect("right")}
          />
        </div>
      </section>
    </div>
  );
}
