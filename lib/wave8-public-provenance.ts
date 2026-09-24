// Wave 8 P2 — the PUBLIC serialization boundary for the three Wave-8 readers (SERVER-ONLY).
//
// Every reader here is a CLIENT component, so every prop is serialized into the page (the RSC payload) whether or
// not it is rendered. These projections are the only way to build those props. Each one CONSTRUCTS a new object
// from an explicit list of fields (an allowlist by construction, at every nesting level), so a field added to the
// hidden P1 records later is never forwarded unless it is added here on purpose. Never forwarded: hidden/wave/batch
// markers, readiness or release states, internal validation, workflow or audit states, page annotations and process
// notes. The results are branded, so passing a raw model to a reader where a projection is expected is a type error.
// Mirrors lib/play-public-provenance.ts, which ore-mutham uses unchanged.
import type { Wave8MurasoliLetter } from "@/lib/wave8-murasoli-reader";
import type { SangatamilBlock, SangatamilPage, SangatamilSection, SangatamilSectionSummary, SangatamilWork } from "@/lib/wave8-sangatamil-reader";
import { toSectionSummary } from "@/lib/wave8-sangatamil-reader";
import { toOreMuthamPlay, toOreMuthamProvenance, type OreMuthamP1 } from "@/lib/wave8-ore-mutham-adapter";
import { toPublicPlayHead, toPublicPlayProvenance, type PublicPlayHead, type PublicPlayProvenance } from "@/lib/play-public-provenance";

declare const WAVE8_PUBLIC: unique symbol;
type Brand = { readonly [WAVE8_PUBLIC]: true };
const brand = <T,>(x: T) => x as T & Brand;

// ── Murasoli (B1) ─────────────────────────────────────────────────────────────────────────────────────────────
export type PublicWave8Letter = Wave8MurasoliLetter & Brand;

export function toPublicWave8Letter(l: Wave8MurasoliLetter): PublicWave8Letter {
  return brand<Wave8MurasoliLetter>({
    id: l.id,
    sourceId: l.sourceId,
    volume: l.volume,
    printedNumber: l.printedNumber,
    title: { ta: l.title.ta, en: l.title.en, ...(l.title.taAsInContents !== undefined ? { taAsInContents: l.title.taAsInContents } : {}) },
    date: { iso: l.date.iso, printed: l.date.printed, fromPrintedContents: l.date.fromPrintedContents },
    pdfPages: [l.pdfPages[0], l.pdfPages[1]],
    printedPages: [l.printedPages[0], l.printedPages[1]],
    tamilPages: l.tamilPages.map((p) => ({ pdfPage: p.pdfPage, printedPage: p.printedPage, text: p.text })),
    english: { text: l.english.text, subtitle: l.english.subtitle, translatorNote: l.english.translatorNote, method: l.english.method },
    qualification: l.qualification
      ? { kind: l.qualification.kind, missingPrintedPages: [...l.qualification.missingPrintedPages], lastAvailablePrintedPage: l.qualification.lastAvailablePrintedPage }
      : null,
    source: { filename: l.source.filename, sha256: l.source.sha256, pdfPageCount: l.source.pdfPageCount },
  });
}

// ── ore-mutham (B2) — the existing Drama boundary, unchanged ──────────────────────────────────────────────────
export function toPublicOreMuthamSource(p1?: OreMuthamP1): { play: PublicPlayHead; prov: PublicPlayProvenance } {
  return { play: toPublicPlayHead(toOreMuthamPlay(p1)), prov: toPublicPlayProvenance(toOreMuthamProvenance(p1)) };
}

// ── sangatamil (B3) ──────────────────────────────────────────────────────────────────────────────────────────
export type PublicSangatamilSection = SangatamilSection & Brand;
export type PublicSangatamilSectionSummary = SangatamilSectionSummary & Brand;
export type PublicSangatamilContents = { slug: "sangatamil"; title: { ta: string; en: string }; author: { ta: string; en: string }; sections: PublicSangatamilSectionSummary[] } & Brand;

