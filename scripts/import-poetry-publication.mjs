// Deterministic CLI entry for POETRY PUBLICATION imports (Digital Library — Poetry, Wave 4 P2+).
//
// Reads the AUTHORITATIVE source from a local clone of pugazg/kalaignar-poems at a pinned commit and
// work tree, and vendors static bilingual reader data into this website under
// public/data/poems/<slug>/{publication.json, provenance.json}. Runtime never calls GitHub and the
// source PDF is never read or vendored (its identity travels as filename + SHA-256 + size + scan
// count only). The source clone is never modified.
//
// Engine: scripts/lib/poetry-publication.mjs. Per-work facts: scripts/publication-declarations/<slug>.mjs.
//
// Usage: node scripts/import-poetry-publication.mjs <kalaignar-poems-clone> <source-commit> <slug> [<expected-work-tree>]

import path from "node:path";
import { pathToFileURL } from "node:url";
import { assertSourcePin, buildPublication, writePublication, reportPublication } from "./lib/poetry-publication.mjs";

const [SRC_REPO, SRC_COMMIT, SLUG, EXPECTED_TREE] = process.argv.slice(2);
if (!SRC_REPO || !SRC_COMMIT || !SLUG) {
  console.error("usage: node scripts/import-poetry-publication.mjs <kalaignar-poems-clone> <source-commit> <slug> [<expected-work-tree>]");
  process.exit(1);
}

const declPath = path.join(process.cwd(), "scripts/publication-declarations", `${SLUG}.mjs`);
const { default: decl } = await import(pathToFileURL(declPath).href);
if (decl.slug !== SLUG) throw new Error(`declaration ${declPath} declares slug ${decl.slug}, not ${SLUG}`);

const sourceTree = assertSourcePin(SRC_REPO, SRC_COMMIT, decl.sourcePath, EXPECTED_TREE);
const OUT = path.join(process.cwd(), "public/data/poems", SLUG);
const built = buildPublication({ decl, srcRepo: SRC_REPO, srcCommit: SRC_COMMIT, sourceTree });
writePublication(OUT, built.publication, built.provenance);
reportPublication(OUT, built);
