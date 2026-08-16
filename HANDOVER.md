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
- `main` HEAD = `8eff589` (this HANDOVER update). Recent line on `main`: `6e45ae0` Reader
  loop fix ← `7371078` exclude mobile from web build ← `a787644` Card tile fix ← `78a3231`
  Increment 1 foundation ← `5b0bc3a` mobile foundation + documentary + app manifest.
- `main` is pushed to `origin/main` and Vercel deploys it (the manifest is now live —
  `https://nenjukkuneethi.org/data/app/manifest.v1.json` → 200). See §3.
- Branch `mobile/increment-1-runnable` exists on origin but is now **behind** `main` (its work
  was fast-forward-merged, then further fixes landed on `main`). Continue on `main`.
- **Committed since first handover:** `mobile/` app (Increment 1, see §3), documentary
  pre-production, `pipeline/builders/build_app_manifest.py` + `public/data/app/manifest.v1.json`,
  root `tsconfig.json` exclude + `.vercelignore`.
- **Untracked / ignore:** `.claude/`, `pipeline/builders/__pycache__/`, `.DS_Store`,
  `mobile/node_modules/` (gitignored).

---

## 1. Completed & live this session (all pushed to `main`)

- **Murasoli letters** — added Volumes **50, 51, 52, 53** (each: Tamil + full English
  translation, `உடன்பிறப்பே,` salutation, common source link `https://tamildigitallibrary.in`).
  Builder: `pipeline/builders/build_vol53_from_translations.py` (parametrized: `python3 … <vol> <src-dir>`).
  - **Later:** Volume **49** added (53 letters 3764–3816, 2013; Tamil + full English) from the
    page-fidelity source repo `github.com/pugazg/kalaignar-murasoli-letters` via a **new** builder
    `pipeline/builders/build_vol49_from_pages.py` (Tamil assembled across `pages/*.md`). Collection
    now spans Vols **49–54** (Vol 54 = page-scan, pre-existing); **288 letters** total. The app
    manifest and the website's Murasoli library copy both track this dynamically.
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

## 3. Mobile app (Increment 1 COMPLETE — merged to `main`, simulator-verified end to end)

**Task:** production-quality cross-platform app (Expo + React Native + TypeScript) for App
Store + Play, consuming the archive JSON. NOT a WebView wrapper (Apple 4.2). Reuse the site's
visual identity but redesign interactions for mobile. This is **Increment 1: the runnable
foundation** (navigation + offline reader + search + data layer) — production hardening,
TestFlight, and store assets are staged in the roadmap, not faked.

**Status:** Increment 1 is **complete, merged to `main`, and verified running in the iOS
Simulator** (iPhone Air, iOS 26.5, via Expo Go on Metro). Branch `mobile/increment-1-runnable`
was fast-forward-merged into `main`; subsequent fixes (below) also landed on `main`.
**Still pending: a build/run on a physical device and the full store-readiness roadmap (§3f).**
No release tag has been created.

Static verification (deps installed; `cd mobile`):
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

**Bugs found by running it in the simulator, all fixed on `main`:**
1. **Tile grid collapsed** (Home/Explore tiles were slivers, labels wrapping one letter per
   line). `components/ui.tsx` `Card` applied the passed layout style (e.g. `width: "47%"`) to
   an inner `View` while the outer `Pressable` — the actual flex item — had no width. Fixed by
   putting the style on the outermost element. Commit `a787644`.
2. **Website deploy had been failing for ~15 days** → the app's manifest was **404 in
   production**, so Library/Explore/Search/Timeline showed "Couldn't load the archive". Root
   cause: Vercel's `next build` type-checks the whole repo and choked on `mobile/App.tsx`'s
   `react-native` import (that package lives only in `mobile/node_modules`). Fixed by excluding
   `mobile` from the root `tsconfig.json` and adding a `.vercelignore` (`mobile`, `documentary`).
   Commit `7371078`. After the passing deploy, `https://nenjukkuneethi.org/data/app/manifest.v1.json`
   now returns **200 / application/json** and the app loads real data.
