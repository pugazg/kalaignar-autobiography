# Kalaignar M. Karunanidhi's Legacy — an interactive digital report

An interactive, mobile-first retelling of **Nenjukku Neethi (நெஞ்சுக்கு நீதி), Volume 1** —
the autobiography of Kalaignar M. Karunanidhi — designed so a visitor can understand
the arc of 1924–1969 in ten to fifteen minutes.

Built with **Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS ·
Framer Motion · Recharts · Lucide icons**.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

Node 18.17+ is required (Next 14 baseline).

## What's inside

| Path | Purpose |
| --- | --- |
| `app/` | Root layout (fonts, SEO metadata, skip link) and the single-page composition |
| `sections/` | Hero, ExecutiveSummary, Pillars, Timeline, Themes, StatsDashboard, Gallery, References, Footer |
| `components/` | Navbar (scroll spy + reading progress + dark mode), SearchDialog, BackToTop, shared primitives |
| `data/` | All content as typed data: `meta.ts`, `timeline.ts`, `themes.ts`, `stats.ts`, `gallery.ts`, `references.ts` |
| `data/extracted/` | Machine-extracted chapter index of the source volume (provenance) |
| `scripts/extract_index.py` | The extraction pipeline — run it on each new volume |
| `public/placeholders/` | Original SVG illustrations used until archival photographs are supplied |

## Content rules honoured

- **Nothing is invented.** Every date, number and event on the site is stated in the
  source text; each card carries `V1·NN` chapter chips that resolve in the References
  section, which lists all 140 chapters with page ranges.
- Long narrative passages are **summarised in original words**; only brief quoted
  phrases appear, always attributed.
- The memoir contains no data tables, so the "Statistics Dashboard" is built from
  figures the book itself records (1957: 15 seats; 1967: 138/173, Congress 49,
  25/25 Lok Sabha, Saidapet 53,000 vs 32,000; ₹50 tenement rent; 36.5% devaluation;
  and so on).

## Extending with new volumes

1. Drop `volumeN.md` (same OCR format) somewhere local.
2. `python3 scripts/extract_index.py volumeN.md N` → writes `data/extracted/volumeN.index.json`.
3. Append the new chapters to `data/references.ts`, add milestones to `data/timeline.ts`
   and themes/stats as the volume warrants, and add `N` to `siteMeta.volumesLoaded`.

The ID convention `vN-chNN` keeps citations stable across volumes.

## Enabling the PDF download

Place the source file at `public/source/nenjukku-neethi-volume-1.pdf`;
the footer button links to that path.

## Accessibility & performance

Semantic landmarks and heading order; skip-to-content link; visible focus rings;
`prefers-reduced-motion` respected by every animation (Framer reveals, counters,
smooth scroll); keyboard-operable search (Esc closes) and lightbox (arrows/Esc);
ARIA on progress bars, dialogs, filters and expandables; system-font fallbacks with
`next/font` (Newsreader for display, Inter for body, Noto Serif Tamil for Tamil);
static single page, no client data fetching.

## The Digital Library layer

- **Reading Room** — `/read`: all 391 chapters in original Tamil (uncorrected OCR), statically
  generated with stable URLs, bookmarks, reading-position memory and citation export.
- **Research Mode** — navbar toggle; reveals page ranges, provenance, JSON downloads, citations.
- **Open data** — `public/data/volume{N}.index.json` (chapter indexes) and
  `public/data/text/{chapter-id}.json` (chapter text): the substrate for future search/AI features.
- Regenerate text data with `python3 scripts/extract_chapter_text.py volumeN.md N`.
