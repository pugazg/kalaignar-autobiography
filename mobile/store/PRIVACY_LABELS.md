# App Privacy "nutrition label" worksheet

For the App Store Connect **App Privacy** section. Derived from the current code, and consistent
with the published Privacy Policy (`/privacy`). Prepared so it can be entered into ASC without
re-auditing the codebase.

## Evidence (from the code, this session)
- **No accounts / auth / profile** — nothing to sign into; no user identity.
- **No analytics / ads / tracking / crash SDKs** — `grep` for sentry/firebase/analytics/
  segment/amplitude/mixpanel/facebook/admob/appsflyer/adjust → **none**.
- **No advertising, no cross-app tracking** (no ATT prompt; nothing to track).
- **No device-sensitive permissions** — no Camera / Photos / Microphone / Contacts / device
  Location / Health / Media Library usage in code. (The "Places" feature is the memoir's own
  schematic geography, not device GPS.)
- **Local-only storage** — preferences, bookmarks, reading progress, recents, download registry
  and cached content live on-device via `AsyncStorage` + `expo-file-system`. Not transmitted.
- **Network** — the app fetches **static content** (manifest, chapter text, translations, search
  indexes, images, Murasoli letters) over HTTPS from a single origin, `nenjukkuneethi.org`.
- **Share** — the OS share sheet is user-initiated; the app hands text to the system, collects
  nothing back.
- **Notifications** — `expo-notifications` is present as a plugin but has **zero code usage**;
  no push token is requested, none are sent. Inactive.

## Recommended answer: **Data Not Collected**

Under Apple's definition, "Data Not Collected" means the developer (and its third-party partners
acting on the developer's behalf) does not collect any data from the app. That holds here: the
app transmits no user or device data to the developer; all personal state is on-device.

### The one nuance to record (and confirm)
The content is served from a normal web host (Vercel). Like any website, the host processes
**routine request metadata** (e.g. IP address, timestamp, user-agent) to deliver bytes and for
security/operational logging. Apple's guidance treats this differently from app "data
collection" when it is:
- not linked to the user's identity, **and**
- not used for tracking, advertising, or analytics about the user.

Neither the app nor the developer uses this metadata for tracking/analytics/advertising, and it
is not associated with a user identity — so **Data Not Collected** is the honest, supportable
answer. Record this reasoning in ASC; if a stricter internal reading is preferred, the only
category that could conceivably be declared is **Diagnostics → not linked to you, not used for
tracking**, but the routine-hosting exemption makes "Data Not Collected" appropriate.

## Per-category worksheet (all **No** unless noted)
| Data type | Collected? | Notes |
|---|---|---|
| Contact info (name, email, phone, address) | No | No accounts |
| Health & Fitness | No | — |
| Financial info | No | No purchases/payments |
| Location (precise or coarse) | No | No device location; "Places" = memoir geography |
| Sensitive info | No | — |
| Contacts | No | — |
| User content (photos, audio, customer support, other) | No | Bookmarks/notes are local-only |
| Browsing history | No | — |
| Search history | No | Search history is stored **on-device only**, never sent |
| Identifiers (user ID, device ID) | No | None assigned or transmitted |
| Purchases | No | No IAP/commerce |
| Usage data (product interaction, ads) | No | No analytics |
| Diagnostics (crash, performance) | No | No crash/telemetry SDK |
| Other data | No | — |

**Tracking (ATT):** the app does **not** track. No `NSUserTrackingUsageDescription` / ATT prompt
is needed.

## Also verify at submission
- Re-confirm no analytics/crash SDK was added after this date.
- Confirm the "Data Not Collected" choice still matches the live Privacy Policy wording.
