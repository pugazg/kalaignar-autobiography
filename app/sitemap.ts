import murasoliIndex from "@/public/data/murasoli/index.json";
import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { chapterIndex } from "@/data/references";
import type { MurasoliIndex, MurasoliLettersIndex } from "@/data/murasoli";
import { SPEECH_SLUGS } from "@/data/speeches";
import { POEM_SLUGS } from "@/data/poems";
import { ESSAY_SLUGS } from "@/data/essays";
import { NOVEL_SLUGS } from "@/data/novels";
import { PLAY_SLUGS } from "@/data/plays";
import { STORY_SLUGS } from "@/data/stories";

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

/**
 * Parasakthi's scene slugs, from the generated index.
 *
 * Like Manohara — and unlike speeches, poems, essays, novels and plays — this work has no exported
 * slug registry in `data/`; its units come from the archive and live in the generated data, so the
 * sitemap reads them there. That is also what makes this safe: the booklet never prints headings 23
 * or 34, so those slugs are not in the registry, no route exists for them, and no sitemap URL can be
 * emitted for them. The list cannot drift from the routes because both read the same file.
 */
function loadParasakthiSceneSlugs(): string[] {
  try {
    const p = path.join(process.cwd(), "public/data/cinema/parasakthi/index.json");
    const idx = JSON.parse(fs.readFileSync(p, "utf-8")) as { scenes: { slug: string }[] };
    return idx.scenes.map((s) => s.slug);
  } catch {
    return [];
  }
}

/**
 * Tirumbippaar's scene slugs, from the generated index — the same registry the routes are built
 * from, so the two cannot drift.
 *
 * This booklet numbers its 93 headings consecutively, so `scene-01`…`scene-93` would happen to
 * produce the same list today. It is still read from the registry rather than generated, for the
 * same reason Parasakthi's is: the sitemap must describe the routes that exist, not the routes a
 * numbering convention predicts. Parasakthi is the proof — enumerating 1–48 there would emit two
 * URLs for headings the booklet never prints.
 */
function loadTirumbippaarSceneSlugs(): string[] {
  try {
    const p = path.join(process.cwd(), "public/data/cinema/tirumbippaar/index.json");
    const idx = JSON.parse(fs.readFileSync(p, "utf-8")) as { scenes: { slug: string }[] };
    return idx.scenes.map((s) => s.slug);
  } catch {
    return [];
  }
}

/**
 * Film Songs lyric slugs, from the SAME generated registry that drives the route's
 * `generateStaticParams`. Reading it here rather than enumerating `song-001`…`song-054` is what
 * keeps the sitemap and the router from drifting apart: the numbering is consecutive today, but the
 * registry is the authority, and one item named in the 2024 front matter has no numbered lyric and
 * is deliberately absent from it. A numeric loop would happily invent a URL for it.
 */
function loadThiraiIsaiPaadalgalSongSlugs(): string[] {
  try {
    const p = path.join(process.cwd(), "public/data/cinema/thirai-isai-paadalgal/index.json");
    const idx = JSON.parse(fs.readFileSync(p, "utf-8")) as { songs: { slug: string }[] };
    return idx.songs.map((s) => s.slug);
  } catch {
    return [];
  }
}

function loadNovelSectionSlugs(slug: string): string[] {
  try {
    const p = path.join(process.cwd(), "public/data/novels", slug, "novel.json");
    const n = JSON.parse(fs.readFileSync(p, "utf-8")) as { sections: { slug: string }[] };
    return n.sections.map((s) => s.slug);
  } catch {
    return [];
  }
}

/** Scene slugs come from the generated play data, so the sitemap can never drift from the routes. */
function loadPlaySceneSlugs(slug: string): string[] {
  try {
    const p = path.join(process.cwd(), "public/data/plays", slug, "play.json");
    const play = JSON.parse(fs.readFileSync(p, "utf8")) as { scenes: { slug: string }[] };
    return play.scenes.map((s) => s.slug);
  } catch {
    return [];
  }
}

/**
 * Kural and அதிகாரம் numbers come from the generated Thirukkural index, exactly as every other
 * loader here reads from generated data, so the sitemap can never drift from the routes that
 * actually exist.
 */
