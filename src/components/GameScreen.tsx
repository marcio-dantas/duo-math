"use client";

import { useCallback, useState } from "react";
import Question from "./Question";
import AnswerOption from "./AnswerOption";
import { useSwitch } from "@/hooks/useSwitch";
import { generateQuestion, type MathQuestion } from "@/lib/generateQuestion";

/**
 * Tela principal do jogo.
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │                                 │
 * │         12 + 15 = ?             │  ← pergunta (topo)
 * │                                 │
 * │  ┌───────────┐ ┌───────────┐   │
 * │  │    25      │ │    27     │   │  ← opções (base)
 * │  │  (azul)    │ │  (verde)  │   │
 * │  └───────────┘ └───────────┘   │
 * └─────────────────────────────────┘
 *
 * Os acionadores do Gabriel (teclas ← →) selecionam as opções.
 * Questões geradas aleatoriamente com as 4 operações básicas.
 */
export default function GameScreen() {
  const [question] = useState<MathQuestion>(() => generateQuestion());

  const [selectedSide, setSelectedSide] = useState<
    "left" | "right" | null
  >(null);

  const handleSelect = useCallback((side: "left" | "right") => {
    setSelectedSide(side);
  }, []);

  useSwitch({ onSelect: handleSelect });

  return (
    <div className="flex flex-col h-full w-full">
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
            selected={selectedSide === "left"}
            onSelect={() => handleSelect("left")}
          />
        </div>
        <div className="flex-1 min-w-0">
          <AnswerOption
            value={question.rightValue}
            side="right"
            selected={selectedSide === "right"}
            onSelect={() => handleSelect("right")}
          />
        </div>
      </section>
    </div>
  );
}
