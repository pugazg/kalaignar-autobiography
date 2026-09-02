import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import StoryReader from "@/components/StoryReader";
import { STORY_SLUGS } from "@/data/stories";
import type { Story } from "@/data/stories";

// Not exported: a Next.js page module may only export the framework's own reserved names.
function loadStory(slug: string): Story | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/stories", slug, "story.json"), "utf-8"));
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return STORY_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const story = loadStory(params.slug);
  if (!story) return { title: "Short story — சிறுகதை | Kalaignar Digital Library" };
  const title = `${story.title.ta} — ${story.title.en} | Kalaignar Digital Library`;
  // Only source-established facts. A booklet's own form label (`கற்பனையுரை`) is quoted as the source's
  // word, never restated as a genre claim of this website — and an anthology story, which prints no
  // form label at all, gets its collection placement instead of an invented one.
  const placement = story.formLabel
    ? `printed under the form label ${story.formLabel.ta}`
    : story.anthology
      ? `printed in the 1977 anthology ${story.anthology.collectionTitleTa}`
      : "printed in the verified source edition";
  const description =
    `${story.title.en} (${story.title.ta}) — a short story by Kalaignar M. Karunanidhi, ${placement}. ` +
    `The verified Tamil source text with a project-created English translation.`;
  return { title, description, openGraph: { title, description }, twitter: { title: story.title.en, description } };
}

export default function StoryPage({ params }: { params: { slug: string } }) {
  if (!(STORY_SLUGS as readonly string[]).includes(params.slug)) notFound();
  const story = loadStory(params.slug);
  if (!story) notFound();
  return <StoryReader story={story} />;
}
