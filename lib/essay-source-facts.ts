// Source-form-aware presentation helpers for the Essays reader.
//
// Before Wave 3 the Essays UI could assume one publication's shape: a 1956 collection reprinted in
// 2018, every article a contiguous scan run with a printed page range, numbered by a printed contents
// page. Wave 3 added three 1949–1951 pamphlets that break every one of those assumptions, so the
// rendering decisions live here rather than being repeated (and re-guessed) in five components.
//
// The rule these helpers exist to enforce: NEVER render an invented fact, and never render an empty
// one. A source with no printed pagination says so; it does not emit `printed pages undefined–undefined`.

import type { Article, ArticlePrintedPages, EssayPublication } from "@/data/essays";

/**
 * How an article's printed pagination should read, or `null` when the source establishes none.
 *
 * A `range` renders as a range. A `partial` or `none` witness renders as the source's own note, and
 * never as a fabricated range — `null` here means "say nothing", which is the honest output when the
 * caller has no room for a sentence.
 */
export function printedPagesLabel(p: ArticlePrintedPages, ta: boolean): string | null {
  if (p.kind === "range") {
    return `${ta ? "அச்சுப் பக்கம்" : "printed"} ${p.from}–${p.to}`;
  }
  return null;
}

/** The source's own qualification of the printed pagination, where it gave one. */
export function printedPagesNote(p: ArticlePrintedPages): string | null {
  return p.note ?? null;
}

/**
 * An article's scan coverage as source-faithful text. Ordered runs are joined with a comma and the
 * order is preserved exactly — `திராவிட சம்பத்து` article 2 really is `12, 3`, and sorting it would
 * assert a reading order the source contradicts.
 */
export function scanRunsLabel(a: Article, ta: boolean): string {
  const runs = a.scanRuns.map((r) => (r.from === r.to ? `${r.from}` : `${r.from}–${r.to}`)).join(", ");
  return `${ta ? "ஸ்கேன்" : "scans"} ${runs}`;
}

/** True when the article's scans are not one simple ascending run — worth stating on the page. */
export function hasComplexScanCoverage(a: Article): boolean {
  if (a.scanRuns.length !== 1) return true;
  return a.scanRuns[0].to < a.scanRuns[0].from;
}

/**
 * The edition sentence for a publication, as facts rather than a template.
 *
 * Returns the rows a caller should render. A publication whose controlling scan IS its first edition
 * gets ONE row and is never described as following a reprint; only a genuine reprint distinction
 * produces two.
 */
export function editionRows(pub: EssayPublication, ta: boolean): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  if (pub.firstEdition) {
    rows.push({
      label: pub.controllingIsFirstEdition
        ? (ta ? "பதிப்பு" : "Edition")
        : (ta ? "முதற்பதிப்பு" : "First edition"),
      value: [pub.firstEdition.statementTa, pub.firstEdition.publisherTa, pub.firstEdition.priceTa]
        .filter(Boolean)
        .join(" · "),
    });
  }
  if (!pub.controllingIsFirstEdition && pub.controllingEdition) {
    rows.push({
      label: ta ? "பயன்படுத்திய பதிப்பு" : "Edition used here",
      value: [pub.controllingEdition.statementTa, pub.controllingEdition.publisherLineTa]
        .filter(Boolean)
        .join(" · "),
    });
  }
  return rows;
}

/**
 * A one-line, source-honest description for page metadata.
 *
 * This is what stops a 1949 pamphlet being described as "following the 2018 reprint" simply because
 * the reference publication was.
 */
export function publicationMetaSentence(pub: EssayPublication): string {
  const parts: string[] = [];
  parts.push(
    pub.articleCount === 1
      ? `${pub.title.en} — a single essay by Kalaignar M. Karunanidhi`
      : `${pub.title.en} — ${pub.articleCount} articles by Kalaignar M. Karunanidhi`,
  );
  if (pub.firstEdition) {
    const when = [pub.firstEdition.monthTa, pub.firstEdition.year].filter(Boolean).join(" ");
    if (pub.controllingIsFirstEdition) {
      parts.push(when ? `first published ${when}` : `from the source's own first edition`);
    } else {
      parts.push(
        `first published ${when || pub.firstEdition.statementTa}` +
          (pub.controllingEdition?.year ? `; this reading edition follows the ${pub.controllingEdition.year} reprint` : ""),
      );
    }
  }
  parts.push("Verified Tamil source text with a project-created English translation");
  return `${parts.join(". ")}.`;
}

/** How the article ordinals should be described — printed, or the archive's own reading order. */
export function articleNumberingNote(pub: EssayPublication, ta: boolean): string {
  const printed = pub.articles.every((a) => a.numberSource === "printed-contents");
  if (printed) {
    return ta
      ? "கட்டுரை எண்கள் அச்சிடப்பட்ட பொருளடக்கப் பக்கத்தில் உள்ளவை."
      : "The article numbers are printed in the publication's own contents page.";
  }
  return ta
    ? "இந்நூலில் அச்சிடப்பட்ட பொருளடக்கப் பக்கம் இல்லை; இந்த எண்கள் காப்பகத்தின் வாசிப்பு வரிசை எண்கள், அச்சிடப்பட்டவை அல்ல."
    : "This publication prints no contents page. These numbers are the archive's reading ordinals — they are not printed in the publication.";
}
