import murasoliIndex from "@/public/data/murasoli/index.json";
import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { chapterIndex } from "@/data/references";
import type { MurasoliIndex, MurasoliLettersIndex } from "@/data/murasoli";

const BASE = "https://nenjukkuneethi.org";

function loadLetterIds(): string[] {
  try {
    const p = path.join(process.cwd(), "public/data/murasoli/letters-index.json");
    const idx: MurasoliLettersIndex = JSON.parse(fs.readFileSync(p, "utf-8"));
    return idx.volumes.flatMap((v) => v.letters.map((l) => l.id));
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const idx = murasoliIndex as MurasoliIndex;
  const murasoliIds = [...loadLetterIds(), ...idx.volumes.flatMap((v) => v.pages.map((p) => p.id))];
  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/read`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...chapterIndex.map((c) => ({
      url: `${BASE}/read/${c.id}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    { url: `${BASE}/murasoli`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...murasoliIds.map((id) => ({
      url: `${BASE}/murasoli/${id}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
