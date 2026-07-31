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
  "volumeCount": 5 | null,
  "totalLetters": 235
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
