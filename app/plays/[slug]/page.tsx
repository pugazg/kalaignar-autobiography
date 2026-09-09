import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PlayLanding from "@/components/PlayLanding";
import { PLAY_SLUGS, type Play } from "@/data/plays";
import { WAVE6_DRAMA_SLUGS } from "@/lib/drama-wave6-routes";
import { playLandingDescription } from "@/lib/play-metadata";

// NOTE: helpers here are intentionally NOT exported — a Next.js page module may only export
// reserved names.
function loadPlay(slug: string): Play | null {
  const p = path.join(process.cwd(), "public/data/plays", slug, "play.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as Play;
}

// Wave 6 P3: the discovered PLAY_SLUGS PLUS the authorized-but-undiscovered Wave-6 Drama works. The
// latter are prerendered (URL-addressable) but stay out of the catalogue, `/read` and the sitemap,
// which are driven by PLAY_SLUGS / data/library.ts alone until Wave 6 P4 (NOT authorized).
export function generateStaticParams() {
  return [...PLAY_SLUGS, ...WAVE6_DRAMA_SLUGS].map((slug) => ({ slug }));
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
