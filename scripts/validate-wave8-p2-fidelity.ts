/**
 * Wave 8 P2 — INDEPENDENT fidelity validator for the three hidden Wave-8 reader models.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/validate-wave8-p2-fidelity.ts <murasoli> <stage-plays> <literary-commentary>
 *
 * The three arguments are checkouts of the FROZEN source repositories at the Wave-8 pins (CI fetches them from the
 * P1 manifest). This validator re-reads the sources with its own parsing and compares them against what the P2
 * readers are actually given (the P2 models, through the public projections). It deliberately does NOT use the P1
 * importer (`scripts/wave8/*`), the P2 adapters' parsing or any component helper as its extraction authority: the
 * P2 models are the SUBJECT under test, never the reference. Its readings differ in method from P1 on purpose —
 * English letters are paired through their own `Tamil source` link and extracted section by section; scene text is
 * compared as the printed line sequence; page blocks are compared line by line with their markup class.
 *
 * Three levels, per work: PRESENCE (every source record ↔ exactly one model record) → STRUCTURE (identity,
 * numbering, order, parts, page sequences, types/roles) → EQUALITY (the text itself, line for line).
 * Exits non-zero on any failure.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadWave8MurasoliLetters, WAVE8_MURASOLI_VOLUMES } from "../lib/wave8-murasoli-reader";
import { toOreMuthamPlay } from "../lib/wave8-ore-mutham-adapter";
import { toSangatamilWork, SANGATAMIL_ROLES } from "../lib/wave8-sangatamil-reader";
import { toPublicWave8Letter, toPublicSangatamilSection } from "../lib/wave8-public-provenance";
import type { PlayUnit } from "../data/plays";

const [MUR, STAGE, LIT] = process.argv.slice(2);
if (!MUR || !STAGE || !LIT) { console.error("usage: validate-wave8-p2-fidelity.ts <murasoli> <stage-plays> <literary-commentary>"); process.exit(2); }

let checks = 0;
const fails: string[] = [];
const counts: Record<string, number> = {};
const ok = (c: boolean, label: string) => { checks++; if (!c) fails.push(label); return c; };
const tally = (k: string, n = 1) => { counts[k] = (counts[k] ?? 0) + n; };
const read = (f: string) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const firstDiff = (a: string[], b: string[]) => { for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) return `line ${i}: source ${JSON.stringify(a[i]?.slice(0, 90))} vs model ${JSON.stringify(b[i]?.slice(0, 90))}`; return ""; };

// ── own low-level readers ─────────────────────────────────────────────────────────────────────────────────────
/** `---` front matter → flat scalar map (strings unquoted; ints, null, true/false and `[a, b]` lists typed). */
function frontMatter(t: string): { meta: Record<string, unknown> | null; body: string } {
  if (!t.startsWith("---\n")) return { meta: null, body: t };
  const end = t.indexOf("\n---\n", 4);
  if (end < 0) return { meta: null, body: t };
  const meta: Record<string, unknown> = {};
  for (const line of t.slice(4, end).split("\n")) {
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    meta[m[1]] = value(m[2].trim());
  }
  return { meta, body: t.slice(end + 5) };
}
function value(v: string): unknown {
  if (v === "" || v === "null" || v === "~") return null;
  if (v === "true" || v === "false") return v === "true";
  if (/^-?\d+$/.test(v)) return Number(v);
  if (/^".*"$/.test(v)) return v.slice(1, -1).replace(/\\"/g, '"');
  if (/^'.*'$/.test(v)) return v.slice(1, -1);
  if (/^\[.*\]$/.test(v)) return v.slice(1, -1).split(",").map((x) => x.trim()).filter(Boolean).map(value);
  return v;
}
/** Remove every HTML comment (single- or multi-line). Comments are archival apparatus, never text. */
const noComments = (t: string) => t.replace(/<!--[\s\S]*?-->/g, "");
/** Content lines: trailing whitespace dropped, blank lines dropped. */
const contentLines = (t: string) => t.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim() !== "");
const git = (dir: string, ...a: string[]) => execFileSync("git", ["-C", dir, ...a], { encoding: "utf8" }).trim();

