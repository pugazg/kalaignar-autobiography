# Kalaignar Digital Library — நெஞ்சுக்கு நீதி

An interactive digital archive of **Nenjukku Neethi (நெஞ்சுக்கு நீதி)**, the complete
six-volume Tamil memoir of **Kalaignar M. Karunanidhi**, together with a collection of his
**Murasoli** letters. It spans **six volumes · 391 chapters** of memoir (1924–2005) plus
**288 Murasoli letters** across volumes 49–54.

Live: **[nenjukkuneethi.org](https://nenjukkuneethi.org)**

The project has two surfaces that share one body of data:

| Surface | Stack | Location |
| --- | --- | --- |
| **Website** | Next.js 14 (App Router) · React 18 · TypeScript · Tailwind · Framer Motion | repo root, deployed to Vercel |
| **Mobile app** | Expo · React Native · TypeScript (iOS + Android) | [`mobile/`](mobile/) |

## Data is the source of truth

Historical content is **never hardcoded in components**. It lives as served JSON and typed
datasets, and every surface reads from it:

- `public/data/**` — the served archive JSON (chapter text, translations, search indexes,
  visuals, Murasoli letters, stats). This is what both the website and the app fetch.
- `data/*.ts` — typed feature datasets for the website (timeline, themes, people, governance,
  quotes, stats). *(JSON export of these for the app is an Increment-2 task.)*

Key endpoints (see [`mobile/docs/DATA_CONTRACTS.md`](mobile/docs/DATA_CONTRACTS.md) for the full contract):

| Endpoint | Contents |
| --- | --- |
| `/data/app/manifest.v1.json` | Versioned app manifest — all 6 volumes + 391 chapters inlined |
| `/data/text/<id>.json` | Chapter body (Tamil), `id` = `v<vol>-ch<NN>` |
| `/data/text-en/<id>.json` | English translation (optional, per chapter) |
| `/data/fulltext/v<N>.json` | Per-volume full-text search index |
| `/data/visuals/<id>.json` | Chapter illustration/photo placements |
| `/images/volume<N>/…` | Chapter illustrations (ink-on-transparent PNG or photo JPG) |
| `/data/murasoli/…` | Murasoli letters index + `letters/<id>.json` (`m<vol>-l<serial>`) |
| `/data/stats.json` | Archive statistics |

## Repository layout

```
app/                 Next.js App Router — root layout, /read Reading Room, routes, SEO, icons
sections/            Website home-page sections (Hero, Chronicle, Governance, Gallery, …)
components/          Website UI (Navbar, Reader, SearchDialog, shared primitives)
data/                Typed feature datasets (*.ts) for the website
public/data/         The served archive JSON (source of truth) — see table above
public/images/       Chapter illustrations and photos
pipeline/builders/   Python builders that generate public/data/** from OCR + sources
scripts/             Extraction/utility scripts (chapter index & text)
mobile/              Expo / React Native app (own README + docs/)
.github/workflows/   CI (mobile-ci.yml)
```

## Run the website

```bash
npm install
npm run dev                    # http://localhost:3000
npm run build && npm start     # production build
```

Node 18.17+ (Next 14 baseline). Push to `main` auto-deploys to Vercel. The `mobile/` and
`documentary/` directories are excluded from the website build (`.vercelignore` + root
`tsconfig.json`), so the Next.js build only type-checks the site.

## Run the mobile app

```bash
cd mobile
npm install
npx expo start                 # then press i (iOS Simulator) or a (Android emulator)
```

**Physical iPhone:** use an Expo **development build** (EAS `development` profile), not Expo
Go — the current App Store Expo Go tracks a newer SDK and may not run this project's SDK 52.
See [`mobile/docs/BUILD.md`](mobile/docs/BUILD.md).

Full details — architecture, data contracts, build/EAS, store checklist — are in
[`mobile/README.md`](mobile/README.md) and [`mobile/docs/`](mobile/docs/).

## The data pipeline

Builders under `pipeline/builders/` regenerate the served JSON from OCR text and sources:

```bash
# App manifest consumed by the mobile app (rebuild after any index change)
python3 pipeline/builders/build_app_manifest.py
npm --prefix mobile run validate:manifest        # AJV schema + cross-checks

# Add a Murasoli letter volume (parametrised)
python3 pipeline/builders/build_vol53_from_translations.py <vol> <src-dir>

# Chapter visuals (per volume; sketch/photo placement)
python3 pipeline/builders/build_volume1_visuals.py     # …2, …3, photo volumes, etc.
```

Website chapter data is produced by the `scripts/` extractors (chapter index and text). The
`v<vol>-ch<NN>` id convention keeps citations stable across volumes and surfaces.

## Content & editorial rules

- **Nothing is invented.** Every date, figure and event is grounded in the source text; the
  website cites chapters (`V<vol>·<NN>`) resolving to page ranges in the References section.
- Narrative is **summarised in original words**; only brief, attributed quotes appear.
- Tamil chapter text is presented as the **original source** (some volumes uncorrected OCR);
  corrections are welcome via the site.
- Copyright in the original works remains with the respective rights holders; this independent
  digital edition provides source attribution for every collection.

## Continuous integration

[`.github/workflows/mobile-ci.yml`](.github/workflows/mobile-ci.yml) runs on changes under
`mobile/**` (or the app manifest / its builder): TypeScript, manifest validation, Expo Doctor,
and an iOS Metro export. The website is built and deployed by Vercel.

## Accessibility

Semantic landmarks and heading order, skip-to-content, visible focus, `prefers-reduced-motion`
honoured, keyboard-operable search and lightbox, ARIA on interactive controls, and Noto Serif
Tamil for Tamil text (with Dynamic Type support in the app).
