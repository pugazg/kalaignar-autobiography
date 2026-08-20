import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import NovelLanding from "@/components/NovelLanding";
import { NOVEL_SLUGS } from "@/data/novels";
import type { Novel } from "@/data/novels";

// Not exported: a Next.js page module may only export the framework's own reserved names.
function loadNovel(slug: string): Novel | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/novels", slug, "novel.json"), "utf-8"));
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return NOVEL_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const n = loadNovel(params.slug);
  if (!n) return { title: "Novel — புனைகதை | Kalaignar Digital Library" };
  const title = `${n.title.ta} — ${n.title.en} | Kalaignar Digital Library`;
  // Only source-established facts: the 1947 first edition and its publisher. The description never
  // implies a separate work for the internal sequence, and never turns the novel's polemical
  // argument into an assertion of this website.
  const description =
    `${n.title.en} — a novel by Kalaignar M. Karunanidhi, first published April ${n.edition.year} by ` +
    `Erimalai Pathippagam, Thuraiyur. The verified Tamil source text with a project-created English translation.`;
  return { title, description, openGraph: { title, description }, twitter: { title: n.title.en, description } };
}

export default function NovelPage({ params }: { params: { slug: string } }) {
  if (!(NOVEL_SLUGS as readonly string[]).includes(params.slug)) notFound();
  const novel = loadNovel(params.slug);
  if (!novel) notFound();
  return <NovelLanding novel={novel} />;
}
