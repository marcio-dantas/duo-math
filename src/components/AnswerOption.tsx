export type AnswerFeedback = "correct" | "wrong" | null;

interface AnswerOptionProps {
  /** Valor da resposta exibido no botão */
  value: number | string;
  /** Lado da opção: esquerda ou direita */
  side: "left" | "right";
  /** Indica se esta opção foi selecionada pelo acionador */
  selected?: boolean;
  /** Estado de feedback após resposta */
  feedback?: AnswerFeedback;
  /** Callback disparado ao clicar ou pressionar o acionador */
  onSelect?: () => void;
}

/*
 * Paleta de alto contraste (WCAG AAA — 7:1 com branco):
 *
 *   blue-800  (#1e40af)  →  8,7 : 1  ✅
 *   green-800 (#166534)  →  7,3 : 1  ✅
 *   green-900 (#14532d)  →  8,4 : 1  ✅  (feedback correto)
 *   red-800   (#991b1b)  →  8,4 : 1  ✅  (feedback errado)
 */

/**
 * Botão de resposta grande e acessível.
 *
 * Alto contraste + sombra de texto para baixa visão.
 * Números mínimos de 72 px (≥ 64 px exigidos).
 * Anel de seleção grosso (6 px) para visibilidade.
 */
export default function AnswerOption({
  value,
  side,
  selected = false,
  feedback = null,
  onSelect,
}: AnswerOptionProps) {
  /* ── Cores por estado ── */
  let colorClass: string;
  let indicator = "";

  if (feedback === "correct") {
    colorClass = "bg-green-900 ring-[6px] ring-white scale-105";
    indicator = "✅";
  } else if (feedback === "wrong") {
    colorClass = "bg-red-800 ring-[6px] ring-white/60";
    indicator = "❌";
  } else {
    const baseColor =
      side === "left"
        ? "bg-blue-800 hover:bg-blue-700 focus-visible:bg-blue-700"
        : "bg-green-800 hover:bg-green-700 focus-visible:bg-green-700";
    const selectedRing = selected ? "ring-[6px] ring-white scale-105" : "";
    colorClass = `${baseColor} ${selectedRing}`;
  }

  const label =
    side === "left"
      ? `Opção esquerda: ${value}`
      : `Opção direita: ${value}`;

  return (
    <button
      className={`${colorClass} relative flex items-center justify-center w-full h-full rounded-3xl transition-all duration-200 select-none`}
      aria-label={`${label}${feedback === "correct" ? " — correto" : ""}${feedback === "wrong" ? " — errado" : ""}`}
      aria-pressed={selected || feedback !== null}
      onClick={onSelect}
      disabled={feedback !== null}
    >
      <span className="text-7xl sm:text-8xl md:text-9xl font-extrabold text-white text-shadow-game">
        {value}
      </span>

      {/* Indicador de feedback — grande para baixa visão */}
      {indicator && (
        <span
          className="absolute top-3 right-4 text-5xl sm:text-6xl md:text-7xl drop-shadow-lg"
          aria-hidden="true"
        >
          {indicator}
        </span>
      )}
    </button>
  );
}
