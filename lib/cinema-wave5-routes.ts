// Wave 5 (Manthiri Kumari + Raja Rani) child-route slugs, derived from the frozen P2 reader
// registries. This is the single authority for the two works' route sets: the `[item]` / `[section]`
// pages build their `generateStaticParams` from it, and the sitemap enumerates the same set from it,
// so the two can never drift. Following the Film Songs lesson — the released registry is the route
// authority, never a reconstructed 1..N numeric range.
import type { ManthiriReader } from "@/data/manthiri-kumari";
import type { RajaRaniReader } from "@/data/raja-rani";

/** Manthiri Kumari `[item]` slugs: the story summary plus one per performance block, in source order. */
export function manthiriItemSlugs(r: ManthiriReader): string[] {
  return ["story-summary", ...r.performances.map((p) => `performance-${String(p.sourceOrder).padStart(2, "0")}`)];
}

/** Raja Rani `[section]` slugs: one per archival scene segment plus one per source-numbered song. */
export function rajaSectionSlugs(r: RajaRaniReader): string[] {
  return [
    ...r.screenplayScenes.map((s) => `scene-${String(s.archivalSceneOrdinal).padStart(3, "0")}`),
    ...r.numberedSongs.map((s) => `song-${String(s.numberedSongNumber).padStart(2, "0")}`),
  ];
}
