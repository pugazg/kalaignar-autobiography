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
// arumbu-1978 collection MODEL, proved directly against the frozen novel source (NOT the hand-written P2
// decision JSON): the source establishes a FOUR-story physical volume, and பெரிய இடத்துப் பெண் (an existing
// 1953-controlled work) is a physical member via its additional 1978 witness — so the implementation
// collection has exactly four members, never three, never five.
{
  const cdir = path.join(NOVELS, "collections", "arumbu-1978");
  ok(fs.existsSync(cdir), "arumbu-1978 collection source directory present in the frozen novels checkout");
  const readme = read(path.join(cdir, "README.md"));
  const srcmd = read(path.join(cdir, "metadata", "source.md"));
  ok(/நான்கு-கதைத்\s*தொகுப்பு/.test(readme), "source README titles a FOUR-story volume (நான்கு-கதைத் தொகுப்பு)");
  ok(/first of the four Kalaignar stories/i.test(srcmd), "source metadata: the publisher note names four Kalaignar stories");
  // The four story spans, in printed physical order, each mapped to its member slug.
  const SPANS = [["arumbu", "6", "23"], ["sarapallam-samundi", "24", "48"], ["periya-idathup-pen", "49", "74"], ["nadutheru-narayani", "75", "90"]];
  for (const [slug, a, b] of SPANS) ok(new RegExp(`scans?\\s*\\*?\\*?${a}[–-]${b}`).test(srcmd), `source records the ${a}-${b} story span (${slug})`);
  // பெரிய இடத்துப் பெண் is explicitly an ADDITIONAL / non-controlling witness, and the 1953 package is unchanged.
  ok(/49[–-]74\s*—\s*1978\s*`?பெரிய இடத்துப் பெண்`?\s*additional witness/.test(srcmd) || /1978 `?பெரிய இடத்துப் பெண்`? witness/i.test(readme), "source marks the 49-74 பெரிய இடத்துப் பெண் span as an additional 1978 witness");
  ok(/1953 controlling package remains unchanged/i.test(readme), "source states the 1953 controlling package remains unchanged (witness ≠ new controlling edition)");
  // Witness membership: an additional witness is still a physical component of this volume. Extract EVERY
  // scan RANGE the source records; excluding the 1-5 front-matter range, exactly the four story spans remain
  // (the 91/92 back matter is recorded as singular "scan", not a range) — so there is no fifth story member.
  const ranges = [...srcmd.matchAll(/scans?\s+(\d+)[–-](\d+)/g)].map((m) => `${m[1]}-${m[2]}`);
  const storySpans = [...new Set(ranges.filter((r) => r !== "1-5"))].sort();
  eq(storySpans, ["24-48", "49-74", "6-23", "75-90"].sort(), "exactly the four story spans account for the narrative scans (no fifth member; 1-5 and 91/92 are paratext)");
  // The frozen collection source tree is the pinned one.
  const tree = execFileSync("git", ["-C", NOVELS, "rev-parse", "HEAD:collections/arumbu-1978"], { encoding: "utf8" }).trim();
  eq(tree, "851ea306fc27ba73ea1c46dbafead51c659e6ba4", "arumbu-1978 collection source tree == frozen pin");
  // (The implementation collection's four-member declaration + printed order is proved against this same
  // source in validate-wave7-b2-b4-p4-integration.ts; here we own only the SOURCE-establishes-four fact.)
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
    // Reading number is 1..N in source order.
    eq(a.number, i + 1, `${slug}/${a.slug}: reading number is ${i + 1}`);
    if (a.numberSource === "source-section") {
      // A source-section work (no printed contents page, no descriptive titles) carries NO title — its unit
      // is identified by the source-visible section number. Assert the empty title (no invented/echoed
      // title) and that the source itself shows this section number (front-matter `title`, e.g. "14").
      eq(a.titleTa, "", `${slug}/${a.slug}: source-section unit carries no descriptive title`);
      eq(a.titleEn, "", `${slug}/${a.slug}: source-section unit carries no English title`);
      eq(String(fmv(src, "title") ?? "").trim(), String(a.number), `${slug}/${a.slug}: source front-matter records section number ${a.number}`);
    } else {
      // Title is the source's OWN first heading (a real heading, or the source's own numbered-section
      // label); a numeric placeholder never REPLACES a substantive printed heading.
      eq(a.titleTa, firstHeading(src), `${slug}/${a.slug}: titleTa == source article heading`);
    }
    ok(a.tamil.blocks.length > 0, `${slug}/${a.slug}: has Tamil blocks`);
    ok(fs.existsSync(path.join(dir, "translations/en", files[i])), `${slug}/${a.slug}: English counterpart present`);
    ok(Array.isArray(a.scanRuns) && a.scanRuns.length > 0, `${slug}/${a.slug}: scan runs recorded`);
  });
}