3. **Reader infinite loop** ("Opening the chapter…" forever). `chapterById(id)` returns a fresh
   wrapper object every render; it was in the data-fetch effect's dependency array, so the effect
   re-ran each render, reset text to null, and refetched endlessly. Fixed by depending on the
   stable manifest chapter/volume references. Commit `6e45ae0`.

**Verified working in the simulator:** Home (2×2 tiles + live stats), Library (six volumes),
Volume (chapter list + download toggles), Reader (Tamil body in Noto Serif Tamil + interleaved
ink sketch + font/theme controls + bookmark).

**Reliability pass (post-review, on `main`):** addressed the review's "Immediate stability"
findings:
- **Retry buttons** — `EmptyState` gained an optional action; Library/Timeline/Explore now show
  a "Try again" wired to AppState `reload()`.
- **Search → passage** — the Reader reads the `find` route param, scrolls to and highlights the
  matching Tamil paragraph. A follow-up (commit `28f9454`) fixed a navigation race: the matched
  paragraph is derived synchronously via `useMemo` (not a post-render effect), a watch-effect
  scrolls to an already-measured target, `didFindScroll` re-arms on `id`/`needle` change, and
  `SearchScreen` uses a `submittedQuery` so editing the field never changes displayed results'
  meaning. **Runtime-verified in the iOS Simulator**: searched two Tamil terms landing in
  different paragraphs of the same chapter (v1-ch01 ¶3 and ¶5) — the Reader scrolled to and
  highlighted each; editing the field to an unsubmitted value still opened the submitted term.
  (Tamil can't be typed/pasted into the sim — `simctl pbcopy` mangles UTF-8 as MacRoman — so the
  two terms were seeded into the app's AsyncStorage search history and tapped from Recent
  Searches.)
- **Search errors** — per-volume fetch failures are caught; partial results still show, with a
  "N volumes couldn't be searched — Retry" banner and an empty-state Try-again.
- **Truthful offline-search wording** — "Previously searched volumes remain searchable offline."
- **Offline images** — `downloadChapter` now downloads the illustration/photo binaries to
  `content/img/` and the Reader renders the local copy when present; `bytes` counts
  text+English+visuals+images. **Verified on-disk in the sim**: downloading v1-ch01 wrote 2 PNGs
  (~196 KB) + JSON = ~238 KB, and Settings → Storage reflects the image-inclusive total.
- Deferred **Expo/SDK upgrade** documented in `mobile/docs/ROADMAP.md` (Xcode 26 / iOS 26 SDK
  requirement — do before submission, not on submission day).

Legal items (create `/privacy` + `/about`, copyright wording) were **intentionally skipped** this
round per the user; still open (see §3f / STORE_CHECKLIST). `main` HEAD after this work = latest.

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

### 3c-next. Physical-device verification + Expo SDK upgrade
**Physical-device smoke test PASSED (2026-08-11, iPhone 15 Pro, on SDK 52):** reader/6
volumes, navigation, Tamil rendering, illustrations, font/theme controls, both Tamil
searches with scroll + highlight, offline Tamil/English/illustrations, bookmark +
reading-position + theme/font persistence, storage accounting, clear-offline, share sheet.
That build needed a temporary local `fmt` patch + free-team signing tweaks in the
git-ignored `ios/` for Xcode 26 (documented in `mobile/docs/BUILD.md`).

