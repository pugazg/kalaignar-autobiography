import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import CollectionLanding, { type CollectionMemberRow } from "@/components/CollectionLanding";
import { COLLECTION_IDS, collectionById, collectionMemberWorks } from "@/data/collections";

/**
 * A member's own printed extent inside THIS publication, as a display label.
 *
 * Precedence is deliberate. When the collection declaration carries a collection-local extent
 * (`member.localPages` / `member.localScans`) it wins outright: a reprint such as the 2009 anthology
 * pins its OWN pagination there, and the member work's payload records the ORIGINAL (1977) edition's
 * pages, which must never be shown for the reprint. Otherwise the extent is read from the member work's
 * already-validated payload — a 1977-anthology work states it as `anthology.printedPages`, a Batch-7
 * short story as `provenance.storyScope`. Absent everywhere → the row shows no extent, and none is
 * inferred. The page range is the work's fact and the roster is the collection's, so neither is copied
 * into the other except for the reprint case the model exists to handle.
 *
 * Not exported: a Next.js page module may only export the framework's own reserved names.
 */
function payloadExtent(href: string): { pages?: string; scans?: string } {
  const m = /^\/stories\/([^/]+)$/.exec(href);
  if (!m) return {};
  const read = (f: string) => {
    try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/stories", m[1], f), "utf-8")); }
    catch { return undefined; }
  };
  const story = read("story.json");
  const ap = story?.anthology?.printedPages;
  if (typeof ap?.first === "number" && typeof ap?.last === "number") return { pages: `${ap.first}–${ap.last}` };
  const scope = read("provenance.json")?.storyScope;
  const pages = typeof scope?.printedPages === "string" ? scope.printedPages : undefined;
  const scans = typeof scope?.storyScans === "string" ? scope.storyScans : undefined;
  return { pages, scans };
}

function rows(id: string): CollectionMemberRow[] {
  const c = collectionById(id);
  if (!c) return [];
  // Order comes from the declaration's source-backed ordinals, never from catalogue declaration order,
  // title or page number.
  return collectionMemberWorks(c).map(({ member, work }) => {
    const payload = payloadExtent(work.href);
    return {
      ordinal: member.ordinal,
      workId: work.id,
      titleTa: work.titleTa,
      titleEn: work.titleEn,
      href: work.href,
      pages: member.localPages ?? payload.pages,
      scans: member.localScans ?? payload.scans,
    };
  });
}

/** Statically enumerable, declaration-driven: an id with no declaration has no page and 404s. */
export function generateStaticParams() {
  return COLLECTION_IDS.map((id) => ({ id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const c = collectionById(params.id);
  if (!c) return { title: "Collection — தொகுப்பு | Kalaignar Digital Library" };
  const title = `${c.titleTa} — ${c.titleEn} | Kalaignar Digital Library`;
  // Derived from this collection's own record, so a second collection cannot inherit the first's
  // facts. Only what the declaration carries is stated: the edition line is quoted as the
  // publication's, and no publication history is invented for the member works.
  const edition = c.editionStatementTa ? `${c.editionStatementTa}. ` : "";
  const publisher = c.publisherTa ? `${c.publisherTa}. ` : "";
  const description =
    `${c.titleEn} (${c.titleTa}) — ${edition}${publisher}` +
    `${c.memberCount.value} ${c.memberCount.labelEn} by Kalaignar M. Karunanidhi, each published here as ` +
    `its own source-faithful work, listed in the order the publication's printed contents page numbers them.`;
  return { title, description, openGraph: { title, description }, twitter: { title: c.titleEn, description } };
}

export default function CollectionPage({ params }: { params: { id: string } }) {
  const collection = collectionById(params.id);
  if (!collection) notFound();
  return <CollectionLanding collection={collection} members={rows(params.id)} />;
}
