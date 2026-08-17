# Digital Library — Phase 2 handover (Manohara cinema reader)

_Web activity in `pugazg/kalaignar-autobiography`. The controlling cross-project plan is
`pugazg/kalaignar-tribute/projects/kalaignar-digital-library/HANDOVER.md`; this file is the
implementation-repo record of what Phase 2 (Manohara) actually did. Mobile app work is **on
hold** — this activity touched **no** `mobile/` files and did not alter mobile PR #15. It made
**no** changes to any source repository and **no** PDF changes._

## What Phase 2 (Manohara) did

Onboarded **one** additional work — the *Manohara* (மனோகரா) screenplay/dialogue booklet — onto
the existing Digital Library envelope built in Phase 1, with its own `scene`-structured reader.
It added a catalog entry, a landing page, a per-segment reader (57 segments), and a provenance
page; extended the sitemap; and removed a non-authoritative accidental data directory. No
generalized ingestion framework was introduced — this is a single, work-specific onboarding,
exactly like the three Phase-1 works.

Governing principle (unchanged): **one coherent library, multiple source-faithful reader types.**

- **Starting implementation SHA (branch base):** `645cbbe67e6efa2fcd8870140f03267b1a56cfeb`
  (Phase-1 merge, `#16`; this is the authoritative remote `main` per `git ls-remote`).
- **Branch:** `digital-library/phase-2-manohara`.
- **Data already vendored on the branch (prior work):** `public/data/cinema/manohara/{index.json,
  provenance.json,segments/*.json}` plus the importer `scripts/import-manohara.mjs`, committed at
  `8ce38cd8e21604538ff12a0cb2f996d7c063bc72`.

## Source & integrity

- **Source repository:** `pugazg/kalaignar-cinema-works`, path `works/manohara`.
- **Source commit (pinned):** `4b5f3238bd1e5983e995ddd85cd8a81ae27de21d`.
- **Archive item:** `TVA_BOK_0010102`; scan SHA-256
  `87518fd8c290d7880aa2ddd9f2b5999c9d421d48fe1f02d61cf8e254393236a9`.
- **Integrity (from `provenance.json`):** translation-input aggregate
  `e27d5319…e21d25`, validation-input aggregate `17fbb18d…db25d`; reader-edition outputs
  `reader-edition.json` `a98315cb…d3dfb4`, `.md` `845a8caa…4d346bf`, `.html` `ded8a233…cf98738`,
  `QA_REPORT.md` `c8d2f111…aae98ce`.
- **Booklet facts as printed:** முதற்பதிப்பு பிப்ரவரி 1954 (first edition, 1954); publisher
  மூனா கானா பதிப்பகம்; printer Bharat Devi Press, Madras-2; price விலை எட்டணா; credit
  திரைக்கதை வசனம் · மு. கருணாநிதி; rights notice, quoted strictly as a source witness,
  “உரிமை : ஆசிரியருக்கே.” (no legal interpretation asserted).
- **Rendered scan is the controlling archival source; the OCR text layer is non-canonical
  (`ocr_authority: non_canonical_navigation_only`).** Body pages: PDF 7–88 / printed 6–87.

No source SHA moved during this work; the reviewer snapshot integrity boundary was re-confirmed
against live remotes (`cinema-works` main = `4b5f3238`, impl remote `main` = `645cbbe`) before
proceeding. (A local git corruption — a stray `refs/remotes/origin/main 2` file and a stale
tracking ref — was identified as local-only and did not reflect any real movement of `main`.)

## Data contract (already vendored; consumed by the reader)

- `public/data/cinema/manohara/index.json` — 57 segment stubs (`slug`, `ordinal`, `sceneId`,
  `readerLabelTa`, `startPdfPage`, `startPrintedPage`, `englishUnitCount`); `segmentTerminology:
  "archival-navigation-segment"`, `sourceSceneNumbering: "none-printed"`,
  `archivalSceneNumbering: "derivative-navigation-only"`.
