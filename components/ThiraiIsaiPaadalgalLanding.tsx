import Link from "next/link";
import type { FilmSongIndex } from "@/data/thirai-isai-paadalgal";
import LangAwareAuthorshipNotice from "@/components/ThiraiIsaiPaadalgalNotice";

/**
 * கலைஞர் திரை இசைப் பாடல்கள் landing — the way into the work.
 *
 * ── THE SHAPE OF THIS PAGE IS THE PRODUCT DECISION ───────────────────────────
 * The three cinema works before this one are single booklets read scene by scene, and each has a
 * source page carrying its evidence. This one is deliberately different. It is not a digital
 * reproduction of the 2024 compilation, and the public experience is FILM → LYRICS: a film name,
 * then its songs, then the words. So there is no compiler, publisher, ISBN, edition, page count,
 * music or singer credit, verification label, evidence tier or provenance apparatus anywhere on
 * this page, and there is no source route to link to. All of that exists — it is just internal.
 *
 * ── ORDER COMES FROM THE REGISTRY, NOT FROM US ───────────────────────────────
 * Films render in the generated registry's order, which is the order they first appear in the
 * source, and each film's songs render from its own `songSlugs`. The films are NOT alphabetised and
 * NOT sorted by year: doing either would impose an arrangement the source does not have. Song order
 * is likewise never rebuilt from numbers.
 *
 * ── NO BYLINE, ANYWHERE ──────────────────────────────────────────────────────
 * No song carries "written by Kalaignar", not even the 48 whose authorship the archive establishes.
 * The reader came for the lyric. The `publicAuthorshipClaim` flag still matters — it is what
 * guarantees no false claim can appear — but a byline is not what it is for.
 *
 * A server component: nothing here needs state, and the Tamil belongs in the initial HTML.
 */
export default function ThiraiIsaiPaadalgalLanding({ index }: { index: FilmSongIndex }) {
  const bySlug = new Map(index.songs.map((s) => [s.slug, s]));
  // Resolved by MEMBERSHIP, not by matching the film's title text: a notice group is defined by the
  // songs it covers, so a film shows a notice when one of its own songs belongs to that group. That
  // is the same contract the individual lyric pages use, and it means a second group would attach
  // itself correctly without any change here — while a film with no notice can never inherit one.
  const noticeForFilm = (songSlugs: string[]) =>
    index.notices.find((n) => songSlugs.some((slug) => n.songSlugs.includes(slug))) ?? null;

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label="வழிசெலுத்தல்" className="mb-8 text-sm" data-print="hide">
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light">
          <span lang="ta">மின்னூலகம்</span>
        </Link>
      </nav>

      <article>
        <p className="font-tamil text-xs uppercase tracking-[0.18em] text-marina dark:text-marina-light" lang="ta">
          திரை எழுத்து
        </p>
        <h1 className="mt-3 font-tamil text-3xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">
          {index.titleTa}
        </h1>
        <p className="mt-1.5 font-display text-lg text-ink/60 dark:text-night-text/60">{index.titleEn}</p>

        <p className="mt-6 font-tamil text-sm leading-[1.9] text-ink/70 dark:text-night-text/70" lang="ta">
          படம் வாரியாகத் தொகுக்கப்பட்ட திரைப் பாடல் வரிகள் — மூல தமிழில், உடன் இத்திட்டத்திற்காக
          உருவாக்கப்பட்ட ஆங்கில வாசிப்பும்.
        </p>

        {/* Films in registry order. Each is an anchor target so a lyric page can send the reader
            back to the film it belongs to rather than to the top of a long list. */}
        {index.films.map((film) => {
          const notice = noticeForFilm(film.songSlugs);
          return (
            <section
              key={film.filmId}
              id={film.slug}
              aria-label={film.titleTa}
              className="mt-12 scroll-mt-8 border-t border-ink/10 pt-8 dark:border-white/10"
            >
              {/* The film title stays in Tamil in both interface languages. The released data
                  carries no English film titles, and inventing or transliterating one here would
                  put a name on the page that no source gives. */}
              <h2 className="font-tamil text-xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">
                {film.titleTa}
              </h2>

              <ul className="mt-4 space-y-1.5">
                {film.songSlugs.map((slug) => {
                  const song = bySlug.get(slug);
                  if (!song) return null;
                  return (
                    <li key={slug}>
                      <Link
                        href={`/cinema/thirai-isai-paadalgal/${slug}`}
                        className="focus-ring block break-words rounded-lg px-3 py-2 font-tamil text-[15px] leading-relaxed text-ink/80 transition hover:bg-marina/[0.06] hover:text-marina dark:text-night-text/80 dark:hover:text-marina-light"
                        lang="ta"
                      >
                        {song.titleTa}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Shown only for the film the archive actually attaches a notice to. */}
              {notice && <LangAwareAuthorshipNotice notice={notice} />}
            </section>
          );
        })}
      </article>
    </main>
  );
}
