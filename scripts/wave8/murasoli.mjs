// Wave 8 P1 — B1 Murasoli Letters Volumes 42–47 (expansion of the ONE existing `murasoli-letters` LibraryWork).
//
// Source authority (pinned): each volume's `chapters/*.md` (letter identity + page range — two header dialects:
// YAML front matter in Vols 42/43/46/47, Markdown bullet metadata in Vols 44/45), the canonical `pages/page-NNN.md`
// records (the Tamil text — also two dialects: YAML-front-matter body, or `## Source text` … `## Archival notes`),
// and the released English under `translations/en/letters/` with its volume manifest as the release-state authority.
//
// Identity: a printed letter number is NOT unique (Vol 46 prints 3637 twice; 3647–3649 recur in Vols 46 and 47), so
// the canonical id is `m{volume}-{chapter file stem}` — source-derived, rerun-stable, never positional, never a
// corrected number. The printed number is kept separately and exactly. `routeSlug` (for later stages) keeps the live
// `m{volume}-l{number}` convention where that pair is unique in its volume, and otherwise appends the source stem's
// own title part — the displayed printed number is never altered.
import fs from "node:fs";
import path from "node:path";
import { WAVE8_PINS, die, readSource, splitFrontMatter, parseFlatYaml, trimBlankLines, splitComments, toJson } from "./common.mjs";

const VOLUMES = [42, 43, 44, 45, 46, 47];
const pad3 = (n) => String(n).padStart(3, "0");
const bullet = (t, label) => { const m = t.match(new RegExp(`^- ${label}:\\s*(.+)$`, "m")); return m ? m[1].trim() : null; };
const intOrNull = (v) => (v === null || v === undefined || v === "" || v === "null" ? null : Number(String(v).replace(/^0+(?=\d)/, "")));

