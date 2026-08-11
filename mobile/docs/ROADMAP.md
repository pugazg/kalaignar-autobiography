# Roadmap

Honest status of the app. Increment 1 is the runnable foundation; everything
under "Not done" is genuinely not built — no placeholder screens ship.

## Increment 1 — runnable foundation ✅

- [x] Navigation: 5 tabs + Timeline / Saved / Settings stack screens + deep links
- [x] Offline reader: Tamil/English, font & line-height & theme controls,
      progress persistence + resume, bookmarks, share-a-passage, inline visuals
- [x] Tamil full-text search with per-volume filters; offline for downloaded volumes
- [x] Data layer: versioned manifest, on-disk cache, per-chapter downloads
- [x] Light / sepia / dark themes; Noto Serif Tamil; Dynamic Type
- [x] Home, Library, Volume, Explore, Timeline, Saved, Settings screens (all real)
- [x] App icon / splash / adaptive icon from the brand vector
- [x] Manifest JSON-schema validation (`npm run validate:manifest`)
- [x] Docs: architecture, data contracts, build, store checklist

## Increment 2 — feature data & richer surfaces

- [ ] **Export feature datasets to JSON.** Write
      `pipeline/builders/export-feature-data` (via `npx tsx`) to dump
      `data/timeline.ts`, `governance.ts`, `people.ts`, `themes.ts`, `quotes.ts`
      → `public/data/app/features/*.json`. The manifest builder already links
      them via `feature_url()` once the files exist.
- [ ] **Timeline milestones.** When `features.timeline` is present, render dated
      events with deep-links straight to the relevant passage (the screen already
      degrades to era-per-volume without it).
- [ ] **Native Murasoli reader.** Replace the web hand-off in Explore with a
      letters list + reader using the murasoli endpoints.
- [ ] Explore: theme / people / places entry points from the feature JSON.

## Production / store-ready — Not done

- [ ] Push notifications: `expo-notifications` wiring + a content-update signal
      keyed on the manifest's `contentVersion`.
- [ ] Share-as-image (`react-native-view-shot` is already a dependency).
- [ ] Offline banner via `@react-native-community/netinfo` (already a dependency).
- [ ] Download manager screen: bulk / whole-volume downloads, storage breakdown.
- [ ] iPad / tablet split layouts.
- [ ] Crash reporting (e.g. Sentry) and privacy-minimal analytics.
- [ ] Accessibility audit (VoiceOver / TalkBack, contrast, focus order).
- [ ] Manifest validation in CI.
- [ ] Server-side universal-link verification files on the website:
      `.well-known/apple-app-site-association` + `assetlinks.json`.
- [ ] Store assets: screenshots, metadata, privacy policy page, support page.
- [ ] Android internal-testing track + iOS TestFlight builds (see BUILD.md).
- [~] **Expo/SDK upgrade — DONE on `mobile/expo-sdk-upgrade`, pending physical-device
      re-test + merge.** Upgraded **Expo 52 → 57** (RN 0.76.9 → 0.86.2, React
      18.3.1 → 19.2.3, Node ≥ 22.13), one major at a time, gate green at every
      step. **The Xcode-26 `fmt`/`consteval` native-build failure is eliminated —
      the SDK-57 project builds clean with no fmt patch** — and the app runs in the
      iOS 26 simulator (core Increment-1 flows verified). Remaining before this is
      ticked `[x]` and merged: the physical-iPhone re-test on SDK 57. Full detail +
      migration notes in `mobile/docs/BUILD.md` → "Expo SDK 52 → 57 upgrade".

## Known gaps to close before submission

- `App Store 4.2` (minimum functionality): the app is native and offline-capable —
  keep it that way; do not regress into a WebView.
- Every screen must be real (no "coming soon" dead ends) — currently satisfied.
- Privacy Policy + Support URLs in Settings must resolve to live pages before
  submission (they currently point at `nenjukkuneethi.org/privacy` and `/about`).
