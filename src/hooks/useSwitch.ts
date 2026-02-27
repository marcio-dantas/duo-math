"use client";

import { useEffect } from "react";

type Side = "left" | "right";

interface UseSwitchOptions {
  /** Callback disparado quando um acionador (tecla) é pressionado. */
  onSelect: (side: Side) => void;
  /** Desativa a escuta de teclado quando false (ex: jogo pausado). */
  enabled?: boolean;
}

/**
 * Escuta as teclas de seta ← → e mapeia para os acionadores
 * físicos do Gabriel (via Microsoft Adaptive Hub).
 *
 * - ArrowLeft  → opção esquerda
 * - ArrowRight → opção direita
 * - Todas as outras teclas são ignoradas
 * - Previne o comportamento padrão do browser nas setas
 * - Ignora key-repeat (segurar a tecla não dispara múltiplas vezes)
 */
export function useSwitch({ onSelect, enabled = true }: UseSwitchOptions) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      // Ignora key-repeat para evitar seleções múltiplas ao segurar
      if (event.repeat) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onSelect("left");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onSelect("right");
      }
      // Demais teclas são silenciosamente ignoradas
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSelect, enabled]);
}
