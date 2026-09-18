import Link from "next/link";
import type { Wave7CinemaWork } from "@/data/wave7-cinema";

/**
 * Landing page for a Wave-7 Batch-1 cinema work — the printed screenplay / dialogue booklet.
 *
 * Server component: Tamil in the initial HTML, no state. The scene list is labelled from the source:
 * a scene whose numbering the payload marks as printed shows "காட்சி N"; an unnumbered segment shows
 * "பகுதி N" (archival navigation). No scene number is invented.
 */
export default function Wave7CinemaLanding({ work }: { work: Wave7CinemaWork }) {
  const scenes = work.scenes;
  const label = (s: (typeof scenes)[number]) =>
    s.numberingIsPrinted && s.sourceSceneNumber != null ? `காட்சி ${s.sourceSceneNumber}` : `பகுதி ${s.navOrdinal}`;
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label="வழிசெலுத்தல்" className="mb-8 text-sm" data-print="hide">
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light"><span lang="ta">மின்னூலகம்</span></Link>
      </nav>
      <article>
        <p className="font-tamil text-xs uppercase tracking-[0.18em] text-marina dark:text-marina-light" lang="ta">திரை எழுத்து</p>
        <h1 className="mt-3 font-tamil text-3xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">{work.titleTa}</h1>
        <p className="mt-1.5 font-display text-lg text-ink/60 dark:text-night-text/60">{work.titleEn}</p>

        <p className="mt-6 font-tamil text-sm leading-[1.9] text-ink/70 dark:text-night-text/70" lang="ta">
          அச்சிடப்பட்ட திரைக்கதை / வசன நூலின் {scenes.length} திரைக்காட்சிப் பகுதிகள் — மூல தமிழில், உடன் இத்திட்டத்திற்காக
          உருவாக்கப்பட்ட ஆங்கில வாசிப்பும். மூலம் நிர்ணயிக்கும் காட்சி எண்கள் அப்படியே காட்டப்படுகின்றன; மூலம் எண்ணிடாத
          பகுதிகள் எண்ணிடப்படுவதில்லை.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3" data-print="hide">
          <Link href={`/cinema/${work.slug}/${scenes[0].sectionSlug}`} className="focus-ring inline-flex items-center rounded-full bg-marina px-4 py-2 text-sm font-medium text-paper transition hover:bg-marina/90">
            <span className="font-tamil" lang="ta">வாசிக்கத் தொடங்கு</span>
          </Link>
          <Link href={`/cinema/${work.slug}/source`} className="focus-ring inline-flex items-center rounded-full border border-ink/15 px-4 py-2 text-sm text-ink/70 transition hover:border-marina/40 hover:text-marina dark:border-white/15 dark:text-night-text/70">
            <span className="font-tamil" lang="ta">மூலமும் சான்றும்</span>
          </Link>
        </div>

        <section aria-label="திரைக்காட்சிப் பகுதிகள்" className="mt-12 border-t border-ink/10 pt-8 dark:border-white/10">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-tamil text-sm font-semibold tracking-wide text-marina dark:text-marina-light" lang="ta">திரைக்காட்சிப் பகுதிகள்</h2>
            <span className="font-body text-[0.7rem] uppercase tracking-[0.15em] text-ink/40 dark:text-night-text/40" lang="ta">{scenes.length} பகுதிகள்</span>
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {scenes.map((sc) => (
              <li key={sc.sceneId}>
                <Link href={`/cinema/${work.slug}/${sc.sectionSlug}`} className="focus-ring block break-words rounded-lg border border-ink/10 px-3 py-2 font-tamil text-sm text-ink/80 transition hover:border-marina/40 hover:text-marina dark:border-white/10 dark:text-night-text/80" lang="ta">
                  {label(sc)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}