const pubBlock = (b: SangatamilBlock): SangatamilBlock => ({
  kind: b.kind,
  role: b.role,
  lines: [...b.lines],
  ...(b.level !== undefined ? { level: b.level } : {}),
  ...(b.align !== undefined ? { align: b.align } : {}),
  ...(b.citationIds !== undefined ? { citationIds: [...b.citationIds] } : {}),
});
const pubPage = (p: SangatamilPage): SangatamilPage => ({
  scan: p.scan,
  printedPage: p.printedPage,
  pageType: p.pageType,
  illustration: p.illustration,
  sourceLimited: p.sourceLimited ? { kind: p.sourceLimited.kind } : null,
  tamil: p.tamil.map(pubBlock),
  english: p.english.map(pubBlock),
});
const pubSummary = (s: SangatamilSectionSummary): PublicSangatamilSectionSummary =>
  brand<SangatamilSectionSummary>({
    seq: s.seq, slug: s.slug, kind: s.kind, headingTa: s.headingTa, headingEn: s.headingEn, scans: [s.scans[0], s.scans[1]],
    printedPages: s.printedPages, illustrationScans: [...s.illustrationScans], pageCount: s.pageCount, citationCount: s.citationCount,
  });

export function toPublicSangatamilSection(s: SangatamilSection): PublicSangatamilSection {
  return brand<SangatamilSection>({
    seq: s.seq, slug: s.slug, kind: s.kind, headingTa: s.headingTa, headingEn: s.headingEn, scans: [s.scans[0], s.scans[1]],
    printedPages: s.printedPages, illustrationScans: [...s.illustrationScans], citationIds: [...s.citationIds], pages: s.pages.map(pubPage),
  });
}

/** Navigation-level summary of a section (prev/next links, contents). No page text. */
export function toPublicSangatamilSummary(s: SangatamilSection): PublicSangatamilSectionSummary {
  return pubSummary(toSectionSummary(s));
}

export function toPublicSangatamilContents(w: SangatamilWork): PublicSangatamilContents {
  return brand({
    slug: "sangatamil" as const,
    title: { ta: w.title.ta, en: w.title.en },
    author: { ta: w.author.ta, en: w.author.en },
    sections: w.sections.map((s) => pubSummary(toSectionSummary(s))),
  });
}

export type PublicSangatamilProvenance = {
  title: { ta: string; en: string };
  sourceRepo: string;
  sourceCommit: string;
  source: { scanFilename: string; scanSha256: string; physicalScans: number; sourcePdfCommitted: false };
  structure: {
    sections: number; poemSections: number; pages: number; illustrationPages: number;
    formalCitations: number; sourceNotes: number; sourceLimitedPages: number[];
  };
  tamilLayer: string;
  englishLayer: string;
  sourceLimitation: { scan: number; statementTa: string; statementEn: string };
  exclusions: string[];
} & Brand;

export function toPublicSangatamilProvenance(w: SangatamilWork): PublicSangatamilProvenance {
  const pages = w.sections.flatMap((s) => s.pages);
  const limited = pages.filter((p) => p.sourceLimited).map((p) => p.scan);
  const ill = pages.filter((p) => p.illustration).length;
  return brand({
    title: { ta: w.title.ta, en: w.title.en },
    sourceRepo: w.source.repo,
    sourceCommit: w.source.commit,
    source: { scanFilename: w.source.filename, scanSha256: w.source.sha256, physicalScans: w.source.physicalScans, sourcePdfCommitted: false as const },
    structure: {
      sections: w.sections.length,
      poemSections: w.sections.filter((s) => s.kind === "section").length,
      pages: pages.length,
      illustrationPages: ill,
      formalCitations: w.citations.filter((c) => c.kind === "formal-citation").length,
      sourceNotes: w.citations.filter((c) => c.kind === "source-note").length,
      sourceLimitedPages: limited,
    },
    tamilLayer: `Every physical page (${pages.length}) is carried from a page record checked against the scanned printed book; scan ${limited.join(", ")} is represented by its heading and a description only.`,
    englishLayer: `A project-created English translation of every page, made from the verified Tamil; scan ${limited.join(", ")} is translated as description only.`,
    sourceLimitation: {
      scan: limited[0],
      statementTa: "முன்னுரைப் பக்கத்திலுள்ள முழுப்பக்கக் கையெழுத்துக் கடிதம் படியெடுக்கப்படவில்லை; இது இவ்வெளியீட்டின் நிலையான முடிவு.",
      statementEn: "The full-page handwritten letter on the foreword page is not transcribed; this is a permanent decision of this edition.",
    },
    exclusions: [
      "the archive's page annotations and working notes — never shown as the book's text",
      "descriptions of illustrations, library marks and ownership stamps — shown only as labelled archival descriptions",
      "the handwritten foreword letter on scan 8 — not transcribed",
    ],
  });
}
