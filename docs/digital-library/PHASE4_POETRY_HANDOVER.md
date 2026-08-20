# Digital Library — Phase 4 handover (Poetry)

_Web activity in `pugazg/kalaignar-autobiography`. The controlling cross-project plan is
`pugazg/kalaignar-tribute/projects/kalaignar-digital-library/HANDOVER.md`; this file is the
implementation-repo record of what Phase 4 (Poetry) actually did. Mobile app work is **on hold** —
this activity touched **no** `mobile/` files. It made **no** changes to any source repository and
**no** PDF changes._

> **Phase status (current).**
>
> - **Phase 4 — Poetry: ACTIVE — it is NOT complete.** More released poems remain.
> - **Benchmark #1 — இதயத்தைத் தந்திடு அண்ணா / Lend Me Your Heart, Anna:** **COMPLETE / MERGED /
>   PRODUCTION-VERIFIED**. PR #25, final reviewed head
>   `3653023db60cb51ee1df4d970d621494c095791c`, squash merge
>   `c2d1c46d1c2d4e1f11722360848226208867789f` (2026-08-20T01:58:07Z), production Vercel **success**
>   on that exact merge SHA (deployment `92kdGyRiKucdUPSywP2XqnZMx1g9`).
> - **Benchmark #2: NOT STARTED and NOT SELECTED** by this handover.
>
> **Last production application-code checkpoint:
> `c2d1c46d1c2d4e1f11722360848226208867789f`** (the Phase-4 Benchmark #1 / PR #25 squash merge). It
> supersedes `ecf73cc8146cd9a9578c4aeaf73518b122ce569c`, which remains an important **historical**
> Phase-3 checkpoint but is no longer current.
>
> **Live GitHub `main` is authoritative and must always be inspected.** Documentation-only closeout
> commits — including the handover PR that carries this file — may advance repository `main`
> **without changing deployed application behaviour**, and such a docs-only SHA must **never** be
> recorded as a newer application-code checkpoint.
>
> `/read` publishes **8 works across 6 non-empty shelves**. **Poetry / கவிதைகள்** is now visible with
> **exactly one** work; **Speeches / உரைகள்** remains **one** shelf with **exactly three** speeches
> (Udhaya Kathir · Poonthottam · Arappor). No `/poems` collection landing was added.

## Why Phase 4 exists — owner direction

The owner explicitly asked for the next Digital Library work to come from a category **other than
speeches** ("I want from another category other than speech"). That direction produced this phase.

**Phase 3 — Speeches is ACTIVE but PAUSED by owner direction**, with Benchmarks #1–#3 complete and
**Speech Benchmark #4 NOT STARTED / NOT SELECTED**. Speech expansion must not resume unless the
owner explicitly reactivates it. See `PHASE3_SPEECHES_HANDOVER.md` for the full Speeches record.

## Merge / production record

| | |
|---|---|
| Implementation PR | **#25** |
| Final reviewed head | `3653023db60cb51ee1df4d970d621494c095791c` |
| Squash merge | **`c2d1c46d1c2d4e1f11722360848226208867789f`** |
| Merge timestamp | **2026-08-20T01:58:07Z** |
| Merge-SHA Vercel deployment | **`92kdGyRiKucdUPSywP2XqnZMx1g9`** — **SUCCESS** |
| Build | **1264** static pages |
| Catalog before | 7 works / 5 non-empty shelves |
| Catalog after | **8 works / 6 non-empty shelves** |
| New visible shelf | **Poetry / கவிதைகள்** — exactly **1** work |
| Speeches | unchanged — exactly **3**, on ONE Speeches / உரைகள் shelf |
| Collection landing | **none** — `/poems` is intentionally 404 |

Reader routes: `/poems/idhayathai-thanthidu-anna` and `/poems/idhayathai-thanthidu-anna/source`,
each present exactly once in the sitemap.

## Authoritative source

- **Source repository:** `pugazg/kalaignar-poems` (read-only; never modified by this activity)
- **Pinned source commit:** `42c156d7242fa799ea80adbb0c5f2b9eba078fe9`
- **Source path:** `poems/idhayathai-thanthidu-anna`
- **Controlling scan:** `TVA_BOK_0064132_இதயத்தைத்_தந்திடு_அண்ணா.pdf`
- **SHA-256:** `152cfb251a2049662102a2296487220f6f227f243657c9456df34105520676fe`
- **Size:** 26,816,066 bytes
- **Physical scans:** **28** — **28 / 28 verified**
- **Poem body:** scans **13–26** — **14 / 14 verified**
- **Printed page mapping:** scan 13 → printed 11 … scan 25 → printed 23
- **Scan 26:** **no visible printed page number.** It is **never** labelled printed page 24, and no
  number is inferred.
- **Source PDF: not vendored.** Its identity travels as filename + SHA-256 + byte size + scan map.

## Source context, and the publication absence

The note printed above the poem (scan 13) establishes:

- **9.2.1969**
- **சென்னை வானொலி / Chennai Radio**
- **கலைஞர் மு. கருணாநிதி**
- **பேரறிஞர் அண்ணாவுக்கான கண்ணீர்க் கவிதாஞ்சலி**

This is **source context / metadata — it is NOT verse**, and not one word of it is inserted into the
poem body.

- **Publication year: NOT ESTABLISHED.** `publicationYear` is null.
- **Edition statement: NOT ESTABLISHED.** `editionStatement` and the catalog `edition` field are unset.
- The foreword date **15.9.2008** is a **foreword/internal source date only**, belonging to
  third-party front matter. It must never become "publication year 2008", "edition year 2008" or a
  "2008 poem".
- The work must likewise **never** be described as "published in 1969" merely because the poem's
  source context is dated 9 February 1969.

A field is left unset rather than filled because the type allows it.

## Data / reader architecture — the durable lesson

**A poem is NOT speech prose.** In prose a line break is typography; in verse **the line is the
text**. The authoritative reading unit is therefore the **SOURCE LINE**, and Poetry gets a
form-specific reader rather than reusing `SpeechReader`.

Core representation (`data/poems.ts`):

- **`PoemLine`** — exact text, `indent` (source spaces), `sourceScan`, `printedPage`
- plus **ordered boundary events** between lines, which distinguish:
  - **`stanza-break`** — a blank line **wholly inside one printed page**. The verified page record
    preserves that blank-line relation, so this **is** source-established stanza structure.
  - **`page-transition`** — a physical source-page edge, carrying its relations explicitly.

**Cross-page relations carry TWO SEPARATE dimensions, and neither may be inferred from the other:**

1. **textual / rhetorical relation** — `source-established-continuation` |
   `source-established-non-continuation` | `not-specifically-recorded`
2. **typographic stanza relation** — `same-stanza` | `stanza-boundary` | `unknown`

A sentence, a quotation or a rhetorical movement can run on **across a printed stanza break**.
Textual continuity therefore never establishes the stanza relation.

**Terminology.** A maximal run of lines between two boundaries is a **verse run**, not a stanza:
where a run touches a page edge whose relation is unresolved, the printed stanza it belongs to is
simply not established. Only runs delimited on both sides by source-established stanza structure are
counted as **source-established complete stanzas**. A derived run count is **never** reported as a
printed stanza count.

Indentation is carried as a source fact (`indent`) so stepped lineation survives **without** putting
the poem in a `<pre>`, and a long line may **wrap visually** on a narrow viewport — with a hanging
indent so a wrapped row is never mistaken for a new poetic line — while remaining **one logical
source line** in the data.

Files: `data/poems.ts`, `components/PoemReader.tsx`, `components/PoemSource.tsx`,
`app/poems/[slug]/page.tsx`, `app/poems/[slug]/source/page.tsx`,
`public/data/poems/idhayathai-thanthidu-anna/{poem.json,provenance.json}`.

## Final structural counts

These are the **final** counts. Earlier figures were withdrawn during review (see below) and must
not be revived.

| | Tamil | English |
|---|---:|---:|
| Source lines | **339** | **345** |
| Indented lines | **58** | **47** |
| Source-established **in-page** stanza breaks | **23** | **20** |
| Verse runs (derived — *not* a stanza count) | **37** | **34** |
| Source-established **complete** stanzas | **11** | **8** |

## Cross-page provenance

**Physical page transitions: 13** (scan 13→14 … 25→26).

**Typographic stanza relation**

| | |
|---|---:|
| same-stanza | **0** |
| stanza-boundary | **0** |
| **unresolved** | **13** |

**Textual / rhetorical relation**

| | |
|---|---:|
| source-established continuation | **10** |
| source-established non-continuation | **1** |
| not specifically recorded | **2** |

- The single explicit **non**-continuation is **scan 25 → 26**: `pages/0025.md` records that the
  final question continues **"thematically, but not textually"** onto scan 26. That is **TEXTUAL
  evidence only** and provides **ZERO** typographic stanza evidence — it is not a stanza boundary
  either.
- The two transitions with no recorded textual relation are **16→17** and **20→21**.
- A complete audit of the pinned source repository — all 14 poem page records, the assembly,
  `ASSEMBLY_REVIEW.md`, `audit.md`, the page map, the completeness review, all five translation
  batches, `SOURCE_MAP.md`, `EDITORIAL_CONSISTENCY_REVIEW.md` and `RELEASE_REPORT.md` — found **no**
  explicit cross-page typographic statement.
- **Never** use semantic, punctuation, indentation or grammatical reasoning to fill an unresolved
  typographic relation. In particular, the absence of a blank line at a fenced page edge in the Tamil
  assembly proves nothing: each source page is its own fenced block, so the container **structurally
  cannot** express a blank line across the edge.

## Blocker

**One class: `cross-page-stanza-relationship` — count 13.**

The source archive does not currently establish the printed stanza relation across the 13 physical
page transitions. **Durable resolution: an UPSTREAM source-archive visual/source review** of the
controlling scan that explicitly records the printed stanza relationship at each transition. The
Digital Library must **not** resolve that typographic fact independently.

## Two independent review defects — do not regress these

### Review defect #1 — STRUCTURAL

The initial implementation **conflated textual/rhetorical continuity with typographic stanza
continuity** and asserted that all 13 page transitions were same-stanza. It also relied on the
absence of a blank line at a fenced page edge, which is a property of the container, not a source
statement. Separately, the initial **English validator stripped blank lines** before reconstruction:
that proved line text and order but could not prove stanza structure at all, and the cross-page check
then compared the generated data against a hard-coded expectation that originated in the importer.

**Correction:**

- textual and typographic dimensions **separated**, each with its own field and verbatim citations;
- **only explicit source typographic evidence** may resolve a stanza relation;
- final result **0 / 0 / 13**;
- the validator **derives evidence independently** of the importer (sentence-level, requiring both
  scan numbers) rather than checking a hard-coded array;
- the unsupported **Tamil 24 stanzas / English 21 stanzas**, **13 page-spanning stanzas**, **all 13
  transitions same-stanza** and **all 4 batch boundaries inside one stanza** claims were
  **withdrawn**. They belong only in review history as rejected findings.

### Review defect #2 — PRINT FIDELITY

The neutral unresolved page marker initially carried `data-print="hide"`. The global print stylesheet
removes that class entirely, so **Print → Save as PDF silently presented the lines on either side as
continuous** — asserting exactly the continuation the source does not establish.

**Correction:**

- the unresolved marker is **provenance, not interactive chrome**;
- it **survives screen AND print**;
- print hairlines are re-drawn as **borders** (printers commonly drop background colours);
- print includes an explicit, **language-correct** unresolved-relation label;
- genuine interactive chrome still hides normally in print.

## Screen / print contract

- **Source-established stanza gap: 28 px.**
- **Unresolved page transition: an 8 px restrained provenance marker** with `role="separator"`.
- The marker asserts **neither** "same stanza" **nor** "new stanza".
- **Screen: 13 / 13 markers retained per language.**
- **Print → Save as PDF: Tamil 13 / 13, English 13 / 13.**
- Printed label follows the reader language:
  - English — `source scan 14 · stanza relation unresolved`
  - Tamil — `மூல ஸ்கேன் 14 · அச்சுப் பத்தித் தொடர்பு தீர்மானிக்கப்படவில்லை`
- The print marker is **not verse** and is never counted as a poem line.
- **The print marker must never again be hidden as generic chrome.**

## English release

- **English title:** Lend Me Your Heart, Anna
- **Provenance:** **project-created** (`englishKind: "project-created"`)
- **Status:** **RELEASE-COMPLETE**
- **Final English source lines: 345** — **0 omissions, 0 duplications**, proved equal to both the
  released assembly and the reviewed batch verse.
- Markdown emphasis is retained **verbatim in the generated data** and rendered as `<em>`; the data
  is never stripped of the release's own typography.
- The released translation protects Kalaignar's **cadence, repetition, political specificity,
  literary density, direct address, grief and imagery**.
- **Tamil remains authoritative. Do not retranslate downstream.**

## Validation record

- **Poetry validator: 310 assertions, ALL PASS.** Important properties:
  - exact **Tamil** line reconstruction (text, order, indentation **and** blank lines);
  - exact **English** released line reconstruction;
  - **in-page blank-line / stanza structure** derived from the source artifacts and compared;
  - **cross-page evidence independently derived**, not taken from the importer;
  - an **unknown** typographic relation cannot silently resolve;
  - **negative test:** injecting a same-stanza claim at 13→14 fails **4** independent checks;
  - **print regression guard** rejects `data-print="hide"` on the unresolved marker.
- **Deterministic importer:** second run → **NO DIFF**.
- **Wrong source HEAD → FAIL CLOSED / NO WRITES.**
- Existing speech validators, with their generated data untouched: **Udhaya Kathir ALL PASS**,
  **Poonthottam ALL PASS**, **Arappor ALL PASS**.
- `tsc --noEmit` clean; `npm run build` success (**1264** static pages); `git diff --check` clean.

## Rights / scope

- The existing **nationalisation** rights model is reused **unchanged**.
- **Government Order number: `null`.** **Formal GO issue date: `null`.** Only the public handover
  date (2024-12-22) is recorded. Neither is invented.
- The status is **not** broadened to the third-party என்னுரை foreword, the photographs and captions,
  the publisher/donor advertisement and back matter, the printer imprint, the cover/design, or the
  project-created English translation — each retains its own distinct provenance.
- **No source repository was modified. No PDF was vendored. No mobile work. No runtime GitHub.**

## Next Phase-4 work (for a future, reviewer-gated activity)

- **Benchmark #2 is NOT started and NOT selected by this handover activity**, and no candidate is
  named here or anywhere in this document.
- The next activity is **Phase-4 Poetry Benchmark #2 candidate selection**: inspect the **live**
  `main` of `pugazg/kalaignar-poems`, judge current release/verification and provenance strength, and
  choose **exactly one** source-ready poem. Do not preselect from stale handover prose.
- Require **verified Tamil**; require a **released English** layer if publishing bilingual.
- Keep the same **Poetry / கவிதைகள்** shelf. Do not add a `/poems` collection landing without
  separate justification and approval.
- Preserve the line/boundary model **only where the next poem's source actually supports it**. **Do
  not assume** this work's unresolved-boundary pattern applies to every poem: another poem's archive
  may establish cross-page stanza relations explicitly, or may need a different boundary vocabulary.
- Continue **one released work per reviewer-gated activity**. No bulk import, no mass ingestion.
- Importers stay **work-specific and commit-pinned**; do not generalize ingestion prematurely.
- **Speech Benchmark #4 remains PAUSED / NOT STARTED.** Do not resume speech expansion unless the
  owner explicitly asks to return to speeches. If the owner names another non-speech category
  instead, follow that owner direction rather than forcing Poetry Benchmark #2.
- Still outstanding project-wide: capture the exact Government Order number/issue date when verified,
  and run the project-wide rights audit across existing works.