function loadThirukkural(): { kurals: number[]; adhikarams: number[] } {
  try {
    const p = path.join(process.cwd(), "public/data/thirukkural/index.json");
    const idx = JSON.parse(fs.readFileSync(p, "utf-8")) as {
      kurals: { number: number }[];
      adhikarams: { number: number }[];
    };
    return { kurals: idx.kurals.map((k) => k.number), adhikarams: idx.adhikarams.map((a) => a.number) };
  } catch {
    return { kurals: [], adhikarams: [] };
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
  const thirukkural = loadThirukkural();
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
    // Cinema Writing — பராசக்தி (Phase C). Landing, provenance, and one route per SOURCE-PRINTED
    // scene. Same shape as Manohara above and the same priorities, but the units are not the same
    // kind of thing: Manohara's are archive-created navigation segments, these are the booklet's own
    // 46 printed scenes. Nothing here enumerates 1–48 and filters — the two headings the booklet
    // never prints are simply absent from the generated registry, so they cannot be emitted.
    { url: `${BASE}/cinema/parasakthi`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/cinema/parasakthi/source`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    ...loadParasakthiSceneSlugs().map((slug) => ({
      url: `${BASE}/cinema/parasakthi/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
    // Cinema Writing — திரும்பிப்பார் (Phase D2.4). The third cinema work, and the same shape and
    // priorities as the two above: landing, provenance, one route per source-printed scene. Its 93
    // headings are the booklet's own, like Parasakthi's and unlike Manohara's archive-created
    // segments. Ordered after Parasakthi to match the catalogue shelf, which lists cinema works in
    // onboarding order. The reader, scene and source routes were published in D2.2 and catalogued in
    // D2.3; this block is only what makes them crawlable.
    { url: `${BASE}/cinema/tirumbippaar`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/cinema/tirumbippaar/source`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    ...loadTirumbippaarSceneSlugs().map((slug) => ({
      url: `${BASE}/cinema/tirumbippaar/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
    // Cinema Writing — கலைஞர் திரை இசைப் பாடல்கள் (Phase E4). The fourth cinema work, ordered after
    // Tirumbippaar to match the catalogue shelf's onboarding order. Its shape differs from the three
    // above in two ways that are deliberate, not oversights:
    //
    //   * NO /source entry. This is the one cinema work with no public provenance route — its
    //     archival apparatus is kept outside the served tree — so emitting one would advertise a
    //     page that intentionally does not exist.
    //   * NO per-film entries. The 23 films are grouping anchors on the landing, not routes, and a
    //     sitemap lists pages rather than fragments.
    //
    // That leaves exactly the routes the reader actually has: the landing and one page per lyric.
    { url: `${BASE}/cinema/thirai-isai-paadalgal`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...loadThiraiIsaiPaadalgalSongSlugs().map((slug) => ({
      url: `${BASE}/cinema/thirai-isai-paadalgal/${slug}`,
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
    // Fiction. The novel landing, its provenance page and one stable route per assembled section.
    // No /novels or /fiction collection landing is added.
    ...NOVEL_SLUGS.flatMap((slug) => [
      { url: `${BASE}/novels/${slug}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.7 },
      { url: `${BASE}/novels/${slug}/source`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.4 },
      ...loadNovelSectionSlugs(slug).map((x) => ({
        url: `${BASE}/novels/${slug}/${x}`,
        lastModified: now,
        changeFrequency: "yearly" as const,
        priority: 0.5,
      })),
    ]),
    // Fiction — short stories (Phase 8, benchmark B). Reader + provenance per story, and nothing
    // else: a short story is read on ONE page, so unlike the novel, the play and the essay
    // publication it has no sub-unit routes to list. That makes its shape the poem's, not the
    // novel's — hence the same 0.6/0.4 priorities as poems and speeches rather than the 0.7 those
    // three carry as landings for multi-unit works.
    //
    // Driven by STORY_SLUGS, so onboarding a second short story needs no edit here. Note that this
    // block had to be written: importing a registry does not wire it in, and every family above has
    // its own explicit entry for the same reason.
    ...STORY_SLUGS.flatMap((slug) => [
      { url: `${BASE}/stories/${slug}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.6 },
      { url: `${BASE}/stories/${slug}/source`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.4 },
    ]),
    // Drama. The play landing, its provenance page and one stable route per printed scene, plus the
    // separate unnumbered closing tableau. No /plays or /drama collection landing is added.
    ...PLAY_SLUGS.flatMap((slug) => [
      { url: `${BASE}/plays/${slug}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.7 },
      { url: `${BASE}/plays/${slug}/source`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.4 },
      ...loadPlaySceneSlugs(slug).map((x) => ({
        url: `${BASE}/plays/${slug}/${x}`,
        lastModified: now,
        changeFrequency: "yearly" as const,
        priority: 0.5,
      })),
    ]),
    // LITERARY COMMENTARY — Thirukkural (Phase 8D-1). The landing, its provenance page, one
    // route per அதிகாரம் and one per குறள்.
    //
    // WHY EVERY KURAL IS LISTED. The established strategy in this file is landing + provenance +
    // one entry per reading unit, derived from generated data — Murasoli lists 688 such URLs and
    // Tholkappiyam 103. The குறள் page is this work's reading unit: it is what the Daily Kural
    // links to, what a reader searching a half-remembered line is looking for, and the only place
    // Kalaignar's உரை on that couplet appears. Listing only /thirukkural would leave the substance
    // of the work — 1330 distinct commentaries — undiscoverable, which is the opposite of crawl
    // quality. This adds 1465 URLs to a sitemap of ~1300, far inside the 50,000-URL limit, so
    // there is no explosion to avoid. அதிகாரம் pages rank a step below the landing because they
    // are navigational hubs; the குறள் pages carry the reading.
    { url: `${BASE}/thirukkural`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE}/thirukkural/source`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.4 },
    ...thirukkural.adhikarams.map((n) => ({
      url: `${BASE}/thirukkural/adhikaram/${n}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...thirukkural.kurals.map((n) => ({
      url: `${BASE}/thirukkural/kural/${n}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
