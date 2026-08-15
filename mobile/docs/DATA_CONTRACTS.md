# Data contracts

Every shape the app consumes. These mirror `src/data/types.ts`; the manifest is
validated against them by `scripts/validate-manifest.mjs`. Base origin is
`https://nenjukkuneethi.org` (overridable via `app.json → expo.extra.origin`).

## App manifest — `GET /data/app/manifest.v1.json`

Built by `pipeline/builders/build_app_manifest.py`. Fetched once, cached.

```jsonc
{
  "schemaVersion": 1,
  "contentVersion": "…",      // hash of the volume/murasoli indexes; changes ⇒ content changed
  "generatedAt": "ISO-8601",
  "dataBase": "/data",
  "work": { "titleTa": "நெஞ்சுக்கு நீதி", "titleEn": "Nenjukku Neethi",
            "author": "…", "siteUrl": "https://nenjukkuneethi.org" },
  "volumes": [ VolumeEntry, … ],   // all 6
  "murasoli": MurasoliEntry | null,
  "features": {                    // JSON URLs (null only until a dataset is exported)
    "timeline": "/data/app/features/timeline.json", "governance": "…", "people": "…",
    "places": "/data/app/features/places.json", "themes": "…", "quotes": "…",
    "stats": "/data/stats.json"
  }
}
```

### VolumeEntry

```jsonc
{
  "n": 1,
  "titleTa": "…" | null, "titleEn": "…" | null,
  "period": "1924–1969" | null,
  "serialisedIn": "…" | null,
  "chapterCount": 140,
  "pages": 759 | null,
  "searchIndexUrl": "/data/fulltext/v1.json" | null,
  "chapters": [ ChapterEntry, … ]   // length must equal chapterCount
}
```

### ChapterEntry

```jsonc
{
  "id": "v1-ch01",                 // v<vol>-ch<NN>, zero-padded
  "title": "…",
  "startPage": 15 | null, "endPage": 21 | null,
  "textUrl": "/data/text/v1-ch01.json",
  "textEnUrl": "/data/text-en/v1-ch01.json" | null,
  "visualsUrl": "/data/visuals/v1-ch01.json" | null
}
```

### MurasoliEntry

```jsonc
{
  "title": { "en": "…", "ta": "…" } | "…",
  "indexUrl": "/data/murasoli/index.json",
  "lettersIndexUrl": "/data/murasoli/letters-index.json",
  "letterUrlTemplate": "/data/murasoli/letters/{id}.json",
  "letterEnUrlTemplate": "/data/murasoli/letters-en/{id}.json",
  "volumeCount": 6 | null,
  "totalLetters": 288
}
```

## Per-document endpoints

| Endpoint | Shape | Notes |
| --- | --- | --- |
| `GET /data/text/<id>.json` | `ChapterText` `{ id, volume, title, pages:{start,end}, paragraphs[] }` | Tamil body. |
| `GET /data/text-en/<id>.json` | `ChapterTextEn` `{ id, title?, paragraphs[], provenance? }` | Optional per chapter. |
| `GET /data/fulltext/v<N>.json` | `FullTextEntry[]` `{ i:id, t:title, x:fulltext }` | Search index, one array per volume. |
| `GET /data/visuals/<id>.json` | `Visual[]` `{ src, type, afterParagraph, confidence? }` | `afterParagraph: -1` = before ¶0. |
| `GET /images/volume<N>/<file>` | PNG / JPG | Ink-on-transparent sketch or framed photo. |
| `GET /data/stats.json` | archive stats | Counters + per-volume chapters/pages. |
| Murasoli | `/data/murasoli/index.json`, `/letters-index.json`, `/letters/<id>.json`, `/letters-en/<id>.json` | Letter id: `m<vol>-l<serial>`. |

## Feature datasets — `GET /data/app/features/<name>.json`

