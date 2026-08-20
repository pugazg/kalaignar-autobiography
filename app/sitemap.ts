import murasoliIndex from "@/public/data/murasoli/index.json";
import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { chapterIndex } from "@/data/references";
import type { MurasoliIndex, MurasoliLettersIndex } from "@/data/murasoli";
import { SPEECH_SLUGS } from "@/data/speeches";
import { POEM_SLUGS } from "@/data/poems";
import { ESSAY_SLUGS } from "@/data/essays";

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

function loadTholkappiyamIds(): string[] {
  try {
    const p = path.join(process.cwd(), "public/data/tholkappiyam/index.json");
    const idx = JSON.parse(fs.readFileSync(p, "utf-8")) as { malars: { id: string }[] };
    return idx.malars.map((m) => m.id);
  } catch {
    return [];
  }
}

function loadManoharaSegmentSlugs(): string[] {
  try {
    const p = path.join(process.cwd(), "public/data/cinema/manohara/index.json");
    const idx = JSON.parse(fs.readFileSync(p, "utf-8")) as { segments: { slug: string }[] };
    return idx.segments.map((s) => s.slug);
  } catch {
    return [];
  }
}

function loadEssayArticleSlugs(slug: string): string[] {
  try {
    const p = path.join(process.cwd(), "public/data/essays", slug, "publication.json");
    const pub = JSON.parse(fs.readFileSync(p, "utf-8")) as { articles: { slug: string }[] };
    return pub.articles.map((a) => a.slug);
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
    { url: `${BASE}/read/nenjukku-neethi`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
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
    { url: `${BASE}/tholkappiyam`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...loadTholkappiyamIds().map((id) => ({
      url: `${BASE}/tholkappiyam/${id}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
    { url: `${BASE}/cinema/manohara`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/cinema/manohara/source`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    ...loadManoharaSegmentSlugs().map((slug) => ({
      url: `${BASE}/cinema/manohara/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
    ...SPEECH_SLUGS.flatMap((slug) => [
      { url: `${BASE}/speeches/${slug}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.6 },
      { url: `${BASE}/speeches/${slug}/source`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.4 },
    ]),
    // Poetry (Phase 4). Exactly the reader + provenance route per poem; no /poems collection
    // landing is added in this benchmark.
    ...POEM_SLUGS.flatMap((slug) => [
      { url: `${BASE}/poems/${slug}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.6 },
      { url: `${BASE}/poems/${slug}/source`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.4 },
    ]),
    // Essays & Articles (Phase 5). The publication landing, its provenance page and one stable
    // deep-linkable route per source-numbered article. No /essays collection landing is added.
    ...ESSAY_SLUGS.flatMap((slug) => [
      { url: `${BASE}/essays/${slug}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.7 },
      { url: `${BASE}/essays/${slug}/source`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.4 },
      ...loadEssayArticleSlugs(slug).map((a) => ({
        url: `${BASE}/essays/${slug}/articles/${a}`,
        lastModified: now,
        changeFrequency: "yearly" as const,
        priority: 0.5,
      })),
    ]),
  ];
}
