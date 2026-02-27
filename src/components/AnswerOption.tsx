interface AnswerOptionProps {
  /** Valor da resposta exibido no botão */
  value: number | string;
  /** Lado da opção: esquerda ou direita */
  side: "left" | "right";
  /** Indica se esta opção foi selecionada pelo acionador */
  selected?: boolean;
  /** Callback disparado ao clicar ou pressionar o acionador */
  onSelect?: () => void;
}

/**
 * Botão de resposta grande e acessível.
 * Azul para esquerda, verde para direita — cores distintas
 * que reforçam o mapeamento com os acionadores físicos.
 *
 * Quando selecionado, exibe um anel branco e um leve aumento
 * de escala para feedback visual claro (baixa visão).
 */
export default function AnswerOption({
  value,
  side,
  selected = false,
  onSelect,
}: AnswerOptionProps) {
  const colors =
    side === "left"
      ? "bg-blue-600 hover:bg-blue-500 focus-visible:bg-blue-500"
      : "bg-green-600 hover:bg-green-500 focus-visible:bg-green-500";

  const selectedRing = selected
    ? "ring-4 ring-white scale-105"
    : "";

  const label =
    side === "left"
      ? `Opção esquerda: ${value}`
      : `Opção direita: ${value}`;

  return (
    <button
      className={`${colors} ${selectedRing} flex items-center justify-center w-full h-full rounded-3xl transition-all duration-150 select-none`}
      aria-label={label}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="text-7xl sm:text-8xl md:text-9xl font-bold text-white">
        {value}
      </span>
    </button>
  );
}
