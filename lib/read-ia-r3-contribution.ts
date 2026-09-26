// Reading Room IA v2 R3 — the stage's exact contribution to the public surface, DERIVED from the generated R3 stage
// state (data/internal/r3/*.json) and the frozen pre-R3 boundary, never typed. The single source of truth for every
// catalogue / shelf / collection / discovery / build / sitemap term that earlier-wave validators add as R3 stages
// publish — the same reconciliation lib/wave8-contribution.ts and lib/read-ia-r2-contribution.ts provide.
//
// A term counts ONLY content whose stage is in the published stage state:
//   works      = CREATE identities published − publications demoted − existing works merged into witnesses
//   discovery  = the same per shelf (a promoted work is a standalone discovery entry; a demoted publication was one;
//                a merged work was a collection member, not an entry)
//   visible    = the change in Σ min(6, entries) over shelves (the historical 6-per-shelf discovery cap)
//   build / sitemap = published R3 locators whose route is not already in the pre-R3 sitemap (the plan adds none)
// R3-A publishes no R3 content: every term is 0.
import fs from "node:fs";
import path from "node:path";
import { R3_IDENTITY, activeRelations } from "./work-relations";

type Boundary = { catalogue: { shelves: Record<string, number> }; discovery: Record<string, number>; sitemap: { paths: string[] } };
const boundary = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/internal/r3/pre-r3-boundary.json"), "utf8")) as Boundary;

const SHELF_IDS = Object.keys(boundary.catalogue.shelves).sort();
const add = (o: Record<string, number>, k: string, n: number) => ((o[k] = (o[k] ?? 0) + n), o);

const published = R3_IDENTITY.works.filter((w) => w.state === "published");
const demoted = R3_IDENTITY.publications.filter((p) => p.state === "demoted");
const merged = activeRelations().filter((r) => r.class === "merged-witness");

const shelves: Record<string, number> = Object.fromEntries(SHELF_IDS.map((s) => [s, 0]));
const discoveryByShelf: Record<string, number> = Object.fromEntries(SHELF_IDS.map((s) => [s, 0]));
for (const w of published) (add(shelves, w.shelf, 1), add(discoveryByShelf, w.shelf, 1));
for (const p of demoted) (add(shelves, p.formerShelf, -1), add(discoveryByShelf, p.formerShelf, -1));
for (const r of merged) add(shelves, String((r.witness.record as { shelf?: string }).shelf), -1);

const sitemapPaths = new Set(boundary.sitemap.paths);
const newRoutes = new Set(published.map((w) => w.locator.route).filter((r) => !sitemapPaths.has(r)));

export const READ_IA_R3_CONTRIBUTION = {
  /** Published R3 stages (the stage state the terms are derived from). */
  stages: R3_IDENTITY.stageState.published,
  works: Object.values(shelves).reduce((a, b) => a + b, 0),
  shelves,
  /** R3 creates and removes no LibraryCollection (plan §6.5); membership is never edited (§7). */
  collections: 0,
  discovery: Object.values(discoveryByShelf).reduce((a, b) => a + b, 0),
  visible: SHELF_IDS.reduce(
    (n, s) => n + Math.min(6, (boundary.discovery[s] ?? 0) + discoveryByShelf[s]) - Math.min(6, boundary.discovery[s] ?? 0),
    0,
  ),
  build: newRoutes.size,
  sitemap: newRoutes.size,
} as const;
