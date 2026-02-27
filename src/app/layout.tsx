import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "duo-math",
  description:
    "Jogo acessível de matemática com duas opções de resposta, controlado por acionadores",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* Permite zoom para acessibilidade (WCAG 1.4.4) */
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full w-full">
      <body className="h-full w-full overflow-hidden">{children}</body>
    </html>
  );
}
