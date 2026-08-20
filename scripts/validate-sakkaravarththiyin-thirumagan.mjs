// Validator for சக்கரவர்த்தியின் திருமகன் / "Chakravarthi's Son" — Digital Library Phase 5,
// Essays & Articles Benchmark #1.
//
// Validates the GENERATED reader structure, not just metadata constants. It RECONSTRUCTS both
// released layers from public/data/essays/<slug>/publication.json and proves exact equality with
// the source repository's released artifacts, and it derives its expectations from the source
// INDEPENDENTLY of the importer wherever practical — the Phase-4 Poetry review rejected a validator
// that checked the importer against the importer.
//
// Usage: node scripts/validate-sakkaravarththiyin-thirumagan.mjs <kalaignar-essays-clone>

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-sakkaravarththiyin-thirumagan.mjs <kalaignar-essays-clone>");
  process.exit(1);
}

const SLUG = "sakkaravarththiyin-thirumagan";
const PUB_DIR = path.join(SRC_REPO, "publications", SLUG);
const DATA = path.join(process.cwd(), "public/data/essays", SLUG);
const readText = (p) => fs.readFileSync(p, "utf8");

const pub = JSON.parse(readText(path.join(DATA, "publication.json")));
const prov = JSON.parse(readText(path.join(DATA, "provenance.json")));

