// Wave 7 — B5a / B5b / B6 / Kuraloviyam — P2 INDEPENDENT source/reader FIDELITY validator. Fails closed.
//
//   node scripts/validate-wave7-b5-b6-k-p2-fidelity.mjs <public-speeches-clone> <assembly-speeches-clone> <literary-commentary-clone>
//   (or KDL_SOURCES_DIR as for the P1 validator)
//
// For every one of the 101 works it re-extracts the reading text from the PINNED SOURCE with its own line-level
// traversal (it never imports the importers) and proves, in order:
//   PRESENCE  — the source body and the vendored payload are both non-empty (empty == empty never passes);
//   STRUCTURE — page coverage, block kinds, closing colophon kept outside the body, qualification blocks;
//   EQUALITY  — the ordered sequence of source text lines == the ordered sequence of payload text lines,
//               byte for byte (Tamil AND English), with only Markdown syntax markers removed on both sides.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const BASE = process.env.KDL_SOURCES_DIR || "";
const PS = process.argv[2] || (BASE ? path.join(BASE, "kalaignar-public-speeches-wave7") : "");
const AS = process.argv[3] || (BASE ? path.join(BASE, "kalaignar-assembly-speeches-wave7") : "");
const LC = process.argv[4] || (BASE ? path.join(BASE, "kalaignar-literary-commentary-wave7") : "");
for (const [k, v] of [["public-speeches", PS], ["assembly-speeches", AS], ["literary-commentary", LC]]) {
  if (!v || !fs.existsSync(v)) { console.error(`validate-wave7-b5-b6-k-p2-fidelity: source clone for ${k} not found (${v || "unset"})`); process.exit(2); }
}
const git = (repo, ...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8" }).trim();
if (git(PS, "rev-parse", "HEAD") !== "6ca57fe20706ebcb59f3432e8067fd11a1565b54" || git(AS, "rev-parse", "HEAD") !== "7a7fed1d0e3eb24a396effc10854b178f32bd0cf" || git(LC, "rev-parse", "HEAD") !== "d542b4cc3749bf1966e3537d1eb34d421344faf5") {
  console.error("validate-wave7-b5-b6-k-p2-fidelity: a source checkout is not at its frozen Wave-7 pin"); process.exit(1);
}

let checks = 0; const fail = [];
const ok = (c, l) => { checks++; if (!c) fail.push(l); };
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const TA = /[஀-௿]/;
const firstDiff = (a, b) => { const n = Math.min(a.length, b.length); for (let i = 0; i < n; i++) if (a[i] !== b[i]) return `line ${i}: source ${JSON.stringify(a[i].slice(0, 60))} ≠ payload ${JSON.stringify(b[i].slice(0, 60))}`; return `length source ${a.length} ≠ payload ${b.length}`; };
const seqEq = (src, pay, label) => {
  ok(src.length > 0, `${label}: PRESENCE — source body has text`);
  ok(pay.length > 0, `${label}: PRESENCE — payload has text`);
  const same = src.length > 0 && JSON.stringify(src) === JSON.stringify(pay);
  ok(same, `${label}: EQUALITY — ${same ? "" : firstDiff(src, pay)}`);
};
// Payload → ordered text lines (Markdown syntax already removed at import; text itself verbatim).
const payloadLines = (blocks) => blocks.flatMap((b) => (b.segments ? b.segments.map((s) => s.text).join("\n") : b.text).split("\n"));

// ── Public speeches (independent extraction) ─────────────────────────────────────────────────────────────
// Body: from the first `## PDF` page line (or, for an English file without page lines, the first line after its
// header) up to the first Latin-script heading / bold closing-note label. Kept: every non-blank line, with the
// Markdown markers `#…# `, `> ` removed. Dropped: page lines, the bare `### N` item numeral, comments, rules.
const isPage = (l) => /^##\s+PDF\s+\d+/.test(l);
function publicSource(text, layer) {
  const L = text.split("\n");
  let i = L.findIndex(isPage);
  if (i < 0) {
    if (layer === "ta") return { body: [], closing: [] };
    i = L.findIndex((l, k) => k > 0 && l.trim() && !/^#/.test(l) && !/^\*\*[A-Za-z][^*]*:\*\*/.test(l));
  }
  const body = [], closing = [];
  let inClosing = false;
  for (; i < L.length; i++) {
    const l = L[i].replace(/\s+$/, "");
    if (isPage(l)) continue;
    const head = /^(#{1,6})\s+(.*)$/.exec(l);
    if (head && !TA.test(head[2]) && !/^\d+$/.test(head[2].trim())) {
      if (/closing note/i.test(head[2]) && !inClosing) { inClosing = true; continue; }
      if (layer === "en" && !inClosing && !/\b(audit|checkpoint|closure|verification|review|result|repair|correction|corrections|gate|notes|clarifications|boundary|workflow|status|attention points|freeze|progress)\b/i.test(head[2])) { body.push(head[2]); continue; }
      break;
    }
    if (/^\*\*[^*]*closing note[^*]*:\*\*/i.test(l)) { inClosing = true; const rest = l.replace(/^\*\*[^*]*:\*\*\s*/, ""); if (rest) closing.push(rest); continue; }
    if (inClosing) { if (l.trim()) closing.push(l); continue; }
    if (head && /^\d+$/.test(head[2].trim()) && head[1].length === 3) continue;
    if (!l.trim() || /^-{3,}$/.test(l) || /^<!--/.test(l)) continue;
    body.push(head ? L[i].slice(L[i].indexOf(head[2], head[1].length)) : L[i].replace(/^>[ ]?/, ""));
  }
  return { body, closing };
}

const sman = readJSON(path.join(root, "data/internal/wave7/b5-b6-speeches-manifest.json"));
for (const w of sman.works) {
  const sp = readJSON(path.join(root, "public/data/speeches", w.slug, "speech.json"));
  const label = w.slug;
  if (w.batch !== "B6") {
    const dir = path.join(PS, w.sourcePath);
    for (const [layer, file, blocks] of [["ta", "transcription-ta.md", sp.tamil.blocks], ["en", "translation-en.md", sp.english.blocks]]) {
      const src = publicSource(fs.readFileSync(path.join(dir, file), "utf8"), layer);
      // STRUCTURE: the payload's LAST note is the printed closing colophon, outside the body.
      const last = blocks[blocks.length - 1];
      const hasClosing = src.closing.length > 0;
      if (layer === "ta") ok(hasClosing && last?.kind === "note", `${label}/ta: STRUCTURE — the printed closing colophon exists and is the final, separate note`);
      const body = hasClosing && last?.kind === "note" ? blocks.slice(0, -1) : blocks;
      // The colophon itself: every payload line comes from the source's closing section (label/backtick
      // wrappers removed) — nothing added, and the archive's commentary about it is never among them.
      if (hasClosing && last?.kind === "note") {
        const srcClosing = src.closing.map((x) => x.replace(/^\*\*[^*]*(PDF|printed)[^*]*:\*\*\s*/i, "").replace(/^`(?!`)/, "").replace(/(?<!`)`$/, "")).join("\n");
        ok(last.text.split("\n").every((x) => srcClosing.includes(x)), `${label}/${layer}: closing colophon lines all come from the source closing section`);
        ok(!/closing note|inferred|Preserve the source/i.test(last.text), `${label}/${layer}: no archive commentary inside the colophon`);
      }
      ok(body.every((b) => !/^##\s+PDF|<!--/.test(b.text ?? b.segments?.[0]?.text ?? "")), `${label}/${layer}: STRUCTURE — no page marker or comment in the reading text`);
      seqEq(src.body, payloadLines(body), `${label}/${layer}`);
    }
    ok(sp.collection?.id === w.collectionId && sp.collection?.ordinal === w.ordinal, `${label}: collection membership + printed ordinal carried`);
    ok(sp.englishForm === w.englishForm, `${label}: English form == manifest`);
  } else {
    const dir = path.join(AS, w.sourcePath);
    for (const [layer, file, blocks, wrap] of [["ta", "transcript.md", sp.tamil.blocks, /^#\s+தமிழ்\s*மூல\s*உரை$/], ["en", w.slug.startsWith("1971") ? "translation.md" : "transcript.md", sp.english.blocks, /^#\s+English translation$/]]) {
      const L = fs.readFileSync(path.join(dir, file), "utf8").split("\n");
      let s = -1; L.forEach((l, k) => { if (wrap.test(l.replace(/\s+$/, ""))) s = k; });
      const body = []; const pages = [];
      for (let i = s + 1; s >= 0 && i < L.length; i++) {
        const l = L[i].replace(/\s+$/, "");
        if (/^#\s/.test(l)) break;
        const pg = /^<!--\s*source-page:\s*(\d+)\s*-->$/.exec(l) || /^###\s+Source page\s+(\d+)$/i.exec(l);
        if (pg) { if (Number(pg[1]) !== pages[pages.length - 1]) pages.push(Number(pg[1])); continue; }
        if (!l.trim() || /^<!--/.test(l) || /^>/.test(l) || /^-{3,}$/.test(l)) continue;
        const head = /^(#{1,6})\s+(.*)$/.exec(l);
        body.push(head ? L[i].slice(L[i].indexOf(head[2], head[1].length)) : L[i]);
      }
      ok(JSON.stringify(pages) === JSON.stringify(sp.sourcePages), `${label}/${layer}: STRUCTURE — source-page sequence == payload source pages`);
      seqEq(body, payloadLines(blocks), `${label}/${layer}`);
    }
    ok(sp.subtype === "assembly-speech" && sp.englishForm === "full-translation", `${label}: assembly speech with a full English translation`);
  }
}
const s7 = readJSON(path.join(root, "public/data/speeches/1973-03-07-financial-statement-reply/speech.json"));
const s8 = readJSON(path.join(root, "public/data/speeches/1973-03-08-financial-statement-reply/speech.json"));
ok(s7.date === "1973-03-07" && s8.date === "1973-03-08" && s7.legislature.nameEn !== s8.legislature.nameEn && JSON.stringify(s7.tamil.blocks) !== JSON.stringify(s8.tamil.blocks), "the two March 1973 speeches stay distinct (own date, House and text)");

// ── Kuraloviyam (independent per-page extraction) ─────────────────────────────────────────────────────────
const KW = path.join(LC, "works/kuraloviyam");
const kidx = readJSON(path.join(root, "public/data/kuraloviyam/index.json"));
const seen = new Map();
for (const u of kidx.units) {
  const unit = readJSON(path.join(root, "public/data/kuraloviyam/units", `${u.id}.json`));
  ok(unit.pages.length > 0, `kuraloviyam/${u.id}: PRESENCE — has pages`);
  for (const p of unit.pages) {
    ok(!seen.has(p.scan), `kuraloviyam scan ${p.scan}: rendered in exactly one unit`); seen.set(p.scan, u.id);
    const f = fs.readdirSync(path.join(KW, "pages")).find((x) => x.startsWith(String(p.scan).padStart(4, "0") + "-"));
    for (const [layer, dir] of [["ta", "pages"], ["en", "translations/en/pages"]]) {
      const raw = fs.readFileSync(path.join(KW, dir, f), "utf8");
      const body = raw.slice(raw.indexOf("\n---\n", 4) + 5).split("\n");
      // Every source line in page order; lines inside an archival section may be description OR text.
      const all = []; const src = []; const archival = [];
      let arch = false;
      for (const line of body) {
        const l = line.replace(/\s+$/, "");
        if (!l.trim() || /^<!--/.test(l)) continue;
        const head = /^(#{1,6})\s+(.*)$/.exec(l);
        if (head) { arch = /^## (Visual material|Visual record|Non-printed mark|Handwritten facsimile|Source-limited handwritten facsimile|Non-body marks|Non-body material|Source limitation)$/.test(l); if (!arch) { src.push(head[2]); all.push(head[2]); } continue; }
        const t = line.replace(/^>[ ]?/, "");
        (arch ? archival : src).push(t); all.push(t);
      }
      const blocks = layer === "ta" ? p.ta : p.en;
      const textBlocks = blocks.filter((b) => b.kind !== "archival" && b.kind !== "source-limited");
      const payArchival = blocks.filter((b) => b.kind === "archival").flatMap((b) => b.text.split("\n"));
      // Source text inside an archival section (Tamil prose after an illustration description) is text, not archival.
      const combined = [...src, ...archival];
      const payAll = [...payloadLines(textBlocks), ...payArchival];
      // A full-page illustration / back cover carries no text in the source: accepted ONLY for a non-text page
      // type and only if the payload is empty too — never as empty == empty on a text page.
      const nonText = ["blank", "illustration", "back-cover", "cover"].includes(p.pageType);
      ok(combined.length > 0 || (nonText && blocks.length === 0), `kuraloviyam scan ${p.scan}/${layer}: PRESENCE (or a verified non-text page with an empty payload)`);
      // EQUALITY over the multiset of all lines (text + archival): nothing added, nothing lost, nothing altered.
      if (!p.sourceLimited) ok(JSON.stringify([...combined].sort()) === JSON.stringify([...payAll].sort()), `kuraloviyam scan ${p.scan}/${layer}: EQUALITY — every source line is carried exactly once (text or archival)`);
      // ORDER: the source lines in page order, minus those carried as archival description, == the payload text.
      if (!p.sourceLimited) {
        const claim = new Map(); for (const x of payArchival) claim.set(x, (claim.get(x) ?? 0) + 1);
        const textOrder = all.filter((x) => { const n = claim.get(x) ?? 0; if (n > 0) { claim.set(x, n - 1); return false; } return true; });
        ok(JSON.stringify(textOrder) === JSON.stringify(payloadLines(textBlocks)), `kuraloviyam scan ${p.scan}/${layer}: text lines keep exact source order`);
      }
      if (p.sourceLimited) {
        ok(blocks.some((b) => b.kind === "source-limited") && !blocks.some((b) => b.kind === "archival"), `kuraloviyam scan ${p.scan}/${layer}: limited page carries the permanent-condition block and none of the archive's workflow descriptions`);
        ok(payloadLines(textBlocks).length > 0 && payloadLines(textBlocks).every((x) => src.includes(x)), `kuraloviyam scan ${p.scan}/${layer}: limited page shows only verified source text (nothing supplied)`);
        ok(!/Pass 1|must wait|better source evidence/.test(JSON.stringify(blocks)), `kuraloviyam scan ${p.scan}/${layer}: no pending-work wording`);
      }
    }
  }
}
ok(seen.size === 666 && [...seen.keys()].every((s) => s >= 1 && s <= 666), "kuraloviyam: all 666 scans rendered exactly once");
eq13();
function eq13() {
  const u = readJSON(path.join(root, "public/data/kuraloviyam/units/front-04.json"));
  ok(u.pages.map((p) => p.scan).join() === "13,14,15" && u.pages.every((p) => p.sourceLimited), "kuraloviyam: scans 13–15 are the source-limited handwritten prefaces");
  ok(u.pages[0].ta.some((b) => b.kind === "source-limited" && b.visibleDate === "17/7/1992"), "kuraloviyam: scan 13 keeps its visible handwritten date, nothing more");
  const f6 = readJSON(path.join(root, "public/data/kuraloviyam/units/front-06.json"));
  const p19 = f6.pages.find((p) => p.scan === 19);
  ok(p19.sourceLimited && JSON.stringify(p19.ta).includes("ஊகிக்கப்படவில்லை]") && JSON.stringify(p19.en).includes("unavailable"), "kuraloviyam: scan 19 keeps its inline gap marker in both layers (the washed-out words are not supplied)");
}

if (fail.length) {
  console.error(`\nvalidate-wave7-b5-b6-k-p2-fidelity — ${checks} checks, ${fail.length} FAILED\n`);
  for (const f of fail.slice(0, 60)) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nvalidate-wave7-b5-b6-k-p2-fidelity — ${checks} checks, 0 failed`);
console.log("  100 speeches: Tamil + English source-line sequences == payload (presence → structure → equality), closing colophons separate · Kuraloviyam: 666 scans × 2 layers, every source line carried once, limited pages never supplied");
