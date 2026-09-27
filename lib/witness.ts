import fs from "node:fs";
import path from "node:path";
import { witnessCounterparts } from "@/data/poems";
import type { PoetryPublication } from "@/data/poems";
import { LIBRARY_PUBLICATIONS, publishedWorks } from "@/data/library";
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
    if (canonicalHere.has(r.canonicalId)) {
      const t = witnessTitles(r);
      if (!t) continue;
      const loc = r.witness.locator;
      out.push({
        id: r.id,
        ...(loc ? { href: loc } : {}),
        workTitleTa: t.work.ta,
        workTitleEn: t.work.en,
        ...(t.item ? { itemTitleTa: t.item.ta, itemTitleEn: t.item.en } : {}),
        noteTa: loc ? NOTE.toWitness.ta : NOTE.elsewhere.ta,
        noteEn: loc ? NOTE.toWitness.en : NOTE.elsewhere.en,
      });
    } else if (r.witness.locator && pageOf(r.witness.locator) === pathname) {
      const c = works.find((w) => w.id === r.canonicalId);
      if (!c) continue; // an active relation always targets a published work (validated); never render a dangling one
      const t = witnessTitles(r);
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
