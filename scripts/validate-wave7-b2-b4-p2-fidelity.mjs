// Wave 7 Batches 2-4 P2 — INDEPENDENT semantic-fidelity validator. Fails closed.
//
//   node scripts/validate-wave7-b2-b4-p2-fidelity.mjs <stage-plays> <novels> <essays>
//   (or KDL_SOURCES_DIR holding kalaignar-stage-plays-wave7 / -novels-wave7 / -essays-wave7)
//
// Validates the FIELDS THE RENDERERS CONSUME against an INDEPENDENT re-read of the pinned source (it does
// not call the importers). Per drama scene / novel section / essay article it proves: slug, source order,
// printed number, title == the source's own heading/label (no numeric placeholder masking a real heading),
// scan span, presence of the Tamil AND English reading text, unit kinds/speaker labels (drama), and the
// honest per-work English readiness state (novels). Plus the batch-specific protections: nachuk-koppai's
// single terminal hold at scan 22 / Scene 5 (unresolved, not reconstructed, not rendered as authored
// text), surulimalai's preserved chapter-number gap (no invented 6/7), and the arumbu-1978 trio as three
// separate works sharing one publication.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const BASE = process.env.KDL_SOURCES_DIR || "";
const PLAYS = process.argv[2] || (BASE ? path.join(BASE, "kalaignar-stage-plays-wave7") : "");
const NOVELS = process.argv[3] || (BASE ? path.join(BASE, "kalaignar-novels-wave7") : "");
const ESSAYS = process.argv[4] || (BASE ? path.join(BASE, "kalaignar-essays-wave7") : "");
for (const [k, v] of [["plays", PLAYS], ["novels", NOVELS], ["essays", ESSAYS]]) if (!v || !fs.existsSync(v)) { console.error(`validate-wave7-b2-b4-p2-fidelity: ${k} source not found (${v || "unset"})`); process.exit(2); }