Exported by `pipeline/builders/export-feature-data.ts` (`npm run build:features`) from
the authoritative website modules in `data/*.ts` — the TypeScript is the source of
truth; the builder imports it and serialises verbatim (source order preserved, Unicode
Tamil intact, no timestamps → deterministic reruns). The manifest links each file via
`feature_url()` **only once it exists**, so run the exporter *before*
`build_app_manifest.py` (or use `npm run build:app-data`, which chains both). Each file
mirrors its source module's named exports; every `ref`/`refs` is a memoir chapter id.

```jsonc
// timeline.json  (from data/timeline.ts)
{
  "eras": [ { "id": "Roots", "label": "Roots", "years": "1924–1936" }, … ],
  "timeline": [ {
    "id": "t1924", "year": "1924", "era": "Roots",      // era ∈ eras[].id
    "location": "…"?, "tags": ["…"]?, "title": "…", "summary": "…",
    "stat": { "value": "…", "label": "…" }?, "image": "…"?,
    "refs": ["v1-ch01", …]                               // memoir chapter ids
  }, … ]
}

// governance.json  (from data/governance.ts)
{
  "govTerms": [ { "id": "t67", "en": "…", "ta": "…" }, … ],
  "govKindLabels": { "law": { "en": "Law", "ta": "சட்டம்" }, … },  // keyed by kind
  "governance": [ {
    "id": "tn-rename",
    "kind": "law|resolution|scheme|project|institution|policy|ledger",
    "term": "t67",                                       // term ∈ govTerms[].id
    "year": "1967", "name": { "en": "…", "ta": "…" },
    "note": { "en": "…", "ta": "…" }, "refs": ["v1-ch133", …]
  }, … ]
}

// people.json  (from data/people.ts)
{ "people": [ {
  "id": "anna", "tamil": "…", "name": "…", "role": "…",
  "relationship": "…", "firstAppears": "…", "refs": ["v1-ch140", …]
}, … ] }

// themes.json  (from data/themes.ts)
{ "themes": [ {
  "id": "movement", "icon": "Users", "tamil": "…", "title": "…", "narrative": "…",
  "initiatives": ["…"], "achievements": ["…"],
  "stats": [ { "value": "…", "label": "…" } ], "refs": ["v1-ch34", …],
  "archive": {                                           // optional
    "context": "…"?, "people": ["periyar", …]?,          // people ∈ people[].id
    "laws":   [ { "label": "…", "ref": "v5-ch22" } ]?,   // ref = chapter id
    "events": [ { "label": "…", "ref": "v1-ch34" } ]?
  }?
}, … ] }

// quotes.json  (from data/quotes.ts) — a chapter may carry more than one quote
{ "quotes": [ { "tamil": "…", "english": "…", "context": "…", "ref": "v1-ch01" } , … ] }

// places.json  (from data/places.ts) — x/y are SCHEMATIC map positions, not GPS
{ "places": [ {
  "id": "thirukkuvalai", "tamil": "திருக்குவளை", "name": "Thirukkuvalai",
  "note": "…", "refs": ["v1-ch01", "v4-ch02"],
  "x": 1250, "y": 1120           // within the schematic TN viewBox 0 0 1640 2032
}, … ] }
```

All six datasets are exported. The exporter validates before writing and **fails loudly
(emitting nothing) on any duplicate id, unknown era/term/kind, broken chapter ref, bad
`archive.people` id, empty required field, or a place `x`/`y` outside the schematic
viewBox (x 0–1640, y 0–2032)** — it never "fixes" source data. The place coordinates are
**schematic positions in the source's Tamil Nadu map viewBox, not geographic
coordinates**; they are exported verbatim and must never be geocoded or "corrected".

**Consumers.** `TimelineScreen` loads `features.timeline` via `api.feature<T>(url)`
(offline-first: a previously fetched copy renders with no network). It validates the
payload shape defensively and, on anything malformed / a missing feature URL / a fetch
failure with no cache, falls back to the era-per-volume view. Milestones are grouped by
`eras` and rendered in the JSON's array order (already chronological — never re-sorted);
`refs[0]` is treated as the primary chapter and opens the native `Reader` (no search
`find` term is synthesised — the dataset provides none). The typed shapes live in
`src/data/types.ts` (`TimelineFeature`, `TimelineMilestone`, `TimelineEra`).

