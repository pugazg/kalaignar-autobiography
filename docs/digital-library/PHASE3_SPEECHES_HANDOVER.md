# Digital Library — Phase 3 handover (Speeches)

_Web activity in `pugazg/kalaignar-autobiography`. The controlling cross-project plan is
`pugazg/kalaignar-tribute/projects/kalaignar-digital-library/HANDOVER.md`. Mobile app work is **on
hold** (mobile Activity 6 / PR #15 was merged for preservation on 2026-08-18; no new mobile work).
This activity touched **no** `mobile/` files, **no** source repositories, and **no** PDFs._

## Post-mobile baseline

- **Implementation `main` at branch point:** `36d1325e9dc04084ed84cb50a2d0c3f6a665b795`
  (the mobile Activity-6 preservation squash merge, PR #15).
- **Phase-3 branch:** `digital-library/phase-3-speeches` (from that SHA).

## What this activity did

Opened the **Speeches** shelf (உரைகள்) and integrated the **first benchmark speech** with a new,
source-faithful **speech reader** (long-form prose with printed section headings — not scene
segmentation). One speech only; this is a reviewer-gated benchmark, not a bulk import.

## Source repositories inspected

Both authoritative speech repositories were cloned and inspected (README, processing/workflow
guides, indexes, per-speech `metadata.json` / `transcript.md` / `source-notes.md`):

- **`pugazg/kalaignar-assembly-speeches`** @ `b1b82402642d8f2cf36927d4752c8e7d28142fdd` — 10 speeches,
  organised by date; the README + `data/speeches.json` confirm **all 10 (the 2007 industrial-speeches
  anthology mapping) are fully released with verified Tamil and verified English**
  (`transcription_status: verified`, `verified_against_scan: true`, `translation_status: verified`).
- **`pugazg/kalaignar-public-speeches`** @ `c8abf95834e1d2549644e3607be3dd6f87b802c2` — 5 works, all
  "Verified complete" (`arappor`, `idhaya-perikai`, `poonthottam`, `palli-vazhkkai`,
  `kalaivanar-nsk-memorial-day`).

Repository state is authoritative over any historical conversation summary; readiness was verified
live, not assumed.

### Readiness inventory (summary)

| Repo | ID | Title | Type | Date | Tamil | English | Release |
|---|---|---|---|---|---|---|---|
| assembly | 1970-09-09-no-confidence-motion | உதயக் கதிர் | assembly | 1970-09-09 | verified | verified (faithful) | released |
| assembly | 1963…2006 industries-debate (9) | தொழில்துறை … உரை 1–10 | assembly | various | verified | verified | released |
| public | arappor | அறப்போர் | public | not in source | verified | verified | released |
| public | idhaya-perikai | இதய பேரிகை | public | not in source | verified | verified | released |
| public | poonthottam | பூந்தோட்டம் | public | 1951-12-06 | verified | verified | released |
| public | palli-vazhkkai | பள்ளி வாழ்க்கை | public | compilation | verified | verified | released |
| public | kalaivanar-nsk-memorial-day | கலைவாணர் … நினைவு நாள் | public (audio) | not in source | verified | verified | released |

## Benchmark chosen — and why

**`udhaya-kathir` — உதயக் கதிர் / Udhaya Kathir** (Tamil Nadu Legislative Assembly, 1970-09-09;
Kalaignar's reply as Chief Minister to the no-confidence-motion debate). Chosen on **source
readiness**, not convenience:

- The assembly repo confirms the 2007 industrial-speeches / completed assembly speeches are fully
  released with verified Tamil + English — the task's condition to pick the **strongest assembly
  speech** as the first benchmark.
- Among them, உதயக் கதிர் is the **strongest**: a **standalone published booklet** (`TVA_BOK_0065650`)
  with complete source metadata (publisher, printer, edition, price, scan-page classification) —
  the cleanest provenance; the **largest and most-thoroughly verified** (speech pp. 5–46, 42 pages,
  extra page-range verification files); and rhetorically rich (repetition, invective, rhetorical
  questions, parliamentary interjections) — a strong test of the "preserve Kalaignar's language"
  requirement. Verified Tamil + verified faithful English, **29 parallel printed section headings**.

## Source, fidelity & provenance contract

- **Source:** `pugazg/kalaignar-assembly-speeches` @ `speeches/1970/1970-09-09-no-confidence-motion`,
  pinned commit `b1b8240…`. Controlling source = the scanned 1970 booklet; only pp. **5–46** are the
  speech (1–4 front matter, 47–48 advertisements). The source PDF is **not** vendored.
- **Tamil:** verified source transcription, verbatim — no modernization / punctuation change /
  simplification. **English:** verified **faithful reading translation** (project-created,
  source-linked; placed after the complete Tamil). Kalaignar's rhetoric, repetitions, metaphors,
  political terminology, rhetorical questions, invective, interjections and cadence are preserved as
  released; the translation is **not** re-improved.
- **Provenance preserved in the vendored package** (Phase-2 standard — do not flatten provenance the
  reader doesn't display): each block carries its **source page**; printed **section headings** and
  **source-page boundaries** are kept; full source publication metadata + verification state travel
  in `provenance.json`. No fields the source archive lacks are fabricated (e.g. no scan SHA is
  invented — the assembly metadata does not publish one).
- **No archive-created navigation numbering** is presented as printed source numbering; section
  headings are the ones printed in the source.

## Data / reader model

- **Types:** `data/speeches.ts` (`Speech`, `SpeechBlock` — `heading | para | page-marker | note`,
  `SpeechProvenance`, `SPEECH_SLUGS`).
- **Vendored data:** `public/data/speeches/udhaya-kathir/{speech.json, provenance.json}` — two ordered,
  source-faithful block streams (Tamil authoritative; English parallel), with per-block `sourcePage`.
- **Importer:** `scripts/import-udhaya-kathir.mjs` — deterministic, work-specific; **fails closed**
  unless the source clone's git HEAD equals the pinned commit; parses `transcript.md` + `metadata.json`;
  never reads stale/accidental website data; never retranslates/normalizes. (Not a generalized
  ingestion framework.)
- **Reader:** `app/speeches/[slug]/page.tsx` → `components/SpeechReader.tsx` (client fetch of
  `speech.json`): title, verified date, legislature/event, speaker + role; **Tamil default**, English
  toggle; source-order blocks (printed `##` headings, paragraphs, subtle source-page markers, a
  distinct translation-**note** block); **faithful minimal Markdown** rendering — `**bold**` (source
  uses it for parliamentary interjection speaker labels and the subtitle) and `*italic*` (interjections
  like *(Laughter.)*, cited publication names) — no raw markup leaks; font sizing; dark mode; responsive.
  No forced prev/next (single work; collection nav deferred until multiple speeches exist).
- **Source page:** `app/speeches/[slug]/source/page.tsx` → `components/SpeechSource.tsx` — SOURCE FACTS
  vs ARCHIVE-DERIVED structure vs verification state vs present rights, plus source repo + commit.

## Rights model (reused from Phase 2)

Underlying Kalaignar-authored speech: **nationalised by the Government of Tamil Nadu**
(`rightsStatus: nationalised-by-tamil-nadu-government`, `rightsAuthority: Government of Tamil Nadu`,
`rightsAction: nationalisation`, `rightsAnnouncementDate: 2024-08-22`, `governmentOrderNumber: null`,
`governmentOrderDate: null`, `governmentOrderHandoverDate: 2024-12-22`). Tamil term **நாட்டுடைமை /
நாட்டுடைமையாக்கப்பட்டது**. The 2024-12-22 public handover is **not** the GO issue date; GO number and
formal issue date remain **unverified**. Kept separate from: the 1970 publication's own imprint; the
**project-created** English translation; separately published translations; and third-party material.
**No** entire existing-library rights migration was performed here — that dedicated audit remains a
follow-up.

## Public taxonomy & routes (decision)

- **Shelf:** the single **Speeches** shelf (`shelf: "speeches"`, `உரைகள்`). `assembly` / `public` are
  **subtypes / source contexts** (`subtype: "assembly-speech"`), **not** separate public shelves, and
  repository names are **not** exposed as route taxonomy.
- **Routes:** flat, globally-unique slugs — `/speeches/<slug>` (reader) and `/speeches/<slug>/source`
  (provenance). This is the smallest model that scales to both source repositories: slugs are assigned
  by this project so assembly/public cannot collide, keeping the subtype in catalog metadata rather
  than the URL. A `/speeches` collection landing is **deferred** until enough released speeches justify
  it; for one benchmark the catalog card links directly to the reader.
- `readerStructure: "speech"` (already in the Phase-1 model). `LibraryHome` already maps
  `speeches → Mic`.

## Backward compatibility

Additive. Existing catalog entries, readers and routes are unchanged; `/read` now renders a **fifth**
shelf (Speeches) only because a real published work exists — empty shelves stay hidden. Manohara,
Murasoli, Tholkappiyam and the memoir are untouched.

## Validation

- `tsc --noEmit` clean; `npm run build` success (added `/speeches/udhaya-kathir` and
  `/speeches/udhaya-kathir/source`; **1258** static pages; all pre-existing routes preserved; sitemap
  includes the two speech routes); `git diff --check` clean.
- Importer HEAD guard verified fail-closed on a wrong commit.
- `next start` smoke test: `/read` shows **5** works across **5** shelves (Speeches added), empty
  shelves hidden; speech reader Tamil-default with printed headings + verbatim text; English toggle =
  verified faithful translation with the translation note as a distinct block; **bold** interjection
  speaker labels and *italic* asides render (zero raw markdown); source page distinguishes SOURCE FACTS
  from ARCHIVE-DERIVED and shows the correct rights; invalid slug → 404; regression routes 200
  (`/read/nenjukku-neethi`, `/murasoli`, `/tholkappiyam`, `/cinema/manohara`, `/cinema/manohara/source`).

## What has NOT been implemented (deliberate)

Only the one benchmark speech. **Not** started: the remaining assembly speeches, any public speech,
Parasakthi/Tirumbippaar or another cinema work, Essays/Fiction/Poetry, mobile features, a generalized
ingestion framework, a `/speeches` collection landing, or the project-wide existing-works rights audit.

## Next Phase-3 work (for a future, reviewer-gated activity)

- Integrate additional released speeches one at a time (e.g. the rest of the assembly industries-debate
  set, then the strongest public-speech such as `arappor`), reusing this reader/importer pattern.
- Add a `/speeches` collection landing once ≥ a few speeches are published (with subtype grouping).
- Extract a small shared speech adapter only after a second speech proves the shape — not prematurely.
- Capture the exact Government Order number/issue date when verified, and run the project-wide rights
  audit across existing works.
