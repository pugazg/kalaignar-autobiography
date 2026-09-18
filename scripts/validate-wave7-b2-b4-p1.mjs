// Wave 7 combined Batches 2-4 — P1 INDEPENDENT source/import validator. Fails closed.
//
//   node scripts/validate-wave7-b2-b4-p1.mjs <stage-plays-clone> <novels-clone> <essays-clone>
//   (or set KDL_SOURCES_DIR to a dir holding kalaignar-stage-plays / kalaignar-novels / kalaignar-essays)
//
// Re-derives source truth DIRECTLY from the pinned source checkouts with its OWN traversal — it never
// imports the importers and never treats generated payloads as source truth. It proves the cohort is
// exactly 13 (2 Drama + 5 Novels + 6 Essays), unique identity, per-work SUBTREE pins, scan-SHA presence,
// independent structural counts that agree with BOTH the manifest and the vendored payloads, readiness /
// qualification, no cross-work conflation (arumbu / nadutheru-narayani / sarapallam-samundi stay separate),
// nachuk-koppai's retained qualification, and that no HOLD / NOT-COMPLETE / Batch-1-cinema / Batch-5-6 item
// leaked in and no shared-source compilation is counted as a work.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const BASE = process.env.KDL_SOURCES_DIR || "";
const PLAYS = process.argv[2] || (BASE ? path.join(BASE, "kalaignar-stage-plays") : "");
const NOVELS = process.argv[3] || (BASE ? path.join(BASE, "kalaignar-novels") : "");
const ESSAYS = process.argv[4] || (BASE ? path.join(BASE, "kalaignar-essays") : "");
const SRC = { drama: PLAYS, fiction: NOVELS, "essays-articles": ESSAYS };
for (const [k, v] of Object.entries(SRC)) if (!v || !fs.existsSync(v)) { console.error(`validate-wave7-b2-b4-p1: source clone for ${k} not found (${v || "unset"})`); process.exit(2); }

let checks = 0; const fail = [];
const ok = (c, l) => { checks++; if (!c) fail.push(l); };
const eq = (a, b, l) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const git = (repo, ...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8" }).trim();
const readText = (p) => fs.readFileSync(p, "utf8");
const fmVal = (text, key) => { const m = new RegExp(`^${key}:\\s*(.*)$`, "m").exec(text.slice(0, 400)); return m ? m[1].trim().replace(/^"(.*)"$/, "$1") : null; };

const manifest = JSON.parse(readText(path.join(root, "data/internal/wave7/b2-b4-p1-manifest.json")));
const works = manifest.works;

// ── Cohort shape ───────────────────────────────────────────────────────────────────────────────────
eq(works.length, 13, "cohort is exactly 13 works");
eq(new Set(works.map((w) => w.slug)).size, 13, "13 unique canonical slugs");
const byBatch = {}; for (const w of works) byBatch[w.batch] = (byBatch[w.batch] || 0) + 1;
eq(byBatch, { 2: 2, 3: 5, 4: 6 }, "batch distribution 2 Drama + 5 Novels + 6 Essays");
const byShelf = {}; for (const w of works) byShelf[w.shelf] = (byShelf[w.shelf] || 0) + 1;
eq(byShelf, { drama: 2, fiction: 5, "essays-articles": 6 }, "shelf distribution 2 drama + 5 fiction + 6 essays-articles");

// ── Exclusions: no forbidden work leaked in ─────────────────────────────────────────────────────────
const B1_CINEMA = ["maruthanattu-ilavarasi", "vandikkaran-magan", "naam"];
const OTHER_PUBLISHED = ["ina-muzhakkam", "kolaikkalam", "kudumbaththin-nalvilakku", "sinthanaiyum-seyalum", "vedhanai-ch-siraiyinindrum-viduthalai-pera", "periya-idathup-pen", "pudhaiyal", "kagithapoo", "manimagudam", "thiruvalar-desiyampillai"];
for (const s of B1_CINEMA) ok(!works.some((w) => w.slug === s), `no Batch-1 cinema work re-imported (${s})`);
for (const s of OTHER_PUBLISHED) ok(!works.some((w) => w.slug === s), `no already-published Wave-6 work included (${s})`);
ok(!works.some((w) => w.slug === "arumbu-1978"), "the arumbu-1978 compilation is NOT counted as a canonical work");
eq(manifest.collections["arumbu-1978"].members.sort(), ["arumbu", "nadutheru-narayani", "sarapallam-samundi"], "arumbu-1978 compilation members are the 3 separate works");

// ── Per-work: subtree pin, scan SHA, independent structural counts, readiness ───────────────────────
const isNum = (f) => /^\d.*\.md$/.test(f);
const countDir = (dir, filter = isNum) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(filter) : []);

