import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BudgetBoy",
    short_name: "BudgetBoy",
    description: "Smart telecom and subscription optimizer for Indian households.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/budget.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/budget.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
