import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PlayReader from "@/components/PlayReader";
import { PLAY_SLUGS, type Play } from "@/data/plays";

function loadPlay(slug: string): Play | null {
  const p = path.join(process.cwd(), "public/data/plays", slug, "play.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as Play;
}

export function generateStaticParams() {
  return PLAY_SLUGS.flatMap((slug) => {
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
    // NEVER "Scene 1" for a continuous work: the source prints no scenes, so the metadata must
    // not manufacture one.
    description:
      scene.kind === "closing-tableau"
        ? `The unnumbered closing tableau of ${play.title.en} — not Scene 39.`
        : scene.kind === "continuous-body"
          ? `${play.title.en} — the complete continuous dramatic text, which the source prints without any scene division.`
          : `Scene ${scene.order} of ${play.sceneCount} — ${scene.titleEn}.`,
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
