import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import StorySource from "@/components/StorySource";
import { STORY_SLUGS } from "@/data/stories";
import type { StoryProvenance } from "@/data/stories";

function loadProvenance(slug: string): StoryProvenance | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/stories", slug, "provenance.json"), "utf-8"));
  } catch {
    return null;
  }
}

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
  return <StorySource slug={params.slug} prov={prov} />;
}
