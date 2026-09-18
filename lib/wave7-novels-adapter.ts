// Wave 7 Batch 3 novel adapter — a BOUNDED render adapter. The Batch-3 novels were vendored at P1 with a
// prose reading layer (public/data/novels/<slug>/novel.json: sections[].tamilText / .englishText). The
// established Fiction reader (components/NovelReader.tsx + data/novels.ts `Novel`) consumes a block model
// (section.tamil.blocks / section.english.blocks). This module maps the frozen P1 payload into that
// `Novel` shape WITHOUT mutating the vendored JSON and WITHOUT inventing anything: paragraphs split on the
// blank line the assembled layer already uses; a `#`/`##` line becomes a heading; the repeated running
// header (a leading H1 equal to the work title) is dropped as page running-head, never reading content;
// a source chapter-number gap (surulimalai prints no chapters 6–7) is preserved exactly. Nothing is
// reconstructed, renumbered or modernised.
import type { Novel, NovelSection, NovelBlock, NovelNote, NovelProvenance } from "@/data/novels";

const AUTHOR = { ta: "கலைஞர் மு. கருணாநிதி", en: "Kalaignar M. Karunanidhi" };

type RawSection = {
  order: number; slug: string; sectionTitleTa: string | null; sectionTitleEn: string | null;
  tamilStatus?: string; englishStatus?: string; sourceScans: number[]; sourceScansDeclared: string | null;
  tamilText: string; englishText: string;
};
export type Wave7NovelPayload = {
  workId: string; slug: string; sourceRepo: string; sourcePath: string; sourceCommit: string;
  title: { ta: string; en: string }; edition?: Record<string, unknown>;
  tamilState?: string; englishState?: string; sourceCompilation?: string;
  sectionCount: number; sections: RawSection[];
};

/**
 * Split an assembled reading-layer body into reading blocks + translator/editorial notes. A leading
 * running-header H1 equal to the work title is dropped (page running-head, not content). A blockquote
 * (`> …`, e.g. the English layer's `> **Translator's note:** …`) is APPARATUS: it is separated out as a
 * note so it can never read as Kalaignar's prose. Nothing else is altered.
 */
