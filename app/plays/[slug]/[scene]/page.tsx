import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PlayReader from "@/components/PlayReader";
import { PLAY_SLUGS, type Play } from "@/data/plays";
import { WAVE6_DRAMA_SLUGS } from "@/lib/drama-wave6-routes";
import { playSceneDescription } from "@/lib/play-metadata";

function loadPlay(slug: string): Play | null {
  const p = path.join(process.cwd(), "public/data/plays", slug, "play.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as Play;
}

// Wave 6 P3: discovered PLAY_SLUGS PLUS the undiscovered Wave-6 Drama works, each `[scene]` set
// derived from its own released registry (play.json.readingUnits). Prerendered but undiscovered.
export function generateStaticParams() {
  return [...PLAY_SLUGS, ...WAVE6_DRAMA_SLUGS].flatMap((slug) => {
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
