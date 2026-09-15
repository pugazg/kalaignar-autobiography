// Wave 6 (Batch 5: Novels) novel slugs — Wave-6 helper registry.
//
// These two novels were onboarded as DIRECT reader routes in Wave 6 P3 and PUBLISHED in Wave 6 P4:
// they are now promoted into `NOVEL_SLUGS` (data/novels.ts) — the discovered novel registry that drives
// the sitemap — and each has a published entry in data/library.ts (the fiction shelf) surfaced in
// `/read` discovery. This Wave-6 registry is retained for classification and route-union composition;
// the generic `/novels/[slug]` route family unions it with `NOVEL_SLUGS` under a de-duplicating `Set`,
// so each slug prerenders exactly once.
//
// Route shapes (proved exactly by the Batch-5 route test against these registries and each work's own
// frozen public/data/novels/<slug>/novel.json):
//   * பெரிய இடத்துப் பெண் (`periya-idathup-pen`) — landing (`/novels/<slug>`) + `/source` + one child
//     route per assembled reading division (7 sections)  → 9 routes;
//   * புதையல் (`pudhaiyal`) — landing + `/source` + one child route per literary unit (an
//     Introduction + 51 source chapters = 52 sections)   → 54 routes.
// Child `[section]` routes are derived from each work's own frozen `sections[]`, never from `1..N`,
// and the front-matter/printer-colophon/checkpoint paratext is NOT in that list, so it gets no route.

/** Wave-6 novel slugs (each: landing + /source + one route per frozen section). NOT in NOVEL_SLUGS. */
export const WAVE6_NOVEL_SLUGS = ["periya-idathup-pen", "pudhaiyal"] as const;
export type Wave6NovelSlug = (typeof WAVE6_NOVEL_SLUGS)[number];

export const isWave6Novel = (slug: string): slug is Wave6NovelSlug =>
  (WAVE6_NOVEL_SLUGS as readonly string[]).includes(slug);
