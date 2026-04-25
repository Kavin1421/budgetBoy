import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://budget-boy-ochre.vercel.app";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/wizard`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/docs`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/dashboard`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
  ];
}
