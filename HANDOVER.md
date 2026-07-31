# Project Handover — Kalaignar Digital Library (nenjukkuneethi.org)

_Last updated: this session. Read this first in a new window to continue any work stream._

---

## 0. Orientation

- **Repo (local):** `/Users/pugazhendhirajendran/Documents/projects/kalaignar-autobiography`
- **GitHub:** https://github.com/pugazg/kalaignar-autobiography (branch `main`, git user `pugazg`)
- **Live site:** https://nenjukkuneethi.org (Next.js 14 App Router, hosted on Vercel; push to `main` → auto-deploy)
- **What it is:** an interactive digital archive of Kalaignar M. Karunanidhi's six-volume
  Tamil memoir _Nenjukku Neethi_, plus the _Murasoli_ letters collection.
- **Commit convention:** end commit messages with
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Commit only when asked (the
  user has generally asked to commit each finished unit of work).
- **Data is the source of truth:** historical content lives in `public/data/**` (served JSON)
  and `data/*.ts` (feature datasets). Never hardcode historical prose in components.

### Git state at handover
- `main` HEAD = `a398fd6` "Correct Volume 50 letter 3558 to 3858".
- **Uncommitted / untracked** (intentionally not yet committed):
  - `mobile/` — the new React Native app (ACTIVE work, incomplete — see §3).
  - `documentary/` — documentary pre-production package (see §2).
  - `pipeline/builders/build_app_manifest.py` + `public/data/app/manifest.v1.json` — app manifest.
  - `.claude/`, `pipeline/builders/__pycache__/` — ignore.

---

## 1. Completed & live this session (all pushed to `main`)

- **Murasoli letters** — added Volumes **50, 51, 52, 53** (each: Tamil + full English
  translation, `உடன்பிறப்பே,` salutation, common source link `https://tamildigitallibrary.in`).
  Collection now spans Vols **50–54** (Vol 54 was pre-existing). Builder:
  `pipeline/builders/build_vol53_from_translations.py` (parametrized: `python3 … <vol> <src-dir>`).
  - Vol 50 quirks handled in the builder: **printed-order** (serial 3558 sits between 3857 &
    3859) and a `### Source Note` sub-section that must join the translator's note; then serial
    **3558 was corrected to 3858** via `SERIAL_FIXES` in the builder.
- **Chapter visuals** — placed sketches/photos into Reading Room chapters for Volumes
  **1, 2, 3, 5, 6** (Vol 4 not yet supplied). Builders in `pipeline/builders/`:
  `build_volume1_visuals.py` (sentence-anchor + ink-threshold), `build_volume2_visuals.py`
  (chapter+page-position; ennurai offset; 12 front-matter photo plates),
  `build_volume3_visuals.py` (crops captured text off cartoons, then ink-threshold; page-based
  chapter mapping), `build_photo_volume_visuals.py` (Vols 5 & 6, photo-only). Output:
  `public/data/visuals/<id>.json` + `public/images/volume<N>/`. The Reader
  (`components/Reader.tsx`) renders them ink-on-transparent, `dark:invert`; photos framed.
- **Site icon** — `app/icon.svg` + `app/apple-icon.png` (நீ glyph). Currently the **original**
  cream நீ on marina teal with brass frame (user reverted the black/red experiment).
- **Hero portrait** — `sections/Hero.tsx` shows a faint line-sketch portrait of Kalaignar
  (`public/images/kalaignar-portrait.png`) bleeding ~40% off the left edge, like the நீ
  watermark; opacity ~0.18 desktop / ~0.07 mobile; `dark:invert`.
- **Navbar avatar** — `components/Navbar.tsx` has a small circular photo of Kalaignar with a
  writing pad (`public/images/kalaignar-avatar.jpg`) beside the நெஞ்சுக்கு நீதி title.
- **Social share image** — `app/opengraph-image.jpg` + `app/twitter-image.jpg` (1200×630,
  Tamil title + portrait), `twitter.card = summary_large_image` in `app/layout.tsx`. Works
  site-wide. NOTE for the user: X caches cards ~7 days; test with a `?v=2` cache-buster.
- **Read-aloud (TTS) feature — REVERTED.** Was built (`components/ReadAloud.tsx` + Reader/
  MurasoliLetterReader integration) but removed because Tamil Web-Speech voices are unreliable
  on the user's devices (read only digits/punctuation). Do not re-add without a reliable Tamil
  voice (cloud TTS). Nothing about it remains in the repo.

---

## 2. Documentary pilot (PAUSED — pre-production complete, blocked)

Goal: a 3–4 min narrated Tamil documentary of chapter **v1-ch01 "பிறந்த ஆண்டு"**, reusable per
chapter. **Nothing rendered.** All pre-render deliverables exist under
`documentary/chapters/v1-ch01/` (24 files) + `documentary/README.md` (reusable system) +
`documentary/terminology.md`.

