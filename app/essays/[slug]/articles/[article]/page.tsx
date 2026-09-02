import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import ArticleReader from "@/components/ArticleReader";
import { ESSAY_SLUGS } from "@/data/essays";
import type { EssayPublication } from "@/data/essays";
import { printedPagesLabel, publicationMetaSentence, scanRunsLabel } from "@/lib/essay-source-facts";

function loadPublication(slug: string): EssayPublication | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/essays", slug, "publication.json"), "utf-8"));
  } catch {
    return null;
  }
}

// Stable, deep-linkable route per article — one static page each, no query-string navigation.
export function generateStaticParams() {
  return ESSAY_SLUGS.flatMap((slug) => {
    const pub = loadPublication(slug);
    return (pub?.articles ?? []).map((a) => ({ slug, article: a.slug }));
  });
}

export function generateMetadata({ params }: { params: { slug: string; article: string } }): Metadata {
  const pub = loadPublication(params.slug);
  const a = pub?.articles.find((x) => x.slug === params.article);
  if (!pub || !a) return { title: "Article — கட்டுரை | Kalaignar Digital Library" };
  const title = `${a.titleTa} — ${a.titleEn} | ${pub.title.en} | Kalaignar Digital Library`;
  // Source-form aware. Printed pagination is quoted only where the source shows it, and the edition
  // clause comes from the publication's own facts — a 1949 pamphlet is never described as following
  // a reprint, and an article with no printed numerals never emits an empty range.
  const where = printedPagesLabel(a.printedPages, false) ?? scanRunsLabel(a, false);
  const position = pub.articleCount === 1
    ? `The essay in ${pub.title.en}`
    : `Article ${a.number} of ${pub.articleCount} in ${pub.title.en}`;
  const description =
    `${position} by Kalaignar M. Karunanidhi — ${where}. ` +
    `${publicationMetaSentence(pub)}`;
  return { title, description, openGraph: { title, description }, twitter: { title: a.titleEn, description } };
}

export default function ArticlePage({ params }: { params: { slug: string; article: string } }) {
  if (!(ESSAY_SLUGS as readonly string[]).includes(params.slug)) notFound();
  const pub = loadPublication(params.slug);
  const i = pub?.articles.findIndex((x) => x.slug === params.article) ?? -1;
  if (!pub || i < 0) notFound();
  return (
    <ArticleReader
      pub={pub}
      article={pub.articles[i]}
      prev={i > 0 ? pub.articles[i - 1] : null}
      next={i < pub.articles.length - 1 ? pub.articles[i + 1] : null}
    />
  );
}
