import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import EssayLanding from "@/components/EssayLanding";
import { ESSAY_SLUGS } from "@/data/essays";
import type { EssayPublication } from "@/data/essays";

// Not exported: a Next.js page module may only export the framework's own reserved names.
function loadPublication(slug: string): EssayPublication | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/essays", slug, "publication.json"), "utf-8"));
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return ESSAY_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = loadPublication(params.slug);
  if (!p) return { title: "Essays — கட்டுரைகள் | Kalaignar Digital Library" };
  const title = `${p.title.ta} — ${p.title.en} | Kalaignar Digital Library`;
  // The two edition facts are kept distinct: the publication was FIRST published in May 1956, and
  // the edition this Digital Library integrated is the 2018 reprint. The description never implies
  // the English translation was separately published, and never turns the articles' polemical
  // claims into assertions of this website.
  const description =
    `${p.title.en} — ${p.articleCount} articles by Kalaignar M. Karunanidhi, first published May ${p.firstEdition.year}; ` +
    `this reading edition follows the ${p.controllingEdition.year} reprint. Verified Tamil source text with a project-created English translation.`;
  return { title, description, openGraph: { title, description }, twitter: { title: p.title.en, description } };
}

export default function EssayPublicationPage({ params }: { params: { slug: string } }) {
  if (!(ESSAY_SLUGS as readonly string[]).includes(params.slug)) notFound();
  const pub = loadPublication(params.slug);
  if (!pub) notFound();
  return <EssayLanding pub={pub} />;
}
