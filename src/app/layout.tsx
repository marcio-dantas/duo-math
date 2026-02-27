import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "duo-math",
  description:
    "Jogo acessível de matemática com duas opções de resposta, controlado por acionadores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
