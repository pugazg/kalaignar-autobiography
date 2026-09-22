// Wave 7 (Batch 4: Essays) publication slugs — Wave-7 HIDDEN helper registry (P3).
//
// The six Wave-7 Batch-4 publications are onboarded as DIRECT reader routes at P3 but stay ABSENT from the
// public ESSAY_SLUGS / catalogue / discovery / sitemap until P4. The generic /essays/[slug] route family
// unions this registry with ESSAY_SLUGS ∪ WAVE6_ESSAY_SLUGS under a de-duplicating Set. Each article child
// route is derived from the work's own frozen publication.json.articles[] — never a 1..N range.
export const WAVE7_ESSAY_SLUGS = [
  "aaru-maatha-kadungkaaval",
  "thudikkum-ilamai",
  "perumoochu",
  "viduthalai-kilarcci",
  "meesai-mulaiththa-vayathil",
  "pesum-kalai-valarppom",
] as const;
export type Wave7EssaySlug = (typeof WAVE7_ESSAY_SLUGS)[number];
export const isWave7Essay = (slug: string): slug is Wave7EssaySlug =>
  (WAVE7_ESSAY_SLUGS as readonly string[]).includes(slug);
