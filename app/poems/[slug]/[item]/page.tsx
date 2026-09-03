import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import PublicationItemReader from "@/components/PublicationItemReader";
import { POETRY_PUBLICATION_SLUGS } from "@/data/poems";
import { resolveWitnessLinks } from "@/lib/witness";
import type { PoetryPublication } from "@/data/poems";

// FAIL CLOSED on unknown children. A standalone poem (/poems/marathi) has no items, so
// /poems/marathi/anything must 404 rather than render. Only the pairs enumerated below exist.
export const dynamicParams = false;

function loadPublication(slug: string): PoetryPublication | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/poems", slug, "publication.json"), "utf-8"));
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return POETRY_PUBLICATION_SLUGS.flatMap((slug) => {
    const pub = loadPublication(slug);
    return (pub?.items ?? []).map((i) => ({ slug, item: i.slug }));
  });
}

export function generateMetadata({ params }: { params: { slug: string; item: string } }): Metadata {
  const pub = loadPublication(params.slug);
  const it = pub?.items.find((i) => i.slug === params.item);
  if (!pub || !it) return { title: "Poem — கவிதை | Kalaignar Digital Library" };
  const title = `${it.titleTa} — ${it.titleEn} | ${pub.title.ta} | Kalaignar Digital Library`;
  const description = `${it.titleEn} — poem ${it.ordinal} of ${pub.itemCount} in ${pub.title.en} by Kalaignar M. Karunanidhi. Verified Tamil source with a release-complete English translation.`;
  return { title, description, openGraph: { title, description }, twitter: { title: it.titleEn, description } };
}

export default function PublicationItemPage({ params }: { params: { slug: string; item: string } }) {
  const pub = loadPublication(params.slug);
  if (!pub) notFound();
  const idx = pub.items.findIndex((i) => i.slug === params.item);
  if (idx === -1) notFound();
  const item = pub.items[idx];
  const brief = (i: (typeof pub.items)[number] | undefined) => (i ? { slug: i.slug, titleTa: i.titleTa } : null);
  return (
    <PublicationItemReader
      pubSlug={pub.slug}
      pubTitleTa={pub.title.ta}
      item={item}
      index={idx}
      total={pub.items.length}
      prev={brief(pub.items[idx - 1])}
      next={brief(pub.items[idx + 1])}
      witnessLinks={resolveWitnessLinks(pub.slug, item.slug)}
    />
  );
}
