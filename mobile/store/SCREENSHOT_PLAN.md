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
- **iPad screenshots are REQUIRED because `app.json` sets `ios.supportsTablet: true`.** Verified
  against Apple this session: the required class is **iPad 13"** — **2064 × 2752 portrait**
  (2752 × 2064 landscape). 12.9" (2048 × 2732) is an optional fallback; providing the **13" set
  alone is sufficient** (Apple scales down to other iPad sizes). 1–10 per class, no alpha.

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
| 4 | Search | light | Tamil | Query **`தமிழ்`** ("Tamil") → **215 results**; seeded via Recent Searches and tapped (Tamil can't be typed in the sim — see note) | top of results, matches highlighted | yes |
| 5 | Timeline | light | Tamil | Timeline (milestones) | top (1924 era) | yes |
| 6 | Explore | light | Tamil | Explore tab, Discover section visible | show Themes/People/Places rows | yes |
| 7 | Murasoli | light | Tamil | Explore → Murasoli → Library (7 volumes) | top | yes |
| 8 | Reader | light | Tamil | `v1-ch01`, controls row visible | top | yes |

**Search seeding note:** Tamil cannot be typed or pasted into the simulator (only ASCII via the
input tools; `simctl pbcopy` mangles UTF-8). To capture `04-search`, seed the query into the
app's AsyncStorage search-history key `nn:searchHistory` (value `["தமிழ்"]`) in the app data
container (`.../Library/Application Support/org.nenjukkuneethi.app/RCTAsyncLocalStorage_V1/manifest.json`),
relaunch, then tap it under RECENT SEARCHES. This is a **capture technique only** — no repo data
is changed and the sim state is ephemeral.

## iPad decision — RESOLVED (Activity 5): iPad is FIRST-RELEASE READY
Audited on an **iPad Pro 13" (M5)** simulator (see below). The only real iPad issue was the
Reader/prose spanning the full width (uncomfortable line length). A single **centered
`maxWidth: 720` content column** (shared `Screen` + the two readers + the raw-FlatList lists)
fixes it — a no-op on phones (viewport < 720), a pure iPad improvement. With that, every screen
is centered, coherent and readable on iPad. **`supportsTablet` was NOT changed.** Dedicated iPad
optimization (split-view / master-detail) is deliberately deferred — not needed for first
release. iPad screenshots are captured below.

## Capture status — COMPLETE
Clean marketing status bar (9:41), **light** theme, default Dynamic Type, from the SDK-57 build.
Alpha channel stripped (Apple requires none). All manually QA'd: no dev/debug chrome, no spinners,
no error states, correct theme, Tamil intact, correct manifest counts, no clipping, no resizing.

**iPhone — iPhone Air (6.9", native 1260 × 2736)** — 7 shots:
| File | Status |
|---|---|
| `screenshots/raw/iphone/01-home.png` | ✅ 1260×2736, no alpha |
| `screenshots/raw/iphone/02-reader-tamil.png` | ✅ |
| `screenshots/raw/iphone/03-reader-english.png` | ✅ |
| `screenshots/raw/iphone/04-search.png` | ✅ query `தமிழ்` → 215 results, matches highlighted |
| `screenshots/raw/iphone/05-timeline.png` | ✅ |
| `screenshots/raw/iphone/06-explore.png` | ✅ |
| `screenshots/raw/iphone/07-murasoli.png` | ✅ |

`08-reading-controls.png` — **intentionally skipped** (the Reader shots already show the controls
row; 7 strong shots tell a complete story — no need to pad to 8).

**iPad — iPad Pro 13" (M5), iPadOS 26 (native 2064 × 2752)** — 6 shots:
| File | Status |
|---|---|
| `screenshots/raw/ipad/01-home.png` | ✅ 2064×2752, no alpha |
| `screenshots/raw/ipad/02-reader-tamil.png` | ✅ centered reading column |
| `screenshots/raw/ipad/03-reader-english.png` | ✅ |
| `screenshots/raw/ipad/05-timeline.png` | ✅ |
| `screenshots/raw/ipad/06-explore.png` | ✅ |
| `screenshots/raw/ipad/07-murasoli.png` | ✅ |

(iPad `04-search` omitted — the iPhone search shot carries that story; parity is not required.)

No browser renders, no faked frames, no dishonest cropping, no unsupported dimensions. These are
raw assets; final store assets may be re-captured from a production/TestFlight build and, if
desired, given an external caption treatment (captions are **not** baked into the app).
