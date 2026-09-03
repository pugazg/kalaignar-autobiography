import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import PoemReader from "@/components/PoemReader";
import { resolveWitnessLinks } from "@/lib/witness";
import PublicationLanding from "@/components/PublicationLanding";
import type { PublicationBrief } from "@/components/PublicationLanding";
import { POEM_SLUGS, POETRY_PUBLICATION_SLUGS } from "@/data/poems";
import type { Poem, PoetryPublication } from "@/data/poems";

function loadPoem(slug: string): Poem | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/poems", slug, "poem.json"), "utf-8"));
  } catch {
    return null;
  }
}

function loadPublication(slug: string): PoetryPublication | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/poems", slug, "publication.json"), "utf-8"));
  } catch {
    return null;
  }
}
const isPublication = (slug: string) => (POETRY_PUBLICATION_SLUGS as readonly string[]).includes(slug);

/** The lightweight landing brief — the roster without the heavy per-item reading layers. */
function publicationBrief(pub: PoetryPublication): PublicationBrief {
  return {
    slug: pub.slug,
    titleTa: pub.title.ta,
    titleEn: pub.title.en,
    authorTa: pub.author.nameTa,
    authorEn: pub.author.nameEn,
    editionStatement: pub.editionStatement,
    publicationYear: pub.publicationYear,
    itemCount: pub.itemCount,
    items: pub.items.map((i) => ({
      ordinal: i.ordinal,
      slug: i.slug,
      titleTa: i.titleTa,
      contentsTitleTa: i.contentsTitleTa,
      titleEn: i.titleEn,
      printedOrdinal: i.printedOrdinal,
      scanFirst: i.physicalScans[0].first,
      scanLast: i.physicalScans[i.physicalScans.length - 1].last,
    })),
    groups: pub.groups?.map((g) => ({ ordinal: g.ordinal, titleTa: g.titleTa, titleEn: g.titleEn, itemOrdinals: g.itemOrdinals })),
  };
}

export function generateStaticParams() {
  return [...POEM_SLUGS, ...POETRY_PUBLICATION_SLUGS].map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  if (isPublication(params.slug)) {
    const pub = loadPublication(params.slug);
    if (!pub) return { title: "Poetry — கவிதை | Kalaignar Digital Library" };
    const title = `${pub.title.ta} — ${pub.title.en} | Kalaignar Digital Library`;
    const description = `${pub.title.en} — ${pub.itemCount} poems by Kalaignar M. Karunanidhi${pub.editionStatement ? `, ${pub.editionStatement}` : ""}. The verified Tamil source text with a release-complete English translation, each poem read on its own page.`;
    return { title, description, openGraph: { title, description }, twitter: { title: pub.title.en, description } };
  }
  const p = loadPoem(params.slug);
  if (!p) return { title: "Poem — கவிதை | Kalaignar Digital Library" };
  // Where no English title is approved upstream, `title.en` falls back to the canonical Tamil
  // title; pairing it with itself would both read as a translation and publish a title the source
  // never approved. The metadata then carries the canonical Tamil title alone.
  const bilingual = p.title.en !== p.title.ta;
  const title = bilingual ? `${p.title.ta} — ${p.title.en} | Kalaignar Digital Library` : `${p.title.ta} | Kalaignar Digital Library`;

  // SEO is built ONLY from source-established facts, and it is DERIVED rather than written, because
  // a literal here becomes a claim about every poem on the shelf. Of the four standalone poems only
  // one prints a context note above the verse; a sentence naming its occasion, its venue and its
  // date would be a fabricated fact on the other three. So each clause below appears only when this
  // work's own payload carries the thing it states.
  const ctx = p.sourceContext;
  const dateEn = ctx?.dateIso
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
        new Date(`${ctx.dateIso}T00:00:00Z`),
      )
    : ctx?.datePrinted;
  // The occasion keeps the source's own words; only the leading capital is lowered so it reads as a
  // clause. Venue and date are appended only where the source prints them.
  const occasionEn = ctx?.occasion?.en ? ctx.occasion.en.charAt(0).toLowerCase() + ctx.occasion.en.slice(1) : null;
  const where = ctx?.venue?.en ? ` on ${ctx.venue.en}` : "";
  const when = dateEn ? ` on ${dateEn}` : "";
  // The description NEVER converts a context date into a publication date, and it states a
  // publication only where the source establishes one — three of the four establish none.
  const published = p.editionStatement ? `, published in ${p.editionStatement}` : "";
  const lead = bilingual ? p.title.en : p.title.ta;
  const opening = occasionEn
    ? `${lead} — a poem by Kalaignar M. Karunanidhi: ${occasionEn}, offered${where}${when}.`
    : `${lead} — a poem by Kalaignar M. Karunanidhi${published}.`;

  // Claims stay inside the evidence: source LINEATION is preserved exactly, and stanza gaps are
  // preserved where the source establishes them (within a printed page). The description does not
  // claim complete "stanza structure", because the printed stanza relationship across the physical
  // page transitions is not established by the source.
  const description = `${opening} The verified Tamil source text with a release-complete English translation, source lineation preserved line for line.`;
  return { title, description, openGraph: { title, description }, twitter: { title: lead, description } };
}

export default function PoemPage({ params }: { params: { slug: string } }) {
  if (isPublication(params.slug)) {
    const pub = loadPublication(params.slug);
    if (!pub) notFound();
    return <PublicationLanding pub={publicationBrief(pub)} />;
  }
  if (!(POEM_SLUGS as readonly string[]).includes(params.slug)) notFound();
  if (!loadPoem(params.slug)) notFound();
  return <PoemReader slug={params.slug} witnessLinks={resolveWitnessLinks(params.slug)} />;
}
