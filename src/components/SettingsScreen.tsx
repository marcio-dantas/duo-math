"use client";

/**
 * Tela de configurações — acessível por acionadores.
 *
 * Agrupa configurações de Jogo e de Voz em seções visuais.
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
import type { VoiceSpeed, FontSize } from "@/lib/settings";

/* ══════════════════════════════════════════════
 * Opções de cada configuração
 * ══════════════════════════════════════════════ */

/* ── Jogo ── */

const SCHOOL_YEAR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const SCHOOL_YEAR_LABELS = SCHOOL_YEAR_OPTIONS.map((y) => `${y}º ano`);

const FONT_SIZE_OPTIONS: FontSize[] = ["small", "medium", "large", "xlarge"];
const FONT_SIZE_LABELS: Record<FontSize, string> = {
  small: "P",
  medium: "M",
  large: "G",
  xlarge: "GG",
};

const SOUND_VOL_OPTIONS = [0, 0.5, 1];
const SOUND_VOL_LABELS = ["0%", "50%", "100%"];

const QUESTION_DELAY_OPTIONS = [1_000, 2_000, 3_000, 5_000];
const QUESTION_DELAY_LABELS = ["1s", "2s", "3s", "5s"];

/* ── Voz ── */

const SPEED_OPTIONS: VoiceSpeed[] = ["slow", "normal", "fast"];
const SPEED_LABELS: Record<VoiceSpeed, string> = {
  slow: "Lenta",
  normal: "Normal",
  fast: "Rápida",
};

const VOICE_VOL_OPTIONS = [0, 0.25, 0.5, 0.75, 1];
const VOICE_VOL_LABELS = ["0%", "25%", "50%", "75%", "100%"];

const REPEAT_OPTIONS = [10_000, 15_000, 20_000, 25_000, 30_000];
const REPEAT_LABELS = ["10s", "15s", "20s", "25s", "30s"];

/* ══════════════════════════════════════════════
 * Definição das linhas do menu
 * ══════════════════════════════════════════════ */

/**
 * Cada item possui um `id` único.
 * Items com `section` exibem um cabeçalho de seção acima deles.
 * Items com `type: "back"` fecham o painel.
 */
interface RowDef {
  id: string;
  label: string;
  icon: string;
  section?: string;
  type?: "back";
}

const ROWS: RowDef[] = [
  /* ── Jogo ── */
  { id: "schoolYear", label: "Ano", icon: "🎓", section: "Jogo" },
  { id: "fontSize", label: "Fonte", icon: "📐" },
  { id: "soundVolume", label: "Som", icon: "🔉" },
  { id: "questionDelay", label: "Tempo", icon: "⏱" },
  /* ── Voz ── */
  { id: "voiceEnabled", label: "Narração", icon: "🔊", section: "Voz" },
  { id: "voiceSpeed", label: "Velocidade", icon: "⏩" },
  { id: "voiceVolume", label: "Volume voz", icon: "🔈" },
  { id: "voiceRepeat", label: "Repetição", icon: "🔄" },
  /* ── Voltar ── */
  { id: "back", label: "← Voltar ao jogo", icon: "", type: "back" },
];

/* ══════════════════════════════════════════════
 * Componente
 * ══════════════════════════════════════════════ */

