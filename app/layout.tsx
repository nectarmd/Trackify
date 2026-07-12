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
  applicationName: "Trackify",
  // O Safari NÃO lê `display: standalone` do manifesto — ele depende destas
  // metatags. Sem elas, o app abre com a barra do navegador mesmo instalado.
  appleWebApp: {
    capable: true,
    title: "Trackify",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-icon.png",
  },
};

// viewportFit: "cover" é o que faz o iOS expor as safe areas (env(safe-area-inset-*)),
// necessárias para o menu inferior não ficar atrás da barra do Safari.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#03A9F4",
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
