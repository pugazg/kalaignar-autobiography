# Kalaignar Digital Library — Project Instructions & Handoff (refreshed)

Paste this into the Project's custom instructions. Upload the latest
`kalaignar-legacy.zip` at the START of any new chat — the sandbox resets between
chats, so the zip is the project's only memory of the code.

---

## What this project is

An interactive bilingual (Tamil/English) digital archive of **Nenjukku Neethi**
(நெஞ்சுக்கு நீதி), the complete six-volume autobiography of Kalaignar M. Karunanidhi,
1924–2005. "The Kalaignar Digital Library." Next.js 14 + TypeScript + Tailwind +
Framer Motion + Recharts.

- **Live domain:** https://nenjukkuneethi.org  (custom domain, live)
- **Old URL:** kalaignar-autobiography.vercel.app (redirects to the domain)
- **GitHub:** pugazg/kalaignar-autobiography  (repo name unchanged — the corrections
  link in Footer.tsx correctly points here, do NOT rewrite it to the domain)
- **Sandbox workdir:** `/home/claude/kalaignar-legacy/`
- **Deliverable each session:** rebuild `kalaignar-legacy.zip` to `/mnt/user-data/outputs/`

Deploy = push zip contents to GitHub → Vercel builds from the committed JSON. The
website reads JSON only; Python is a build-time toolkit, never run at runtime.

---

## The ONE non-negotiable rule: verify everything against the corpus

**Every factual claim on the site must be verified against the actual memoir text and
cited to a chapter (VN·chNN).** Never add content from memory as if it were in the
memoir. Workflow: grep `public/data/text/vN-chNN.json` for the Tamil term, READ the
context, cite the chapter id in a `refs: [...]` field. If something is post-2005 or not
in the text, omit it or mark it clearly — never fake a citation.

Verification snippet:
```python
import json, glob, re
corpus = {}
for fn in sorted(glob.glob('public/data/text/*.json')):
    d = json.load(open(fn, encoding='utf-8'))
    corpus[d['id']] = (d['volume'], d['title'], ' '.join(d['paragraphs']))
# regex-search corpus[cid][2] for Tamil terms, print context, note the chapter id
```

