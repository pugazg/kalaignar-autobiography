import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import CollectionLanding, { type CollectionMemberRow } from "@/components/CollectionLanding";
import { COLLECTION_IDS, collectionById, collectionMemberWorks } from "@/data/collections";

/**
 * A member's own printed extent inside the publication.
 *
 * Read from the member work's ALREADY-VALIDATED generated record rather than copied into the collection
 * declaration: the page range is the story's fact, the roster is the collection's, and duplicating the
 * former into the latter would create a second place for it to be wrong. Absent for any member whose
 * data does not establish it — the row then simply shows no page range, and none is inferred.
 *
 * Not exported: a Next.js page module may only export the framework's own reserved names.
 */
function loadPrintedPages(href: string): { first: number; last: number } | undefined {
  const m = /^\/stories\/([^/]+)$/.exec(href);
  if (!m) return undefined;
  try {
    const p = path.join(process.cwd(), "public/data/stories", m[1], "story.json");
    const story = JSON.parse(fs.readFileSync(p, "utf-8"));
    const pages = story?.anthology?.printedPages;
    return typeof pages?.first === "number" && typeof pages?.last === "number" ? pages : undefined;
  } catch {
    return undefined;
  }
}

function rows(id: string): CollectionMemberRow[] {
  const c = collectionById(id);
  if (!c) return [];
  // Order comes from the declaration's source-backed ordinals, never from catalogue declaration order,
  // title or page number.
  return collectionMemberWorks(c).map(({ member, work }) => ({
    ordinal: member.ordinal,
    workId: work.id,
    titleTa: work.titleTa,
    titleEn: work.titleEn,
    href: work.href,
    printedPages: loadPrintedPages(work.href),
  }));
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
