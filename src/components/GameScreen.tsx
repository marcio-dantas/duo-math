"use client";

import { useCallback, useState } from "react";
import Question from "./Question";
import AnswerOption from "./AnswerOption";
import { useSwitch } from "@/hooks/useSwitch";

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
 * Dados estáticos por enquanto — a lógica de geração
 * de perguntas será implementada em issues futuras.
 */
export default function GameScreen() {
  const question = "12 + 15 = ?";
  const leftOption = 25;
  const rightOption = 27;

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
        <Question text={question} />
      </section>

      {/* ── Opções de resposta ── */}
      <section
        className="flex flex-[3] gap-4 px-4 pb-4 sm:gap-6 sm:px-6 sm:pb-6"
        aria-label="Opções de resposta"
      >
        <div className="flex-1 min-w-0">
          <AnswerOption
            value={leftOption}
            side="left"
            selected={selectedSide === "left"}
            onSelect={() => handleSelect("left")}
          />
        </div>
        <div className="flex-1 min-w-0">
          <AnswerOption
            value={rightOption}
            side="right"
            selected={selectedSide === "right"}
            onSelect={() => handleSelect("right")}
          />
        </div>
      </section>
    </div>
  );
}
