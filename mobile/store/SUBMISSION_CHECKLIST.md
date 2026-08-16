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
- [x] Clean raw iPhone 6.9" screenshots (1260×2736, no alpha): Home, Reader (Ta), Reader (En),
      Timeline, Explore, Murasoli — `screenshots/raw/iphone/`.
- [x] App icon technically valid (1024², opaque — no iOS alpha issue); splash configured.
- [x] Review notes draft (`REVIEW_NOTES.md`).
- [x] EAS build config + versioning present (from Activity 2: `eas.json`, `RELEASE.md`).

## Pending in repository (small, capturable later)
- [ ] `04-search.png` screenshot — needs a stable Tamil query seeded via Recent Searches (Tamil
      can't be typed in the simulator); method documented in `SCREENSHOT_PLAN.md`.
- [ ] Optional `08-reading-controls.png`.
- [ ] iPad screenshot set **OR** decide to scope tablet out (`ios.supportsTablet`) — see the
      iPad decision in `SCREENSHOT_PLAN.md`. Required because `supportsTablet: true`.
- [ ] Copyright field entity — **OWNER DECISION REQUIRED** (`metadata.en.md`).

## External / manual — required before submission (NOT done, NOT in scope here)
- [ ] Paid **Apple Developer Program** membership.
- [ ] App Store Connect **app record** created (bundle `org.nenjukkuneethi.app`).
- [ ] **EAS project init / login** (`eas init` → writes `extra.eas.projectId`) — not yet done.
- [ ] Signing & provisioning (Apple certificates / profiles).
- [ ] **Production / TestFlight build** via EAS, uploaded to App Store Connect.
- [ ] Upload screenshots (and iPad set if shipping iPad) to ASC.
- [ ] Enter App Privacy answers (from `PRIVACY_LABELS.md`).
- [ ] Complete the age-rating questionnaire (from `AGE_RATING.md`).
- [ ] Enter metadata (EN + TA) and the copyright field (once owner decides).
- [ ] Submit for review.

## Genuine remaining store blockers (strict)
1. Paid Apple Developer account + App Store Connect record + a signed TestFlight/production build.
2. iPad screenshots (or scoping tablet out) — gated by `supportsTablet: true`.
3. Copyright-field owner decision.

Everything else in the "Ready in repository" list is complete.
