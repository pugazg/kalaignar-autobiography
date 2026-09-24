import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PlaySource from "@/components/PlaySource";
import { PLAY_SLUGS, type Play, type PlayProvenance } from "@/data/plays";
import { WAVE6_DRAMA_SLUGS } from "@/lib/drama-wave6-routes";
import { WAVE7_DRAMA_SLUGS } from "@/lib/drama-wave7-routes";
import { WAVE8_DRAMA_SLUGS, loadWave8Play, loadWave8PlaySource } from "@/lib/drama-wave8-routes";
import { toPublicPlayHead, toPublicPlayProvenance } from "@/lib/play-public-provenance";

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

// Wave 8 P3: WAVE8_DRAMA_SLUGS (hidden, server-built — see lib/drama-wave8-routes) joins the union.
// Wave 6 P4: PLAY_SLUGS now includes the Wave-6 Drama works; the union is deduplicated (a `Set`) so
// each `/source` page prerenders exactly once. WAVE6_DRAMA_SLUGS is retained as a helper registry.
export function generateStaticParams() {
  return Array.from(new Set<string>([...PLAY_SLUGS, ...WAVE6_DRAMA_SLUGS, ...WAVE7_DRAMA_SLUGS, ...WAVE8_DRAMA_SLUGS])).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const w8 = loadWave8Play(params.slug);
  if (w8) return { title: `Source & provenance — ${w8.title.ta} | Kalaignar Digital Library` };
  const d = load(params.slug);
  if (!d) return {};
  return { title: `Source & provenance — ${d.play.title.ta} | Kalaignar Digital Library` };
}

export default function Page({ params }: { params: { slug: string } }) {
  // Wave 8 (P3, hidden): only the allowlisted public projection is built — the hidden records never reach the page.
  const w8 = loadWave8PlaySource(params.slug);
  if (w8) return <PlaySource play={w8.play} prov={w8.prov} />;
  const d = load(params.slug);
  if (!d) notFound();
  // Server → client boundary: the archival records stay on the server; only the allowlisted public
  // projections are serialized into the page (see lib/play-public-provenance).
  return <PlaySource play={toPublicPlayHead(d.play)} prov={toPublicPlayProvenance(d.prov)} />;
}
