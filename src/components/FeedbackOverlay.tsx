interface FeedbackOverlayProps {
  /** Tipo de resultado */
  result: "correct" | "wrong";
}

/**
 * Sobreposição semitransparente que colore toda a tela
 * quando o jogador responde, reforçando o feedback visual.
 *
 * Verde para acerto, vermelho para erro.
 * Inclui emoji grande para acessibilidade (baixa visão).
 */
export default function FeedbackOverlay({ result }: FeedbackOverlayProps) {
  const isCorrect = result === "correct";

  const bg = isCorrect
    ? "bg-green-500/30"
    : "bg-red-500/30";

  const emoji = isCorrect ? "✅" : "❌";
  const label = isCorrect ? "Resposta correta!" : "Resposta errada!";

  return (
    <div
      className={`${bg} absolute inset-0 z-10 flex items-center justify-center pointer-events-none transition-opacity duration-200`}
      role="status"
      aria-live="assertive"
      aria-label={label}
    >
      <span className="text-9xl sm:text-[12rem] md:text-[14rem] drop-shadow-lg animate-bounce">
        {emoji}
      </span>
    </div>
  );
}
