import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import ArticleSource from "@/components/ArticleSource";
import { ESSAY_SLUGS } from "@/data/essays";
import type { EssayProvenance } from "@/data/essays";

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
  return {
    title: `Source & provenance — ${params.slug} | Kalaignar Digital Library`,
    description:
      "Provenance for the publication: the controlling scan, the first-edition vs reprint distinction, verification state, the 14-article map, title-witness distinctions, body exclusions, the cross-page structural audit, and rights.",
  };
}

export default function EssaySourcePage({ params }: { params: { slug: string } }) {
  if (!(ESSAY_SLUGS as readonly string[]).includes(params.slug)) notFound();
  const prov = loadProvenance(params.slug);
  if (!prov) notFound();
  return <ArticleSource slug={params.slug} prov={prov} />;
}
