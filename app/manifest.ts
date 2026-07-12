import type { MetadataRoute } from "next";

/**
 * Manifesto do PWA.
 *
 * O `scope: "/"` é o ponto crítico. Sem manifesto, o iOS deduz o escopo pela
 * URL de onde o app foi instalado (ex.: "/tracker"). Qualquer navegação para
 * fora dali era tratada como site externo, e o sistema abria um navegador
 * embutido — a barra com a URL e o botão de fechar que aparecia ao trocar de
 * página. Declarando o escopo como a raiz, o app inteiro fica "dentro de casa".
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trackify - Controle de tempo",
    short_name: "Trackify",
    description: "Rastreie seu tempo de forma simples.",
    start_url: "/tracker",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#212A3A",
    theme_color: "#03A9F4",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
