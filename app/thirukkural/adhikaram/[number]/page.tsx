import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AdhikaramReader from "@/components/AdhikaramReader";
import { loadAdhikaram, loadThirukkuralIndex } from "@/data/thirukkural";

export function generateStaticParams() {
  return loadThirukkuralIndex().adhikarams.map((a) => ({ number: String(a.number) }));
}

function parse(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null;
  return Number(raw);
}

export function generateMetadata({ params }: { params: { number: string } }): Metadata {
  const n = parse(params.number);
  const a = n === null ? null : loadAdhikaram(n);
  if (!a) return {};
  return {
    title: `${a.number}. ${a.tamil} — குறள் ${a.from}–${a.to} | திருக்குறள் கலைஞர் உரை`,
    description: `அதிகாரம் ${a.number}: ${a.tamil} — ${a.paal.tamil}, ${a.iyal.tamil}.`,
  };
}

export default function Page({ params }: { params: { number: string } }) {
  const n = parse(params.number);
  if (n === null) notFound();
  const adhikaram = loadAdhikaram(n);
  if (!adhikaram) notFound();
  const list = loadThirukkuralIndex().adhikarams;
  const i = list.findIndex((a) => a.number === n);
  return (
    <AdhikaramReader
      adhikaram={adhikaram}
      prev={i > 0 ? { number: list[i - 1].number, tamil: list[i - 1].tamil } : null}
      next={i < list.length - 1 ? { number: list[i + 1].number, tamil: list[i + 1].tamil } : null}
    />
  );
}
