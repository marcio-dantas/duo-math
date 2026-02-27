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

/**
 * Botão de resposta grande e acessível.
 *
 * Estados visuais:
 * - Normal: azul (esquerda) / verde (direita)
 * - Selecionado: anel branco + leve scale
 * - Feedback correto: fundo verde brilhante + ✅
 * - Feedback errado: fundo vermelho + ❌
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
    colorClass = "bg-green-500 ring-4 ring-white scale-105";
    indicator = "✅";
  } else if (feedback === "wrong") {
    colorClass = "bg-red-500 ring-4 ring-white/50";
    indicator = "❌";
  } else {
    // Estado normal — azul/verde por lado
    const baseColor =
      side === "left"
        ? "bg-blue-600 hover:bg-blue-500 focus-visible:bg-blue-500"
        : "bg-green-600 hover:bg-green-500 focus-visible:bg-green-500";
    const selectedRing = selected ? "ring-4 ring-white scale-105" : "";
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
      <span className="text-7xl sm:text-8xl md:text-9xl font-bold text-white">
        {value}
      </span>

      {/* Indicador de feedback */}
      {indicator && (
        <span
          className="absolute top-2 right-3 text-4xl sm:text-5xl md:text-6xl"
          aria-hidden="true"
        >
          {indicator}
        </span>
      )}
    </button>
  );
}
