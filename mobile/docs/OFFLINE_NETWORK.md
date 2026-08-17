# Offline & network behaviour

Production-readiness Activity 6. Documents the app's offline model, the network-status
architecture added this activity, and how launch / retry / clear-offline behave. The goal was
truthful, predictable behaviour when the network disappears, when the app launches offline, and
when connectivity returns — **without** changing the existing offline architecture.

## The offline model (verified, pre-existing)

Content is fetched from a single origin (`nenjukkuneethi.org`) and cached to the app's document
directory. The data client (`src/data/client.ts`) is **offline-first for content** and
**network-first-with-cache-fallback for the manifest**:

- `fetchJSON(path, { offlineFirst: true })` — returns a cached copy immediately if present;
  otherwise fetches, caches, and returns; on any network/parse failure it falls back to cache,
  and only throws if there is no cache. Used for chapter text/English/visuals, feature datasets
  (timeline/themes/people/places), Murasoli index/letters, and the per-volume search index.
- `api.manifest()` — **not** offline-first: it tries the network first (to pick up new content),
  but on failure falls back to the cached manifest. So a previously-run app launches offline from
  its cached manifest.

What this means in practice (all confirmed this activity):

| Data | Offline behaviour |
|---|---|
| App manifest | Cached after first successful launch → **offline relaunch works** from cache |
| Read/downloaded chapter text + English | Cached on read/download → **reads offline** |
| Chapter illustration binaries | `downloadChapter` stores them under `content/img/` → **render offline** |
| Feature JSON (timeline/themes/people/places) | Cached on first open → **opens offline**; uncached → truthful error |
| Murasoli index / volume index / letter | Cached on open → **opens offline**; uncached letter → truthful error |
| Search index (per volume) | Cached on first search of that volume → **searchable offline** |
| Anything never fetched | Truthful "couldn't load / not downloaded" error with **Try again** |

There is **no** bulk-volume download manager, **no** global content-version update check, and
**no** raw Murasoli page browser — unchanged by this activity. Volume 54 remains the curated
36-letter model.

## Network-status architecture (new)

`src/data/network.tsx` — a single `NetworkProvider` holds one `@react-native-community/netinfo`
subscription (the package was installed but previously unused); screens/components read
`useNetworkStatus()`. Three states:

- `"unknown"` — NetInfo has not resolved yet (initial). **Never** treated as offline.
- `"offline"` — the device is *known* to have no connection (`isConnected === false`).
- `"online"` — the device reports a connection.

We flip to `"offline"` only on a definite `isConnected === false`. A reachable-but-no-internet
state or a **failing content server is not reported as "offline"** here — those are surfaced by
the screen that made the request (see *Error classification*). This keeps the global banner
truthful. It is device-local state only; nothing about connectivity is transmitted anywhere
(no analytics, no logging) — the App Store privacy worksheet remains valid ("Data Not Collected").

## Offline indicator (new)

`src/components/OfflineBanner.tsx`, rendered once at the app root above the navigator
(`App.tsx`). Shown **only** when status is `"offline"` (hidden while online or unknown, so it
never shifts layout otherwise).

- **Wording:** `Offline — downloaded & cached content is available` (truthful: does not imply the
  whole archive is offline-readable).
- **Placement:** the safe-area / status-bar zone stays in the theme background (OS clock/icons
  stay readable); the strip sits just below it. On iOS the native header's safe-area inset is
  position-aware, so pushing the navigator down creates **no gap and covers no header / Reader
  controls** (verified on the memoir Reader). The centered iPad `maxWidth: 720` column is
  preserved (the strip is full-width, content stays centred).
- **Themes:** strip background = the theme's text colour, text = the background colour — the same
  ratio as body text, ≥ WCAG AA in light / sepia / dark.
- **Dynamic Type:** the label scales (via the shared `T`); the strip grows with it.
- **Accessibility:** the strip is one accessible element with a label; the offline transition is
  announced to VoiceOver **once** (`AccessibilityInfo.announceForAccessibility`), not on every
  rerender; `accessibilityLiveRegion="polite"` (+ `role=alert` on Android).

When connectivity returns the banner simply disappears (component renders `null`) — no success
alert, no forced reload, no navigation/Reader-position change, no automatic re-download.

## Startup reliability fixes (client.ts)

Two narrow, genuine defects were fixed (nothing else in the working offline engine was changed):

1. **A failed/garbled refresh could clobber a good cache.** `writeCache` used to run *before*
   `JSON.parse`, so a `200` with a malformed/truncated body would overwrite a previously-valid
   cached copy (which then also failed to parse). Now the body is **parsed before it is written**
   — a bad response can never destroy good cache; the app falls back to the good cache instead.
