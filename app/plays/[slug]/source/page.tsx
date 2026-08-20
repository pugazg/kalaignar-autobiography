import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PlaySource from "@/components/PlaySource";
import { PLAY_SLUGS, type Play, type PlayProvenance } from "@/data/plays";

function load(slug: string): { play: Play; prov: PlayProvenance } | null {
  const dir = path.join(process.cwd(), "public/data/plays", slug);
  const a = path.join(dir, "play.json");
  const b = path.join(dir, "provenance.json");
  if (!fs.existsSync(a) || !fs.existsSync(b)) return null;
  return {
    play: JSON.parse(fs.readFileSync(a, "utf8")) as Play,
    prov: JSON.parse(fs.readFileSync(b, "utf8")) as PlayProvenance,
  };
}

export function generateStaticParams() {
  return PLAY_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const d = load(params.slug);
  if (!d) return {};
  return { title: `Source & provenance — ${d.play.title.ta} | Kalaignar Digital Library` };
}

export default function Page({ params }: { params: { slug: string } }) {
  const d = load(params.slug);
  if (!d) notFound();
  return <PlaySource play={d.play} prov={d.prov} />;
}
