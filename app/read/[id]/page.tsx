import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Reader from "@/components/Reader";
import { chapterIndex } from "@/data/references";

export function generateStaticParams() {
  return chapterIndex.map((c) => ({ id: c.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const c = chapterIndex.find((x) => x.id === params.id);
  return {
    title: c
      ? `${c.title} — Nenjukku Neethi Vol. ${c.volume} | Kalaignar Digital Library`
      : "Chapter — Kalaignar Digital Library",
    description: c ? `Volume ${c.volume}, ${c.pages}. Original Tamil text with citation support.` : undefined,
  };
}

export default function ChapterPage({ params }: { params: { id: string } }) {
  const i = chapterIndex.findIndex((c) => c.id === params.id);
  if (i === -1) notFound();
  return (
    <Reader
      chapter={chapterIndex[i]}
      prev={i > 0 ? chapterIndex[i - 1] : null}
      next={i < chapterIndex.length - 1 ? chapterIndex[i + 1] : null}
    />
  );
}
