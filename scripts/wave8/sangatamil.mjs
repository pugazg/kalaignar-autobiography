// Wave 8 P1 — B3 சங்கத் தமிழ் (`sangatamil`): one new Literary Commentary LibraryWork, HIDDEN foundation.
//
// Source authority (pinned `works/sangatamil`): the 497 canonical `pages/NNNN-*.md` records (Tamil, per physical
// scan), the 497 maintained-English `translations/en/pages/NNNN-*.md` records, and the closed structural registers
// exported as `navigation/sections.json` (104 source-order sections) and `navigation/provenance/index.json` (115 formal
// provenance units + 4 source-note-only records). Scan 8 (the handwritten `முன்னுரை` facsimile) is a PERMANENT
// source-limited page — description-only; its handwriting is never transcribed or reconstructed.
//
// Each page body is tokenised into typed blocks WITHOUT rewriting its text: every block keeps its source lines exactly
// (hard-break spaces included). A block has a structural `type` and a voice `role`, so later stages can never render a
// printed Sangam-source citation, a quoted classical poem, a printed gloss or an archival description as Kalaignar's
// own words. Standalone archival HTML comments are carried separately as annotations, never as text.
import fs from "node:fs";
import path from "node:path";
import { WAVE8_PINS, die, readSource, splitFrontMatter, parseFlatYaml, toJson } from "./common.mjs";

// Archival section labels — the archive describing the physical page, not printed text (exact heading texts).
const ARCHIVAL_LABELS = new Map([
  ["Illustration", "archival-description"], ["காட்சிப் பதிவு", "archival-description"], ["Visual record", "archival-description"],
  ["பக்க நிலை", "archival-description"], ["பிந்தைய நூலக ஒட்டு", "copy-specific-marking"], ["வெளியீட்டாளர்", "front-matter-text"],
]);
const GLOSS_HEADING = /^(பொருள் விளக்கம்|Explanation of [Mm]eaning)\s*:?\s*$/;
const FRONT_MATTER_TYPES = new Set(["cover", "title-page", "title-leaf", "publisher-note", "publisher-details", "publication-details", "library-annotation", "blank", "foreword", "facsimile"]);
const ORNAMENT = /^[*✦★✶·•\s\\]+$/;
const SANGAM_ANTHOLOGIES = ["அகநானூறு", "புறநானூறு", "குறுந்தொகை", "நற்றிணை", "ஐங்குறுநூறு", "கலித்தொகை", "பதிற்றுப்பத்து", "பரிபாடல்", "பத்துப்பாட்டு"];