- **Single review surface:** `documentary/chapters/v1-ch01/review/PILOT_REVIEW_PACK.md`
  (full content inline: summary, timeline, Tamil narration + English, Q/P/F classification,
  storyboard, subtitles, visual prompts, pronunciation, music/sound, end credits, review
  items, change log). Also: `.srt` files (`subtitles/`), `proof/` (58-s opening proof spec).
- **Editorial decisions applied:** R1 Chauri Chaura omitted (it's 1922, chapter loosely says
  "this year"); R3 Rousseau/Voltaire = "author-rendered quotation" (not in pilot);
  R4 **all direct quotes are PENDING print verification** — page scans of printed pp. 15–21 are
  NOT in the repo. See `review/print-text-verification.md`. To lift: user drops scans into
  `documentary/chapters/v1-ch01/source/scans/` (`p015.jpg…p021.jpg`).
- **BLOCKERS (need user decision):**
  1. **Higgsfield** MCP connected earlier but account had **0 credits (free plan)**. Preflighted
     costs: video ≈ **7.5 credits / 5-s clip**; Seed Audio TTS ≈ **0.4 credits / short line**.
     The connector is **currently disconnected**. To generate the 3 test clips (A/B/C) or the
     Tamil voice test, the user must fund it (free trial = card + auto-charge, or top-up) —
     a financial decision; do NOT start a trial or buy credits without explicit "yes".
  2. **No dedicated Tamil voice** in Higgsfield's 65 presets → a paid Tamil pronunciation test
     is required before any narration; else use a human narrator.
- **Next step when unblocked:** run the 20–30-s Tamil voice test
  (`proof/narration-test-ta.md`), get approval, then the 3 low-cost visual test clips
  (`proof/visual-prompts.md`), log each in `proof/higgsfield-setup-status.md`, then assemble
  the 58-s proof per `proof/composition-plan.md`. **Do not start the full 3:45 render.**

---

## 3. Mobile app (Increment 1 COMPLETE — compiles & bundles; real-device test pending)

**Task:** production-quality cross-platform app (Expo + React Native + TypeScript) for App
Store + Play, consuming the archive JSON. NOT a WebView wrapper (Apple 4.2). Reuse the site's
visual identity but redesign interactions for mobile. This is **Increment 1: the runnable
foundation** (navigation + offline reader + search + data layer) — production hardening,
TestFlight, and store assets are staged in the roadmap, not faked.

**Status:** Increment 1 compile-critical implementation is **complete** and lives on branch
`mobile/increment-1-runnable` (not merged to `main` — see below). The app now compiles and
Metro bundles it end to end. **Still pending: launching and smoke-testing on a real device /
simulator** — do that before merging to `main` or tagging a release.

Verified in this env (deps now installed):
- `npx tsc --noEmit` → **exit 0** (fixed a real navigation `linking` type error: `Tabs` is
  now typed as `NavigatorScreenParams<TabParamList>` and `linking` as `LinkingOptions`).
- `npm run validate:manifest` → **passes** (AJV): 6 volumes, 391 chapters.
- `npx expo-doctor` → **18/18 checks pass**.
- `npx expo export --platform ios` → **succeeds** (whole module graph resolves; ~2.5 MB
  Hermes bundle).
- Dependency fixes required to bundle: added **`expo-asset`** and **`babel-plugin-module-resolver`**
  (the latter is used by `babel.config.js` for the `@/` alias but was missing — app could not
  bundle without it); aligned SDK-52 versions via `expo install --fix` (`react-native`
  0.76.5→0.76.9, `@expo/vector-icons`→`~14.0.4`). `mobile/package-lock.json` is committed.
- **App icons/splash regenerated from the exact brand vector** `app/icon.svg`
  (`mobile/assets/generate-assets.py` rasterises the நீ glyph with correct bezier fill — the
  earlier font-based approximation was replaced). Assets are pixel-consistent with the website.

### 3a. Data feed — DONE
- **Builder:** `pipeline/builders/build_app_manifest.py` — reads `public/data/manifest.json` +
  `public/data/volume<N>.index.json` + murasoli indexes → emits **`public/data/app/manifest.v1.json`**
  (versioned; `contentVersion` = hash of indexes). Contains all 6 volumes, **391 chapters**
  inlined (id/title/pages + `textUrl`/`textEnUrl`/`visualsUrl`), murasoli, feature slots.
  Already generated & valid (121 KB). Re-run: `python3 pipeline/builders/build_app_manifest.py`.
- The app fetches this once from `https://nenjukkuneethi.org/data/app/manifest.v1.json` and
  caches it; chapter text/search/visuals/letters JSON are reused as-is from the site.