## Murasoli collection (native reader)

Consumed by the native Murasoli screens (Library → Volume → Reader). URLs/templates
come from `manifest.murasoli`; all fetches are offline-first (a previously read
index/letter stays readable offline). Types live in `src/data/types.ts`.

```jsonc
// GET /data/murasoli/index.json
{ "collection": "murasoli",
  "title": { "en": "…", "ta": "…" }, "rights": "…",
  "volumes": [ { "volume": 48, "pageCount": 399, "pages": [], "sourceUrl": "…" }, …,
    // vol 54 is scan-sourced: `pages` is populated (used only to flag it Tamil-only)
    { "volume": 54, "pageCount": 341, "pages": [ { "id": "m54-p0002", "page": 2,
        "title": {"en":"…","ta":"…"}, "pageType": "frontmatter|body|…" }, … ] } ],
  "totalPages": …, "volumeCount": 7 }

// GET /data/murasoli/letters-index.json — every volume, incl. 54 (its 36 curated letters)
{ "collection": "murasoli",
  "volumes": [ { "volume": 48, "letterCount": 58, "letters": [
    { "id": "m48-l3706", "number": 3706, "date": "2013-02-20",
      "title": { "en": "…", "ta": "…" }, "pages": ["23","24",…] }, … ] }, … ] }

// GET /data/murasoli/letters/<id>.json — original Tamil letter
{ "id": "m48-l3706", "collection": "murasoli-letter", "volume": 48, "number": 3706,
  "date": "2013-02-20", "title": {"en":"…","ta":"…"}, "salutation": "உடன்பிறப்பே,",
  "pages": ["23",…], "ocrStatus": "…", "paragraphs": ["…", …], "curated": true }

// GET /data/murasoli/letters-en/<id>.json — English translation (subset; not all letters)
{ "id": "…", "lang": "en", "title": "…", "salutation": "Udanpirappē,",
  "translatorNote": "…",           // editorial — shown as a distinct block, never as body
  "paragraphs": ["…", …], "provenance": { "status": "translated", "source": "…" } }
```

**Volume kinds & language.** A volume with a non-empty `index.pages` array (vol 54) is
scan-sourced and **Tamil-only**; the rest are letter volumes with **full English**. The
mobile UI browses **every** volume as letters (from `letters-index.json`) — vol 54's 36
curated letters included — matching the website. The per-page OCR scan documents
(`/data/murasoli/text/<id>.json`) exist in the data but are **not consumed** by the app.

**Counts (current):** 7 volumes · 346 letters (48:58, 49:53, 50:50, 51:49, 52:50,
53:50, 54:36). English: full for 48–53 (310); vol 54 Tamil-only (1 English present).

**Caching / offline.** Index, letter and English JSON use the shared offline-first
`fetchJSON` cache (`api.murasoli*`). A letter read once stays readable offline; an
uncached letter opened offline shows the standard offline-error state. No bulk-volume
download in this activity. Reading position is stored per id under `nn:mu:progress`
(separate from memoir `nn:progress`). No Murasoli bookmarks yet — the Saved model is
memoir-specific (`Bookmark.chapterId` + Saved routes to the memoir Reader); adding
cross-collection Saved is a later scoped activity.

## ID formats

- Chapter: `v<vol>-ch<NN>` — e.g. `v1-ch01`, `v3-ch140`.
- Murasoli letter: `m<vol>-l<serial>` — e.g. `m50-l3858`.

## Local (device) state

Persisted in `AsyncStorage`, never shipped as content:
`ReadingPrefs`, `Bookmark`, `ProgressRecord`, `DownloadRecord`, recents, search
history. Full field lists in `src/data/types.ts`.

## Validation

```bash
npm run validate:manifest
```

Checks the manifest against the schema above and cross-checks that every
`chapterCount` matches its inlined `chapters` array and that chapter ids are
unique. Wire this into CI so a manifest rebuild that drifts fails loudly.
