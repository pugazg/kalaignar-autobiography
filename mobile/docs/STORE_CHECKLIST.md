# Store submission checklist

Gate list before App Store / Play submission. Unchecked = do not submit.

## App identity

- [x] App name: **Nenjukku Neethi** (`app.json → expo.name`)
- [x] Bundle id / package: `org.nenjukkuneethi.app` (iOS + Android)
- [x] Icon (1024²), adaptive icon, splash — from the brand vector
- [ ] Final version / build numbers bumped (`expo.version`, EAS `autoIncrement`)

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

- [x] Dynamic Type via `allowFontScaling`
- [x] Accessibility labels on interactive controls
- [ ] VoiceOver / TalkBack pass
- [ ] Contrast check across light / sepia / dark

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

- [ ] `npm run typecheck` clean
- [ ] `npm run validate:manifest` passes
- [ ] EAS production build (iOS + Android) succeeds
- [ ] Android internal-testing track green
- [ ] iOS TestFlight build accepted
- [ ] Crash reporting wired (or a conscious decision to defer)
