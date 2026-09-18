import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import NovelSource from "@/components/NovelSource";
import { NOVEL_SLUGS } from "@/data/novels";
import type { NovelProvenance } from "@/data/novels";
import { WAVE6_NOVEL_SLUGS } from "@/lib/novels-wave6-routes";
import { WAVE7_NOVEL_SLUGS, isWave7Novel } from "@/lib/novels-wave7-routes";
import { wave7NovelToNovel, wave7NovelProvenance } from "@/lib/wave7-novels-adapter";

const ALL_NOVEL_SLUGS: readonly string[] = Array.from(new Set<string>([...NOVEL_SLUGS, ...WAVE6_NOVEL_SLUGS, ...WAVE7_NOVEL_SLUGS]));

function loadProvenance(slug: string): NovelProvenance | null {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/novels", slug, "provenance.json"), "utf-8"));
    if (!isWave7Novel(slug)) return raw;
    // Wave-7 B3: adapt the P1 provenance into NovelProvenance, computing block counts from the adapted novel.
    const novel = wave7NovelToNovel(JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/novels", slug, "novel.json"), "utf-8")));
    return wave7NovelProvenance(raw, novel);
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return ALL_NOVEL_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  return {
    title: `Source & provenance — ${params.slug} | Kalaignar Digital Library`,
    description:
      "Provenance for the novel: the controlling scan, the source edition facts, verification state, the work's structure, the source-established cross-page joins, body exclusions, and rights.",
  };
}

export default function NovelSourcePage({ params }: { params: { slug: string } }) {
  if (!ALL_NOVEL_SLUGS.includes(params.slug)) notFound();
  const prov = loadProvenance(params.slug);
  if (!prov) notFound();
  return <NovelSource slug={params.slug} prov={prov} />;
}
