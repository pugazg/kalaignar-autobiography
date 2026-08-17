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
  markers captured separately in the segment-level `pageProvenance`) and `english.units[]`.
  **Each English unit preserves the authoritative source-linked audit trail** (see below), not
  merely `{ id, kind, speakerLabel, text }`.
- `public/data/cinema/manohara/provenance.json` — the full integrity manifest surfaced on the
  source page, plus the project-level `projectRights` block (see Rights).
- **Types:** `data/manohara.ts` (`ManoharaIndex`, `ManoharaSegment`, `ManoharaUnit`,
  `ManoharaUnitSource`, `ManoharaUnitTranslation`, `ManoharaEnglishPageSegment`,
  `ManoharaSourceLocator`, `ManoharaProvenance`, …).

### Per-English-unit shape (source provenance preserved — reviewer correction)

Each `english.units[]` entry is copied **directly** from the authoritative source reader record
(`works/manohara/editions/en/reader-edition.json` → `scenes[].units[]`); nothing is reconstructed
and no source path/record id is converted into an invented website id:

```
{
  id, kind, speakerLabel, text,
  source: {
    sourcePath, canonicalScenePath,
    sourceRecordId,        // immutable dialogue-record id, or null (non-dialogue-linked)
    sourceOccurrenceId,    // song/performance occurrence id where present, else null
    sourceLocator,         // structured {kind,ordinal,description} where present, else null (verbatim)
    pageProvenance         // exact source array of { pdf_page, printed_page }
  },
  translation: {
    mode,                              // e.g. "prose-faithful"
    englishPageSegments?,              // exact { pdf_page, printed_page, english_text } — only the 17 cross-page units
    englishLines?,                     // discrete source lines where the unit is represented that way
    notes?                             // authoritative editorial notes, verbatim; omitted when empty
  }
}
```

Provenance populations preserved (all asserted against the source, never against the removed
`parts/`): **983** immutable dialogue links (`sourceRecordId` non-null); **207** null-`sourceRecordId`
/ null-speaker units; **6** song/performance occurrence links (`sourceOccurrenceId`); **17**
cross-page units retaining their exact `englishPageSegments`; **207** structured `sourceLocator`s.
Assertion example — `manohara-en-s001-u006` retains `sourceRecordId: manohara-s001-d004`, page
provenance for PDF 7 and 8, and both exact English page segments.

**Defect fixed in passing:** one unit (`manohara-en-s036-u076`) is represented in the source as
`translation.english_lines` (two quoted crowd cries) rather than `english_text`; the previous
importer produced `text: null` for it. The corrected importer sets `text` to the source lines
joined by a newline — exactly as the authoritative `.md`/`.html` editions render them (`<br>`) —
and preserves `englishLines`. No text is invented.

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

## Importer & source integrity

`scripts/import-manohara.mjs` is deterministic and work-specific (no generalized ingestion
framework). It reads **only** the authoritative `pugazg/kalaignar-cinema-works` (`works/manohara`)
clone, never the removed website `parts/` tree; it never retranslates or normalizes English,
never normalizes speaker labels, preserves `null` speakers, and keeps `sourceSceneNumber = null`.

**Hardening added in this correction:** before generating any data, the importer runs
`git -C <clone> rev-parse HEAD` and **fails closed** unless it equals the supplied
`<source-commit>` argument — so a caller-supplied SHA can never be recorded against a
non-matching checked-out tree. (Verified: a wrong commit aborts with a clear error and exit 1,
touching no data.) The importer regenerated all 57 segment JSON files from the pinned source
commit `4b5f3238…`.

## Rights / nationalisation

The catalog now carries a reusable, evidence-based rights model (`WorkRights` / `RightsStatus`
in `data/library.ts`; `LibraryWork.rights`), and Manohara records:

- `rightsStatus: "nationalised-by-tamil-nadu-government"`, `rightsAuthority: "Government of Tamil
  Nadu"`, `rightsAction: "nationalisation"`, `rightsAnnouncementDate: "2024-08-22"`,
  `governmentOrderDateStated: "December 2024"`, `governmentOrderNumber: null`.

