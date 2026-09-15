import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import EssayLanding from "@/components/EssayLanding";
import { ESSAY_SLUGS } from "@/data/essays";
import type { EssayPublication } from "@/data/essays";
import { publicationMetaSentence } from "@/lib/essay-source-facts";
import { WAVE6_ESSAY_SLUGS } from "@/lib/essays-wave6-routes";

// Wave 6 P4: ESSAY_SLUGS now includes the Wave-6 Batch-6 publications, so this union is deduplicated
// (a `Set`) to prerender each landing page once. WAVE6_ESSAY_SLUGS is retained as a helper registry.
const ALL_ESSAY_SLUGS: readonly string[] = Array.from(new Set<string>([...ESSAY_SLUGS, ...WAVE6_ESSAY_SLUGS]));

// Not exported: a Next.js page module may only export the framework's own reserved names.
function loadPublication(slug: string): EssayPublication | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/essays", slug, "publication.json"), "utf-8"));
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return ALL_ESSAY_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = loadPublication(params.slug);
  if (!p) return { title: "Essays — கட்டுரைகள் | Kalaignar Digital Library" };
  const title = `${p.title.ta} — ${p.title.en} | Kalaignar Digital Library`;
  // Edition facts are stated per publication rather than from a template: a work whose controlling
  // scan IS its first edition is never described as following a reprint. The description never implies
  // the English translation was separately published, and never turns the articles' polemical
  // claims into assertions of this website.
  const description = publicationMetaSentence(p);
  return { title, description, openGraph: { title, description }, twitter: { title: p.title.en, description } };
}

export default function EssayPublicationPage({ params }: { params: { slug: string } }) {
  if (!ALL_ESSAY_SLUGS.includes(params.slug)) notFound();
  const pub = loadPublication(params.slug);
  if (!pub) notFound();
  return <EssayLanding pub={pub} />;
}
