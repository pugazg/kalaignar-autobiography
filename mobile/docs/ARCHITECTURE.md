# Architecture

## Principles

1. **The website is the source of truth.** Historical content lives in the
   archive's JSON and is fetched at runtime — never hardcoded in components. The
   app ships _no_ memoir prose in its bundle.
2. **Offline-first reading.** Every fetched document is cached to disk; a
   "downloaded" chapter reads from disk first and survives with no network.
3. **Native, not a wrapper.** All screens are React Native. The only web hand-off
   is the Murasoli letters collection (opened in the browser, clearly labelled)
   until a native letters reader ships.
4. **One shared identity, re-thought for touch.** Palette and Tamil type voice
   come from the site; interactions are designed for the phone.

## Layers

```
┌────────────────────────────────────────────────────────────┐
│ screens/            presentation — one file per destination │
├────────────────────────────────────────────────────────────┤
│ navigation/         stack + tabs, universal-link config     │
│ components/ui.tsx   Screen, T (Tamil text), Card, Pill, …    │
│ theme/theme.ts      palettes, spacing, radius, type scale   │
├────────────────────────────────────────────────────────────┤
│ data/AppState.tsx   provider: manifest + prefs + theme      │
│ data/client.ts      fetch + on-disk cache + downloads       │
│ data/storage.ts     AsyncStorage: prefs, bookmarks, …       │
│ data/types.ts       the data contracts (see DATA_CONTRACTS) │
│ config/env.ts       origin + manifest path (from app.json)  │
└────────────────────────────────────────────────────────────┘
```

### Data flow

- **`AppStateProvider`** (mounted in `App.tsx`) loads the manifest and the user's
  reading prefs once at startup, resolves the active theme (following the system
  scheme when `followSystemTheme` is on via `Appearance`), and exposes
  `useApp()` / `useTheme()`. Lookups `volumeByN` / `chapterById` walk the inlined
  manifest — no extra fetches to open a chapter's metadata.
- **`client.ts`** is the only place that touches the network. `fetchJSON`:
  - `offlineFirst: true` → return the cached copy immediately if present, else
    fetch and cache.
  - otherwise fetch, cache, and on failure fall back to any cached copy.
  Downloads (`downloadChapter`) persist text + English + visuals and register the
  chapter in `storage`. `clearOfflineContent` wipes the cache directory and the
  registry.
- **`storage.ts`** holds only device-local state: reading prefs, bookmarks,
  per-chapter progress, recents, the download registry, and search history.

### Caching

- JSON documents → `FileSystem.documentDirectory/content/` keyed by a slugified
  path. Persist across launches; cleared from Settings.
- Images (chapter visuals) are loaded by URL and cached by React Native's image
  layer; they are not part of the JSON download step.

### Theming

`theme/theme.ts` defines three palettes — `light`, `sepia`, `dark` — each with a
`statusBar` hint. `App.tsx` maps the active palette onto a React Navigation theme
so headers, containers, and the status bar all track the reader's choice. The `T`
component renders Tamil in Noto Serif Tamil with `allowFontScaling` for Dynamic
Type; Latin/UI text stays on the system font.

### Navigation

A root **native stack** (`Tabs`, `Volume`, `Reader`, `Timeline`, `Saved`,
`Settings`) wraps a **bottom-tab** navigator (`Home`, `Library`, `Search`,
`Explore`, `Settings`). This is a deliberate mobile redesign of the site's seven
destinations: Timeline / Saved / Settings are first-class stack screens reached
from Home, Explore, and headers rather than crammed into the tab bar. Deep links
(`nenjukkuneethi.org/read/<id>`, `nenjukkuneethi://…`) resolve through the
`linking` config to the Reader.

## Key decisions & trade-offs

| Decision | Why |
| --- | --- |
| Inline all 391 chapters in the manifest | One fetch opens the whole table of contents offline; the manifest is ~120 KB. |
| Manifest `contentVersion` = hash of indexes | Lets a future update signal fire only when content actually changed. |
| Murasoli opens on the web (for now) | No native letters reader in Increment 1; a labelled web hand-off is honest and avoids a dead placeholder. |
| Sepia as a third theme | A reading-mode addition beyond the site's light/dark. |
| Latin wordmark on the splash | The Tamil title's pre-base vowel signs need HarfBuzz shaping the asset toolchain lacks; the app renders the Tamil title correctly at runtime. |
