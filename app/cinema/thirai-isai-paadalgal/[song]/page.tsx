import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import ThiraiIsaiPaadalgalReader from "@/components/ThiraiIsaiPaadalgalReader";
import type { FilmSongIndex, FilmSongRecord } from "@/data/thirai-isai-paadalgal";

const DIR = "public/data/cinema/thirai-isai-paadalgal";

function loadIndex(): FilmSongIndex | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, "index.json"), "utf-8"));
  } catch {
    return null;
  }
}
function loadSong(slug: string): FilmSongRecord | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, "songs", `${slug}.json`), "utf-8"));
  } catch {
    return null;
  }
}

// Driven by the generated registry, never by a 1…54 loop. The numbering happens to be consecutive
// today, so a loop would produce the same list — and would be correct by coincidence rather than by
// construction. The registry is the authority, and it is also what guarantees that the editorial-only
// front-matter incipit the archive excluded can never appear here as a 55th page.
export function generateStaticParams() {
  const idx = loadIndex();
  return idx ? idx.songs.map((s) => ({ song: s.slug })) : [];
}

export function generateMetadata({ params }: { params: { song: string } }): Metadata {
  const idx = loadIndex();
  const s = idx?.songs.find((x) => x.slug === params.song);
  if (!idx || !s) return { title: "கலைஞர் திரை இசைப் பாடல்கள் | Kalaignar Digital Library" };
  const film = idx.films.find((f) => f.filmId === s.filmId);
  const filmTa = film?.titleTa ?? "";
  const title = `${s.titleTa} · ${filmTa} — ${idx.titleTa} | Kalaignar Digital Library`;
  // Uniform and neutral for every song. No metadata anywhere says who wrote a given lyric — not for
  // the six unresolved ones, and not for the 48 established ones either. The collection title is
  // quoted exactly as the archive titles it; it is not turned into a per-song byline.
  const description =
    `A lyric from ${filmTa} in ${idx.titleTa} (${idx.titleEn}), in the original Tamil with a ` +
    `project-created English reading.`;
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title: `${s.titleTa} · ${filmTa}`, description },
  };
}

export default function ThiraiIsaiPaadalgalSongPage({ params }: { params: { song: string } }) {
  const idx = loadIndex();
  if (!idx) notFound();
  const summary = idx.songs.find((s) => s.slug === params.song);
  if (!summary) notFound();
  const song = loadSong(params.song);
  if (!song) notFound();

  const film = idx.films.find((f) => f.filmId === summary.filmId);
  if (!film) notFound();

  // Neighbours within THIS film only, from the film's own ordered slug list.
  const order = film.songSlugs;
  const i = order.indexOf(summary.slug);
  const at = (slug: string | undefined) => (slug ? idx.songs.find((s) => s.slug === slug) ?? null : null);
  const prev = i > 0 ? at(order[i - 1]) : null;
  const next = i >= 0 && i < order.length - 1 ? at(order[i + 1]) : null;

  const notice = song.authorship.noticeGroupId
    ? idx.notices.find((n) => n.groupId === song.authorship.noticeGroupId) ?? null
    : null;

  // Fail closed. A song the archive marks as requiring the uncertainty notice must never render
  // without it: doing so would present an unresolved lyric with no indication that its authorship
  // is unresolved, which is exactly the implicit claim this contract exists to prevent. If the
  // notice cannot be resolved the page is not served at all.
  if (song.authorship.authorshipNoticeRequired && !notice) notFound();

  // Hand the client component only the words. The stored line ids are upstream translation-record
  // identifiers — correct and useful for validation, but not reading matter — and anything passed to
  // a client component is serialised into the page, so they are projected out here rather than
  // shipped 1,105 times per corpus into public HTML.
  const view = {
    titleTa: song.titleTa,
    filmTitleTa: song.filmTitleTa,
    sections: song.sections.map((s) => ({
      sourceLabelTa: s.sourceLabelTa,
      labelEn: s.labelEn,
      lines: s.lines.map((l) => ({ tamil: l.tamil, english: l.english })),
    })),
  };

  return (
    <ThiraiIsaiPaadalgalReader
      song={view}
      film={{ slug: film.slug, titleTa: film.titleTa }}
      notice={notice}
      prev={prev}
      next={next}
    />
  );
}