**Gazetteer false-match lesson (recurring!):** single-token Tamil names that double as
common words or other famous people MUST use proper-noun/honorific forms:
- "அண்ணா" alone = "elder brother" (over-counted 8×) → use "அறிஞர் அண்ணா"/"அண்ணாதுரை"
- "ஸ்டாலின்" alone = Josef Stalin in Vol 1 world-history → use "மு.க. ஸ்டாலின்" only
  (M.K. Stalin's real first appearance is v3-ch09, NOT v1-ch01)
- bare "கிருஷ்ணன்" = the god Krishna → use "என்.எஸ்.கே" for NSK
- Always verify counts in-context before they drive a public feature.

---

## Design tokens — NEVER change (user directive: no cosmetic redesigns)

Colours: ink `#0F1720`, paper `#FAF7F1`, mist `#E8E2D6`, marina `#0E5D63`/`#1B7F87`,
brass `#B98A2F`. Fonts: Newsreader (display), Inter (body), Noto Serif Tamil (Tamil).
Signature: bilingual section headings + citation chips (VN·chNN) linking to the Reading
Room. Evolve via data/content and new sections, not restyling.

---

## Bilingual system

Navbar toggle தமிழ்/EN, persisted. English = source-of-truth + fallback. ALL Tamil
strings in ONE file: `data/i18n.ta.ts` (navTa, chromeTa, headingsTa, etc.). `lib/i18n.tsx`
gives `useLang()` + `tr()`. `SectionHeading` auto-localises by section id via headingsTa.
User is a Tamil speaker who reviews translations — apply his versions verbatim (literary-
but-accessible register).

---

## Adding a new section — checklist

1. Verify claims against corpus; collect refs.
2. `data/<name>.ts` — typed export, bilingual `{en, ta}`.
3. `sections/<Name>.tsx` — reuse SectionHeading, Reveal, RefChips, cn, useLang.
4. Wire into `app/page.tsx`.
5. Navbar entry in `components/Navbar.tsx`.
6. i18n: nav label + heading block in `data/i18n.ta.ts`.
7. Search: category + entries in `components/SearchDialog.tsx`.
8. Validate refs, check JSX balance, rebuild zip.

**Build-safety (these caused real Vercel failures):**
- Missing `</Reveal>` (or any closing tag) inside a `.map()` before `))}` → type-check fails.
- Duplicate imports fail the build.
- Multi-line regex deletions can also delete adjacent import lines — after such edits,
  confirm every used name is still imported (happened with TN_OUTLINE→tnmap import).
- Brace-counter false-positives on `(` inside string literals — strip strings before counting.

Rebuild:
```bash
cd /home/claude && rm -f kalaignar-legacy.zip && \
zip -rq kalaignar-legacy.zip kalaignar-legacy -x '*/node_modules/*' && \
cp kalaignar-legacy.zip /mnt/user-data/outputs/kalaignar-legacy.zip
```
Never print Tamil to stdout (UTF-8 errors) — write to files and view. Network disabled in
sandbox (no npm/next build) — validate by inspection.

---

## Current state (this handoff is CURRENT as of the domain-migration session)

**Corpus:** 6 volumes, 391 chapters, 4,234 pages. `public/data/text/vN-chNN.json` +
`data/extracted/volumeN.index.json`. v1 1924–69 (140ch), v2 1969–76 (77ch),
v3 1976–88 (73ch), v4 1988–96 (22ch), v5 1996–99 (50ch), v6 1999–2005 (29ch).

**Sections (app/page.tsx order):** Hero, ExecutiveSummary (bilingual side-by-side toggle),
Chronicle (the "more than a memoir" thesis), Principles (the Five Great Declarations
ஐம்பெரும் முழக்கங்கள் verbatim v2-ch29 + founding principles), Pillars, Timeline (named
theme filters), AgainstTheWorld, Eelam (Sri Lankan Tamil question), Journey (real TN
district map), Themes, **DiscoverChapters** (safe semantic retrieval), Governance (30-entry
ledger + women's-rights cluster), SocialJustice (reservation arc; post-2005 items shown
in a dashed uncited box), People (16 figures), **RelationshipGraph** (force-directed from
co-occurrence), Character (beliefs wheel + traits from documented moments), Quotes,
StatsDashboard, Gallery (archival photos w/ provenance), References, Footer, BackToTop.

**Reading Room:** `/read` (Library.tsx) + `/read/[id]` (Reader.tsx). All 391 chapters,
statically generated. Features: bookmarks, reading progress, prev/next, font control,
**in-chapter find-and-highlight**, **multi-format citation export** (Chicago/MLA/BibTeX/RIS
via CiteButton + lib/citations.ts), **share buttons** (X + copy-link, no SDK), **OCR
transparency note** at the end of each chapter. `lib/ResearchMode.tsx` toggles metadata.

**Data files (data/):** character, chronicle, eelam, gallery, governance, graph, i18n.ta,
meta, people, places, principles, quotes, references, retrieval, socialjustice, stats,
themes, timeline, tnmap, world.

**Three-layer entity pipeline (BUILT, working):**
- Layer 1 `pipeline/analyzers/entity_extractor.py` — gazetteer NER → archive/*.json →
  copied to public/data/entities/. 19 people, 10 places, co-occurrence edges.
- Layer 1 `pipeline/analyzers/build_retrieval_index.py` — 12-concept retrieval index →
  public/data/retrieval.json. Powers DiscoverChapters. CANNOT hallucinate (returns only
  real chapter ids, no generation).
- Layer 2 `pipeline/builders/build_graph.py` — joins archive + curated people.ts →
  public/data/graph.json (13 nodes, 77 edges). Powers RelationshipGraph.
- To regenerate: run the two analyzers, cp entities to public/data/entities/, run
  build_graph. After push, confirm public/data/graph.json + retrieval.json present.

**Maps:** `data/tnmap.ts` = real TN district SVG (viewBox 0 0 1640 2032). `data/places.ts`
coords were hand-corrected by the user — keep them; caption says "approximate locations."

**Gallery:** archival images in public/images/ (optimize ≤1600px/~200KB). Each needs an
`archival: {accession, source, citation, rights}` block. One added: TVA_PHO_000025
(Kalaignar with Anna, Tamil Nadu State Archives). ONLY add images with documented
provenance (govt archives ideal) or original artwork. Un-sourced news/family photos are
EXCLUDED pending rights.

**SEO/Google (DONE):** sitemap.ts (now includes 391 chapters + /murasoli pages), robots.ts,
OG/Twitter/JSON-LD, verification file — all on nenjukkuneethi.org (custom domain, live).
Google indexing COMPLETED by the maintainer (Search Console verified, sitemap submitted,
indexing requested). Long-tail (unique chapter titles) is the SEO edge; bare title
"Nenjukku Neethi" is contested by a 2022 film of the same name.

**Footer credit:** "This website was developed with the help of Claude, by Anthropic"
(bilingual) — keep it.

---

## Murasoli letters collection — BUILT (Vol 54), with a CRITICAL OCR fix pending

54 volumes of Karunanidhi's letters to udanpirappukkal, scanned PDFs (~980MB each) on
the TN Govt Digital Library. Maintainer built a production OCR+correction pipeline and
OCR'd Volume 54. **The website collection is fully built and scales to all 54 volumes.**

**Website side (DONE, in the zip):**
- `/murasoli` — collection landing (MurasoliLibrary.tsx): volume accordion, title search,
  running page count, provenance note. Cross-linked from the memoir Reading Room.
- `/murasoli/[id]` — page reader (MurasoliReader.tsx): font control, in-page find, share,
  prev/next across the whole collection, OCR-transparency note. Statically generated.
- `data/murasoli.ts` — types. `public/data/murasoli/index.json` + `text/*.json` — data.
- Sitemap includes murasoli pages (app/sitemap.ts imports the index).
- Adding a volume needs NO website change: run the builder, redeploy.

**Layer-2 builder:** `pipeline/builders/build_murasoli_collection.py`
`--src <corrected_folder> --volume NN` → converts OCR page JSON to reader-ready pages +
appends to index.json. Derives a display title per page (date → "Letter · dd.mm.yyyy",
else "Page N"). Run once per volume; index accumulates.

**⚠️ CRITICAL OCR DATA-LOSS BUG — FIX BEFORE PROCESSING MORE VOLUMES:**
The maintainer's original correction stage (`apply_curated_corrections.py`) wrote out
ONLY pages that received a correction — silently dropping pages with no flagged tokens.
Volume 54: 346 OCR'd pages → only 177 reached the corrected folder (169 REAL letter pages
lost). Diagnosed by checking raw OCR of missing pages (p10, p45, p59 = full letter text).
**FIX:** `pipeline/apply_corrections_v4.py` — pass-through/lossless: iterates EVERY page,
applies corrections where they match, writes EVERY non-empty Tamil page regardless, logs
drops to `dropped_pages.csv`. TESTED on Vol 54: recovers 340/346 (the 6 drops are all
genuinely blank — cover, frontmatter, blanks — verified). Reads the existing corrections
CSVs (columns: wrong,right,count,reason,example_page,confidence,category), confidence-gated
via --min-confidence.

**MAINTAINER'S NEXT STEPS (local, before deploy):**
1. Re-run correction with v4:
   `python3 apply_corrections_v4.py --src 01_ocr_v2_full --out 03_corrected_v4 --volume 54 \
    --corrections 04_dictionary_v3_after_curated/review_corrections.csv --min-confidence medium`
2. Check dropped_pages.csv — confirm every drop is genuinely blank.
3. Rebuild collection: `build_murasoli_collection.py --src 03_corrected_v4 --volume 54`
   (177 → ~340 pages). THEN deploy.
NOTE: maintainer chose NOT to deploy Vol 54 until the full page set is recovered — correct
call. The bug would have halved all 53 remaining volumes, so fixing it on Vol 54 fixes the
whole pipeline. The original apply_curated_corrections.py / correct_json.py could not be
patched in-chat (they wouldn't transmit as readable text); v4 is a tested replacement. If
the originals have logic worth preserving (phrase corrections, curatedTextCorrections
provenance block), fold it into v4.

**Future (letter-level model):** currently page-level (ships fast). Later: split pages into
individual dated letters (detect date line + "உடன்பிறப்புகளே" salutation → ids like
`murasoli-1965-03-12`) for citable per-letter units.

Full pipeline walkthrough: `pipeline/murasoli-ocr-guide.md`.

---

## Scholarship shelf (pending, quick win)

Subramaniam Chandran, "How Political History is Reflected in Autobiography" (SSRN 2799068)
— ACCEPTED as a legitimate secondary source about the six volumes (precise page cites:
II.6, II.416 Rajaji "sambar and salt", III.151-153, III.602-604 the 26-point ledger).
Minor slip in it: says vol5 serialised in Murasoli. A "Scholarship / ஆய்வுக் கட்டுரைகள்"
shelf listing this — walled off from the VN·chNN citation system — is a good addition, not
yet built. (Yoganandham GJIBR 2026 economics paper was REJECTED — ~half its items post-2005.)

---

## Tone for the assistant

The user is knowledgeable, careful, collaborative — a Tamil speaker who catches errors and
supplies expert corrections (the Five Declarations term, reservation dates, Josef vs M.K.
Stalin, NSK omission, map coordinates). When he corrects a fact, verify against the corpus,
not memory. Be honest about limits (OCR accuracy, image rights, map precision, a11y needs
live testing). Never claim work "complete" when it needs human verification. Deliver a
rebuilt zip each session and present it.
