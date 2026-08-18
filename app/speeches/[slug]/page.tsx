import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import SpeechReader from "@/components/SpeechReader";
import { SPEECH_SLUGS } from "@/data/speeches";
import type { Speech } from "@/data/speeches";

function loadSpeech(slug: string): Speech | null {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public/data/speeches", slug, "speech.json"), "utf-8"),
    );
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return SPEECH_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const s = loadSpeech(params.slug);
  if (!s) return { title: "Speech — உரை | Kalaignar Digital Library" };
  const title = `${s.title.ta} — ${s.title.en} | Kalaignar Digital Library`;
  const subtype = s.subtype === "assembly-speech" ? "Legislative Assembly speech" : "public speech";
  const context = s.legislature?.nameEn ?? s.venue?.en;
  const details = [s.date, context, s.event?.en].filter(Boolean).join(" · ");
  const description = `${s.title.en} — Kalaignar M. Karunanidhi ${subtype}${details ? ` (${details})` : ""}. Original verified Tamil with a source-linked verified English translation.`;
  return { title, description, openGraph: { title, description }, twitter: { title: s.title.en, description } };
}

export default function SpeechPage({ params }: { params: { slug: string } }) {
  if (!(SPEECH_SLUGS as readonly string[]).includes(params.slug)) notFound();
  const s = loadSpeech(params.slug);
  if (!s) notFound();
  return <SpeechReader slug={params.slug} />;
}
