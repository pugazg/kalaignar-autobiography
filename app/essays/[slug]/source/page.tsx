import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import ArticleSource from "@/components/ArticleSource";
import { ESSAY_SLUGS } from "@/data/essays";
import type { EssayProvenance } from "@/data/essays";
import { sourcePageMetaDescription } from "@/lib/essay-source-facts";

function loadProvenance(slug: string): EssayProvenance | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/essays", slug, "provenance.json"), "utf-8"));
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return ESSAY_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  // Derived from the publication's OWN provenance record, never a template. An earlier revision
  // hard-coded the reference publication's facts here — "the first-edition vs reprint distinction,
  // the 14-article map, and rights" — which are all false for a 1949 single-article pamphlet with no
  // reprint and no rights determination. `sourcePageFacts` emits a clause only where the record
  // actually carries the fact.
  const prov = loadProvenance(params.slug);
  if (!prov) return { title: "Source & provenance | Kalaignar Digital Library" };
  const title = `Source & provenance — ${prov.source.titleTa} · ${prov.source.titleEn} | Kalaignar Digital Library`;
  const description = sourcePageMetaDescription(prov);
  return { title, description, openGraph: { title, description }, twitter: { title: prov.source.titleEn, description } };
}

export default function EssaySourcePage({ params }: { params: { slug: string } }) {
  if (!(ESSAY_SLUGS as readonly string[]).includes(params.slug)) notFound();
  const prov = loadProvenance(params.slug);
  if (!prov) notFound();
  return <ArticleSource slug={params.slug} prov={prov} />;
}
