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
  // Only source-established facts. `கற்பனையுரை` is the booklet's own form label, so it is quoted as
  // such rather than restated as a genre claim of this website.
  const description =
    `${story.title.en} (${story.title.ta}) — a short story by Kalaignar M. Karunanidhi, printed under the ` +
    `form label ${story.formLabel.ta}. The verified Tamil source text with a project-created English translation.`;
  return { title, description, openGraph: { title, description }, twitter: { title: story.title.en, description } };
}

export default function StoryPage({ params }: { params: { slug: string } }) {
  if (!(STORY_SLUGS as readonly string[]).includes(params.slug)) notFound();
  const story = loadStory(params.slug);
  if (!story) notFound();
  return <StoryReader story={story} />;
}