- `public/data/cinema/manohara/segments/segment-001.json … segment-057.json` — per segment:
  `tamil.text` (verbatim Tamil scene derivative, ★ and all in-text markers preserved; page
  markers captured separately in `pageProvenance`) and `english.units[]` =
  `{ id, kind, speakerLabel, text }`.
- `public/data/cinema/manohara/provenance.json` — the full integrity manifest surfaced on the
  source page.
- **Types:** `data/manohara.ts` (`ManoharaIndex`, `ManoharaSegment`, `ManoharaUnit`,
  `ManoharaProvenance`, …).

### English unit kinds (1190 units total, exact from the source reader edition)
`dialogue` 1009 · `stage-direction` 173 · `song-reference` 6 · `chant` 1 · `written-text` 1.
27 spoken units are **unlabelled in the source and stay unlabelled** (no attribution invented).

## Transform rules (import → reader; nothing was re-authored)

- **Tamil:** rendered verbatim (`whitespace-pre-wrap`) exactly as vendored — no normalization,
  no retranslation, ★/parentheticals/speaker labels/ellipses/repetition preserved.
- **English:** rendered per unit; text is never altered. `dialogue`/`chant` show the **exact
  source `speakerLabel` (Tamil)**; a `null` speaker renders with **no label**. `stage-direction`,
  `song-reference`, `written-text` render as visually distinct blocks (stage directions italic
  with a left rule; song references in a brass-accented block with a music glyph; written text in
  a bordered `whitespace-pre-wrap` document block).
- **Tamil authority / English authority:** Tamil is the authoritative source text; English is a
  **project-created, source-linked derivative** (authority `works/manohara/translations/records`).
  → catalog `englishKind: "project-created"`.

## Catalog

One `LibraryWork` added to `data/library.ts` (no bypass of the Phase-1 model):

| field | value |
|---|---|
| `id` / `slug` | `manohara` / `manohara` |
| `titleTa` / `titleEn` | மனோகரா / Manohara |
| `shelf` | `cinema-writing` |
| `subtype` | `screenplay-dialogue` |
| `readerStructure` | `scene` |
| `href` | `/cinema/manohara` |
| `state` | `published` |
| `tamil` / `english` | `complete` / `complete` |
| `englishKind` | `project-created` |
| `sourceRepo` / `sourcePath` / `sourceCommit` | `pugazg/kalaignar-cinema-works` / `works/manohara` / `4b5f3238…` |
| `unitCount` | `{ 57, labelTa: "காப்பக வழிசெலுத்தல் பகுதிகள்", labelEn: "archival segments" }` |
| `provenanceHref` | `/cinema/manohara/source` |

After Phase 2 the public landing shows **four** shelves (Life Writing, Letters, Cinema Writing,
Literary Commentary) and **four** works. `LibraryHome.tsx` already maps `cinema-writing →
Clapperboard`; no change was needed there. Empty shelves remain hidden.

## Routes / components

- `app/cinema/manohara/page.tsx` → `components/ManoharaLanding.tsx` — work landing: title, credit +
  1954 edition + publisher **as printed**, language availability, the **archival-segmentation
  disclaimer**, the printed rights notice as a source-witness quote, a 57-segment contents list,
  "Start reading" (segment-001), and a link to the source page.
- `app/cinema/manohara/[segment]/page.tsx` (`generateStaticParams` → 57 slugs) →
  `components/ManoharaReader.tsx` (client) — fetches `segments/{slug}.json`; Tamil verbatim view +
  structured English units; Ta/En toggle (Tamil default); prev/next (boundaries at 1 and 57);
  segment label "Archive segment N of 57 · {readerLabelTa}" (bilingual, never a printed scene
  number); font sizing; cheap scroll progress/resume (`manohara:*` localStorage namespace); dark
  mode; responsive.
