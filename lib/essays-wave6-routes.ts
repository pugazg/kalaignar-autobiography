// Wave 6 (Batch 6: Essays & Articles) undiscovered Essay publication slugs.
//
// These five publications are authorized for DIRECT reader routes only (Wave 6 P3). They are
// deliberately NOT in `ESSAY_SLUGS` (data/essays.ts) — the DISCOVERED registry that drives the
// sitemap — and they have NO entry in data/library.ts (the catalogue) or any `/read` shelf/collection.
// Keeping the Wave-6 slugs here — and only here — lets the generic `/essays/[slug]` route family
// prerender them (so they are URL-addressable) while they stay absent from discovery / catalogue /
// sitemap until Wave 6 P4 (NOT authorized).
//
// Route shapes (proved exactly by the Batch-6 route test against these registries and each work's own
// frozen public/data/essays/<slug>/publication.json):
//   * `/essays/<slug>` landing + `/essays/<slug>/source` + one `/essays/<slug>/articles/<article>`
//     per frozen article. Article child slugs come from each work's own `articles[]`, never `1..N`.
//   * ina-muzhakkam 6 + kolaikkalam 6 + kudumbaththin-nalvilakku 1 + sinthanaiyum-seyalum 50 +
//     vedhanai-ch-siraiyinindrum-viduthalai-pera 1 = 64 articles → 5×2 + 64 = 74 direct routes.

/** Wave-6 Batch-6 Essay publication slugs (each: landing + /source + one route per frozen article). NOT in ESSAY_SLUGS. */
export const WAVE6_ESSAY_SLUGS = [
  "ina-muzhakkam",
  "kolaikkalam",
  "kudumbaththin-nalvilakku",
  "sinthanaiyum-seyalum",
  "vedhanai-ch-siraiyinindrum-viduthalai-pera",
] as const;
export type Wave6EssaySlug = (typeof WAVE6_ESSAY_SLUGS)[number];

export const isWave6Essay = (slug: string): slug is Wave6EssaySlug =>
  (WAVE6_ESSAY_SLUGS as readonly string[]).includes(slug);
