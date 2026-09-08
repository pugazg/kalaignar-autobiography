// Wave 6 (Batch 1: Ammayappan) child-route slugs, derived from the frozen reader registry. This is
// the single authority for the work's `[section]` route set: the page builds its
// `generateStaticParams` from it. Following the Film Songs / Wave-5 lesson — the released registry is
// the route authority, never a reconstructed 1..N numeric range.
import type { AmmaiyappanReader } from "@/data/ammaiyappan";

/** Ammayappan `[section]` slugs: one per archival scene segment, in source order. `scene-NNN`. */
export function ammaiyappanSectionSlugs(r: AmmaiyappanReader): string[] {
  return r.screenplayScenes.map((s) => `scene-${String(s.archivalSceneOrdinal).padStart(3, "0")}`);
}
