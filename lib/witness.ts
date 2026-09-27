import fs from "node:fs";
import path from "node:path";
import { witnessCounterparts } from "@/data/poems";
import type { PoetryPublication } from "@/data/poems";
import { LIBRARY_PUBLICATIONS, publishedWorks } from "@/data/library";
import { LIBRARY_COLLECTIONS } from "@/data/collections";
import { loadSangatamil } from "@/lib/sangatamil-server";
import { activeRelations, type WorkRelation } from "@/lib/work-relations";

/** One resolved cross-witness link, ready for a reader to render. Registry-driven. */
export type WitnessLink = {
  /** The stable relation record id, used as the render key. */
  id: string;
  /** Absent for a witness with no page in this library (a scan range of a printed book, an external publication). */
  href?: string;
  workTitleTa: string;
  workTitleEn: string;
  /** Present when the counterpart is a specific item inside a publication. */
  itemTitleTa?: string;
  itemTitleEn?: string;
  noteTa: string;
  noteEn: string;
  /** Optional qualifying line after the label (R3-D: the 1958 publication-level relation's non-equivalence caveat). */
  detailTa?: string;
  detailEn?: string;
};

function loadPublication(slug: string): PoetryPublication | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/poems", slug, "publication.json"), "utf-8"));
  } catch {
    return null;
  }
}

type EssayUnits = { articles: { slug: string; titleTa: string; titleEn: string; tamil: { blocks: { kind: string; text: string }[] }; english: { blocks: { kind: string; text: string }[] } }[] };
function loadEssay(slug: string): EssayUnits | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/essays", slug, "publication.json"), "utf-8"));
  } catch {
    return null;
  }
}

/** Title of a canonical work OR a source publication record (a demoted publication is no longer a LibraryWork). */
function recordTitles(id: string): { ta: string; en: string } | null {
  const r = publishedWorks().find((w) => w.id === id || w.slug === id) ?? LIBRARY_PUBLICATIONS.find((p) => p.id === id || p.slug === id);
  return r ? { ta: r.titleTa, en: r.titleEn } : null;
}

/**
 * Resolve every cross-witness link for a public poem endpoint — a standalone work `(slug)` or a
 * publication item `(slug, itemSlug)`. The relation REGISTRY decides which links exist; titles are
 * resolved here from the catalogue and the counterpart publication so no title is duplicated into
 * the relation record and no standalone payload is rewritten to carry link data.
 *
 * The two Wave-4 relations come through `witnessCounterparts` (the generated POETRY_WITNESS_RELATIONS view), exactly
 * as before; every other ACTIVE R3 relation for the same page is appended after them, in registry order.
 */
export function resolveWitnessLinks(slug: string, itemSlug?: string): WitnessLink[] {
  const out: WitnessLink[] = [];
  for (const { id, counterpart, note } of witnessCounterparts(slug, itemSlug)) {
    const work = recordTitles(counterpart.slug);
    if (!work) continue; // a relation to a work that is not published renders nothing
    const link: WitnessLink = {
      id,
      href: counterpart.itemSlug ? `/poems/${counterpart.slug}/${counterpart.itemSlug}` : `/poems/${counterpart.slug}`,
      workTitleTa: work.ta,
      workTitleEn: work.en,
      noteTa: note.ta,
      noteEn: note.en,
    };
    if (counterpart.itemSlug) {
      const pub = loadPublication(counterpart.slug);
      const item = pub?.items.find((i) => i.slug === counterpart.itemSlug);
      if (!item) continue; // a relation to a missing item renders nothing
      link.itemTitleTa = item.titleTa;
      link.itemTitleEn = item.titleEn;
    }
    out.push(link);
  }
  return [...out, ...r3WitnessLinksForPage(itemSlug ? `/poems/${slug}/${itemSlug}` : `/poems/${slug}`)];
}

// ── R3 relations (lib/work-relations.ts; active records only) ────────────────────────────────────────────────────
const NOTE = {
  toWitness: { ta: "இதே கவிதையின் மற்றொரு மூல ஆதாரப் பதிப்பும் கிடைக்கிறது.", en: "Another source witness of this same poem is available." },
  toCanonical: { ta: "இப்பதிப்பு பின்வரும் கவிதையின் ஒரு மூல ஆதாரப் பதிப்பு:", en: "This printing is a source witness of the poem" },
  elsewhere: { ta: "இக்கவிதை மேலும் அச்சான இடம்:", en: "This poem was also printed in" },
};
/** A `section`-level source-publication relation (R3-C: the two `idhaya-perikai` sections) names the printed section. */
const sectionOf = (r: WorkRelation) => (r.level === "section" && r.class === "source-publication" ? (r.canonicalSection as { ordinal: number; titleTa: string }) : null);

