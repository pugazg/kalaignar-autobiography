import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import StorySource from "@/components/StorySource";
import StorySourceB7 from "@/components/StorySourceB7";
import { STORY_SLUGS } from "@/data/stories";
import type { StoryProvenance, StoryProvenanceB7 } from "@/data/stories";

function loadProvenance(slug: string): StoryProvenance | StoryProvenanceB7 | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/stories", slug, "provenance.json"), "utf-8"));
  } catch {
    return null;
  }
}
const isB7 = (p: StoryProvenance | StoryProvenanceB7): p is StoryProvenanceB7 => (p as { batch?: number }).batch === 7;

export function generateStaticParams() {
  return STORY_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  return {
    title: `மூலமும் சான்றும் — ${params.slug} | Kalaignar Digital Library`,
    description:
      "Provenance for the short story: the controlling scan, the story's own verification scope kept apart from the whole copy's, printed-page uncertainty, the cross-scan join policy, the publisher's erratum witness, and the English layer.",
  };
}

export default function StorySourcePage({ params }: { params: { slug: string } }) {
  if (!(STORY_SLUGS as readonly string[]).includes(params.slug)) notFound();
  const prov = loadProvenance(params.slug);
  if (!prov) notFound();
  return isB7(prov) ? <StorySourceB7 slug={params.slug} prov={prov} /> : <StorySource slug={params.slug} prov={prov} />;
}
