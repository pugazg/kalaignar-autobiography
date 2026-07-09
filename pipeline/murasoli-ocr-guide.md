# Murasoli Letters — OCR & Correction Pipeline (v3)

The archive's second collection: 54 volumes of Karunanidhi's letters to
udanpirappugal (உடன்பிறப்புகளுக்கு), scanned PDFs (~980 MB each) on the TN Govt
Digital Library. This documents the MAINTAINER'S production pipeline, which extends
the original one-page extractor into a full OCR → dictionary → review → correction
workflow. Volume 54 (346 pages) is complete.

> OCR + correction run LOCALLY (Mac, Tesseract tam+eng). Only final corrected JSON
> ships to the website. Nothing here runs on Vercel.

## Pipeline, stage by stage

```
Murasoli vol-NN.pdf (scanned ~980MB)
  → ocr_extract_v2.py        Tesseract CLI, tam+eng, TSV line rebuild, junk-filter
01_ocr_v2_full/text/*.json   one JSON per page + volumeNN.index.json
  → build_dictionary.py      reviewable lexicon from the pages
02_dictionary_pre_curated/   frequencies, trusted lexicon, correction candidates
  → HUMAN REVIEW the CSVs
  → apply_curated_corrections.py   token+phrase; audit reports
03_corrected_json_v3/text/   corrected pages w/ curatedTextCorrections block
  → build_dictionary.py again  measure what remains
04_dictionary_v3_after_curated/
05_correction_report_v3/     page_report, correction_totals, summary.json
reference_verified_source_dictionary/  trusted seed, verified vs known-good sources
```

### ocr_extract_v2.py (improved extractor)
- Tesseract CLI directly (no pytesseract dependency).
- Defaults to tam+eng (letters mix Tamil body with English addresses/phones/email).
- Non-destructive: avoids aggressive thresholding that erased faint glyphs.
- TSV output rebuilds cleaner lines from word-boxes; discards separator/border
  hallucinations (the "க கக ககக" junk from rule lines) before writing JSON.
- Richer page JSON: pageType (frontmatter/body), ocrStatus, ocrLines,
  textCandidates, discardedOcrLines, engine, source, createdAt.
- One file per page, resumable, memory-safe.

### build_dictionary.py (lexicon builder)
From all page JSON:
- kalaignar_lexicon.json/.txt — trusted words. V54: ~4,360 trusted from 53,672
  total / 15,984 unique.
- frequencies.csv / raw_frequencies.csv — normalized + raw counts.
- correction_candidates.csv — high-confidence deterministic fixes.
- near_match_suggestions.csv / review_candidates.csv — lower-confidence, human review.
- ocr_patterns.json, statistics.json, ignored_tokens.csv.
- Seeded with SEED_TERMS (அண்ணா, கலைஞர், கருணாநிதி, கழகம், தேர்தல் …).

### correction scripts (two variants)
- correct_json.py — conservative: automatic, high-confidence, EXACT Tamil token
  only. Originals untouched; full CSV/JSON audit.
- apply_curated_corrections.py — richer: token AND phrase corrections, updates
  paragraphs + ocrLines/textCandidates together, combines dictionary rows with
  hand-curated frontmatter fixes; writes curatedTextCorrections provenance per page.
- Both filter by --category and --confidence, so corrections are promoted from
  "needs_review" to "automatic/high" only after human sign-off. This review gate is
  what keeps OCR honest — nothing auto-applies without a human.

## Running (local, Mac)
```
brew install tesseract tesseract-lang poppler
tesseract --list-langs          # must include tam AND eng
python3 pipeline/ocr_extract_v2.py vol54.pdf --collection murasoli --volume 54
python3 pipeline/build_dictionary.py 01_ocr_v2_full/text --out 02_dictionary_pre_curated
# HUMAN REVIEW the CSVs, then:
python3 pipeline/apply_curated_corrections.py 01_ocr_v2_full/text 03_corrected_json_v3/text \
    --corrections 02_dictionary_pre_curated/automatic_corrections.csv \
    --report-dir 05_correction_report_v3
```

## Quality lessons (verified on Volume 54)
- Judge on BODY pages, not cover/title (photo + display type OCR badly).
- --psm 4 for single-column letter pages.
- Filename padding: pdftoppm makes page-015.png not -15.png.
- Rule-line junk OCRs as "க கக ககக" — extractor's JUNK_TAMIL_TOKENS filters it.
- Mixed script: use tam+eng (English addresses, phones, email in letters).
- Clean scans → Tesseract suffices. Rough newsprint may want Google Document AI.