// ── pins ───────────────────────────────────────────────────────────────────────────────────────────────────────
const manifest = JSON.parse(read(path.join(process.cwd(), "data/internal/wave8/wave8-p1-manifest.json")));
const pins = manifest.sources ?? manifest;
for (const [dir, pin, label] of [[MUR, pins.murasoli, "murasoli"], [STAGE, pins.oreMutham, "stage-plays"], [LIT, pins.sangatamil, "literary-commentary"]] as const) {
  let head = "", tree = "";
  try { head = git(dir, "rev-parse", "HEAD"); tree = git(dir, "rev-parse", "HEAD^{tree}"); } catch { /* not a git checkout */ }
  ok(head === pin.commit && tree === pin.repoTree, `pin: ${label} checkout is ${head || "not a git checkout"} (tree ${tree}), expected ${pin.commit} (tree ${pin.repoTree})`);
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// B1 — Murasoli Letters, Volumes 42–47
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
type SrcLetter = {
  vol: number; stem: string; number: number; titleTa: string | null; titleContents: string | null;
  printed: string | null; iso: string | null; fromContents: boolean; pdf: [number, number]; printedRange: [number | null, number | null];
  incomplete: boolean; missing: number[]; lastAvailable: number | null;
};
const bullet = (t: string, label: string) => { const m = t.match(new RegExp(`^- ${label}:\\s*(.+)$`, "m")); return m ? m[1].trim() : null; };
const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
function isoOf(printed: string | null): string | null {
  const m = printed?.match(/^(\d{1,2})\D(\d{1,2})\D(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
}
function readChapterSrc(vol: number, file: string): SrcLetter {
  const t = read(file);
  const stem = path.basename(file, ".md");
  const { meta } = frontMatter(t);
  if (meta) {
    const d = meta.date as string | null | undefined;
    const iso = (meta.date_iso as string | undefined) ?? (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);
    return {
      vol, stem, number: meta.letter_number as number,
      titleTa: (meta.title_ta ?? meta.title ?? null) as string | null, titleContents: (meta.title_ta_contents ?? null) as string | null,
      printed: (meta.date_printed ?? null) as string | null, iso: iso ? String(iso) : null, fromContents: meta.date_source === "printed-contents",
      pdf: [meta.pdf_page_start as number, meta.pdf_page_end as number], printedRange: [num(meta.printed_page_start), num(meta.printed_page_end)],
      incomplete: meta.status === "source-incomplete" || meta.source_incomplete === true || Array.isArray(meta.missing_printed_pages) && (meta.missing_printed_pages as unknown[]).length > 0,
      missing: Array.isArray(meta.missing_printed_pages) ? (meta.missing_printed_pages as number[]) : [],
      lastAvailable: num(meta.last_available_printed_page),
    };
  }
  const title = t.match(/^## Source title\s*\n+(.+)$/m);
  const printed = bullet(t, "Date");
  return {
    vol, stem, number: Number(bullet(t, "Letter number")), titleTa: title ? title[1].trim() : null, titleContents: null,
    printed, iso: isoOf(printed), fromContents: false,
    pdf: [Number(bullet(t, "PDF page start")), Number(bullet(t, "PDF page end"))],
    printedRange: [num(bullet(t, "Printed page start")), num(bullet(t, "Printed page end"))],
    incomplete: bullet(t, "Status") === "source-incomplete", missing: [], lastAvailable: null,
  };
}
function readPageSrc(volDir: string, pdf: number): { printed: number | null; lines: string[] } | null {
  const f = path.join(volDir, "pages", `page-${String(pdf).padStart(3, "0")}.md`);
  if (!fs.existsSync(f)) return null;
  const t = read(f);
  const { meta, body } = frontMatter(t);
  if (meta) return { printed: num(meta.printed_page), lines: contentLines(noComments(body)) };
  const a = t.indexOf("\n## Source text\n"), b = t.indexOf("\n## Archival notes\n");
  if (a < 0 || b < a) return null;
  return { printed: num(bullet(t, "Printed page")), lines: contentLines(noComments(t.slice(a + "\n## Source text\n".length, b))) };
}
const APPARATUS_HEADING = /Original Tamil|\bnotes?\b|Alignment record|Source-check/i;
type SrcEnglish = { file: string; stem: string | null; number: number | null; pdfStart: number | null; title: string | null; note: string[]; body: string[]; subtitle: string | null };
/**
 * The English letter, read section by section: the H1 is the heading; a H2 standing directly under it is a printed
 * subtitle; the leading `>` block is the translator's note; leading `**Label:**` lines are link/date apparatus; a
 * `## English translation…` heading only wraps the body; ANY other H2/H3 starts an apparatus section (notes, the
 * reproduced Tamil) that runs to the next wrapper or the end.
 */
function readEnglishSrc(file: string): SrcEnglish {
  const t = read(file);
  const { meta, body } = frontMatter(t);
  const link = t.match(/^\*\*Tamil source:\*\*.*?\(([^)]*chapters\/([^)/]+)\.md)\)/m);
  const lines = noComments(body).split("\n");
  const h1 = lines.findIndex((l) => /^# /.test(l));
  const out: SrcEnglish = { file, stem: link ? link[2] : null, number: num(meta?.letter_number), pdfStart: num(meta?.source_pdf_page_start), title: (meta?.english_title ?? null) as string | null, note: [], body: [], subtitle: null };
  let started = false, apparatus = false, seenAny = false;
  for (let i = h1 + 1; i < lines.length; i++) {
    const l = lines[i];
    const h = l.match(/^(#{2,3}) (.*)$/);
    if (h) {
      if (/^English translation/.test(h[2])) { apparatus = false; continue; }
      if (!seenAny && h[1] === "##") { out.subtitle = h[2].trim(); seenAny = true; continue; }
      // An apparatus section names itself (notes, records, the reproduced Tamil); any other heading is a printed
      // sub-heading of the letter and belongs to the body.
      if (APPARATUS_HEADING.test(h[2])) { apparatus = true; continue; }
      if (!apparatus) { started = true; seenAny = true; out.body.push(l.replace(/\s+$/, "")); }
      continue;
    }
    if (apparatus) continue;
    if (l.trim() === "") continue;
    seenAny = true;
    if (!started && l.startsWith(">")) { out.note.push(l); continue; }
    if (!started && /^\*\*[^*]+:\*\*/.test(l) && /^\*\*(Tamil source|Source pages|Source|Date|Printed date)/.test(l)) continue;
    started = true;
    out.body.push(l.replace(/\s+$/, ""));
  }
  return out;
}

{
  const model = loadWave8MurasoliLetters().map(toPublicWave8Letter);
  ok(model.length === 342, `B1: model carries ${model.length} letters, expected 342`);
  const bySource = new Map(model.map((l) => [l.sourceId, l]));
  let srcTotal = 0;
  for (const vol of WAVE8_MURASOLI_VOLUMES) {
    const volDir = path.join(MUR, "volumes", `volume-${vol}`);
    const chapters = fs.readdirSync(path.join(volDir, "chapters")).filter((f) => /^\d{4}-.+\.md$/.test(f)).sort().map((f) => readChapterSrc(vol, path.join(volDir, "chapters", f)));
    const enDir = path.join(volDir, "translations/en/letters");
    const english = fs.readdirSync(enDir).filter((f) => /^\d{4}-.+\.md$/.test(f)).map((f) => readEnglishSrc(path.join(enDir, f)));
    srcTotal += chapters.length;
    const volModel = model.filter((l) => l.volume === vol);
    // PRESENCE
    ok(volModel.length === chapters.length, `B1 vol ${vol}: ${volModel.length} model letters vs ${chapters.length} source chapters`);
    ok(english.length === chapters.length, `B1 vol ${vol}: ${english.length} English records vs ${chapters.length} chapters`);
    const srcIds = new Set(chapters.map((c) => `m${vol}-${c.stem}`));
    for (const l of volModel) ok(srcIds.has(l.sourceId), `B1 ${l.sourceId}: model letter has no source chapter`);
    // STRUCTURE — reading order is the book's page order
    const srcOrder = [...chapters].sort((a, b) => a.pdf[0] - b.pdf[0]).map((c) => `m${vol}-${c.stem}`);
    ok(JSON.stringify(volModel.map((l) => l.sourceId)) === JSON.stringify(srcOrder), `B1 vol ${vol}: model reading order differs from the source page order`);
    const numbers = (xs: number[]) => JSON.stringify([...xs].sort((a, b) => a - b));
    ok(numbers(volModel.map((l) => l.printedNumber)) === numbers(chapters.map((c) => c.number)), `B1 vol ${vol}: printed-number multiset differs from the source`);
    for (const c of chapters) {
      const id = `m${vol}-${c.stem}`;
      const l = bySource.get(id);
      if (!l) { ok(false, `B1 ${id}: source chapter missing from the model`); continue; }
      tally("B1 letters");
      ok(c.stem.startsWith(`${c.number}-`) && l.printedNumber === c.number, `B1 ${id}: printed number ${l.printedNumber} ≠ source ${c.number}`);
      ok(l.title.ta === c.titleTa, `B1 ${id}: Tamil title differs from the source`);
      ok((l.title.taAsInContents ?? null) === (c.titleContents && c.titleContents !== c.titleTa ? c.titleContents : null), `B1 ${id}: contents-title differs`);
      ok(l.date.printed === c.printed && l.date.iso === c.iso && l.date.fromPrintedContents === c.fromContents, `B1 ${id}: date ${JSON.stringify(l.date)} ≠ source ${JSON.stringify([c.printed, c.iso, c.fromContents])}`);
      ok(l.pdfPages[0] === c.pdf[0] && l.pdfPages[1] === c.pdf[1], `B1 ${id}: PDF pages ${l.pdfPages} ≠ source ${c.pdf}`);
      ok(l.printedPages[0] === c.printedRange[0] && l.printedPages[1] === c.printedRange[1], `B1 ${id}: printed pages ${l.printedPages} ≠ source ${c.printedRange}`);
      // Tamil — one segment per source page, in order, with the page's own printed number, text line for line.
      const want = Array.from({ length: c.pdf[1] - c.pdf[0] + 1 }, (_, k) => c.pdf[0] + k);
      ok(JSON.stringify(l.tamilPages.map((p) => p.pdfPage)) === JSON.stringify(want), `B1 ${id}: Tamil page sequence ${l.tamilPages.map((p) => p.pdfPage)} ≠ ${want}`);
      for (const p of l.tamilPages) {
        const s = readPageSrc(volDir, p.pdfPage);
        if (!s) { ok(false, `B1 ${id}: source page ${p.pdfPage} unreadable`); continue; }
        tally("B1 Tamil pages");
        ok(p.printedPage === s.printed, `B1 ${id} PDF ${p.pdfPage}: printed page ${p.printedPage} ≠ source ${s.printed}`);
        const m = contentLines(p.text);
        ok(JSON.stringify(m) === JSON.stringify(s.lines), `B1 ${id} PDF ${p.pdfPage}: Tamil text differs — ${firstDiff(s.lines, m)}`);
      }
      // Source condition — carried, never filled.
      if (c.incomplete) {
        tally("B1 source-incomplete");
        ok(l.qualification?.kind === "source-incomplete" && JSON.stringify(l.qualification.missingPrintedPages) === JSON.stringify(c.missing), `B1 ${id}: source-incomplete qualification not carried exactly`);
        ok(c.lastAvailable === null || l.tamilPages[l.tamilPages.length - 1].printedPage === c.lastAvailable, `B1 ${id}: last Tamil page is not the last available printed page ${c.lastAvailable}`);
      } else ok(l.qualification === null, `B1 ${id}: qualification on a complete letter`);
      // English — paired through its own Tamil-source link (never by number alone).
      const en = english.filter((e) => e.stem === c.stem);
      const paired = en.length === 1 ? en[0] : english.find((e) => e.stem === null && e.number === c.number && e.pdfStart === c.pdf[0]);
      if (!paired) { ok(false, `B1 ${id}: no English record links to this chapter`); continue; }
      tally("B1 English");
      ok(l.title.en === paired.title, `B1 ${id}: English title ${JSON.stringify(l.title.en)} ≠ source ${JSON.stringify(paired.title)}`);
      ok((l.english.subtitle ?? null) === paired.subtitle, `B1 ${id}: English subtitle differs`);
      const body = contentLines(l.english.text);
      ok(JSON.stringify(body) === JSON.stringify(paired.body), `B1 ${id}: English body differs — ${firstDiff(paired.body, body)}`);
      ok(!/^\*\*Tamil source:|^> \*\*Translator/m.test(l.english.text) && !l.english.text.split("\n").some((x) => /^#{2,3} /.test(x) && APPARATUS_HEADING.test(x)), `B1 ${id}: apparatus inside the English body`);
      ok((l.english.translatorNote ?? "").split("\n").filter(Boolean).join("\n") === paired.note.join("\n"), `B1 ${id}: translator's note not carried apart exactly`);
    }
  }
  ok(srcTotal === 342, `B1: the pinned source holds ${srcTotal} letters, expected 342`);
  // Named source facts.
  const v42 = model.filter((l) => l.volume === 42), v46 = model.filter((l) => l.volume === 46), v47 = model.filter((l) => l.volume === 47);
  const i3154 = v42.findIndex((l) => l.printedNumber === 3154);
  ok(i3154 > 0 && v42[i3154 - 1].printedNumber === 3376 && v42[i3154 + 1].printedNumber === 3378, "B1: Vol 42 prints 3154 between 3376 and 3378 (reading order)");
  ok(!v42.some((l) => l.printedNumber === 3377), "B1: no 3377 is invented in Vol 42");
  const d3637 = v46.filter((l) => l.printedNumber === 3637);
  ok(d3637.length === 2 && new Set(d3637.map((l) => l.id)).size === 2 && !v46.some((l) => l.printedNumber === 3636), "B1: Vol 46 prints 3637 twice (two identities), no 3636");
  for (const n of [3647, 3648, 3649]) ok(v46.some((l) => l.printedNumber === n) && v47.some((l) => l.printedNumber === n), `B1: ${n} is printed in both Vol 46 and Vol 47`);
  const q = model.filter((l) => l.qualification);
  ok(q.length === 1 && q[0].volume === 47 && q[0].printedNumber === 3681 && JSON.stringify(q[0].qualification?.missingPrintedPages) === "[252]", "B1: exactly one source-incomplete letter — Vol 47 Letter 3681, printed page 252 missing");
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// B2 — ஒரே முத்தம் (ore-mutham)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
type Scene = { stem: string; section: string; scene: number; partHeading: string | null; sceneHeading: string; paras: string[]; apparatus: string };
/** A scene file: `#` part heading (optional) + `##`/`#` scene heading, then the text up to the first trailing H2. */
function readSceneSrc(file: string): Scene {
  const { meta, body } = frontMatter(read(file));
  const lines = body.split("\n");
  let partHeading: string | null = null, sceneHeading = "", i = 0;
  const heads: string[] = [];
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() === "") continue;
    const h = l.match(/^#{1,2} (.+)$/);
    if (!h || heads.length >= 2 || (heads.length === 1 && /(காட்சி|Scene) \d+$/.test(heads[0]))) break;
    heads.push(h[1].trim());
  }
  for (const h of heads) {
    const both = h.match(/^(.+?) — ((?:காட்சி|Scene) \d+)$/);
    if (both) { partHeading = both[1]; sceneHeading = both[2]; } else if (/^(காட்சி|Scene) \d+$/.test(h)) sceneHeading = h; else partHeading = h;
  }
  const rest = lines.slice(i);
  const cut = rest.findIndex((l) => /^## /.test(l));
  const text = noComments((cut < 0 ? rest : rest.slice(0, cut)).join("\n"));
  const paras = text.split(/\n[ \t]*\n/).map((p) => p.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim() !== "").join("\n")).filter(Boolean);
  const apparatus = cut < 0 ? "" : rest.slice(cut + 1).join("\n").trim();
  return { stem: path.basename(file, ".md"), section: String(meta?.section), scene: Number(meta?.scene), partHeading, sceneHeading, paras, apparatus };
}
/** The validator's own reading of a printed paragraph: what kind of unit is it, and what label (if any) is printed? */
function classify(p: string, lang: "ta" | "en"): { kind: PlayUnit["kind"]; label: string | null; sep: string | null } {
  const c = p[0];
  if (c === "[") return { kind: "stage-direction", label: null, sep: null };
  if (c === "(") return { kind: "stage-direction", label: null, sep: null };
  if (c === "“" || c === '"') return { kind: "verse", label: null, sep: null };
  if (/^[*\s]+$/.test(p)) return { kind: "ornament", label: null, sep: null };
  const head = p.split("\n")[0];
  // A label: a short run with no bracket/quote before the first printed separator.
  const seps = lang === "ta" ? [":-", ": ", " : ", " - ", ".-"] : [": "];
  let best: { at: number; sep: string } | null = null;
  for (const s of seps) { const at = head.indexOf(s); if (at > 0 && (!best || at < best.at)) best = { at, sep: s }; }
  if (lang === "ta" && head.endsWith(":-") && (!best || head.length - 2 < best.at)) best = { at: head.length - 2, sep: ":-" };
  if (lang === "en" && head.endsWith(":") && !best) best = { at: head.length - 1, sep: ":" };
  if (best) {
    const label = head.slice(0, best.at).replace(/\s+$/, "");
    const limit = best.sep.includes("-") && best.sep !== ":-" ? 20 : 40;
    if (label.length >= 1 && label.length <= limit && !/[[\]()“"]/.test(label)) {
      // The separator as printed: everything between the label and the speech.
      const after = head.slice(label.length);
      const sepPrinted = after.match(/^(\s*:-\s?|\s*:\s|\s+-\s+|\.-\s*|:-|:)/)?.[1] ?? best.sep;
      return { kind: "dialogue", label, sep: sepPrinted };
    }
  }
  if (/]$/.test(p) && !p.includes("[")) return { kind: "stage-direction", label: null, sep: null };
  return { kind: "dialogue", label: null, sep: null };
}
const unitLines = (u: PlayUnit) => {
  const t = u.kind === "dialogue" && u.speakerAsPrinted !== null ? `${u.speakerAsPrinted}${u.speakerSeparator}${u.text}` : u.text;
  return t.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim() !== "");
};
{
  const work = path.join(STAGE, "works/ore-mutham");
  const play = toOreMuthamPlay();
  const stems = fs.readdirSync(path.join(work, "scenes")).filter((f) => /\.md$/.test(f) && /^(main|nagai-suvai)-\d+\.md$/.test(f)).map((f) => f.replace(/\.md$/, ""));
  // PRESENCE
  ok(stems.length === 33 && play.readingUnits.length === 33, `B2: ${stems.length} source scenes, ${play.readingUnits.length} model units (expected 33)`);
  for (const s of stems) ok(play.readingUnits.some((u) => u.slug === s), `B2 ${s}: source scene missing from the model`);
  for (const s of stems) ok(fs.existsSync(path.join(work, "translations/en", `${s}.md`)), `B2 ${s}: no English scene file`);
  // STRUCTURE — order, parts, numbering scopes
  const srcScenes = stems.map((s) => ({ ta: readSceneSrc(path.join(work, "scenes", `${s}.md`)), en: readSceneSrc(path.join(work, "translations/en", `${s}.md`)) }));
  const partOrder = ["main-play", "supplementary-comedy"];
  srcScenes.sort((a, b) => partOrder.indexOf(a.ta.section) - partOrder.indexOf(b.ta.section) || a.ta.scene - b.ta.scene);
  ok(JSON.stringify(play.readingUnits.map((u) => u.slug)) === JSON.stringify(srcScenes.map((s) => s.ta.stem)), "B2: model unit order ≠ source order (main 1–30, then the comedy section 1–3)");
  ok(play.parts?.length === 2, "B2: two printed parts");
  const supHeadingTa = srcScenes.find((s) => s.ta.section === "supplementary-comedy" && s.ta.partHeading)?.ta.partHeading ?? null;
  const supHeadingEn = srcScenes.find((s) => s.en.section === "supplementary-comedy" && s.en.partHeading)?.en.partHeading ?? null;
  const supPart = play.parts?.find((p) => p.headingTa !== null);
  ok(!!supHeadingTa && supPart?.headingTa === supHeadingTa && supPart?.headingEn === supHeadingEn, `B2: supplementary part heading ${JSON.stringify(supPart)} ≠ printed ${supHeadingTa} / ${supHeadingEn}`);
  ok(play.parts?.find((p) => p.headingTa === null)?.headingEn === null, "B2: the main play has no printed part heading");
  for (let idx = 0; idx < srcScenes.length; idx++) {
    const s = srcScenes[idx];
    const u = play.readingUnits[idx];
    if (!u) continue;
    const sup = s.ta.section === "supplementary-comedy";
    tally("B2 scenes");
    ok(u.order === s.ta.scene && s.en.scene === s.ta.scene, `B2 ${u.slug}: model number ${u.order} ≠ printed ${s.ta.scene}`);
    ok(u.partId === (sup ? supPart?.id : play.parts?.find((p) => p.headingTa === null)?.id), `B2 ${u.slug}: wrong part`);
    ok(u.headingTa === s.ta.sceneHeading && u.headingEn === s.en.sceneHeading, `B2 ${u.slug}: scene heading ${u.headingTa}/${u.headingEn} ≠ printed ${s.ta.sceneHeading}/${s.en.sceneHeading}`);
    ok(sup ? u.titleTa === `${supHeadingTa} · ${s.ta.sceneHeading}` && u.titleEn === `${supHeadingEn} · ${s.en.sceneHeading}` : u.titleTa === s.ta.sceneHeading, `B2 ${u.slug}: title ${u.titleTa} is not part-scoped as printed`);
    ok(!sup || ((u.order ?? 0) >= 1 && (u.order ?? 0) <= 3), `B2 ${u.slug}: supplementary scene renumbered (${u.order})`);
    // EQUALITY + typing, per language
    for (const [lang, src, setting, units] of [["ta", s.ta, u.settingTa, u.tamil.units], ["en", s.en, u.settingEn, u.english.units]] as const) {
      const paras = [...src.paras];
      const setRe = lang === "ta" ? /^இடம்\s*:/ : /^Location:/;
      if (paras.length && setRe.test(paras[0])) ok(setting === paras.shift(), `B2 ${u.slug} ${lang}: setting ${JSON.stringify(setting)} ≠ printed`);
      else ok(setting === null, `B2 ${u.slug} ${lang}: setting invented`);
      const srcLines = paras.flatMap((p) => p.split("\n"));
      const modelLines = units.flatMap(unitLines);
      ok(JSON.stringify(modelLines) === JSON.stringify(srcLines), `B2 ${u.slug} ${lang}: text differs from the printed scene — ${firstDiff(srcLines, modelLines)}`);
      tally(`B2 ${lang} lines`, srcLines.length);
      // Walk units against paragraphs: each unit begins at a source paragraph; the validator's own classification of
      // that paragraph must agree with the model's kind and printed label (never an inferred speaker).
      let at = 0;
      for (const m of units) {
        const n = Math.max(1, m.text.split(/\n[ \t]*\n/).filter((x) => x.trim()).length);
        const p = paras[at];
        if (p === undefined) { ok(false, `B2 ${u.slug} ${lang}: model has more units than printed paragraphs`); break; }
        const c = classify(p, lang);
        ok(c.kind === m.kind, `B2 ${u.slug} ${lang}: unit kind ${m.kind} ≠ printed ${c.kind} for ${JSON.stringify(p.slice(0, 50))}`);
        if (m.kind === "dialogue") {
          ok(m.speakerAsPrinted === c.label, `B2 ${u.slug} ${lang}: speaker ${JSON.stringify(m.speakerAsPrinted)} ≠ printed ${JSON.stringify(c.label)} in ${JSON.stringify(p.slice(0, 50))}`);
          if (m.speakerAsPrinted) tally(`B2 ${lang} labelled speeches`);
        }
        if (m.kind === "stage-direction") ok(m.delimiter === (p[0] === "(" ? "round" : "square"), `B2 ${u.slug} ${lang}: delimiter ${m.delimiter} ≠ printed`);
        at += n;
      }
      ok(at === paras.length, `B2 ${u.slug} ${lang}: ${paras.length - at} printed paragraphs not covered by units`);
      // No apparatus in the text.
      ok(!modelLines.some((l) => /^## |Assembly provenance|Translation notes|source boundary:/.test(l)), `B2 ${u.slug} ${lang}: apparatus/comment inside the scene text`);
    }
    // The English notes are the English apparatus exactly, held apart.
    const notes = u.english.notes.map((n) => n.text).join("\n\n");
    ok(notes === s.en.apparatus && u.english.notes.every((n) => n.kind === "translation-note"), `B2 ${u.slug}: translation notes differ from the printed apparatus`);
  }
  ok(play.readingUnits.filter((u) => u.partId === supPart?.id).map((u) => u.order).join(",") === "1,2,3", "B2: the comedy section is numbered 1, 2, 3 — never 31–33");
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// B3 — சங்கத் தமிழ் (sangatamil)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
type Cls = "h1" | "h2" | "h3" | "quote" | "div-right" | "div-center" | "div-left" | "table" | "plain";
/** A page body → its content lines, each with the markup class it is printed under. */
function pageLines(body: string): { text: string; cls: Cls; heading?: string }[] {
  const out: { text: string; cls: Cls; heading?: string }[] = [];
  let div: Cls | null = null;
  for (const raw of noComments(body).split("\n")) {
    const l = raw.replace(/\s+$/, "");
    const open = l.match(/^<div align="(right|center|left)">(.*)$/);
    if (open) {
      const cls = `div-${open[1]}` as Cls;
      let inner = open[2];
      const closes = inner.includes("</div>");
      inner = inner.replace(/<\/div>\s*$/, "").replace(/\s+$/, "");
      if (inner.trim()) out.push({ text: inner, cls });
      div = closes ? null : cls;
      continue;
    }
    if (div && l.includes("</div>")) { const t = l.replace(/<\/div>\s*$/, "").replace(/\s+$/, ""); if (t.trim()) out.push({ text: t, cls: div }); div = null; continue; }
    if (l.trim() === "") continue;
    if (div) { out.push({ text: l, cls: div }); continue; }
    const h = l.match(/^(#{1,3}) (.+)$/);
    if (h) { out.push({ text: l.slice(h[1].length + 1), cls: `h${h[1].length}` as Cls, heading: h[2].trim() }); continue; }
    if (l.startsWith(">")) { const t = l.replace(/^> ?/, ""); if (t.trim()) out.push({ text: t, cls: "quote" }); continue; }
    if (l.startsWith("|")) { out.push({ text: l, cls: "table" }); continue; }
    out.push({ text: l, cls: "plain" });
  }
  return out;
}
const ARCHIVAL = new Set(["Illustration", "காட்சிப் பதிவு", "Visual record", "பக்க நிலை", "பிந்தைய நூலக ஒட்டு", "வெளியீட்டாளர்"]);
const GLOSS = /^(பொருள் விளக்கம்|Explanation of [Mm]eaning)\s*:?\s*$/;
const sig = (s: string) => (s.match(/[஀-௿0-9A-Za-z]/g) ?? []).join("");
{
  const work = path.join(LIT, "works/sangatamil");
  const w = toSangatamilWork();
  const sections = w.sections.map(toPublicSangatamilSection);
  const reg = JSON.parse(read(path.join(work, "navigation/sections.json"))) as { seq: number; heading: string; scan_start: number; scan_end: number; printed_pages: string; section_readme: string }[];
  // PRESENCE — sections
  ok(reg.length === 104 && sections.length === 104, `B3: ${reg.length} registered sections, ${sections.length} model sections (expected 104)`);
  for (let i = 0; i < reg.length; i++) {
    const r = reg[i];
    const s = sections[i];
    if (!s) { ok(false, `B3 section ${r.seq}: missing`); continue; }
    ok(s.seq === r.seq && s.slug === path.basename(path.dirname(r.section_readme)) && s.scans[0] === r.scan_start && s.scans[1] === r.scan_end && s.printedPages === r.printed_pages, `B3 section ${r.seq}: identity/scan range differs from the register`);
    ok(s.headingTa === (i === 0 || i === reg.length - 1 ? r.heading.split(" / ")[0] : r.heading), `B3 section ${r.seq}: heading ${s.headingTa} ≠ ${r.heading}`);
    ok(s.kind === (i === 0 ? "front-matter" : i === reg.length - 1 ? "back-matter" : "section"), `B3 section ${r.seq}: kind ${s.kind}`);
  }
  ok(sections.filter((s) => s.kind === "section").length === 102, "B3: 102 poem-commentary sections");
  // PRESENCE — pages
  const tFiles = fs.readdirSync(path.join(work, "pages")).filter((f) => /^\d{4}-.+\.md$/.test(f)).sort();
  const eFiles = fs.readdirSync(path.join(work, "translations/en/pages")).filter((f) => /^\d{4}-.+\.md$/.test(f)).sort();
  const pages = sections.flatMap((s) => s.pages);
  ok(tFiles.length === 497 && eFiles.length === 497 && pages.length === 497, `B3: ${tFiles.length} Tamil / ${eFiles.length} English page files, ${pages.length} model pages (expected 497)`);
  ok(pages.every((p, i) => p.scan === i + 1), "B3: model pages are not the physical scans 1–497 in order");
  for (const s of sections) ok(s.pages.every((p) => p.scan >= s.scans[0] && p.scan <= s.scans[1]) && s.pages.length === s.scans[1] - s.scans[0] + 1, `B3 section ${s.seq}: pages outside its scan range`);
  const roleSeen = new Set<string>();
  for (let i = 0; i < tFiles.length; i++) {
    const tf = tFiles[i];
    const scan = Number(tf.slice(0, 4));
    const p = pages[scan - 1];
    if (!p) { ok(false, `B3 scan ${scan}: missing from the model`); continue; }
    const t = frontMatter(read(path.join(work, "pages", tf)));
    const ef = eFiles[i];
    const e = frontMatter(read(path.join(work, "translations/en/pages", ef)));
    ok(Number(ef.slice(0, 4)) === scan && e.meta?.source_scan_page === scan, `B3 scan ${scan}: English page does not align`);
    const pt = String(t.meta?.page_type);
    // STRUCTURE — page identity and condition
    ok(p.pageType === pt && p.illustration === (pt === "illustration"), `B3 scan ${scan}: page type ${p.pageType} ≠ source ${pt}`);
    ok((p.printedPage ?? null) === (t.meta?.printed_page === null || t.meta?.printed_page === undefined ? null : t.meta.printed_page as string | number) || String(p.printedPage) === String(t.meta?.printed_page), `B3 scan ${scan}: printed page ${p.printedPage} ≠ source ${t.meta?.printed_page}`);
    const limited = t.meta?.status !== "verified";
    ok(!!p.sourceLimited === limited, `B3 scan ${scan}: source-limited ${!!p.sourceLimited} ≠ source status ${t.meta?.status}`);
    if (p.illustration) tally("B3 illustration pages");
    for (const [lang, body, blocks] of [["ta", t.body, p.tamil], ["en", e.body, p.english]] as const) {
      tally(`B3 ${lang} pages`);
      const src = pageLines(body);
      const model = blocks.flatMap((b) => b.lines.filter((l) => l.trim() !== "").map((l) => ({ text: l, b })));
      // EQUALITY — no line lost, none invented, order kept, each line its own line.
      ok(JSON.stringify(model.map((x) => x.text)) === JSON.stringify(src.map((x) => x.text)), `B3 scan ${scan} ${lang}: lines differ from the source page — ${firstDiff(src.map((x) => x.text), model.map((x) => x.text))}`);
      tally(`B3 ${lang} lines`, src.length);
      // STRUCTURE — the printed markup class of every line agrees with the model block that carries it.
      let ctx: "archival" | "gloss" | null = null;
      let lastBlock: unknown = null;
      for (let k = 0; k < Math.min(src.length, model.length); k++) {
        const s = src[k], { b } = model[k];
        roleSeen.add(b.role);
        const kindOk =
          s.cls === "h1" ? b.kind === "heading" && b.level === 1 :
          s.cls === "h2" ? b.kind === "heading" && b.level === 2 :
          s.cls === "h3" ? b.kind === "heading" && b.level === 3 :
          s.cls === "quote" ? b.kind === "quotation" :
          s.cls === "table" ? b.kind === "table" :
          s.cls === "div-center" ? (b.kind === "aligned" && b.align === "center") || b.kind === "ornament" :
          s.cls === "div-right" ? b.kind === "aligned" && b.align === "right" :
          s.cls === "div-left" ? b.kind === "aligned" && b.align === "left" :
          b.kind === "paragraph" || b.kind === "ornament";
        ok(kindOk, `B3 scan ${scan} ${lang}: line ${JSON.stringify(s.text.slice(0, 40))} printed as ${s.cls} but modelled as ${b.kind}${b.align ? "/" + b.align : ""}`);
        if (b === lastBlock) continue;
        lastBlock = b;
        // Role discipline, read from the page's own headings.
        if (s.cls === "h1") { ok(b.role === "section-title", `B3 scan ${scan} ${lang}: level-1 heading typed ${b.role}`); ctx = null; }
        else if (s.cls === "h2" || s.cls === "h3") {
          if (s.cls === "h2" && ARCHIVAL.has(s.heading!)) { ok(b.role === "archival-label", `B3 scan ${scan} ${lang}: archival label typed ${b.role}`); ctx = "archival"; }
          else if (s.cls === "h2" && GLOSS.test(s.heading!)) { ok(b.role === "gloss-heading", `B3 scan ${scan} ${lang}: gloss heading typed ${b.role}`); ctx = "gloss"; }
          else { ok(["printed-heading", "source-note"].includes(b.role), `B3 scan ${scan} ${lang}: printed heading typed ${b.role}`); ctx = null; }
        } else if (ctx === "archival") {
          ok(["archival-description", "copy-specific-marking", "front-matter-text"].includes(b.role), `B3 scan ${scan} ${lang}: archival description typed ${b.role} — archive text must never read as the book's`);
        } else if (ctx === "gloss" && (b.kind === "paragraph" || b.kind === "quotation")) {
          ok(["gloss", "source-citation", "source-note"].includes(b.role), `B3 scan ${scan} ${lang}: gloss typed ${b.role}`);
        } else if (s.cls === "quote") ok(["quotation", "source-citation", "source-note"].includes(b.role), `B3 scan ${scan} ${lang}: printed verse typed ${b.role}`);
        else if (s.cls === "div-right") ok(["right-aligned-fragment", "source-citation", "source-note"].includes(b.role), `B3 scan ${scan} ${lang}: right-aligned line typed ${b.role}`);
        if (b.kind === "ornament") ok(b.role === "ornament" && !b.citationIds && /^[*✦★✶·•\s\\]+$/.test(b.lines.join("")), `B3 scan ${scan} ${lang}: printed ornament ${JSON.stringify(b.lines.join(""))} typed ${b.role}${b.citationIds ? ` and linked to ${b.citationIds.join(",")}` : ""} — an ornament is never provenance text`);
        // Scan 8: heading + archive description only — the handwriting is never transcribed.
        if (limited) ok(["section-title", "archival-label", "archival-description"].includes(b.role), `B3 scan ${scan} ${lang}: ${b.role} on the source-limited page — only the heading and the archive description may appear`);
      }
    }
  }
  ok(tFiles.filter((f) => /^0008-/.test(f)).length === 1 && pages[7].sourceLimited?.kind === "handwritten-facsimile" && pages.filter((p) => p.sourceLimited).length === 1, "B3: scan 8 is the one source-limited page");
  ok((counts["B3 illustration pages"] ?? 0) === 97, `B3: ${counts["B3 illustration pages"]} illustration pages, expected 97`);
  for (const r of SANGATAMIL_ROLES) ok(roleSeen.has(r), `B3: role ${r} never rendered`);
  // Citations — the printed provenance register, read directly.
  type Rec = { id: string; anchor_scan: number; printed_provenance_block_markdown: string; composite_index?: number | null; composite_count?: number | null };
  const prov = JSON.parse(read(path.join(work, "navigation/provenance/index.json"))) as { formal_units: Rec[]; source_note_only: Rec[] };
  const recs = [...prov.formal_units.map((u) => ({ ...u, kind: "formal" })), ...prov.source_note_only.map((u) => ({ ...u, kind: "note" }))];
  ok(prov.formal_units.length === 115 && prov.source_note_only.length === 4, `B3: register lists ${prov.formal_units.length} formal citations + ${prov.source_note_only.length} source notes (expected 115 + 4)`);
  const modelIds = new Set(pages.flatMap((p) => [...p.tamil, ...p.english].flatMap((b) => b.citationIds ?? [])));
  ok(modelIds.size === 119 && recs.every((r) => modelIds.has(r.id)), `B3: model carries ${modelIds.size} distinct citation ids; expected the register's 119`);
  for (const r of recs) {
    const p = pages[r.anchor_scan - 1];
    const ta = p.tamil.filter((b) => b.citationIds?.includes(r.id));
    const en = p.english.filter((b) => b.citationIds?.includes(r.id));
    const role = r.kind === "formal" ? "source-citation" : "source-note";
    ok(ta.length > 0 && ta.every((b) => b.role === role || (r.kind === "note" && b.role === "source-note")), `B3 ${r.id}: Tamil provenance not typed ${role} on scan ${r.anchor_scan}`);
    ok(en.length > 0 && en.every((b) => b.role === "source-citation" || b.role === "source-note"), `B3 ${r.id}: English provenance not typed on scan ${r.anchor_scan}`);
    // The printed block's own words are in the typed blocks (register renderings may elide with `...` or condense lines).
    const have = sig(ta.flatMap((b) => b.lines).join("\n"));
    // A composite register row lists several citations, one per `<br>` entry; the unit owns entry `composite_index`.
    const entries = r.printed_provenance_block_markdown.split(/<br\s*\/?>/);
    const printed = (r.composite_count ?? 1) > 1 ? entries[(r.composite_index ?? 1) - 1] : r.printed_provenance_block_markdown;
    const pieces = printed.replace(/`/g, "").replace(/<br\s*\/?>/g, "\n").split(/\n| \/ |\.{3,}|…/).map(sig).filter((x) => x.length >= 3);
    // A source note the register condenses into one line (a printed heading + list) is compared word by word.
    const words = r.kind === "note" ? printed.replace(/`/g, "").replace(/<br\s*\/?>/g, " ").split(/[\s;:,—–()]+/).map(sig).filter((x) => x.length >= 2) : [];
    const missing = r.kind === "note" ? words.filter((x) => !have.includes(x)) : pieces.filter((x) => !have.includes(x));
    ok(missing.length === 0, `B3 ${r.id}: printed provenance not inside the typed blocks (missing ${JSON.stringify(missing.slice(0, 2))})`);
    tally("B3 citations");
  }
  // Separation: every provenance-typed block belongs to a register record, and every record-bearing block is typed.
  for (const p of pages) for (const b of [...p.tamil, ...p.english]) {
    const typed = b.role === "source-citation" || b.role === "source-note";
    ok(typed === !!b.citationIds?.length, `B3 scan ${p.scan}: ${typed ? "provenance block without a register record" : `register-linked block typed ${b.role}`}`);
  }
}

// ── report ─────────────────────────────────────────────────────────────────────────────────────────────────────
for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
if (fails.length) {
  console.error(`\nWave 8 P2 fidelity: ${fails.length} FAILURE(S) of ${checks} checks`);
  for (const f of fails.slice(0, 60)) console.error("  ✗ " + f);
  if (fails.length > 60) console.error(`  … ${fails.length - 60} more`);
  process.exit(1);
}
console.log(`\nWave 8 P2 fidelity: PASS — ${checks} checks (PRESENCE → STRUCTURE → EQUALITY against the frozen sources)`);
