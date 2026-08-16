# App Store screenshot plan

The app has a strong visual identity (marina teal / brass / paper, Noto Serif Tamil). Prefer
**clean native screenshots**; captions, if used, are applied **externally** (never baked into the
app UI). Counts in captions come from the live app manifest (`manifest.v1.json`): **6 volumes ·
391 chapters · 4,234 pages · 1924–2005**, and **346 Murasoli letters across 7 volumes**;
Explore has **6 themes · 15 people · 10 places**; Timeline has **42 milestones**. Do not hardcode
stale counts — re-read the manifest if the archive grows.

## Requirements (verified against Apple, this session)
- **iPhone 6.9" is required** if the app runs on iPhone. Accepted portrait pixel sizes:
  **1260 × 2736** (iPhone Air / 17 Pro Max class), 1290 × 2796, or 1320 × 2868. One set at a
  6.9" size satisfies the iPhone requirement (Apple down-scales to smaller iPhones).
- 6.5" (1284 × 2778) is only needed if no 6.9" set is provided.
- **1 to 10** screenshots per device class. Formats **.png / .jpg**. **No alpha / transparency.**
- **iPad screenshots are REQUIRED because `app.json` sets `ios.supportsTablet: true`** (13"
  2064 × 2752 or 12.9" 2048 × 2732). See "iPad decision" below — this is a real gate.

## Recommended device & capture settings
- **Simulator:** **iPhone Air** (6.9", native **1260 × 2736** — an accepted size, so no resize).
  iPhone 17 Pro Max (1320 × 2868) also works. Do **not** use iPhone 17 Pro (6.3", 1206 × 2622) —
  wrong class.
- **Orientation:** portrait.
- **Theme:** **light (paper)** for the primary set — it is the app's signature look and reads
  best in the grid. Optionally capture one or two in **dark** for variety; keep a set internally
  consistent.
- **Dynamic Type:** default (`large`). Do not use enlarged accessibility sizes for store shots.
- **Status bar:** set a clean marketing status bar before capture:
  `xcrun simctl status_bar <udid> override --time "9:41" --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3`
- **No dev chrome:** capture the release-style UI only — no Metro overlay, no dev menu, no
  redbox/yellowbox, no loading spinners, no network-error states.
- **Language/content state:** Tamil-first content (the app is Tamil-primary); show the English
  toggle on the dedicated English shot.

## Screenshot story (sequence)
Order leads with the strongest value; the set should read even without captions.

| # | File | Screen | State |
|---|---|---|---|
| 1 | `01-home.png` | Home | Archive overview: title, quick tiles, "Recently read", the counts line |
| 2 | `02-reader-tamil.png` | Reader | A strong chapter in Tamil (e.g. `v1-ch01` "பிறந்த ஆண்டு"), scrolled to show title + body |
| 3 | `03-reader-english.png` | Reader | Same chapter with the **English** toggle on |
| 4 | `04-search.png` | Search | Results for a stable Tamil term (see capture state) |
| 5 | `05-timeline.png` | Timeline | Milestones grouped by era (top of list, 1924 onward) |
| 6 | `06-explore.png` | Explore | Discover: Themes / People / Places (+ Murasoli) |
| 7 | `07-murasoli.png` | Murasoli | Library (7 volumes) or a letter in the reader |
| 8 (optional) | `08-reading-controls.png` | Reader | Controls row visible (text size / spacing / theme / Ta·En) to show reading + offline story |

## Captions (external overlay — English)
Factual; use real counts.
1. `Six volumes. One life, in his own words.`
2. `Read in the original Tamil.`
3. `Or in English, side by side.`
4. `Search all 391 chapters.`
5. `Follow the timeline: 1924–2005.`
6. `Explore themes, people and places.`
7. `346 Murasoli letters, read natively.`
8. `Yours offline — with bookmarks and progress.`

## Captions (external overlay — Tamil)
1. `ஆறு தொகுதிகள். ஒரு வாழ்க்கை, அவரது சொற்களில்.`
2. `மூல தமிழில் படியுங்கள்.`
3. `அல்லது ஆங்கிலத்தில், அருகருகே.`
4. `391 அத்தியாயங்களிலும் தேடுங்கள்.`
5. `காலக்கோடு: 1924–2005.`
6. `கருப்பொருள், மனிதர்கள், இடங்கள்.`
7. `346 முரசொலி கடிதங்கள், பூர்வீகமாக.`
8. `ஆஃப்லைனில் — குறிப்புகளுடன், வாசிப்பு நிலையுடன்.`

## Reproducible capture state (per shot)
Use **stable source content** (no personal/random data). Network is required for first load of
each screen (the app fetches from nenjukkuneethi.org), then content is cached.

| # | Screen | Theme | Lang | Exact item / state | Scroll | Network |
|---|---|---|---|---|---|---|
| 1 | Home | light | Tamil | Fresh Home; a "Recently read" list present (open a couple of chapters first so it isn't empty) | top | yes (first load) |
| 2 | Reader | light | Tamil | Volume 1 → `v1-ch01` "பிறந்த ஆண்டு" | title + first paragraphs | yes |
| 3 | Reader | light | English | Same `v1-ch01`, English toggle ON | title + first paragraphs | yes |
| 4 | Search | light | Tamil | Query a stable common term seeded via Recent Searches (Tamil can't be typed in the sim) — e.g. `தந்தை` — submit and show results | top of results | yes |
| 5 | Timeline | light | Tamil | Timeline (milestones) | top (1924 era) | yes |
| 6 | Explore | light | Tamil | Explore tab, Discover section visible | show Themes/People/Places rows | yes |
| 7 | Murasoli | light | Tamil | Explore → Murasoli → Library (7 volumes) | top | yes |
| 8 | Reader | light | Tamil | `v1-ch01`, controls row visible | top | yes |

Controls to hide/show: none are debug; keep the standard reader controls visible for shot 8.

## iPad decision (REQUIRED before submission)  — OWNER/SCOPE DECISION
`ios.supportsTablet: true` means Apple reviews on iPad and **requires an iPad screenshot set**.
Two clean options — pick one before submission (do not change config in this activity):
1. **Ship iPad support:** also capture a 13" (2064 × 2752) or 12.9" (2048 × 2732) set. The app
   runs on iPad but is not iPad-optimised (no split-view / max-width), so review on a large
   canvas is acceptable but not ideal.
2. **Scope tablet out for v1:** set `ios.supportsTablet: false` (a one-line release-config change,
   done in a separate release-eng change, **not** here) — then only the iPhone set is required.

Recommendation: **defer to owner.** If a fast first submission is the goal, option 2 removes the
iPad asset burden; if iPad is a launch target, option 1.

## Capture status
Captured this session on **iPhone Air** (6.9", native **1260 × 2736**), clean marketing status
bar (9:41), light theme, from the SDK-57 build. Alpha channel stripped (Apple requires none).
All manually QA'd: no dev/debug chrome, no spinners, no error states, correct theme, Tamil intact,
correct manifest counts, no clipping, no resizing.

| File | Status |
|---|---|
| `screenshots/raw/iphone/01-home.png` | ✅ 1260×2736, no alpha |
| `screenshots/raw/iphone/02-reader-tamil.png` | ✅ |
| `screenshots/raw/iphone/03-reader-english.png` | ✅ |
| `screenshots/raw/iphone/05-timeline.png` | ✅ |
| `screenshots/raw/iphone/06-explore.png` | ✅ |
| `screenshots/raw/iphone/07-murasoli.png` | ✅ |
| `04-search.png` | ⏳ pending — needs a stable Tamil query seeded via Recent Searches (Tamil can't be typed in the sim) |
| `08-reading-controls.png` | ⏳ optional, pending |
| **iPad set** | ⏳ pending decision (required by `supportsTablet: true`) |

No browser renders, no faked frames, no dishonest cropping, no unsupported dimensions. These are
raw assets; final store assets may be re-captured from a production/TestFlight build and, if
desired, given an external caption treatment (captions are **not** baked into the app).
