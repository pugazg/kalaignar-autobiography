import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PlayLanding from "@/components/PlayLanding";
import { PLAY_SLUGS, type Play } from "@/data/plays";

// NOTE: helpers here are intentionally NOT exported — a Next.js page module may only export
// reserved names.
function loadPlay(slug: string): Play | null {
  const p = path.join(process.cwd(), "public/data/plays", slug, "play.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as Play;
}

export function generateStaticParams() {
  return PLAY_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const play = loadPlay(params.slug);
  if (!play) return {};
  return {
    title: `${play.title.ta} — ${play.title.en} | Kalaignar Digital Library`,
    description: `${play.descriptor.en} by ${play.author.en} — ${play.sceneCount} scenes and a closing tableau, from the printed edition.`,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const play = loadPlay(params.slug);
  if (!play) notFound();
  return <PlayLanding play={play} />;
}