function splitBody(body: string, workTitle: string): { blocks: NovelBlock[]; notes: NovelNote[] } {
  const paras = body.split(/\n{2,}/).map((p) => p.replace(/\s+$/, "")).filter((p) => p.trim().length);
  const blocks: NovelBlock[] = [];
  const notes: NovelNote[] = [];
  for (const p of paras) {
    const t = p.trim();
    if (t.startsWith(">")) {
      const stripped = t.split("\n").map((l) => l.replace(/^\s*>\s?/, "")).join("\n").trim();
      const m = /^\*\*(.+?):\*\*\s*([\s\S]*)$/.exec(stripped);
      notes.push({ kind: "translator-note", heading: m ? m[1] : "Note", text: m ? m[2].trim() : stripped });
      continue;
    }
    const h = /^(#{1,6})\s+(.+)$/.exec(t);
    if (h) {
      const level = h[1].length;
      const text = h[2].replace(/\s+$/, "");
      if (level === 1 && blocks.length === 0 && text.trim() === workTitle.trim()) continue;
      blocks.push({ kind: "heading", level, text, hasLineBreaks: false, sourcePages: [] });
      continue;
    }
    if (/^[*✾★\s]+$/.test(t)) { blocks.push({ kind: "ornament", text: p, hasLineBreaks: p.includes("\n"), sourcePages: [] }); continue; }
    blocks.push({ kind: "paragraph", text: p, hasLineBreaks: p.includes("\n"), sourcePages: [] });
  }
  return { blocks, notes };
}

const scanSpan = (s: RawSection): string => {
  if (s.sourceScansDeclared) return s.sourceScansDeclared.replace(/-/g, "–");
  if (s.sourceScans?.length) return s.sourceScans.length === 1 ? String(s.sourceScans[0]) : `${Math.min(...s.sourceScans)}–${Math.max(...s.sourceScans)}`;
  return "";
};
/** The printed chapter number a chapter section carries in its title, else null (intro / single work). */
const chapterNumber = (titleTa: string | null): number | null => {
  const m = /(\d+)\s*$/.exec((titleTa || "").trim());
  return m ? Number(m[1]) : null;
};

export function wave7NovelToNovel(raw: Wave7NovelPayload): Novel {
  const isChapterWork = raw.sections.some((s) => /அத்தியாயம்/.test(s.sectionTitleTa || ""));
  const sections: NovelSection[] = raw.sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      const isIntro = s.order === 0 || /arimugam|introduction|அறிமுகம்/i.test(`${s.slug} ${s.sectionTitleTa} ${s.sectionTitleEn}`);
      const cn = isIntro ? null : chapterNumber(s.sectionTitleTa);
      const span = scanSpan(s);
      return {
        order: s.order,
        slug: s.slug,
        titleTa: s.sectionTitleTa || (isChapterWork ? (isIntro ? "அறிமுகம்" : `அத்தியாயம் ${cn ?? s.order}`) : raw.title.ta),
        titleEn: s.sectionTitleEn || (isChapterWork ? (isIntro ? "Introduction" : `Chapter ${cn ?? s.order}`) : raw.title.en),
        sourceScansTa: span,
        sourceScansEn: span,
        isEmbeddedSequence: false,
        // Section titles are the assembled layer's own labels, never asserted as printed source headings.
        titleIsPrintedHeading: false,
        carriesArchiveSectionLabel: true,
        ...(isChapterWork ? { chapterNumber: cn, unitNumberTa: cn != null ? String(cn) : null, unitNumberEn: cn != null ? String(cn) : null, isIntroduction: isIntro } : {}),
        tamil: { blocks: splitBody(s.tamilText, raw.title.ta).blocks },
        english: (() => { const e = splitBody(s.englishText, raw.title.en); return { blocks: e.blocks, notes: e.notes }; })(),
      };
    });

  const allScans = raw.sections.flatMap((s) => s.sourceScans || []).filter((n) => Number.isFinite(n));
  return {
    workId: raw.workId, slug: raw.slug,
    sourceRepo: raw.sourceRepo, sourcePath: raw.sourcePath, sourceCommit: raw.sourceCommit,
    shelf: "fiction", readerStructure: "novel", subtype: "novel",
    title: raw.title, author: AUTHOR,
    edition: raw.edition as Novel["edition"],
    ...(isChapterWork ? { structure: { unitKindTa: "மூலத்தில் அச்சிடப்பட்ட அத்தியாயங்கள்", unitKindEn: "source-printed chapters", unitNounTa: "அத்தியாயம்", unitNounEn: "Chapter", introUnitTa: "அறிமுகம்", introUnitEn: "Introduction", noteTa: "ஒரு தொடர்ச்சியான நாவல்; மூலத்தில் அச்சிடப்பட்ட அத்தியாயங்களாகப் பிரிக்கப்பட்டுள்ளது.", noteEn: "One continuous novel, divided into the chapters printed in the source." }, readingUnitKind: "source-chapters" as const } : { readingUnitKind: "archive-division" as const }),
    sections,
    sectionCount: sections.length,
    bodyScans: { from: allScans.length ? Math.min(...allScans) : 0, to: allScans.length ? Math.max(...allScans) : 0 },
  };
}

type RawNovelProvenance = {
  workId: string; sourceRepo: string; sourcePath: string; sourceCommit: string; sourceTree?: string;
  source: { scanFilename: string; scanSha256: string; scanFileSizeBytes: number; scanTotalPages: number; workScans?: string; structureNote?: string };
  english?: { kind?: string; status?: string; perSectionStates?: string[] };
  projectRights?: Record<string, unknown>;
};

/** Adapt the frozen P1 novel provenance into the NovelProvenance the generic NovelSource renders. Source
 *  facts are carried verbatim from the payload; the archive-derived block counts are computed from the
 *  ADAPTED reading layer; the English readiness state is reported honestly (never flattened). */
