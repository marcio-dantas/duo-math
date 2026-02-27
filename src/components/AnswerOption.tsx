interface AnswerOptionProps {
  /** Valor da resposta exibido no botão */
  value: number | string;
  /** Lado da opção: esquerda ou direita */
  side: "left" | "right";
}

/**
 * Botão de resposta grande e acessível.
 * Azul para esquerda, verde para direita — cores distintas
 * que reforçam o mapeamento com os acionadores físicos.
 */
export default function AnswerOption({ value, side }: AnswerOptionProps) {
  const colors =
    side === "left"
      ? "bg-blue-600 hover:bg-blue-500 focus-visible:bg-blue-500"
      : "bg-green-600 hover:bg-green-500 focus-visible:bg-green-500";

  const label =
    side === "left"
      ? `Opção esquerda: ${value}`
      : `Opção direita: ${value}`;

  return (
    <button
      className={`${colors} flex items-center justify-center w-full h-full rounded-3xl transition-colors select-none`}
      aria-label={label}
    >
      <span className="text-7xl sm:text-8xl md:text-9xl font-bold text-white">
        {value}
      </span>
    </button>
  );
}