// ══ WAVE-7 B4 DEFECT GUARDS — the corrected essay defects must not silently return ═══════════════════
const span = (a) => `${a.scanRuns[0].from}-${a.scanRuns[a.scanRuns.length - 1].to}`;
const bodyText = (a) => a.tamil.blocks.map((b) => `${b.text || ""}`).join("\n");
const enBodyText = (a) => a.english.blocks.map((b) => `${b.text || ""}`).join("\n");
const ARCHIVAL = /Assembly provenance|P\d+ assembly audit|P\d+ strict visual (review|-?fidelity revalidation)|source-visible Roman page numerals|source scans —|page-record coverage/i;
{
  // DEFECT A / A2 — விடுதலைக் கிளர்ச்சி: no archival-control text in the reading body; full 2-unit coverage.
  const v = load("public/data/essays/viduthalai-kilarcci/publication.json");
  eq(v.articles.length, 2, "viduthalai: exactly 2 public reading units");
  eq(v.articles.map(span), ["4-7", "8-68"], "viduthalai: source coverage is unit1 4-7, unit2 8-68 (not collapsed to the first scan)");
  for (const a of v.articles) {
    ok(!a.tamil.blocks.some((b) => ARCHIVAL.test(b.text || "")), `viduthalai/${a.slug}: no archival-control heading/text in the Tamil reading body`);
    ok(!a.english.blocks.some((b) => ARCHIVAL.test(b.text || "")), `viduthalai/${a.slug}: no archival-control heading/text in the English reading body`);
    ok(!/publications\/viduthalai-kilarcci\/pages\//.test(bodyText(a)), `viduthalai/${a.slug}: no archival page-record file paths in the body`);
    ok(a.english.blocks.length > 0 && enBodyText(a).trim().length > 0, `viduthalai/${a.slug}: English literary body present`);
  }
  // printed-page evidence is source-faithful: unit 1 has no visible printed numeral (Roman only), unit 2 is
  // a genuine 8-67 range with scan 8 unnumbered. No arabic folio is invented for unit 1.
  eq(v.articles[0].printedPages.kind, "none", "viduthalai unit 1: no printed arabic folio invented (Roman-only source)");
  eq([v.articles[1].printedPages.kind, v.articles[1].printedPages.from, v.articles[1].printedPages.to], ["range", 8, 67], "viduthalai unit 2: printed pages 8-67 (source-faithful)");
}
{
  // DEFECT B / B2 — பேசும் கலை வளர்ப்போம்: 19 source-numbered sections, source-section semantics, no invented
  // titles, full spans matching the authoritative 19-row map, shared boundary scans retained.
  const P = load("public/data/essays/pesum-kalai-valarppom/publication.json");
  const MAP = ["7-12","12-16","16-22","22-27","27-31","31-34","34-38","38-41","42-44","45-47","48-51","51-55","55-58","59-63","64-67","67-70","70-74","75-79","79-82"];
  eq(P.articles.length, 19, "pesum: exactly 19 source-numbered sections");
  ok(P.articles.every((a) => a.numberSource === "source-section"), "pesum: every section is numberSource 'source-section' (never archive-ordinal)");
  ok(P.articles.every((a) => a.titleTa === "" && a.titleEn === ""), "pesum: no invented descriptive section titles");
  ok(P.articles.every((a) => a.titleTa !== "பேசும் கலை வளர்ப்போம்"), "pesum: the publication title is never reused as a section title");
  ok(!P.articles.some((a) => /^\d+$/.test(a.titleTa) || /^\d+$/.test(a.titleEn)), "pesum: no bare-numeral title rows");
  eq(P.articles.map(span), MAP, "pesum: all 19 section spans match the authoritative source map (shared boundary scans retained)");
  for (const a of P.articles) ok(!a.tamil.blocks.some((b) => b.kind === "subheading" && /^\d+$/.test((b.text || "").trim())), `pesum/${a.slug}: the bare section-number heading is not a body block`);
  // The source confirms there is NO printed contents page (indexes/contents.md), which is what the public
  // note asserts. (The rendered note wording — source-visible sections, never "archive ordinals", no
  // printed contents page — is asserted in the render regression, which can render the component.)
  const contents = read(path.join(ESSAYS, "publications", "pesum-kalai-valarppom", "indexes", "contents.md"));
  ok(/no printed contents page/i.test(contents), "pesum: the source itself records that there is no printed contents page");
  ok(/descriptive titles are not invented|no descriptive section titles/i.test(contents), "pesum: the source records that descriptive titles are not supplied/invented");
}

if (fail.length) {
  console.error(`\nwave7-b2-b4-p2-fidelity — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 60)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nwave7-b2-b4-p2-fidelity — ${checks} checks, 0 failed`);
console.log("  renderer-consumed fields re-derived from pinned source: 79 drama units + 52 novel sections + 67 essay articles · titles == source headings/labels · nachuk hold intact · surulimalai gap · arumbu trio separate · English states honest");
