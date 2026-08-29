import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import TirumbippaarReader from "@/components/TirumbippaarReader";
import type { TirumbippaarIndex, TirumbippaarScene } from "@/data/tirumbippaar";

const DIR = "public/data/cinema/tirumbippaar";

function loadIndex(): TirumbippaarIndex | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, "index.json"), "utf-8"));
  } catch {
    return null;
  }
}
function loadScene(slug: string): TirumbippaarScene | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, "scenes", `${slug}.json`), "utf-8"));
  } catch {
    return null;
  }
}

// Driven by the generated registry, never by a numeric range. This work numbers its 93 headings
// consecutively, so a 1…93 loop would happen to produce the same list today — but the two cinema
// works before it do not, and building the routes from the registry keeps the architecture
// source-driven rather than correct by coincidence.
export function generateStaticParams() {
  const idx = loadIndex();
  return idx ? idx.scenes.map((s) => ({ scene: s.slug })) : [];
}

export function generateMetadata({ params }: { params: { scene: string } }): Metadata {
  const idx = loadIndex();
  const s = idx?.scenes.find((x) => x.slug === params.scene);
  if (!idx || !s) return { title: "Tirumbippaar — திரும்பிப்பார்! | Kalaignar Digital Library" };
  // The stored heading is used verbatim, irregular source typography included. Normalising it for a
  // tidier title would contradict the reading it sits above.
  const title = `${s.headingTa} · ${idx.titleTa} — Tirumbippaar scene ${s.canonicalScene} | Kalaignar Digital Library`;
  const description =
    `Scene ${s.canonicalScene} of ${idx.sceneCount} from ${idx.titleEn} (${idx.titleTa}), the printed ` +
    `story-and-dialogue booklet. Original Tamil with a project-created English reading layer.`;
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title: `${idx.titleEn} — scene ${s.canonicalScene}`, description },
  };
}

export default function TirumbippaarScenePage({ params }: { params: { scene: string } }) {
  const idx = loadIndex();
  if (!idx) notFound();
  const i = idx.scenes.findIndex((s) => s.slug === params.scene);
  if (i === -1) notFound();
  const scene = loadScene(params.scene);
  if (!scene) notFound();
  return (
    <TirumbippaarReader
      scene={scene}
      stub={idx.scenes[i]}
      total={idx.sceneCount}
      // Ordered-registry neighbours, so navigation follows the printed sequence rather than arithmetic.
      prev={i > 0 ? idx.scenes[i - 1] : null}
      next={i < idx.scenes.length - 1 ? idx.scenes[i + 1] : null}
    />
  );
}
