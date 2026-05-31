import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Navigation } from "@/components/layout/Navigation";
import { DeveloperCredits } from "@/components/credits/DeveloperCredits";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Hand Gesture Recognition Dashboard",
    template: "%s | Hand Gesture Recognition Dashboard",
  },
  description:
    "Dashboard de reconhecimento de gestos de mao com Python, OpenCV, MediaPipe, Next.js e webcam local.",
  manifest: "/manifest.json",
  authors: [{ name: "Matheus Siqueira", url: "https://www.matheussiqueira.dev" }],
  openGraph: {
    title: "Hand Gesture Recognition Dashboard",
    description:
      "Demonstração técnica de visão computacional com processamento local da webcam.",
    url: "https://github.com/matheussiqueira-dev/Reconhecimento-de-Gestos-de-Mao",
    siteName: "Hand Gesture Recognition Dashboard",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-shell">
          <Navigation />
          <main>{children}</main>
          <footer className="content-shell py-8">
            <DeveloperCredits />
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
