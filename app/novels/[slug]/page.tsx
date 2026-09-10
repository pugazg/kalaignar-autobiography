import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import NovelLanding from "@/components/NovelLanding";
import { NOVEL_SLUGS } from "@/data/novels";
import type { Novel } from "@/data/novels";
import { WAVE6_NOVEL_SLUGS } from "@/lib/novels-wave6-routes";

// Discovered novels PLUS the Wave-6 Batch-5 direct-only novels. The Wave-6 set is prerendered here
// (so its landing pages are URL-addressable) but stays out of NOVEL_SLUGS, the catalogue and the
// sitemap. Any slug outside this union fails closed with notFound().
const ALL_NOVEL_SLUGS: readonly string[] = [...NOVEL_SLUGS, ...WAVE6_NOVEL_SLUGS];

// Not exported: a Next.js page module may only export the framework's own reserved names.
function loadNovel(slug: string): Novel | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/novels", slug, "novel.json"), "utf-8"));
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return ALL_NOVEL_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const n = loadNovel(params.slug);
  if (!n) return { title: "Novel — புனைகதை | Kalaignar Digital Library" };
  const title = `${n.title.ta} — ${n.title.en} | Kalaignar Digital Library`;
  // Data-driven edition descriptor: each work states its OWN edition (no work is described with
  // another's facts). The first benchmark, which carries no `editionSummaryEn`, keeps its original
  // "first published April 1947 by Erimalai Pathippagam, Thuraiyur" wording from its own edition data.
  const editionPhrase = n.editionSummaryEn
    ? n.editionSummaryEn
    : n.edition?.year
      ? `first published April ${n.edition.year} by Erimalai Pathippagam, Thuraiyur`
      : "as printed in its source edition";
  const description =
    `${n.title.en} — a novel by Kalaignar M. Karunanidhi (${editionPhrase}). ` +
    `The verified Tamil source text with a project-created English translation.`;
  return { title, description, openGraph: { title, description }, twitter: { title: n.title.en, description } };
}

export default function NovelPage({ params }: { params: { slug: string } }) {
  if (!ALL_NOVEL_SLUGS.includes(params.slug)) notFound();
  const novel = loadNovel(params.slug);
  if (!novel) notFound();
  return <NovelLanding novel={novel} />;
}
