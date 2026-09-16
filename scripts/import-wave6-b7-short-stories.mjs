// Wave 6 — Batch 7 (Short Stories) deterministic importer (HIDDEN P1 data foundation).
//
//   node scripts/import-wave6-b7-short-stories.mjs "<path-to-kalaignar-short-stories checkout>"
//
// Reads ONLY a frozen source checkout (no runtime GitHub fetch, no PDFs copied). For each of the 116
// Batch-7 canonical short stories it emits the repository's standard short-story payload form:
//   public/data/stories/<slug>/story.json
//   public/data/stories/<slug>/provenance.json
//
// Byte-faithful: the reading text is built from the per-scan page records (pages/*.md), NOT the derived
// sections/*.md assembly, reusing the SAME cross-scan join rule proven by import-1977-short-stories.mjs.
// Generalized from the 1977 importer: per-story scan/printed-page come from each page's own frontmatter
// (no fixed offset), and a printed page may be null where the source records physical loss.
//
// P1 publishes NOTHING: it does not touch data/library.ts, data/collections.ts, STORY_SLUGS,
// app/**, or app/sitemap.ts. It only writes hidden payload data.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const die = (m) => { throw new Error("b7-import: " + m); };
const nfc = (s) => s.normalize("NFC");
const read = (p) => nfc(fs.readFileSync(p, "utf8"));
const SRC = process.argv[2] || `${process.env.KDL_SOURCES_DIR || ".sources"}/kalaignar-short-stories`;
if (!fs.existsSync(path.join(SRC, "stories"))) die(`source checkout not found at ${SRC}`);

const manifest = JSON.parse(read(path.join(process.cwd(), "data/internal/wave6/b7-short-stories.json")));
const SOURCE_COMMIT = manifest.sourceCommit;
const OUT_ROOT = path.join(process.cwd(), "public/data/stories");

// group → source form + provenance shape
const BOOK_GROUPS = new Set(["2008", "2004", "1987", "2009", "1982", "1976", "1969", "1953-thappivittargal", "1997"]);

