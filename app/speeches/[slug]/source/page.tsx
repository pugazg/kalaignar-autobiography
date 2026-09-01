import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import SpeechSource from "@/components/SpeechSource";
import { SPEECH_SLUGS } from "@/data/speeches";
import type { SpeechProvenance } from "@/data/speeches";

function loadProvenance(slug: string): SpeechProvenance | null {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public/data/speeches", slug, "provenance.json"), "utf-8"),
    );
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return SPEECH_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  // The description must describe the source form this speech actually has. A print speech keeps
  // its publication/scan/source-page wording verbatim; an audio-sourced speech must not be
  // described as having a scan or a source-page mapping, because it has neither.
  const prov = loadProvenance(params.slug);
  const description =
    prov?.sourceForm === "audio"
      ? "Provenance for the speech: the controlling audio recording and its verified identity, the direct-listening verification state, the source time map, and rights — with the underlying speech kept distinct from the source recording, and source facts distinct from archive-derived structure."
      : "Provenance for the speech: the source publication and scan, verification state, source-page mapping, and rights — with source facts kept distinct from archive-derived structure.";
  return {
    title: `Source & provenance — ${params.slug} | Kalaignar Digital Library`,
    description,
  };
}

export default function SpeechSourcePage({ params }: { params: { slug: string } }) {
  if (!(SPEECH_SLUGS as readonly string[]).includes(params.slug)) notFound();
  const prov = loadProvenance(params.slug);
  if (!prov) notFound();
  return <SpeechSource slug={params.slug} prov={prov} />;
}