interface SettingsScreenProps {
  onClose: () => void;
}

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { voice, updateVoice, game, updateGame } = useSettings();
  const [focusIdx, setFocusIdx] = useState(0);

  /* ── Helpers: label do valor atual ── */

  function currentValueLabel(id: string): string {
    switch (id) {
      /* Jogo */
      case "schoolYear": {
        const idx = SCHOOL_YEAR_OPTIONS.indexOf(game.schoolYear);
        return idx !== -1 ? SCHOOL_YEAR_LABELS[idx] : `${game.schoolYear}º ano`;
      }
      case "fontSize":
        return FONT_SIZE_LABELS[game.fontSize];
      case "soundVolume": {
        const idx = SOUND_VOL_OPTIONS.indexOf(game.soundVolume);
        return idx !== -1
          ? SOUND_VOL_LABELS[idx]
          : `${Math.round(game.soundVolume * 100)}%`;
      }
      case "questionDelay": {
        const idx = QUESTION_DELAY_OPTIONS.indexOf(game.questionDelay);
        return idx !== -1
          ? QUESTION_DELAY_LABELS[idx]
          : `${game.questionDelay / 1000}s`;
      }
      /* Voz */
      case "voiceEnabled":
        return voice.enabled ? "Ligada" : "Desligada";
      case "voiceSpeed":
        return SPEED_LABELS[voice.speed];
      case "voiceVolume": {
        const idx = VOICE_VOL_OPTIONS.indexOf(voice.volume);
        return idx !== -1
          ? VOICE_VOL_LABELS[idx]
          : `${Math.round(voice.volume * 100)}%`;
      }
      case "voiceRepeat": {
        const idx = REPEAT_OPTIONS.indexOf(voice.repeatDelay);
        return idx !== -1
          ? REPEAT_LABELS[idx]
          : `${voice.repeatDelay / 1000}s`;
      }
      default:
        return "";
    }
  }

  /* ── Helpers: avançar valor ── */

  function cycleValue(id: string): void {
    switch (id) {
      /* Jogo */
      case "schoolYear": {
        const idx = SCHOOL_YEAR_OPTIONS.indexOf(game.schoolYear);
        const cur = idx === -1 ? 2 : idx; // default pos = 3º ano
        updateGame({
          schoolYear:
            SCHOOL_YEAR_OPTIONS[(cur + 1) % SCHOOL_YEAR_OPTIONS.length],
        });
        break;
      }
      case "fontSize": {
        const idx = FONT_SIZE_OPTIONS.indexOf(game.fontSize);
        updateGame({
          fontSize:
            FONT_SIZE_OPTIONS[(idx + 1) % FONT_SIZE_OPTIONS.length],
        });
        break;
      }
      case "soundVolume": {
        const idx = SOUND_VOL_OPTIONS.indexOf(game.soundVolume);
        const cur = idx === -1 ? SOUND_VOL_OPTIONS.length - 1 : idx;
        updateGame({
          soundVolume:
            SOUND_VOL_OPTIONS[(cur + 1) % SOUND_VOL_OPTIONS.length],
        });
        break;
      }
      case "questionDelay": {
        const idx = QUESTION_DELAY_OPTIONS.indexOf(game.questionDelay);
        const cur = idx === -1 ? 2 : idx; // default pos = 3 s
        updateGame({
          questionDelay:
            QUESTION_DELAY_OPTIONS[
              (cur + 1) % QUESTION_DELAY_OPTIONS.length
            ],
        });
        break;
      }
      /* Voz */
      case "voiceEnabled":
        updateVoice({ enabled: !voice.enabled });
        break;
      case "voiceSpeed": {
        const idx = SPEED_OPTIONS.indexOf(voice.speed);
        updateVoice({
          speed: SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length],
        });
        break;
      }
      case "voiceVolume": {
        const idx = VOICE_VOL_OPTIONS.indexOf(voice.volume);
        const cur = idx === -1 ? VOICE_VOL_OPTIONS.length - 1 : idx;
        updateVoice({
          volume:
            VOICE_VOL_OPTIONS[(cur + 1) % VOICE_VOL_OPTIONS.length],
        });
        break;
      }
      case "voiceRepeat": {
        const idx = REPEAT_OPTIONS.indexOf(voice.repeatDelay);
        const cur = idx === -1 ? 1 : idx;
        updateVoice({
          repeatDelay:
            REPEAT_OPTIONS[(cur + 1) % REPEAT_OPTIONS.length],
        });
        break;
      }
      case "back":
        onClose();
        break;
    }
  }

  /* ── Navegação por acionadores ── */

  const handleSelect = useCallback(
    (side: "left" | "right") => {
      if (side === "left") {
        setFocusIdx((prev) => (prev + 1) % ROWS.length);
      } else {
        cycleValue(ROWS[focusIdx].id);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusIdx, voice, game],
  );

  useSwitch({ onSelect: handleSelect, enabled: true });

  /* ── Renderização ── */

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center bg-black/95 px-4 py-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Configurações"
    >
      {/* Título */}
      <h2 className="mb-4 text-3xl sm:text-4xl font-bold text-white text-shadow-game">
        ⚙ Configurações
      </h2>

      {/* Lista de opções */}
      <div className="flex w-full max-w-lg flex-col gap-2">
        {ROWS.map((row, idx) => {
          const focused = idx === focusIdx;
          const isBack = row.type === "back";
          const valueLabel = currentValueLabel(row.id);

          return (
            <div key={row.id}>
              {/* Cabeçalho de seção */}
              {row.section && (
                <p className="mt-3 mb-1 px-2 text-sm font-bold uppercase tracking-widest text-gray-500">
                  ── {row.section} ──
                </p>
              )}

              <button
                className={`
                  flex w-full items-center justify-between rounded-2xl px-5 py-3
                  text-lg sm:text-xl font-semibold transition-all duration-200
                  ${
                    focused
                      ? "scale-105 ring-4 ring-yellow-300 bg-gray-800 text-white shadow-lg shadow-yellow-300/20"
                      : "bg-gray-900 text-gray-400"
                  }
                  ${isBack ? "mt-3" : ""}
                `}
                aria-label={
                  isBack
                    ? "Voltar ao jogo"
                    : `${row.label}: ${valueLabel}. Pressione direita para alterar.`
                }
                aria-current={focused ? "true" : undefined}
                tabIndex={-1}
                onClick={() => {
                  setFocusIdx(idx);
                  cycleValue(row.id);
                }}
              >
                <span className="flex items-center gap-3">
                  {row.icon && (
                    <span aria-hidden="true">{row.icon}</span>
                  )}
                  <span>{row.label}</span>
                </span>

                {!isBack && (
                  <span
                    className={`
                      rounded-lg px-3 py-1 text-base sm:text-lg font-bold
                      ${
                        focused
                          ? "bg-yellow-300 text-gray-900"
                          : "bg-gray-700 text-gray-300"
                      }
                    `}
                  >
                    {valueLabel}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Instruções */}
      <p className="mt-5 text-center text-base sm:text-lg text-gray-500">
        ◀ mover &nbsp;&nbsp; ▶ alterar
      </p>
    </div>
  );
}
