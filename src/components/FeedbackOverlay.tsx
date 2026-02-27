interface FeedbackOverlayProps {
  /** Tipo de resultado */
  result: "correct" | "wrong";
  /** Classes Tailwind de tamanho do emoji (vem da config de fonte). */
  emojiClass?: string;
}

/**
 * Sobreposição semitransparente que colore toda a tela
 * quando o jogador responde, reforçando o feedback visual.
 *
 * Verde para acerto, vermelho para erro.
 * Emoji extra-grande com sombra para baixa visão.
 * Opacidade mais forte para contraste claro.
 */
export default function FeedbackOverlay({
  result,
  emojiClass = "text-[10rem] sm:text-[14rem] md:text-[16rem]",
}: FeedbackOverlayProps) {
  const isCorrect = result === "correct";

  const bg = isCorrect ? "bg-green-600/40" : "bg-red-600/40";

  const emoji = isCorrect ? "✅" : "❌";
  const label = isCorrect ? "Resposta correta!" : "Resposta errada!";

  return (
    <div
      className={`${bg} absolute inset-0 z-10 flex items-center justify-center pointer-events-none transition-opacity duration-200`}
      role="status"
      aria-live="assertive"
      aria-label={label}
    >
      <span className={`${emojiClass} drop-shadow-2xl animate-bounce`}>
        {emoji}
      </span>
    </div>
  );
}
