// Wave 8 P2 — சங்கத் தமிழ் (`sangatamil`) reader model (SERVER-ONLY; reads the hidden P1 data).
//
// The commentary-unit family (Kuraloviyam's unit → page → typed-block shape), NOT kural-commentary, and no new
// ReaderStructure: the reading unit is a SECTION of the printed book (104: front matter, 102 poem-commentary
// sections, back cover), each carrying its physical pages in scan order, each page its typed Tamil and English
// blocks. The block vocabulary is the P1 role set, carried verbatim — prose, printed verse (quotations), glosses,
// source citations and source notes stay DISTINCT (a citation is never folded into Kalaignar's prose), verse keeps
// its hard lineation (one source line = one line), and archive descriptions never become body text.
//
// Two page-level facts drive presentation, both from the source's own page records:
//   • `illustration` — the 97 full-page illustration scans. The archive's description of an image is presented as
//     archival, never as the book's text; a block on such a scan is archival only when it is archive-typed or its own
//     words describe the visual record, so any genuinely printed line on an illustration scan stays text.
//   • `sourceLimited` — scan 8's handwritten foreword letter is permanently not transcribed. The page carries only
//     its heading and the archive's description; the reader adds a durable source-condition statement. It is
//     never transcribed and never described as pending.
// P1 page annotations are workflow/audit notes and are deliberately not carried.
import fs from "node:fs";
import path from "node:path";
import { publicSentences } from "@/lib/wave8-public-text";

export const SANGATAMIL_ROLES = [
  "text", "section-title", "printed-heading", "quotation", "source-citation", "source-note", "gloss-heading", "gloss",
  "right-aligned-fragment", "ornament", "archival-label", "archival-description", "front-matter-text", "copy-specific-marking",
] as const;
export type SangatamilRole = (typeof SANGATAMIL_ROLES)[number];

export type SangatamilBlock = {
  kind: "heading" | "paragraph" | "quotation" | "aligned" | "ornament" | "table";
  role: SangatamilRole;
  /** Source lines, one per printed line (the markdown hard-break marker is not part of the text). */
  lines: string[];
  level?: number;
  align?: "left" | "center" | "right";
  /** The printed source citation(s) / source note(s) this block belongs to (P001…), where the archive records them. */
  citationIds?: string[];
  /**
   * How a reader must present the block: `text` is printed matter of the book (Kalaignar's words, quoted verse,
   * citations, glosses, front matter); `archival` is the ARCHIVE describing the physical page — a labelled visual
   * record, a library/ownership marking, or the archive's own note on an illustration scan. Decided per block from the
   * block's own role and words, never from the page type alone.
   */
  presentation: "text" | "archival";
};

export type SangatamilPage = {
  scan: number;
  printedPage: string | null;
  pageType: string;
  illustration: boolean;
  /** A full-page illustration scan that carries no printed text at all (every block is the archive's description). */
  pureIllustration: boolean;
  sourceLimited: { kind: "handwritten-facsimile" } | null;
  tamil: SangatamilBlock[];
  english: SangatamilBlock[];
};

export type SangatamilSection = {
  seq: number;
  /** Route-safe section id (for P3), e.g. `001-malarmari-pozhiginren`. */
  slug: string;
  kind: "front-matter" | "section" | "back-matter";
  headingTa: string;
  headingEn: string | null;
  scans: [number, number];
  printedPages: string;
  illustrationScans: number[];
  citationIds: string[];
  pages: SangatamilPage[];
};

export type SangatamilCitation = { id: string; kind: "formal-citation" | "source-note"; anchorScan: number; sectionSeq: number };

export type SangatamilWork = {
  slug: "sangatamil";
  title: { ta: string; en: string };
  author: { ta: string; en: string };
  source: { repo: string; commit: string; path: string; filename: string; sha256: string; physicalScans: number };
  sections: SangatamilSection[];
  citations: SangatamilCitation[];
};

/** The contents-level view of a section (landing / navigation) — no page text. */
export type SangatamilSectionSummary = Omit<SangatamilSection, "pages" | "citationIds"> & { pageCount: number; citationCount: number };

type P1Block = { type: SangatamilBlock["kind"]; role: SangatamilRole; lines: string[]; level?: number; align?: SangatamilBlock["align"]; provenanceIds?: string[] };
type P1Page = {
  scan: number; printedPage: string | null; section: string; pageType: string;
  sourceLimitation?: { kind: string };
  tamil: { blocks: P1Block[] }; english: { blocks: P1Block[] };
};
type P1 = {
  slug: string; titleTa: string; authorTa: string;
  source: { repo: string; commit: string; path: string };
  controllingSource: { filename: string; sha256: string; physicalScans: number };
  sections: { seq: number; id: string; heading: string; scans: [number, number]; printedPages: string }[];
  citations: { id: string; kind: SangatamilCitation["kind"]; anchorScan: number; sectionSeq: number }[];
  pages: P1Page[];
};