/** Tokenise one page body into typed blocks. Lines are kept exactly as the source writes them. */
export function tokenize(body, pageType) {
  const annotations = [];
  const lines = body.split("\n");
  const blocks = [];
  let context = null; // role inherited from the governing archival label or gloss heading
  const baseRole = FRONT_MATTER_TYPES.has(pageType) ? "front-matter-text" : "text";
  let i = 0;
  const push = (b) => blocks.push(b);
  while (i < lines.length) {
    const l = lines[i];
    if (l.trim() === "") { i++; continue; }
    // Standalone archival comment (single- or multi-line).
    if (l.trimStart().startsWith("<!--")) {
      let buf = l; while (!buf.includes("-->")) { i++; if (i >= lines.length) die("unterminated HTML comment"); buf += "\n" + lines[i]; }
      if (!/^\s*<!--[\s\S]*-->\s*$/.test(buf)) die(`comment shares a line with text: ${buf.slice(0, 80)}`);
      annotations.push(buf.trim().replace(/^<!--\s*/, "").replace(/\s*-->$/, "")); i++; continue;
    }
    const div = l.match(/^<div align="(right|center|left)">(.*)$/);
    if (div) {
      const align = div[1];
      let inner = [];
      let rest = div[2];
      if (rest.includes("</div>")) { inner.push(rest.replace(/<\/div>\s*$/, "")); i++; }
      else {
        if (rest.trim()) inner.push(rest);
        i++;
        while (i < lines.length && !lines[i].includes("</div>")) { inner.push(lines[i]); i++; }
        if (i >= lines.length) die("unterminated <div>");
        const tail = lines[i].replace(/<\/div>\s*$/, ""); if (tail.trim()) inner.push(tail); i++;
      }
      while (inner.length && inner[0].trim() === "") inner.shift();
      while (inner.length && inner[inner.length - 1].trim() === "") inner.pop();
      const text = inner.join("\n");
      if (align === "center" && ORNAMENT.test(text)) push({ type: "ornament", role: "ornament", lines: inner });
      else push({ type: "aligned", align, role: align === "right" ? "right-aligned" : context ?? baseRole, lines: inner });
      continue;
    }
    const h = l.match(/^(#{1,3}) (.+)$/);
    if (h) {
      const level = h[1].length, text = h[2].trim();
      if (level === 2 && ARCHIVAL_LABELS.has(text)) { push({ type: "heading", level, role: "archival-label", lines: [l.slice(level + 1)] }); context = ARCHIVAL_LABELS.get(text); i++; continue; }
      if (level === 2 && GLOSS_HEADING.test(text)) { push({ type: "heading", level, role: "gloss-heading", lines: [l.slice(level + 1)] }); context = "gloss"; i++; continue; }
      push({ type: "heading", level, role: level === 1 ? "section-title" : "printed-heading", lines: [l.slice(level + 1)] });
      context = null; i++; continue;
    }
    if (l.startsWith(">")) {
      const q = []; while (i < lines.length && lines[i].startsWith(">")) { q.push(lines[i].replace(/^> ?/, "")); i++; }
      push({ type: "quotation", role: context === "gloss" ? "gloss" : "quotation", lines: q }); continue;
    }
    if (l.startsWith("|")) {
      const t = []; while (i < lines.length && lines[i].startsWith("|")) { t.push(lines[i]); i++; }
      push({ type: "table", role: context ?? baseRole, lines: t }); continue;
    }
    const p = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,3} |<div align=|>|\||\s*<!--)/.test(lines[i])) { p.push(lines[i]); i++; }
    // A paragraph consisting only of ornament glyphs (e.g. a bare printed `*`) is an ornament, never text.
    if (ORNAMENT.test(p.join(""))) push({ type: "ornament", role: "ornament", lines: p });
    else push({ type: "paragraph", role: context ?? baseRole, lines: p });
  }
  return { blocks, annotations };
}