let pass = 0;
const failures = [];
const check = (name, cond, detail) => (cond ? pass++ : failures.push(detail ? `${name} — ${detail}` : name));
const eq = (name, a, b) => check(name, JSON.stringify(a) === JSON.stringify(b), `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

// ── 1. SOURCE PIN AND IDENTITY ───────────────────────────────────────────────────────────────────
eq("source repo", pub.sourceRepo, "pugazg/kalaignar-essays");
eq("source path", pub.sourcePath, `publications/${SLUG}`);
eq("source commit", pub.sourceCommit, "bff35320b668cb5beeaafc5faa58260c4f4473f8");
eq("provenance pin agrees", [prov.sourceRepo, prov.sourcePath, prov.sourceCommit], [pub.sourceRepo, pub.sourcePath, pub.sourceCommit]);
eq("scan filename", prov.source.scanFilename, "TVA_BOK_0065662_சக்கரவர்த்தியின்_திருமகன்.pdf");
eq("scan SHA-256", prov.source.scanSha256, "5d7f8404a53c0766df896ddedf9978a3fd31f97b8e98625b70a93366412eb90d");
eq("scan size", prov.source.scanFileSizeBytes, 201858823);
eq("physical scans", prov.source.scanTotalPages, 83);
eq("printed page count", prov.source.printedPageCount, 80);
check("source PDF flag", prov.source.sourcePdfCommitted === false);
check("no PDF vendored", !fs.readdirSync(DATA).some((f) => f.toLowerCase().endsWith(".pdf")), `PDF found in ${DATA}`);
{
  const head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  check("pinned commit equals clone HEAD", head === pub.sourceCommit, `clone HEAD ${head}`);
  const dirty = execFileSync("git", ["-C", SRC_REPO, "status", "--porcelain"], { encoding: "utf8" }).trim();
  check("source clone unmodified", dirty === "", `${dirty.split("\n").length} change(s)`);
}
// Identity re-derived from the source's own metadata record, not from the importer.
{
  const meta = readText(path.join(PUB_DIR, "metadata/source.md"));
  check("metadata records the scan filename", meta.includes(prov.source.scanFilename));
  check("metadata records the SHA-256", meta.includes(prov.source.scanSha256));
  check("metadata records the byte size", meta.includes("201,858,823"));
  check("metadata records 83 scans", /Scan pages:\s*\*\*83\*\*/.test(meta));
  check("metadata records 80 printed pages", /பக்கங்கள்:\s*\*\*80\*\*/.test(meta));
}

// ── 2. EDITION DISTINCTION ───────────────────────────────────────────────────────────────────────
eq("first edition year", pub.firstEdition.year, 1956);
eq("controlling edition year", pub.controllingEdition.year, 2018);
check("first-edition statement is the source's", pub.firstEdition.statementTa.includes("முதற்பதிப்பு மே 1956") && pub.firstEdition.statementTa.includes("வேலூர் திராவிடன் பதிப்பகம்"));
check("controlling statement is the source's reprint line", pub.controllingEdition.statementTa.includes("மறு பதிப்பு - 2018"));
eq("title-page publisher line", pub.controllingEdition.publisherLineTa, "திராவிடர் கழக (இயக்க) வெளியீடு");
eq("provenance first edition", prov.source.firstEditionTa, pub.firstEdition.statementTa);
eq("provenance controlling edition", prov.source.controllingEditionTa, pub.controllingEdition.statementTa);
{
  // The controlling scan must never be described as a 1956 scan, and 1956 must not be erased.
  const blob = JSON.stringify({ pub, prov });
  // Only an AFFIRMATIVE claim is a defect. The provenance deliberately contains the negative
  // sentence "the controlling scan is never described as a 1956 scan", which must not trip this.
  const affirms1956Scan = /(?<!never described as )(?<!not )(?:a |the )1956 (?:scan|reprint)/i.test(blob);
  check("no affirmative '1956 scan/reprint' claim", !affirms1956Scan);
  check("the controlling edition is stated as the 2018 reprint", /2018 reprint/i.test(blob));
  check("1956 first-edition history retained", blob.includes("1956"));
  check("2018 recorded as the controlling/integrated edition", /2018/.test(blob));
  // Likewise: the rights note explicitly says the English renders the Tamil witness "rather than
  // substituting a separately published translation" — a denial, not a claim.
  const claimsSeparatelyPublished = /(?<!rather than substituting a )(?<!not a )separately published translation/i.test(blob);
  check("English translation is not described as separately published", !claimsSeparatelyPublished);
  check("English is described as project-created", /project-created/.test(blob));
}

// ── 3. INDEPENDENT SOURCE DERIVATION ─────────────────────────────────────────────────────────────
const taFiles = fs.readdirSync(path.join(PUB_DIR, "articles")).filter((f) => f.endsWith(".md")).sort();
const enFiles = fs.readdirSync(path.join(PUB_DIR, "translations/en")).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
eq("14 Tamil article assemblies in the source", taFiles.length, 14);
eq("14 English article files in the source", enFiles.length, 14);
eq("publication reports 14 articles", pub.articleCount, 14);
eq("publication holds 14 articles", pub.articles.length, 14);
eq("articles are numbered 1..14 in order", pub.articles.map((a) => a.number), Array.from({ length: 14 }, (_, i) => i + 1));
eq("article slugs are unique", new Set(pub.articles.map((a) => a.slug)).size, 14);

// Scan/printed mapping re-derived from each source file's own front matter.
{
  const fm = (t) => Object.fromEntries([...t.matchAll(/^([a-z_]+):\s*(.*)$/gm)].map((m) => [m[1], m[2].replace(/^"(.*)"$/, "$1")]));
  let ok = true;
  const bad = [];
  pub.articles.forEach((a, i) => {
    const t = fm(readText(path.join(PUB_DIR, "articles", taFiles[i])));
    const e = fm(readText(path.join(PUB_DIR, "translations/en", enFiles[i])));
    const scan = `${a.scanPages.from}-${a.scanPages.to}`;
    const printed = `${a.printedPages.from}-${a.printedPages.to}`;
    if (t.scan_pages !== scan || t.printed_pages !== printed) { ok = false; bad.push(`art ${a.number} Tamil range`); }
    if (e.source_scan_pages !== scan || e.source_printed_pages !== printed) { ok = false; bad.push(`art ${a.number} English range`); }
    if (t.title_ta !== a.titleTa) { ok = false; bad.push(`art ${a.number} heading title`); }
    if (e.title_en !== a.titleEn) { ok = false; bad.push(`art ${a.number} English title`); }
    if (e.translation_status !== "verified") { ok = false; bad.push(`art ${a.number} translation_status`); }
    // The English pins the exact Tamil blob it was translated from.
    const blob = execFileSync("git", ["-C", SRC_REPO, "hash-object", path.join(PUB_DIR, "articles", taFiles[i])], { encoding: "utf8" }).trim();
    if (blob !== e.source_tamil_blob_sha) { ok = false; bad.push(`art ${a.number} source_tamil_blob_sha`); }
  });
  check("every article's scan/printed range, titles, status and blob SHA match the source front matter", ok, bad.join("; "));
}
// The published scan/printed map matches the source metadata table exactly.
{
  const meta = readText(path.join(PUB_DIR, "metadata/source.md"));
  let ok = true;
  const bad = [];
  for (const a of prov.source.articleMap) {
    const row = new RegExp(`\\|\\s*${a.number}\\s*\\|[^|]*\\|\\s*(\\d+)[–-](\\d+)\\s*\\|\\s*(\\d+)[–-](\\d+)\\s*\\|`).exec(meta);
    if (!row) { ok = false; bad.push(`no metadata row for article ${a.number}`); continue; }
    if (`${row[1]}–${row[2]}` !== a.scanPages || `${row[3]}–${row[4]}` !== a.printedPages) { ok = false; bad.push(`article ${a.number} mapping`); }
  }
  check("article scan/printed map matches the source metadata table", ok, bad.join("; "));
  eq("articles span scans 9–82", [pub.articles[0].scanPages.from, pub.articles[13].scanPages.to], [9, 82]);
  eq("articles span printed 7–80", [pub.articles[0].printedPages.from, pub.articles[13].printedPages.to], [7, 80]);
}

// ── 4. BODY RECONSTRUCTION ───────────────────────────────────────────────────────────────────────
// Rebuild each released article body from the generated blocks and compare with the source file,
// with the source's own markers and non-body sections removed. This proves text, order, quotation
// content and subheadings — and that page markers never fragmented or duplicated a block.
const TA_MARKER = /^<!--\s*scan \d+ \/ printed (?:p\.)?\d+\s*-->$/;
const EN_MARKER = /^<!--\s*Tamil source: scan \d+ \/ printed (?:p\.)?\d+\s*-->$/;
const NON_BODY = /^##\s+(Source note|Assembly note|Editorial \/ source note)\s*$/;
const NOT_AUTHORED = "not part of Kalaignar's text";

function releasedUnits(text, markerRe) {
  const body = text.slice(/^---\n[\s\S]*?\n---\n/.exec(text)[0].length);
  const units = [];
  let buf = [];
  let quote = [];
  let skip = false;
  const flushP = () => { if (buf.length) { units.push(buf.join("\n")); buf = []; } };
  const flushQ = () => { if (quote.length) { const t = quote.join("\n"); if (!t.includes(NOT_AUTHORED)) units.push(t); quote = []; } };
  for (const raw of body.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    const t = line.trim();
    if (NON_BODY.test(t)) { flushP(); flushQ(); skip = true; continue; }
    if (skip) continue;
    if (t === "---" || markerRe.test(t)) { flushP(); flushQ(); continue; }
    if (t === "") { flushP(); flushQ(); continue; }
    if (t.startsWith("> ")) { flushP(); quote.push(t.slice(2)); continue; }
    flushQ();
    if (/^#\s/.test(t)) { flushP(); continue; }            // article title — carried as metadata
    if (/^#{2,6}\s/.test(t)) { flushP(); units.push(t.replace(/^#+\s*/, "")); continue; }
    buf.push(line);
  }
  flushP(); flushQ();
  return units;
}

{
  let taOk = true, enOk = true;
  const bad = [];
  pub.articles.forEach((a, i) => {
    const taUnits = releasedUnits(readText(path.join(PUB_DIR, "articles", taFiles[i])), TA_MARKER);
    const enUnits = releasedUnits(readText(path.join(PUB_DIR, "translations/en", enFiles[i])), EN_MARKER);
    // Generated blocks joined back: a block that spans printed pages was joined with a single space.
    const taGen = a.tamil.blocks.map((b) => b.text);
    const enGen = a.english.blocks.map((b) => b.text);
    if (taGen.join("\n").replace(/\s+/g, " ").trim() !== taUnits.join("\n").replace(/\s+/g, " ").trim()) { taOk = false; bad.push(`Tamil art ${a.number}`); }
    if (enGen.join("\n").replace(/\s+/g, " ").trim() !== enUnits.join("\n").replace(/\s+/g, " ").trim()) { enOk = false; bad.push(`English art ${a.number}`); }
  });
  check("Tamil body reconstructs the released assemblies exactly", taOk, bad.filter((x) => x.startsWith("Tamil")).join("; "));
  check("English body reconstructs the released translation exactly", enOk, bad.filter((x) => x.startsWith("English")).join("; "));
}
// No omissions, no duplicated article bodies.
{
  const sig = pub.articles.map((a) => a.tamil.blocks.map((b) => b.text).join("\n"));
  eq("no duplicated Tamil article body", new Set(sig).size, 14);
  const esig = pub.articles.map((a) => a.english.blocks.map((b) => b.text).join("\n"));
  eq("no duplicated English article body", new Set(esig).size, 14);
  check("every article has Tamil body", pub.articles.every((a) => a.tamil.blocks.length > 0));
  check("every article has English body", pub.articles.every((a) => a.english.blocks.length > 0));
}

// ── 5. STRUCTURE: subheadings, quotations, provenance ────────────────────────────────────────────
{
  // Source-supported subheadings re-derived from the released files.
  const countHeads = (file, markerRe) => releasedUnits(readText(file), markerRe).length; // not used directly
  const taSub = pub.articles.reduce((n, a) => n + a.tamil.blocks.filter((b) => b.kind === "subheading").length, 0);
  const enSub = pub.articles.reduce((n, a) => n + a.english.blocks.filter((b) => b.kind === "subheading").length, 0);
  let srcTaSub = 0, srcEnSub = 0;
  taFiles.forEach((f) => { srcTaSub += (readText(path.join(PUB_DIR, "articles", f)).match(/^#{2,6}\s+(?!Source note|Assembly note|Editorial \/ source note).*$/gm) || []).length; });
  enFiles.forEach((f) => { srcEnSub += (readText(path.join(PUB_DIR, "translations/en", f)).match(/^#{2,6}\s+.*$/gm) || []).length; });
  eq("Tamil subheadings match the source's printed subheadings", taSub, srcTaSub);
  eq("English subheadings match the released subheadings", enSub, srcEnSub);
  check("subheading counts agree across layers", taSub === enSub, `${taSub} vs ${enSub}`);
  check("every block carries at least one printed page", pub.articles.every((a) => [...a.tamil.blocks, ...a.english.blocks].every((b) => b.sourcePages.length >= 1 && b.sourcePages.every((p) => p && p.scan && p.printed))));
  check("block pages stay inside the article's scan range", pub.articles.every((a) => [...a.tamil.blocks, ...a.english.blocks].every((b) => b.sourcePages.every((p) => p.scan >= a.scanPages.from && p.scan <= a.scanPages.to))));
  check("quotations are modelled distinctly", pub.articles.some((a) => a.tamil.blocks.some((b) => b.kind === "quotation")));
  check("block kinds are legal", pub.articles.every((a) => [...a.tamil.blocks, ...a.english.blocks].every((b) => ["paragraph", "quotation", "subheading", "attribution"].includes(b.kind))));
}

// ── 6. CROSS-PAGE AUDIT — independently re-derived ───────────────────────────────────────────────
// Re-derive each transition's relation from the page records' own audit notes, using a different
// implementation from the importer, and require the generated relation to match. A relation may be
// `same-block` ONLY where the archive actually records a continuation.
{
  const recs = new Map();
  for (const name of fs.readdirSync(path.join(PUB_DIR, "pages")).sort()) {
    const t = readText(path.join(PUB_DIR, "pages", name));
    const scan = Number(/scan_page:\s*(\d+)/.exec(t)[1]);
    const status = /status:\s*"([^"]*)"/.exec(t)[1];
    const i = t.indexOf("## Audit note");
    const note = i < 0 ? "" : t.slice(i);
    recs.set(scan, { name, status, note });
  }
  eq("83 page records read", recs.size, 83);
  check("every page record is verified", [...recs.values()].every((r) => r.status === "verified"));

  const CONT = /தொடர்கிறத|தொடர்ச்சி|continuation|continues|completes /i;
  let ok = true;
  const bad = [];
  let derivedSame = 0;
  for (const a of pub.articles) {
    eq(`article ${a.number} transition count`, a.pageTransitions.length, a.scanPages.to - a.scanPages.from);
    for (const t of a.pageTransitions) {
      const notes = `${recs.get(t.fromScan).note}\n${recs.get(t.toScan).note}`;
      const lines = notes.split("\n").filter((l) => CONT.test(l) && new RegExp(`scan ${t.toScan}\\b|scan ${t.fromScan}\\b|தொடக்க|Opening|first line|இறுதி|Final`, "i").test(l));
      const expected = lines.length ? "same-block" : "block-boundary";
      if (expected === "same-block") derivedSame++;
      if (t.relation !== expected) { ok = false; bad.push(`${t.fromScan}->${t.toScan}: generated ${t.relation}, source-derived ${expected}`); }
      if (t.relation === "same-block" && t.evidence.length === 0) { ok = false; bad.push(`${t.fromScan}->${t.toScan}: same-block with no citation`); }
    }
  }
  check("every page-transition relation matches an independent derivation from the page records", ok, bad.slice(0, 4).join("; "));
  eq("independently derived same-block count matches the provenance total", prov.archiveDerived.relationSameBlock, derivedSame);
  eq("relation counts sum to the audited transitions", prov.archiveDerived.relationSameBlock + prov.archiveDerived.relationBlockBoundary + prov.archiveDerived.relationUnknown, prov.archiveDerived.pageTransitionsAudited);
  eq("audited transitions equal the in-article page edges", prov.archiveDerived.pageTransitionsAudited, pub.articles.reduce((n, a) => n + (a.scanPages.to - a.scanPages.from), 0));
  check("relations are legal values", pub.articles.every((a) => a.pageTransitions.every((t) => ["same-block", "block-boundary", "unknown"].includes(t.relation))));
  // Marker formatting must not be what decides structure: a same-block transition must actually
  // have produced a block carrying BOTH printed pages.
  const spanning = pub.articles.reduce((n, a) => n + [...a.tamil.blocks, ...a.english.blocks].filter((b) => b.sourcePages.length > 1).length, 0);
  eq("cross-page blocks recorded", prov.archiveDerived.crossPageBlocks, spanning);
  check("a source-established continuation produced a page-spanning block", spanning >= prov.archiveDerived.relationSameBlock);
  check("provenance states the page-boundary rule", prov.archiveDerived.boundaryNote.includes("does not by itself establish"));
}

// ── 7. TITLE WITNESSES ───────────────────────────────────────────────────────────────────────────
{
  const contents = readText(path.join(PUB_DIR, "indexes/contents.md"));
  const a5 = pub.articles[4];
  const a14 = pub.articles[13];
  eq("article 5 heading witness", a5.titleTa, "பரத்துவாஜா ஆஸ்ரமமா - பாரிஸ் நகரத்து ‘பாரா’?");
  eq("article 5 contents witness retained separately", a5.contentsTitleTa, "பரத்துவாஜர் ஆஸ்ரமமா - பாரீஸ் நகரத்து ‘பாரா’?");
  check("article 5 witnesses are not normalized into one", a5.titleTa !== a5.contentsTitleTa);
  eq("article 14 heading witness", a14.titleTa, "காரியமாகும் வரையில் காலைப் பிடி !");
  eq("article 14 contents witness retained separately", a14.contentsTitleTa, "காரியமாகும் வரையில் காலைப் பிடி!");
  check("article 14 witnesses are not normalized into one", a14.titleTa !== a14.contentsTitleTa);
  check("article 5 contents witness comes from the source contents page", contents.includes(a5.contentsTitleTa));
  check("article 14 contents witness comes from the source contents page", contents.includes(a14.contentsTitleTa));
  // Where the two witnesses agree, no second witness is invented.
  const differing = pub.articles.filter((a) => a.contentsTitleTa);
  eq("exactly the two differing articles carry a contents witness", differing.map((a) => a.number), [5, 14]);
  check("provenance documents the witness distinctions", prov.source.titleWitnessNotes.length >= 3 && prov.source.titleWitnessNotes.some((n) => n.includes("Article 10")));
}

// ── 8. RELEASED ENGLISH TITLES ───────────────────────────────────────────────────────────────────
eq(
  "released English titles carried exactly",
  pub.articles.map((a) => a.titleEn),
  [
    "Chakravarthi's Son",
    "Body and Feeling",
    "The Conspiracy Is Proven",
    "Dasaratha Raja in the Grip of Kama-Raja!",
    "Bharadvaja's Ashram—or a Paris 'Bar'?",
    "Why Did Rama Go to the Forest? A Rishi's Curse? Kaikeyi's Anger?",
    "Let Us Answer Vibhishana!",
    "The King Who Ruled the Land Died with No One to Tend Him",
    "Father and Son—Both Strayed from Dharma!",
    "To Rama, Who Is Said to Be Vishnu's Incarnation!",
    "Is Everything That Happens Narayana's Doing?",
    "To Rama Who Went Chasing Maricha",
    "Traitors Meet!",
    "Hold Their Feet Until Your Purpose Is Achieved!",
  ],
);
eq("publication English title", pub.title.en, "Chakravarthi's Son");
eq("English kind is project-created", prov.english.kind, "project-created");
check("English title marked as project-created, not printed in the source", prov.english.kind === "project-created");

// ── 9. LABEL / VOICE NON-REGRESSION ──────────────────────────────────────────────────────────────
{
  const enBody = pub.articles.map((a) => a.english.blocks.map((b) => b.text).join("\n"));
  const all = enBody.join("\n");
  check("Achariyar is preserved publication-wide", /\bAchariyar\b/.test(all));
  check("Article 7 releases the source's explicit இராஜாஜி as Rajaji", /\bRajaji\b/.test(enBody[6]), "Rajaji not found in article 7");
  check("Article 11 releases the plural as the Achariyars", /the Achariyars/.test(enBody[10]), "'the Achariyars' not found in article 11");
  // Achariyar must not have been mechanically replaced by Rajaji across the publication.
  const rajajiArticles = enBody.map((t, i) => (/\bRajaji\b/.test(t) ? i + 1 : null)).filter(Boolean);
  check("Rajaji is not substituted for Achariyar everywhere", rajajiArticles.length < 14, `Rajaji appears in ${rajajiArticles.length} articles`);
  // Tamil source labels are untouched.
  const taAll = pub.articles.map((a) => a.tamil.blocks.map((b) => b.text).join("\n")).join("\n");
  check("Tamil retains ஆச்சாரியார்", taAll.includes("ஆச்சாரியார்"));
  check("Tamil retains இராஜாஜி where the source prints it", taAll.includes("இராஜாஜி"));
}

// ── 10. TRANSLATOR NOTES SEPARATED ───────────────────────────────────────────────────────────────
{
  eq("one released translator note per article", pub.articles.map((a) => a.english.notes.length), Array(14).fill(1));
  check("every note carries the source's not-authored label", pub.articles.every((a) => a.english.notes.every((n) => n.text.includes(NOT_AUTHORED) && n.notPartOfAuthoredText === true)));
  const bodies = pub.articles.flatMap((a) => [...a.tamil.blocks, ...a.english.blocks]).map((b) => b.text).join("\n");
  check("no translator note text leaked into any body block", !bodies.includes(NOT_AUTHORED));
  check("no 'Translator identification' heading in body", !/Translator identification/i.test(bodies));
  eq("provenance records 14 notes", prov.archiveDerived.translatorNotes, 14);
}

// ── 11. LOCKED EXCLUSIONS ────────────────────────────────────────────────────────────────────────
{
  const bodies = pub.articles.flatMap((a) => [...a.tamil.blocks, ...a.english.blocks]).map((b) => b.text).join("\n");
  for (const [label, needle] of [
    ["scan 82 advertisement heading", "அச்சிடப்பட்ட விளம்பரம்"],
    ["scan 82 advertisement strapline", "உலகின் ஒரே பகுத்தறிவு நாளேடு"],
    ["scan 82 advertisement URL", "www.viduthalai.in"],
    ["scan 82 advertisement founding line", "தோற்றம் : 1935"],
    ["printed ornament placeholder", "[அச்சிடப்பட்ட நிறைவு அலங்காரம்]"],
    ["library accession mark", "A0482"],
    ["library shelf mark", "B 294.5922"],
    ["back-cover barcode", "9997720145467"],
    ["title-page publisher line", "திராவிடர் கழக (இயக்க) வெளியீடு"],
    ["publication-note heading", "நூல் குறிப்பு"],
    ["series imprint", "பெரியார் ஆவணக் காப்பக வெளியீடு"],
    ["assembly prose", "assembly scan pages"],
  ]) check(`article body excludes ${label}`, !bodies.includes(needle), `found ${JSON.stringify(needle)}`);

  // Article 14 must stop at the printed article-ending ornament.
  const a14 = pub.articles[13];
  const last = a14.tamil.blocks[a14.tamil.blocks.length - 1];
  check("article 14 ends at the source's final article paragraph", last.text.includes("புலனாகிறது"), `ends: ${last.text.slice(-40)}`);
  check("article 14 body stays within scans 79–82", a14.tamil.blocks.every((b) => b.sourcePages.every((p) => p.scan >= 79 && p.scan <= 82)));
  check("no article body reaches scan 83", pub.articles.every((a) => [...a.tamil.blocks, ...a.english.blocks].every((b) => b.sourcePages.every((p) => p.scan <= 82))));

  // Scan 83's promotional excerpt is a separate witness — it must not extend Article 12.
  const backCover = readText(path.join(PUB_DIR, "pages", fs.readdirSync(path.join(PUB_DIR, "pages")).find((f) => f.startsWith("0083"))));
  const a12 = pub.articles[11].tamil.blocks.map((b) => b.text).join("\n");
  for (const frag of ["எந்தப் பெண்ணாவது, தனது", "அறி குறி?"]) {
    check(`scan-83 promotional fragment ${JSON.stringify(frag)} exists in the source back cover`, backCover.includes(frag));
  }
  check("article 12 body does not absorb the back-cover excerpt's distinctive fragment", !a12.includes("அறி குறி?"));
  eq("article 12 covers scans 71–73 only", [pub.articles[11].scanPages.from, pub.articles[11].scanPages.to], [71, 73]);
}

// ── 12. RECORDED COUNTS MATCH GENERATED DATA ─────────────────────────────────────────────────────
{
  const d = prov.archiveDerived;
  eq("provenance articles", d.articles, pub.articles.length);
  eq("provenance Tamil blocks", d.tamilBlocks, pub.articles.reduce((n, a) => n + a.tamil.blocks.length, 0));
  eq("provenance English blocks", d.englishBlocks, pub.articles.reduce((n, a) => n + a.english.blocks.length, 0));
  eq("provenance Tamil quotations", d.tamilQuotations, pub.articles.reduce((n, a) => n + a.tamil.blocks.filter((b) => b.kind === "quotation").length, 0));
  eq("provenance English quotations", d.englishQuotations, pub.articles.reduce((n, a) => n + a.english.blocks.filter((b) => b.kind === "quotation").length, 0));
  eq("provenance article map size", prov.source.articleMap.length, 14);
  eq("English verification recorded", prov.english.articlesVerified, "14 / 14 articles translation_status: verified");
  eq("English release gate", prov.english.releaseGate, "CLOSED");
  eq("unresolved translation questions", prov.english.unresolvedTranslationQuestions, 0);
  eq("release blockers", prov.english.releaseBlockers, 0);
  eq("unresolved Tamil fidelity items", prov.source.unresolvedTamilFidelityItems, 0);
  check("83/83 physical verification recorded", prov.source.physicalVerification.includes("83 / 83"));
  check("83/83 strict fidelity recorded", prov.source.strictFidelityReview.includes("83 / 83"));
  check("14/14 assemblies recorded", prov.source.articleAssemblies.includes("14 / 14"));
}

// ── 13. RIGHTS ───────────────────────────────────────────────────────────────────────────────────
{
  const pr = prov.projectRights;
  eq("rights status", pr.rightsStatus, "nationalised-by-tamil-nadu-government");
  eq("GO number remains unverified", pr.governmentOrderNumber, null);
  eq("GO issue date remains unverified", pr.governmentOrderDate, null);
  eq("GO handover date", pr.governmentOrderHandoverDate, "2024-12-22");
  check("rights not broadened to publisher/cover/advertisements/library marks", ["publisher", "cover", "advertis", "library mark"].every((w) => pr.thirdPartyNote.toLowerCase().includes(w)));
  check("rights not broadened to the project translation", /not covered/i.test(pr.projectTranslationNote));
  check("quoted third-party texts are excluded from the rights claim", /does not extend to them/i.test(pr.quotedThirdPartyNote));
}

console.log(`\n${SLUG} — ${pass} assertions passed, ${failures.length} failed`);
if (failures.length) {
  console.error("\nFAILURES:");
  for (const f of failures) console.error(" ✗ " + f);
  process.exit(1);
}
console.log("ALL PASS");