export function loadSangatamilP1(): P1 {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/internal/wave8/sangatamil/sangatamil.json"), "utf8"));
}

const ARCHIVAL_ROLES = new Set<SangatamilRole>(["archival-label", "archival-description", "copy-specific-marking"]);
/**
 * On an illustration scan, the archive sometimes records its description of the image as a plain paragraph or
 * heading. Such a block names the visual record itself (the illustration, the picture, the absence of a caption or
 * printed text, the physical-page record). A block that does not is printed matter and stays text.
 */
const DESCRIBES_VISUAL = /illustration|ஓவிய|\bcaption\b|physical[- ]page record|printed (literary|body) text|no printed literary|full-page colour|\bpainting\b|\bdrawing\b/i;

function toBlock(b: P1Block, onIllustration: boolean): SangatamilBlock {
  const archival = ARCHIVAL_ROLES.has(b.role) || (onIllustration && DESCRIBES_VISUAL.test(b.lines.join(" ")));
  // Archive prose is filtered to its public-safe sentences (workflow / capture-stage wording is audit history);
  // printed matter is carried exactly.
  const lines = b.lines.map((l) => l.replace(/\s+$/, ""));
  const shown = archival && b.role !== "archival-label" ? lines.map((l) => (l.trim() ? publicSentences(l) : l)).filter((l, i) => !lines[i].trim() || l !== "") : lines;
  return {
    kind: b.type,
    role: b.role,
    lines: shown,
    ...(b.level !== undefined ? { level: b.level } : {}),
    ...(b.align !== undefined ? { align: b.align } : {}),
    ...(b.provenanceIds?.length ? { citationIds: [...b.provenanceIds] } : {}),
    presentation: archival ? "archival" : "text",
  };
}

export function toSangatamilWork(p1: P1 = loadSangatamilP1()): SangatamilWork {
  const byScan = new Map(p1.pages.map((p) => [p.scan, p]));
  const last = p1.sections.length - 1;
  const sections: SangatamilSection[] = p1.sections.map((s, idx) => {
    const pages: SangatamilPage[] = [];
    for (let scan = s.scans[0]; scan <= s.scans[1]; scan++) {
      const p = byScan.get(scan);
      if (!p) throw new Error(`sangatamil: scan ${scan} missing from P1 pages`);
      const illustration = p.pageType === "illustration";
      const tamil = p.tamil.blocks.map((b) => toBlock(b, illustration)).filter((b) => b.lines.some((l) => l.trim()));
      const english = p.english.blocks.map((b) => toBlock(b, illustration)).filter((b) => b.lines.some((l) => l.trim()));
      pages.push({
        scan,
        printedPage: p.printedPage,
        pageType: p.pageType,
        illustration,
        pureIllustration: illustration && [...tamil, ...english].every((b) => b.presentation === "archival"),
        sourceLimited: p.sourceLimitation?.kind === "permanent-source-limited" ? { kind: "handwritten-facsimile" } : null,
        tamil,
        english,
      });
    }
    const kind = idx === 0 ? "front-matter" : idx === last ? "back-matter" : "section";
    const [headingTa, headingEnInline] = kind === "section" ? [s.heading, null] : s.heading.split(" / ");
    const headingEn = headingEnInline ? headingEnInline[0].toUpperCase() + headingEnInline.slice(1) : pages.flatMap((p) => p.english).find((b) => b.role === "section-title")?.lines.join(" ") ?? null;
    return {
      seq: s.seq,
      slug: s.id,
      kind,
      headingTa,
      headingEn,
      scans: s.scans,
      printedPages: s.printedPages,
      illustrationScans: pages.filter((p) => p.illustration).map((p) => p.scan),
      citationIds: p1.citations.filter((c) => c.sectionSeq === s.seq).map((c) => c.id),
      pages,
    };
  });
  return {
    slug: "sangatamil",
    title: { ta: p1.titleTa, en: "Sangatamil" },
    author: { ta: p1.authorTa, en: "Kalaignar M. Karunanidhi" },
    source: {
      repo: p1.source.repo, commit: p1.source.commit, path: p1.source.path,
      filename: p1.controllingSource.filename, sha256: p1.controllingSource.sha256, physicalScans: p1.controllingSource.physicalScans,
    },
    sections,
    citations: p1.citations.map((c) => ({ id: c.id, kind: c.kind, anchorScan: c.anchorScan, sectionSeq: c.sectionSeq })),
  };
}

export function toSectionSummary(s: SangatamilSection): SangatamilSectionSummary {
  const { pages, citationIds, ...rest } = s;
  return { ...rest, pageCount: pages.length, citationCount: citationIds.length };
}
