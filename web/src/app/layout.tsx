import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { AUTHOR, REPOSITORY_URL, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

const plex = IBM_Plex_Sans({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
  preload: true,
});

export const viewport: Viewport = { colorScheme: "dark", themeColor: "#0b0d10" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_TITLE} | Matheus Siqueira`, template: `%s | ${SITE_TITLE} | Matheus Siqueira` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_TITLE,
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  creator: AUTHOR.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Matheus Siqueira",
    locale: "pt_BR",
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${SITE_TITLE}: demo no navegador` }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og.png", alt: `${SITE_TITLE}: demo no navegador` }],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_TITLE,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  inLanguage: "pt-BR",
  codeRepository: REPOSITORY_URL,
  author: {
    "@type": "Person",
    name: AUTHOR.name,
    url: AUTHOR.url,
    sameAs: [AUTHOR.linkedin, AUTHOR.github],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      className={plex.variable}
      style={{ backgroundColor: "#0b0d10", colorScheme: "dark" }}
    >
      <head>
        <link rel="author" href={AUTHOR.url} />
        <script
          type="application/ld+json"
          // Static object defined above, serialised once; "<" is escaped so it cannot close the tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a className="ms-skip-link" href="#main-content">
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1} className="ms-container flex-1 pt-8 sm:pt-12">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
