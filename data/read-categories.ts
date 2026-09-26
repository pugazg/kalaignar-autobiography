// Reading Room IA v2 — R2 category registry (introduced in R2-A; drives the /read landing since R2-B).
//
// The ONE place that maps the nine existing shelves to their category routes under /read. It carries route
// metadata only. It does NOT carry membership: which works sit on a category is always derived from
// `publishedWorks()` and each work's own `shelf`, so there is no second source of truth to drift.
//
// Stored shelf ids are not renamed. The public shelf labels come from `SHELVES` in data/library.ts, the single
// source for both the /read category cards and the category pages (R2-B: `life-writing` reads சுயசரிதை there).
//
// Every slug is checked against the 391 memoir chapter ids served by app/read/[id] and against
// `nenjukku-neethi` (scripts/test-read-categories.ts). Static segments take precedence over [id] in the App
// Router, so a slug that collided would shadow a chapter — none does.

import { SHELVES, publishedWorks, type LibraryWork, type Shelf, type ShelfId } from "./library";
import { LIBRARY_COLLECTIONS, type LibraryCollection } from "./collections";

export interface ReadCategory {
  shelf: ShelfId;
  /** Path segment under /read. */
  slug: string;
  /** Public route, always `/read/<slug>`. */
  route: string;
  /** One-line English framing for the page metadata. States what the page is; makes no source claims. */
  descEn: string;
}

const category = (shelf: ShelfId, slug: string, descEn: string): ReadCategory => ({
  shelf,
  slug,
  route: `/read/${slug}`,
  descEn,
});

/** Registry order follows `SHELVES` order. */
export const READ_CATEGORIES: readonly ReadCategory[] = [
  category("life-writing", "autobiography", "Kalaignar's life writing"),
  category("letters", "letters", "Kalaignar's letters"),
  category("fiction", "fiction", "Kalaignar's fiction — novels and short stories"),
  category("poetry", "poetry", "Kalaignar's poetry"),
  category("drama", "drama", "Kalaignar's stage plays"),
  category("cinema-writing", "cinema", "Kalaignar's writing for cinema"),
  category("speeches", "speeches", "Kalaignar's speeches"),
  category("essays-articles", "essays", "Kalaignar's essays and articles"),
  category("literary-commentary", "literary-commentary", "Kalaignar's literary commentary"),
];

/** The nine category routes, derived from the registry. */
export const READ_CATEGORY_ROUTES: readonly string[] = READ_CATEGORIES.map((c) => c.route);

// R2's build/sitemap contribution is derived from READ_CATEGORY_ROUTES in lib/read-ia-r2-contribution.ts (the one
// canonical declaration), not here.

/** The registry entry for a shelf. Every ShelfId has exactly one; a missing one is a programming error. */
export function categoryForShelf(shelf: ShelfId): ReadCategory {
  const c = READ_CATEGORIES.find((x) => x.shelf === shelf);
  if (!c) throw new Error(`read-categories: no category registered for shelf "${shelf}"`);
  return c;
}

/** The shared shelf record (public labels) for a category. */
export function shelfForCategory(shelf: ShelfId): Shelf {
  const s = SHELVES.find((x) => x.id === shelf);
  if (!s) throw new Error(`read-categories: unknown shelf "${shelf}"`);
  return s;
}

/**
 * Every published work on a shelf, in catalogue (declaration) order. Collection membership never removes a
 * work here: a category page lists canonical works individually.
 */
export function worksInCategory(shelf: ShelfId): LibraryWork[] {
  return publishedWorks().filter((w) => w.shelf === shelf);
}

/**
 * The collections on a shelf, from the collection registry. Secondary context only: a category's primary count is
 * always its canonical works, and a collection never stands in for its members.
 */
export function collectionsInCategory(shelf: ShelfId): LibraryCollection[] {
  return LIBRARY_COLLECTIONS.filter((c) => c.shelf === shelf);
}

/** Page metadata for a category route, derived from the registry and the shared shelf labels. */
export function categoryMetadata(shelf: ShelfId) {
  const c = categoryForShelf(shelf);
  const s = shelfForCategory(shelf);
  const n = worksInCategory(shelf).length;
  const title = `${s.en} — ${s.ta} | Kalaignar Digital Library`;
  const description = `${c.descEn} in the Kalaignar Digital Library: all ${n} published ${n === 1 ? "work" : "works"} on the ${s.en} shelf, in the original Tamil.`;
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}
