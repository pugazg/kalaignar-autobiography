# Digital Library — Phase 3 handover (Speeches)

_Web activity in `pugazg/kalaignar-autobiography`. The controlling cross-project plan is
`pugazg/kalaignar-tribute/projects/kalaignar-digital-library/HANDOVER.md`. Mobile app work is **on
hold** (mobile Activity 6 / PR #15 was merged for preservation on 2026-08-18; no new mobile work).
No `mobile/` files, source repositories, or PDFs were modified in any of these activities._

> **Benchmark status (current).**
>
> - **Benchmark #1 — உதயக் கதிர் / Udhaya Kathir** (assembly speech): **COMPLETE / MERGED /
>   PRODUCTION-VERIFIED**. PR #18, squash merge `13ddf04f01b6a75024985b6df172deace9d26e80`,
>   production verified 2026-08-18.
> - **Benchmark #2 — பூந்தோட்டம் / Poonthottam** (the first **public** speech): **COMPLETE / MERGED /
>   PRODUCTION-VERIFIED**. PR #20, reviewed head `0906919e21066ab9e917985d51f60086823ad8ce`,
>   squash merge `2777064490910c02f5aa6938b9b6872b15e21e7c`, production verified 2026-08-19.
> - **Post-production provenance hotfix:** PR #21, reviewed head
>   `4135c29ed3a2ad1322397a68d1f4d4b09c840d45`, squash merge
>   `acb9721127de72c7575c035ccccf877deeb6421e`, production verified 2026-08-19.
>
> **Last production application-code checkpoint:
> `acb9721127de72c7575c035ccccf877deeb6421e`** (the PR #21 squash merge).
>
> **Live GitHub `main` is authoritative and must always be inspected** — do not treat the SHA above
> as a permanent claim about the repository's latest commit. This handover-closeout PR is
> **documentation-only**, so merging it advances repository `main` **without changing the deployed
> application code**. `acb97211…` therefore identifies the application-code / production checkpoint,
> not the newest commit on `main`.
>
> `/read` publishes **6 works across 5 non-empty shelves**, with **both** speeches on the single
> **Speeches / உரைகள்** shelf.
>
> **Phase 3 remains ACTIVE — it is NOT complete**; more released speeches remain.
> **Benchmark #3 has NOT been started** and is not selected by this handover.

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

- **`pugazg/kalaignar-assembly-speeches`** @ `b1b82402642d8f2cf36927d4752c8e7d28142fdd` — **11 indexed
  speeches total**: the **10** dated speeches of the 2007 industrial-speeches anthology (Speech 1
  through Speech 10) **plus** the separately archived **1970 Udhaya Kathir** speech. The README +
  `data/speeches.json` confirm **all 10 industrial-anthology speeches are fully released with verified
  Tamil and verified English** (`transcription_status: verified`, `verified_against_scan: true`,
  `translation_status: verified`); **Udhaya Kathir** is likewise separately verified Tamil + verified
  faithful English.
- **`pugazg/kalaignar-public-speeches`** @ `c8abf95834e1d2549644e3607be3dd6f87b802c2` — 5 works, all
  "Verified complete" (`arappor`, `idhaya-perikai`, `poonthottam`, `palli-vazhkkai`,
  `kalaivanar-nsk-memorial-day`). _(This records the state inspected during Benchmark #1. That
  repository has since moved: the Poonthottam source correction merged as
  `1ef73a709a343390befe55dcdfb029427f527bf4`, which is the pin Benchmark #2 now uses.)_

Repository state is authoritative over any historical conversation summary; readiness was verified
live, not assumed.

### Readiness inventory (summary)

| Repo | ID | Title | Type | Date | Tamil | English | Release |
|---|---|---|---|---|---|---|---|
| assembly | 1970-09-09-no-confidence-motion | உதயக் கதிர் | assembly | 1970-09-09 | verified | verified (faithful) | released |
| assembly | 1963…2006 industries-debate (Speech 1–10) | தொழில்துறை … உரை 1–10 | assembly | various | verified | verified | released |
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

## Data / reader model — corrected: a source-page boundary is NOT a paragraph boundary

**Reviewer correction (source fidelity).** The source archive normalises physical line-wraps into
paragraphs and marks source-page transitions *separately*; a page break must therefore never become a
paragraph break. The block model represents **one logical paragraph that can span several source
pages**, preserving BOTH reading continuity AND exact page provenance:

- **Types:** `data/speeches.ts` — `SpeechBlock = SpeechParagraph | SpeechHeading | SpeechNote |
  SpeechUnresolvedBreak`. A `SpeechParagraph` holds ordered `segments` (each a verbatim per-source-page
  fragment with its own `sourcePage` and a `joinToNext`). **`joinToNext` ∈ `"none" | "space" | "unknown"
  | "end"`:** **"none"** = the source splits a WORD across the page (no space); **"space"** = an ordinary
  cross-page word boundary; **"unknown"** = the exact printed joined-vs-spaced form is **UNRESOLVED**
  (scan-pending) — the reader renders a neutral inline source-page marker, never a silent space or a
  concatenation; **"end"** = last segment. A `SpeechUnresolvedBreak` (`{kind:"unresolved-break", toPage,
  relation:"unknown"}`) marks a boundary whose **paragraph relationship** is unresolved.
- **Importer:** `scripts/import-udhaya-kathir.mjs` — deterministic, work-specific; **fails closed**
  unless the source clone's git HEAD equals the pinned commit; parses `transcript.md` + `metadata.json`;
  never retranslates/normalizes. (Not a generalized ingestion framework.)
- **Every boundary is explicitly source-audited, NOT inferred from punctuation.** The earlier
  heuristics (only-two-mid-word; terminal-punctuation-⇒-paragraph-break) were wrong — e.g. **p8→9** is a
  mid-word split `அபரிமித`+`மான` = **`அபரிமிதமான`**. The importer drives paragraph assembly from an
  **explicit `TA_BOUNDARY` table** over all 41 Tamil transitions, each with `paragraphRelation`
  (`same-paragraph` | `paragraph-boundary` | `heading-boundary` | `unknown`), `join`
  (`none` | `space` | `unknown` | `end`) and `evidence` (transcript, verification log, verification/
  records, 11-speech corpus). `none` only where a space would break a single Tamil word.
- **Third reviewer correction — unresolved facts are represented as unresolved, never as a best guess.**
  Two classes were still making an editorial choice; both are now truly neutral:
  1. **Unresolved lexical joins (5).** Sandhi compounds (p16, p19, p29, p39, p43) whose printed
     joined-vs-spaced form the archive text cannot settle now carry `join: "unknown"` — **not** a silent
     `"space"`. The reader keeps BOTH fragments verbatim and shows a subtle inline `⟨p.N⟩` marker between
     them (asserting neither a space nor a concatenation).
  2. **Unresolved paragraph relationships (7).** Boundaries where a sentence completes at the page edge
     and the next page opens a new sentence (p7, p10, p21, p27, p35, p37, p40) are encoded as an
     `unresolved-break`, and the reader wraps the runs on either side in **one non-`<p>` `role="group"`**
     (aria-labelled "printed paragraph relationship unresolved") — so the data/HTML assert **neither** a
     paragraph break **nor** a continuation, and these are **not** counted as clean logical paragraphs.
- **English is audited too — no punctuation heuristic.** The terminal-punctuation regex is gone. Every
  one of the **42** `### Source page N` anchors has an explicit `EN_BOUNDARY` entry classified from the
  released translation structure (37 `paragraph-boundary` = the translator's own blank-separated blocks;
  3 `heading-note-boundary` at pages 5/8/44; 2 `same-paragraph` continuations at p22 em-dash / p24 comma).
  Anchors are provenance only — never a paragraph boundary in themselves — and the English text is verbatim.
- **Source-audited results (Tamil):** 31 same-paragraph, **3 source-established paragraph boundaries**
  (the source evidence for these three is a new parliamentary speaker turn; "speaker turn" is that
  per-transition evidence, **not** the generic meaning of the `paragraphBoundary` field, which counts
  source-established paragraph boundaries for any subtype), 0
  heading boundaries, **7 unresolved paragraph relationships**; lexical joins **none 10 / space 16 /
  unknown 5**. 147 resolved paragraphs + 14 unresolved-group runs over 192 source-page segments; English
  = 168 paragraphs over 170 segments (2 cross-anchor continuations).
- **TWO BLOCKER CLASSES (both neutral, neither guessed), in `provenance.json.blockers` + the source page:**
  (A) **7 unresolved paragraph relationships**; (B) **5 unresolved lexical joins**. **Durable rule:**
  resolving either requires an **upstream source-archive visual review** of the controlling scan
  **`TVA_BOK_0065650_உதயக்_கதிர்.pdf`** (speech scan pp.5–46) that explicitly records the missing
  printed fact — the paragraph relation, or the exact joined-vs-spaced form. The source PDF is not
  vendored here and **this Digital Library does not establish those typographic facts independently**;
  rendering stays neutral until the archive settles them. **No relationship or spacing is fabricated.**
  (Earlier revisions described this in terms of whether the scan happened to be reachable in one
  developer environment; that was a temporary workflow observation, not durable provenance, and was
  removed by PR #21.)
- **Vendored data:** `public/data/speeches/udhaya-kathir/{speech.json, provenance.json}` — every segment
  keeps its `sourcePage`; provenance never flattened.
- **Reader:** `components/SpeechReader.tsx` — a resolved paragraph renders as ONE `<p>` (joins per
  `joinToNext`; a spanned paragraph shows **no gap** and a split word **no stray space**); an unresolved
  lexical join shows an inline `⟨p.N⟩` marker; an unresolved paragraph relationship renders as a neutral
  `role="group"` region with a source-page rule between the runs; printed `##` headings; translation-note
  block; faithful minimal Markdown; Tamil default; dark mode; responsive.
- **Deterministic validation:** `scripts/validate-udhaya-kathir.mjs` — **17 requirements, all pass** _(the
  count at the time of the Benchmark-#1 activity; the validator has since grown — see the current
  validation status under Benchmark #2)_:
  all 41 Tamil transitions present once; every relation/join matches the audit (no punctuation
  inference); the 5 scan-pending sandhi joins are `unknown` (never silently `space`) and keep both
  fragments verbatim; no unknown paragraph relation is a semantic paragraph; named renders `அந்த இடத்திலே`,
  `அனைவருக்கும்`, **`அபரிமிதமான`** (mandated p8→9, never `அபரிமித மான`), `ஆகிரமிப்பாளர்கள்`; Tamil & English
  fragment fidelity is verbatim; all 42 English anchors have explicit `EN_BOUNDARY` entries; the English
  parser has **no** punctuation heuristic; the 7 `unresolved-break` markers sit exactly at the unknown
  boundaries; source pages remain 5–46; the importer HEAD guard still fails closed.
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

> The two sections above (**What this activity did** … **What has NOT been implemented**) describe
> the **Benchmark #1** activity. Benchmark #2 is recorded separately below.

## Benchmark #2 — பூந்தோட்டம் / Poonthottam (public speech) — ✅ COMPLETE

The second benchmark proves the shared speech architecture supports a **public** speech alongside the
assembly speech, **without losing their distinct source metadata** and without a second reader. It is
**COMPLETE / MERGED / PRODUCTION-VERIFIED**: PR #20, reviewed head
`0906919e21066ab9e917985d51f60086823ad8ce`, squash merge
`2777064490910c02f5aa6938b9b6872b15e21e7c` (2026-08-19T09:40:26Z), production verified 2026-08-19.
A follow-up presentation hotfix (PR #21) is recorded at the end of this section.

- **Branch:** `digital-library/phase-3-poonthottam` (from live `main` `13ddf04f01b6a75024985b6df172deace9d26e80`).
- **Work:** `poonthottam` — பூந்தோட்டம் / Poonthottam. Kalaignar's **1951-12-06** address at
  **சென்னை கிண்டி இன்ஜினியரிங் கல்லூரி** (Guindy Engineering College, Chennai). `subtype: "public-speech"`,
  on the **same** Speeches shelf; routes `/speeches/poonthottam` (+ `/source`). The source establishes the
  date and venue but **no** event/occasion/audience — those stay **unset** (never inferred from the venue).
- **Source (pinned, unmodified, READ-ONLY):** `pugazg/kalaignar-public-speeches` @
  **`1ef73a709a343390befe55dcdfb029427f527bf4`** — the authoritative pin, being the squash merge of
  source-correction **PR #1** in `pugazg/kalaignar-public-speeches` (**closed / merged**; the source
  archive was reclosed with both layers `verified-complete`) —
  `speeches/poonthottam`. Controlling scan
  `TVA_BOK_0065784_கலைஞரின்_பூந்தோட்டம்.pdf` (SHA-256 `2a8bf5f6…`, 49,297,657 bytes, 18 PDF pages —
  scan identity unchanged by the correction). Speech
  body = **PDF 6–17 / printed 5–16 (12 pages)**; PDF 1–5 (cover, title, bibliographic, publisher preface,
  and Kalaignar's prefatory poem `எரிமலை!`) and PDF 18 (back cover) are **not** speech body. **No PDF
  vendored; no runtime GitHub.** Tamil `verified-complete` (re-frozen, authoritative); English
  `verified-complete` faithful reading translation — neither retranslated or normalized; the **five**
  difficult source-supported forms and **five** translator notes are preserved verbatim.
- **Upstream source correction (closed).** A post-freeze review of printed p.16 was raised against the
  source archive and handled there, not here: `pugazg/kalaignar-public-speeches` **PR #1**, squash-merged
  as `1ef73a70…`. The controlling scan (identity verified) established the print reads **`மாடப்புறா`**,
  not the previously frozen `மாட்டுப்புறா`; dependent English *mattuppura* → **`dove`**; and `மானிடம்`,
  previously left untranslated as an uncertain form, is the ordinary noun for **`humanity`** and is now
  translated, its obsolete note removed (translator notes **6 → 5**). Tamil was re-frozen after a
  documented T4, a fresh E2 of printed p.16 and a complete 12-page / 11-transition E3 passed, and the
  archive was reclosed. This implementation PR has been **re-pinned and deterministically regenerated**
  from that corrected source. No source question remains open.
- **Subtype-aware model (bounded refactor, NOT a framework):** `data/speeches.ts` `Speech` is now a
  discriminated union on `subtype` — `AssemblySpeech` keeps `legislature` + `event`; `PublicSpeech` has
  `venue` and optional `event`/`occasion`/`audience`, and **no** legislature. The reader/source/route
  metadata branch on `subtype` (public label பொது உரை, venue with a map pin, honorific-prefixed speaker,
  optional extra source facts: scan SHA-256/size, first edition, printed-vs-PDF page range, third-party
  edition-matter note). Udhaya's vendored data is **unchanged** and still validates.
- **Boundary model — relations come only from what the source archive establishes.** Of the **11**
  printed page transitions, the source audit explicitly establishes **3** cross-page continuations
  (printed p.5→6, p.6→7, p.10→11; space joins). For the other **8** the archive records **no**
  printed-paragraph relation at all — it states neither that the paragraph continues nor that a new
  printed paragraph begins — so those stay **UNRESOLVED** and render as neutral `unresolved-break`
  groups. There are therefore **0 SOURCE-ESTABLISHED clean paragraph-boundary transitions**. That zero
  is a statement about the archive's silence, **not** an inference from the speech having one speaker:
  speaker turns and printed paragraph layout are different facts, and neither punctuation nor speaker
  count is used as a layout heuristic anywhere. Lexical joins none 0 / space 3 / unknown 0 — no mid-word
  split, no scan-ambiguous join. English: 12 explicit anchors, exactly **1** audited cross-page
  continuation (p.5→6). `audit.md` describes p.15→16 as a "thought/sentence continuation", but continuity
  of thought is not a typographic claim, so it stays **unresolved** rather than promoted. **One** blocker
  class: the 8 unresolved relations could only be settled by the controlling scan, and this integration
  deliberately derives no layout facts of its own. No fact is guessed.
- **New files:** `scripts/import-poonthottam.mjs`, `scripts/validate-poonthottam.mjs`,
  `public/data/speeches/poonthottam/{speech.json, provenance.json}`; catalog entry + `SPEECH_SLUGS` +
  sitemap (auto). Deterministic importer, fail-closed on source-HEAD mismatch.
- **Validation (current, after PR #21).** On merged `main`: `tsc` clean; `npm run build` success
  (**1260** static pages); `git diff --check` clean; both importers deterministic (a second run against
  the pinned source produces **no diff**) and both **fail closed** on a source-HEAD mismatch, writing
  nothing. **Poonthottam validator:** 45 assertions across 29 numbered requirement groups.
  **Udhaya validator:** 26 assertions across numbered requirement groups up to 22 plus one named extra
  check. (Earlier revisions described Udhaya as "17 requirements" and Poonthottam as "26 checks"; both
  grew when PR #21 added regression cover.) Beyond the source-fidelity requirements, the validators now
  also protect: durable blocker-`resolution` wording (the upstream source-archive rule), the **absence**
  of environment-specific availability wording in generated provenance, the subtype-neutral
  source-established boundary label, that `SpeechSource` actually renders `blockers[].resolution`, and
  that blocker/boundary/join counts remain unchanged.
- **Post-production provenance hotfix — PR #21 (✅ merged, production-verified 2026-08-19).** Production
  verification of PR #20 surfaced a **presentation-only** defect — no canonical, source or count defect:
  the durable blocker `resolution` existed in provenance but was **never rendered**; the Tamil UI
  hardcoded temporary environment-availability wording (`இச்சூழலில் கிடைக்கவில்லை`); and the generic
  boundary label read "speaker turn", which is Assembly-specific and wrong for a public speech.
  PR #21 (reviewed head `4135c29ed3a2ad1322397a68d1f4d4b09c840d45`, squash merge
  `acb9721127de72c7575c035ccccf877deeb6421e`) renders **both** blocker `detail` and `resolution`,
  removes the environment-availability language, states the source-authority rule in Tamil, adopts the
  generic label **"Source-established paragraph boundaries" / "மூலத்தால் உறுதிசெய்யப்பட்ட பத்தி எல்லைகள்"**,
  cleans Udhaya's generated blocker resolutions to the durable upstream-review wording, and hardens both
  validators. **No canonical speech data changed — both `speech.json` files stayed byte-identical.**
  Verified live afterwards: Poonthottam **source-established paragraph boundaries = 0**, **unresolved
  paragraph relationships = 8**; Udhaya **= 3**, **7 unresolved relations**, **5 unresolved lexical
  joins**; and **no** environment-specific availability wording remains on either production source page.
- **Rights:** same nationalisation model (announced 2024-08-22; GO handed to Rajathi Ammal 2024-12-22;
  number/issue date unverified). Kept distinct from the 2019 fourth-edition's third-party publisher/preface
  material (`கி. வீரமணி`, 2018) and the project-created English.
- **Not done (deliberate):** any third speech, bulk import, a `/speeches` landing, a generalized ingestion
  framework, mobile, tribute-handover promotion (only after review + merge + production), or the rights audit.

## Next Phase-3 work (for a future, reviewer-gated activity)

- **The shared speech architecture is now proven across BOTH subtypes** — `assembly-speech`
  (Udhaya Kathir) and `public-speech` (Poonthottam) — on one shelf, one reader, one provenance page.
  The earlier guidance to "extract a shared adapter only after a second speech proves the shape" is
  superseded: the second benchmark has happened, and the discriminated-union model is the proven shape.
- Continue **one released speech per reviewer-gated activity**. No bulk import, no mass ingestion.
- **Do not** create a separate Public Speeches shelf — assembly/public remain **subtypes** of the single
  Speeches / உரைகள் shelf.
- **Do not** add a `/speeches` collection landing until enough published works justify it (and only with
  separate approval).
- **Do not** generalize ingestion prematurely; importers stay work-specific and commit-pinned.
- **Benchmark #3 is NOT selected by this handover activity.** The next candidate must be chosen by
  inspecting the **live** `main` of both speech source repositories and judging current release and
  provenance strength — not from historical prose in this document.
- Still outstanding project-wide: capture the exact Government Order number/issue date when verified, and
  run the project-wide rights audit across existing works.
