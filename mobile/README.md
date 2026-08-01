# Nenjukku Neethi — mobile app

A cross-platform (iOS + Android) reader for the six-volume Tamil memoir
_Nenjukku Neethi_ by Kalaignar M. Karunanidhi, plus the _Murasoli_ letters. Built
with **Expo + React Native + TypeScript**. It consumes the same archive JSON that
powers [nenjukkuneethi.org](https://nenjukkuneethi.org) — it is **not** a WebView
wrapper; every screen is native and the reader works fully offline.

## Quick start

```bash
cd mobile
npm install
npx expo start        # then press i (iOS Simulator) or a (Android emulator)
```

For a **physical device**, use an Expo **development build** (not Expo Go — the store
Expo Go tracks a newer SDK than this project's SDK ~52). See [docs/BUILD.md](docs/BUILD.md) §2.

Requires Node ≥ 18 (tested on v22) and the Expo tooling (via `npx`, no global
install needed). For native/store builds see [docs/BUILD.md](docs/BUILD.md).

## What's here (Increment 1 — the runnable foundation)

- **Navigation** — five bottom tabs (Home, Library, Search, Explore, Settings)
  plus Timeline / Saved / Settings as stack screens and universal-link routing.
- **Offline reader** — Tamil / English toggle, font-size / line-height / theme
  controls, reading-progress persistence + resume, bookmarks, share-a-passage,
  interleaved chapter visuals.
- **Search** — Tamil full-text across all six volumes, with per-volume filters and
  offline search for downloaded volumes.
- **Data layer** — a versioned app manifest fetched once and cached; all chapter
  text / visuals / search indexes fetched on demand and cached to disk.
- **Themes** — light, **sepia** (reading mode), and dark, mirroring the site's
  marina-teal / brass / paper identity.

See [docs/ROADMAP.md](docs/ROADMAP.md) for what is intentionally **not** done yet
(push notifications, share-as-image, tablet layouts, store submission, …).

## Layout

```
mobile/
  App.tsx                 entry: fonts, providers, navigation container
  index.ts                registerRootComponent(App)
  app.json                Expo config (identity, deep links, extra.origin)
  assets/                 icon / splash / adaptive-icon (+ generate-assets.py)
  scripts/
    validate-manifest.mjs  AJV schema check of the app manifest (npm run validate:manifest)
  src/
    config/               env / origin resolution
    theme/                palettes, spacing, type scale
    data/                 types, storage, network client, AppState provider
    components/           shared UI primitives
    navigation/           navigators + universal-link config
    screens/              Home, Library, Volume, Reader, Search, Explore,
                          Timeline, Saved, Settings
  docs/                   ARCHITECTURE, DATA_CONTRACTS, ROADMAP, BUILD, STORE_CHECKLIST
```

## The data feed

The app reads a single versioned manifest,
`https://nenjukkuneethi.org/data/app/manifest.v1.json`, built by
`pipeline/builders/build_app_manifest.py` in the repo root. Rebuild it with:

```bash
python3 pipeline/builders/build_app_manifest.py
npm --prefix mobile run validate:manifest
```

Full contract in [docs/DATA_CONTRACTS.md](docs/DATA_CONTRACTS.md).

## Regenerating app icons

`assets/generate-assets.py` rasterises the நீ glyph straight from the site's
vector source (`app/icon.svg`) so the app identity stays pixel-identical to the
website. Needs `pillow`, `matplotlib`, `numpy`:

```bash
python3 mobile/assets/generate-assets.py
```