/**
 * Relation classes shown ONLY on the canonical side (R3-D, frozen plan §9): the Sangatamil commentary's rendering is
 * unchanged by R3, so its sections never carry a reverse note — `oruthalaik-kathal` exposes the relation instead.
 */
export const CANONICAL_SIDE_ONLY: ReadonlySet<string> = new Set(["commentary-section"]);

/** The canonical work's kind, for work-type-aware merged-witness wording (never "poem" for an essay). */
const KIND: Record<string, { ta: string; en: string }> = {
  poetry: { ta: "கவிதையின்", en: "poem" },
  "essays-articles": { ta: "கட்டுரையின்", en: "essay" },
};
const kindOf = (shelf: string) => KIND[shelf] ?? { ta: "படைப்பின்", en: "work" };

/** R3-D notes, one set per relation class and level — structurally distinct, never a shared generic sentence. */
const R3D_NOTE = {
  mergedOnCanonical: { ta: "இப்படைப்பு முந்தைய தலைப்பில் பின்வருமாறும் அச்சானது:", en: "This work was also printed, under an earlier title, as" },
  mergedOnWitness: (shelf: string) => ({
    ta: `இப்பதிப்பு, இங்குள்ள முந்தைய தலைப்பில், பின்வரும் ${kindOf(shelf).ta} ஒரு மூல ஆதாரப் பதிப்பு:`,
    en: `This printing, under its earlier title here, is a source witness of the ${kindOf(shelf).en}`,
  }),
  commentaryOnLanding: (n: number) => ({ ta: `பகுதி ${n} மேலும் அச்சான இடம்:`, en: `Section ${n} was also printed in` }),
  commentaryOnSection: { ta: "இப்பகுதி மேலும் அச்சான இடம்:", en: "This section was also printed in" },
  chapter: (alai: number, heading: string) => ({
    ta: `இப்படைப்பு பின்வரும் நூலில் அலை ${alai} «${heading}» ஆகவும் வெளியானது:`,
    en: `Also published as அலை ${alai} «${heading}» in`,
  }),
  publication: { ta: "இப்படைப்பு பின்வரும் 1958 நூலுடன் தொடர்புடையது:", en: "Related to the 1958 publication" },
  publicationDetail: (alai: number, heading: string) => ({
    ta: `மூலம் அலை ${alai} «${heading}» எனக் குறிப்பிடுகிறது; அத்தியாய நிகரம் எதுவும் உறுதிசெய்யப்படவில்லை.`,
    en: `The source indicates அலை ${alai} «${heading}»; no chapter equivalence is asserted.`,
  }),
};
const SECTION_NOTE = {
  toWitness: (s: { ordinal: number; titleTa: string }) => ({
    ta: `இப்படைப்பின் பகுதி ${s.ordinal} «${s.titleTa}» மற்றொரு மூல ஆதாரப் பதிப்பாகவும் கிடைக்கிறது:`,
    en: `Section ${s.ordinal} of this work, «${s.titleTa}», is also available in another source witness:`,
  }),
  toCanonical: (s: { ordinal: number; titleTa: string }) => ({
    ta: `இப்பதிப்பு பின்வரும் படைப்பின் பகுதி ${s.ordinal} «${s.titleTa}» இன் ஒரு மூல ஆதாரப் பதிப்பு:`,
    en: `This printing is a source witness of section ${s.ordinal}, «${s.titleTa}», of`,
  }),
};

