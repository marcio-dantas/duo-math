interface QuestionProps {
  /** Texto da pergunta, ex: "12 + 15 = ?" */
  text: string;
  /** Classes Tailwind de tamanho do texto (vem da config de fonte). */
  textClass?: string;
}

/**
 * Exibe a pergunta matemática centralizada.
 * Fonte extra-grande com sombra de texto para
 * acessibilidade em baixa visão (WCAG AAA).
 *
 * Tamanho padrão (M): 72 px → 96 px → 128 px (min 48 px ✅).
 * Configurável via prop `textClass` (tamanhos P, M, G, GG).
 */
export default function Question({
  text,
  textClass = "text-7xl sm:text-8xl md:text-9xl",
}: QuestionProps) {
  return (
    <h1
      className={`${textClass} font-extrabold text-white text-center leading-tight select-none text-shadow-game`}
    >
      {text}
    </h1>
  );
}