for (const w of works) {
  const repo = SRC[w.shelf];
  // Subtree pin (proves the exact frozen work tree, independent of the importer's provenance file).
  const sub = git(repo, "rev-parse", `HEAD:${w.sourcePath}`);
  eq(sub, w.workSubtree, `${w.slug}: source work subtree == manifest pin`);
  // Scan SHA appears in the source metadata (drama/novels metadata/source.md; essays metadata/source.md).
  const metaPath = path.join(repo, w.sourcePath, "metadata/source.md");
  ok(fs.existsSync(metaPath) && readText(metaPath).includes(w.scan.sha256), `${w.slug}: scan SHA-256 present in source metadata`);

  // Independent structural re-count from the source reading layer.
  let srcCount;
  if (w.shelf === "drama") srcCount = countDir(path.join(repo, w.sourcePath, "scenes")).length;
  else if (w.shelf === "fiction") srcCount = countDir(path.join(repo, w.sourcePath, "sections")).length;
  else srcCount = countDir(path.join(repo, w.sourcePath, "articles")).length;
  const manCount = w.structuralCounts.readingUnits ?? w.structuralCounts.sections ?? w.structuralCounts.articles;
  eq(srcCount, manCount, `${w.slug}: independent source unit count == manifest (${manCount})`);

  // Vendored payload agreement (payload is derived; its own count must equal the source re-count).
  const payload = JSON.parse(readText(path.join(root, w.payloadFile)));
  let payCount;
  if (w.shelf === "drama") payCount = payload.readingUnits.length;
  else if (w.shelf === "fiction") payCount = payload.sections.length;
  else payCount = payload.articles.length;
  eq(payCount, srcCount, `${w.slug}: vendored payload unit count == independent source re-count`);

  // English counterpart parity (independent), per shelf.
  if (w.shelf === "drama") {
    for (const f of countDir(path.join(repo, w.sourcePath, "scenes"))) ok(fs.existsSync(path.join(repo, w.sourcePath, "translations/en", f)), `${w.slug}: EN counterpart for scene ${f}`);
  } else if (w.shelf === "fiction") {
    const enByOrd = new Set(countDir(path.join(repo, w.sourcePath, "translations/en/sections")).map((f) => Number(/^(\d+)/.exec(f)[1])));
    for (const f of countDir(path.join(repo, w.sourcePath, "sections"))) ok(enByOrd.has(Number(/^(\d+)/.exec(f)[1])), `${w.slug}: EN section for order ${Number(/^(\d+)/.exec(f)[1])}`);
  } else {
    eq(countDir(path.join(repo, w.sourcePath, "translations/en")).length, srcCount, `${w.slug}: EN article count == TA article count`);
  }

  // Readiness / qualification.
  ok(w.readiness === "ready" || w.readiness === "ready-with-qualification", `${w.slug}: readiness is ready or ready-with-qualification`);
  if (w.qualification) eq(w.readiness, "ready-with-qualification", `${w.slug}: a qualified work is marked ready-with-qualification`);
}

// ── nachuk-koppai qualification is RETAINED (independently verified from source) ────────────────────
{
  const nachuk = works.find((w) => w.slug === "nachuk-koppai");
  ok(!!nachuk && nachuk.readiness === "ready-with-qualification", "nachuk-koppai is READY WITH QUALIFICATION");
  ok(nachuk.qualification && /scan 22 \/ Scene 5/.test(nachuk.qualification.locus), "nachuk-koppai qualification locus = scan 22 / Scene 5");
  const s5 = readText(path.join(PLAYS, "works/nachuk-koppai/scenes/05.md"));
  ok(fmVal(s5, "status") === "assembly-reviewed-with-source-hold", "nachuk scene 5 source status carries the hold");
  ok(/Inherited source hold/.test(s5), "nachuk scene 5 source documents the inherited hold");
  // The vendored play.json marks scene 5 as held and did NOT reconstruct the unreadable clusters.
  const play = JSON.parse(readText(path.join(root, "public/data/plays/nachuk-koppai/play.json")));
  const held = play.readingUnits.filter((u) => u.heldSource);
  eq(held.length, 1, "nachuk-koppai payload marks exactly one held scene");
  eq(held[0].slug, "05", "nachuk-koppai held scene is Scene 5");
}

// ── arumbu / nadutheru-narayani / sarapallam-samundi: separate works sharing ONE source publication ──
{
  const trio = ["arumbu", "nadutheru-narayani", "sarapallam-samundi"].map((s) => works.find((w) => w.slug === s));
  ok(trio.every(Boolean), "all three arumbu-1978 member works are present");
  eq(new Set(trio.map((w) => w.workSubtree)).size, 3, "the three works have three DISTINCT work subtrees (separate works)");
  eq(new Set(trio.map((w) => w.scan.sha256)).size, 1, "the three works share ONE source publication scan SHA (arumbu-1978)");
  eq(new Set(trio.map((w) => w.payloadFile)).size, 3, "the three works have three DISTINCT vendored payloads");
  for (const w of trio) eq(w.sourceCompilation, "arumbu-1978", `${w.slug}: tagged to the arumbu-1978 compilation (not merged into one work)`);
}

if (fail.length) {
  console.error(`\nwave7-b2-b4-p1 — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 50)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b2-b4-p1 — ${checks} checks, 0 failed`);
console.log("  13 works (2 drama + 5 novels + 6 essays) re-derived from pinned source · subtree pins · scan SHAs · independent counts == manifest == payloads · nachuk qualification retained · arumbu/nadutheru/sarapallam kept separate · no forbidden work leaked");
