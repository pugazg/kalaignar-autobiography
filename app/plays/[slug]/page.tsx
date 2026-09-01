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
  // The description states the structure the SOURCE actually prints. A continuous work has no
  // scenes to count, and only one edition prints a closing tableau, so neither is asserted globally.
  const parts: string[] = [];
  if (play.structureKind === "continuous-play") parts.push("one continuous dramatic text with no scene division");
  else parts.push(`${play.sceneCount} scenes`);
  if (play.closingTableauCount > 0) parts.push("a closing tableau");
  if (play.openingNote) parts.push(`${play.openingNote.labelEn.toLowerCase()}`);
  return {
    title: `${play.title.ta} — ${play.title.en} | Kalaignar Digital Library`,
    description: `${play.descriptor.en} by ${play.author.en} — ${parts.join(", ")}, from the printed edition.`,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const play = loadPlay(params.slug);
  if (!play) notFound();
  return <PlayLanding play={play} />;
}
