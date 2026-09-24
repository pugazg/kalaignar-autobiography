import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PlayReader from "@/components/PlayReader";
import { PLAY_SLUGS, type Play } from "@/data/plays";
import { WAVE6_DRAMA_SLUGS } from "@/lib/drama-wave6-routes";
import { WAVE7_DRAMA_SLUGS } from "@/lib/drama-wave7-routes";
import { WAVE8_DRAMA_SLUGS, loadWave8Play } from "@/lib/drama-wave8-routes";
import { playSceneDescription } from "@/lib/play-metadata";

function loadPlay(slug: string): Play | null {
  // Wave 8 (P3, hidden): built on the server from the hidden P1 data — no public/data payload exists.
  const w8 = loadWave8Play(slug);
  if (w8) return w8;
  const p = path.join(process.cwd(), "public/data/plays", slug, "play.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as Play;
}

// Wave 8 P3: WAVE8_DRAMA_SLUGS (hidden, server-built — see lib/drama-wave8-routes) joins the union.
// Wave 6 P4: PLAY_SLUGS now includes the Wave-6 Drama works; the union is deduplicated (a `Set`) so
// each `[scene]` param prerenders once. Each `[scene]` set is derived from the work's own released
// registry (play.json.readingUnits). WAVE6_DRAMA_SLUGS is retained as a helper registry.
export function generateStaticParams() {
  return Array.from(new Set<string>([...PLAY_SLUGS, ...WAVE6_DRAMA_SLUGS, ...WAVE7_DRAMA_SLUGS, ...WAVE8_DRAMA_SLUGS])).flatMap((slug) => {
    const play = loadPlay(slug);
    return play ? play.readingUnits.map((s) => ({ slug, scene: s.slug })) : [];
  });
}

export function generateMetadata({ params }: { params: { slug: string; scene: string } }): Metadata {
  const play = loadPlay(params.slug);
  const scene = play?.readingUnits.find((s) => s.slug === params.scene);
  if (!play || !scene) return {};
  return {
    title: `${scene.titleTa} — ${scene.titleEn} | ${play.title.ta} | Kalaignar Digital Library`,
    // Structure-aware per reading-unit kind — never "Scene N" for a continuous body or an SRU, never
    // "Scene null" for a compressed range / unnumbered scene, never "Scene N of 0". See lib/play-metadata.
    description: playSceneDescription(play, scene),
  };
}

export default function Page({ params }: { params: { slug: string; scene: string } }) {
  const play = loadPlay(params.slug);
  if (!play) notFound();
  const i = play.readingUnits.findIndex((s) => s.slug === params.scene);
  if (i === -1) notFound();
  return (
    <PlayReader
      play={play}
      scene={play.readingUnits[i]}
      prev={i > 0 ? play.readingUnits[i - 1] : null}
      next={i < play.readingUnits.length - 1 ? play.readingUnits[i + 1] : null}
    />
  );
}
