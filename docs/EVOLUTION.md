# From Storytelling Site to Kalaignar Digital Library
## Evolution review & implementation record

### 1 · UX review → what changed
The site told a story well but ended at the story. The evolution adds the museum's other rooms while
preserving the visual identity untouched: a **Reading Room** (`/read`) holding all 391 chapters in
original Tamil with bookmarks, position memory, font control and per-chapter citation; a **Journey**
map giving the narrative its geography; a **People** archive giving it its cast; and a site-wide
**Research Mode** that reveals the scholarly layer without ever cluttering the calm default.

### 2 · UI review → what was preserved
Palette (ink/paper/mist/marina/brass), Newsreader/Inter/Noto Serif Tamil, bilingual section
headings, card and chip language, timeline spine, dashboard — all untouched. New sections reuse
`SectionHeading`, `Reveal`, `RefChips`, and the established border/radius/tone system. The hero
gains only a library eyebrow, a faint manuscript-initial watermark (a single Tamil glyph), and a
second CTA into the Reading Room.

### 3 · Information architecture review
- Home remains the exhibition: Hero → Summary → Pillars → Timeline → **Journey** → Themes →
  **People** → Quotes → Numbers → Gallery → References.
- `/read` is the collection: volumes → chapters → stable per-chapter URLs (`/read/v3-ch30`), each
  statically generated — the citable unit of the archive.
- The knowledge layer is data-first: `data/people.ts`, `data/places.ts`, timeline `tags`/`location`,
  and theme `archive` blocks all reference the same verified chapter ids, so future collections
  (speeches, letters, Murasoli) plug into the identical spine.

### 4 · Accessibility review
Skip-to-content link; `prefers-reduced-motion` honored globally and in Framer transitions;
`focus-ring` on every interactive element; `aria-pressed`/`aria-expanded` on all toggles and
filters; `lang="ta"` on every Tamil node; map markers keyboard-operable; reader font-size control;
progressbar semantics on the reading indicator. Contrast stays within the existing AA-tested tones.

### 5 · Performance review
Everything remains static: chapter text ships as 391 small JSONs fetched per page (no bundle
growth), reader pages are SSG via `generateStaticParams`, no new dependencies were added, and the
only images are inline SVG. JSON-LD Book schema and `metadataBase` added for SEO; per-chapter
`generateMetadata` gives every chapter a real title. Lighthouse targets are realistic because the
payload per route stays a single chapter, not a corpus.

### Research Mode (the credibility layer)
Toggled from the navbar (the graduation-cap icon), the References section, or the Reader —
persisted per visitor. Reveals: chapter ids, exact page ranges under every timeline milestone,
extraction strategy per volume, per-chapter and per-volume JSON downloads, and one-click citations.

### Honest limits, by design
- Text is **uncorrected OCR**, labeled as such everywhere it appears; correction is the pipeline's
  next stage (see `kalaignar-archive-plan.md`, Phase 2).
- The map is **schematic** and says so — a museum floor plan, not cartography.
- The gallery keeps its original illustrations until genuine archival material with rights and
  provenance can be acquired; slots and captions are ready for it.
- People/Places entries are limited to figures and sites whose chapter references were verified
  against the source — the archive grows only as fast as verification does.