- **Feature datasets** (timeline, governance, people, themes, quotes) live in `data/*.ts`
  (TypeScript) and are **not yet exported to JSON**. Manifest `features.*` = null for those
  (only `stats` present). Increment-2 task: write `pipeline/builders/export-feature-data`
  (via `npx tsx`) to dump `data/timeline.ts` etc. → `public/data/app/features/*.json`, then the
  manifest builder auto-links them (`feature_url()` already checks for the files).

### 3b. App files created (under `mobile/`) — DONE
```
mobile/
  package.json app.json tsconfig.json babel.config.js index.ts .gitignore
  src/
    config/env.ts                 ORIGIN + manifest path (from app.json → extra), url() helper
    theme/theme.ts                palettes light/dark/SEPIA, spacing, radius, fontSteps,
                                  lineHeightSteps, Noto Serif Tamil font family constants
    data/
      types.ts                    ALL data contracts (AppManifest, VolumeEntry, ChapterEntry,
                                  ChapterText/En, FullTextEntry, Visual, ReadingPrefs, Bookmark,
                                  ProgressRecord, DownloadRecord)
      storage.ts                  AsyncStorage wrapper (prefs, bookmarks, progress, recents,
                                  downloads registry, search history) + defaultPrefs
      client.ts                   fetchJSON w/ FileSystem cache (offlineFirst), api.* (manifest,
                                  chapterText/En/Visuals, searchIndex, downloadChapter,
                                  removeChapterDownload, imageUrl)
      AppState.tsx                AppStateProvider: loads manifest+prefs, resolves theme
                                  (followSystem via Appearance), useApp()/useTheme() hooks
    components/ui.tsx             Screen, T (Tamil-optimized text, allowFontScaling), Card, Pill,
                                  Eyebrow, Loading, EmptyState
    navigation/index.tsx          RootNavigator (Stack) + Tabs (Home/Library/Search/Explore/
                                  Settings) + Volume/Reader/Timeline/Saved/Settings stack
                                  screens; `linking` config for universal links
    screens/
      HomeScreen.tsx              continue-reading, quick tiles, recently-read
      LibraryScreen.tsx           six volumes list → Volume
      VolumeScreen.tsx            chapters list, per-chapter offline download toggle
      ReaderScreen.tsx            OFFLINE READER: Tamil/English toggle, font/line-height/theme
                                  controls, progress bar + persistence + resume, bookmark,
                                  share-passage (long-press), interleaved visuals
      SearchScreen.tsx            Tamil full-text over /data/fulltext/v<N>.json (cached→offline),
                                  volume filter, highlighted snippets, search history
      SavedScreen.tsx             tabs: bookmarks / offline downloads / in-progress
```

### 3c. Increment 1 compile-critical work — DONE
The three missing screens + entry point + tooling now exist and are wired in:
1. **`mobile/src/screens/SettingsScreen.tsx`** — theme (light/sepia/dark + follow-system),
   font-size & line-height steppers, "English by default" toggle, offline storage size +
   clear, **Privacy Policy** + **Support** links, app/content version. (`api.offlineBytes()` +
   `api.clearOfflineContent()` were added to `data/client.ts` for this.)
2. **`mobile/src/screens/TimelineScreen.tsx`** — era-per-volume rail from `period` metadata
   (1924–2005 → tap → Volume); degrades to milestones when `features.timeline` JSON lands.
3. **`mobile/src/screens/ExploreScreen.tsx`** — real thematic entry points (Volumes, Timeline,
   Search, Saved), a Murasoli card (opens the web collection, clearly labelled — no native
   letters reader yet, so no dead placeholder), and a by-the-numbers panel.
4. **`mobile/App.tsx`** — loads Noto Serif Tamil (holds native splash until ready), wraps
   `RootNavigator` in `AppStateProvider` + `NavigationContainer` (palette→nav-theme mapping,
   deep-link `linking`), drives `StatusBar` from the active theme.
5. **`mobile/scripts/validate-manifest.mjs`** — AJV schema check + cross-checks (chapterCount
   vs inlined chapters, unique ids). `npm run validate:manifest` passes.
6. **Assets** — `icon.png`, `splash.png`, `adaptive-icon.png` generated from `app/icon.svg`
   by `mobile/assets/generate-assets.py` (see §3 status note above).
7. **Docs** — `mobile/README.md` + `mobile/docs/{ARCHITECTURE,DATA_CONTRACTS,ROADMAP,BUILD,
   STORE_CHECKLIST}.md`, all written.

### 3c-next. IMMEDIATE next step: real-device runtime test
Everything above is static-verified (types, bundle, doctor) but **not yet run on a device**.
Before merging `mobile/increment-1-runnable` → `main` or tagging: `cd mobile && npx expo start`,
open in Expo Go / a simulator, and smoke-test each screen (manifest load, reader offline,
search, downloads, theme switching, deep link `nenjukkuneethi.org/read/v1-ch01`).

