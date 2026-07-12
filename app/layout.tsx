import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trackify - Controle de tempo",
  description: "Rastreie seu tempo de forma simples.",
};

// viewportFit: "cover" é o que faz o iOS expor as safe areas (env(safe-area-inset-*)),
// necessárias para o menu inferior não ficar atrás da barra do Safari.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`h-full antialiased ${montserrat.variable}`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
