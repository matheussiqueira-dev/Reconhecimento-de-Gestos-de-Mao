import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: `${SITE_TITLE}: demo no navegador`,
} as const;

/** Defaults for every route; pages add their URL through pageMetadata(). */
export const SHARED_SOCIAL: Pick<Metadata, "openGraph" | "twitter"> = {
  openGraph: {
    type: "website",
    siteName: "Matheus Siqueira",
    locale: "pt_BR",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE.url, alt: OG_IMAGE.alt }],
  },
};

/**
 * Metadata for one route. Next.js replaces nested objects such as openGraph instead of
 * merging them with the layout's, so canonical, og:url, titles and images are set together
 * here to keep them consistent.
 */
export function pageMetadata(page: { path: string; title?: string; description?: string }): Metadata {
  const socialTitle = page.title ? `${page.title} | ${SITE_TITLE}` : SITE_TITLE;
  const description = page.description ?? SITE_DESCRIPTION;
  return {
    ...(page.title ? { title: page.title } : {}),
    description,
    alternates: { canonical: page.path },
    openGraph: { ...SHARED_SOCIAL.openGraph, url: page.path, title: socialTitle, description },
    twitter: { ...SHARED_SOCIAL.twitter, title: socialTitle, description },
  };
}
