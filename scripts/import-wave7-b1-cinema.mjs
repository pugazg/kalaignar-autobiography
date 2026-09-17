// Wave 7 Batch 1 (Cinema) — deterministic, fail-closed importer for the 3 canonical works
// (maruthanattu-ilavarasi, vandikkaran-magan, naam). HIDDEN P1: it vendors each work's QA-verified
// source reading-room.json into public/data/cinema/<slug>/reader.json and writes provenance.json.
// It creates NO route, NO catalogue entry, NO discovery/sitemap exposure.
//
//   node scripts/import-wave7-b1-cinema.mjs <path-to-kalaignar-cinema-works-clone-at-pinned-commit>
//
// The source ships, per work, integrations/reading-room/{reading-room.json, manifest.json}. This importer
// verifies (a) the clone is at the manifest's pinned commit + tree, (b) each work subtree matches the
// pinned workTree, and (c) sha256(reading-room.json) equals BOTH the source manifest's own declared output
// SHA and this repo's frozen expectation, before vendoring the exact bytes. Any mismatch aborts (exit 1).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC = process.argv[2];
const die = (m) => { console.error("import-wave7-b1-cinema: " + m); process.exit(1); };
if (!SRC || !fs.existsSync(path.join(SRC, "works"))) die("usage: node scripts/import-wave7-b1-cinema.mjs <cinema-works clone>");

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave7/b1-cinema.json"), "utf8"));
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const git = (...args) => execFileSync("git", ["-C", SRC, ...args], { encoding: "utf8" }).trim();

// ── Source-pin integrity: the clone must be exactly the frozen commit + tree ─────────────────────────
const head = git("rev-parse", "HEAD");
const tree = git("rev-parse", "HEAD^{tree}");
if (head !== manifest.sourceCommit) die(`source HEAD ${head} != frozen ${manifest.sourceCommit}`);
if (tree !== manifest.sourceTree) die(`source tree ${tree} != frozen ${manifest.sourceTree}`);

/** Find the reading-room.json output SHA the source manifest itself declares (schema varies per work). */
function sourceDeclaredSha(man, rrRelPath) {
  const hits = new Set();
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (typeof node.path === "string" && node.path.endsWith("reading-room.json") && typeof node.sha256 === "string") hits.add(node.sha256);
    for (const v of Object.values(node)) walk(v);
  };
  walk(man);
  if (man.output && man.output.path && man.output.path.endsWith("reading-room.json") && man.output.sha256) hits.add(man.output.sha256);
  return hits;
}

for (const w of manifest.works) {
  const workAbs = path.join(SRC, w.sourcePath);
  if (!fs.existsSync(workAbs)) die(`${w.slug}: source work dir missing (${w.sourcePath})`);
  // work subtree pin
  const wt = git("rev-parse", `HEAD:${w.sourcePath}`);
  if (wt !== w.workTree) die(`${w.slug}: work subtree ${wt} != frozen ${w.workTree}`);

  const rrRel = w.readingRoom.path;
  const rrAbs = path.join(SRC, rrRel);
  if (!fs.existsSync(rrAbs)) die(`${w.slug}: reading-room.json missing (${rrRel})`);
  const bytes = fs.readFileSync(rrAbs);
  const digest = sha256(bytes);

  // (c1) our frozen expectation
  if (digest !== w.readingRoom.sha256) die(`${w.slug}: reading-room.json sha ${digest} != frozen ${w.readingRoom.sha256}`);
  if (bytes.length !== w.readingRoom.bytes) die(`${w.slug}: reading-room.json bytes ${bytes.length} != frozen ${w.readingRoom.bytes}`);
  // (c2) the source manifest's own declared SHA
  const manAbs = path.join(path.dirname(rrAbs), "manifest.json");
  const srcMan = JSON.parse(fs.readFileSync(manAbs, "utf8"));
  const declared = sourceDeclaredSha(srcMan, rrRel);
  if (!declared.has(digest)) die(`${w.slug}: source manifest does not self-declare reading-room.json sha ${digest} (declared: ${[...declared].join(",") || "none"})`);
  if (srcMan.status && !/PASS|complete-verified|payload-complete-verified/i.test(String(srcMan.status) + " " + String(srcMan.qa_status ?? ""))) {
    die(`${w.slug}: source manifest status not PASS/verified (${srcMan.status})`);
  }

  // ── Vendor the exact payload bytes ──────────────────────────────────────────────────────────────
  const outDir = path.join(root, "public/data/cinema", w.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "reader.json"), bytes);

  const provenance = {
    slug: w.slug,
    wave: 7,
    batch: 1,
    sourceRepo: manifest.sourceRepo,
    sourceCommit: manifest.sourceCommit,
    repoTree: manifest.sourceTree,
    workTree: w.workTree,
    sourcePath: w.sourcePath,
    title: { ta: w.titleTa, en: w.titleEn, enIsEditorial: true },
    kind: w.kind,
    source: {
      scanSha256: w.sourceScanSha256,
      sourceIdentifier: w.sourceIdentifier ?? null,
      publicationYearAsPrinted: w.publicationYearAsPrinted ?? null,
      note: "The controlling scan is recorded by SHA-256 only; the PDF is not vendored and is never fetched at runtime. Publication year is a printed source witness, not promoted to the catalogue card.",
    },
    readingRoomPayloadSha256: w.readingRoom.sha256,
    readingRoomPayloadBytes: w.readingRoom.bytes,
    payloadMode: "source-reading-room-vendored",
    integrationQaStatus: "payload-complete-verified",
    englishProvenance: manifest.englishProvenance,
    counts: w.counts,
    hidden: {
      discoverable: false,
      sitemapExposed: false,
      publicRoute: false,
      note: "Wave 7 Batch 1 P1 — vendored hidden. Not in LIBRARY_WORKS, no /cinema route, no /read discovery, no sitemap URL until P4.",
    },
  };
  fs.writeFileSync(path.join(outDir, "provenance.json"), JSON.stringify(provenance, null, 2) + "\n");
  console.log(`  ${w.slug}: reader.json ${bytes.length} bytes (sha ${digest.slice(0, 12)}) + provenance.json — VERIFIED`);
}

console.log(`OK — vendored ${manifest.works.length} Batch-1 cinema payloads (hidden) from ${manifest.sourceCommit.slice(0, 10)}.`);