**Expo SDK upgrade — COMPLETE (PR #3):** upgraded **52 → 57** (RN 0.86.2, React
19.2.3, Node 22 in CI), sequentially, gate green at each step. **The Xcode-26
`fmt`/`consteval` failure is now eliminated — the SDK-57 native project builds clean
with no patch** — verified by GitHub Mobile CI (PASS) + the iOS 26 simulator core-flow
check. See `mobile/docs/BUILD.md` → "Expo SDK 52 → 57 upgrade" for the full verification
block. **The SDK-57 physical-device re-test was waived by the user** (Increment 1 was
already physically verified on SDK 52) — a deliberate decision, not a blocker, recorded
as `SDK-57 physical-device re-test: NOT PERFORMED — waived by user`. Universal-link deep
links remain separately pending (need a paid-team build + the site `.well-known` file).

### 3c-next3. Increment 2 · Activity 1 — feature-data export (DONE)
**Implementation.** `pipeline/builders/export-feature-data.ts` (run via `npm run
build:features`, using `tsx`; added as a root devDependency) imports the authoritative
`data/{timeline,governance,people,themes,quotes}.ts` and writes
`public/data/app/features/*.json`, each mirroring its module's named exports (so
`eras`, `govTerms`, `govKindLabels` are preserved, not dropped). It is deterministic
(source order preserved, Unicode Tamil intact, no timestamps → identical bytes on
rerun) and **validates before writing** — duplicate ids, unknown era/term/kind, broken
chapter refs, bad `archive.people` ids, empty required fields all fail the build with a
report; nothing is written and source data is never silently "fixed". `npm run
build:app-data` chains export → `build_app_manifest.py`. Contracts documented in
`mobile/docs/DATA_CONTRACTS.md` → "Feature datasets".

**Record counts:** timeline 42 · governance 30 · people 15 · themes 6 · quotes 14.
All 149 distinct chapter refs resolve to real memoir chapters (of 391). No source
inconsistencies found.

**Verification (all PASS).** exporter runs; rerun is byte-identical (deterministic); all
five JSON parse; Tamil preserved; counts match source; ids unique; refs valid. Manifest
rebuilt: `features.{timeline,governance,people,themes,quotes}` now resolve to real files,
`places` stays `null`, memoir/Murasoli unchanged (6 vols / 391 ch / 346 letters). Mobile
gate: typecheck, `validate:manifest`, `expo-doctor` (21/21), `expo export --platform ios`
— all green. Website: root `tsc --noEmit` + `next build` — green.

**No UI work was started** (Timeline/Explore screens untouched — this activity is the
data foundation only).

**Exact next activity → Increment 2 · Activity 2 — Timeline milestones** using
`features.timeline`: render dated events with deep-links to the Reader (the Timeline
screen currently degrades to era-per-volume). Do not start it without a fresh prompt.

### 3c-next4. Increment 2 · Activity 2 — Timeline milestones (DONE)
**Implementation.** `src/screens/TimelineScreen.tsx` now renders the real milestones when
`manifest.features.timeline` is present. It fetches the feature JSON through a new reusable
data-layer helper `api.feature<T>(url)` (`src/data/client.ts`) — offline-first, so a
previously fetched copy renders with no network — and validates the payload defensively
(`parseTimeline`) before use. Milestones are grouped by the source `eras` and rendered in
the JSON's array order (already chronological — never re-sorted); each card deep-links to
the cited chapter via the existing `Reader` route (`nav.navigate("Reader", { id: refs[0] })`;
no `find` term is invented — the dataset has none). Types added to `src/data/types.ts`
(`TimelineFeature`, `TimelineMilestone`, `TimelineEra`). The timeline milestone `image`
field (a website `/placeholders` asset) is intentionally not rendered on mobile.

**Fallback (preserved).** When the feature URL is absent, the fetch fails with no cache, or
the payload is malformed, the screen falls back to the Increment-1 era-per-volume view
(`EraFallback`, the original component) — no dead-end, no weakened offline/error behaviour.

