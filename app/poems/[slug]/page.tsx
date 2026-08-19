import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import PoemReader from "@/components/PoemReader";
import { POEM_SLUGS } from "@/data/poems";
import type { Poem } from "@/data/poems";

function loadPoem(slug: string): Poem | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/poems", slug, "poem.json"), "utf-8"));
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return POEM_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = loadPoem(params.slug);
  if (!p) return { title: "Poem — கவிதை | Kalaignar Digital Library" };
  const title = `${p.title.ta} — ${p.title.en} | Kalaignar Digital Library`;
  // SEO is built ONLY from source-established facts. The source context (a poetic tribute offered
  // on Chennai Radio on 9 February 1969) is described as exactly that. The description NEVER says
  // "published in 1969" or "published in 2008" / "2008 edition", because the controlling scan
  // establishes no publication or edition statement at all.
  const occasion = `${p.title.en} — a poem by Kalaignar M. Karunanidhi: his poetic tribute to Perarignar Anna, offered on Chennai Radio on 9 February 1969.`;
  const description = `${occasion} The verified Tamil source text with a release-complete English translation, source lineation and stanza structure preserved.`;
  return { title, description, openGraph: { title, description }, twitter: { title: p.title.en, description } };
}

export default function PoemPage({ params }: { params: { slug: string } }) {
  if (!(POEM_SLUGS as readonly string[]).includes(params.slug)) notFound();
  if (!loadPoem(params.slug)) notFound();
  return <PoemReader slug={params.slug} />;
}
