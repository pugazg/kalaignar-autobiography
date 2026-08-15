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
  "features": {                    // JSON URLs or null until exported
    "timeline": null, "governance": null, "people": null,
    "places": null, "themes": null, "quotes": null, "stats": "/data/stats.json"
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
```

`places` has no source dataset yet, so `features.places` stays `null` until a later
activity adds and exports it. The exporter validates before writing and **fails loudly
(emitting nothing) on any duplicate id, unknown era/term/kind, broken chapter ref, bad
`archive.people` id, or empty required field** — it never "fixes" source data.

**Consumers.** `TimelineScreen` loads `features.timeline` via `api.feature<T>(url)`
(offline-first: a previously fetched copy renders with no network). It validates the
payload shape defensively and, on anything malformed / a missing feature URL / a fetch
failure with no cache, falls back to the era-per-volume view. Milestones are grouped by
`eras` and rendered in the JSON's array order (already chronological — never re-sorted);
`refs[0]` is treated as the primary chapter and opens the native `Reader` (no search
`find` term is synthesised — the dataset provides none). The typed shapes live in
`src/data/types.ts` (`TimelineFeature`, `TimelineMilestone`, `TimelineEra`).

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
