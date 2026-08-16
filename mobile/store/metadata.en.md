# App Store metadata — English (primary)

Primary storefront localization: **English (U.S.)** (India storefront defaults to English; add
English U.K./Australia/Canada as copies if desired). Tamil is a separate localization —
see [`metadata.ta.md`](metadata.ta.md).

Counts below are measured; fields with an Apple limit note the limit. Name (30) and Subtitle
(30) limits were confirmed from Apple primary docs this session; **Description (4000),
Keywords (100), Promotional Text (170) are the long-standing Apple limits — reconfirm in App
Store Connect at submission.** All copy is kept comfortably under the limit.

---

## App Name  _(limit 30)_
```
Nenjukku Neethi
```
15 chars. This is the configured app identity (`app.json → expo.name`) and the memoir's own
title. No keyword stuffing. **Do not rename.**

## Subtitle  _(limit 30)_
```
Karunanidhi's memoir, offline
```
29 chars. Adds what the Tamil title alone doesn't signal to a broad audience — whose memoir, and
the core value (offline reading). No "official/authorised/complete works" claims.

## Promotional Text  _(limit 170 — editable without review)_
```
Kalaignar M. Karunanidhi's six-volume memoir — read in Tamil and English, search every chapter, and explore the timeline, people, places and Murasoli letters. Offline.
```
167 chars. Describes only shipped functionality.

## Description  _(limit 4000)_
```
Nenjukku Neethi is a native reading archive of the complete six-volume memoir of Kalaignar M. Karunanidhi (1924–2005), together with his Murasoli letters — an independent digital edition built for careful, offline reading on iPhone and iPad.

THE MEMOIR, IN FULL
All six volumes and 391 chapters of Nenjukku Neethi, spanning 1924 to 2005, presented from the original Tamil source text and organised volume by volume, chapter by chapter.

TAMIL AND ENGLISH
Read in the original Tamil, set in Noto Serif Tamil, or switch to the English translation where one exists — a tap toggles between them, and the translator's note is always kept distinct from Kalaignar's own words.

SEARCH EVERY CHAPTER
Full-text Tamil search runs across all 391 chapters. Tap a result to open the exact passage, highlighted in place.

FOLLOW THE TIMELINE
A dated timeline of milestones from the memoir, from 1924 onward — tap any event to open the chapter it comes from.

EXPLORE BY THEME, PERSON AND PLACE
Move through the archive by theme, by the people who shaped the story, and by the places it happened in — each linking straight back into the memoir.

THE MURASOLI LETTERS
Read the Murasoli letters natively — 346 letters across seven volumes, in Tamil, with English where available.

BUILT FOR READING
Adjust text size, line spacing and theme (light, sepia or dark). Bookmark chapters, resume exactly where you left off, and share a passage with a long press.

WORKS OFFLINE
Download chapters for offline reading; previously read content and searched volumes stay available with no connection. Your bookmarks, reading position and preferences live only on your device.

ACCESSIBILITY
Dynamic Type, VoiceOver labels and heading semantics, and Tamil-first typography throughout.

ABOUT THIS EDITION
This is an independent, non-commercial digital edition. It is not an official publication and claims no affiliation with, or endorsement by, any person, family, party or institution. Copyright in the original works remains with their respective rights holders; this edition provides source attribution for its content. Corrections are welcome via nenjukkuneethi.org.
```
Only shipped features. No affiliation/ownership/permission claims beyond the repository's
"independent digital edition · rights remain with holders" wording.

## Keywords  _(limit 100 — comma-separated, no spaces; byte-counted)_
```
Kalaignar,Karunanidhi,Tamil,memoir,autobiography,Murasoli,Dravidian,history,archive,literature
```
94 chars (ASCII = 94 bytes). Excludes words already in the name ("Nenjukku", "Neethi"). No
competitor names, no political slogans, no unverifiable claims. **Note:** Apple byte-counts this
field; the Tamil-localization keywords (Tamil script) cost multiple bytes per character — keep
that set short and verify the byte count in ASC.

## Category  _(recommendation)_
- **Primary: Books** — the product is fundamentally a long-form reading app for a body of
  literature (a 391-chapter memoir + letters).
- **Secondary: Reference** — the searchable archive plus timeline / people / places / themes are
  reference-style ways into that text.
- (Education was considered and rejected as a weaker fit — there is no course/lesson structure.)
Confirm both are present in the current App Store category list at submission.

## Copyright  _(App Store "Copyright" field)_
**OWNER DECISION REQUIRED.** The field wants `© <year> <entity>`. Two distinct copyrights must
not be conflated:
- **This app / digital edition** — an independent project; needs a project owner or entity name.
  No organisation name exists in the repository, so this must be supplied by the owner.
- **The source works** (the memoir text and Murasoli letters) — copyright remains with their
  respective rights holders and is **not** claimed here.

Suggested format once the owner is known:
```
© 2026 <project owner / entity — OWNER DECISION REQUIRED>. Source works © their respective rights holders.
```
Do not invent an entity name.

## URLs
| Field | URL | Status |
|---|---|---|
| Privacy Policy (required) | https://nenjukkuneethi.org/privacy | 200 ✓ |
| Support (required) | https://nenjukkuneethi.org/support | 200 ✓ |
| Marketing (recommended) | https://nenjukkuneethi.org | 200 ✓ |

Marketing URL → the site home (the fullest public presentation of the archive); `/about` is a
fine alternative if a more descriptive landing page is preferred. All verified 200 this session.
