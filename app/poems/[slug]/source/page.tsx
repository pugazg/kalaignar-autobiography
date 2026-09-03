import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import PoemSource from "@/components/PoemSource";
import { POEM_SLUGS } from "@/data/poems";
import type { Poem, PoemProvenance } from "@/data/poems";

function load<T>(slug: string, file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/poems", slug, file), "utf-8"));
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return POEM_SLUGS.map((slug) => ({ slug }));
}

// DERIVED, never written. A literal description here would state facts about ONE work: three of the
// four standalone poems print no context note above the poem, one has an owner-directed editorial
// exception and the others do not, and only one establishes a publication. So each sentence below is
// emitted only when this work's own provenance carries the thing it describes.
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const prov = load<PoemProvenance>(params.slug, "provenance.json");
  if (!prov) return { title: "Source & provenance | Kalaignar Digital Library" };
  const s = prov.source;
  const parts = [
    "the controlling scan and its verified identity",
    "verification state",
    ...(s.contextNoteTa ? ["the source context printed above the poem"] : []),
    ...(s.publicationEstablished ? ["the publication the source establishes"] : []),
    ...(s.publicationNotEstablished ? ["what the source does NOT establish"] : []),
    ...(s.editorialExceptionNote ? ["a documented editorial exception"] : []),
    "the page/stanza boundary rule",
    "rights",
  ];
  return {
    // Same rule as the reader route: no invented English title, and no title paired with itself.
    title:
      s.titleEn !== s.titleTa
        ? `Source & provenance — ${s.titleTa} / ${s.titleEn} | Kalaignar Digital Library`
        : `Source & provenance — ${s.titleTa} | Kalaignar Digital Library`,
    description: `Provenance for the poem: ${parts.join(", ")}.`,
  };
}

export default function PoemSourcePage({ params }: { params: { slug: string } }) {
  if (!(POEM_SLUGS as readonly string[]).includes(params.slug)) notFound();
  const prov = load<PoemProvenance>(params.slug, "provenance.json");
  if (!prov) notFound();
  // The editorial-exception record lives on the WORK, because it applies to both reading layers
  // rather than only to the archival manifest. The provenance page is where a reader goes to find
  // out what was done to the text, so it is read here and shown in full.
  const poem = load<Poem>(params.slug, "poem.json");
  return <PoemSource slug={params.slug} prov={prov} exceptions={poem?.editorialExceptions} />;
}
