import packageJson from "../../package.json";

export const PRODUCT_NAME = "Gestos de Mão";
export const SITE_TITLE = "Reconhecimento de Gestos de Mão";
export const SITE_DESCRIPTION =
  "Demo que reconhece gestos de mão pela câmera, direto no navegador: MediaPipe Hand Landmarker, regras explicáveis em TypeScript e Next.js. Nada é enviado.";

export const REPOSITORY_URL = "https://github.com/matheussiqueira-dev/Reconhecimento-de-Gestos-de-Mao";
export const PORTFOLIO_CASE_URL =
  "https://www.matheussiqueira.dev/pt-BR/projects/hand-gesture-recognition-realtime";
export const AUTHOR = {
  name: "Matheus Siqueira",
  url: "https://www.matheussiqueira.dev",
  linkedin: "https://www.linkedin.com/in/matheussiqueira-dev",
  github: "https://github.com/matheussiqueira-dev",
} as const;

const PRODUCTION_URL = "https://reconhecimento-de-mao.vercel.app";

function normalize(url: string): string {
  const withProtocol = /^https?:\/\//.test(url) ? url : `https://${url}`;
  return new URL(withProtocol).origin;
}

/**
 * Absolute origin for canonical URLs, Open Graph and the sitemap. Previews keep
 * pointing at production on purpose: a preview must never be the canonical page.
 */
export const SITE_URL = normalize(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || PRODUCTION_URL,
);

/** Server-only module: importing package.json here keeps it out of client bundles. */
export const APP_VERSION = packageJson.version;
export const COMMIT_SHA = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
