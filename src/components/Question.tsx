interface QuestionProps {
  /** Texto da pergunta, ex: "12 + 15 = ?" */
  text: string;
}

/**
 * Exibe a pergunta matemática centralizada.
 * Fonte extra-grande com sombra de texto para
 * acessibilidade em baixa visão (WCAG AAA).
 *
 * Tamanhos: 72 px → 96 px → 128 px (min 48 px ✅).
 */
export default function Question({ text }: QuestionProps) {
  return (
    <h1 className="text-7xl sm:text-8xl md:text-9xl font-extrabold text-white text-center leading-tight select-none text-shadow-game">
      {text}
    </h1>
  );
}