Background: the Government of Tamil Nadu announced on 2024-08-22 that Kalaignar's works would be
nationalised **without royalty**, and issued the nationalising Government Order in December 2024.
This is a **project-wide** fact for works authored by Kalaignar — **not** Manohara-specific. The
same facts are also written into the vendored `provenance.json` (`projectRights`) so the audit
trail travels with the static package, and the `/cinema/manohara/source` page now shows two
**distinct** facts:

- **"Rights notice in this edition — as printed"** — the 1954 booklet's `உரிமை : ஆசிரியருக்கே.`,
  preserved verbatim as a historical **source witness** (not the present status).
- **"Present rights / nationalisation status"** — the Tamil Nadu Government nationalisation of the
  underlying authored work.

Boundaries recorded in the data and UI: the nationalisation covers **Kalaignar's underlying Tamil
work only**. It does **not** extend to the project-created English translation (`englishKind:
project-created`, which keeps its own provenance) or to third-party contributions (other authors'
prefaces/essays, separately published translations, secondary witness editions, or
photographs/illustrations/cover/publisher material). The **exact Government Order number is not
invented** — `governmentOrderNumber` stays `null` until verified from the GO or an authoritative
government record. Nationalisation affects **rights/use context, not textual authority**: all
archival-text rules are unchanged (scan controls transcription; no modernization; no
retranslation; no invented text; mandatory source provenance).

**Follow-up (not in this commit):** a dedicated project-wide **rights audit** should bring the
existing catalog entries (Nenjukku Neethi, Murasoli, Tholkappiya Poonga) onto this same model,
classifying each work separately as: Kalaignar-authored underlying work → Tamil Nadu Government
nationalised; project-created translation → project derivative; separately published translation →
its own independent provenance/rights; third-party contribution → independently determined. Locate
and record the exact GO number/date as part of that audit. This corrective commit deliberately does
**not** mass-migrate existing works — it establishes the reusable model and Manohara's entry only.

## Validation

- **Programmatic source-vs-import validation** (vendored data compared **directly** against the
  authoritative `reader-edition.json`, never against the removed `parts/`): 57/57 segments;
  `sourceSceneNumber` null for every segment; 1190 units; exact unit-kind counts (1009 / 173 / 6 /
  1 / 1); unit-id set == authoritative; **per-unit verbatim equality with 0 mismatches** across
  `kind`, `speakerLabel` (null preserved), `text`, and all `source` / `translation` provenance
  fields; 983 immutable dialogue links; 6 song-occurrence links; 17 cross-page units with exact
  `englishPageSegments`; 207 null-speaker units preserved; no text changes; `manohara-en-s001-u006`
  assertion (sourceRecordId + PDF 7&8 page provenance + both English page segments) passes; the
  `manohara-en-s036-u076` `english_lines` fix verified.
- **Importer HEAD guard** — regenerates only when the source clone HEAD equals the pinned commit;
  a wrong commit aborts with exit 1 and touches no data (verified).
- `tsc --noEmit` — clean (exit 0).
- `npm run build` — success; generated the landing, all **57** segment routes, and the source
  page; **all pre-existing routes preserved** (1256 static pages total); sitemap includes the 59
  Manohara URLs. (The "Newsreader font override" warning is pre-existing/environmental, unrelated
  to this change.)
- `git diff --check` — clean.
- `parts/` remains **absent** (filesystem and `/data/cinema/manohara/parts/*` → 404).
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
- **Rights:** no unsupported generic public-domain claim is made. The underlying Kalaignar-authored
  work is recorded as **nationalised by the Government of Tamil Nadu** (announced 2024-08-22; GO
  December 2024, number pending verification), kept **separate** from the historical 1954 printed
  edition notice, from the **project-created** English translation, and from any third-party
  material. See the Rights section above.
- **This PR does not mark the cross-project master handover "Phase 2 COMPLETE"** (that is a
  separate post-merge closeout). Parasakthi / Tirumbippaar are **not** started.
