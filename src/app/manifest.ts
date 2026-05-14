import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kooqs.Takeout",
    short_name: "Kooqs",
    description: "Fresh. Fast. Flavorful. Order takeout from Kooqs.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#DC1A17",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    categories: ["food", "shopping"],
  };
}
