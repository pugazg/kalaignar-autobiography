// Wave 7 (Batch 3: Novels) novel slugs — Wave-7 HIDDEN helper registry (P3).
//
// The five Wave-7 Batch-3 novels are onboarded as DIRECT reader routes at P3 but stay ABSENT from the
// public NOVEL_SLUGS / catalogue / discovery / sitemap until P4. The generic /novels/[slug] route family
// unions this registry with NOVEL_SLUGS ∪ WAVE6_NOVEL_SLUGS under a de-duplicating Set. Their frozen P1
// payload is the prose reading layer, so the routes adapt it into the Fiction `Novel` model with
// lib/wave7-novels-adapter.ts. Each [section] set is derived from the frozen sections[] — never a 1..N
// range, and the source chapter-number gap (surulimalai prints no chapters 6/7) is preserved exactly.
export const WAVE7_NOVEL_SLUGS = ["arumbu", "nadutheru-narayani", "sarapallam-samundi", "surulimalai", "vellikkizhamai"] as const;
export type Wave7NovelSlug = (typeof WAVE7_NOVEL_SLUGS)[number];
export const isWave7Novel = (slug: string): slug is Wave7NovelSlug =>
  (WAVE7_NOVEL_SLUGS as readonly string[]).includes(slug);
