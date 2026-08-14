# Build & run

Expo SDK ~57 / React Native 0.86 / React 19.2.3. **Node ≥ 22.13** (required by
SDK 57). No global `expo` needed — use `npx`. Install uses `.npmrc`
(`legacy-peer-deps=true`) — RN's peer graph otherwise fails npm's ERESOLVE.

> Upgraded from SDK 52 on the `mobile/expo-sdk-upgrade` branch (2026-08-11).
> See **[Expo SDK 52 → 57 upgrade](#expo-sdk-52--57-upgrade-2026-08-11)** below.

## 1. Install

```bash
cd mobile
npm install
# if dependency versions clash with the installed Expo SDK:
npx expo install --fix
```

## 2. Run in development

**Simulator / emulator (recommended for day-to-day dev):**

```bash
npx expo start          # Metro
#   press i → iOS simulator, a → Android emulator, w → web
```

**Physical iPhone / Android:** use an Expo **development build**, not Expo Go. The
App Store / Play Expo Go tracks a newer Expo SDK and may refuse to load this
project (SDK ~57). Build a dev client once and install it on the device:

```bash
eas build --profile development --platform ios      # or: android
# install the resulting build on the device, then:
npx expo start --dev-client                          # connects the device to Metro
```

(Requires the EAS setup in §4. `expo run:ios --device` / `expo run:android` also
produce an installable dev build if you have the native toolchain locally.)

The app fetches its manifest from `https://nenjukkuneethi.org` by default; point
at a local site build by overriding `expo.extra.origin` in `app.json`.

## 3. Type-check & validate

```bash
npm run typecheck            # tsc --noEmit
npm run validate:manifest    # AJV check of ../public/data/app/manifest.v1.json
```

## 4. Native / store builds (EAS)

Uses [EAS Build](https://docs.expo.dev/build/introduction/). One-time setup:

```bash
npm i -g eas-cli     # or use npx
eas login
eas build:configure  # creates eas.json (not committed yet — see below)
```

Suggested `eas.json` profiles:

```jsonc
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview":     { "distribution": "internal" },              // APK / ad-hoc
    "production":  { "autoIncrement": true }                    // AAB / App Store
  },
  "submit": { "production": {} }
}
```

### Android — internal testing

```bash
eas build --platform android --profile preview      # installable APK for testers
eas build --platform android --profile production   # AAB for Play
eas submit --platform android --latest              # upload to Play (needs service-account key)
```

### iOS — TestFlight

```bash
eas build --platform ios --profile production       # needs an Apple Developer account
eas submit --platform ios --latest                  # upload to App Store Connect → TestFlight
```

Requires an Apple Developer Program membership and an App Store Connect app
record with bundle id `org.nenjukkuneethi.app` (already set in `app.json`).

## 5. Universal links

`app.json` declares iOS `associatedDomains` (`applinks:nenjukkuneethi.org`) and
an Android App Links intent filter. For real verification the **website** must
serve:

- `https://nenjukkuneethi.org/.well-known/apple-app-site-association`
- `https://nenjukkuneethi.org/.well-known/assetlinks.json`

(See ROADMAP — not yet added to the site.)

## Expo SDK 52 → 57 upgrade (2026-08-11)

Done on branch `mobile/expo-sdk-upgrade` (branched from clean `main`), **one SDK
major at a time** per Expo's guidance, running the full gate after every step
(`expo install --fix` → `expo-doctor` → `typecheck` → `validate:manifest` →
`expo export --platform ios`).

| | before | after |
|---|---|---|
| Expo SDK | ~52.0 | ~57.0 |
| React Native | 0.76.9 | 0.86.2 |
| React | 18.3.1 | 19.2.3 |
| Node (min) | 18 | **22.13** |

Notable dependency bumps (via `expo install --fix`): `@react-native-async-storage/async-storage`
1→2, `react-native-safe-area-context` 4→5, `expo-system-ui` 4→5, `@types/react`
18→19, plus every `expo-*` package and React Navigation aligned to SDK 57.

### Migration issues fixed (in commit order)
- **`.npmrc` `legacy-peer-deps=true`** — RN's strict peer graph fails npm's
  ERESOLVE otherwise; also keeps CI `npm ci` consistent.
- **`expo-file-system/legacy`** — SDK 54 redesigned it to a `File`/`Directory`
  class API. `src/data/client.ts` (the offline engine) imports the preserved
  functional API from `/legacy`; behaviour is unchanged (a rewrite to the new
  API is deliberately out of scope).
- **`expo export --output-dir`** — SDK 53+ rejects paths outside the project;
  the gate + CI now export to the gitignored `dist/`.
- **`app.json` splash** — SDK 56 forbids the top-level `splash` key; moved into
  the `expo-splash-screen` plugin config.
- **`tsconfig.json`** — dropped the deprecated `baseUrl`; the `@/*` path is now
  relative (`./src/*`).
- **CI Node 20 → 22** (`.github/workflows/mobile-ci.yml`).
- New Architecture is default-on from SDK 54; React 18→19 caused no type fallout.

### The Xcode-26 `fmt`/`consteval` failure is GONE
The whole point of the upgrade. The SDK-52 native build failed on Xcode 26 with
`fmt`'s `consteval` error and needed a temporary local `fmt/base.h` patch (see
git history of this file / the physical-device branch). **On SDK 57 the freshly
prebuilt native project compiles cleanly on Xcode 26.6 with NO `fmt` patch and no
manual `node_modules`/`Pods` edits** — verified by a full `npx expo run:ios`
(prebuild → pod install → `Build Succeeded`), then run on an iOS 26 simulator.

### Verification status

```
Typecheck:                                     PASS
Manifest validation:                           PASS
Expo Doctor:                                   PASS   (21/21)
iOS export:                                    PASS
Xcode 26 clean native build:                   PASS   (no fmt patch)
iOS simulator core-flow verification:          PASS
GitHub Mobile CI:                              PASS   (PR #3)
Increment-1 physical-iPhone verify (SDK 52):   PASS
SDK-57 physical-device re-test:                NOT PERFORMED — waived by user
```

- **Simulator (iOS 26):** app launches; Library shows all 6 memoir volumes; Tamil
  Reader renders; inline illustrations render; font controls work; theme
  switch/persist works; Search screen renders. (Live network search results and
  offline download were network-limited in the simulator and were not fully
  exercised there — not overstated as verified.)
- **SDK-57 physical-device re-test:** **NOT PERFORMED — waived by user.** Increment 1
  was already physically verified on an iPhone 15 Pro on SDK 52; the SDK-57 upgrade
  itself is verified by the clean Xcode 26 native build + simulator + the CI gate
  above. This is a deliberate project decision, **not** an unresolved blocker.

## Notes

- `index.ts` registers `App.tsx` via `registerRootComponent`.
- Fonts (Noto Serif Tamil) load at runtime through `@expo-google-fonts/noto-serif-tamil`;
  the native splash stays up until they're ready.
- `assets/` icon/splash/adaptive-icon are generated by `assets/generate-assets.py`
  from the site's `app/icon.svg`.
