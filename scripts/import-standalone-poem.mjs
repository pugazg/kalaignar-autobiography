// Deterministic CLI entry for every STANDALONE poem import (Digital Library — Poetry).
//
// Reads the AUTHORITATIVE source from a local clone of pugazg/kalaignar-poems at a pinned commit and
// vendors static bilingual reader data into this website under public/data/poems/<slug>/. Runtime
// never calls GitHub. The source PDF is never read and never vendored (its identity travels as
// filename + SHA-256 + size + scan map only). The source clone is never modified.
//
// The parsing, auditing and emission engine is scripts/lib/standalone-poem.mjs; everything specific
// to one work is declared in scripts/poem-declarations/<slug>.mjs and nowhere else.
//
// Usage: node scripts/import-standalone-poem.mjs <path-to-kalaignar-poems-clone> <source-commit> <slug>

import path from "node:path";
import { pathToFileURL } from "node:url";
import { assertSourcePin, buildStandalonePoem, writeStandalonePoem, reportStandalonePoem } from "./lib/standalone-poem.mjs";

const [SRC_REPO, SRC_COMMIT, SLUG] = process.argv.slice(2);
if (!SRC_REPO || !SRC_COMMIT || !SLUG) {
  console.error("usage: node scripts/import-standalone-poem.mjs <kalaignar-poems-clone> <source-commit> <slug>");
  process.exit(1);
}

assertSourcePin(SRC_REPO, SRC_COMMIT);

const declPath = path.join(process.cwd(), "scripts/poem-declarations", `${SLUG}.mjs`);
const { default: decl } = await import(pathToFileURL(declPath).href);
if (decl.slug !== SLUG) throw new Error(`declaration ${declPath} declares slug ${decl.slug}, not ${SLUG}`);

const OUT = path.join(process.cwd(), "public/data/poems", SLUG);
const built = buildStandalonePoem({ decl, srcRepo: SRC_REPO, srcCommit: SRC_COMMIT });
writeStandalonePoem(OUT, built.poem, built.provenance);
reportStandalonePoem(OUT, built);
