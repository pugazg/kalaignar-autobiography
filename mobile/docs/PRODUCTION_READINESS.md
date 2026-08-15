# Production readiness audit

_Audit date 2026-08-15. Inspection + prioritized plan only — no features implemented here.
Companion to `STORE_CHECKLIST.md` (the raw gate list); this doc adds status, blocker
classification and a ranked execution order. Evidence is the current `main` tree._

## 1. Current app baseline

Expo SDK 57 (RN 0.86.2, React 19.2.3), New Architecture. Native reader app; the website
(`nenjukkuneethi.org`) is the content source, fetched once (versioned manifest) and cached
on-device for offline use. No memoir prose ships in the bundle. Bundle id / Android package:
`org.nenjukkuneethi.app`. `app.json` version `0.1.0` (no build numbers yet). No `eas.json`.

## 2. Increment 1 + 2 — complete

- **Increment 1:** navigation (5 tabs + stack), offline reader (Tamil/English, font/line-height/
  theme, progress + resume, bookmarks, share-a-passage, inline visuals), Tamil full-text search,
  versioned manifest + on-disk cache + per-chapter downloads, light/sepia/dark, Dynamic Type,
  app icon/splash, `validate:manifest`, docs.
- **Increment 2:** feature-data export (6 datasets), native Timeline milestones, native Murasoli
  reader (7 vols / 346 letters, Ta/En, vol 54 as its curated letters), Places export, native
  Explore Themes (6) / People (15) / Places (10) with memoir deep-links + a schematic map.
- **Also:** Xcode-26 / SDK-57 build clean (no fmt patch); memoir volume titles synchronized.

## 3. Audit status by category

| Cat | Item | Status | Store blocker? |
|---|---|---|---|
| A | Privacy Policy page (`/privacy`, Settings link) | **COMPLETE** (built; live on merge) | Resolved |
| A | Support page (`/support`, Settings link) | **COMPLETE** (dedicated page; built; live on merge) | Resolved |
| A | About page (`/about`, Settings link) | **COMPLETE** (built; live on merge) | Resolved |
| A | Copyright/permission wording | PARTIAL (cautious neutral wording on About; distribution permission not documented) | Soft |
| B | Deep-link route handling (app-side) | COMPLETE (`linking` config, Reader `read/:id`) | No |
| B | iOS Associated Domains / Android intent filters (config) | COMPLETE in `app.json` (`applinks:`, autoVerify) | No |
| B | `apple-app-site-association` + `assetlinks.json` (website) | **NOT STARTED** (no `.well-known`) | No (custom scheme works) |
| B | Universal-link entitlement signing + on-device verification | NOT STARTED (needs paid team) | No |
| C | Dynamic Type + accessibility labels | COMPLETE (statically) · simulator-verified (Activity 3) | No |
| C | Contrast across themes (light/sepia/dark) | **COMPLETE** (Activity 3 — 7 tokens fixed to WCAG AA, measured; see `docs/ACCESSIBILITY.md`) | No |
| C | Screen-reader semantics / roles / headings / touch targets | **COMPLETE (repo-side)** (Activity 3) — manual VoiceOver/TalkBack device pass still pending | Soft (review risk) |
| C | VoiceOver / TalkBack on-device navigation pass | NOT STARTED (needs manual/device — documented, not faked) | Soft (review risk) |
| D | Per-chapter download, offline images, offline-first caches, storage total, clear-offline | COMPLETE | No |
| D | Offline banner (`netinfo` dep unused), bulk/volume download, download manager, storage breakdown, content-version update check | NOT STARTED | No |
| E | Native text share | COMPLETE (2 readers) | No |
| E | Share-as-image (`react-native-view-shot` dep unused) | NOT STARTED | No |
| F | Push notifications (`expo-notifications` dep+plugin, **0 code**) | NOT STARTED | No |
| G | Crash reporting | NOT STARTED | Soft (recommended) |
| G | Analytics | NOT STARTED | OPTIONAL (privacy stance = no data) |
| H | iPad basic compatibility (`supportsTablet: true`, flex layouts) | PARTIAL (runs; not optimized, no split-view/max-width) | No* |
| I | Android config (package, adaptive icon, intent filters) | COMPLETE | No |
| I | Android build/signing/`assetlinks`/internal-testing | NOT STARTED | No (defer after iOS) |
| J | Bundle id / app.json identity | COMPLETE | No |
| J | EAS build config (`eas.json`) | **NOT STARTED** | **YES** (to build/submit) |
| J | Paid Apple Developer membership + App Store Connect | NOT STARTED (external/process) | **YES** (process) |
| J | Screenshots / description / keywords / privacy labels / age rating | NOT STARTED (assets) | **YES** (to submit) |
| J | Export-compliance declaration (`ITSAppUsesNonExemptEncryption`) | NOT SET (standard HTTPS ⇒ exempt) | Soft (one-line) |
| K | App Review 4.2 (minimum functionality) | **LOW RISK** — rich native app, no WebView wrapper, no dead ends | No |
| L | Mobile CI (typecheck / validate:manifest / expo-doctor / iOS export) | COMPLETE | No |
| L | Version/build-number strategy (`autoIncrement`, buildNumber/versionCode) | NOT STARTED | Prereq for release |