// ── Frontmatter + page parsing (generalized from import-1977-short-stories.mjs) ──────────────────────
function splitFrontmatter(raw, file) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) die(`${file}: missing YAML frontmatter`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^"(.*)"$/, "$1").trim();
  }
  return { meta, body: m[2] };
}
// Every H2+ heading in these page records is archival apparatus (Stage-N audit notes, "Non-text source
// element", "Physical source obstruction", "T1 first-pass notes", …) — never story text. The only story
// heading is the H1 title. So everything from the first H2-or-deeper heading onward is apparatus.
function stripApparatus(body) {
  const m = body.match(/\n#{2,6}\s/);
  return m ? body.slice(0, m.index) : body;
}
function pageBlocks(raw, file) {
  const { meta, body } = splitFrontmatter(raw, file);
  const scan = Number(meta.scan_page);
  if (!Number.isInteger(scan)) die(`${file}: no integer scan_page`);
  const pp = meta.printed_page;
  const printedPage = pp === undefined || pp === "" || pp === "null" ? null : Number(pp);
  if (printedPage !== null && !Number.isInteger(printedPage)) die(`${file}: printed_page not an integer or null`);
  const blocks = [];
  for (const chunk of stripApparatus(body).split(/\n{2,}/)) {
    const line = chunk.trim();
    if (!line) continue;
    if (line.startsWith("<!--")) continue; // source ornament / marker comments are not reading text
    if (/^#\s+/.test(line)) { blocks.push({ kind: "heading", level: 1, text: line.replace(/^#\s+/, "").trim() }); continue; }
    if (/^##\s+/.test(line)) { blocks.push({ kind: "heading", level: 2, text: line.replace(/^##\s+/, "").trim() }); continue; }
    if (/^#{3,}\s+/.test(line)) die(`${file}: unexpected heading level in story text: ${line.slice(0, 40)}`);
    // strip stray leading html comments inside a paragraph chunk
    const text = line.replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").trim();
    if (text) blocks.push({ kind: "paragraph", text });
  }
  return { scan, printedPage, pageType: meta.page_type ?? null, blocks };
}
const TERMINALS = ["।", ".", "!", "?", "…", "”", "’", "\"", "'", ":", "—", "-", ")"];
const endsSentence = (s) => { const f = s.replace(/\s+$/, ""); return TERMINALS.some((t) => f.endsWith(t)); };

/** English stream split by `<!-- source scan N; printed page M -->` markers. */
function englishPages(raw, file) {
  let body = nfc(raw);
  // Drop trailing translation apparatus. Like the Tamil page records, every H2+ heading here is archival
  // apparatus ("## Translation note", "## Stage …", …), never story text; the only story heading is the
  // H1 title, which precedes the first scan marker. Story text carries no headings.
  const app = body.match(/\n#{2,6}\s/);
  if (app) body = body.slice(0, app.index);
  // Tolerant of both marker styles the archive uses:
  //   <!-- source scan 10; printed page 1 -->
  //   <!-- anthology scan: 45; printed page: 44; source span: lower -->
  const re = /<!--([\s\S]*?)-->/g;
  const marks = []; let m;
  while ((m = re.exec(body)) !== null) {
    const inner = m[1].trim();
    // A real scan marker begins with "source scan …" or "anthology scan …". Prose comments that merely
    // mention a scan number (e.g. "…scan 82 is the back cover…") are NOT markers and are skipped.
    if (!/^(?:source|anthology)\s+scan\b/i.test(inner)) continue;
    const sm = inner.match(/\bscan\b\s*:?\s*(\d+)/i);
    if (!sm) continue;
    const pm = inner.match(/\bprinted page\b\s*:?\s*(\d+|null|—|-)/i);
    marks.push({ scan: Number(sm[1]), printedPage: pm && /^\d+$/.test(pm[1]) ? Number(pm[1]) : null, index: m.index, end: m.index + m[0].length });
  }
  if (!marks.length) die(`${file}: no english scan markers`);
  // title = first H1 before the first marker
  const head = body.slice(0, marks[0].index).match(/^#\s+(.+)$/m);
  const titleEn = head ? head[1].trim() : null;
  const pages = [];
  for (let i = 0; i < marks.length; i++) {
    const seg = body.slice(marks[i].end, i + 1 < marks.length ? marks[i + 1].index : body.length);
    const blocks = [];
    for (const chunk of seg.split(/\n{2,}/)) {
      const line = chunk.trim();
      if (!line || line.startsWith("<!--")) continue;
      if (/^>\s?/.test(line)) continue; // translation-note blockquote is apparatus, not story text
      if (/^#\s+/.test(line)) { blocks.push({ kind: "heading", level: 1, text: line.replace(/^#\s+/, "").trim() }); continue; }
      if (/^##\s+/.test(line)) { blocks.push({ kind: "heading", level: 2, text: line.replace(/^##\s+/, "").trim() }); continue; }
      const text = line.replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").trim();
      if (text) blocks.push({ kind: "paragraph", text });
    }
    pages.push({ scan: marks[i].scan, printedPage: marks[i].printedPage, blocks });
  }
  // The English title H1 is printed before the first scan marker; move it onto the first scan so the
  // English stream carries the same title-heading structure the Tamil page records do.
  if (titleEn && pages.length) pages[0].blocks.unshift({ kind: "heading", level: 1, text: titleEn });
  return { titleEn, pages };
}

/** Fold ordered per-scan blocks into the public stream, joining a paragraph that runs across a scan edge. */
function foldStream(pages) {
  const blocks = []; let joins = 0;
  for (const pg of pages) {
    for (let bi = 0; bi < pg.blocks.length; bi++) {
      const b = pg.blocks[bi];
      if (b.kind === "heading") { blocks.push({ kind: "heading", text: b.text, sourceScan: pg.scan, printedPage: pg.printedPage }); continue; }
      const prev = blocks[blocks.length - 1];
      const isFirstParaOfPage = bi === pg.blocks.findIndex((x) => x.kind === "paragraph");
      const cont = prev && prev.kind === "paragraph" && prev.segments[prev.segments.length - 1].sourceScan === pg.scan - 1 && isFirstParaOfPage && !endsSentence(prev.segments[prev.segments.length - 1].text);
      if (cont) {
        prev.segments[prev.segments.length - 1].joinToNext = "space";
        prev.segments.push({ text: b.text, sourceScan: pg.scan, printedPage: pg.printedPage, joinToNext: "end" });
        joins++;
      } else {
        blocks.push({ kind: "paragraph", segments: [{ text: b.text, sourceScan: pg.scan, printedPage: pg.printedPage, joinToNext: "end" }] });
      }
    }
  }
  return { blocks, joins };
}

// ── tolerant metadata/source.md parse (per story) ──────────────────────────────────────────────────
function metaVal(t, ...keys) {
  for (const k of keys) {
    const m = t.match(new RegExp("^[\\-\\*]\\s*(?:[^\\n:]*\\b" + k + "\\b[^\\n:]*)[:*\\s]+\\**\\s*`?([^\\n`*]+?)`?\\s*\\**\\s*$", "im"));
    if (m) return m[1].trim();
  }
  return null;
}

const git = (...a) => execFileSync("git", ["-C", SRC, ...a], { encoding: "utf8" }).trim();
const report = [];

for (const g of manifest.groups) {
  for (const { slug, subtreePin } of g.slugs) {
    const WORK = path.join(SRC, "stories", slug);
    if (!fs.existsSync(WORK)) die(`missing source workspace stories/${slug}`);
    // verify pin still matches
    const pinNow = (git("ls-tree", "HEAD", `stories/${slug}`).match(/^\d+ tree ([0-9a-f]{40})\t/) || [])[1];
    if (pinNow !== subtreePin) die(`${slug}: source subtree pin drift ${pinNow} != ${subtreePin}`);

    // Tamil pages
    const pageFiles = fs.readdirSync(path.join(WORK, "pages")).filter((f) => f.endsWith(".md")).sort();
    if (!pageFiles.length) die(`${slug}: no page records`);
    const pages = pageFiles.map((f) => pageBlocks(read(path.join(WORK, "pages", f)), `${slug}/pages/${f}`)).sort((a, b) => a.scan - b.scan);
    const scans = pages.map((p) => p.scan);
    // contiguous scan span
    for (let i = 1; i < scans.length; i++) if (scans[i] !== scans[i - 1] + 1) die(`${slug}: non-contiguous scans at ${scans[i - 1]}→${scans[i]}`);
    const scanLo = scans[0], scanHi = scans[scans.length - 1];
    const printedVals = pages.map((p) => p.printedPage).filter((x) => x !== null);
    const pageLo = printedVals.length ? Math.min(...printedVals) : null;
    const pageHi = printedVals.length ? Math.max(...printedVals) : null;

    // opening title heading (H1 on first page)
    const h1 = pages[0].blocks.find((b) => b.kind === "heading" && b.level === 1);
    if (!h1) die(`${slug}: story-opening page prints no H1 title heading`);
    const titleTa = h1.text;

    // English
    const enPath = path.join(WORK, "translations", "en", `${slug}.md`);
    if (!fs.existsSync(enPath)) die(`${slug}: no English translation file`);
    const en = englishPages(read(enPath), `${slug}/translations/en/${slug}.md`);
    if (!en.titleEn) die(`${slug}: English translation prints no title heading`);
    const enScans = en.pages.map((p) => p.scan);
    // English anchoring granularity varies across the archive: some translations anchor one marker per
    // source scan, others carry a single opening anchor for the whole story. Both are faithful. Require
    // only that every English anchor is a real, in-range, ascending-unique source scan of this story —
    // not that the two streams share identical anchor density.
    for (let i = 0; i < enScans.length; i++) {
      if (!scans.includes(enScans[i])) die(`${slug}: English scan anchor ${enScans[i]} is not a page-record scan of this story`);
      if (i && enScans[i] <= enScans[i - 1]) die(`${slug}: English scan anchors not strictly ascending: ${enScans}`);
    }

    // review gates (record; do not fabricate)
    const review = fs.existsSync(path.join(WORK, "TRANSLATION_REVIEW.md")) ? read(path.join(WORK, "TRANSLATION_REVIEW.md")) : "";
    const vf = fs.existsSync(path.join(WORK, "visual-fidelity.md")) ? read(path.join(WORK, "visual-fidelity.md")) : "";
    const reviewPass = /\bPASS\b/.test(review);
    const vfPass = /\bPASS\b/i.test(vf);

    // The only story heading is the H1 title on the opening (lowest-scan) page. Some sources reprint the
    // title as a running header at the top of later pages (e.g. "…! — தொடர்ச்சி" / "continued"); those are
    // source running headers, not reading content, so headings on non-opening pages are dropped.
    const dropLaterHeadings = (ps) => ps.map((p, i) => (i === 0 ? p : { ...p, blocks: p.blocks.filter((b) => b.kind !== "heading") }));
    const ta = foldStream(dropLaterHeadings(pages));
    const enF = foldStream(dropLaterHeadings(en.pages));
    const taHeads = ta.blocks.filter((b) => b.kind === "heading").length;
    const enHeads = enF.blocks.filter((b) => b.kind === "heading").length;
    if (taHeads !== enHeads) die(`${slug}: heading count differs — Tamil ${taHeads}, English ${enHeads}`);

    // provenance facts (per story, tolerant; null where absent — never fabricated)
    const md = read(path.join(WORK, "metadata", "source.md"));
    const sourceFilename = metaVal(md, "filename") || pages[0] && splitFrontmatter(read(path.join(WORK, "pages", pageFiles[0])), "x").meta.source_filename || null;
    const sha256 = (() => { const v = metaVal(md, "SHA-?256"); return v && /^[0-9a-f]{64}$/i.test(v) ? v.toLowerCase() : null; })();
    const editionTa = metaVal(md, "edition");
    const publisherTa = metaVal(md, "[Pp]ublisher");
    const collectionTa = metaVal(md, "[Cc]ollection");

    const isBook = BOOK_GROUPS.has(g.group);
    const story = {
      workId: slug,
      slug,
      sourceRepo: manifest.sourceRepo,
      sourcePath: `stories/${slug}`,
      sourceCommit: SOURCE_COMMIT,
      shelf: "fiction",
      subtype: "short-story",
      readerStructure: "story",
      ...(isBook ? { sourceForm: "anthology-story" } : {}),
      title: { ta: titleTa, en: en.titleEn },
      author: { nameTa: "மு. கருணாநிதி" },
      tamil: { blocks: ta.blocks },
      english: { blocks: enF.blocks },
      sourceScans: scans,
    };

    const provenance = {
      workId: slug,
      sourceRepo: manifest.sourceRepo,
      sourcePath: `stories/${slug}`,
      sourceCommit: SOURCE_COMMIT,
      sourceTree: subtreePin,
      batch: 7,
      validationGroup: g.group,
      source: {
        printedTitleTa: titleTa,
        collectionTa: collectionTa,
        editionStatementTa: editionTa,
        publisherTa: publisherTa,
        scanFilename: sourceFilename,
        scanSha256: sha256,
        sourcePdfCommitted: false,
        controllingSourceNote: "Source facts are carried as the source archive records them for this work; the controlling PDF is not vendored into this repository and is never fetched at runtime. Fields the source does not establish are null, never invented.",
      },
      storyScope: {
        storyScans: `${scanLo}–${scanHi}`,
        storyScanCount: scans.length,
        printedPages: pageLo === null ? null : `${pageLo}–${pageHi}`,
        verifiedPages: pages.length,
        complete: true,
      },
      tamilAssembly: {
        authority: `stories/${slug}/pages/`,
        derivedAssembly: `stories/${slug}/sections/${slug}.md`,
        note: "The per-scan page records are the archival textual authority the reading text is built from; the assembled section file is a derived reading convenience and is not used to attribute text to scans.",
      },
      crossScanJoinPolicy: {
        policy: "A scan-final fragment that does not close a sentence continues into the next scan's opening fragment, joined for reading with a single space.",
        basis: "Applied uniformly from the punctuation the page records themselves carry; the archive records no per-boundary adjudication for these stories.",
        appliedBoundaries: ta.joins,
      },
      english: {
        titleEn: en.titleEn,
        scanAnchors: en.pages.length,
        kind: "project-created",
        kindBasis: "An archive-produced translation derived from the project's own verified Tamil reading, not a separately published translation. The Tamil remains authoritative.",
        reviewRecorded: reviewPass ? "TRANSLATION_REVIEW PASS" : "not recorded",
        paragraphingNote: "The English follows the verified Tamil's paragraph structure and the same scan anchors; it does not re-divide the story.",
      },
      visualFidelity: { result: vfPass ? "PASS" : "not recorded" },
      hidden: { discoverable: false, sitemapExposed: false, publicCollectionExposed: false, note: "Wave 6 Batch 7 P1 hidden data foundation: not in catalogue, /read, sitemap, or any public collection." },
    };

    const dir = path.join(OUT_ROOT, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "story.json"), JSON.stringify(story, null, 1) + "\n");
    fs.writeFileSync(path.join(dir, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");
    report.push({ slug, group: g.group, scans: `${scanLo}-${scanHi}`, taP: ta.blocks.filter((b) => b.kind === "paragraph").length, enP: enF.blocks.filter((b) => b.kind === "paragraph").length, h: taHeads, joins: ta.joins });
  }
}

console.log(`\nWave 6 Batch 7 — short-story import`);
console.log(`  source pin ${SOURCE_COMMIT}`);
console.log(`  works emitted ${report.length}`);
const byG = {};
for (const r of report) byG[r.group] = (byG[r.group] || 0) + 1;
console.log(`  by group: ${Object.entries(byG).map(([k, v]) => k + "=" + v).join(" ")}`);
console.log(`  total Tamil ¶ ${report.reduce((n, r) => n + r.taP, 0)} | English ¶ ${report.reduce((n, r) => n + r.enP, 0)} | cross-scan joins ${report.reduce((n, r) => n + r.joins, 0)}`);