## Bridging to the website (remaining build)
OCR JSON schema differs from the memoir chapter schema; a small adapter is needed:

| chapter needs | Murasoli page has | adapter action |
| id | id (mNN-pXXXX) | use as-is |
| volume | volume | use as-is |
| title | null | derive "தொகுதி 54 · பக்கம் NN" or letter date |
| pages | page (int) | map |
| paragraphs[] | paragraphs[] | use as-is |

Plan when ready:
1. build_murasoli_collection.py (Layer 2): read corrected 03_corrected_json_v3, add
   missing display fields, write public/data/murasoli/text/ + collection index.
2. Add murasoli collection to Reading Room (Library.tsx): collection switcher
   (Nenjukku Neethi ⇄ Murasoli), volume list → page reader.
3. Cross-collection search in SearchDialog.
4. Model by page first (ships fast); by-letter later (detect date lines +
   "உடன்பிறப்புகளே" salutation → ids like murasoli-1965-03-12).
5. Provenance: rights nationalised, source TN Govt Digital Library.

Website half can begin now — Volume 54's corrected JSON exists. Remaining 53 volumes
follow the same local pipeline.

---

## ⚠️ CRITICAL: the data-loss bug and the pass-through fix (v4)

**What went wrong on Volume 54:** the OCR produced 346 pages, but only 177 reached the
corrected folder — 169 REAL letter pages were silently lost. Root cause: the original
correction stage wrote out ONLY pages that received a correction, discarding any page
whose text happened to contain none of the flagged tokens (e.g. clean pages like p10,
p45, p59 — full of real letter text). The OCR was fine; the builder was fine; the
correction stage dropped them.

**The rule this violated:** correction must EDIT pages, never OMIT them. The only pages
that should be absent from the output are genuinely empty ones (no Tamil text), and those
must be logged, never dropped silently.

**The fix — `pipeline/apply_corrections_v4.py`** (tested, lossless by construction):
- Iterates over EVERY page in the input folder.
- Applies token corrections where they match (from your corrections CSVs).
- Writes EVERY non-empty Tamil page to the output, corrected or unchanged.
- Drops only genuinely-empty/no-Tamil pages, logged to `dropped_pages.csv`.
- Confidence-gated: `--min-confidence low|medium|high` (matches the review workflow).
- Writes `correction_report.csv` (per-page fixes) for audit.

Tested on Volume 54: **340/346 pages recovered** (the 6 drops verified as cover,
frontmatter, and blank pages).

**Run it:**
```
python3 pipeline/apply_corrections_v4.py \
    --src 01_ocr_v2_full --out 03_corrected_v4 --volume 54 \
    --corrections 04_dictionary_v3_after_curated/review_corrections.csv \
    --min-confidence medium
# then check 03_corrected_v4/dropped_pages.csv — every drop should be genuinely blank
# then: build_murasoli_collection.py --src 03_corrected_v4 --volume 54
```

**Why this matters for all 54 volumes:** the same bug would have halved every remaining
volume. Always check the input-vs-output page count after correction. A quick sanity check:
raw OCR page count (346 for V54) minus genuinely-blank pages should ≈ the corrected count.
If corrected << raw, pages are being lost — investigate before building the collection.

If the original `apply_curated_corrections.py` has logic worth keeping (phrase-level
corrections, the `curatedTextCorrections` provenance block, frontmatter handling), fold
those into v4 rather than reverting — but keep v4's pass-through guarantee.

---

## Stage 6 — Letter-level units: `pipeline/builders/split_murasoli_letters.py`

Run AFTER `build_murasoli_collection.py`. Reassembles the built pages into
individual, citable letters.

**Volume 54 ground truth (validated on the built pages):**
- Salutation is the SINGULAR "உடன்பிறப்பே," (not "உடன்பிறப்புகளே" — the plural is
  kept as a fallback pattern for earlier volumes; verify per volume).
- Every letter opens with a GLOBAL serial number heading: "4016. <title>". The
  serial runs across all 54 volumes (front matter: 4,051 letters total), so it
  is the durable letter id: `m54-l4016`.
- Letters END with the sign-off block "அன்புள்ள," / "மு.க." / dd-mm-yyyy — the
  letter's date lives at the sign-off, not the head. Dates are validated
  (1940–2018) and dropped if OCR-garbled, never guessed.
