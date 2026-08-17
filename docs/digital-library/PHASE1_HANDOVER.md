# Digital Library — Phase 1 handover (Library Foundation)

_Web activity in `pugazg/kalaignar-autobiography`. The controlling cross-project plan is
`pugazg/kalaignar-tribute/projects/kalaignar-digital-library/HANDOVER.md`; this file is the
implementation-repo record of what Phase 1 actually did. Mobile app work is **on hold** — this
activity touched **no** `mobile/` files and did not alter mobile PR #15._

## What Phase 1 did

Turned `/read` from the memoir-specific Reading Room into the **Kalaignar Digital Library**
landing page, driven by a normalized catalog, and moved the memoir's own library/search
experience to a dedicated collection surface. No new corpus was integrated; no archival/source
text was changed. This is an information-architecture refactor.

Governing principle: **one coherent library, multiple source-faithful reader types.**

## Catalog

- **Location / types:** `data/library.ts`
  - `ShelfId`, `Shelf`, `SHELVES` (the nine shelves, ordered)
  - `LibraryWork` (work envelope), `ReaderStructure`, `Availability`, `EnglishKind`,
    `PublicationState`
  - `LIBRARY_WORKS` (the catalog), `publishedWorks()`, `visibleShelves()`
- Public rendering is driven **only** by `state: "published"`. There is **no filesystem
  auto-discovery** — nothing scans `public/data`, so an accidental data directory can never
  become a public work.

### Nine shelves (id · order · Tamil / English)
1. `life-writing` · வாழ்க்கை எழுத்து / Life Writing
2. `letters` · கடிதங்கள் / Letters
3. `fiction` · புனைகதை / Fiction
4. `poetry` · கவிதைகள் / Poetry
5. `drama` · நாடகங்கள் / Drama
6. `cinema-writing` · திரை எழுத்து / Cinema Writing
7. `speeches` · உரைகள் / Speeches
8. `essays-articles` · கட்டுரைகள் / Essays & Articles
9. `literary-commentary` · இலக்கிய உரை / Literary Commentary

All nine exist in the model. **Empty shelves are not rendered** (`visibleShelves()` filters to
shelves with ≥1 published work). No "coming soon" placeholders.

### Three published works (Phase 1)
| id | shelf | reader structure | href | tamil | english | englishKind |
|---|---|---|---|---|---|---|
| `nenjukku-neethi` | life-writing | volume-chapter | `/read/nenjukku-neethi` | complete | _(unset)_ | _(unset)_ |
| `murasoli-letters` | letters | letter | `/murasoli` | **partial** | partial | _(unset)_ |
| `tholkappiya-poonga` | literary-commentary | commentary-unit | `/tholkappiyam` | complete | complete | _(unset)_ |

After Phase 1 the public landing therefore shows exactly three shelves: Life Writing, Letters,
Literary Commentary.

### Language coverage vs English provenance (two separate concepts)
`Availability` (`complete | partial | none`) is **coverage for the intended catalog work /
collection boundary** — not "every unit currently vendored happens to have this language".
`EnglishKind` (`project-created | separately-published | published-source-witness`) is the
**kind/provenance** of the English text, a distinct optional field. Notes:
- **Murasoli** `tamil` is **`partial`**: only volumes 48–54 of the intended full letters
  collection are integrated (the earlier `complete` was misleading at the collection boundary).
  Its `english` is `partial` (e.g. vol 54 is Tamil-only + the collection is partial). Its
  `englishKind` is left **unset** — the provenance of the Murasoli English layer is not
  established in the implementation data (not guessed).
- **Tholkappiya Poonga**: `english: complete` (En/Ta toggle covers the onboarded work);
  `englishKind` left **unset** — whether it is a separately-published or project-created
  translation is not established in the implementation data.
- **Nenjukku Neethi**: `english`/`englishKind` left **unset** — no English coverage is claimed
  (the implementation does not establish one).
This lets future integrations (Phase-2 cinema, stage-play secondary English witnesses, other
source repos) distinguish project-created vs published translations vs secondary/published
English witnesses vs Tamil-only / incomplete, without overloading a single field.

## Routes

| Route | Purpose | Status |
|---|---|---|
| `/read` | **Global Kalaignar Digital Library landing** (`components/LibraryHome.tsx`, catalog-driven) | new identity |
| `/read/nenjukku-neethi` | **Nenjukku Neethi collection surface** — the relocated memoir library/search/filters/progress/bookmarks (`components/NenjukkuNeethiLibrary.tsx`) | new route |
| `/read/[id]` | memoir chapter reader (e.g. `/read/v1-ch01`) | **unchanged** |
| `/murasoli`, `/murasoli/[id]` | Murasoli letters | **unchanged** |
| `/tholkappiyam`, `/tholkappiyam/[id]` | Tholkappiya Poonga | **unchanged** |

`/read/nenjukku-neethi` is a static segment and takes precedence over the `/read/[id]` dynamic
segment; chapter ids are `v<n>-ch<nn>`, so there is no collision.

## Backward compatibility (memoir)

Preserved by relocating — not rewriting — the memoir component:
- `localStorage` keys unchanged: `nn-last`, `nn-bookmarks`, `nn-read` (and the reader's own
  `nn-*` font/position keys in `components/Reader.tsx`, untouched).
