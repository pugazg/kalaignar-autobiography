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
  // Description is built ONLY from source-established facts. A speech whose source states no date
  // or venue must never be described as "the <year> speech" or "speech at undefined": the date and
  // place clauses are simply omitted, and a publication/edition date is never used as a speech date.
  //
  // The date clause is what supplies the NOUN ("<date> speech"). A source that establishes a place
  // but no date therefore used to leave the possessive dangling straight onto the preposition —
  // "Kalaignar M. Karunanidhi's at Kalaivanar Arangam, Chennai". No released speech had reached
  // that combination before, so the defect was latent; the audio speech, whose recording
  // establishes a venue and states no date, is the first case to expose it. The fix supplies the
  // missing noun in exactly that case, and does NOT invent a date to avoid it.
  const place: string[] = [];
  if (s.subtype === "public-speech") {
    if (s.venue) place.push(`at ${s.venue.en}`);
  } else {
    place.push(`at ${s.legislature.nameEn}${s.event?.en ? ` (${s.event.en})` : ""}`);
  }
  const clauses: string[] = [];
  if (s.date) clauses.push(`${s.date} speech`);
  else if (place.length) clauses.push(s.subtype === "public-speech" ? "public speech" : "speech");
  clauses.push(...place);
  const what = clauses.length
    ? `Kalaignar M. Karunanidhi's ${clauses.join(" ")}`
    : `a verified ${s.subtype === "public-speech" ? "public speech" : "speech"} by Kalaignar M. Karunanidhi`;
  const description = `${s.title.en} — ${what}. Original verified Tamil with a source-linked English translation.`;
  return { title, description, openGraph: { title, description }, twitter: { title: s.title.en, description } };
}

export default function SpeechPage({ params }: { params: { slug: string } }) {
  if (!(SPEECH_SLUGS as readonly string[]).includes(params.slug)) notFound();
  const s = loadSpeech(params.slug);
  if (!s) notFound();
  return <SpeechReader slug={params.slug} />;
}