**Verification (all PASS).** Mobile gate: typecheck, `validate:manifest`, `expo-doctor`
(21/21), `expo export --platform ios`. iOS 26 simulator (native SDK-57 build): Timeline
shows the 42 milestones grouped by era in chronological order; Tamil renders; theme
switching applies (light↔sepia); deep-links open the correct chapter for an early volume
(1924 → v1-ch01 "பிறந்த ஆண்டு") and later volumes (1991 → v4-ch03, 1996 → v4-ch20), all
appearing in Home's "recently read"; back-nav returns to the Timeline with scroll
preserved; Library/Reader navigation unregressed. No physical-device test (not required).

**Scope.** Only the Timeline experience — no Explore/Murasoli/places/people/themes/quotes UI.

**Exact next activity → Increment 2 · Activity 3 — Native Murasoli reader** (next open
roadmap item): replace the Explore web hand-off with a native letters list + reader using
the murasoli endpoints. Do not start it without a fresh prompt.

### 3c-next5. Increment 2 · Activity 3 — Native Murasoli reader (DONE)
**Implementation.** Explore's Murasoli web hand-off is replaced by native navigation:
Explore → `MurasoliLibrary` → `MurasoliVolume` → `MurasoliReader`. New screens under
`src/screens/Murasoli*`; routes added to `navigation/index.tsx`; data-layer helpers
`api.murasoli{Index,Letters,Letter,LetterEn}` (offline-first) in `client.ts`; Murasoli
types + a separate `nn:mu:progress` storage key in `types.ts`/`storage.ts`. The Library
is driven entirely by `index.json` + `letters-index.json` (no hardcoded volume numbers).
Every volume — including the scan-sourced vol 54 — is browsed as letters via `FlatList`;
the Reader reuses the memoir controls + shared prefs, offers a Tamil/English toggle where
English exists, and shows the translator's note as a distinct block (never merged into
Kalaignar's text). Only the letter index is fetched to render a volume; bodies load on tap.

**Vol 54.** Scan-sourced (341 OCR pages in the data) and Tamil-only, but presented as its
36 curated letters like every other volume, per request and matching the website. The raw
per-page scan JSON (`/data/murasoli/text/`) is left unconsumed.

**Counts (from data):** 7 volumes · 346 letters (48:58, 49:53, 50:50, 51:49, 52:50,
53:50, 54:36). English full for 48–53 (310 letters); vol 54 Tamil-only.

