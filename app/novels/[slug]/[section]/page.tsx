import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import NovelReader from "@/components/NovelReader";
import { NOVEL_SLUGS } from "@/data/novels";
import type { Novel } from "@/data/novels";
import { WAVE6_NOVEL_SLUGS } from "@/lib/novels-wave6-routes";

const ALL_NOVEL_SLUGS: readonly string[] = [...NOVEL_SLUGS, ...WAVE6_NOVEL_SLUGS];

function loadNovel(slug: string): Novel | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/novels", slug, "novel.json"), "utf-8"));
  } catch {
    return null;
  }
}

// One stable, deep-linkable route per assembled section — for discovered AND Wave-6 novels. Section
// slugs come from each work's frozen `sections[]` only; paratext (front matter, printer colophon,
// checkpoints) is absent from that list, so it never gets a route.
export function generateStaticParams() {
  return ALL_NOVEL_SLUGS.flatMap((slug) => {
    const n = loadNovel(slug);
    return (n?.sections ?? []).map((s) => ({ slug, section: s.slug }));
  });
}

export function generateMetadata({ params }: { params: { slug: string; section: string } }): Metadata {
  const novel = loadNovel(params.slug);
  const s = novel?.sections.find((x) => x.slug === params.section);
  if (!novel || !s) return { title: "Novel — புனைகதை | Kalaignar Digital Library" };
  const title = `${s.titleTa} — ${s.titleEn} | ${novel.title.en} | Kalaignar Digital Library`;
  // Data-driven: the internal sequence (first benchmark) is described as a section OF the novel; a
  // Wave-6 unit uses its work's own unit noun ("section" / "Chapter"), never another work's facts.
  const unitNoun = novel.structure?.unitNounEn ?? "part";
  const what = s.isEmbeddedSequence
    ? `the cinematic-historical sequence staged inside ${novel.title.en}`
    : `${unitNoun.toLowerCase()} ${s.order} of ${novel.sectionCount} of ${novel.title.en}`;
  const editionPhrase = novel.editionSummaryEn ?? (novel.edition?.year ? `first edition April ${novel.edition.year}` : "as printed in its source edition");
  const description =
    `${s.titleEn} — ${what}, by Kalaignar M. Karunanidhi (${editionPhrase}). ` +
    `Verified Tamil source text with a project-created English translation.`;
  return { title, description, openGraph: { title, description }, twitter: { title: s.titleEn, description } };
}

export default function NovelSectionPage({ params }: { params: { slug: string; section: string } }) {
  if (!ALL_NOVEL_SLUGS.includes(params.slug)) notFound();
  const novel = loadNovel(params.slug);
  const i = novel?.sections.findIndex((x) => x.slug === params.section) ?? -1;
  if (!novel || i < 0) notFound();
  return (
    <NovelReader
      novel={novel}
      section={novel.sections[i]}
      prev={i > 0 ? novel.sections[i - 1] : null}
      next={i < novel.sections.length - 1 ? novel.sections[i + 1] : null}
    />
  );
}
