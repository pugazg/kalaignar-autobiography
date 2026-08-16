# App Store submission checklist

Separates what is **ready in this repository** from **external/manual** work that must happen in
App Store Connect / with a paid Apple account. Nothing here submits anything to Apple.

## Ready in repository (this activity)
- [x] Canonical app identity documented (`app.json`): name **Nenjukku Neethi**, bundle/package
      **org.nenjukkuneethi.app**, version **0.1.0**, iOS build **1**, Android versionCode **1**.
- [x] English metadata — name, subtitle, promo, description, keywords, category, copyright note,
      URLs (`metadata.en.md`), all within Apple limits (Name/Subtitle 30 verified; Desc 4000 /
      Keywords 100 / Promo 170 are standard limits — reconfirm in ASC).
- [x] Tamil metadata — full localization (`metadata.ta.md`); Tamil is a supported App Store
      localization. Lengths kept short; **verify Tamil character/byte counts in ASC**.
- [x] Keyword candidate string (EN, 94 chars) + rules noted.
- [x] Category recommendation: **Books** (primary) / **Reference** (secondary).
- [x] Age-rating worksheet (`AGE_RATING.md`) — answers + reasoning; ASC computes the number.
- [x] App Privacy worksheet (`PRIVACY_LABELS.md`) — recommend **Data Not Collected**.
- [x] Listing URLs verified 200: `/privacy`, `/support`, site home.
- [x] Screenshot story + capture plan + reproducible state (`SCREENSHOT_PLAN.md`).
- [x] Clean raw **iPhone 6.9"** screenshots (1260×2736, no alpha) — **7**: Home, Reader (Ta),
      Reader (En), **Search** (`தமிழ்` → 215 results), Timeline, Explore, Murasoli
      — `screenshots/raw/iphone/`.
- [x] Clean raw **iPad 13"** screenshots (2064×2752, no alpha) — **6**: Home, Reader (Ta),
      Reader (En), Timeline, Explore, Murasoli — `screenshots/raw/ipad/` (Activity 5).
- [x] **iPad first-release readiness** — audited on iPad Pro 13"; a centered `maxWidth: 720`
      content column added (phones unaffected); `supportsTablet` kept `true`. See `SCREENSHOT_PLAN.md`.
- [x] App icon technically valid (1024², opaque — no iOS alpha issue); splash configured.
- [x] Review notes draft (`REVIEW_NOTES.md`).
- [x] EAS build config + versioning present (from Activity 2: `eas.json`, `RELEASE.md`).

## Pending in repository (small)
- [x] `04-search.png` — captured (`தமிழ்` → 215 results). (Activity 5)
- [x] iPad screenshots + first-release readiness decision — done (Activity 5); `supportsTablet`
      unchanged. `08-reading-controls.png` intentionally skipped (redundant).
- [ ] **Landscape** on iPad — orientation is `default` (landscape allowed); the centered-column
      design handles it, but a landscape pass could not be exercised this session (Simulator
      rotation automation is not authorized). Recommend a manual landscape check before submission
      (non-blocking).
- [ ] Copyright field entity — **OWNER DECISION REQUIRED** (`metadata.en.md`); not resolved
      (no owner/entity supplied).

## External / manual — required before submission (NOT done, NOT in scope here)
- [ ] Paid **Apple Developer Program** membership.
- [ ] App Store Connect **app record** created (bundle `org.nenjukkuneethi.app`).
- [ ] **EAS project init / login** (`eas init` → writes `extra.eas.projectId`) — not yet done.
- [ ] Signing & provisioning (Apple certificates / profiles).
- [ ] **Production / TestFlight build** via EAS, uploaded to App Store Connect.
- [ ] Upload screenshots (iPhone 6.9" **and** iPad 13" sets) to ASC.
- [ ] Enter App Privacy answers (from `PRIVACY_LABELS.md`).
- [ ] Complete the age-rating questionnaire (from `AGE_RATING.md`).
- [ ] Enter metadata (EN + TA) and the copyright field (once owner decides).
- [ ] Submit for review.

## Genuine remaining store blockers (strict)
1. Paid Apple Developer account + App Store Connect record + a signed TestFlight/production build.
2. Copyright-field owner decision.

(iPad screenshots — previously a blocker — are now captured; tablet readiness is resolved.)
Everything else in the "Ready in repository" list is complete.
