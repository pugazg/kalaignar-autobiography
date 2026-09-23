// Deterministic Speech-family importer — Wave 7 Batches 5a/5b (முத்துக் குளியல் Parts I/II, 97 public
// speeches) + Batch 6 (3 assembly speeches).
//
//   node scripts/import-wave7-speeches.mjs <public-speeches-clone> <assembly-speeches-clone> [--check | --verify]
//
// Reads ONLY the pinned canonical layers of each work — metadata.json + the frozen Tamil transcription +
// the verified English — and vendors reader data to public/data/speeches/<slug>/{speech.json,
// provenance.json}. `--check` parses and validates everything but writes nothing; `--verify` additionally
// requires every vendored payload and the internal manifest to be BYTE-IDENTICAL to a fresh regeneration
// (the deterministic-regeneration proof CI runs at the frozen pins). Runtime never calls
// GitHub; no source PDF is vendored (identity travels as filename + SHA-256 + size + page map).
//
// FIDELITY. Literary text is copied BYTE-FOR-BYTE: no NFC/NFD, no whitespace collapse, no punctuation or
// orthographic change; source Markdown emphasis is kept. Page markers, the printed item numeral, archive
// apparatus (audit / checkpoint / closure / review sections, blockquoted archive notes, HTML comments) never
// enter the reading text. Each speech's printed closing colophon (a separately printed date/occasion line
// the source archive keeps OUTSIDE the speech body) is carried as a distinct `note` block, never merged
// into the speech.
//
// PUBLIC PAYLOADS CARRY NO INTERNAL STATE. No hidden / wave / batch / readiness / workflow field is written
// under public/data — everything in public/ is served as a static file. Internal P1 state lives in
// data/internal/wave7/b5-b6-k-p1-manifest.json (written by this importer), which is never served.
//
// ENGLISH FORM (owner decision, 2026-09-23). The source marks every English layer `verified-complete`, but
// 45 முத்துக் குளியல் Part-I English layers are condensed renderings rather than full translations (English
// ÷ Tamil body words 0.13–0.94, against ≥ 1.13 for every full translation). The form is MEASURED here,
// deterministically, and published honestly: `englishForm` = "full-translation" when the ratio ≥ 1.0, else
// "condensed". The per-slug result is frozen in the P1 manifest, so any drift fails the validators.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const VERIFY = args.includes("--verify");
const CHECK = args.includes("--check") || VERIFY;
const [PS_REPO, AS_REPO] = args.filter((a) => !a.startsWith("--"));
if (!PS_REPO || !AS_REPO) {
  console.error("usage: node scripts/import-wave7-speeches.mjs <public-speeches-clone> <assembly-speeches-clone> [--check]");
  process.exit(1);
}
const die = (m) => { console.error(`import-wave7-speeches: ${m}`); process.exit(1); };
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const readText = (p) => fs.readFileSync(p, "utf8");
const readJSON = (p) => JSON.parse(readText(p));
const git = (repo, ...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8" }).trim();

// ── FROZEN WAVE-7 P0 SOURCE PINS (fail closed) ────────────────────────────────────────────────────────
export const PS_PIN = "6ca57fe20706ebcb59f3432e8067fd11a1565b54";
export const AS_PIN = "7a7fed1d0e3eb24a396effc10854b178f32bd0cf";
if (git(PS_REPO, "rev-parse", "HEAD") !== PS_PIN) die(`public-speeches HEAD is not the frozen pin ${PS_PIN}`);
if (git(AS_REPO, "rev-parse", "HEAD") !== AS_PIN) die(`assembly-speeches HEAD is not the frozen pin ${AS_PIN}`);

// ── FROZEN POPULATION (WAVE7_COMPLETED_WORKS_CENSUS.md §4, pugazg/kalaignar-tribute) ───────────────────
// Written out explicitly: the census is the authority, not whatever the moving source tree holds.
export const B5A = [
  "aadithanar-piranthanaal-vizha", "aazhvargal-aaivu-maiya-vizha-1997", "alagabath-maanadu", "annai-teresa-padathirappu",
  "annai-velangkanni-aalaya-velli-vizha", "bharathi-vizha", "bharathiyar-vizha-1997", "bharathiyum-pudhumaip-pengalum",
  "doctor-radhakrishnan-virudhu-vazhangu-vizha", "dr-ambedkar-palkalaikkazhaga-thodakka-vizha", "ezhaiyin-sirippil",
  "haikku-kavithaigal", "ilaignargal-kattalaiyidum-kaalam", "ilakkiyathil-tamilagam", "ilakkuvanar", "ilangkovadigal-1",
  "ilangkovadigal-2", "ilangkovadigal-3", "ilangkovadigal-4", "irasarasan-silai", "irumozhi-pothum",
  "ithayangal-iyanthirangal-aagavendam", "kalai-valarppom", "kalaivanar", "kambar-vizha-1", "kambar-vizha-2",
  "kannimara-pothu-noolaga-nootrandu-vizha", "kappalottiya-tamizhan", "karuthuch-suthanthiram", "koozhaangkallai-vairamaakkuvom",
  "kural-vazhi-nadappir", "maanagaratchiyil-sudhandhira-ponvizha", "maanavargalum-arasiyalum", "madurai-theendamai-ozhippu-maanadu",
  "malark-kaatchi", "manappuratchi-thevai", "mozhimanam-peruvom", "naam-jananayagam-naan-sarvathikaram",
  "naam-ore-saathi-tamizhsaathi", "nadaga-dasar", "nila-mutram", "paththirikaip-penne", "payitru-mozhi",
  "pazhaiya-varalaarum-ilaiya-thalaimuraiyum", "pirappokkum", "punitha-thomaiyar", "rukmani-lakshmipathi-nutrandu-vizha",
  "salem-periyar-palkalaikkazhaga-thodakka-vizha", "sangakala-tamizh-naanayangkal-nool-veliyeettu-vizha",
  "sudhandhira-ponvizha-thamizhaga-thiyagigal-vazhiyanuppu-vizha", "sudhandhira-thina-ponvizha", "tamilin-solvalam",
  "tamilisai-iyakkam", "tamilkkudi-magan", "tamizhukku-niram-undu", "thathuvam", "umamaheswaranar", "vallalar-vazhi-ethu",
  "valluvarkkor-aalayam", "vasathiyullor-vazhi-viduga", "yathum-oore-yavarum-kelir",
];
export const B5B = [
  "ambur-sampangi-illa-manavizha", "annai-teresa-nool-veliyittu-vizha", "ayyanan-ambalam-padathirappu-vizha",
  "chennai-aazhvargal-aaivu-maiya-vizha-urai", "chennai-chennai-puranagar-vanigargal-sanga-maanadu",
  "chennai-erodu-tamizhanban-noolgal-veliyittu-vizha", "chennai-exnora-rotary-niruvanangalin-paarattu-vizha",
  "chennai-nathigam-ramasami-illa-manavizha", "chennai-thiraiyulagam-nadathiya-paarattu-vizha",
  "chennai-thiripura-orumaippattu-thina-koottam", "chennai-thiyagigal-manimandapa-thirappuvizha",
  "desiya-ilainjar-kondatta-thodakka-vizha", "indiya-suvishesha-thiruchabai-vizha",
  "isaithamizhin-unmai-varalaru-nool-veliyittu-vizha", "kanchi-manimozhiyar-illa-manavizha",
  "kanchipuram-cvm-annamalai-illa-manavizha", "karl-marx-mozhipeyarppu-noolgal-jamadhagni-veliyittu-vizha",
  "kavikko-abdul-raguman-manivizha", "madurai-madha-nallinakka-maanadu", "madurai-vazhakkarinjar-sanga-125-aavathu-aanduvizha",
  "may-thina-vizha", "murasoli-arakkattalai-virudhu-vazhangu-vizha", "muthamizh-peravai-vizha",
  "nagarkovil-jeevanandham-manimandapa-thirappuvizha", "nellikuppam-pugazhendhi-manavizha", "perayar-ezra-sargunam-manivizha",
  "pidil-kumbakonam-rajamanickam-pillai-nootraandu-vizha", "purusai-gopalarathinam-illa-manavizha", "puthandu-isaivizha",
  "rajapalayam-kumarasami-raja-nootraandu-vizha", "thiraippada-virudhu-vazhangum-vizha",
  "thiru-vi-ka-kalki-noolgalukku-parivuthogai-vazhangum-vizha", "thiruvalluvar-vizha",
  "thiruvannamalai-arunai-poriyiyal-kalloori-pattamalippu-vizha", "tn-rajarathinam-pillai-nootraandu-vizha",
  "veeran-sundaralingam-ninaivu-grama-thirappuvizha",
];
export const B6 = ["1971-namathu-vilakkam", "1973-03-07-financial-statement-reply", "1973-03-08-financial-statement-reply"];
// Explicit exclusions the census names — asserted absent from the imported population.
const EXCLUDED = ["pazhaiya-varalarum-ilaiya-thalaimuraiyum", "kalaivanar-nsk-memorial-day-audio-06", "irulum-oliyum", "1973-irulum-oliyum"];
const ALREADY_ONBOARDED = ["udhaya-kathir", "poonthottam", "arappor", "kalaivanar-nsk-memorial-day", "idhaya-perikai", "namathu-nilai", "palli-vazhkkai"];

if (B5A.length !== 61) die(`B5a census count ${B5A.length} != 61`);
if (B5B.length !== 36) die(`B5b census count ${B5B.length} != 36`);
if (B6.length !== 3) die(`B6 census count ${B6.length} != 3`);
const ALL = [...B5A, ...B5B, ...B6];
if (new Set(ALL).size !== 100) die("duplicate slug in the frozen population");
for (const x of [...EXCLUDED, ...ALREADY_ONBOARDED]) if (ALL.includes(x)) die(`excluded/onboarded slug in population: ${x}`);

// ── COLLECTIONS (muthukkuliyal Part I / II) ────────────────────────────────────────────────────────────
const COLL = {
  "muthukkuliyal-part-1": { part: "I", members: B5A, total: 61 },
  "muthukkuliyal-part-2": { part: "II", members: B5B, total: 36 },
};
const collMeta = {};
for (const [id, c] of Object.entries(COLL)) {
  const dir = path.join(PS_REPO, "collections", id);
  const m = readJSON(path.join(dir, "metadata.json"));
  if (m.id !== id) die(`${id}: collection metadata id mismatch`);
  collMeta[id] = { meta: m, tree: git(PS_REPO, "rev-parse", `HEAD:collections/${id}`) };
}

// ── PUBLIC-SPEECH PARSER ──────────────────────────────────────────────────────────────────────────────
// Page markers: `## PDF N / printed p.M` (single page) or `## PDF N–M / printed pp.A–B` (a range the
// English sometimes uses for one rendered block). The body starts at the first page marker (Tamil; and
// English where it has markers) or at the first prose line after the file's own title/status header
// (English without markers). The body ENDS at the first apparatus heading. A heading is apparatus when it
// is written in Latin script and is not a page marker — every Tamil content heading contains Tamil script,
// and every English apparatus heading carries one of the archive's workflow words.
const PM_ONE = /^##\s+PDF\s+(\d+)\s*\/\s*printed\s+p\.\s*(\d+)\s*$/;
const PM_RANGE = /^##\s+PDF\s+(\d+)\s*[–-]\s*(\d+)\s*\/\s*printed\s+pp\.\s*(\d+)\s*[–-]\s*(\d+)\s*$/;
const TAMIL = /[஀-௿]/;
const HEADING = /^(#{1,6})[ \t]+(.*)$/;
const CLOSING = /closing note/i;
const APPARATUS_EN = /\b(audit|checkpoint|closure|verification|review|result|repair|correction|corrections|gate|notes|clarifications|boundary|workflow|status|attention points|freeze|progress)\b/i;
const pageMarker = (probe) => {
  let m = PM_ONE.exec(probe);
  if (m) return { pdf: [Number(m[1])], printed: [Number(m[2])] };
  m = PM_RANGE.exec(probe);
  if (m) {
    const a = Number(m[1]), b = Number(m[2]), c = Number(m[3]), d = Number(m[4]);
    if (b < a || d < c || b - a !== d - c) die(`bad page-range marker ${probe}`);
    return { pdf: Array.from({ length: b - a + 1 }, (_, k) => a + k), printed: Array.from({ length: d - c + 1 }, (_, k) => c + k) };
  }
  return null;
};

function parsePublic(text, layer, slug) {
  const lines = text.split("\n");
  const hasMarkers = lines.some((l) => pageMarker(l.replace(/\s+$/, "")));
  // Body start.
  let start;
  if (hasMarkers) start = lines.findIndex((l) => pageMarker(l.replace(/\s+$/, "")));
  else {
    if (layer === "ta") die(`${slug}/ta: Tamil transcription has no page markers`);
    // Skip the file's own H1 title and **Label:** status header lines, then begin at the first line that
    // is neither blank, a header line, nor an apparatus heading.
    start = lines.findIndex((l, i) => {
      if (i === 0) return false;
      const p = l.replace(/\s+$/, "");
      if (p.trim() === "" || /^\*\*[A-Za-z][^*]*:\*\*/.test(p) || /^#\s/.test(p)) return false;
      const h = HEADING.exec(p);
      if (h && !TAMIL.test(h[2]) && (CLOSING.test(h[2]) || APPARATUS_EN.test(h[2]))) return false;
      return true;
    });
  }
  if (start < 0) die(`${slug}/${layer}: no reading body found`);

  const blocks = [];
  const pdfPages = []; const printedPages = [];
  let pdf = null, printed = null;
  let para = null;
  let quote = false; // the paragraph being built is a Markdown blockquote (quoted verse / quotation)
  let note = null;    // a labelled translator/source note (`> **Source note:** …`) being collected
  let itemNumeral = null;
  const headingTexts = [];
  const flush = () => {
    if (para && para.length) {
      blocks.push({ kind: "paragraph", ...(quote ? { quote: true } : {}), segments: [{ text: para.join("\n"), sourcePage: printed, joinToNext: "end" }], sourcePages: printed == null ? [] : [printed] });
    }
    para = null; quote = false;
    if (note) { blocks.push({ kind: "note", text: note.join("\n"), sourcePage: printed }); note = null; }
  };
  let closing = null; // { lines: [] } while capturing the printed closing colophon
  let endedAt = null;
  for (let i = start; i < lines.length; i++) {
    const raw = lines[i];
    const probe = raw.replace(/\s+$/, "");
    const pm = pageMarker(probe);
    if (pm) {
      if (closing) die(`${slug}/${layer}: page marker after the closing note (line ${i + 1})`);
      flush();
      for (const p of pm.pdf) pdfPages.push(p);
      for (const p of pm.printed) printedPages.push(p);
      pdf = pm.pdf[pm.pdf.length - 1]; printed = pm.printed[0];
      continue;
    }
    const h = HEADING.exec(probe);
    if (h) {
      const text = h[2];
      if (/^\d+$/.test(text.trim()) && h[1].length === 3) {
        // The printed collection item numeral above the title (`### 1`). Provenance, not reading text.
        flush();
        if (itemNumeral !== null) die(`${slug}/${layer}: second item numeral`);
        itemNumeral = Number(text.trim());
        continue;
      }
      if (!TAMIL.test(text) && CLOSING.test(text)) {
        flush();
        if (closing) { endedAt = i; break; }
        closing = { lines: [], heading: text };
        continue;
      }
      if (!TAMIL.test(text) && (layer === "ta" || APPARATUS_EN.test(text))) { flush(); endedAt = i; break; }
      if (closing) { endedAt = i; break; } // any heading after the colophon ends it
      flush();
      // A content heading (a printed title / subtitle / section heading). Text after the marker verbatim.
      blocks.push({ kind: "heading", text: raw.slice(raw.indexOf(h[2], h[1].length)), sourcePage: printed });
      headingTexts.push(h[2]);
      continue;
    }
    if (closing) { if (probe.trim() !== "") closing.lines.push(raw); continue; }
    // Bold-label variant of the closing-colophon section: `**Source closing note (separate from speech body):**`.
    const bc = /^\*\*[^*]*closing note[^*]*:\*\*\s*(.*)$/i.exec(probe);
    if (bc) { flush(); closing = { lines: bc[1] ? [bc[1]] : [], heading: probe }; continue; }
    if (probe.trim() === "") { flush(); continue; }
    if (/^-{3,}$/.test(probe)) { flush(); continue; }
    if (/^<!--[\s\S]*-->$/.test(probe)) continue;
    // A LABELLED note in a blockquote — `> **Source note:** …`, `> **Translator note:** …`,
    // `> **E1/E2/E3 transparency note:** …` — is the translator's/archive's editorial note, which the source
    // guide requires to be clearly labelled. It becomes a `note` block (rendered apart from the speech),
    // label and wording verbatim; its continuation lines join it.
    if (/^>\s*\*\*[^*]*\bnote\b[^*]*:\*\*/i.test(probe)) { flush(); note = [raw.replace(/^>[ ]?/, "")]; continue; }
    if (note && /^>/.test(probe)) { note.push(raw.replace(/^>[ ]?/, "")); continue; }
    if (note) flush();
    if (/^>/.test(probe)) {
      // A blockquote INSIDE the speech body is quoted text the speaker recites (verse, a cited passage).
      // Only the Markdown `>` syntax is removed — like a heading marker — the quoted words stay verbatim.
      // Archive workflow notes are also written as blockquotes, but only OUTSIDE the body; one found
      // inside it is a structural surprise and stops the import.
      if (/^>\s*(\*\*Status|Tamil T\d|English E\d|E\d\b|T\d\b|This (English|translation|is the)|Source-verified)/.test(probe)) die(`${slug}/${layer}: archive note inside the speech body (line ${i + 1})`);
      if (para && !quote) flush();
      quote = true;
      (para ||= []).push(raw.replace(/^>[ ]?/, ""));
      continue;
    }
    if (quote) flush();
    (para ||= []).push(raw);
  }
  flush();
  return { blocks, pdfPages, printedPages, hasMarkers, itemNumeral, closing, headingTexts, endedAt };
}

// The printed closing colophon, as its own source text. Archive wrappers are stripped — a leading bold scan
// label such as `**PDF640 / printed p.639:**` and per-line backtick fences — and the archive's own commentary
// about the colophon is dropped: in the Tamil layer every colophon line is Tamil-script, so a Latin-only line is
// commentary ("The closing note does not state a venue; none is inferred."); in the English layer the two
// commentary lines begin "The closing note …" / "The source …".
function closingText(closing, layer) {
  if (!closing || !closing.lines.length) return null;
  const out = [];
  for (const raw of closing.lines) {
    let t = raw.replace(/\s+$/, "");
    t = t.replace(/^\*\*[^*]*(PDF|printed)[^*]*:\*\*\s*/i, "");
    if (/^(>|-\s+\*\*|\*\*Status)/.test(t)) continue;
    t = t.replace(/^`(?!`)/, "").replace(/(?<!`)`$/, "");
    if (!t.trim()) continue;
    // (a backtick-quoted Tamil form inside an English commentary line does not make it a colophon line)
    if (layer === "ta" && !TAMIL.test(t.replace(/`[^`]*`/g, ""))) continue;
    if (layer === "en" && /^(The closing note|The source)\b/.test(t)) continue;
    out.push(t);
  }
  return out.length ? out.join("\n") : null;
}

// FROZEN SOURCE-MARKER GAPS. The one interior page the frozen Tamil layer does not mark separately:
// `pirappokkum` PDF 402 / printed p.401 has no `## PDF 402` heading — its (verified, 21/21) text sits
// unseparated under PDF 401 / printed p.400. Those paragraphs are attributed to BOTH printed pages, never to
// one guessed page. Any other gap is unexpected and stops the import.
const MARKER_GAPS = {
  pirappokkum: { unmarkedPdf: [402], carriedUnderPdf: 401, printedSpan: [400, 401] },
};

const words = (blocks) => blocks.filter((b) => b.kind === "paragraph").reduce((n, b) => n + b.segments.map((s) => s.text).join(" ").split(/\s+/).filter(Boolean).length, 0);
const seq = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);

// ── BUILD ONE PUBLIC SPEECH ───────────────────────────────────────────────────────────────────────────
function buildPublic(slug, collectionId) {
  const rel = `speeches/${slug}`;
  const DIR = path.join(PS_REPO, rel);
  const meta = readJSON(path.join(DIR, "metadata.json"));
  if (meta.id !== slug) die(`${slug}: metadata id ${meta.id}`);
  if (meta.document_type !== "public-speech-constituent") die(`${slug}: document_type ${meta.document_type}`);
  const pc = meta.parent_collection;
  if (pc?.id !== collectionId) die(`${slug}: parent collection ${pc?.id} != ${collectionId}`);
  const w = meta.workflow;
  if (w.tamil_transcription !== "verified-complete" || w.archive_status !== "fully-archived" || w.pending_transcription_or_translation_work !== false) {
    die(`${slug}: source workflow is not closed (${w.tamil_transcription} / ${w.archive_status})`);
  }
  const enStatus = w.english_translation_final_verification ?? w.english_translation;
  if (!/^(verified-complete|complete)/.test(String(enStatus))) die(`${slug}: English status ${enStatus}`);

  const src = meta.source;
  const pdfSeq = seq(src.pdf_page_start, src.pdf_page_end);
  const printedSeq = seq(src.printed_page_start, src.printed_page_end);
  if (pdfSeq.length !== src.speech_pages_total || printedSeq.length !== pdfSeq.length) die(`${slug}: metadata page range inconsistent`);

  const taText = readText(path.join(DIR, "transcription-ta.md"));
  const enText = readText(path.join(DIR, "translation-en.md"));
  const ta = parsePublic(taText, "ta", slug);
  const en = parsePublic(enText, "en", slug);

  // COVERAGE (Tamil). The body markers are the metadata range in order, PDF = printed + 1; a final page
  // that carries ONLY the printed colophon may be absent from the body markers, and then the colophon must
  // exist. Nothing else may be missing, duplicated or reordered.
  const gap = MARKER_GAPS[slug];
  const markedSeq = gap ? pdfSeq.filter((p) => !gap.unmarkedPdf.includes(p)) : pdfSeq;
  const markedPrinted = markedSeq.map((p) => printedSeq[pdfSeq.indexOf(p)]);
  const n = ta.pdfPages.length;
  if (JSON.stringify(ta.pdfPages) !== JSON.stringify(markedSeq.slice(0, n))) die(`${slug}/ta: PDF marker sequence ${ta.pdfPages.join(",")} is not the metadata range ${pdfSeq.join(",")}`);
  if (JSON.stringify(ta.printedPages) !== JSON.stringify(markedPrinted.slice(0, n))) die(`${slug}/ta: printed marker sequence != metadata range`);
  if (n < markedSeq.length - 1 || (n === markedSeq.length - 1 && !ta.closing)) die(`${slug}/ta: body markers cover ${n}/${markedSeq.length} pages`);
  if (gap) {
    const carried = printedSeq[pdfSeq.indexOf(gap.carriedUnderPdf)];
    let touched = 0;
    for (const b of ta.blocks) {
      if (b.kind === "paragraph" && b.segments[0].sourcePage === carried) {
        b.segments = b.segments.map((sg) => ({ ...sg, sourcePage: null }));
        b.sourcePages = [...gap.printedSpan];
        touched++;
      }
    }
    if (!touched) die(`${slug}: frozen marker gap matched no paragraphs`);
  }
  if (ta.itemNumeral !== null && ta.itemNumeral !== pc.constituent_number) die(`${slug}: printed item numeral ${ta.itemNumeral} != constituent ${pc.constituent_number}`);
  if (en.hasMarkers) {
    const m = en.pdfPages.length;
    if (JSON.stringify(en.pdfPages) !== JSON.stringify(pdfSeq.slice(0, m)) || m < n) die(`${slug}/en: English page markers do not cover the Tamil body pages in order`);
  }
  if (!ta.blocks.some((b) => b.kind === "paragraph")) die(`${slug}/ta: empty body`);
  if (!en.blocks.some((b) => b.kind === "paragraph")) die(`${slug}/en: empty body`);
  for (const b of [...ta.blocks, ...en.blocks]) {
    if (b.kind === "note") continue; // labelled editorial notes are rendered apart, and may cite E1/E2/E3
    const t = b.kind === "paragraph" ? b.segments.map((s) => s.text).join("") : b.text;
    if (/^##\s+PDF|<!--|verified-complete|\bT[123]\b audit|\bE[123]\b/.test(t)) die(`${slug}: apparatus leaked into a reading block: ${t.slice(0, 80)}`);
  }

  // ENGLISH FORM — measured, never asserted from the status string.
  const taWords = words(ta.blocks), enWords = words(en.blocks);
  const ratio = Math.round((enWords / taWords) * 100) / 100;
  const englishForm = ratio >= 1.0 ? "full-translation" : "condensed";

  const taClosing = closingText(ta.closing, "ta");
  const enClosing = closingText(en.closing, "en");
  const titleTa = meta.title.ta ?? meta.title.contents_title_ta ?? meta.title.ta_contents;
  if (!titleTa) die(`${slug}: no Tamil title`);
  // English title: the source's own English title where it records one; otherwise the English file's
  // own H1 (the translator's title for the speech), stripped of its "— English translation" suffix.
  const enH1 = (/^#\s+(.+?)\s*$/m.exec(enText) || [])[1];
  const titleEn = meta.title.en ?? (enH1 ? enH1.replace(/\s+[—–-]\s+English translation\s*$/i, "") : null);
  if (!titleEn) die(`${slug}: no English title`);

  const sp = meta.speech || {};
  const venueTa = sp.venue_ta ?? null;
  const eventTa = sp.event_ta ?? sp.event_source_text ?? null;
  const cmeta = collMeta[collectionId].meta;
  const tamilBlocks = [...ta.blocks];
  if (taClosing) tamilBlocks.push({ kind: "note", text: taClosing, sourcePage: printedSeq[printedSeq.length - 1] });
  const englishBlocks = [...en.blocks];
  if (enClosing) englishBlocks.push({ kind: "note", text: enClosing, sourcePage: printedSeq[printedSeq.length - 1] });

  const speech = {
    workId: slug, slug,
    sourceRepo: "pugazg/kalaignar-public-speeches", sourcePath: rel, sourceCommit: PS_PIN,
    shelf: "speeches", subtype: "public-speech", readerStructure: "speech",
    date: sp.date ?? null,
    year: sp.date ? Number(String(sp.date).slice(0, 4)) : null,
    title: { ta: titleTa, en: titleEn },
    speechType: meta.document_type,
    speaker: { nameTa: meta.creator.name_ta, nameEn: meta.creator.name_en },
    transcriptionStatus: w.tamil_transcription,
    translationStatus: String(enStatus),
    englishForm,
    englishCoverage: { englishToTamilWordRatio: ratio, basis: "body-word-count" },
    tamil: { sectionTitleTa: "தமிழ் மூல உரை", blocks: tamilBlocks },
    english: { sectionTitleEn: englishForm === "condensed" ? "Condensed English rendering" : "English translation", blocks: englishBlocks },
    sourcePages: printedSeq,
    venue: venueTa ? { ta: venueTa, en: null } : null,
    event: eventTa ? { ta: eventTa, en: null } : null,
    occasion: null,
    audience: null,
    collection: { id: collectionId, titleTa: `முத்துக் குளியல் — பாகம் ${COLL[collectionId].part}`, titleEn: `Muthukkuliyal — Part ${COLL[collectionId].part}`, ordinal: pc.constituent_number, total: pc.constituent_total },
  };

  // Part I has no single original SHA (the 1.82 GB original was supplied as 39 exact-range splits);
  // record the split(s) that carry THIS speech's pages, each with its own verified identity.
  const splits = (cmeta.source.splits || []).filter((s) => s.original_pdf_scan_end >= src.pdf_page_start && s.original_pdf_scan_start <= src.pdf_page_end)
    .map((s) => ({ filename: s.filename, scans: `${s.original_pdf_scan_start}–${s.original_pdf_scan_end}`, sha256: s.sha256, bytes: s.bytes }));
  const pub = cmeta.publication || {};
  const notStated = [];
  if (!speech.date) notStated.push("date");
  if (!venueTa) notStated.push("venue");
  const provenance = {
    workId: slug, sourceRepo: speech.sourceRepo, sourcePath: rel, sourceCommit: PS_PIN,
    source: {
      publicationTitleTa: `${cmeta.title.ta} — ${cmeta.title.part_text ?? `பாகம் ${COLL[collectionId].part}`}`,
      ...(pub.first_edition_source_text || pub.edition_text ? { firstEditionTa: pub.first_edition_source_text ?? pub.edition_text } : {}),
      ...(pub.publisher_ta ? { publisherTa: pub.publisher_ta } : {}),
      ...(pub.publisher_address_source_text ? { publisherAddressTa: pub.publisher_address_source_text } : {}),
      ...(pub.printer_source_text ? { printerTa: pub.printer_source_text } : {}),
      ...(pub.price_text ? { coverPriceTa: pub.price_text } : {}),
      ...(pub.rights_source_text ? { rightsNoticeTa: pub.rights_source_text } : {}),
      scanFilename: src.filename ?? src.original_filename_expected ?? cmeta.source.original_filename_expected ?? cmeta.source.filename,
      ...(src.sha256 ?? cmeta.source.sha256 ? { scanSha256: src.sha256 ?? cmeta.source.sha256 } : {}),
      ...(src.file_size_bytes ?? cmeta.source.file_size_bytes ? { scanFileSizeBytes: src.file_size_bytes ?? cmeta.source.file_size_bytes } : {}),
      scanTotalPages: src.source_pdf_pages_total ?? src.original_pdf_pages_user_confirmed ?? cmeta.source.original_pdf_pages_user_confirmed ?? cmeta.source.pdf_pages,
      speechScanPages: `${src.pdf_page_start}–${src.pdf_page_end}`,
      printedSpeechPages: `${src.printed_page_start}–${src.printed_page_end}`,
      ...(splits.length ? { scanSplits: splits } : {}),
      collectionItem: { collectionId, ordinal: pc.constituent_number, total: pc.constituent_total },
      ...(notStated.length ? { speechFactsNotStated: notStated } : {}),
      ...(sp.date_note || sp.venue_note ? { speechFactsNoteEn: [sp.date_note, sp.venue_note].filter(Boolean).join(" ") } : {}),
    },
    transcription: { status: w.tamil_transcription, verified_against_scan: true },
    translation: { status: String(enStatus), type: englishForm === "condensed" ? "condensed English rendering (not a full translation)" : "faithful reading translation" },
    englishForm,
    englishCoverage: { englishToTamilWordRatio: ratio, tamilBodyWords: taWords, englishBodyWords: enWords, basis: "body-word-count" },
    archiveDerived: {
      sectionHeadings: ta.blocks.filter((b) => b.kind === "heading").length,
      tamilResolvedParagraphs: ta.blocks.filter((b) => b.kind === "paragraph").length,
      englishParagraphs: en.blocks.filter((b) => b.kind === "paragraph").length,
      sourcePagesCovered: printedSeq.length,
    },
    notes: [
      "The controlling source is the scanned printed collection; it is not vendored. Its identity travels as filename, SHA-256 and page map.",
      "The speech's printed closing line (date / occasion) is shown as a separate note, outside the speech body, exactly as the source keeps it.",
      ...(gap ? [`The source transcription does not mark PDF ${gap.unmarkedPdf.join(", ")} / printed p.${gap.printedSpan[1]} as a separate page: that page's verified text is carried, unseparated, under PDF ${gap.carriedUnderPdf} / printed p.${gap.printedSpan[0]}. Paragraphs from those two pages are attributed to printed pp.${gap.printedSpan[0]}–${gap.printedSpan[1]} together, never to one page.`] : []),
    ],
  };
  return { slug, speech, provenance, englishForm, ratio, collectionId, ordinal: pc.constituent_number, tree: git(PS_REPO, "rev-parse", `HEAD:${rel}`) };
}

// ── ASSEMBLY PARSER ───────────────────────────────────────────────────────────────────────────────────
// Canonical layer: the verified Tamil under `# தமிழ் மூல உரை` (and, for the 1973 speeches, the English
// under the final `# English translation` of the same file — its translation.md is a retired pointer;
// 1971's English lives in translation.md under `# English translation`). Page markers are
// `<!-- source-page: N -->` (scan pages). Blockquoted archive notes, `### Source page N` navigation
// labels, other HTML comments and `---` rules are apparatus.
const SRC_PAGE = /^<!--\s*source-page:\s*(\d+)\s*-->$/;
function parseAssembly(text, wrapper, slug, layer) {
  const lines = text.split("\n");
  // The LAST wrapper heading opens the canonical layer (the 1973 files carry an earlier retired pointer
  // section with the same heading).
  let start = -1;
  lines.forEach((l, i) => { if (wrapper.test(l.replace(/\s+$/, ""))) start = i; });
  if (start < 0) die(`${slug}/${layer}: canonical wrapper heading not found`);
  const blocks = []; const pages = [];
  let page = null, para = null;
  const flush = () => {
    if (para && para.length) blocks.push({ kind: "paragraph", segments: [{ text: para.join("\n"), sourcePage: page, joinToNext: "end" }], sourcePages: page == null ? [] : [page] });
    para = null;
  };
  for (let i = start + 1; i < lines.length; i++) {
    const raw = lines[i];
    const probe = raw.replace(/\s+$/, "");
    // Page markers: `<!-- source-page: N -->` (Tamil) or the `### Source page N` label (the English layer
    // carries only the label; the Tamil carries both, label right after the comment). A page is counted once.
    const pm = SRC_PAGE.exec(probe) || /^###\s+Source page\s+(\d+)\s*$/i.exec(probe);
    if (pm) { flush(); const n = Number(pm[1]); if (n !== page) { page = n; pages.push(page); } continue; }
    if (/^#\s/.test(probe)) { flush(); break; }            // next top-level section (e.g. the English layer)
    if (/^<!--[\s\S]*-->$/.test(probe)) continue;           // emendation / other archive comments
    if (/^>/.test(probe)) { flush(); continue; }            // blockquoted archive note
    if (/^-{3,}$/.test(probe)) { flush(); continue; }
    if (probe.trim() === "") { flush(); continue; }
    const h = HEADING.exec(probe);
    if (h) { flush(); blocks.push({ kind: "heading", text: raw.slice(raw.indexOf(h[2], h[1].length)), sourcePage: page }); continue; }
    (para ||= []).push(raw);
  }
  flush();
  return { blocks, pages };
}

const rangeSeq = (spec, label) => {
  const m = /^(\d+)\s*[-–]\s*(\d+)$/.exec(String(spec).trim());
  if (!m) die(`${label}: unparseable range ${spec}`);
  return seq(Number(m[1]), Number(m[2]));
};

const ASSEMBLY = {
  "1971-namathu-vilakkam": { rel: "speeches/1971/1971-namathu-vilakkam", enFile: "translation.md" },
  "1973-03-07-financial-statement-reply": { rel: "speeches/1973/1973-03-07-financial-statement-reply", enFile: "transcript.md" },
  "1973-03-08-financial-statement-reply": { rel: "speeches/1973/1973-03-08-financial-statement-reply", enFile: "transcript.md" },
};

function buildAssembly(slug) {
  const cfg = ASSEMBLY[slug];
  const DIR = path.join(AS_REPO, cfg.rel);
  const meta = readJSON(path.join(DIR, "metadata.json"));
  if (meta.id !== slug) die(`${slug}: metadata id ${meta.id}`);
  const tr = meta.transcription, tl = meta.translation;
  if (tr.verified_against_scan !== true) die(`${slug}: Tamil not verified against scan`);
  if (!/^verified/.test(String(tl.status)) || tl.verified_against_tamil !== true) die(`${slug}: English not verified (${tl.status})`);
  const ta = parseAssembly(readText(path.join(DIR, "transcript.md")), /^#\s+தமிழ்\s*மூல\s*உரை$/, slug, "ta");
  const en = parseAssembly(readText(path.join(DIR, cfg.enFile)), /^#\s+English translation$/, slug, "en");
  const expected = rangeSeq(meta.source.speech_scan_pages, `${slug} speech_scan_pages`);
  if (JSON.stringify(ta.pages) !== JSON.stringify(expected)) die(`${slug}/ta: source-page sequence != ${meta.source.speech_scan_pages}`);
  if (JSON.stringify(en.pages) !== JSON.stringify(expected)) die(`${slug}/en: source-page sequence != ${meta.source.speech_scan_pages}`);
  for (const b of [...ta.blocks, ...en.blocks]) {
    const t = b.kind === "paragraph" ? b.segments.map((s) => s.text).join("") : b.text;
    if (/<!--|^>|Source page \d+|crop recovery|Gate [A-H]\b/.test(t)) die(`${slug}: apparatus leaked into a reading block: ${t.slice(0, 80)}`);
  }
  const taWords = words(ta.blocks), enWords = words(en.blocks);
  const ratio = Math.round((enWords / taWords) * 100) / 100;
  if (ratio < 1.0) die(`${slug}: assembly English ratio ${ratio} < 1 (expected full translations)`);
  const sp = meta.speech;
  const titleTa = sp.title_ta ?? sp.source_heading_ta;
  // The English title is the source's own: metadata `title_en`, else the English layer's first printed
  // heading (the translation of the Tamil source heading) — never composed here.
  const titleEn = sp.title_en ?? en.blocks.find((b) => b.kind === "heading")?.text;
  if (!titleTa || !titleEn) die(`${slug}: no source-backed title`);
  const speech = {
    workId: slug, slug,
    sourceRepo: "pugazg/kalaignar-assembly-speeches", sourcePath: cfg.rel, sourceCommit: AS_PIN,
    shelf: "speeches", subtype: "assembly-speech", readerStructure: "speech",
    date: meta.date ?? null,
    year: meta.year ?? null,
    title: { ta: titleTa, en: titleEn },
    speechType: sp.type,
    speaker: { nameTa: meta.speaker.name_ta, nameEn: meta.speaker.name_en, ...(meta.speaker.role_ta ? { roleTa: meta.speaker.role_ta, roleEn: meta.speaker.role_en } : {}) },
    transcriptionStatus: String(tr.status),
    translationStatus: String(tl.status),
    englishForm: "full-translation",
    englishCoverage: { englishToTamilWordRatio: ratio, basis: "body-word-count" },
    tamil: { sectionTitleTa: "தமிழ் மூல உரை", blocks: ta.blocks },
    english: { sectionTitleEn: "English translation", blocks: en.blocks },
    sourcePages: expected,
    legislature: { nameTa: meta.legislature.name_ta, nameEn: meta.legislature.name_en },
    event: { ta: sp.event_ta, en: sp.event_en },
  };
  const s = meta.source;
  const sourceNotes = [];
  if (meta.legislature.scope_note) sourceNotes.push(meta.legislature.scope_note);
  if (tr.source_crop_holds) sourceNotes.push(`Source crop condition: ${tr.source_crop_holds}.`);
  if (s.page_relation_note) sourceNotes.push(`Page relation: ${s.page_relation_note}.`);
  // The 1973 transcripts keep the booklet's PHYSICAL line breaks as a verified source feature (the archive
  // audits and corrects lineation); they are kept verbatim, so a word divided at a printed line end shows
  // divided, exactly as printed.
  if (ta.blocks.some((b) => b.kind === "paragraph" && b.segments[0].text.includes("\n"))) sourceNotes.push("The Tamil keeps the booklet's printed line breaks exactly as the verified transcription records them, including words divided at a line end.");
  if (s.printed_date_evidence) sourceNotes.push(`Speech-date evidence: ${s.printed_date_evidence}.`);
  if (sp.underlying_events) sourceNotes.push(`Underlying sittings: ${sp.underlying_events.map((e) => `${e.date} (${e.house})`).join("; ")}.`);
  const provenance = {
    workId: slug, sourceRepo: speech.sourceRepo, sourcePath: cfg.rel, sourceCommit: AS_PIN,
    source: {
      publicationTitleTa: s.publication_title_ta,
      ...(s.cover_attribution_ta ? { authorTa: s.cover_attribution_ta } : {}),
      ...(s.publication_date ? { publicationDate: s.publication_date } : {}),
      ...(s.publication_date_printed ? { publicationDatePrintedTa: s.publication_date_printed } : {}),
      ...(s.publisher_ta || s.issuing_body_ta ? { publisherTa: s.publisher_ta ?? s.issuing_body_ta } : {}),
      ...(s.publisher_location_ta || s.publication_place_ta ? { publisherLocationTa: s.publisher_location_ta ?? s.publication_place_ta } : {}),
      ...(s.printer_ta ? { printerTa: s.printer_ta } : {}),
      scanFilename: s.scan_filename,
      scanSha256: s.sha256,
      scanFileSizeBytes: s.file_size_bytes,
      scanTotalPages: s.scan_total_pages,
      speechScanPages: s.speech_scan_pages,
      ...(s.speech_printed_pages ? { speechPrintedPages: s.speech_printed_pages } : {}),
      ...(s.front_matter_scan_pages ? { frontMatterScanPages: s.front_matter_scan_pages } : {}),
      ...(meta.date ? {} : { speechFactsNotStated: ["date"], speechFactsNoteEn: "The source booklet is an edited compilation of replies in both Houses; it establishes no single speech date." }),
    },
    transcription: { status: String(tr.status), verified_against_scan: true },
    translation: { status: String(tl.status), type: tl.type ?? "faithful reading translation" },
    englishForm: "full-translation",
    englishCoverage: { englishToTamilWordRatio: ratio, tamilBodyWords: taWords, englishBodyWords: enWords, basis: "body-word-count" },
    archiveDerived: {
      sectionHeadings: ta.blocks.filter((b) => b.kind === "heading").length,
      tamilResolvedParagraphs: ta.blocks.filter((b) => b.kind === "paragraph").length,
      englishParagraphs: en.blocks.filter((b) => b.kind === "paragraph").length,
      sourcePagesCovered: expected.length,
    },
    ...(sourceNotes.length ? { semantics: { note: sourceNotes.join(" ") } } : {}),
    notes: [
      "The controlling source is the scanned printed booklet; it is not vendored. Its identity travels as filename, SHA-256 and page map.",
      ...(slug.startsWith("1973") ? ["இருளும் ஒளியும் (1973) is the publication that prints this speech; the 7 and 8 March 1973 replies are two separate speeches, each preserved from its own pages."] : []),
    ],
  };
  return { slug, speech, provenance, englishForm: "full-translation", ratio, collectionId: null, ordinal: null, tree: git(AS_REPO, "rev-parse", `HEAD:${cfg.rel}`) };
}

// ── RUN ───────────────────────────────────────────────────────────────────────────────────────────────
const results = [];
for (const [cid, c] of Object.entries(COLL)) for (const slug of c.members) results.push(buildPublic(slug, cid));
for (const slug of B6) results.push(buildAssembly(slug));

// Printed order + membership, proved against each collection's own numbering: ordinals 1..N, no gaps.
for (const [cid, c] of Object.entries(COLL)) {
  const ords = results.filter((r) => r.collectionId === cid).map((r) => r.ordinal).sort((a, b) => a - b);
  if (JSON.stringify(ords) !== JSON.stringify(seq(1, c.total))) die(`${cid}: constituent ordinals are not exactly 1..${c.total}`);
}

const OUT_ROOT = path.join(process.cwd(), "public/data/speeches");
const FORBIDDEN_PUBLIC_KEYS = ["hidden", "wave", "batch", "readiness", "discoverable", "sitemapExposed", "publicRoute"];
const manifestWorks = [];
for (const r of results) {
  const sj = JSON.stringify(r.speech, null, 1) + "\n";
  const pj = JSON.stringify(r.provenance, null, 1) + "\n";
  for (const k of FORBIDDEN_PUBLIC_KEYS) if (new RegExp(`"${k}"\\s*:`).test(sj + pj)) die(`${r.slug}: internal key "${k}" in a public payload`);
  if (VERIFY) {
    for (const [f, body] of [["speech.json", sj], ["provenance.json", pj]]) {
      const p = path.join(OUT_ROOT, r.slug, f);
      if (!fs.existsSync(p) || fs.readFileSync(p, "utf8") !== body) die(`--verify: ${r.slug}/${f} is not byte-identical to a fresh regeneration`);
    }
  }
  if (!CHECK) {
    const OUT = path.join(OUT_ROOT, r.slug);
    fs.rmSync(OUT, { recursive: true, force: true });
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, "speech.json"), sj);
    fs.writeFileSync(path.join(OUT, "provenance.json"), pj);
  }
  manifestWorks.push({
    slug: r.slug,
    batch: B5A.includes(r.slug) ? "B5a" : B5B.includes(r.slug) ? "B5b" : "B6",
    sourceRepo: r.speech.sourceRepo, sourcePath: r.speech.sourcePath, sourceCommit: r.speech.sourceCommit, sourceTree: r.tree,
    collectionId: r.collectionId, ordinal: r.ordinal,
    englishForm: r.englishForm, englishToTamilWordRatio: r.ratio,
    speechJsonSha256: sha256(sj), provenanceJsonSha256: sha256(pj),
  });
}
const summary = {
  B5a: B5A.length, B5b: B5B.length, B6: B6.length,
  condensedEnglish: manifestWorks.filter((w) => w.englishForm === "condensed").map((w) => w.slug),
};
console.log(`import-wave7-speeches — public @ ${PS_PIN} · assembly @ ${AS_PIN}${CHECK ? " (check only)" : ""}`);
console.log(`  works: ${results.length} (B5a ${B5A.length} · B5b ${B5B.length} · B6 ${B6.length})`);
console.log(`  English: ${manifestWorks.length - summary.condensedEnglish.length} full translations · ${summary.condensedEnglish.length} condensed renderings`);
const MAN = path.join(process.cwd(), "data/internal/wave7/b5-b6-speeches-manifest.json");
const manifestBody = JSON.stringify({
    schema: 1,
    note: "INTERNAL — Wave-7 B5a/B5b/B6 import record (never served). Frozen per-slug source identity, English form and payload hashes.",
    sources: { publicSpeeches: { repo: "pugazg/kalaignar-public-speeches", commit: PS_PIN }, assemblySpeeches: { repo: "pugazg/kalaignar-assembly-speeches", commit: AS_PIN } },
    collections: Object.fromEntries(Object.entries(COLL).map(([id, c]) => [id, { tree: collMeta[id].tree, total: c.total, members: results.filter((r) => r.collectionId === id).sort((a, b) => a.ordinal - b.ordinal).map((r) => r.slug) }])),
    summary,
    works: manifestWorks,
  }, null, 1) + "\n";
if (VERIFY) {
  if (!fs.existsSync(MAN) || fs.readFileSync(MAN, "utf8") !== manifestBody) die("--verify: internal manifest is not byte-identical to a fresh regeneration");
  console.log(`  --verify: ${results.length * 2} payloads + manifest byte-identical to a fresh regeneration`);
}
if (!CHECK) {
  fs.mkdirSync(path.dirname(MAN), { recursive: true });
  fs.writeFileSync(MAN, manifestBody);
  console.log("  wrote data/internal/wave7/b5-b6-speeches-manifest.json");
}
