// Wave 8 — this wave's exact contribution to the BUILT / public surface at its current stage, DERIVED from the committed
// stage record (never hand-typed). Earlier-wave validators that pin a live whole-build total ADD `build` (and exclude
// WAVE8_ROUTES from any frozen pre-wave route remainder) — the same reconciliation lib/wave7-b5-b6-k-contribution.ts
// provides for Wave-7 B5/B6/K. Single source of truth.
//
// P3 (direct, undiscovered): 483 new prerendered routes (Murasoli 42–47 · ஒரே முத்தம் · சங்கத் தமிழ்); no catalogue work,
// collection, /read entry or sitemap URL. P4 will extend this record when the cohort is published.
import fs from "node:fs";
import path from "node:path";

type Stage = { stage: string; sitemapExposed: boolean; cohorts: Record<string, { routes: string[] }> };
const FILE = path.join(process.cwd(), "data/internal/wave8/wave8-p3-routes.json");
const record: Stage | null = fs.existsSync(FILE) ? (JSON.parse(fs.readFileSync(FILE, "utf8")) as Stage) : null;

/** Every Wave-8 direct route the build prerenders at the current stage. */
export const WAVE8_ROUTES: readonly string[] = record ? Object.values(record.cohorts).flatMap((c) => c.routes) : [];

export const WAVE8_CONTRIBUTION = {
  works: 0,
  collections: 0,
  discovery: 0,
  visible: 0,
  /** Sitemap URLs added (0 until the cohort is published). */
  sitemap: record?.sitemapExposed ? WAVE8_ROUTES.length : 0,
  /** Prerendered routes added. */
  build: WAVE8_ROUTES.length, // 483 at P3
} as const;
