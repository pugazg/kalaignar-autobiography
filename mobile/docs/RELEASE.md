# Release engineering

Production-readiness Activity 2. Covers the EAS build configuration, the version /
build-number strategy, and the export-compliance declaration. This is the repo-side work
that makes the app **buildable and submittable**; the actual TestFlight build additionally
needs a **paid Apple Developer account** (external prerequisite — see below).

## Build profiles (`eas.json`)

`appVersionSource` is **`local`** — the marketing version and native build numbers live in
`app.json` and are versioned in git, so builds are reproducible and don't depend on EAS
server-side counters or a logged-in account. (Switch to `remote` later if we'd rather have
EAS/App Store Connect own the build number.)

| Profile | Purpose | Distribution | Notes |
|---|---|---|---|
| `development` | Local dev client | `internal` | `ios.simulator: true` — builds & runs on the iOS Simulator with **no signing / no paid account** |
| `preview` | Internal test build on real devices | `internal` | Ad-hoc / TestFlight-internal; needs a signing team |
| `production` | Store build | store | `autoIncrement: true` — bumps the native build number per build |

`submit.production` is present as a placeholder for `eas submit` (App Store Connect / Play
credentials get filled in once the account exists).

## Version / build-number strategy

- **`expo.version`** (`0.1.0`) — the human-facing marketing version (`CFBundleShortVersionString`
  / Android `versionName`). Bump manually per release (e.g. `0.1.0` → `0.2.0` → `1.0.0`).
- **`ios.buildNumber`** (`"1"`) and **`android.versionCode`** (`1`) — the per-upload build
  identifiers. Seeded at `1`; with `production.autoIncrement` EAS increments them on each
  production build. Each store upload must have a build number strictly greater than the last.

## Export compliance

`ios.infoPlist.ITSAppUsesNonExemptEncryption: false`. The app only uses standard HTTPS
(exempt encryption) — it ships no proprietary/non-standard crypto — so this declares the app
exempt and removes the per-upload encryption question in App Store Connect.

## External prerequisite (not repo work)

A **paid Apple Developer Program membership** ($99/yr) + App Store Connect access is required
to: create the signing team, run `eas build --profile preview/production` for devices, and push
to TestFlight. Until then, `development` (simulator) builds work locally. When the account is
ready: `eas login`, then `eas init` (writes `extra.eas.projectId` into `app.json`), then
`eas build --platform ios --profile preview`.

## Verified (repo gate)

`npm run typecheck` · `npm run validate:manifest` · `npx expo-doctor` · `npx expo export --platform ios`,
plus the website `npm run build`.
