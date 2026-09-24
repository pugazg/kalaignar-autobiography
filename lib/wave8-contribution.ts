// Wave 8 — this wave's exact contribution to the BUILT / public surface at its current stage, DERIVED from the committed
// stage record (never hand-typed). Earlier-wave validators that pin a live whole-build total ADD `build` (and exclude
// WAVE8_ROUTES from any frozen pre-wave route remainder) — the same reconciliation lib/wave7-b5-b6-k-contribution.ts
// provides for Wave-7 B5/B6/K. Single source of truth.
//
// P3 (direct, undiscovered): 483 new prerendered routes (Murasoli 42–47 · ஒரே முத்தம் · சங்கத் தமிழ்); no catalogue work,
// collection, /read entry or sitemap URL.
// P4 (published — data/internal/wave8/wave8-p4-publication.json): relative to the pre-Wave-8 public surface, +2 works
// (ore-mutham, sangatamil; Murasoli 42–47 join the existing murasoli-letters work), +0 collections, +2 /read entries
// (+1 initially visible), +483 sitemap URLs. `build` stays 483: those routes exist since P3 — P4 adds none.
import fs from "node:fs";
import path from "node:path";

type Stage = { stage: string; sitemapExposed: boolean; cohorts: Record<string, { routes: string[] }> };
const FILE = path.join(process.cwd(), "data/internal/wave8/wave8-p3-routes.json");
const record: Stage | null = fs.existsSync(FILE) ? (JSON.parse(fs.readFileSync(FILE, "utf8")) as Stage) : null;
type Published = { stage: string; published: boolean; newWorkShelves: Record<string, number>; catalogue: { delta: number }; collections: { delta: number }; discovery: { delta: number }; visible: { delta: number }; sitemap: { delta: number } };
const P4_FILE = path.join(process.cwd(), "data/internal/wave8/wave8-p4-publication.json");
const p4: Published | null = fs.existsSync(P4_FILE) ? (JSON.parse(fs.readFileSync(P4_FILE, "utf8")) as Published) : null;
/** True once the Wave-8 cohort is published (P4). */
export const WAVE8_PUBLISHED = !!p4 && p4.stage === "P4" && p4.published === true;

/** Every Wave-8 direct route the build prerenders at the current stage. */
export const WAVE8_ROUTES: readonly string[] = record ? Object.values(record.cohorts).flatMap((c) => c.routes) : [];

export const WAVE8_CONTRIBUTION = {
  /** New published works (P4: ore-mutham + sangatamil). */
  works: WAVE8_PUBLISHED ? p4!.catalogue.delta : 0,
  /** Per-shelf new works (P4: Drama +1 ore-mutham, Literary Commentary +1 sangatamil). */
  drama: WAVE8_PUBLISHED ? p4!.newWorkShelves["drama"] ?? 0 : 0,
  literaryCommentary: WAVE8_PUBLISHED ? p4!.newWorkShelves["literary-commentary"] ?? 0 : 0,
  collections: WAVE8_PUBLISHED ? p4!.collections.delta : 0,
  /** New /read discovery entries (P4: the two standalone works). */
  discovery: WAVE8_PUBLISHED ? p4!.discovery.delta : 0,
  /** Newly visible /read entries under the 6-per-shelf cap (P4: Literary Commentary 3→4; Drama already over cap). */
  visible: WAVE8_PUBLISHED ? p4!.visible.delta : 0,
  /** Sitemap URLs added (0 until the cohort is published; then exactly the P3 route set). */
  sitemap: WAVE8_PUBLISHED ? p4!.sitemap.delta : record?.sitemapExposed ? WAVE8_ROUTES.length : 0,
  /** Prerendered routes added relative to pre-Wave-8 (483 since P3; P4 adds none). */
  build: WAVE8_ROUTES.length,
} as const;
