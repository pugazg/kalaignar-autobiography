# Accessibility

Production-readiness Activity 3. A repository-side accessibility pass over the native app:
static inspection, concrete fixes, contrast measurement, and an honest record of what still
needs manual VoiceOver verification on a device.

> **Status: repository accessibility pass COMPLETE; manual VoiceOver verification pending.**
> This is not a claim of perfect accessibility. It is a claim that the code-level and
> simulator-verifiable issues found have been fixed, contrast is measured and meets WCAG AA
> for text, and the remaining gaps (real-device VoiceOver / TalkBack navigation) are documented
> rather than pretended-done.

## Scope

Audited every native screen — Home, Library, Volume, Reader, Search, Explore, Timeline, Saved,
Settings, Murasoli (Library / Volume / Reader), Themes (+ detail), People (+ detail), Places
(+ detail) — and the shared components: `T` (text), `Card`, `Pill`, `Eyebrow`, `Loading`,
`EmptyState` (`components/ui.tsx`), `ChapterRefs`, the navigation headers / tab bar / back
buttons, the reader control clusters, the Tamil/English toggles, and the theme tokens
(`theme/theme.ts`).

The app already shipped a meaningful accessibility baseline (labelled controls, roles, selected
state on toggles, `hitSlop` on icon buttons, `allowFontScaling` on all text). This pass closed
the remaining gaps rather than starting from zero.

## What was fixed in this activity

### A. Screen-reader semantics (labels, roles)
- Reader + Murasoli Reader font/line-height/theme controls (`Ctrl`): added
  `accessibilityRole="button"` (labels were already present and purpose-oriented — "Smaller
  text", "Larger text", "Line spacing", "Theme").
- Reader bookmark button: added `accessibilityRole="button"` (label already state-aware:
  "Bookmark" / "Remove bookmark").
- Tamil/English reader toggles: added an explicit `accessibilityLabel="Show English
  translation"` on top of the existing `role="switch"` + `state.checked`, so the control's
  purpose is spoken (the visible glyph shows the *current* language, which alone is ambiguous).
- Search clear button (was an **unlabelled** icon-only `close-circle`): added
  `accessibilityRole="button"` + `accessibilityLabel="Clear search"`. This was the one genuinely
  missing label found.
- Search result rows and recent-search rows: added `role="button"` + a descriptive label.
- Volume download toggle: added `role="button"` + `accessibilityState={{ busy }}` so the
  in-progress state is exposed (icon already changes: download → sync → checkmark).
- Header settings gear: added `role="button"`.

### B. Accessibility state
- Truthfully exposed state was already present on the theme selector (`selected`), language
  toggles (`checked`) and filter pills (`selected`). Added `busy` to the download control.
  State is never faked to change VoiceOver output.

### C. Heading semantics
- Added a `heading` prop to the shared `T` component (`accessibilityRole="header"`) and applied
  it to each screen's **primary title only** (Home, Library, Explore, Timeline, Settings,
  Themes, People, Places, Murasoli Library, and the Reader / Murasoli Reader chapter/letter
  titles, plus the Theme/Person/Place detail titles). Section kickers and eyebrows were left
  un-marked deliberately — not every label is a heading.

### E. Touch targets (~44×44 pt on iOS)
- Places schematic-map markers: `hitSlop` 10 → 16, giving the 12 pt dots a ~44 pt touch target
  without enlarging the visual marker. (The place **list** remains the authoritative accessible
  path — see J.)
- Reader bookmark: `hitSlop` 10 → 12 (~46 pt). Search clear: `hitSlop` 8 → 12.
- Existing icon buttons already met ~44 pt via padding + `hitSlop` (reader controls ~52 pt,
  volume download ~58 pt, settings steppers ~46 pt) and were left as-is. No visual icon was
  enlarged unnecessarily; padding / `hitSlop` was used, no new dependency added.

### F. Colour & contrast (measured, WCAG AA)
Contrast was calculated from the actual theme tokens (rgba composited over the theme
background), not eyeballed. The script lives outside the repo (scratch); the measured
before/after for every changed token is below. Only shared tokens that caused **repeated**
failures were touched; the palette identity (marina teal / brass / paper / sepia / night) is
preserved.