**Verification (all PASS).** typecheck / validate:manifest / expo-doctor (21/21) /
iOS export. iOS 26 simulator: Explore opens Murasoli natively (no web hand-off); Library
lists all 7 volumes with correct counts/ranges/language; letter list + Tamil reader render;
English toggle both ways on a vol-49 letter (translator's note distinguished); vol 54 opens
as 36 letters (Tamil, no fake English); theme + font controls; back-nav Reader→Volume→
Library→Explore; memoir Library/Reader unregressed.

**Limitations.** No Murasoli bookmarks (Saved is memoir-specific — deferred as a scoped
cross-collection Saved activity). No bulk-volume download (later download-manager scope).
No Murasoli search (out of scope). Vol 54's raw scan pages aren't separately browsable.

**Also on this branch's base:** memoir volumes 2–6 were given their Tamil part-titles so
all six title consistently in the Library (merged separately as PR #6).

**Exact next activity → Increment 2 · Activity 4 — Explore theme / people / places entry
points** (next open roadmap item, from the feature JSON). Do not start without a fresh prompt.

### 3c-next6. Increment 2 · Activity 4 — Explore: Themes · People · Places (DONE)
Activity 3 (native Murasoli) merged to `main` first. Then, on `mobile/increment2-explore`:

**4A — Places export.** `data/places.ts` (authoritative, 10 places) was unexported
(`features.places` was null). Extended `pipeline/builders/export-feature-data.ts` to import
it and emit `public/data/app/features/places.json` — the exporter now produces all six
datasets. Places validation (fails loudly): unique ids; non-empty tamil/name/note; non-empty
refs; every ref a real chapter; `x`/`y` finite and within the **schematic** viewBox
(x 0–1640, y 0–2032). Coordinates are schematic map positions, exported verbatim — never
geocoded. Manifest rebuilt: `features.places` now resolves; all other feature URLs and
memoir/Murasoli counts unchanged; deterministic rerun clean. Corrected the stale "places has
no source" docs.

**4B — native Explore.** Explore's Discover section now has native entries for Themes, People
and Places (plus the Activity-3 Murasoli). New screens `src/screens/{Themes,People,Places}Screen.tsx`
(list + detail each), a shared `src/data/useFeature.ts` loader (offline-first, defensive
parse, independent degradation) and `src/components/ChapterRefs.tsx` (resolves refs → real
chapter titles → `Reader`). Theme detail shows narrative/initiatives/achievements/stats +
archive context, with `archive.events` → Reader and `archive.people` → Person detail. Places
has a dependency-free schematic map (source x/y, labelled non-geographic) + list. Shared
reading prefs; no new mapping dependency. Types added to `types.ts`; 6 routes added.

**Counts (from generated JSON):** themes 6 · people 15 · places 10 · timeline 42 ·
governance 30 · quotes 14. (Governance/Quotes have data but **no Explore UI** — out of scope.)

**Verification (all PASS).** typecheck (root + mobile) · validate:manifest · expo-doctor
(21/21) · iOS export · website `next build`. iOS 26 simulator: Explore shows Themes/People/
Places/Murasoli; Themes list+detail with archive-event → Reader (v2-ch49); People list +
Person detail (Periyar, refs resolved); Places list + schematic map + detail (Chennai →
v2-ch66); memoir Reader deep-links correct; Murasoli + memoir Library/Reader unregressed.
(Places was exercised against the branch's data via a temporary local origin, since live
`features.places` deploys only on merge; the override was reverted and never committed.)

**Limitations.** No Governance/Quotes UI (out of scope). No cross-feature search, no bulk
download, no Murasoli changes. Places schematic map is dot-markers only (no TN outline —
avoids a mapping dependency).

**Exact next activity → the next open item in `mobile/docs/ROADMAP.md`** after Explore
entry points (re-check the roadmap; the remaining Increment-2 UI items are complete, so the
next work is in the "Production / store-ready" list, e.g. push notifications / share-as-image
/ download manager). Do not start without a fresh prompt.

### 3c-next7. Production readiness audit (DONE — planning only)
Increment 2 is complete. A production/store-readiness audit is recorded in
**`mobile/docs/PRODUCTION_READINESS.md`** (status by category, strict store-blocker
classification, and a ranked execution order). Headline: the genuine store blockers are
(1) live **Privacy Policy + Support/About pages** (Settings links currently 404),
(2) **release engineering** — `eas.json` + version/build strategy + a paid Apple account,
(3) **store metadata/assets**. Everything else (Universal Links website files, offline
banner, crash reporting, share-as-image, download manager, **push notifications**, iPad,
Android) is polish/optional/post-launch. **Exact next workstream: legal/store-link readiness
(Privacy + Support/About pages) + release-engineering setup — NOT push notifications.**
No production feature was implemented in the audit. See `STORE_CHECKLIST.md` for the raw gates.

### 3c-next8. Production readiness · Activity 1 — legal/store-link pages (DONE)
Resolved the top store blocker from the audit: the Settings Privacy/Support links were dead
(`/privacy`, `/about` returned 404, and there was no support page).

**Implemented:**
- Website: real, static, theme-consistent pages **`/privacy`**, **`/support`** (dedicated —
  the App Store support URL), **`/about`** (informational), plus a subtle global `Footer`
  (About · Privacy · Support) in the root layout. Content is evidence-based and cautious — no
  generic-template claims, no ownership/official/permission overclaims.
- Mobile Settings now links Privacy → `/privacy`, Support → `/support`, About → `/about`
  (new row), built from the shared `ORIGIN` constant (no duplicated origins); all open
  externally, no WebView.

**Privacy evidence (from code):** no accounts/auth, no analytics/ads/tracking/crash SDKs;
`expo-notifications` present but 0 usage (inactive → policy says "does not send push
notifications"); local-only storage (prefs/bookmarks/progress/recents/downloads/cache via
AsyncStorage + FileSystem); sole network origin `nenjukkuneethi.org`; OS share sheet is
user-initiated. Policy uses the accurate "app doesn't collect; normal hosting may process
routine request metadata" distinction, and versioned ("current version") phrasing.

**Verification (all PASS):** root `tsc` + `next build` (`/privacy`, `/support`, `/about`
prerender static); mobile typecheck / validate:manifest / expo-doctor (21/21) / iOS export;
Settings URLs statically confirmed. (Pages go live on merge/deploy; PR Vercel preview serves
them.)

**Remaining store blockers:** (1) **release engineering** — `eas.json` + version/build strategy
+ paid Apple account; (2) **store metadata/assets**. No release-engineering work was started here.

**Exact next workstream → Production Readiness Activity 2 — Release engineering / TestFlight
preparation** (`eas.json`, version/build-number strategy, export-compliance flag). Do not start
without a fresh prompt. Details in `mobile/docs/PRODUCTION_READINESS.md`.

### 3c-next9. Production readiness · Activity 2 — Release engineering (DONE, merged PR #11)
Added the repo-side release engineering that makes the app buildable/submittable:
- **`mobile/eas.json`** — `development` / `preview` / `production` build profiles + a
  `submit.production` placeholder. `appVersionSource: "local"` (build numbers git-versioned,
  reproducible, no EAS-account dependency); `development` builds on the iOS Simulator with no
  signing; `production.autoIncrement`.
- **`mobile/app.json`** — seeded `ios.buildNumber "1"` + `android.versionCode 1` (marketing
  version stays `expo.version 0.1.0`); export-compliance flag
  `ios.infoPlist.ITSAppUsesNonExemptEncryption=false` (standard HTTPS ⇒ exempt).
- Docs: `mobile/docs/RELEASE.md` (strategy + Apple-account prerequisite) + `STORE_CHECKLIST`
  ticks. Gate green (typecheck / validate:manifest / expo-doctor 21/21 / iOS export; website
  build). **External prerequisite:** a **paid Apple Developer account** for the first TestFlight
  build (`eas login` → `eas init` writes `extra.eas.projectId` → `eas build`). Merged as PR #11
  (squash `75c9c85`).

### 3c-next10. Production readiness · Activity 3 — Accessibility audit & fixes (DONE)
**Branch `mobile/accessibility-readiness` (PR #12, open — leave unmerged until asked).** A
repository-side accessibility pass; full detail in **`mobile/docs/ACCESSIBILITY.md`**.

**Main fixes (3 commits):**
- **Semantics/touch targets:** `heading` prop on the shared `T` (`accessibilityRole="header"`)
  applied to every screen's primary title; `role="button"` on the reader font/line-height/theme
  controls, header gear, volume download (+ `state.busy`), search rows; explicit
  "Show English translation" label on both Ta/En reader switches; labelled the previously
  **unlabelled** Search clear button; enlarged Places map-marker hit targets to ~44 pt (the
  place **list** is the authoritative accessible path).
- **Contrast → WCAG AA (measured):** 7 tokens across light/sepia/dark (`textFaint` in all three,
  `accent` in light+sepia, sepia `textMuted`, dark `primary`) — all text now ≥4.5:1 on common
  backgrounds; palette identity preserved; borders left (decorative). Before/after in the doc.

**Verification:** native SDK-57 build **succeeded (0/0)**; iOS 26.5 simulator — normal + large
accessibility text, all three themes, navigation regression (Reader deep-links, tabs, back).
Reader reflows at all sizes. Gate green (typecheck · validate:manifest · expo-doctor 21/21 ·
iOS export). Docs updated (`ACCESSIBILITY.md`, `PRODUCTION_READINESS.md`, `STORE_CHECKLIST.md`).

**Remaining manual check:** **manual VoiceOver / TalkBack on-device navigation — NOT performed
(no physical-device test in scope), documented truthfully.** Also a non-blocking follow-up:
Home/Explore dashboard tiles + long Tamil display titles clip at the **largest** accessibility
text sizes (those destinations are duplicated in the tab bar) — layout enhancement, font scaling
deliberately not capped.

**Exact next workstream → Production Readiness Activity 4 — App Store metadata + screenshots /
assets** (screenshots per device class, Ta/En description + keywords, privacy "nutrition"
labels, age rating). Do not start without a fresh prompt. See `mobile/docs/STORE_CHECKLIST.md`.

### 3c-next11. Production readiness · Activity 4 — App Store listing package (DONE)
**PR #12 (Accessibility) merged** — squash `28eebe8` on `main`; post-merge Mobile CI green; site
healthy; the PR description was corrected to 4 commits / 20 files before merge (the "20th file"
was `HANDOVER.md`, the 4th commit — no unexpected files).

**Branch `mobile/app-store-assets` (PR TBD, leave unmerged).** Repository-side App Store listing
package — **no submission, no ASC login, no build, no EAS init, no signing.**

**Store package: `mobile/store/`** — `README.md`, `metadata.en.md`, `metadata.ta.md`,
`PRIVACY_LABELS.md`, `AGE_RATING.md`, `REVIEW_NOTES.md`, `SCREENSHOT_PLAN.md`,
`SUBMISSION_CHECKLIST.md`, and `screenshots/raw/iphone/` (6 clean 6.9" shots).

**Prepared:** canonical identity (name **Nenjukku Neethi**, `org.nenjukkuneethi.app`, v0.1.0 /
build 1 / versionCode 1 — not renamed); EN + **TA** metadata (Tamil is a supported ASC
localization) within Apple limits (Name/Subtitle 30 verified from Apple; Desc 4000/Keywords
100/Promo 170 = standard, reconfirm in ASC); keywords (EN 94 chars); category **Books /
Reference**; age-rating worksheet (ASC computes number); privacy label → **Data Not Collected**;
URLs verified 200; screenshot story + captions (EN/TA) + reproducible capture state; **6 clean
raw iPhone 6.9" screenshots (1260×2736, alpha stripped)** — Home, Reader Ta, Reader En, Timeline,
Explore, Murasoli; icon technically valid (1024² opaque); splash OK; review notes drafted.

**Remains external / decisions:** paid Apple Developer account, ASC app record, `eas init`,
signing, TestFlight/production build, metadata+screenshot **upload**, age-rating + privacy entry,
review submission. **Repo decisions pending:** copyright-field entity (**OWNER DECISION
REQUIRED**); **iPad screenshot set OR scope tablet out** (required by `supportsTablet: true`);
`04-search` + optional screenshots (method documented). Gate green (typecheck / validate:manifest
/ expo-doctor 21/21 / iOS export). No website code changed.

**Exact next workstream → re-check `mobile/docs/PRODUCTION_READINESS.md` §5.** With store metadata
prepared, the remaining non-submission items are all "No/Soft" blockers — candidates:
**Universal Links `.well-known` association files** (website `apple-app-site-association` +
`assetlinks.json`), **offline banner / launch polish**, or **crash reporting**. **Do NOT** start
Push Notifications. Pick one with a fresh prompt.

### 3c-next12. Production readiness · Activity 5 — iPad readiness + missing screenshots (DONE)
**PR #13 (Activity 4 store package) merged** — squash `d9e879f` on `main`; post-merge Mobile CI
green; site healthy; `mobile/store/` + 6 iPhone screenshots present on `main`.

**Branch `mobile/ipad-store-readiness` (PR TBD, leave unmerged).**

**iPad decision → FIRST-RELEASE READY** (Outcome A). Audited on an **iPad Pro 13" (M5)**,
iPadOS 26 (native 2064×2752). The one real issue was prose/reader spanning full width
(uncomfortable line length) + content stretching edge-to-edge. **Fix (small, high-value):** a
centered **`contentMaxWidth = 720`** column — added to the shared `Screen` (covers Home, Library,
Volume, Timeline, Explore, Search, Saved, Settings, Murasoli Library, detail screens), the two
readers (`Reader`, `MurasoliReader`), and the three raw-FlatList lists (Themes, People,
MurasoliVolume). **No-op on phones** (viewport < 720) → zero iPhone regression; pure iPad
improvement. **`supportsTablet` was NOT changed.** Deep iPad optimization (split-view /
master-detail) deliberately deferred.

**Screenshots (in `mobile/store/screenshots/raw/`):**
- **iPhone Air 6.9" (1260×2736), 7 shots:** home, reader-tamil, reader-english, **search**
  (`தமிழ்` → 215 results, seeded via `nn:searchHistory` since Tamil can't be typed in the sim),
  timeline, explore, murasoli. (`04-search` gap from Activity 4 now filled; `08` skipped — redundant.)
- **iPad Pro 13" (2064×2752), 6 shots:** home, reader-tamil, reader-english, timeline, explore,
  murasoli. All alpha-stripped, clean 9:41 status bar, light theme, QA'd (no dev chrome).

**Verified:** Home/Library/Volume/Reader(Ta+En)/Search/Timeline/Explore/Murasoli/Settings on
iPad at default text; Reader/Search/Volume reflow at `accessibility-extra-large`. **Known
limitations (documented, unchanged):** (1) Home/Explore dashboard clips at the **largest**
accessibility text sizes (Activity-3 limitation — NOT fixed here); (2) **iPad landscape** not
exercised (Simulator rotation automation unauthorized) — orientation is `default`, centered
column handles it by design; recommend a manual landscape check (non-blocking). Copyright-field
entity remains **OWNER DECISION REQUIRED** (unresolved — no owner supplied). Gate green
(typecheck / validate:manifest / expo-doctor 21/21 / iOS export).

**Remaining genuine store blockers:** (1) paid Apple Developer account + ASC record + signed
TestFlight/production build; (2) copyright-field owner decision. (iPad screenshots — previously a
blocker — resolved.)

**Exact next workstream → re-check `mobile/docs/PRODUCTION_READINESS.md` §5.** Candidates (all
No/Soft blockers): **Universal Links `.well-known` files** (best done once the signing Team ID is
known — see §R of the Activity-5 brief), **offline banner / launch polish**, or **crash
reporting**. **Do NOT** start Push Notifications. Pick one with a fresh prompt.

### 3d. How to run
```bash
cd mobile
npm install            # deps installed & committed (package-lock.json); network verified
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
1. **Mobile — Increment 1 DONE** (merged to `main`, simulator-verified, see §3). Next decisions:
   (a) run on a physical device + finish the remaining smoke tests (§3c-next); (b) start
   **Increment 2** (export `data/*.ts` feature datasets → JSON; native Murasoli reader;
   timeline milestones — §3b/§3f); (c) begin store-readiness (§3f, `mobile/docs/STORE_CHECKLIST.md`).
   No release tag has been cut yet — cut one after device testing if desired.
2. **Quick mobile polish** (noted while testing): Library/Explore error screens have no
   "Try again" (they only re-fetch on relaunch) — add a retry calling AppState `reload()`.
3. **Documentary:** fund Higgsfield (trial vs top-up) and approve a Tamil voice test? Provide
   pp. 15–21 scans to lift the R4 print-verification hold? (Unchanged — still paused, §2.)
4. **Volume 4 visuals / any remaining Murasoli volumes** — supply when ready; builders exist.