2. **No request timeout → startup could hang** on a stalled/captive connection. Requests now
   abort after 12s (`AbortController`) and fall back to cache where available, so launch never
   hangs indefinitely.

`AppState` startup already resolved to `ready` or `error` (never an infinite spinner) and offers
`reload` for retry — preserved.

## Retry semantics (audited + extended)

Retry is now available on every content-failure surface (previously several dead-ended until app
relaunch):

- Manifest/startup failure → Library/Timeline "Try again" (`AppState.reload`). *(pre-existing)*
- Feature failure (Themes / People / Places) → "Try again" via a new `reload` on `useFeature`. *(new)*
- Murasoli Library / Volume / Reader failure → "Try again" (re-runs the loader). *(new)*
- Memoir Reader content failure → "Try again". *(new)*
- Search per-volume failure → "Retry". *(pre-existing)*

Retry bumps a nonce that re-runs the fetch effect — one meaningful new attempt, no infinite
auto-retry, no duplicate concurrent requests (each screen guards with an `alive` flag).

## Error classification

The global banner reports **device-offline** only. A screen whose request fails while the device
is online (server down, DNS failure, malformed data) shows its own truthful "couldn't load …
check your connection and try again" state with a retry — it does **not** claim "You're offline".
Verified: with the device online but the content origin unreachable, no banner appeared and the
failing screen showed its own error + retry, while cached screens kept working.

## Clear offline data (Settings)

`Settings → Storage → Clear` calls `api.clearOfflineContent()`, which:

- deletes the entire `content/` cache directory (all cached JSON **and** downloaded image
  binaries),
- clears the download registry and the image-cache map.

It does **not** touch reading preferences, bookmarks, reading progress, recent-search history or
recents — those live under separate `AsyncStorage` keys and are intentionally preserved. After
clearing, the storage total reads "Nothing downloaded" and content re-fetches (and re-caches) on
next open when online. Scope was not broadened in this activity.

## Storage count

`Settings → Storage → Offline content` sums the download registry's byte counts (an exact figure
without walking the cache dir). It reflects downloads and returns to zero after Clear. A detailed
per-item storage breakdown is intentionally **not** built here (optional later polish).

## Simulator test matrix (this activity)

Device: iPhone Air (6.9") + iPad Pro 13", iOS/iPadOS 26, SDK-57 build via Metro. **Network
method:** for content-origin failure, the content origin was pointed at an unresolvable host
(`*.invalid`, DNS failure) while Metro stayed on `localhost` — this tests the *content origin*
going away, distinct from Metro. The offline banner (NetInfo-driven) was verified by forcing the
provider's state; a live device airplane-mode toggle was **not** performed (see limitations).

| # | Scenario | Result |
|---|---|---|
| 1 | Normal online launch | PASS — Home/Library/Reader load; **no** banner |
| 2 | Online → offline (forced) | PASS — banner appears; screen stays usable; no crash/alert-storm |
| 3 | Offline → online | PASS — banner disappears; no forced reload; Reader position kept |
| 4 | Launch offline after prior use | PASS — launches from **cached manifest**; full Home |
| 5 | Uncached content offline | PASS — truthful "couldn't open … / not downloaded" + Try again |
| 6 | Uncached Murasoli letter offline | Truthful error + Try again (same code path as memoir Reader; retry added) |
| 7 | Downloaded/cached memoir offline | PASS — cached chapter body (+ English) opens with origin unreachable |
| 8 | Search offline | Local per-volume index → searches volumes searched before (offline); Murasoli is not part of memoir search |
| 9 | Clear offline data | Removes cache + downloads; preferences/bookmarks/progress preserved; count → zero |
| 10 | First-use / no-cache offline | PASS — no crash, no endless spinner; truthful error state with retry (`AppState` → "error") |
| — | Offline banner on Reader | PASS — sits above the Back/bookmark/font/theme controls; covers nothing |
| — | iPad + banner | PASS — full-width strip; centred 720 column preserved |

## Known limitations

- **Live NetInfo transition** (real airplane-mode on/off) was not exercised in this headless
  environment; the banner's *rendering / placement / theme / accessibility* were verified by
  forcing the provider state, and the *NetInfo → status* mapping is a small, reviewed function.
  Recommend a quick manual airplane-mode toggle on a device before release.
- **Reachable-but-no-internet** (connected to a network with no real internet) is treated as
  "online" (banner hidden); the failing request surfaces a per-screen error. This is deliberate
  (avoids false "offline") but means the banner won't show in that specific state.
- The **extreme-Dynamic-Type dashboard clipping** (Activity 3/5) is **unchanged** — not addressed
  here.
- **iPad landscape** remains a documented manual follow-up.
