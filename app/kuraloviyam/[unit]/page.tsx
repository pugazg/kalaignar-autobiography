import type { Metadata } from "next";
import { notFound } from "next/navigation";
import KuraloviyamReader from "@/components/KuraloviyamReader";
import { kuraloviyamUnitLabel } from "@/data/kuraloviyam";
import { kuraloviyamUnitIds, loadKuraloviyamIndex, loadKuraloviyamUnit } from "@/lib/kuraloviyam-server";

// One static page per reading unit of குறளோவியம் — 7 front-matter sections, the 300 printed-contents entries,
// and the printed contents/back cover — driven by the vendored index, never by scanning the filesystem.
export function generateStaticParams() {
  return kuraloviyamUnitIds().map((unit) => ({ unit }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: { params: { unit: string } }): Metadata {
  const u = loadKuraloviyamIndex()?.units.find((x) => x.id === params.unit);
  if (!u) return { title: "Kuraloviyam | Kalaignar Digital Library" };
  const head = u.kind === "entry" ? `${u.number}. ${u.contentsKey}` : `${u.titleTa} · ${u.titleEn}`;
  return {
    title: `${head} — குறளோவியம் | Kalaignar Digital Library`,
    description: u.kind === "entry"
      ? `Kuraloviyam entry ${u.number} of 300 (printed p. ${u.printedSpan[0]}) — verified Tamil with a project-created English translation.`
      : `Kuraloviyam — ${kuraloviyamUnitLabel(u, false)}.`,
  };
}

export default function KuraloviyamUnitPage({ params }: { params: { unit: string } }) {
  const index = loadKuraloviyamIndex();
  const unit = loadKuraloviyamUnit(params.unit);
  if (!index || !unit) notFound();
  const i = index.units.findIndex((u) => u.id === params.unit);
  if (i < 0) notFound();
  const nav = (u: (typeof index.units)[number] | undefined) =>
    u ? { id: u.id, kind: u.kind, number: u.number, contentsKey: u.contentsKey, titleTa: u.titleTa, titleEn: u.titleEn } : null;
  return <KuraloviyamReader unit={unit} prev={nav(index.units[i - 1])} next={nav(index.units[i + 1])} />;
}
