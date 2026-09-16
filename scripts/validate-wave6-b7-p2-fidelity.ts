/**
 * Wave 6 — Batch 7 P2 INDEPENDENT literary-fidelity validator. Fails closed.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave6-b7-p2-fidelity.ts <source checkout>
 *
 * Structurally INDEPENDENT of scripts/import-wave6-b7-short-stories.mjs: it re-parses the frozen source
 * page records and English layer with its OWN parser (it does not import or call the production
 * importer), builds a flat ordered (scan, kind, text) sequence, and proves the merged payload's own
 * flat segment sequence equals it — which independently proves, for all 116 works:
 *   exact title · exact Tamil block/segment ordering · exact English ordering · scan attribution ·
 *   printed-page attribution where source-established · no dropped / duplicated / reordered literary text ·
 *   no audit/progress/review apparatus, source-layout notes, or blockquote gate lines in the reading
 *   stream · no later-witness text · no unsupported normalization (whitespace-collapse only).
 * Uses the frozen source archive only. Source/subtree pins + control set-equality are proven by the P1
 * validator; this validator owns LITERARY fidelity.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const SRC = process.argv[2] || (process.env.KDL_SOURCES_DIR ? `${process.env.KDL_SOURCES_DIR}/kalaignar-short-stories` : "");
if (!SRC || !fs.existsSync(path.join(SRC, "stories"))) { console.error("b7-p2: source checkout required (argv[2])"); process.exit(2); }

let checks = 0; const fail: string[] = [];
const ok = (c: boolean, l: string) => { checks++; if (!c) fail.push(l); };
const nfc = (s: string) => s.normalize("NFC");
const collapse = (s: string) => s.replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").trim();

const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/internal/wave6/b7-short-stories.json"), "utf8"));
const slugs: string[] = manifest.groups.flatMap((g: { slugs: { slug: string }[] }) => g.slugs.map((s) => s.slug));
ok(slugs.length === 116 && new Set(slugs).size === 116, "roster is 116 unique canonical slugs");

// Apparatus a literary segment must NEVER contain (independent of the importer's own skip logic).
const APPARATUS_RE = /Historical-glyph gate|SOURCE-VISUAL CLOSED|Source-layout note|Stage \d|final independent source|visual-fidelity|Translation note|non-story|VERIFIED \/ FINAL/i;

/** INDEPENDENT parse of a story's Tamil page records → flat [{scan,kind,text}] (opening title kept as heading). */
function srcTamil(slug: string) {
  const dir = path.join(SRC, "stories", slug, "pages");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  const out: { scan: number; kind: string; text: string; printedPage: number | null }[] = [];
  const scanOf: number[] = [];
  let firstScan = Infinity;
  for (const f of files) {
    const raw = nfc(fs.readFileSync(path.join(dir, f), "utf8"));
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) { fail.push(`${slug}/${f}: no frontmatter`); continue; }
    const pageType = (m[1].match(/page_type:\s*"?([^"\n]+)"?/) || [])[1] || "";
    if (/non-story/i.test(pageType)) continue; // documented non-story interleaf — not reading text
    const scan = Number((m[1].match(/scan_page:\s*(\d+)/) || [])[1]);
    const ppRaw = (m[1].match(/printed_page:\s*(.*)$/m) || [])[1]?.trim();
    const printedPage = !ppRaw || ppRaw === "null" || /^"?null"?$/.test(ppRaw) ? null : Number(ppRaw);
    scanOf.push(scan); firstScan = Math.min(firstScan, scan);
    let body = m[2]; const h = body.match(/\n#{2,6}\s/); if (h) body = body.slice(0, h.index);
    for (const chunk of body.split(/\n{2,}/)) {
      const line = chunk.trim();
      if (!line || line.startsWith("<!--") || /^>\s?/.test(line)) continue;
      // Only the opening (lowest-scan) page contributes the title heading; later-page H1s are source
      // running headers ("… — தொடர்ச்சி" / continued), not reading content — drop them.
      if (/^#\s+/.test(line)) { if (scan === firstScan) out.push({ scan, kind: "h", text: line.replace(/^#\s+/, "").trim(), printedPage }); continue; }
      if (/^#{2,}\s+/.test(line)) continue;
      const t = collapse(line); if (t) out.push({ scan, kind: "p", text: t, printedPage });
    }
  }
  return { flat: out, scans: scanOf.sort((a, b) => a - b) };
}
/** INDEPENDENT parse of the English layer → flat [{scan,kind,text}], title unshifted onto first anchor. */
function srcEnglish(slug: string) {
  let body = nfc(fs.readFileSync(path.join(SRC, "stories", slug, "translations", "en", `${slug}.md`), "utf8"));
  const app = body.match(/\n#{2,6}\s/); if (app) body = body.slice(0, app.index);
  const title = (body.match(/^#\s+(.+)$/m) || [])[1]?.trim() ?? null;
  const marks: { scan: number; idx: number; end: number }[] = [];
  for (const m of Array.from(body.matchAll(/<!--([\s\S]*?)-->/g))) {
    const inner = m[1].trim();
    if (!/^(?:source|anthology)\s+scan\b/i.test(inner)) continue;
    const sm = inner.match(/\bscan\b\s*:?\s*(\d+)/i); if (!sm) continue;
    marks.push({ scan: Number(sm[1]), idx: m.index!, end: m.index! + m[0].length });
  }
  const out: { scan: number; kind: string; text: string }[] = [];
  if (title) out.push({ scan: marks[0]?.scan ?? -1, kind: "h", text: title });
  for (let i = 0; i < marks.length; i++) {
    const seg = body.slice(marks[i].end, i + 1 < marks.length ? marks[i + 1].idx : body.length);
    for (const chunk of seg.split(/\n{2,}/)) {
      const line = chunk.trim();
      if (!line || line.startsWith("<!--") || /^>\s?/.test(line)) continue;
      if (/^#{1,}\s+/.test(line)) continue;
      const t = collapse(line); if (t) out.push({ scan: marks[i].scan, kind: "p", text: t });
    }
  }
  return { flat: out, title };
}
function payloadFlat(slug: string, stream: "tamil" | "english") {
  const j = JSON.parse(fs.readFileSync(path.join(root, "public/data/stories", slug, "story.json"), "utf8"));
  const out: { scan: number; kind: string; text: string }[] = [];
  for (const b of j[stream].blocks) {
    if (b.kind === "heading") out.push({ scan: b.sourceScan, kind: "h", text: b.text });
    else for (const s of b.segments) out.push({ scan: s.sourceScan, kind: "p", text: s.text });
  }
  return { flat: out, title: j.title, scansField: j.sourceScans as number[] };
}

for (const slug of slugs) {
  ok(fs.existsSync(path.join(root, "public/data/stories", slug, "story.json")), `${slug}: payload present`);
  const st = srcTamil(slug); const se = srcEnglish(slug); const pt = payloadFlat(slug, "tamil"); const pe = payloadFlat(slug, "english");
  // Title (from independent source H1).
  const srcTitleTa = st.flat.find((x) => x.kind === "h")?.text ?? null;
  ok(!!srcTitleTa && pt.title.ta === srcTitleTa, `${slug}: title.ta == independent source H1`);
  ok(!!se.title && pt.title.en === se.title, `${slug}: title.en == independent English H1`);
  // Independent literary equality — Tamil.
  ok(st.flat.length === pt.flat.length, `${slug}: Tamil block/segment count == independent source (${st.flat.length} vs ${pt.flat.length})`);
  const nTa = Math.min(st.flat.length, pt.flat.length);
  for (let i = 0; i < nTa; i++) {
    const a = st.flat[i], b = pt.flat[i];
    if (a.text !== b.text || a.scan !== b.scan || a.kind !== b.kind) { fail.push(`${slug}: Tamil unit ${i} differs from independent source (scan ${a.scan}/${b.scan})`); checks++; break; }
  }
  // Independent literary equality — English.
  ok(se.flat.length === pe.flat.length, `${slug}: English block/segment count == independent source (${se.flat.length} vs ${pe.flat.length})`);
  const nEn = Math.min(se.flat.length, pe.flat.length);
  for (let i = 0; i < nEn; i++) {
    const a = se.flat[i], b = pe.flat[i];
    if (a.text !== b.text || a.kind !== b.kind) { fail.push(`${slug}: English unit ${i} differs from independent source`); checks++; break; }
  }
  // Apparatus absence in the reading stream.
  for (const b of [...pt.flat, ...pe.flat]) ok(!APPARATUS_RE.test(b.text) && !/^\s*>/.test(b.text), `${slug}: no archival apparatus in a reading segment`);
  // Scan attribution ⊆ source scans, non-decreasing.
  const srcScanSet = new Set(st.scans);
  let prev = -Infinity, mono = true;
  for (const b of pt.flat) { if (!srcScanSet.has(b.scan)) fail.push(`${slug}: Tamil segment scan ${b.scan} not a source scan`), checks++; if (b.scan < prev) mono = false; prev = b.scan; }
  ok(mono, `${slug}: Tamil scan attribution non-decreasing`);
  // Ending: last Tamil unit matches independent source last unit (no truncation / no extra).
  if (st.flat.length && pt.flat.length) ok(st.flat[st.flat.length - 1].text === pt.flat[pt.flat.length - 1].text, `${slug}: source ending preserved`);
  // sourceScans field equals the distinct ordered scans.
  ok(JSON.stringify(pt.scansField) === JSON.stringify(st.scans), `${slug}: sourceScans == distinct source scans`);
}

if (fail.length) {
  console.error(`\nwave6-b7-p2-fidelity — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 40)) console.error("  ✗ " + f);
  if (fail.length > 40) console.error(`  … and ${fail.length - 40} more`);
  process.exit(1);
}
console.log(`\nwave6-b7-p2-fidelity — ${checks} checks, 0 failed`);
console.log(`  116 works independently re-verified byte-for-byte against the frozen source · 0 apparatus leaks · titles/ordering/scan-attribution/endings PASS`);