/** Titles of a witness, from its publication record and payload (never copied into the relation record). */
function witnessTitles(r: WorkRelation): { work: { ta: string; en: string }; item?: { ta: string; en: string } } | null {
  const w = r.witness as Record<string, unknown>;
  if (w.kind === "publication-unit") {
    const pubId = String(w.publicationId);
    const work = recordTitles(pubId);
    if (!work) return null;
    if (w.fragment) {
      const unit = loadEssay(pubId)?.articles.find((a) => a.slug === w.unitSlug);
      const n = Number(String(w.fragment).split("-").pop()) - 1;
      const ta = unit?.tamil.blocks.filter((b) => b.kind === "subheading")[n]?.text;
      const en = unit?.english.blocks.filter((b) => b.kind === "subheading")[n]?.text;
      return ta && en ? { work, item: { ta, en } } : null;
    }
    const item = loadPublication(pubId)?.items.find((i) => i.slug === w.unitSlug) ?? loadEssay(pubId)?.articles.find((a) => a.slug === w.unitSlug);
    return item ? { work, item: { ta: item.titleTa, en: item.titleEn } } : null;
  }
  if (w.kind === "publication-scan-range") {
    const work = recordTitles(String(w.publicationId));
    const [a, b] = w.scans as number[];
    return work ? { work, item: { ta: `ஸ்கேன் ${a}–${b}`, en: `scans ${a}–${b}` } } : null;
  }
  if (w.kind === "legacy-work") {
    // A merged story: its printed old title, in the printed anthology that holds it.
    const rec = w.record as { titleTa: string; titleEn: string };
    const coll = LIBRARY_COLLECTIONS.find((c) => (w.collections as string[] | undefined)?.includes(c.id));
    return coll ? { work: { ta: coll.titleTa, en: coll.titleEn }, item: { ta: rec.titleTa, en: rec.titleEn } } : { work: { ta: rec.titleTa, en: rec.titleEn } };
  }
  if (w.kind === "commentary-section") {
    const work = recordTitles(String(w.workId));
    const sec = loadSangatamil().sections.find((x) => `/sangatamil/${x.slug}` === w.sectionRoute);
    return work && sec ? { work, item: { ta: sec.headingTa, en: sec.headingEn ?? sec.headingTa } } : null;
  }
  if (w.kind === "external-publication" && w.titleTa) {
    const t = `${w.titleTa}${w.year ? ` (${w.year})` : ""}`;
    return { work: { ta: t, en: t } };
  }
  return null;
}

/**
 * The active R3 relations that concern ONE public page (a route; fragments on it included): on a canonical work's page,
 * its witnesses; on a witness's page, its canonical work. The two Wave-4 relations are excluded here — they render
 * through `resolveWitnessLinks`' legacy path above, unchanged.
 */
export function r3WitnessLinksForPage(pathname: string): WitnessLink[] {
  const out: WitnessLink[] = [];
  const works = publishedWorks();
  const pageOf = (href: string) => href.split("#")[0];
  const canonicalHere = new Set(works.filter((w) => pageOf(w.href) === pathname).map((w) => w.id));
  for (const r of activeRelations().filter((x) => !x.legacyPoetryView)) {
    const sectionRoute = (r.canonicalSection as { route?: string } | undefined)?.route;
    if (sectionRoute && sectionRoute === pathname) {
      // R3-D: a canonical SECTION page (oruthalaik-kathal/section-N) shows only its own section's witness.
      const t = witnessTitles(r);
      if (!t) continue;
      out.push({ id: r.id, ...(r.witness.locator ? { href: r.witness.locator } : {}), workTitleTa: t.work.ta, workTitleEn: t.work.en, ...(t.item ? { itemTitleTa: t.item.ta, itemTitleEn: t.item.en } : {}), noteTa: R3D_NOTE.commentaryOnSection.ta, noteEn: R3D_NOTE.commentaryOnSection.en });
    } else if (canonicalHere.has(r.canonicalId)) {
      const t = witnessTitles(r);
      if (!t) continue;
      const loc = r.witness.locator;
      const sec = sectionOf(r);
      const w = r.witness as Record<string, unknown>;
      const ind = w.indicates as { alai: number; headingTa: string } | undefined;
      const note =
        r.class === "merged-witness" ? R3D_NOTE.mergedOnCanonical
          : r.class === "commentary-section" ? R3D_NOTE.commentaryOnLanding(Number((r.canonicalSection as { ordinal: number }).ordinal))
            : r.class === "external-publication" && r.level === "chapter" ? R3D_NOTE.chapter(Number(w.alai), String(w.headingTa))
              : r.class === "external-publication" && r.level === "publication" ? R3D_NOTE.publication
                : sec ? SECTION_NOTE.toWitness(sec) : loc ? NOTE.toWitness : NOTE.elsewhere;
      const detail = r.class === "external-publication" && r.level === "publication" && ind ? R3D_NOTE.publicationDetail(ind.alai, ind.headingTa) : null;
      out.push({
        id: r.id,
        ...(loc ? { href: loc } : {}),
        workTitleTa: t.work.ta,
        workTitleEn: t.work.en,
        ...(t.item ? { itemTitleTa: t.item.ta, itemTitleEn: t.item.en } : {}),
        noteTa: note.ta,
        noteEn: note.en,
        ...(detail ? { detailTa: detail.ta, detailEn: detail.en } : {}),
      });
    } else if (r.witness.locator && pageOf(r.witness.locator) === pathname && !CANONICAL_SIDE_ONLY.has(r.class)) {
      const c = works.find((w) => w.id === r.canonicalId);
      if (!c) continue; // an active relation always targets a published work (validated); never render a dangling one
      const t = witnessTitles(r);
      if (r.class === "merged-witness") {
        const note = R3D_NOTE.mergedOnWitness(c.shelf);
        out.push({ id: r.id, href: c.href, workTitleTa: c.titleTa, workTitleEn: c.titleEn, noteTa: note.ta, noteEn: note.en });
        continue;
      }
      const sec = sectionOf(r);
      if (sec) {
        const note = SECTION_NOTE.toCanonical(sec);
        out.push({ id: r.id, href: c.href, workTitleTa: c.titleTa, workTitleEn: c.titleEn, noteTa: note.ta, noteEn: note.en });
        continue;
      }
      out.push({
        id: r.id,
        href: c.href,
        workTitleTa: c.titleTa,
        workTitleEn: c.titleEn,
        // On a unit holding several printed poems, the note names which printed poem it is about.
        noteTa: r.witness.fragment && t?.item ? `«${t.item.ta}» — இக்கவிதை பின்வரும் கவிதையின் ஒரு மூல ஆதாரப் பதிப்பு:` : NOTE.toCanonical.ta,
        noteEn: r.witness.fragment && t?.item ? `“${t.item.en}”, printed here, is a source witness of the poem` : NOTE.toCanonical.en,
      });
    }
  }
  return out;
}

