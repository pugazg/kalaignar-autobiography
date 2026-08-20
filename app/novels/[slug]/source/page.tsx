import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import NovelSource from "@/components/NovelSource";
import { NOVEL_SLUGS } from "@/data/novels";
import type { NovelProvenance } from "@/data/novels";

function loadProvenance(slug: string): NovelProvenance | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/novels", slug, "provenance.json"), "utf-8"));
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return NOVEL_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  return {
    title: `Source & provenance — ${params.slug} | Kalaignar Digital Library`,
    description:
      "Provenance for the novel: the controlling scan, the 1947 first-edition facts, verification state, the embedded-sequence rule, the source-established cross-page joins, body exclusions, and rights.",
  };
}

export default function NovelSourcePage({ params }: { params: { slug: string } }) {
  if (!(NOVEL_SLUGS as readonly string[]).includes(params.slug)) notFound();
  const prov = loadProvenance(params.slug);
  if (!prov) notFound();
  return <NovelSource slug={params.slug} prov={prov} />;
}
