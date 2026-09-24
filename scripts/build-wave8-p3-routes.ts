/**
 * Wave 8 P3 — deterministic direct-route manifest (internal; never public).
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/build-wave8-p3-routes.ts            # write
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/build-wave8-p3-routes.ts --verify   # fail unless byte-identical
 *
 * Records the exact direct routes P3 makes addressable, derived from the merged P2 reader models (never from typed
 * ranges): Murasoli Vols 42–47 letters by their source-derived routeSlug, ஒரே முத்தம் landing + /source + one route per
 * printed scene (the adapter's own unit slugs), சங்கத் தமிழ் landing + /source + one route per source-order section.
 * At P3 the cohort is direct-but-undiscovered: `discoverable: false`, `sitemapExposed: false`.
 */
import fs from "node:fs";
import path from "node:path";
import { loadWave8MurasoliLetters } from "../lib/wave8-murasoli-reader";
import { toOreMuthamPlay } from "../lib/wave8-ore-mutham-adapter";
import { toSangatamilWork } from "../lib/wave8-sangatamil-reader";

const OUT = path.join(process.cwd(), "data/internal/wave8/wave8-p3-routes.json");

export function buildWave8P3Routes() {
  const murasoli = loadWave8MurasoliLetters().map((l) => `/murasoli/${l.id}`);
  const play = toOreMuthamPlay();
  const oreMutham = [`/plays/${play.slug}`, `/plays/${play.slug}/source`, ...play.readingUnits.map((u) => `/plays/${play.slug}/${u.slug}`)];
  const work = toSangatamilWork();
  const sangatamil = ["/sangatamil", "/sangatamil/source", ...work.sections.map((s) => `/sangatamil/${s.slug}`)];
  const all = [...murasoli, ...oreMutham, ...sangatamil];
  return {
    stage: "P3",
    discoverable: false,
    sitemapExposed: false,
    note: "Direct reader routes for Wave 8, served from the hidden internal data through the P2 reader models and public projections; no public/data payload. Absent from the catalogue, /read discovery and the sitemap until P4.",
    counts: { murasoli: murasoli.length, oreMutham: oreMutham.length, sangatamil: sangatamil.length, total: all.length, unique: new Set(all).size },
    cohorts: {
      murasoli: { family: "/murasoli/[id]", source: "lib/wave8-murasoli-reader.ts (hidden P1 data)", routes: murasoli },
      oreMutham: { family: "/plays/[slug] (+ /source, /[scene])", source: "lib/wave8-ore-mutham-adapter.ts via lib/drama-wave8-routes.ts (hidden P1 data)", routes: oreMutham },
      sangatamil: { family: "/sangatamil (+ /source, /[section])", source: "lib/wave8-sangatamil-reader.ts via lib/sangatamil-server.ts (hidden P1 data)", routes: sangatamil },
    },
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  const json = JSON.stringify(buildWave8P3Routes(), null, 1) + "\n";
  if (process.argv.includes("--verify")) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (cur !== json) { console.error("wave8-p3-routes.json is not the deterministic output of the P2 models — regenerate"); process.exit(1); }
    console.log("wave8-p3-routes.json — verified byte-identical (deterministic regeneration)");
  } else {
    fs.writeFileSync(OUT, json);
    const m = JSON.parse(json);
    console.log(`wave8-p3-routes.json written — ${JSON.stringify(m.counts)}`);
  }
}
