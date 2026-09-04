import fs from "node:fs";
import path from "node:path";
import { witnessCounterparts } from "@/data/poems";
import type { PoetryPublication } from "@/data/poems";
import { publishedWorks } from "@/data/library";

/** One resolved cross-witness link, ready for a reader to render. Registry-driven. */
export type WitnessLink = {
  /** The stable relation record id, used as the render key. */
  id: string;
  href: string;
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

/**
 * Resolve every cross-witness link for a public poem endpoint — a standalone work `(slug)` or a
 * publication item `(slug, itemSlug)`. The relation REGISTRY decides which links exist; titles are
 * resolved here from the catalogue and the counterpart publication so no title is duplicated into
 * the relation record and no standalone payload is rewritten to carry link data.
 */
export function resolveWitnessLinks(slug: string, itemSlug?: string): WitnessLink[] {
  const works = publishedWorks();
  const out: WitnessLink[] = [];
  for (const { id, counterpart, note } of witnessCounterparts(slug, itemSlug)) {
    const work = works.find((w) => w.slug === counterpart.slug);
    if (!work) continue; // a relation to a work that is not published renders nothing
    const link: WitnessLink = {
      id,
      href: counterpart.itemSlug ? `/poems/${counterpart.slug}/${counterpart.itemSlug}` : `/poems/${counterpart.slug}`,
      workTitleTa: work.titleTa,
      workTitleEn: work.titleEn,
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
  return out;
}
