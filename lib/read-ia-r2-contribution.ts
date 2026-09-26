// Reading Room IA v2 R2 — the stage's exact contribution to the BUILT and PUBLIC surface, DERIVED from the category
// registry (data/read-categories.ts), never hand-typed. The single source of truth: earlier-wave validators that pin a
// live whole-build or whole-sitemap total ADD these terms, and exclude READ_IA_R2_ROUTES from any frozen pre-wave route
// remainder — the same reconciliation lib/wave8-contribution.ts provides for Wave 8.
//
// R2-A shipped one static page per category route (build). R2-C lists the same routes in the sitemap (sitemap). R2
// adds no work, collection or reader: catalogue, collection and discovery-model terms are 0 and are not declared here.
import { READ_CATEGORY_ROUTES } from "../data/read-categories";

/** The public routes R2 adds: the category pages, exactly as the registry declares them. */
export const READ_IA_R2_ROUTES: readonly string[] = READ_CATEGORY_ROUTES;

export const READ_IA_R2_CONTRIBUTION = {
  /** Prerendered pages (and .html files) R2 adds relative to pre-R2 — one per category route (since R2-A). */
  build: READ_IA_R2_ROUTES.length,
  /** Sitemap URLs R2 adds relative to pre-R2 — one per category route (since R2-C). */
  sitemap: READ_IA_R2_ROUTES.length,
} as const;
