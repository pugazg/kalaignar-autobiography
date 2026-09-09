// Wave 6 (Batch 2: Drama) undiscovered play slugs.
//
// These three plays are authorized for DIRECT reader routes only (Wave 6 P3). They are deliberately
// NOT in `PLAY_SLUGS` (data/plays.ts), which is the DISCOVERED drama registry that drives the
// catalogue, `/read` discovery and the sitemap. Keeping them here — and only here — makes the generic
// `/plays/[slug]` route prerender them (so they are URL-addressable) while they stay absent from
// discovery/catalogue/sitemap until Wave 6 P4 (NOT authorized).
//
// Each play's `[scene]` route set is derived from its RELEASED registry (`play.json.readingUnits`),
// never from a reconstructed numeric range — the same released-registry-is-the-authority rule the
// cinema and Film Songs families follow. The batch's own Drama route test proves the manifest equals
// this registry-derived set exactly.
import fs from "node:fs";
import path from "node:path";

/** The three Wave-6 Batch-2 Drama works, in batch order. NOT part of PLAY_SLUGS. */
export const WAVE6_DRAMA_SLUGS = ["kagithapoo", "manimagudam", "thiruvalar-desiyampillai"] as const;
export type Wave6DramaSlug = (typeof WAVE6_DRAMA_SLUGS)[number];

/** The reading-unit slugs of one Wave-6 play, in source order, from its released play.json registry. */
export function wave6DramaSceneSlugs(slug: string): string[] {
  const p = path.join(process.cwd(), "public/data/plays", slug, "play.json");
  if (!fs.existsSync(p)) return [];
  const play = JSON.parse(fs.readFileSync(p, "utf8")) as { readingUnits: { slug: string }[] };
  return play.readingUnits.map((u) => u.slug);
}
