// Wave 6 (Batch 5: Novels) undiscovered novel slugs.
//
// These two novels are authorized for DIRECT reader routes only (Wave 6 P3). They are deliberately
// NOT in `NOVEL_SLUGS` (data/novels.ts) — the DISCOVERED novel registry that drives the sitemap —
// and they have NO entry in data/library.ts (the catalogue) or any `/read` shelf/collection. Keeping
// the Wave-6 slugs here — and only here — lets the generic `/novels/[slug]` route family prerender
// them (so they are URL-addressable) while they stay absent from discovery / catalogue / sitemap /
// shelf / collection until Wave 6 P4 (NOT authorized).
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
