import type { MetadataRoute } from "next";
import { PRODUCT_NAME, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_TITLE,
    short_name: PRODUCT_NAME,
    description: SITE_DESCRIPTION,
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d10",
    theme_color: "#0b0d10",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
