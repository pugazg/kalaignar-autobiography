/**
 * Wave 4 P0 contract — the Poetry architecture generalization.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-poetry-architecture.ts
 *
 * P0 PUBLISHES NOTHING. Its entire job is to make Poetry able to hold works other than the one it was
 * designed around, and its entire risk is that generalizing the model quietly changes the work already
 * live. So this file asserts two things in opposite directions:
 *
 *   1. the existing poem is untouched — payload, catalogue entry, routes and registry;
 *   2. the new shape exists, is empty, and cannot mint an unsafe item slug when P2/P3 fill it.
 *
 * The byte-identity of the generated payload is proved by re-running the importer against the frozen
 * source (see the P0 report), not here: this file cannot re-run an importer without a source clone, so
 * it pins the payload's HASHES instead — which catches an accidental edit to the committed data even
 * when no importer is run.
 *
 * Exits non-zero on failure so CI can run it beside the validators.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { publishedWorks } from "../data/library";
import { discoveryShelves } from "../data/collections";
import type { PageRun, PoetryItem } from "../data/poems";
import {
  POEM_SLUGS,
  POETRY_ITEM_SLUG_RULES,
  POETRY_PUBLICATION_SLUGS,
  POETRY_WITNESS_RELATIONS,
} from "../data/poems";

const EXISTING = "idhayathai-thanthidu-anna";

// The payload as it stands on main before P0. A change to either hash means the generated data moved,
// which P0 forbids outright.
const FROZEN_PAYLOAD_SHA256 = {
  "poem.json": "6833738340243833b712479e017f25294bb0e45b701d66d060a77f634c3e64f7",
  "provenance.json": "d06a664052178762372d42727c95620a3c3a88159f85b56e43a095e8a401e930",
};

let checks = 0;
const failures: string[] = [];
const ok = (cond: boolean, label: string) => {
  checks++;
  if (!cond) failures.push(label);
};
const eq = <T,>(a: T, b: T, label: string) => {
  checks++;
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    failures.push(`${label}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`);
  }
};

// ── 1. The existing poem's payload is byte-for-byte unchanged ────────────────────────────────────
const dir = path.join(process.cwd(), "public/data/poems", EXISTING);
for (const [file, want] of Object.entries(FROZEN_PAYLOAD_SHA256)) {
  const p = path.join(dir, file);
  ok(fs.existsSync(p), `${file} exists`);
  if (!fs.existsSync(p)) continue;
  const got = createHash("sha256").update(fs.readFileSync(p)).digest("hex");
  eq(got, want, `${file} is byte-identical to the pre-P0 payload`);
}

// The generated data must not have gained a discriminator. `form` on the existing poem.json is exactly
// the mutation P0 is forbidden to make: the additive model lives in the types, not in the payload.
const poem = JSON.parse(fs.readFileSync(path.join(dir, "poem.json"), "utf-8"));
ok(!("form" in poem), "the existing poem.json gained no `form` discriminator");
eq(poem.readerStructure, "poem", "the existing poem keeps readerStructure `poem`");
eq(poem.slug, EXISTING, "the existing poem keeps its slug");
// Its historical import provenance stays historical. Repointing it at the newer repository commit
// would buy nothing and would break the byte-identity guarantee above.
eq(
  poem.sourceCommit,
  "42c156d7242fa799ea80adbb0c5f2b9eba078fe9",
  "the existing poem keeps its historical imported source commit",
);

// ── 2. Nothing new is published ──────────────────────────────────────────────────────────────────
eq(POEM_SLUGS.length, 1, "still exactly one standalone poem slug");
eq([...POEM_SLUGS], [EXISTING], "the standalone registry is unchanged");
eq(POETRY_PUBLICATION_SLUGS.length, 0, "no poetry publication is published in P0");
eq(POETRY_WITNESS_RELATIONS.length, 0, "no witness relation is declared in P0");

const works = publishedWorks();
const shelves = discoveryShelves();
const poetry = shelves.find((s) => s.shelf.id === "poetry");
eq(works.length, 71, "the catalogue still holds 71 works");
eq(shelves.length, 9, "still 9 non-empty shelves");
eq(shelves.reduce((n, s) => n + s.entries.length, 0), 35, "still 35 discovery entries");
ok(!!poetry, "the Poetry shelf is present");
eq(poetry!.works.length, 1, "Poetry still holds exactly 1 work");
eq(poetry!.entries.length, 1, "Poetry still shows exactly 1 discovery entry");
eq(poetry!.works[0].href, `/poems/${EXISTING}`, "the existing Poetry route is unchanged");
eq(poetry!.works[0].provenanceHref, `/poems/${EXISTING}/source`, "the existing Poetry source route is unchanged");

// ── 3. The generalization is real, not cosmetic ──────────────────────────────────────────────────
// Optionality has to be visible in the type source: the point of P0 is that the NEXT work can omit
// facts its own source does not establish, and a required field would force it to invent one.
const poemsSrc = fs.readFileSync(path.join(process.cwd(), "data/poems.ts"), "utf-8");
for (const field of ["sourceContext?", "dateIso?", "datePrinted?", "venue?", "occasion?"]) {
  ok(poemsSrc.includes(field), `source-context field is optional: ${field}`);
}
for (const field of ["unnumberedScanNote?", "contextNoteTa?", "forewordDateNote?"]) {
  ok(poemsSrc.includes(field), `work-specific provenance field is optional: ${field}`);
}

// The shared reader must not carry one work's facts as literals — that is how the next poem would
// silently inherit 9.2.1969 and Chennai Radio. Comments explaining the hazard are stripped first, so
// the guard judges the code rather than the prose about it.
const readerSrc = fs
  .readFileSync(path.join(process.cwd(), "components/PoemReader.tsx"), "utf-8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
for (const literal of ["9.2.1969", "9 February 1969", "All 14 poem scans", "14/14"]) {
  ok(!readerSrc.includes(literal), `the shared reader hard-codes no work-specific literal: ${literal}`);
}
ok(readerSrc.includes("poem.sourceContext &&"), "the reader renders the context row conditionally");

// ── 4. Item-slug rules exist before the first slug is minted ─────────────────────────────────────
eq(
  [...POETRY_ITEM_SLUG_RULES.reservedSegments].sort(),
  ["items", "source"],
  "both reserved route segments are declared",
);
const pattern = POETRY_ITEM_SLUG_RULES.pattern;
for (const good of ["give-me-your-heart-anna", "indrajit", "the-tale-of-the-southerner"]) {
  ok(pattern.test(good), `a real released slug is accepted: ${good}`);
}
for (const bad of ["", "Give-Me", "give_me", "-leading", "trailing-", "double--dash", "with space"]) {
  ok(!pattern.test(bad), `an invalid slug is rejected: ${JSON.stringify(bad)}`);
}
for (const reserved of POETRY_ITEM_SLUG_RULES.reservedSegments) {
  ok(pattern.test(reserved), `reserved segment ${reserved} is otherwise slug-shaped — hence reserved`);
}

// ── 4b. Page runs are ordered lists on BOTH axes, and gaps survive ───────────────────────────────
// The frozen source interleaves works: கலைஞரின் கவிதைகள் item 23 occupies scans 230–236 and 238 while
// item 24 takes 237 and 239–244, and their PRINTED pages carry the same gap. A single {first,last}
// would have to swallow it and claim a page belonging to the other item. These two real items are
// constructed here so the shape is proved representable, and the flattened form is proved wrong.
{
  const item23: PoetryItem = {
    ordinal: 23,
    slug: "annan-oru-kaviyarangam",
    titleTa: "அண்ணன் ஒரு கவியரங்கம்",
    titleEn: "Annan, a Poetry Assembly",
    physicalScans: [
      { first: 230, last: 236 },
      { first: 238, last: 238 },
    ],
    printedPages: [
      { first: 213, last: 219 },
      { first: 221, last: 221 },
    ],
    tamil: { lines: [], elements: [] } as unknown as PoetryItem["tamil"],
    english: { lines: [], elements: [] } as unknown as PoetryItem["english"],
  };
  const item24: PoetryItem = {
    ordinal: 24,
    slug: "tamil-valara-vazhinadai-payanam",
    titleTa: "தமிழ் வளர வழிநடைப் பயணம்",
    titleEn: "A Walking Journey for Tamil to Flourish",
    physicalScans: [
      { first: 237, last: 237 },
      { first: 239, last: 244 },
    ],
    printedPages: [
      { first: 220, last: 220 },
      { first: 222, last: 227 },
    ],
    tamil: { lines: [], elements: [] } as unknown as PoetryItem["tamil"],
    english: { lines: [], elements: [] } as unknown as PoetryItem["english"],
  };

  eq(item23.printedPages!.length, 2, "item 23 keeps its printed pages as two runs, not one");
  eq(item24.physicalScans.length, 2, "item 24 keeps its scans as two runs, not one");

  const covers = (runs: PageRun[]) => runs.flatMap((r) => Array.from({ length: r.last - r.first + 1 }, (_, i) => r.first + i));
  const p23 = covers(item23.printedPages!);
  const p24 = covers(item24.printedPages!);
  ok(!p23.includes(220), "item 23's printed pages exclude 220 — the gap is not swallowed");
  ok(!p24.includes(221), "item 24's printed pages exclude 221 — the gap is not swallowed");
  eq(p23.length, 8, "item 23 covers exactly 8 printed pages (213–219, 221)");
  eq(p24.length, 7, "item 24 covers exactly 7 printed pages (220, 222–227)");
  // The two interleaved items must not claim the same page as each other.
  eq(p23.filter((n) => p24.includes(n)), [], "the interleaved items overlap on no printed page");
  const s23 = covers(item23.physicalScans);
  ok(!s23.includes(237), "item 23's scans exclude 237 — which belongs to item 24");

  // A flattened single range would be WRONG, and this states exactly how.
  const flatFirst = Math.min(...p23);
  const flatLast = Math.max(...p23);
  ok(flatLast - flatFirst + 1 !== p23.length, "flattening item 23 to 213–221 would claim a page it does not occupy");
}

// The type source must not have regressed to a single printed-page range.
ok(/printedPages\?: PageRun\[\]/.test(poemsSrc), "printedPages is an ordered list of runs");
ok(/physicalScans: PageRun\[\]/.test(poemsSrc), "physicalScans is an ordered list of runs");
ok(!/printedPages\?: \{ first: number; last: number \};/.test(poemsSrc), "printedPages is not a single range");

// ── 4c. The source page carries no work's facts and both publication states exist ────────────────
const sourceSrc = fs
  .readFileSync(path.join(process.cwd(), "components/PoemSource.tsx"), "utf-8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
for (const literal of ["Scan 26", "scan 26"]) {
  ok(!sourceSrc.includes(literal), `the shared source page hard-codes no work-specific scan: ${literal}`);
}
ok(!sourceSrc.includes("printed booklet"), "the source page does not call every source a printed booklet");
ok(sourceSrc.includes("s.unnumberedScanNote &&"), "the unnumbered-scan notice is conditional");
ok(sourceSrc.includes("hasContextCard &&"), "the source-context card is conditional");
for (const row of ["s.contextDatePrinted &&", "s.contextVenueTa &&", "s.contextOccasionTa &&"]) {
  ok(sourceSrc.includes(row), `the context row is conditional: ${row}`);
}
ok(sourceSrc.includes("s.forewordDateNote &&"), "the foreword note is conditional");
ok(sourceSrc.includes("s.publicationEstablished &&"), "an established publication renders");
ok(sourceSrc.includes("!s.publicationEstablished && s.publicationNotEstablished &&"), "a not-established publication renders");
ok(poemsSrc.includes("publicationEstablished?:"), "the type supports an established publication");
ok(poemsSrc.includes("publicationNotEstablished?:"), "the type supports an unestablished publication");
ok(poemsSrc.includes("sourceTypeLabel?:"), "the source-type label is work-driven and optional");

// ── 5. Scope: P0 adds no route and no unauthorized surface ───────────────────────────────────────
const sitemapSrc = fs.readFileSync(path.join(process.cwd(), "app/sitemap.ts"), "utf-8");
ok(!sitemapSrc.includes("POETRY_PUBLICATION_SLUGS"), "P0 wires no publication routes into the sitemap");
ok(fs.existsSync(path.join(process.cwd(), "app/poems/[slug]/page.tsx")), "the standalone poem route still exists");
ok(
  !fs.existsSync(path.join(process.cwd(), "app/poems/[slug]/items")),
  "P0 creates no publication item route",
);
eq(
  fs.readdirSync(path.join(process.cwd(), "public/data/poems")).sort(),
  [EXISTING],
  "P0 vendors no new poem data",
);

// ── Report ───────────────────────────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`poetry-architecture — ${checks} checks, ${failures.length} FAILED\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exitCode = 1;
} else {
  console.log(`poetry-architecture — ${checks} checks, 0 failed`);
  console.log(
    `  ${works.length} works · Poetry ${poetry!.works.length} work / ${poetry!.entries.length} entry · ` +
      `${POETRY_PUBLICATION_SLUGS.length} publications · ${POETRY_WITNESS_RELATIONS.length} witness relations`,
  );
}