\* iPad: `supportsTablet: true` means Apple will review on iPad and expects iPad screenshots;
the app runs there but is not optimized. Not a hard blocker if iPad screenshots are provided
or tablet support is deliberately scoped.

## 4. Genuine store blockers (strict)

- ~~Privacy Policy + Support pages live~~ — **RESOLVED (Prod-readiness Activity 1):** real
  `/privacy`, `/support` and `/about` pages built and wired into Settings; live on merge.

Remaining:

1. **Release engineering to produce a signable build** — add `eas.json`, a version/build-number
   strategy; requires a **paid Apple Developer account** for TestFlight/App Store and Associated
   Domains signing. _(Account = external/process; `eas.json` + versioning = small repo work.)_
2. **Store metadata + assets** — screenshots (per device class), description (Ta/En), keywords,
   privacy "nutrition" labels, age rating. _(Content/asset work; nothing to code.)_

Everything else is polish, reliability, or post-launch — **not** a blocker by the strict definition.

## 5. Recommended execution order

Ranked by concern (submission blockers → reliability → release-eng → polish → optional →
post-launch), **not** roadmap order.

| # | Work item | Status | Blocker? | Why now | Timing | Scope |
|---|---|---|---|---|---|---|
| 1 | Privacy + Support/About public pages (website) + Settings URLs | **DONE** (Activity 1) | was Yes | Hard Apple/Play requirement; smallest unblock | — | Small–Medium |
| 2 | Release engineering: `eas.json`, version/build-number strategy, export-compliance flag | NOT STARTED | **Yes (prereq)** | Nothing builds for TestFlight without it | **Next** | **Small** |
| 3 | Accessibility pass: contrast across themes + VoiceOver/label/focus review | **Repo-side COMPLETE (Activity 3)**; manual VoiceOver device pass pending | Soft | Review risk; contrast/semantics/headings/touch-targets fixed & measured, see `docs/ACCESSIBILITY.md` | Manual VO before submission | **Medium** |
| 4 | Store metadata + assets (screenshots, copy, privacy labels, age rating) | NOT STARTED | **Yes** | Required to submit | Before submission | **Medium** |
| 5 | Universal Links: website `.well-known` files + paid-team verification | PARTIAL | No | App works on custom scheme; needs paid team | After account is paid | **Medium** |
| 6 | Offline banner (`netinfo`) + truthful offline states polish | NOT STARTED | No | Cheap reliability win | Launch polish | **Small** |
| 7 | Crash reporting (e.g. Sentry) | NOT STARTED | Soft | Diagnose field crashes early | Around launch | **Small–Medium** |
| 8 | Share-as-image (`react-native-view-shot`) | NOT STARTED | No | Nice-to-have; text share already works | Post-launch | **Medium** |
| 9 | Download manager / bulk download / storage breakdown | NOT STARTED | No | Enhancement | Post-launch | **Large** |
| 10 | **Push notifications** | NOT STARTED | No | No first-release need; needs a signal backend | Post-launch | **Medium–Large** |
| 11 | iPad optimization (split layouts, max content width) | PARTIAL | No | Only if iPad is a launch target | Post-launch | **Medium** |
| 12 | Android internal-testing release | NOT STARTED | No | Sequence after iOS to bound scope | After iOS | **Large** |
| 13 | Analytics | NOT STARTED | Optional | Conflicts with no-data privacy stance | Only if required | **Small** |

**On Push Notifications:** they are first in the roadmap's "Production" list but are **not** the
right next step — no genuine blocker, no update-signal backend exists, and shipping them requires
a paid account and server-side content-update infrastructure. They belong post-launch.

## 6. Deliberately deferred

Governance & Quotes native UI (data exported, UI out of scope); Murasoli bookmarks / cross-
collection Saved; bulk downloads; push; analytics; iPad redesign; Android release; content
distribution-permission documentation (in-app © line present, formal permission not yet documented).

## 7. Exact recommended next workstream

**Prod-readiness Activity 1 (legal/store-link readiness) is DONE** — `/privacy`, `/support`,
`/about` built and wired into Settings (live on merge).

**Next: Prod-readiness Activity 2 — release engineering / TestFlight preparation:** add
`eas.json` (build profiles), a version/build-number strategy (`expo.version`, `autoIncrement`,
buildNumber/versionCode), and the export-compliance flag; this plus a **paid Apple Developer
account** enables the first TestFlight build. Do **not** start Push Notifications.

See `STORE_CHECKLIST.md` for the granular pre-submission gate list.
