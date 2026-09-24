import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PlayLanding from "@/components/PlayLanding";
import { PLAY_SLUGS, type Play } from "@/data/plays";
import { WAVE6_DRAMA_SLUGS } from "@/lib/drama-wave6-routes";
import { WAVE7_DRAMA_SLUGS } from "@/lib/drama-wave7-routes";
import { WAVE8_DRAMA_SLUGS, loadWave8Play } from "@/lib/drama-wave8-routes";
import { playLandingDescription } from "@/lib/play-metadata";

// NOTE: helpers here are intentionally NOT exported — a Next.js page module may only export
// reserved names.
function loadPlay(slug: string): Play | null {
  // Wave 8 (P3, hidden): built on the server from the hidden P1 data — no public/data payload exists.
  const w8 = loadWave8Play(slug);
  if (w8) return w8;
  const p = path.join(process.cwd(), "public/data/plays", slug, "play.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as Play;
}

// Wave 6 P4: the Wave-6 Drama works are now promoted into PLAY_SLUGS, so this union is deduplicated
// (a `Set`) to keep exactly one prerender param per slug. WAVE6_DRAMA_SLUGS is retained as a helper
// registry; unioning it here is harmless because the `Set` collapses the now-overlapping membership.
export function generateStaticParams() {
  return Array.from(new Set<string>([...PLAY_SLUGS, ...WAVE6_DRAMA_SLUGS, ...WAVE7_DRAMA_SLUGS, ...WAVE8_DRAMA_SLUGS])).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const play = loadPlay(params.slug);
  if (!play) return {};
  // The description states the structure the SOURCE actually prints (numbered scenes, a compressed
  // range, an unnumbered scene, editorial SRUs, or a continuous body) and qualifies authorship where
  // the selected source range prints no author line — see lib/play-metadata.
  return {
    title: `${play.title.ta} — ${play.title.en} | Kalaignar Digital Library`,
    description: playLandingDescription(play),
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const play = loadPlay(params.slug);
  if (!play) notFound();
  return <PlayLanding play={play} />;
}