- `app/cinema/manohara/source/page.tsx` → `components/ManoharaSource.tsx` — provenance surface that
  distinguishes **SOURCE FACTS** (printed booklet, archive id, scan SHA, page ranges, OCR
  non-canonical) from **ARCHIVE-DERIVED navigation/metadata** (no printed scene numbers; 57 =
  navigation segments), plus verification state and integrity hashes.
- `app/sitemap.ts` — adds `/cinema/manohara`, `/cinema/manohara/source`, and the 57
  `/cinema/manohara/{segment}` URLs (derived from `index.json`). No broad SEO rewrite.
- **i18n:** inline bilingual (`useLang`) as the other components do; no new i18n module needed.

## Segmentation disclaimer (load-bearing terminology)

The 1954 booklet **prints no scene numbers**. The 57 divisions are **archive-created navigation
segments only** (`derivative-navigation-only`). They are never presented as "printed scene N": the
reader and landing say "segment N of 57" / "archive segment", `sourceSceneNumber` is always `null`,
and the source page states this explicitly. `sceneId`/`readerStructure: "scene"` are internal
identifiers, not a claim of source scene numbering.

## Accidental-data cleanup disposition

`public/data/cinema/manohara/parts/` (20 `.html` files) was **non-authoritative accidental
implementation scratch data**. It was removed **after** the reader was fully wired and the build
proved no dependency on it (a repository-wide search found only explanatory comments/notes; no
code reads the directory; the build and all 57 segment routes regenerate without it, and
`/data/cinema/manohara/parts/*` now 404s). This deletion is **cleanup of accidental implementation
data only** — it is **not** a source edit, a comparison, or a migration. The `parts/` files were
**never** used as source, reference, comparison baseline, continuation input, or validation
authority (this is also recorded verbatim in `provenance.json` notes and `import-manohara.mjs`).

## Backward compatibility

Additive. Existing catalog entries, readers, and routes are unchanged. `visibleShelves()` /
`publishedWorks()` are untouched (the new work flows through the existing selectors). Public
rendering is still driven **only** by `state: "published"` — never by folder existence.

## Validation

- `tsc --noEmit` — clean (exit 0).
- `npm run build` — success; generated the landing, all **57** segment routes, and the source
  page; **all pre-existing routes preserved** (1256 static pages total); sitemap includes the 59
  Manohara URLs. Rebuilt clean after the `parts/` deletion. (The "Newsreader font override"
  warning is pre-existing/environmental, unrelated to this change.)
- `git diff --check` — clean.
- `next start` smoke test (production build): `/read` shows exactly 4 works across 4 shelves
  (Cinema Writing → Manohara), empty shelves hidden; landing, first/middle/last segments 200;
  invalid segment 404; Ta/En toggle; Tamil verbatim (★, speakers, parentheticals) and English
  units (exact Tamil speaker labels, `null` unlabelled, stage-direction/song/written-text distinct)
  render correctly; prev/next boundaries correct (segment-001 has next only; segment-057 has prev
  only); source page renders SOURCE FACTS vs ARCHIVE-DERIVED; dark mode + mobile/desktop widths
  verified; all regression routes 200 (`/read`, `/read/nenjukku-neethi`, `/read/v1-ch01`,
  `/read/v6-ch29`, `/murasoli`, `/murasoli/m48-l3706`, `/tholkappiyam`, `/tholkappiyam/tp-aninthurai`).
- `npm run lint` is **not** meaningfully configured for this workflow — **no ESLint was added**.

## Limitations / scope boundary

- **Web-only; Manohara only.** No other cinema/other works; no mobile; no source-repo edits; no
  PDFs; no runtime GitHub; no generalized ingestion framework; no global search / unified
  bookmarks.
- English is a project-created derivative — **no public-domain or authorization claim** is made
  anywhere; the printed rights notice is shown solely as a source witness.
- **This PR does not mark the cross-project master handover "Phase 2 COMPLETE"** (that is a
  separate post-merge closeout). Parasakthi / Tirumbippaar are **not** started.