function isoFromPrinted(d) {
  // Printed dd-m-yyyy → ISO. Only used when the chapter records no ISO date; the printed form is kept alongside.
  // The source occasionally mixes separators (Vol 44 Letter 3533 prints `06.03-2011`); the printed form is kept verbatim.
  const m = d && d.match(/^(\d{1,2})[-.](\d{1,2})[-.](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
}

function readChapter(volDir, file) {
  const t = readSource(path.join(volDir, "chapters", file));
  const stem = file.replace(/\.md$/, "");
  const { fm, body } = splitFrontMatter(t);
  if (fm !== null) {
    const y = parseFlatYaml(fm);
    const dateIso = y.date_iso ?? (typeof y.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(y.date) ? y.date : null);
    return {
      dialect: "yaml-front-matter", stem,
      number: y.letter_number, titleTa: y.title_ta ?? y.title ?? null, titleTaContents: y.title_ta_contents ?? null,
      datePrinted: y.date_printed ?? null, dateIso, dateSource: y.date_source ?? null,
      pdfStart: y.pdf_page_start, pdfEnd: y.pdf_page_end, printedStart: intOrNull(y.printed_page_start), printedEnd: intOrNull(y.printed_page_end),
      status: y.status ?? y.transcription_status ?? null,
      missingPrintedPages: Array.isArray(y.missing_printed_pages) ? y.missing_printed_pages : [],
      lastAvailablePrintedPage: y.last_available_printed_page ?? null,
      body,
    };
  }
  const h1 = t.match(/^# Letter (\d+) — (.+)$/m);
  const srcTitle = t.match(/^## Source title\n\n(.+)$/m);
  const datePrinted = bullet(t, "Date");
  return {
    dialect: "markdown-bullets", stem,
    number: Number(bullet(t, "Letter number") ?? (h1 && h1[1])),
    titleTa: srcTitle ? srcTitle[1].trim() : null, titleTaContents: null,
    datePrinted, dateIso: isoFromPrinted(datePrinted), dateSource: null,
    pdfStart: intOrNull(bullet(t, "PDF page start")), pdfEnd: intOrNull(bullet(t, "PDF page end")),
    printedStart: intOrNull(bullet(t, "Printed page start")), printedEnd: intOrNull(bullet(t, "Printed page end")),
    status: bullet(t, "Status"), missingPrintedPages: [], lastAvailablePrintedPage: null, body: t,
  };
}

function readPage(volDir, pdf) {
  const file = path.join(volDir, "pages", `page-${pad3(pdf)}.md`);
  if (!fs.existsSync(file)) die(`missing page record ${file}`);
  const t = readSource(file);
  const { fm, body } = splitFrontMatter(t);
  let meta, text, dialect;
  if (fm !== null) {
    const y = parseFlatYaml(fm);
    meta = { letterNumber: y.letter_number ?? null, printedPage: intOrNull(y.printed_page), pdfPage: y.pdf_page };
    text = body; dialect = "yaml-front-matter";
  } else {
    if (!t.startsWith("# PDF Page ")) die(`${file}: unrecognised page dialect`);
    const s = t.indexOf("\n## Source text\n"), e = t.indexOf("\n## Archival notes\n");
    if (s < 0 || e < 0 || e < s) die(`${file}: missing Source text / Archival notes sections`);
    meta = { letterNumber: intOrNull(bullet(t, "Letter")), printedPage: intOrNull(bullet(t, "Printed page")), pdfPage: intOrNull(bullet(t, "PDF page")) };
    text = t.slice(s + "\n## Source text\n".length, e); dialect = "markdown-bullets";
  }
  if (meta.pdfPage !== pdf) die(`${file}: records PDF page ${meta.pdfPage}, expected ${pdf}`);
  const { text: clean, annotations } = splitComments(text);
  return { pdfPage: pdf, printedPage: meta.printedPage, letterNumber: meta.letterNumber, dialect, tamil: trimBlankLines(clean), annotations };
}

// Editorial/archival note sections that follow the translation (the complete set present in the pinned 342 files).
const STOP_H2 = /^(?:## (?:Letter-specific notes|Source-check notes|Source-specific note|Alignment record|Original Tamil)|### Source note\s*$)/;
const WRAPPER_H2 = /^## English translation(?: — available source only)?\s*$/;
function readEnglish(file) {
  const t = readSource(file);
  const { fm, body } = splitFrontMatter(t);
  if (fm === null) die(`${file}: English record without front matter`);
  const y = parseFlatYaml(fm);
  const lines = body.split("\n");
  const h1 = lines.findIndex((l) => l.startsWith("# "));
  if (h1 < 0) die(`${file}: no H1`);
  let i = h1 + 1;
  // A printed subtitle rendered as an H2 directly under the H1 (e.g. Vol 45 `## (Continuation from Yesterday)(2)`).
  let subtitle = null;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i < lines.length && lines[i].startsWith("## ") && !STOP_H2.test(lines[i]) && !WRAPPER_H2.test(lines[i])) { subtitle = lines[i].slice(3).trim(); i++; }
  const note = [];
  while (i < lines.length && (lines[i].trim() === "" || lines[i].startsWith(">"))) { if (lines[i].startsWith(">")) note.push(lines[i]); i++; }
  // Apparatus link/date lines (not translation text).
  while (i < lines.length && (lines[i].trim() === "" || /^\*\*(Tamil source|Source pages|Date|Source|Printed date)[^*]*:\*\*/.test(lines[i]))) i++;
  const bodyLines = [], notes = [];
  let inNotes = false;
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (/^## Original Tamil/.test(l)) break;
    if (STOP_H2.test(l)) { inNotes = true; continue; }
    if (!inNotes && WRAPPER_H2.test(l)) continue; // wrapper heading only
    (inNotes ? notes : bodyLines).push(l);
  }
  const { text, annotations } = splitComments(bodyLines.join("\n"));
  return {
    number: y.letter_number, pdfStart: y.source_pdf_page_start, titleEn: y.english_title ?? null,
    headingEn: lines[h1].replace(/^# /, ""), subtitleEn: subtitle, translationMethod: y.translation_method ?? null,
    translatorNote: note.length ? note.join("\n") : null,
    text: trimBlankLines(text), notes: trimBlankLines(notes.join("\n")) || null, annotations,
  };
}

function parseCsv(t) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"' && t[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cur); cur = ""; } else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; } else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  const [h, ...rest] = rows.filter((r) => r.length > 1);
  return rest.map((r) => Object.fromEntries(h.map((k, j) => [k, r[j]])));
}

/** English release state per letter, from the volume's manifest (the release authority, not per-file front matter). */
function englishReleaseStates(volDir, vol) {
  const dir = path.join(volDir, "translations/en");
  const csv = path.join(dir, "TRANSLATION_MANIFEST.csv");
  const byFile = new Map();
  if (fs.existsSync(csv)) {
    for (const r of parseCsv(readSource(csv))) {
      const state = r.final_release_status ?? r.translation_status;
      byFile.set(path.basename(r.file), { state, alignment: r.bilingual_alignment_status ?? null, editorial: r.editorial_review_status ?? null, sourceIncomplete: r.source_incomplete === "true" });
    }
    return { authority: `volumes/volume-${vol}/translations/en/TRANSLATION_MANIFEST.csv`, byFile, observations: [] };
  }
  // Vol 47: Markdown manifest + FINAL_RELEASE_REPORT — the volume decision applies to every listed letter file.
  const md = readSource(path.join(dir, "TRANSLATION_MANIFEST.md"));
  const report = readSource(path.join(dir, "FINAL_RELEASE_REPORT.md"));
  if (!/\*\*PASS — Volume 47 English translation is release-ready within the limits of the surviving source\.\*\*/.test(report)) die("Vol 47: final release decision not found");
  // The manifest defines the release inventory as the 59 records in `letters/`, one per number 3647–3705.
  const range = md.match(/Canonical letter range: \*\*(\d+)–(\d+)\*\*/);
  const expected = md.match(/Expected letter records: \*\*(\d+)\*\*/);
  if (!range || !expected) die("Vol 47: manifest release identity not found");
  const files = fs.readdirSync(path.join(dir, "letters")).filter((f) => /^\d{4}-.+\.md$/.test(f)).sort();
  const nums = files.map((f) => Number(f.slice(0, 4)));
  const [lo, hi] = [Number(range[1]), Number(range[2])];
  if (files.length !== Number(expected[1]) || new Set(nums).size !== files.length || nums.some((n) => n < lo || n > hi) || hi - lo + 1 !== files.length) die("Vol 47: letters/ inventory does not match the manifest release identity");
  // The exception is identified by the manifest's declared LETTER NUMBER. The manifest's named filename for it
  // (`letters/3681-let-the-darkness-disappear-come-quickly-come.md`) does not exist in `letters/` — the record there is
  // `3681-come-drive-away-the-darkness-come-quickly-come.md`. That stale filename is a source-documentation
  // discrepancy; it is recorded, not repaired, and the letter number (unique in this volume) decides.
  const declared = md.match(/Source-incomplete records: \*\*1 — letter (\d+)\*\*/);
  if (!declared) die("Vol 47: declared source-incomplete letter not found in manifest");
  const excNum = Number(declared[1]);
  const excFiles = files.filter((f) => Number(f.slice(0, 4)) === excNum);
  if (excFiles.length !== 1) die(`Vol 47: expected one English record for letter ${excNum}`);
  const named = md.match(new RegExp("`letters/(" + excNum + "-[^`]+\\.md)`"));
  const observations = named && named[1] !== excFiles[0]
    ? [{ kind: "manifest-filename-mismatch", letter: excNum, manifestNames: `letters/${named[1]}`, presentFile: `letters/${excFiles[0]}`, resolution: "identified by the manifest's declared letter number; source not modified" }]
    : [];
  for (const f of files) byFile.set(f, { state: f === excFiles[0] ? "release-ready-with-source-exception" : "release-ready", alignment: "complete", editorial: "complete", sourceIncomplete: f === excFiles[0] });
  return { authority: "volumes/volume-47/translations/en/TRANSLATION_MANIFEST.md + FINAL_RELEASE_REPORT.md", byFile, observations };
}

export function importMurasoli(src) {
  const pins = WAVE8_PINS.murasoli;
  const volumes = [];
  for (const vol of VOLUMES) {
    const rel = `volumes/volume-${vol}`;
    const volDir = path.join(src, rel);
    const metaText = readSource(path.join(volDir, "metadata.yml"));
    const meta = parseFlatYaml(metaText);
    const nested = !("source_file" in meta);
    // Vol 45 records its source under a nested `source:` block — read the scalars we need explicitly.
    const nestedScalar = (k) => { const m = metaText.match(new RegExp(`^  ${k}:\\s*(.+)$`, "m")); return m ? parseFlatYaml(`x: ${m[1]}`).x : null; };
    const sourceFile = nested ? nestedScalar("filename") : meta.source_file;
    const sourceSha = nested ? null : (meta.source_sha256 ?? null); // Vol 45: the archive records no SHA-256 — kept null, never invented.
    const pdfPages = nested ? nestedScalar("total_pdf_pages") : meta.pdf_pages;
    if (!sourceFile || !pdfPages) die(`${rel}: controlling source identity not found in metadata.yml`);

    const chapterFiles = fs.readdirSync(path.join(volDir, "chapters")).filter((f) => /^\d{4}-.+\.md$/.test(f)).sort();
    const enDir = path.join(volDir, "translations/en/letters");
    const enFiles = fs.readdirSync(enDir).filter((f) => /^\d{4}-.+\.md$/.test(f)).sort();
    const english = enFiles.map((f) => ({ file: f, ...readEnglish(path.join(enDir, f)) }));
    const release = englishReleaseStates(volDir, vol);

    const chapters = chapterFiles.map((f) => readChapter(volDir, f));
    const numberCounts = new Map();
    for (const c of chapters) numberCounts.set(c.number, (numberCounts.get(c.number) ?? 0) + 1);

    const letters = chapters.map((c) => {
      if (!Number.isInteger(c.number)) die(`${rel}/${c.stem}: letter number unreadable`);
      if (!Number.isInteger(c.pdfStart) || !Number.isInteger(c.pdfEnd) || c.pdfEnd < c.pdfStart) die(`${rel}/${c.stem}: PDF page range unreadable`);
      if (!c.stem.startsWith(`${c.number}-`)) die(`${rel}/${c.stem}: file stem does not carry the recorded number`);
      const pages = [];
      for (let p = c.pdfStart; p <= c.pdfEnd; p++) {
        const pg = readPage(volDir, p);
        if (pg.letterNumber !== null && pg.letterNumber !== c.number) die(`${rel} page ${p}: belongs to letter ${pg.letterNumber}, not ${c.number}`);
        pages.push({ pdfPage: pg.pdfPage, printedPage: pg.printedPage, dialect: pg.dialect, tamil: pg.tamil, annotations: pg.annotations });
      }
      if (pages.some((p) => p.tamil.length === 0)) die(`${rel}/${c.stem}: an empty Tamil page segment`);
      const en = english.filter((e) => e.number === c.number && e.pdfStart === c.pdfStart);
      if (en.length !== 1) die(`${rel}/${c.stem}: expected exactly one English record (number + PDF start), found ${en.length}`);
      const e = en[0];
      const rs = release.byFile.get(e.file);
      if (!rs) die(`${rel}/${c.stem}: English file ${e.file} absent from the release manifest`);
      if (!e.text) die(`${rel}/${c.stem}: empty English body`);
      const sourceIncomplete = c.status === "source-incomplete";
      const unique = numberCounts.get(c.number) === 1;
      return {
        id: `m${vol}-${c.stem}`,
        routeSlug: unique ? `m${vol}-l${c.number}` : `m${vol}-l${c.stem}`,
        volume: vol,
        printedNumber: c.number,
        printedNumberUniqueInVolume: unique,
        sourceStem: c.stem,
        chapterDialect: c.dialect,
        titleTa: c.titleTa,
        ...(c.titleTaContents && c.titleTaContents !== c.titleTa ? { titleTaContents: c.titleTaContents } : {}),
        titleEn: e.titleEn,
        datePrinted: c.datePrinted,
        dateIso: c.dateIso,
        ...(c.dateSource ? { dateSource: c.dateSource } : {}),
        pdfPages: [c.pdfStart, c.pdfEnd],
        printedPages: [c.printedStart, c.printedEnd],
        sourceStatus: c.status,
        ...(sourceIncomplete ? {
          qualification: {
            kind: "source-incomplete",
            missingPrintedPages: c.missingPrintedPages,
            lastAvailablePrintedPage: c.lastAvailablePrintedPage,
            note: "Only the surviving source pages are carried; the missing continuation, closing, signature and date text are not reconstructed.",
          },
        } : {}),
        tamil: { pages },
        english: {
          file: `translations/en/letters/${e.file}`,
          releaseState: rs.state,
          translationMethod: e.translationMethod,
          heading: e.headingEn,
          ...(e.subtitleEn ? { subtitle: e.subtitleEn } : {}),
          translatorNote: e.translatorNote,
          text: e.text,
          notes: e.notes,
          ...(e.annotations.length ? { annotations: e.annotations } : {}),
        },
      };
    });
    const ids = new Set(letters.map((l) => l.id));
    if (ids.size !== letters.length) die(`${rel}: duplicate canonical ids`);
    if (english.length !== letters.length) die(`${rel}: ${english.length} English records vs ${letters.length} Tamil records`);
    volumes.push({
      volume: vol,
      sourcePath: rel,
      sourceTree: pins.volumes[vol],
      controllingSource: { filename: sourceFile, sha256: sourceSha, pdfPages, ...(sourceSha === null ? { sha256Note: "The archive records no controlling-scan SHA-256 for this volume; identity is filename + physical extent + pinned tree. No hash is inferred." } : {}) },
      englishReleaseAuthority: release.authority,
      ...(release.observations && release.observations.length ? { sourceObservations: release.observations } : {}),
      letterCount: letters.length,
      letters,
    });
  }
  return volumes;
}

export function murasoliFiles(volumes) {
  const files = {};
  for (const v of volumes) files[`murasoli/volume-${v.volume}.json`] = toJson(v);
  return files;
}
