# Store submission checklist

Gate list before App Store / Play submission. Unchecked = do not submit.

## App identity

- [x] App name: **Nenjukku Neethi** (`app.json → expo.name`)
- [x] Bundle id / package: `org.nenjukkuneethi.app` (iOS + Android)
- [x] Icon (1024²), adaptive icon, splash — from the brand vector
- [x] Version / build-number strategy in place (`expo.version` `0.1.0`, `ios.buildNumber` `1`,
      `android.versionCode` `1`, `production.autoIncrement`) — see `docs/RELEASE.md`. Bump
      `expo.version` per release.

## Functionality (Apple 4.2 / Play quality)

- [x] Native app, not a WebView wrapper
- [x] Core value works offline (reader + downloaded search)
- [x] No placeholder / "coming soon" screens — every destination is real
- [x] Tested cold-start with content origin unreachable (manifest cache-fallback path) — Activity 6;
      global offline banner + truthful per-screen errors + retry. See `docs/OFFLINE_NETWORK.md`.
      (Live device airplane-mode toggle recommended before release — see doc limitations.)
- [ ] Tested on a small phone and a tablet

## Privacy & legal

- [x] **Privacy Policy** live at a public URL — `/privacy` built + Settings links to it
      (live on merge/deploy)
- [x] **Support** page live — dedicated `/support` (App Store support URL) built + Settings
      links to it; `/about` is the informational page (live on merge/deploy)
- [ ] App Privacy "nutrition label" (Apple) — the app collects no personal data;
      all state is on-device (`AsyncStorage` + file cache). Declare accordingly.
- [ ] Play Data Safety form filled to match (no data collected / shared)
- [ ] Content rights: memoir text © the estate of Kalaignar M. Karunanidhi —
      confirm distribution permission is documented

## Accessibility

- [x] Dynamic Type via `allowFontScaling` (simulator-verified; Reader reflows at all sizes —
      see `docs/ACCESSIBILITY.md` for the extreme-size dashboard caveat)
- [x] Accessibility labels on interactive controls (+ roles, `busy`/`selected`/`checked` state,
      heading semantics on primary titles — Activity 3)
- [x] Contrast check across light / sepia / dark (measured; 7 tokens fixed to WCAG AA)
- [ ] VoiceOver / TalkBack on-device pass (manual — not performed; see `docs/ACCESSIBILITY.md`)

## Store listing assets  _(repo package = `mobile/store/`, Activity 4)_

- [x] Description (Tamil + English), keywords, category (Books / Reference) — `mobile/store/`
- [x] Subtitle + Promotional text (EN + TA), within Apple limits
- [x] Age-rating worksheet prepared (ASC computes the final number) — `AGE_RATING.md`
- [x] App Privacy label worksheet (**Data Not Collected**) — `PRIVACY_LABELS.md`
- [x] iPhone 6.9" screenshots — **7** (1260×2736, no alpha) — `store/screenshots/raw/iphone/` (incl. Search)
- [x] iPad 13" screenshots — **6** (2064×2752, no alpha) — `store/screenshots/raw/ipad/` (Activity 5)
- [x] iPad first-release layout (centered max-width column); `supportsTablet` unchanged
- [x] Screenshot plan + captions (EN/TA) + review notes — `SCREENSHOT_PLAN.md`, `REVIEW_NOTES.md`
- [ ] iPad **landscape** pass (orientation is `default`; centered column handles it; manual check recommended — non-blocking)
- [ ] `04-search` screenshot (+ optional extras) — capture method documented
- [ ] Copyright field entity — OWNER DECISION REQUIRED
- [ ] Android phone/tablet screenshots (defer with Android release)
- [ ] Upload metadata/screenshots + submit — external (App Store Connect)

## Deep links

- [ ] `apple-app-site-association` served by the website
- [ ] `assetlinks.json` served by the website
- [ ] Verified `https://nenjukkuneethi.org/read/<id>` opens the Reader on device

## Build & release

- [x] `eas.json` build profiles (development / preview / production) — see `docs/RELEASE.md`
- [x] Export-compliance declared (`ITSAppUsesNonExemptEncryption: false`, standard HTTPS ⇒ exempt)
- [ ] `npm run typecheck` clean
- [ ] `npm run validate:manifest` passes
- [ ] Paid Apple Developer account + `eas init` (writes `extra.eas.projectId`) — external prerequisite
- [ ] EAS production build (iOS + Android) succeeds
- [ ] Android internal-testing track green
- [ ] iOS TestFlight build accepted
- [ ] Crash reporting wired (or a conscious decision to defer)