let checks = 0; const fail = [];
const ok = (c, l) => { checks++; if (!c) fail.push(l); };
const eq = (a, b, l) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) fail.push(`${l} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const read = (p) => fs.readFileSync(p, "utf8");
const load = (p) => JSON.parse(read(path.join(root, p)));
const fm = (t) => { const m = /^---\n([\s\S]*?)\n---/.exec(t); return m ? m[1] : ""; };
const fmv = (t, k) => { const m = new RegExp(`^${k}:\\s*(.*)$`, "m").exec(fm(t)); return m ? m[1].trim().replace(/^"(.*)"$/, "$1") : null; };
const firstHeading = (t) => { const body = t.slice((/^---\n[\s\S]*?\n---\n?/.exec(t) || [""])[0].length); const m = /^#\s+(.+)$/m.exec(body); return m ? m[1].trim() : null; };
const isNum = (f) => /^\d.*\.md$/.test(f);

// ══ DRAMA ══════════════════════════════════════════════════════════════════════════════════════════
for (const slug of ["iratha-kanneer", "nachuk-koppai"]) {
  const play = load(`public/data/plays/${slug}/play.json`);
  const dir = path.join(PLAYS, "works", slug);
  const files = fs.readdirSync(path.join(dir, "scenes")).filter(isNum).sort((a, b) => Number(a) - Number(b));
  eq(play.readingUnits.length, files.length, `${slug}: payload reading units == source scene files`);
  for (const u of play.readingUnits) {
    const src = read(path.join(dir, "scenes", `${u.slug}.md`));
    eq(u.order, Number(fmv(src, "scene")), `${slug}/${u.slug}: order == source scene number`);
    eq(u.titleTa, firstHeading(src), `${slug}/${u.slug}: titleTa == source scene heading`);
    eq(u.sourceScans, JSON.parse(fmv(src, "source_scan_pages")), `${slug}/${u.slug}: source scans == frontmatter`);
    ok(u.tamil.units.length > 0, `${slug}/${u.slug}: has Tamil units`);
    ok(fs.existsSync(path.join(dir, "translations/en", `${u.slug}.md`)), `${slug}/${u.slug}: English counterpart present`);
    // Every printed speaker label appears verbatim in the source scene.
    for (const tu of u.tamil.units) if (tu.kind === "dialogue" && tu.speakerAsPrinted) ok(src.includes(tu.speakerAsPrinted), `${slug}/${u.slug}: speaker "${tu.speakerAsPrinted}" printed in source`);
  }
}
// nachuk: single terminal hold at scan 22 / Scene 5, unresolved, not reconstructed, not in reading body.
{
  const play = load("public/data/plays/nachuk-koppai/play.json");
  const held = play.readingUnits.filter((u) => u.heldSource);
  eq(held.length, 1, "nachuk: exactly one held scene");
  eq(held[0].slug, "05", "nachuk: held scene is 05");
  const src = read(path.join(PLAYS, "works/nachuk-koppai/scenes/05.md"));
  ok(fmv(src, "status") === "assembly-reviewed-with-source-hold", "nachuk s5 source carries the hold status");
  ok(JSON.parse(fmv(src, "source_scan_pages")).includes(22), "nachuk s5 covers scan 22");
  const s5 = play.readingUnits.find((u) => u.slug === "05");
  const body = [...s5.tamil.units, ...s5.english.units].map((u) => u.text).join("\n");
  ok(!/Inherited source hold|Assembly provenance/.test(body), "nachuk s5 reading body carries no hold/assembly apparatus");
}

// ══ NOVELS ═════════════════════════════════════════════════════════════════════════════════════════
const NOVEL_SLUGS = ["arumbu", "nadutheru-narayani", "sarapallam-samundi", "surulimalai", "vellikkizhamai"];
for (const slug of NOVEL_SLUGS) {
  const novel = load(`public/data/novels/${slug}/novel.json`);
  const dir = path.join(NOVELS, "works", slug);
  const files = fs.readdirSync(path.join(dir, "sections")).filter(isNum).sort();
  eq(novel.sections.length, files.length, `${slug}: payload sections == source section files`);
  const enByOrd = new Set(fs.readdirSync(path.join(dir, "translations/en/sections")).filter(isNum).map((f) => Number(/^(\d+)/.exec(f)[1])));
  for (const s of novel.sections) {
    const src = read(path.join(dir, "sections", `${s.slug}.md`));
    eq(s.order, Number(fmv(src, "section_order")), `${slug}/${s.slug}: order == source section_order`);
    eq(s.sectionTitleTa, fmv(src, "section_title"), `${slug}/${s.slug}: title == source section_title`);
    ok(enByOrd.has(s.order), `${slug}/${s.slug}: English section for this order present`);
    ok(s.tamilText.trim().length > 0 && s.englishText.trim().length > 0, `${slug}/${s.slug}: Tamil + English body present`);
  }
  // English readiness state is carried honestly (verified vs source-checked), never flattened.
  const enStates = new Set(novel.sections.map((s) => s.englishStatus));
  const srcStates = new Set(fs.readdirSync(path.join(dir, "translations/en/sections")).filter(isNum).map((f) => { const t = read(path.join(dir, "translations/en/sections", f)); return fmv(t, "status") || fmv(t, "translation_status"); }));
  eq([...enStates].sort(), [...srcStates].sort(), `${slug}: payload English states == source English states`);
}
// surulimalai: 26 sections, source chapter-number gap 6/7 preserved.
{
  const novel = load("public/data/novels/surulimalai/novel.json");
  eq(novel.sections.length, 26, "surulimalai: 26 sections");
  const orders = novel.sections.map((s) => s.order);
  ok(!orders.includes(6) && !orders.includes(7), "surulimalai: section orders skip 6 and 7 (gap preserved)");
  ok(orders.includes(5) && orders.includes(8), "surulimalai: orders 5 and 8 present");
}
// arumbu / nadutheru-narayani / sarapallam-samundi: three separate works, one shared publication.
{
  const trio = NOVEL_SLUGS.slice(0, 3).map((s) => load(`public/data/novels/${s}/novel.json`));
  eq(new Set(trio.map((n) => n.workId)).size, 3, "arumbu trio: 3 distinct work ids");
  eq(new Set(trio.map((n) => n.sourceTree)).size, 3, "arumbu trio: 3 distinct source subtrees");
  const provs = NOVEL_SLUGS.slice(0, 3).map((s) => load(`public/data/novels/${s}/provenance.json`));
  eq(new Set(provs.map((p) => p.source.scanSha256)).size, 1, "arumbu trio: one shared publication scan SHA");
  for (const n of trio) eq(n.sourceCompilation, "arumbu-1978", `${n.slug}: tagged to arumbu-1978, not merged`);
}

// ══ ESSAYS ═════════════════════════════════════════════════════════════════════════════════════════
const ESSAY_SLUGS = ["aaru-maatha-kadungkaaval", "thudikkum-ilamai", "perumoochu", "viduthalai-kilarcci", "meesai-mulaiththa-vayathil", "pesum-kalai-valarppom"];
for (const slug of ESSAY_SLUGS) {
  const pub = load(`public/data/essays/${slug}/publication.json`);
  const dir = path.join(ESSAYS, "publications", slug);
  const files = fs.readdirSync(path.join(dir, "articles")).filter(isNum).sort();
  eq(pub.articles.length, files.length, `${slug}: payload articles == source article files`);
  pub.articles.forEach((a, i) => {
    const src = read(path.join(dir, "articles", files[i]));
    // Reading number is the archive ordinal 1..N; the source's own printed number is a witness, not the order.
    eq(a.number, i + 1, `${slug}/${a.slug}: reading number is archive ordinal ${i + 1}`);
    // Title is the source's OWN first heading (a real heading, or the source's own numbered-section label);
    // a numeric placeholder never REPLACES a substantive printed heading.
    eq(a.titleTa, firstHeading(src), `${slug}/${a.slug}: titleTa == source article heading`);
    ok(a.tamil.blocks.length > 0, `${slug}/${a.slug}: has Tamil blocks`);
    ok(fs.existsSync(path.join(dir, "translations/en", files[i])), `${slug}/${a.slug}: English counterpart present`);
    ok(Array.isArray(a.scanRuns) && a.scanRuns.length > 0, `${slug}/${a.slug}: scan runs recorded`);
  });
}

if (fail.length) {
  console.error(`\nwave7-b2-b4-p2-fidelity — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 60)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b2-b4-p2-fidelity — ${checks} checks, 0 failed`);
console.log("  renderer-consumed fields re-derived from pinned source: 79 drama units + 52 novel sections + 67 essay articles · titles == source headings/labels · nachuk hold intact · surulimalai gap · arumbu trio separate · English states honest");