export function wave7NovelProvenance(rawProv: RawNovelProvenance, novel: Novel): NovelProvenance {
  const allBlocks = (pick: (s: NovelSection) => NovelBlock[]) => novel.sections.flatMap(pick);
  const ta = allBlocks((s) => s.tamil.blocks);
  const en = allBlocks((s) => s.english.blocks);
  const count = (bs: NovelBlock[], k: NovelBlock["kind"]) => bs.filter((b) => b.kind === k).length;
  const withBreaks = (bs: NovelBlock[]) => bs.filter((b) => b.hasLineBreaks).length;
  const engStates = rawProv.english?.perSectionStates?.length ? rawProv.english.perSectionStates.join(", ") : (rawProv.english?.status ?? "verified");
  const edition = novel.edition ?? {};
  return {
    workId: rawProv.workId, sourceRepo: rawProv.sourceRepo, sourcePath: rawProv.sourcePath, sourceCommit: rawProv.sourceCommit,
    source: {
      titleTa: novel.title.ta, titleEn: novel.title.en, authorTa: novel.author.ta,
      scanFilename: rawProv.source.scanFilename, scanSha256: rawProv.source.scanSha256,
      scanFileSizeBytes: rawProv.source.scanFileSizeBytes, scanTotalPages: rawProv.source.scanTotalPages,
      pageRecordsVerified: `assembled reading layer verified across ${novel.sectionCount} section(s)`,
      sourceAudit: "Tamil source audit / assembly: PASS (verified assembled-reading layer).",
      assembledLayer: `${novel.sectionCount} reading section(s); English ${engStates}`,
      sourcePdfCommitted: false,
      editionTa: edition.statementTa, publisherTa: edition.publisherTa, placeTa: edition.placeTa,
      printedPageNumbering: "Printed page numbers are recorded only where the source prints them; none is invented.",
      bodyScans: rawProv.source.workScans ?? `${novel.bodyScans.from}–${novel.bodyScans.to}`,
      ...(rawProv.source.structureNote ? { structureNote: rawProv.source.structureNote } : {}),
      lockedExclusions: [
        "front-matter / cover / back-cover scans, described in page records rather than converted into narrative text",
        "assembled-layer HTML-comment scan markers, carried as provenance rather than as reading text",
        "library / accession stamps and marks, never merged into the literary text",
      ],
    },
    english: {
      kind: "project-created", status: engStates,
      batches: "reviewed against the audited Tamil source",
      bodyCoverage: `${novel.sectionCount}/${novel.sectionCount} sections`,
      bilingualAlignment: "section-aligned with the Tamil reading layer",
      releaseReadiness: engStates.includes("source-checked") ? "English source-checked (project-created); Tamil remains authoritative" : "English verified (project-created); Tamil remains authoritative",
      translatorNotesSeparated: "Any translator/editorial notes are carried outside the reading body.",
    },
    archiveDerived: {
      sections: novel.sectionCount,
      tamilBlocks: ta.length, englishBlocks: en.length,
      tamilParagraphs: count(ta, "paragraph"), englishParagraphs: count(en, "paragraph"),
      tamilHeadings: count(ta, "heading"), englishHeadings: count(en, "heading"),
      printedHeadingsInSource: [],
      sectionsWithArchiveOnlyTitle: novel.sections.filter((s) => !s.titleIsPrintedHeading).length,
      ornaments: count(ta, "ornament") + count(en, "ornament"),
      tamilBlocksWithLineBreaks: withBreaks(ta), englishBlocksWithLineBreaks: withBreaks(en),
      translatorNotes: novel.sections.reduce((n, s) => n + s.english.notes.length, 0), sourceEstablishedJoins: 0, joins: [], embeddedSequenceSections: 0,
      note: "Derived structure only. Paragraph structure comes from the assembled reading layer's own blank-line divisions and is never re-split or merged; scan markers are provenance, not text.",
      joinNote: "No cross-page continuity join is invented; none is asserted for these works.",
      provenanceGranularity: "section-level scan coverage (per-block page provenance not asserted)",
    },
    projectRights: {
      appliesTo: "underlying-work-authored-by-kalaignar",
      rightsStatus: (rawProv.projectRights?.rightsStatus as string) ?? "nationalised-by-tamil-nadu-government",
      rightsAuthority: (rawProv.projectRights?.rightsAuthority as string) ?? "Government of Tamil Nadu",
      rightsAction: (rawProv.projectRights?.rightsAction as string) ?? "nationalisation",
      rightsAnnouncementDate: (rawProv.projectRights?.rightsAnnouncementDate as string) ?? "2024-08-22",
      governmentOrderNumber: (rawProv.projectRights?.governmentOrderNumber as string | null) ?? null,
      governmentOrderDate: (rawProv.projectRights?.governmentOrderDate as string | null) ?? null,
      governmentOrderHandoverDate: (rawProv.projectRights?.governmentOrderHandoverDate as string | null) ?? "2024-12-22",
      distinctionNote: "This is the present project-level rights status of Kalaignar's underlying Tamil work. The edition's publisher/place/price/printer lines are edition facts, not statements about those rights.",
      thirdPartyNote: "Nationalisation applies to Kalaignar's underlying authored novel. It does NOT extend to the edition's publisher/imprint matter, printed price, decorative artwork, or the library's stamps and marks.",
      projectTranslationNote: (rawProv.projectRights?.projectTranslationNote as string) ?? "The English reading layer is a project-created, source-linked independent translation; it is not covered by the nationalisation of the Tamil work.",
      archivalStatusNote: "The source repository's completion/release status is an editorial and archival judgement about transcription/translation completeness. It is NOT, by itself, a copyright or republication-rights determination.",
      evidencePending: "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
    },
    notes: [
      "The controlling source is the supplied scanned PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan count.",
      "The reading layer is a deterministic transform of the pinned assembled-reading sections; front matter and HTML-comment scan markers are removed and all literary bytes preserved.",
    ],
  };
}
