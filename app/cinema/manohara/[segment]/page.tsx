import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import ManoharaReader from "@/components/ManoharaReader";
import type { ManoharaIndex } from "@/data/manohara";

function loadIndex(): ManoharaIndex | null {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public/data/cinema/manohara/index.json"), "utf-8"),
    );
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  const idx = loadIndex();
  return idx ? idx.segments.map((s) => ({ segment: s.slug })) : [];
}

export function generateMetadata({ params }: { params: { segment: string } }): Metadata {
  const idx = loadIndex();
  const s = idx?.segments.find((x) => x.slug === params.segment);
  if (!s || !idx) return { title: "Manohara — மனோகரா | Kalaignar Digital Library" };
  return {
    // "segment N of 57" — deliberately NOT "scene N". The label is a bilingual
    // archive-navigation position, never a printed scene number.
    title: `${s.readerLabelTa} · Manohara segment ${s.ordinal} of ${idx.segmentCount} | Kalaignar Digital Library`,
    description: `Manohara (மனோகரா) — Kalaignar's 1954 screenplay/dialogue booklet. Archive segment ${s.ordinal} of ${idx.segmentCount}: ${s.readerLabelTa}. Original Tamil with a source-linked English reading layer.`,
  };
}

export default function ManoharaSegmentRoute({ params }: { params: { segment: string } }) {
  const idx = loadIndex();
  if (!idx) notFound();
  const i = idx.segments.findIndex((s) => s.slug === params.segment);
  if (i === -1) notFound();
  const seg = idx.segments[i];
  return (
    <ManoharaReader
      stub={seg}
      total={idx.segmentCount}
      prev={i > 0 ? idx.segments[i - 1] : null}
      next={i < idx.segments.length - 1 ? idx.segments[i + 1] : null}
    />
  );
}
