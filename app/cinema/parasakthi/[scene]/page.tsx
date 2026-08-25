import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import ParasakthiReader from "@/components/ParasakthiReader";
import type { ParasakthiIndex, ParasakthiScene } from "@/data/parasakthi";

const DIR = "public/data/cinema/parasakthi";

function loadIndex(): ParasakthiIndex | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, "index.json"), "utf-8"));
  } catch {
    return null;
  }
}
function loadScene(slug: string): ParasakthiScene | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, "scenes", `${slug}.json`), "utf-8"));
  } catch {
    return null;
  }
}

// Driven by the generated registry, never by a numeric range. The booklet prints no headings 23 or
// 34, so those slugs are simply not in the registry — there is no page for them and nothing to
// filter out afterwards.
export function generateStaticParams() {
  const idx = loadIndex();
  return idx ? idx.scenes.map((s) => ({ scene: s.slug })) : [];
}

export function generateMetadata({ params }: { params: { scene: string } }): Metadata {
  const idx = loadIndex();
  const s = idx?.scenes.find((x) => x.slug === params.scene);
  if (!idx || !s) return { title: "Parasakthi — பராசக்தி | Kalaignar Digital Library" };
  // The scene's identity is its CANONICAL number. For the two transposed scenes the booklet prints
  // a different one; that belongs on the provenance page, not in a page title.
  const title = `${s.headingTa} · ${idx.titleTa} — Parasakthi scene ${s.canonicalScene} | Kalaignar Digital Library`;
  const description =
    `Scene ${s.canonicalScene} of ${idx.sceneCount} from ${idx.titleEn} (${idx.titleTa}), the printed ` +
    `dialogue-and-songs booklet of the 1952 film. Original Tamil with a project-created English reading layer.`;
  return { title, description, openGraph: { title, description }, twitter: { title: `${idx.titleEn} — scene ${s.canonicalScene}`, description } };
}

export default function ParasakthiScenePage({ params }: { params: { scene: string } }) {
  const idx = loadIndex();
  if (!idx) notFound();
  const i = idx.scenes.findIndex((s) => s.slug === params.scene);
  if (i === -1) notFound();
  const scene = loadScene(params.scene);
  if (!scene) notFound();
  return (
    <ParasakthiReader
      scene={scene}
      stub={idx.scenes[i]}
      total={idx.sceneCount}
      // Ordered-registry neighbours, so 22 → 24 and 33 → 35 without any numeric arithmetic.
      prev={i > 0 ? idx.scenes[i - 1] : null}
      next={i < idx.scenes.length - 1 ? idx.scenes[i + 1] : null}
    />
  );
}