| Theme | Token | Before | After | Ratio before → after (on bg) | Threshold |
|---|---|---|---|---|---|
| light | `textFaint` | `rgba(15,23,32,0.45)` | `rgba(15,23,32,0.6)` | 2.9 → 4.6 | 4.5 (normal text) |
| light | `accent` (brass) | `#B98A2F` | `#8C6A1E` | 2.9 → 4.7 | 4.5 |
| sepia | `textMuted` | `rgba(59,47,30,0.68)` | `rgba(59,47,30,0.72)` | 4.4 → 4.9 | 4.5 |
| sepia | `textFaint` | `rgba(59,47,30,0.45)` | `rgba(59,47,30,0.7)` | 2.5 → 4.7 | 4.5 |
| sepia | `accent` (brass) | `#9A6E1F` | `#8C6318` | 3.9 → 4.6 | 4.5 |
| dark | `textFaint` | `rgba(237,231,219,0.45)` | `rgba(237,231,219,0.56)` | 3.9 → 5.4 | 4.5 |
| dark | `primary` (teal) | `#1B7F87` | `#2A98A1` | 4.0 → 5.5 | 4.5 |

After the changes, every text token meets **AA 4.5:1** on its common backgrounds (bg + surface)
in all three themes; `accent` as large display text (stat values ≥18 pt) on `surfaceAlt` meets
the 3:1 large-text bar (measured 4.0–5.0). `text`, `textMuted`, `primaryText`-on-`primary`,
and `primary` (light/sepia) already passed and were left unchanged.

**Borders** (`border` token, ~1.3:1) were intentionally **not** raised: they are decorative
card outlines / dividers, never the sole means of identifying a control (cards differ from the
background by surface colour and are pressable), so WCAG 1.4.11 does not require 3:1 here.
Raising them would flatten the calm reading aesthetic for no accessibility gain. Recorded as
DEFERRED / NON-BLOCKING.

### G. Colour-only communication
State is not conveyed by colour alone: selected theme / language / filter use
`accessibilityState` **and** a fill/label change; downloaded vs not uses a **different icon**
(checkmark vs download) plus colour; reading progress is a bar plus a spoken percentage on the
continue-reading card. No changes required.