- Chapter URLs `/read/[id]` unchanged; no redirects added.
- Full-text search bundles (`/data/fulltext/v<N>.json`), title/transliteration search, volume
  filters, resume / continue-reading / read-progress / bookmarks — all moved intact.
- `/read/[id]?find=…` deep links, chapter share/citation URLs, prev/next, research mode,
  reader language behaviour — untouched (`Reader.tsx` unchanged except the Contents backlink).
- **Memoir Reader "Contents" backlink** now points to `/read/nenjukku-neethi` (was `/read`),
  since `/read` is now the global library. The `TholkappiyamReader` cross-link labelled
  "Nenjukku Neethi — the memoir" likewise now points to `/read/nenjukku-neethi`.
- Generic library links (Navbar "Read", Hero/Footer "Enter the Reading Room", Murasoli/
  Tholkappiyam "up to library" breadcrumbs) still point to `/read` (now the library home).
  Murasoli "Contents" stays `/murasoli`; Tholkappiyam "Contents" stays `/tholkappiyam`.

## Attaching a future reader adapter to a catalog work

1. The source repository reaches an explicit reader/release gate (see the master handover).
2. Add a `LibraryWork` to `LIBRARY_WORKS` with its `shelf`, `subtype`, `readerStructure`,
   `href`, and provenance (`sourceRepo` / `sourcePath` / `sourceCommit`) recorded from the
   source release — set `state: "ready-to-integrate"` until the reader exists.
3. Build the form-specific reader/route (e.g. a scene reader for cinema) at the work's `href`.
   The catalog is a shared envelope; the reader is source-faithful to the form.
4. Flip the work to `state: "published"`. `visibleShelves()` then surfaces its shelf
   automatically. Icons/accents for all nine shelves are pre-mapped in `LibraryHome.tsx`.

## Provenance conventions

`sourceRepo` / `sourcePath` / `sourceCommit` / `edition` are **optional** and are **unset** for
the three legacy collections, because the implementation data does not record an established
external source repo/path/commit for them. These are distinct concepts from the implementation
repository — do not conflate implementation repo, source/archive repo, scanned source, published
edition or release commit, and do not fabricate values to fill the type. No public-domain /
official-archive / authorized / complete-works claims were added.

## Empty-shelf behaviour

`visibleShelves()` returns only shelves containing ≥1 published work, in taxonomy order. The six
currently-empty shelves exist in `SHELVES`/the model but render nothing. When a future work is
published into one, its shelf appears automatically.

## Manohara exclusion (explicit)

The directory `public/data/cinema/manohara/parts/` exists in the repo (added by the accidental
"Vendor Manohara reader part 001…020" commits, which are on `main`). Phase 1:
- did **not** use, continue from, validate, normalize, or derive anything (text, counts,
  provenance, translations, reader structure) from those files;
- did **not** add a Manohara catalog entry or expose the Cinema Writing shelf;
- did **not** delete or replace those files (deliberate cleanup belongs to Phase 2);
- added **no** filesystem auto-discovery that could surface them.
The only mentions of "manohara" in Phase-1 code are explanatory comments in `data/library.ts`
documenting the exclusion — not a dependency.

## Phase-2 starting boundary

**Phase 2 is the Cinema shelf, beginning with Manohara. It must start afresh from the live
authoritative `pugazg/kalaignar-cinema-works` release/reader-export artifacts and their exact
source commit/integrity state. The existing `public/data/cinema/manohara/parts/` files in
`kalaignar-autobiography` are accidental, non-authoritative, and must not be used as source,
reference, comparison baseline, provenance evidence, unit-count authority, translation
authority, or continuation input.** Do not begin Phase 2 until the owner has reviewed, merged
and deployed Phase 1. No Phase-2 code exists in this PR.

## Files changed

- **New:** `data/library.ts`; `components/LibraryHome.tsx`; `app/read/nenjukku-neethi/page.tsx`;
  `docs/digital-library/PHASE1_HANDOVER.md`.
- **Moved:** `components/Library.tsx` → `components/NenjukkuNeethiLibrary.tsx` (memoir surface;
  cross-collection peer cards removed as they now live on the global landing; breadcrumb → `/read`).
- **Modified:** `app/read/page.tsx` (renders `LibraryHome` + multi-work metadata);
  `components/Reader.tsx` (Contents → `/read/nenjukku-neethi`);
  `components/TholkappiyamReader.tsx` (memoir cross-link → `/read/nenjukku-neethi`);
  `app/sitemap.ts` (adds `/read/nenjukku-neethi`).

## Validation

`npx tsc --noEmit` pass · `npm run build` pass (1197 static pages; all 391 memoir chapter
params + Murasoli/Tholkappiyam paths preserved; `/read` and `/read/nenjukku-neethi` prerender).
`npm run lint` is not a configured gate in this repo (`next lint` has no ESLint config and
prompts interactively; not set up in CI) — tsc + build are the effective gates, matching Vercel.
Route smoke tests pass with no regression vs. the recorded baseline. No `mobile/` changes, no
source-text changes, no PDFs, no Manohara data changes.

## Known pre-existing (not Phase-1 regressions)

- Murasoli chapter routes (`/murasoli/[id]`) render with the site-wide default `<title>`
  (generic) — pre-existing metadata behaviour, unchanged here.
- The accidental Manohara vendor files/commits on `main` — pre-existing, left untouched.