// Normalise a printed provenance block for matching only (the stored lines are never altered).
const normCitation = (s) => s.replace(/`/g, "").replace(/<br\s*\/?>/g, "\n").split("\n").map((x) => x.replace(/\s+$/, "").trim()).filter(Boolean).join("\n");

export function importSangatamil(src) {
  const pin = WAVE8_PINS.sangatamil;
  const work = path.join(src, pin.workPath);
  const read = (rel) => readSource(path.join(work, rel));

  // ── Controlling source + closure evidence ───────────────────────────────────────────────────────
  const srcMd = read("metadata/source.md");
  const fn = srcMd.match(/source filename: `([^`]+)`/); const sha = srcMd.match(/imported-byte SHA-256: `([0-9a-f]{64})`/); const cnt = srcMd.match(/`pdfinfo` page count: \*\*(\d+)\*\*/);
  if (!fn || !sha || !cnt) die("metadata/source.md: controlling source identity not found");
  const closure = read("GATE_I_FINAL_CLOSURE.md").match(/> \*\*CURRENT AUTHORITATIVE CHECKPOINT — (\d{4}-\d{2}-\d{2}):\*\* ([^\n]+)/);
  if (!closure) die("GATE_I_FINAL_CLOSURE.md: current authoritative checkpoint not found");
  const cp = closure[2];
  for (const need of ["**497/497 COMPLETE**", "**496 verified / 0 needs-review / 1 source-limited partial (scan 8)**", "WFV-002..WFV-056 are **55/55 USER ADJUDICATED / CLOSED**", "pending WFV rows are **0**", "**RELEASE COMPLETE / CLOSED — 496 release-ready + 1 source-limited (scan 8) / 0 blocked**"]) {
    if (!cp.includes(need)) die(`current checkpoint does not state: ${need}`);
  }

  // ── Registers ───────────────────────────────────────────────────────────────────────────────────
  const sectionsJson = JSON.parse(read("navigation/sections.json"));
  const prov = JSON.parse(read("navigation/provenance/index.json"));
  const citations = [
    ...prov.formal_units.map((u) => ({ id: u.id, kind: "formal-citation", anchorScan: u.anchor_scan, sectionSeq: u.section_seq, printedBlock: u.printed_provenance_block_markdown })),
    ...prov.source_note_only.map((u) => ({ id: u.id, kind: "source-note", anchorScan: u.anchor_scan, sectionSeq: u.section_seq, printedBlock: u.printed_provenance_block_markdown })),
  ];

  // ── Pages (Tamil + English) ──────────────────────────────────────────────────────────────────────
  const tFiles = fs.readdirSync(path.join(work, "pages")).filter((f) => /^\d{4}-.+\.md$/.test(f)).sort();
  const eFiles = fs.readdirSync(path.join(work, "translations/en/pages")).filter((f) => /^\d{4}-.+\.md$/.test(f)).sort();
  if (tFiles.length !== eFiles.length) die(`${tFiles.length} Tamil vs ${eFiles.length} English page records`);
  const pages = tFiles.map((f, idx) => {
    const scan = Number(f.slice(0, 4));
    if (scan !== idx + 1) die(`pages: expected scan ${idx + 1}, found ${f}`);
    const { fm, body } = splitFrontMatter(read(`pages/${f}`));
    if (fm === null) die(`pages/${f}: no front matter`);
    const y = parseFlatYaml(fm);
    if (y.scan_page !== scan) die(`pages/${f}: scan_page ${y.scan_page}`);
    const ef = eFiles[idx];
    if (Number(ef.slice(0, 4)) !== scan) die(`English page ${ef} does not align with scan ${scan}`);
    const e = splitFrontMatter(read(`translations/en/pages/${ef}`));
    if (e.fm === null) die(`translations/en/pages/${ef}: no front matter`);
    const ey = parseFlatYaml(e.fm);
    if (ey.source_scan_page !== scan) die(`translations/en/pages/${ef}: source_scan_page ${ey.source_scan_page}`);
    const ta = tokenize(body, y.page_type);
    const en = tokenize(e.body, y.page_type);
    return {
      scan, file: `pages/${f}`, printedPage: y.printed_page ?? null, section: y.section ?? null, pageType: y.page_type,
      tamilStatus: y.status, visualFidelity: y.visual_fidelity,
      ...(y.status !== "verified" ? { sourceLimitation: { kind: "permanent-source-limited", note: y.transcription_method ?? null, visualNotes: y.visual_notes ?? null } } : {}),
      tamil: { blocks: ta.blocks, ...(ta.annotations.length ? { annotations: ta.annotations } : {}) },
      english: { file: `translations/en/pages/${ef}`, status: ey.status, translationType: ey.translation_type ?? null, blocks: en.blocks, ...(en.annotations.length ? { annotations: en.annotations } : {}) },
    };
  });

  // ── Type the printed provenance: locate every register record on its anchor page ────────────────
  // A register row normally describes ONE printed provenance block, which may span a run of consecutive page blocks
  // (e.g. P023: a citation followed by its printed `குறிப்பு :` note). Seven COMPOSITE rows (scans 147, 163, 401, 462,
  // 474, 475, 482) list several citations in one row — one entry per line, with ` / ` joining an entry's own printed
  // lines — and each formal unit of that row owns one entry, in unit-id order, found in page order. Typing comes from
  // this register match, never from alignment alone (some printed citations are plain paragraphs).
  // Matching tiers (the register is a derived rendering of the printed block; the WFV-adjudicated page is canonical,
  // so small rendering differences are expected — every located block records the tier that matched it):
  //   exact     — identical after trimming line ends / backticks / <br>;
  //   signature — identical letters+digits only (spacing, punctuation, bracket and line-break differences ignored);
  //   abridged  — the register elides with `...`: the page run contains every piece in order, starting with the
  //               first piece (unless the register opens with an ellipsis) and ending with the last (unless it closes
  //               with one);
  //   lines     — the register quotes a subset of the printed lines: every register line appears, in order, among the
  //               run's lines, and the run opens with the register's first line;
  //   note-list — a note the page prints as a `குறிப்பு` heading plus list, which the register condenses to one line:
  //               the heading + following list/paragraph blocks, with every anthology named in the register present.
  const sig = (s) => (s.match(/[\u0B80-\u0BFF0-9A-Za-z]/g) ?? []).join("");
  const runText = (bs, a, n) => bs.slice(a, a + n).map((b) => b.lines.join("\n")).join("\n");
  // Invariant: a formal citation or source-note match may never consume an ORNAMENT block. The tokenizer has already
  // typed a printed separator (`*`) as `ornament`; the letters-only tiers cannot see it, so without this rule a run
  // could begin one block early on the separator and give it the provenance role. A candidate run that includes an
  // ornament is refused outright, so the match starts at the provenance material itself.
  const hasOrnament = (bs, a, n) => bs.slice(a, a + n).some((b) => b.type === "ornament");
  const matchRun = (bs, from, target, maxRun) => {
    const pieces = target.split(/\.{3,}|…/).map(sig).filter(Boolean);
    const openEllipsis = /^\s*(\.{3,}|…)/.test(target), closeEllipsis = /(\.{3,}|…)\s*$/.test(target);
    const tLines = target.split("\n").map(sig).filter(Boolean);
    const tiers = [
      ["exact", (t) => normCitation(t) === target],
      ["signature", (t) => sig(t) === sig(target)],
      ...(pieces.length > 1 ? [["abridged", (t) => { const g = sig(t); if (!openEllipsis && !g.startsWith(pieces[0])) return false; if (!closeEllipsis && !g.endsWith(pieces[pieces.length - 1])) return false; let at = 0; for (const p of pieces) { const k = g.indexOf(p, at); if (k < 0) return false; at = k + p.length; } return true; }]] : []),
      ...(tLines.length > 1 ? [["lines", (t) => { const rl = t.split("\n").map(sig).filter(Boolean); if (rl[0] !== tLines[0]) return false; let at = 0; for (const x of tLines) { const k = rl.indexOf(x, at); if (k < 0) return false; at = k + 1; } return true; }]] : []),
    ];
    for (const [tier, test] of tiers) for (let a = from; a < bs.length; a++) for (let n = 1; n <= maxRun && a + n <= bs.length; n++) {
      if (hasOrnament(bs, a, n)) break; // every longer run from `a` contains the same ornament
      if (test(runText(bs, a, n))) return [a, n, tier];
    }
    return null;
  };
  const matchNoteList = (bs, from, target) => {
    const h = bs.findIndex((b, j) => j >= from && b.type === "heading" && sig(b.lines.join("")) === "குறிப்பு");
    if (h < 0 || !sig(target).startsWith("குறிப்பு")) return null;
    let n = 1; while (h + n < bs.length && bs[h + n].type === "paragraph") n++;
    if (hasOrnament(bs, h, n)) return null;
    const names = SANGAM_ANTHOLOGIES.filter((x) => target.includes(x));
    const text = runText(bs, h, n);
    return n > 1 && names.length && names.every((x) => text.includes(x)) ? [h, n, "note-list"] : null;
  };
  const unmatched = [], unmatchedEn = [];
  const groups = new Map();
  for (const c of citations) { const k = `${c.anchorScan}\u0000${c.printedBlock}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(c); }
  for (const group of groups.values()) {
    group.sort((a, b) => a.id.localeCompare(b.id));
    const page = pages[group[0].anchorScan - 1];
    if (!page) die(`${group[0].id}: anchor scan out of range`);
    const bs = page.tamil.blocks;
    const want = normCitation(group[0].printedBlock);
    let targets;
    if (group.length === 1) targets = [want];
    else {
      targets = want.split("\n").map((e) => e.split(" / ").map((x) => x.trim()).join("\n"));
      if (targets.length !== group.length) die(`${group.map((c) => c.id).join("+")}: composite row lists ${targets.length} entries for ${group.length} units`);
    }
    let from = 0;
    group.forEach((c, k) => {
      let found = matchRun(bs, from, targets[k], 4);
      if (!found && c.kind === "source-note") found = matchNoteList(bs, from, targets[k]);
      if (!found) { unmatched.push(`${c.id} (scan ${c.anchorScan}): ${JSON.stringify(targets[k])}`); return; }
      for (let j = found[0]; j < found[0] + found[1]; j++) {
        const b = bs[j];
        b.role = c.kind === "formal-citation" ? "source-citation" : "source-note";
        b.provenanceIds = [...new Set([...(b.provenanceIds ?? []), c.id])];
      }
      c.tamilBlocks = [found[0], found[0] + found[1] - 1];
      c.locatedBy = found[2];
      from = found[0] + found[1];
    });
  }
  if (unmatched.length) die(`printed provenance not located (${unmatched.length}):\n  ${unmatched.join("\n  ")}`);
  // ── English: type the translated provenance on each anchor page ───────────────────────────────────
  // The maintained English renders citations in its own form (`(*Purananuru* — Poem 192` / `Poet: …)`, `**Note:** …`,
  // a `## Note:` heading + list), not line-for-line with the Tamil register, so English typing is restricted to the
  // anchor pages of the register records and recognises only these printed-provenance forms. The Tamil register match
  // above remains the authority; every anchor page must yield at least one typed English provenance block.
  const EN_CITATION = /^\(\s*\*?[A-Z][^\n]*?(Poems?|poems?|Poet|lines?|Lines)\b|Poet:\s|sung by the poet|as the source prints|^\(This was written[\s\S]*composed by the Sangam poet/;
  const EN_NOTE = /^\*\*Note:?\*\*|^Note:/;
  const byAnchor = new Map();
  for (const c of citations) { if (!byAnchor.has(c.anchorScan)) byAnchor.set(c.anchorScan, []); byAnchor.get(c.anchorScan).push(c); }
  for (const [scan, cs] of byAnchor) {
    const bs = pages[scan - 1].english.blocks;
    const ids = cs.map((c) => c.id);
    let typed = 0;
    for (let j = 0; j < bs.length; j++) {
      const b = bs[j], t = b.lines.join("\n").trim();
      if (b.type === "heading" && /^Note:?$/.test(t)) {
        b.role = "source-note"; b.provenanceIds = ids; typed++;
        for (let k = j + 1; k < bs.length && bs[k].type === "paragraph"; k++) { bs[k].role = "source-note"; bs[k].provenanceIds = ids; typed++; }
        continue;
      }
      if (b.type === "paragraph" && EN_NOTE.test(t)) { b.role = "source-note"; b.provenanceIds = ids; typed++; continue; }
      if (b.role === "gloss" || b.role === "gloss-heading" || b.type === "heading" || b.type === "ornament") continue;
      else if ((b.type === "aligned" || b.type === "paragraph") && EN_CITATION.test(t) && t.length < 400) { b.role = "source-citation"; b.provenanceIds = ids; typed++; }
    }
    if (!typed) unmatchedEn.push(`scan ${scan} (${ids.join(", ")})`);
  }
  if (unmatchedEn.length) die(`English provenance not typed on anchor pages (${unmatchedEn.length}):\n  ${unmatchedEn.join("\n  ")}`);

  // Fail closed: after all provenance typing (Tamil register match + English anchor typing), no ornament is provenance.
  for (const p of pages) for (const [lang, bs] of [["Tamil", p.tamil.blocks], ["English", p.english.blocks]]) for (const b of bs) {
    if (b.type === "ornament" && (b.role !== "ornament" || b.provenanceIds)) die(`scan ${p.scan} ${lang}: ornament block typed ${b.role}${b.provenanceIds ? ` / ${b.provenanceIds}` : ""} — an ornament is never provenance`);
  }

  // A block that still reads `right-aligned` is a printed carry-over / aligned fragment, not a citation.
  for (const p of pages) for (const b of p.tamil.blocks) if (b.role === "right-aligned") b.role = "right-aligned-fragment";
  for (const p of pages) for (const b of p.english.blocks) if (b.role === "right-aligned") b.role = "right-aligned-fragment";

  // ── Sections (source order) ──────────────────────────────────────────────────────────────────────
  const sections = sectionsJson.map((s) => ({
    seq: s.seq,
    id: path.basename(path.dirname(s.section_readme)),
    heading: s.heading,
    scans: [s.scan_start, s.scan_end],
    printedPages: s.printed_pages,
    illustrationOrDivider: s.illustration_or_divider,
    provenanceIds: [...s.formal_provenance_units, ...s.source_note_records],
  }));
  return {
    id: "sangatamil",
    slug: "sangatamil",
    titleTa: "சங்கத் தமிழ்",
    authorTa: "கலைஞர் மு. கருணாநிதி",
    source: { repo: pin.repo, commit: pin.commit, repoTree: pin.repoTree, path: pin.workPath, workTree: pin.workTree },
    controllingSource: { filename: fn[1], sha256: sha[1], sha256Kind: "imported-byte (metadata/source.md)", physicalScans: Number(cnt[1]) },
    currentCheckpoint: { date: closure[1], text: cp },
    sections,
    citations: citations.map(({ printedBlock, ...c }) => ({ ...c, printedBlock })),
    pages,
  };
}

export const sangatamilFiles = (s) => ({ "sangatamil/sangatamil.json": toJson(s) });