### 3d. How to run
```bash
cd mobile
npm install            # deps ARE installed on branch mobile/increment-1-runnable (network verified)
npx expo start         # scan QR with Expo Go, or:
npm run ios / android  # native build
```
- **Tooling checked:** Node v22.23.1, npm 10.9.8 present. No global `expo` (use `npx`). No
  native build tooling verified here — the user runs builds locally / via EAS.
- **Dependencies** are pinned to Expo SDK ~52 in `package.json`. If versions clash, run
  `npx expo install --fix`.

### 3e. Design notes / decisions
- Bottom tabs = 5 (Home, Library, Search, Explore, Settings). Timeline, Saved, Settings are
  also first-class stack screens reached from Home/Explore/headers (mobile redesign of the
  spec's 7 destinations — documented choice, all 7 exist).
- Themes: light / **sepia** / dark (sepia is the reading-mode addition). Palette mirrors the
  site (marina `#0E5D63`, brass `#B98A2F`, paper `#FAF7F1`, night `#0C1116`).
- Tamil typography: Noto Serif Tamil via `@expo-google-fonts/noto-serif-tamil`; `T` component
  uses `allowFontScaling` for Dynamic Type. Accessibility labels are on interactive elements.
- Offline: `expo-file-system` caches every fetched JSON; `client.ts` reads cache-first for
  downloaded chapters and falls back to cache when the network fails. Search works offline for
  volumes whose `fulltext/v<N>.json` has been fetched.
- Universal links: `app.json` has iOS `associatedDomains` + Android `intentFilters` for
  `nenjukkuneethi.org`; `navigation` `linking` maps `/read/:id` → Reader. (Server-side
  `.well-known/apple-app-site-association` + `assetlinks.json` still to add to the website for
  real universal-link verification — roadmap item.)

### 3f. Remaining for "production / store-ready" (roadmap, NOT done)
Push notifications (expo-notifications wiring + a content-update signal keyed on
`contentVersion`), share-as-image (react-native-view-shot is a dep; wire it), NetInfo offline
banner, download-manager screen + bulk/volume download, iPad/tablet layouts, crash reporting
(e.g. Sentry), privacy-minimal analytics, accessibility audit, JSON-schema validation in CI,
app icon/splash, store screenshots + metadata, Android internal-testing + iOS TestFlight
builds. **No placeholder/unfinished screens** is a store gate — every screen must be real
before submission.

---

## 4. Data contracts (quick reference for the app)

- `GET /data/app/manifest.v1.json` → `AppManifest` (see `mobile/src/data/types.ts`).
- `GET /data/text/<id>.json` → `ChapterText` `{id, volume, title, pages:{start,end}, paragraphs[]}`.
- `GET /data/text-en/<id>.json` → `ChapterTextEn` (optional per chapter).
- `GET /data/fulltext/v<N>.json` → `FullTextEntry[]` `{i:id, t:title, x:fulltext}` (search).
- `GET /data/visuals/<id>.json` → `Visual[]` `{src, type, afterParagraph}` (`-1` = before ¶0).
- `GET /images/volume<N>/<file>` → chapter illustration (ink-on-transparent PNG or photo JPG).
- Murasoli: `/data/murasoli/index.json`, `/letters-index.json`, `/letters/<id>.json`, `/letters-en/<id>.json`.
- `GET /data/stats.json` → archive stats. `data/*.ts` feature datasets await JSON export.

Chapter id format: `v<vol>-ch<NN>` (zero-padded, e.g. `v1-ch01`, `v3-ch140`). Murasoli:
`m<vol>-l<serial>` (e.g. `m50-l3858`).

---

## 5. Key commands
```bash
# from repo root
npm run dev                                   # Next.js website dev (port 3000)
python3 pipeline/builders/build_app_manifest.py                 # rebuild app manifest
python3 pipeline/builders/build_vol53_from_translations.py <vol> <src-dir>   # add a Murasoli volume
# preview server for the website is driven via the Browser pane tools, not `next dev` in bash
```

---

## 6. Open questions for the user (carry into next window)
1. **Mobile:** proceed to finish Increment 1 (Settings/Timeline/Explore screens + App.tsx +
   docs so it compiles and runs), then commit `mobile/` + `build_app_manifest.py` +
   `public/data/app/`? (Recommended next action.)
2. **Documentary:** fund Higgsfield (trial vs top-up) and approve a Tamil voice test? Provide
   pp. 15–21 scans to lift the R4 print-verification hold?
3. **Volume 4 visuals / any remaining Murasoli volumes** — supply when ready; builders exist.
4. Commit the currently-uncommitted `mobile/`, `documentary/`, and app-manifest files? (Nothing
   from those is committed yet.)
