import type { MetadataRoute } from "next";
import { chapterIndex } from "@/data/references";

const BASE = "https://kalaignar-autobiography.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/read`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...chapterIndex.map((c) => ({
      url: `${BASE}/read/${c.id}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
