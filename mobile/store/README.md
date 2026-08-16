# App Store listing package — Nenjukku Neethi

Production-readiness **Activity 4**: the complete repository-side App Store listing package.
**Preparation only — nothing here is submitted to App Store Connect.** No login, no upload, no
build, no TestFlight, no signing, no EAS project init.

## Canonical app identity (from `mobile/app.json`)
| Field | Value |
|---|---|
| App display name / Expo name | **Nenjukku Neethi** |
| Slug | `nenjukku-neethi` |
| URL scheme | `nenjukkuneethi` |
| iOS bundle identifier | `org.nenjukkuneethi.app` |
| Android package | `org.nenjukkuneethi.app` |
| Marketing version (`expo.version`) | `0.1.0` |
| iOS build number | `1` |
| Android versionCode | `1` |

Not renamed. The name is both the configured identity and the memoir's own title.

## Contents
| File | What |
|---|---|
| [`metadata.en.md`](metadata.en.md) | English listing — name, subtitle, promo, description, keywords, category, copyright, URLs |
| [`metadata.ta.md`](metadata.ta.md) | Tamil localization (Tamil is a supported App Store storefront language) |
| [`PRIVACY_LABELS.md`](PRIVACY_LABELS.md) | App Privacy "nutrition label" worksheet → **Data Not Collected** |
| [`AGE_RATING.md`](AGE_RATING.md) | Age-rating questionnaire worksheet (ASC computes the number) |
| [`REVIEW_NOTES.md`](REVIEW_NOTES.md) | App Review notes draft |
| [`SCREENSHOT_PLAN.md`](SCREENSHOT_PLAN.md) | Screenshot story, captions (EN/TA), capture specs & reproducible state |
| [`SUBMISSION_CHECKLIST.md`](SUBMISSION_CHECKLIST.md) | Repo-ready vs external/manual work |
| [`screenshots/raw/iphone/`](screenshots/raw/iphone/) | Clean raw 6.9" iPhone screenshots (1260×2736, no alpha) |

## Verified requirements (Apple primary sources, this session)
- Name/Subtitle limits = **30** chars each.
- Tamil **is** a supported App Store localization → full Tamil listing prepared.
- Keyword field = **100** chars (byte-counted; Tamil is byte-expensive).
- iPhone **6.9" screenshots required** (1260×2736 accepted); **iPad screenshots required**
  because `ios.supportsTablet: true` — a real gate (see the screenshot plan).
- Description (4000) / Promo (170) are the long-standing limits — reconfirm in ASC.

## Key open decisions
- **Copyright field entity** — OWNER DECISION REQUIRED (app/edition © vs source-works ©).
- **iPad** — ship an iPad screenshot set, or scope tablet out (release-config change, done
  elsewhere, not here).

This package is designed so the listing can be entered into App Store Connect later without
re-auditing the code or re-deriving the copy.
