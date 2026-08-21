import { notFound } from "next/navigation";
import type { Metadata } from "next";
import KuralReader from "@/components/KuralReader";
import { loadKural, loadThirukkuralIndex } from "@/data/thirukkural";

/** Only the numbers the edition actually sets are built; anything else 404s. */
export function generateStaticParams() {
  return loadThirukkuralIndex().kurals.map((k) => ({ number: String(k.number) }));
}

/** Rejects "01", "1.0", "+1" and similar spellings of a valid number, so each Kural has one URL. */
function parse(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null;
  return Number(raw);
}

export function generateMetadata({ params }: { params: { number: string } }): Metadata {
  const n = parse(params.number);
  const found = n === null ? null : loadKural(n);
  if (!found) return {};
  return {
    title: `குறள் ${found.entry.number} — ${found.entry.adhikaram.tamil} | திருக்குறள் கலைஞர் உரை`,
    description: `${found.entry.tamilText.join(" ")} — கலைஞர் உரையுடன்.`,
  };
}

export default function Page({ params }: { params: { number: string } }) {
  const n = parse(params.number);
  if (n === null) notFound();
  const found = loadKural(n);
  if (!found) notFound();
  const total = loadThirukkuralIndex().counts.kurals;
  return (
    <KuralReader
      entry={found.entry}
      adhikaram={found.adhikaram}
      prev={n > 1 ? n - 1 : null}
      next={n < total ? n + 1 : null}
    />
  );
}