/**
 * R3-D (frozen plan §10, adjudication OD6): the publication-level note a source publication's landing carries when its
 * canonical works are related to an external publication — derived from the ACTIVE external-publication relations of
 * the works this publication contains (never typed). Today: the Meesai landing and the 1958 தேனலைகள். The unit range,
 * the chapter-mapped அலைகள், the publication-level-only அலை and the unmapped அலைகள் are all derived from the records.
 */
export function publicationRelationNote(publicationId: string): { ta: string; en: string } | null {
  const pub = loadEssay(publicationId) as unknown as { articles: { slug: string; number?: number }[] } | null;
  const unitNo = new Map((pub?.articles ?? []).map((a) => [a.slug, a.number ?? 0]));
  const ext = activeRelations().filter((r) => r.class === "external-publication" && unitNo.has(r.canonicalId) && (r.witness as Record<string, unknown>).externalId);
  if (!ext.length) return null;
  const w0 = ext[0].witness as Record<string, unknown>;
  const chapters = ext.filter((r) => r.level === "chapter").map((r) => Number((r.witness as Record<string, unknown>).alai));
  const pubLevel = ext.filter((r) => r.level === "publication").map((r) => Number(((r.witness as Record<string, unknown>).indicates as { alai: number }).alai));
  const known = new Set([...chapters, ...pubLevel]);
  const unmapped = Array.from({ length: Math.max(...Array.from(known)) }, (_, i) => i + 1).filter((n) => !known.has(n));
  const units = ext.map((r) => unitNo.get(r.canonicalId)!).sort((a, b) => a - b);
  const range = `${units[0]}–${units[units.length - 1]}`;
  const list = (xs: number[]) => xs.join(", ");
  return {
    ta:
      `இந்நூலின் பகுதிகள் ${range}, «${w0.titleTa}» (${w0.dateTa}) நூலின் அதே அடிப்படை உள்ளடக்கம் — தலைப்புகள் வேறு, அத்தியாய வரிசை மாற்றப்பட்டுள்ளது. ` +
      `${chapters.length} அலைகள் இங்குள்ள படைப்புகளுடன் அத்தியாய அளவில் பொருந்துகின்றன` +
      (pubLevel.length ? `; அலை ${list(pubLevel)} நூல் அளவில் மட்டுமே தொடர்புடையது` : "") +
      (unmapped.length ? `; அலை ${list(unmapped)} எதனுடனும் பொருத்தப்படவில்லை.` : "."),
    en:
      `Units ${range} of this book are the same underlying content as «${w0.titleTa}» (${w0.dateEn}), under different titles and in a changed chapter order. ` +
      `${chapters.length} of its அலைகள் correspond to works here chapter by chapter` +
      (pubLevel.length ? `; அலை ${list(pubLevel)} relates at publication level only` : "") +
      (unmapped.length ? `; அலை ${list(unmapped)} is not mapped to any work.` : "."),
  };
}
