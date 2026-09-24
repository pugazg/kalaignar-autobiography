import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SangatamilReader from "@/components/SangatamilReader";
import { loadSangatamil, sangatamilSectionSlugs } from "@/lib/sangatamil-server";
import { toPublicSangatamilSection, toPublicSangatamilSummary } from "@/lib/wave8-public-provenance";

// One static page per source-order section of சங்கத் தமிழ் (front matter, 102 sections, back cover) — the reader
// model's own section ids, never a 1..N range. Wave 8 P3: direct, undiscovered (no catalogue / /read / sitemap).
export function generateStaticParams() {
  return sangatamilSectionSlugs().map((section) => ({ section }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: { params: { section: string } }): Metadata {
  const w = loadSangatamil();
  const s = w.sections.find((x) => x.slug === params.section);
  if (!s) return { title: `${w.title.ta} | Kalaignar Digital Library` };
  const head = s.kind === "section" ? `${s.headingTa}${s.headingEn ? ` · ${s.headingEn}` : ""}` : s.headingEn ?? s.headingTa;
  return {
    title: `${head} — ${w.title.ta} | Kalaignar Digital Library`,
    description: s.kind === "section"
      ? `${w.title.en}, section ${s.seq} of 102 (printed pp. ${s.printedPages}; scans ${s.scans[0]}–${s.scans[1]}) — verified Tamil with a project-created English translation.`
      : `${w.title.en} — ${s.kind === "front-matter" ? "front matter" : "back cover"} (scans ${s.scans[0]}–${s.scans[1]}).`,
  };
}

export default function SangatamilSectionPage({ params }: { params: { section: string } }) {
  const w = loadSangatamil();
  const i = w.sections.findIndex((s) => s.slug === params.section);
  if (i < 0) notFound();
  return (
    <SangatamilReader
      titleTa={w.title.ta}
      section={toPublicSangatamilSection(w.sections[i])}
      prev={i > 0 ? toPublicSangatamilSummary(w.sections[i - 1]) : null}
      next={i < w.sections.length - 1 ? toPublicSangatamilSummary(w.sections[i + 1]) : null}
    />
  );
}
