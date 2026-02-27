interface QuestionProps {
  /** Texto da pergunta, ex: "12 + 15 = ?" */
  text: string;
}

/**
 * Exibe a pergunta matemática centralizada.
 * Fonte extra-grande para acessibilidade (baixa visão).
 */
export default function Question({ text }: QuestionProps) {
  return (
    <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold text-white text-center leading-tight select-none">
      {text}
    </h1>
  );
}
