import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import NovelReader from "@/components/NovelReader";
import { NOVEL_SLUGS } from "@/data/novels";
import type { Novel } from "@/data/novels";

function loadNovel(slug: string): Novel | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/novels", slug, "novel.json"), "utf-8"));
  } catch {
    return null;
  }
}

// One stable, deep-linkable route per assembled section.
export function generateStaticParams() {
  return NOVEL_SLUGS.flatMap((slug) => {
    const n = loadNovel(slug);
    return (n?.sections ?? []).map((s) => ({ slug, section: s.slug }));
  });
}

export function generateMetadata({ params }: { params: { slug: string; section: string } }): Metadata {
  const novel = loadNovel(params.slug);
  const s = novel?.sections.find((x) => x.slug === params.section);
  if (!novel || !s) return { title: "Novel — புனைகதை | Kalaignar Digital Library" };
  const title = `${s.titleTa} — ${s.titleEn} | ${novel.title.en} | Kalaignar Digital Library`;
  // The internal sequence is described as a section OF this novel, never as its own work.
  const what = s.isEmbeddedSequence
    ? `the cinematic-historical sequence staged inside ${novel.title.en}`
    : `part ${s.order} of ${novel.sectionCount} of ${novel.title.en}`;
  const description =
    `${s.titleEn} — ${what}, by Kalaignar M. Karunanidhi (first edition April ${novel.edition.year}). ` +
    `Verified Tamil source text with a project-created English translation.`;
  return { title, description, openGraph: { title, description }, twitter: { title: s.titleEn, description } };
}

export default function NovelSectionPage({ params }: { params: { slug: string; section: string } }) {
  if (!(NOVEL_SLUGS as readonly string[]).includes(params.slug)) notFound();
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