### I / J. Images and the Places schematic map
- Chapter illustrations (Reader): kept a neutral, source-supported label ("Chapter
  illustration"). The archive ships **no** descriptive alt text for the historical
  sketches/photos, so no description was invented (per the regression boundary).
- Places map: the container is labelled as **schematic** ("relative positions, not to scale")
  with a matching caption — no GPS / cartographic wording. Every marker's label is the **real
  place name** (+ Tamil). Critically, the **list below the map is the authoritative accessible
  path**: every place is a full labelled button independent of the map, so a screen-reader user
  never depends on hitting a 12 pt dot. Marker hit targets were still enlarged (E).

### N. Motion / reduced motion
The app uses **no** custom animation (`grep` for `Animated` / `Reanimated` / `LayoutAnimation`
→ none). Only React Navigation's default screen transitions exist. No reduced-motion
infrastructure was added — there is nothing custom to gate. Recorded as PASS / not-applicable.

## Dynamic Type

- All text renders through the shared `T` component with `allowFontScaling` enabled (verified:
  **zero** `allowFontScaling={false}` in the codebase). Tamil (Noto Serif Tamil) and English
  both scale with the OS text-size / accessibility-text setting.
- No restrictive `maxFontSizeMultiplier` was added — layouts flex rather than capping text.
- The reader font-size control is independent of and composes with OS Dynamic Type.

**Simulator result (measured):** at the default size and up through `accessibility-medium`,
every screen tested handled scaling correctly — cards **grow** to fit, Tamil and English **wrap**
correctly, controls stay reachable, nothing clips. The **Reader** (the core reading surface)
reflows correctly at **all** sizes including `accessibility-extra-large` — the enlarged Tamil
title and body wrap cleanly with no clipping.

**Known limitation (DEFERRED / NON-BLOCKING):** at the **largest accessibility text sizes**
(`accessibility-extra-large` and above) the **Home / Explore dashboard** degrades — a long,
unbreakable Tamil display title (e.g. `நெஞ்சுக்கு நீதி`) can overflow the width and the
two-column quick-tiles clip their labels. This is confined to the dashboard shortcuts, which are
**fully duplicated** by the always-visible bottom tab bar and the Explore "Discover" rows, so no
destination becomes unreachable, and the reading experience itself is unaffected. Font scaling
was deliberately **not** capped to "fix" this (per the brief). The proper fix is a layout
enhancement — collapse the quick-tiles to a single column and cap the display-title point size
at extreme font scales via `PixelRatio.getFontScale()` — recorded as a follow-up, not done here
to keep this pass focused and low-risk.

## Per-category audit result

| Cat | Area | Result |
|---|---|---|
| A | Screen-reader labels/roles | FIXED IN THIS ACTIVITY (gaps closed; baseline was already strong) |
| B | Accessibility state | FIXED / PASS (added `busy`; others already correct) |
| C | Heading hierarchy | FIXED IN THIS ACTIVITY (`heading` prop on primary titles) |
| D | Dynamic Type / font scaling | PASS through standard + entry accessibility sizes (simulator-verified); dashboard tiles/long Tamil titles clip at the top accessibility sizes → DEFERRED / NON-BLOCKING (Reader reflows at all sizes) |
| E | Touch targets | FIXED IN THIS ACTIVITY (map markers; others already ≥44 pt) |
| F | Colour & contrast | FIXED IN THIS ACTIVITY (7 tokens; measured AA) |
| G | Colour-only communication | PASS |
| H | Focus / reading order | PASS (decorative rail/icons are non-focusable Views; cards are single stops) |
| I | Images / illustrations | PASS (neutral labels; no invented descriptions) |
| J | Places schematic map | FIXED / PASS (list is authoritative; markers labelled + enlarged) |
| K | Lists | PASS (FlatList; each row one labelled unit) |
| L | Loading / error states | PASS (indicator + readable label; retry controls labelled) |
| M | Reader controls | FIXED IN THIS ACTIVITY (roles + explicit toggle label) |
| N | Motion / reduced motion | PASS / N/A (no custom animation) |
| O | Orientation / large-text layout | PASS at common widths + standard/entry-accessibility text; extreme-size dashboard clip noted under D |
| P | Tamil accessibility | PASS (Unicode intact; scales & wraps; no transliteration) |

## Simulator verification

Device: iPhone 17 Pro, iOS 26.5 — native **SDK-57 debug build** (`expo run:ios`, **Build
Succeeded, 0 errors / 0 warnings** — the a11y changes did not disturb the clean Xcode-26 build).
Text size was driven with `xcrun simctl ui booted content_size <size>`.

- **Normal text size (default `large`):** Home, Explore, Themes list, Theme detail and the Reader
  all render correctly — darkened-brass eyebrows/accents are legibly darker, the previously-faint
  metadata lines are readable, Tamil renders in Noto Serif Tamil, layouts intact. Screens
  directly exercised on device; the remaining screens share the same audited components (`T`,
  `Card`, `Pill`, `ChapterRefs`, the reader controls) and token set.
- **Large accessibility text:** `accessibility-medium` — Explore's two-column tiles grow, all
  labels/subtitles wrap and stay fully visible, nothing clipped. `accessibility-extra-large` —
  the **Reader** reflows cleanly (title + body wrap, no clipping); the Home/Explore dashboard
  clips as documented under **Dynamic Type → Known limitation**.
- **Themes (light / sepia / dark):** all three verified in the Reader after the contrast-token
  changes — body, title and the faint metadata line are legible in every theme; sepia keeps its
  warm identity; dark's brighter teal and lighter faint text read cleanly on the night ground.
- **Navigation regression:** Home → Reader (recent chapter) and Back; bottom-tab switching
  (Home ↔ Explore); Explore → Themes → Theme detail; reader theme-cycle control — all worked,
  no crashes, scroll/position preserved. Feature deep-links (Theme/Timeline → Reader) use the
  same `nav.navigate("Reader", { id })` path exercised from Home recents.

## Known limitations / NEEDS MANUAL VOICEOVER VERIFICATION

The following require a human driving VoiceOver (iOS) / TalkBack (Android) on a device and were
**not performed in this activity** — no physical-device test was in scope:

- **End-to-end VoiceOver navigation** of each screen: swipe order, that every control is
  reachable and announces the intended label/role/state, and that focus lands sensibly after
  navigation. Static structure supports this, but only a real screen-reader pass confirms it.
- **Announcement quality** of the Tamil labels through the iOS Tamil voice.
- **TalkBack** pass on Android (not built/run in this activity).
- **Accessibility Inspector** deep audit (contrast/hit-region warnings) on a running build.

Recorded truthfully as **NEEDS MANUAL VOICEOVER VERIFICATION — not performed in this activity.**
This does not block the repository-side pass; no critical blocker was found.

## How contrast was measured

Ratios use the WCAG 2.x relative-luminance formula; semi-transparent tokens (`textMuted`,
`textFaint`, `border`) are first composited over the opaque theme background before the ratio is
computed (that is how they actually render). Normal text is held to 4.5:1, large text (≥18 pt or
≥14 pt bold) and meaningful non-text UI to 3:1.
