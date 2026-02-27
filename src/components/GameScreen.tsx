"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Question from "./Question";
import AnswerOption from "./AnswerOption";
import FeedbackOverlay from "./FeedbackOverlay";
import { useSwitch } from "@/hooks/useSwitch";
import { generateQuestion, type MathQuestion } from "@/lib/generateQuestion";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import { initSpeech, cancelSpeech, speak, buildNarration } from "@/lib/speech";

import type { AnswerFeedback } from "./AnswerOption";

type GamePhase = "playing" | "selecting" | "feedback";

/** Tempo em ms da animação de destaque ao selecionar opção. */
const SELECTION_DURATION_MS = 400;

/** Tempo em ms que o feedback fica visível antes de avançar. */
const FEEDBACK_DURATION_MS = 2500;

/** Tempo em ms da transição de fade entre questões. */
const FADE_MS = 300;

/**
 * Tela principal do jogo.
 *
 * Fluxo:
 * 1. Exibe questão gerada aleatoriamente
 * 2. Narração por voz: "Quanto é X mais Y? À esquerda, A. À direita, B."
 * 3. Jogador pressiona ← ou → (acionadores)
 * 4. Narração é cancelada imediatamente
 * 5. Animação de destaque na opção selecionada (~400 ms)
 * 6. Valida resposta e mostra feedback visual + sonoro (2,5 s)
 * 7. Fade-out → nova questão → fade-in → nova narração
 * 8. Repete
 */
export default function GameScreen() {
  const [question, setQuestion] = useState<MathQuestion>(() =>
    generateQuestion()
  );
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [selectedSide, setSelectedSide] = useState<"left" | "right" | null>(
    null
  );
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  /** Controla a opacidade para transição suave entre questões. */
  const [visible, setVisible] = useState(true);

  /** Ref para limpar timers no unmount. */
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* ── Limpa timers ao desmontar ── */
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  /* ── Inicializa sistema de narração por voz ── */
  useEffect(() => {
    return initSpeech();
  }, []);

  /* ── Narra a pergunta e opções ao exibir cada questão ── */
  useEffect(() => {
    if (!visible || phase !== "playing") return;

    const text = buildNarration(
      question.text,
      question.leftValue,
      question.rightValue,
    );
    speak(text);

    return () => {
      cancelSpeech();
    };
  }, [question, visible, phase]);

  /* ── Avanço automático após feedback ── */
  useEffect(() => {
    if (phase !== "feedback") return;

    // Após FEEDBACK_DURATION_MS, inicia o fade-out
    const t1 = setTimeout(() => {
      setVisible(false);

      // Após a animação de fade-out, reseta tudo com nova questão
      const t2 = setTimeout(() => {
        setQuestion(generateQuestion());
        setSelectedSide(null);
        setIsCorrect(null);
        setPhase("playing");
        setVisible(true);
      }, FADE_MS);

      timersRef.current.push(t2);
    }, FEEDBACK_DURATION_MS);

    timersRef.current.push(t1);

    return () => {
      clearTimeout(t1);
    };
  }, [phase]);

  /* ── Seleção de resposta ── */
  const handleSelect = useCallback(
    (side: "left" | "right") => {
      if (phase !== "playing") return;

      /* Cancela narração em andamento para não sobrepor o feedback */
      cancelSpeech();

      /* 1. Destaque visual imediato na opção escolhida */
      setSelectedSide(side);
      setPhase("selecting");

      /* 2. Após a animação de destaque, avalia e mostra feedback */
      const t = setTimeout(() => {
        const correct = side === question.correctSide;
        setIsCorrect(correct);
        setPhase("feedback");

        // Feedback sonoro junto com o visual de certo/errado
        if (correct) {
          playCorrectSound();
        } else {
          playWrongSound();
        }
      }, SELECTION_DURATION_MS);

      timersRef.current.push(t);
    },
    [phase, question.correctSide]
  );

  useSwitch({ onSelect: handleSelect, enabled: phase === "playing" });

  /* ── Feedback por opção ── */
  function getFeedback(side: "left" | "right"): AnswerFeedback {
    if (phase !== "feedback" || selectedSide === null) return null;

    if (side === selectedSide) {
      return isCorrect ? "correct" : "wrong";
    }

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

      {/* ── Conteúdo com transição de opacidade ── */}
      <div
        className="flex flex-col flex-1 transition-opacity ease-in-out"
        style={{
          opacity: visible ? 1 : 0,
          transitionDuration: `${FADE_MS}ms`,
        }}
      >
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
              selected={selectedSide === "left" && phase === "playing"}
              selecting={selectedSide === "left" && phase === "selecting"}
              feedback={getFeedback("left")}
              onSelect={() => handleSelect("left")}
            />
          </div>
          <div className="flex-1 min-w-0">
            <AnswerOption
              value={question.rightValue}
              side="right"
              selected={selectedSide === "right" && phase === "playing"}
              selecting={selectedSide === "right" && phase === "selecting"}
              feedback={getFeedback("right")}
              onSelect={() => handleSelect("right")}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