- Running page headers ("தலைவர் கலைஞர் NN", "NN கலைஞரின் கடிதங்கள்"), bare page
  numbers, and table-of-contents pages are stripped/skipped.

**Two modes:**
```
python3 pipeline/builders/split_murasoli_letters.py --volume 54            # report only
python3 pipeline/builders/split_murasoli_letters.py --volume 54 --publish  # + public/data
```
Report mode writes `archive/murasoli-letters-vNN-report.json` and the assembled
letters under `archive/murasoli-letters-vNN/` for human review. `--publish`
additionally writes `public/data/murasoli/letters/` + `letters-index.json`.

**Do NOT --publish from an incomplete page set.** On the buggy 177-page V54 build
the report correctly shows the damage: serial gaps (4016 → 4019, 4021 → 4038 …)
and bloated letters that absorb pages of letters whose opening page was dropped
(e.g. one "letter" spanning 43 pages). After the v4 re-run (~340 pages) the
report should show a contiguous 4016–4051 range, ~36 letters, most of them dated.
Review the report + a few assembled letters before publishing.

**Reader integration is BUILT.** /murasoli lists letters as the primary units
(serial · Tamil title · date · page span) with source pages in a secondary
expander; /murasoli/mNN-lXXXX renders the assembled letter (MurasoliLetterReader),
/murasoli/mNN-pXXXX still renders single pages. The sitemap includes letters.
The whole surface degrades gracefully: if letters-index.json is absent, the
collection renders page-wise exactly as before.

**Full re-run sequence for a volume (v4.1):**
```
python3 pipeline/apply_corrections_v4.py --src 01_ocr_v2_full --out 03_corrected_v4 \
    --volume 54 --min-confidence medium \
    --corrections pipeline/reference_verified_source_dictionary/review_corrections.csv \
    --corrections pipeline/reference_verified_source_dictionary/automatic_corrections.csv \
    --self-heal --vocab public/data/text \
    --trusted pipeline/reference_verified_source_dictionary/trusted_terms_for_murasoli.json
# --vocab   = memoir corpus as token-frequency evidence
# --trusted = curated Kalaignar vocabulary (7,147 terms): NEVER modified, and a
#             heal candidate found in it counts as corpus evidence
# review: dropped_pages.csv (all genuinely blank?), rescued_pages.csv,
#         self_heal_report.csv (esp. AMBIGUOUS-review rows)
python3 pipeline/builders/build_murasoli_collection.py --src 03_corrected_v4 --volume 54
python3 pipeline/builders/split_murasoli_letters.py --volume 54            # report first
python3 pipeline/builders/split_murasoli_letters.py --volume 54 --publish  # when clean
```
NOTE: don't pass the same volume's own built pages as --vocab — the volume's
pages are already counted, and double-counting inflates error-token frequencies.

---

## Stage 4.5 — Grammar & lexicon repair (inside apply_corrections_v4, --self-heal)

Three pattern layers run after CSV corrections, all logged in self_heal_report.csv:

1. **Orthographic-impossibility repair** (`ortho-healed`): sequences illegal in
   Tamil script — vowel-sign+virama (தலைவா், தோ்தல்), stacked vowel signs
   (கலைஞாா், எதிாத்த) — are errors by definition. Rules branch on ambiguity
   (ா் → ர் or ீர்; ேோ → ேர்/ோ/ே) and the trusted lexicon picks the winner
   (தண்ணா் → தண்ணீர், not தண்ணர்; கலைஞாா → கலைஞர், not கலைஞார்).
2. **Glyph-confusion repair** (`glyph-healed`): valid-orthography non-words from
   ர→ா and ேர்→ோ misreads (தோதல்→தேர்தல், தொடாந்து→தொடர்ந்து, காநாடக→கர்நாடக).
   Gates: the token must be RARE (<=3) in the independent memoir corpus (protects
   real words like அய்யா, freq 25), and exactly ONE candidate must be in the
   trusted lexicon or frequent (>=5) in the memoir. Multiple hits → suggestion.
3. **First-letter self-heal** (`healed`): impossible word-initials only
   (ன ண ழ ற ள ங). All vowel-initial deictic swaps are suggestions, never auto.

V54 yield: 140 ortho + 489 glyph + 2 initial = 631 repairs; 63 suggestions for
human review. Latin-script tokens are LEFT ALONE — Kalaignar quotes English
sources (CAG, Times of India) verbatim, so English is content, not noise.
