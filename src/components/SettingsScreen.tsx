"use client";

/**
 * Tela de configurações de voz — acessível por acionadores.
 *
 * Navegação com 2 acionadores (← →):
 * - ← (esquerda) : move foco para a próxima configuração
 * - → (direita)  : altera o valor da configuração focada
 *                   (ou "Voltar ao jogo" na última opção)
 *
 * Alto contraste, texto grande, foco visual amarelo.
 */

import { useState, useCallback } from "react";
import { useSwitch } from "@/hooks/useSwitch";
import { useSettings } from "@/contexts/SettingsContext";
import type { VoiceSpeed } from "@/lib/settings";

/* ── Opções de cada configuração ── */

const SPEED_OPTIONS: VoiceSpeed[] = ["slow", "normal", "fast"];
const SPEED_LABELS: Record<VoiceSpeed, string> = {
  slow: "Lenta",
  normal: "Normal",
  fast: "Rápida",
};

const VOLUME_OPTIONS = [0, 0.25, 0.5, 0.75, 1];
const VOLUME_LABELS = ["0%", "25%", "50%", "75%", "100%"];

const REPEAT_OPTIONS = [10_000, 15_000, 20_000, 25_000, 30_000];
const REPEAT_LABELS = ["10s", "15s", "20s", "25s", "30s"];

/* ── Linhas do menu ── */

const ROWS = ["enabled", "speed", "volume", "repeatDelay", "back"] as const;
type Row = (typeof ROWS)[number];

const ROW_LABELS: Record<Row, string> = {
  enabled: "Narração",
  speed: "Velocidade",
  volume: "Volume",
  repeatDelay: "Repetição",
  back: "← Voltar ao jogo",
};

const ROW_ICONS: Record<Row, string> = {
  enabled: "🔊",
  speed: "⏩",
  volume: "🔈",
  repeatDelay: "🔄",
  back: "",
};

/* ── Componente ── */

interface SettingsScreenProps {
  onClose: () => void;
}

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { voice, updateVoice } = useSettings();
  const [focusIdx, setFocusIdx] = useState(0);

  /** Retorna o label do valor atual para uma linha. */
  function currentValueLabel(row: Row): string {
    switch (row) {
      case "enabled":
        return voice.enabled ? "Ligada" : "Desligada";
      case "speed":
        return SPEED_LABELS[voice.speed];
      case "volume": {
        const idx = VOLUME_OPTIONS.indexOf(voice.volume);
        return idx !== -1 ? VOLUME_LABELS[idx] : `${Math.round(voice.volume * 100)}%`;
      }
      case "repeatDelay": {
        const idx = REPEAT_OPTIONS.indexOf(voice.repeatDelay);
        return idx !== -1 ? REPEAT_LABELS[idx] : `${voice.repeatDelay / 1000}s`;
      }
      case "back":
        return "";
    }
  }

  /** Avança para o próximo valor da configuração focada. */
  function cycleValue(row: Row): void {
    switch (row) {
      case "enabled":
        updateVoice({ enabled: !voice.enabled });
        break;
      case "speed": {
        const idx = SPEED_OPTIONS.indexOf(voice.speed);
        updateVoice({
          speed: SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length],
        });
        break;
      }
      case "volume": {
        const idx = VOLUME_OPTIONS.indexOf(voice.volume);
        const cur = idx === -1 ? VOLUME_OPTIONS.length - 1 : idx;
        updateVoice({
          volume: VOLUME_OPTIONS[(cur + 1) % VOLUME_OPTIONS.length],
        });
        break;
      }
      case "repeatDelay": {
        const idx = REPEAT_OPTIONS.indexOf(voice.repeatDelay);
        const cur = idx === -1 ? 1 : idx;
        updateVoice({
          repeatDelay: REPEAT_OPTIONS[(cur + 1) % REPEAT_OPTIONS.length],
        });
        break;
      }
      case "back":
        onClose();
        break;
    }
  }

  const handleSelect = useCallback(
    (side: "left" | "right") => {
      if (side === "left") {
        setFocusIdx((prev) => (prev + 1) % ROWS.length);
      } else {
        cycleValue(ROWS[focusIdx]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusIdx, voice],
  );

  useSwitch({ onSelect: handleSelect, enabled: true });

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Configurações de voz"
    >
      {/* Título */}
      <h2 className="mb-6 text-3xl sm:text-4xl font-bold text-white text-shadow-game">
        ⚙ Configurações de Voz
      </h2>

      {/* Lista de opções */}
      <div className="flex w-full max-w-lg flex-col gap-3">
        {ROWS.map((row, idx) => {
          const focused = idx === focusIdx;
          const isBack = row === "back";

          return (
            <button
              key={row}
              className={`
                flex items-center justify-between rounded-2xl px-5 py-4
                text-xl sm:text-2xl font-semibold transition-all duration-200
                ${
                  focused
                    ? "scale-105 ring-4 ring-yellow-300 bg-gray-800 text-white shadow-lg shadow-yellow-300/20"
                    : "bg-gray-900 text-gray-400"
                }
                ${isBack ? "mt-2" : ""}
              `}
              aria-label={
                isBack
                  ? "Voltar ao jogo"
                  : `${ROW_LABELS[row]}: ${currentValueLabel(row)}. Pressione direita para alterar.`
              }
              aria-current={focused ? "true" : undefined}
              tabIndex={-1}
              onClick={() => {
                setFocusIdx(idx);
                cycleValue(row);
              }}
            >
              <span className="flex items-center gap-3">
                {ROW_ICONS[row] && (
                  <span aria-hidden="true">{ROW_ICONS[row]}</span>
                )}
                <span>{ROW_LABELS[row]}</span>
              </span>

              {!isBack && (
                <span
                  className={`
                    rounded-lg px-3 py-1 text-lg sm:text-xl font-bold
                    ${focused ? "bg-yellow-300 text-gray-900" : "bg-gray-700 text-gray-300"}
                  `}
                >
                  {currentValueLabel(row)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Instruções */}
      <p className="mt-6 text-center text-base sm:text-lg text-gray-500">
        ◀ mover &nbsp;&nbsp; ▶ alterar
      </p>
    </div>
  );
}
