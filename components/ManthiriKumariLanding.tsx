import Link from "next/link";
import type { ManthiriReader } from "@/data/manthiri-kumari";

/**
 * மந்திரி குமாரி landing — the way into the work.
 *
 * A film STORY-SONG BOOKLET, not a screenplay. The way in is a continuous story summary plus 15
 * song/performance blocks, in the source's own occurrence order. Facts this page must not blur:
 *   * the performance ordinals 1–15 are ARCHIVE NAVIGATION, not printed source numbers — the booklet
 *     prints no "Performance 1"; the small "Archive navigation" line says so;
 *   * the cover credit `கதை, வசனம் : மு. கருணாநிதி` is story-and-dialogue only — NOT a lyric credit,
 *     and nothing here implies Kalaignar wrote the 15 songs;
 *   * no publication year, edition or rights is invented.
 *
 * A server component: Tamil belongs in the initial HTML and nothing here needs state.
 */
export default function ManthiriKumariLanding({ reader }: { reader: ManthiriReader }) {
  const perfs = reader.performances;
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
          {reader.work.titleTa}
        </h1>
        <p className="mt-1.5 font-display text-lg text-ink/60 dark:text-night-text/60">{reader.work.titleEn}</p>

        {/* Only what the booklet prints: the story-and-dialogue cover credit. Not a lyric credit. */}
        <dl className="mt-6 space-y-1.5 font-tamil text-sm text-ink/70 dark:text-night-text/70" lang="ta">
          <div className="flex gap-2">
            <dt className="text-ink/45 dark:text-night-text/45">அட்டைப் பட்டியல்</dt>
            <dd>{reader.work.storyDialogueCreditAsPrinted}</dd>
          </div>
        </dl>

        <p className="mt-6 font-tamil text-sm leading-[1.9] text-ink/70 dark:text-night-text/70" lang="ta">
          அச்சிடப்பட்ட திரைப்படப் புத்தகத்தின் கதைச்சுருக்கமும், {perfs.length} பாடல்/நடன அரங்கக் காட்சிகளும்
          — மூல தமிழில், உடன் இத்திட்டத்திற்காக உருவாக்கப்பட்ட ஆங்கில வாசிப்பும். இது ஒரு முழு நாடக/வசன நூல் அல்ல.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3" data-print="hide">
          <Link
            href="/cinema/manthiri-kumari/story-summary"
            className="focus-ring inline-flex items-center rounded-full bg-marina px-4 py-2 text-sm font-medium text-paper transition hover:bg-marina/90"
          >
            <span className="font-tamil" lang="ta">கதைச்சுருக்கம் வாசி</span>
          </Link>
          <Link
            href="/cinema/manthiri-kumari/source"
            className="focus-ring inline-flex items-center rounded-full border border-ink/15 px-4 py-2 text-sm text-ink/70 transition hover:border-marina/40 hover:text-marina dark:border-white/15 dark:text-night-text/70"
          >
            <span className="font-tamil" lang="ta">மூலமும் சான்றும்</span>
          </Link>
        </div>

        <section aria-label="கதைச்சுருக்கம்" className="mt-12 border-t border-ink/10 pt-8 dark:border-white/10">
          <h2 className="font-tamil text-sm font-semibold tracking-wide text-marina dark:text-marina-light" lang="ta">
            கதைச்சுருக்கம்
          </h2>
          <ul className="mt-4">
            <li>
              <Link
                href="/cinema/manthiri-kumari/story-summary"
                className="focus-ring block break-words rounded-lg border border-ink/10 px-3 py-2.5 font-tamil text-sm text-ink/80 transition hover:border-marina/40 hover:text-marina dark:border-white/10 dark:text-night-text/80"
                lang="ta"
              >
                {reader.storySummary.titleTa}
              </Link>
            </li>
          </ul>
        </section>

        <section aria-label="பாடல் / நடனக் காட்சிகள்" className="mt-10 border-t border-ink/10 pt-8 dark:border-white/10">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-tamil text-sm font-semibold tracking-wide text-marina dark:text-marina-light" lang="ta">
              பாடல் / நடனக் காட்சிகள்
            </h2>
            {/* The 1–15 order is the archive's navigation, not a printed source number. */}
            <span className="font-body text-[0.7rem] uppercase tracking-[0.15em] text-ink/40 dark:text-night-text/40" lang="ta">
              களஞ்சிய வழிசெலுத்தல்
            </span>
          </div>
          <ol className="mt-5 space-y-2">
            {perfs.map((p) => (
              <li key={p.performanceId}>
                <Link
                  href={`/cinema/manthiri-kumari/performance-${String(p.sourceOrder).padStart(2, "0")}`}
                  className="focus-ring flex items-baseline gap-3 break-words rounded-lg border border-ink/10 px-3 py-2.5 transition hover:border-marina/40 dark:border-white/10"
                  lang="ta"
                >
                  <span className="w-6 shrink-0 text-right font-body text-xs tabular-nums text-ink/40 dark:text-night-text/40" aria-hidden="true">
                    {p.sourceOrder}
                  </span>
                  <span className="font-tamil text-sm text-ink/80 hover:text-marina dark:text-night-text/80">{p.headingTa}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </article>
    </main>
  );
}
