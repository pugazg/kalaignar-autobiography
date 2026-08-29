import Link from "next/link";
import type { TirumbippaarIndex, TirumbippaarProvenance } from "@/data/tirumbippaar";

/**
 * திரும்பிப்பார்! landing — the way into the work.
 *
 * The scene list is driven entirely by the generated registry, never built as 1…93. Tirumbippaar
 * happens to print its headings consecutively, but the registry is still the authority: the two
 * cinema works before it do NOT number consecutively, and a numeric loop here would be correct by
 * luck rather than by construction.
 *
 * The headings are rendered exactly as the booklet prints them, irregular typography included —
 * `காட்சி 5[`, `காட்சி 36` with no closing glyph, `காட்சி 43].`. Those are source facts adjudicated
 * against the controlling scan upstream, and tidying them for a neater grid would quietly undo that
 * work. They are explained on the source page, which is where evidence belongs.
 *
 * A server component: nothing here needs state, and the Tamil belongs in the initial HTML.
 */
export default function TirumbippaarLanding({
  index,
  prov,
}: {
  index: TirumbippaarIndex;
  prov: TirumbippaarProvenance;
}) {
  const first = index.scenes[0];
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

        {/* Only what the booklet itself prints: the edition statement and the cover credit. The
            credit is for story and dialogue — it is not a lyric credit, and nothing here implies
            one. No present-day rights statement appears; the 1953 notice is source evidence and
            lives on the source page. */}
        <dl className="mt-6 space-y-1.5 font-tamil text-sm text-ink/70 dark:text-night-text/70" lang="ta">
          <div className="flex gap-2">
            <dt className="text-ink/45 dark:text-night-text/45">பதிப்பு</dt>
            <dd>{prov.source.editionAsPrinted}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink/45 dark:text-night-text/45">{prov.creditsAsPrinted.coverRoleTa}</dt>
            <dd>{prov.creditsAsPrinted.coverNameTa}</dd>
          </div>
        </dl>

        <p className="mt-6 font-tamil text-sm leading-[1.9] text-ink/70 dark:text-night-text/70" lang="ta">
          அச்சிடப்பட்ட நூலில் காணப்படும் {index.sceneCount} காட்சிகள், மூல தமிழில் — உடன் இத்திட்டத்திற்காக
          உருவாக்கப்பட்ட ஆங்கில வாசிப்பும்.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3" data-print="hide">
          <Link
            href={`/cinema/tirumbippaar/${first.slug}`}
            className="focus-ring inline-flex items-center rounded-full bg-marina px-4 py-2 text-sm font-medium text-paper transition hover:bg-marina/90"
          >
            <span className="font-tamil" lang="ta">வாசிக்கத் தொடங்கு</span>
          </Link>
          <Link
            href="/cinema/tirumbippaar/source"
            className="focus-ring inline-flex items-center rounded-full border border-ink/15 px-4 py-2 text-sm text-ink/70 transition hover:border-marina/40 hover:text-marina dark:border-white/15 dark:text-night-text/70"
          >
            <span className="font-tamil" lang="ta">மூலமும் சான்றும்</span>
          </Link>
        </div>

        <section aria-label="காட்சிகள்" className="mt-12 border-t border-ink/10 pt-8 dark:border-white/10">
          <h2 className="font-tamil text-sm font-semibold tracking-wide text-marina dark:text-marina-light" lang="ta">
            காட்சிகள்
          </h2>
          <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {index.scenes.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/cinema/tirumbippaar/${s.slug}`}
                  className="focus-ring block break-words rounded-lg border border-ink/10 px-3 py-2 font-tamil text-sm text-ink/80 transition hover:border-marina/40 hover:text-marina dark:border-white/10 dark:text-night-text/80"
                  lang="ta"
                >
                  {s.headingTa}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}
