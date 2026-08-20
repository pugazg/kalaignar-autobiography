import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import PoemSource from "@/components/PoemSource";
import { POEM_SLUGS } from "@/data/poems";
import type { PoemProvenance } from "@/data/poems";

function loadProvenance(slug: string): PoemProvenance | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/poems", slug, "provenance.json"), "utf-8"));
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return POEM_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  return {
    title: `Source & provenance — ${params.slug} | Kalaignar Digital Library`,
    description:
      "Provenance for the poem: the controlling scan, verification state, the source context printed above the poem, what the source does NOT establish, the page/stanza boundary rule, and rights.",
  };
}

export default function PoemSourcePage({ params }: { params: { slug: string } }) {
  if (!(POEM_SLUGS as readonly string[]).includes(params.slug)) notFound();
  const prov = loadProvenance(params.slug);
  if (!prov) notFound();
  return <PoemSource slug={params.slug} prov={prov} />;
}
