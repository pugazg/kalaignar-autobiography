import Link from "next/link";
import type { ParasakthiIndex } from "@/data/parasakthi";

/**
 * பராசக்தி landing — the way into the work.
 *
 * The scene list is driven entirely by the generated registry. It is never built as 1…48 and then
 * filtered: the booklet prints no headings 23 or 34, so those numbers simply are not in the
 * registry, and the list skips them the way the booklet does. No "Scene 23 — missing" placeholder
 * appears, because a placeholder would put a scene on the page that the source never printed. The
 * absences are explained on the source page, which is where evidence belongs.
 *
 * A server component: nothing here needs state, and the Tamil belongs in the initial HTML.
 */
export default function ParasakthiLanding({ index }: { index: ParasakthiIndex }) {
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
        {/* The booklet's own description of itself. */}
        <p className="mt-4 font-tamil text-sm text-ink/65 dark:text-night-text/65" lang="ta">
          {index.sourceTitleTa}
        </p>

        <p className="mt-6 font-tamil text-sm leading-[1.9] text-ink/70 dark:text-night-text/70" lang="ta">
          அச்சிடப்பட்ட நூலில் காணப்படும் {index.sceneCount} காட்சிகள். தமிழ் மூலமும், இத்திட்டத்தால்
          உருவாக்கப்பட்ட ஆங்கில வாசிப்பும்.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3" data-print="hide">
          <Link
            href={`/cinema/parasakthi/${first.slug}`}
            className="focus-ring inline-flex items-center rounded-full bg-marina px-4 py-2 text-sm font-medium text-paper transition hover:bg-marina/90"
          >
            <span className="font-tamil" lang="ta">வாசிக்கத் தொடங்கு</span>
          </Link>
          <Link
            href="/cinema/parasakthi/source"
            className="focus-ring inline-flex items-center rounded-full border border-ink/15 px-4 py-2 text-sm text-ink/70 transition hover:border-marina/50 dark:border-white/15 dark:text-night-text/70"
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
                  href={`/cinema/parasakthi/${s.slug}`}
                  className="focus-ring block rounded-lg border border-ink/10 px-3 py-2 font-tamil text-sm text-ink/80 transition hover:border-marina/50 hover:text-marina dark:border-white/10 dark:text-night-text/80 dark:hover:text-marina-light"
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
