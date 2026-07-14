# Translation style guide — Nenjukku Neethi & Murasoli letters

Binding guidance for every English translation added to this archive
(`public/data/text-en/`, `public/data/murasoli/letters-en/`). Set by the
maintainer, July 2026. The model translations live in
`docs/translation-models/` — three Murasoli Vol 53 letters and six Anna
pieces. **The benchmark they set is the translator's restraint and fidelity,
not Anna's prose style. Never imitate Anna's voice when translating another
author.**

## Rules

1. **Understand the complete thought before translating.** Never render
   clause-by-clause; read the full sentence/paragraph, then write its English.
2. **Preserve argument and rhetorical structure.** The order of points, the
   build of an argument, the placement of the barb or the appeal — keep them.
3. **Natural English from contextual meaning**, not literal dictionary
   equivalence. A Tamil idiom gets its working English equivalent, not a gloss.
4. **No literary ornament absent from the Tamil.** If the original is plain,
   the English is plain. Do not "improve" the author.
5. **Translator's notes** (in the JSON `translatorNote` / `provenance.note`
   fields) only for genuine decisions worth recording: OCR ambiguities
   resolved by intent, historical terminology (e.g. cusecs, zamindari),
   culturally significant renderings (e.g. Udanpirappē kept in transliteration).
6. **Paragraph alignment with the Tamil source** is mandatory — including its
   page-break fragments — so reviewers can check line against line.
7. The Tamil original is authoritative; every published translation carries
   `status: "under_review"` until the maintainer clears it.

## Fixed conventions already adopted

- Salutation: **"Udanpirappē,"** (transliterated), with the standard
  translator's note on first use per letter.
- Sign-off: "With affection, M.K." + the date in prose form (4 October 2016).
- OCR-garbled words translated per evident intent, noted in provenance.

## Lessons codified from the approved v1-ch01 benchmark (July 2026)

The maintainer's own rendering of v1-ch01 (public/data/text-en/v1-ch01.json,
status: approved) is the benchmark for the memoir. It adds these rules:

8. **English paragraphing follows the argument's natural units**, not the OCR
   page-joins. Short paragraphs — often one thought each — are preferred; a
   single sentence may stand alone ("The year was 1924."). OCR page-break
   fragments are merged in the English.
9. **Honorifics and epithets kept**: Gandhiji, Thanthai Periyar, Arignar Anna,
   Thamizh Thendral Thiru. V. Kalyanasundara Mudaliar.
10. **Historically informed precision**: "our Presidency" for the 1924 மாநிலம்;
    Srinivasa Iyengar; Motilal Nehru in full.
11. **Tamil terms glossed inline on first use**: Raja—"king"; Manthiri—"minister".
12. **Interpretive clarity is licensed where the literal image would obscure**:
    உயிர் எமக்கு வெல்லமல்ல → "life was not so sweet that it must be preserved
    at the price of submission" (not a literal jaggery gloss).
13. **The chapter teaser** (data/teasers.ts) is written in the same voice and
    may summarise the chapter's movement in 2–3 sentences.
