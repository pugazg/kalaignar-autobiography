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
