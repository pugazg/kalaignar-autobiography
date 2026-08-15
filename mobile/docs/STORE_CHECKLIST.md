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
- [ ] Tested cold-start with no network (manifest cache path)
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

## Store listing assets

- [ ] Screenshots per required device class (6.7" + 6.5" iPhone, 12.9" iPad;
      Android phone + tablet)
- [ ] Description (Tamil + English), keywords, category (Books / Reference)
- [ ] Promotional text / what's new
- [ ] Age rating questionnaire

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
