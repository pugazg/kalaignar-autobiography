import Link from "next/link";
import type { AmmaiyappanReader } from "@/data/ammaiyappan";

/**
 * அம்மையப்பன் landing — the full printed 1954 screenplay/dialogue booklet.
 *
 * THE NUMBERING RULE THIS PAGE ENFORCES VISUALLY: the 63 screenplay segments are NOT source-numbered.
 * The booklet prints no scene numbers, so the segment list is labelled "களஞ்சியப் பகுதி N" (archive
 * segment N), never "Scene N". This is the full screenplay booklet, distinct from the Kalaignar Film
 * Songs anthology.
 *
 * Server component: Tamil in the initial HTML, no state.
 */
export default function AmmaiyappanLanding({ reader }: { reader: AmmaiyappanReader }) {
  const scenes = reader.screenplayScenes;
  const sceneSlug = (o: number) => `scene-${String(o).padStart(3, "0")}`;
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label="வழிசெலுத்தல்" className="mb-8 text-sm" data-print="hide">
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light"><span lang="ta">மின்னூலகம்</span></Link>
      </nav>

      <article>
        <p className="font-tamil text-xs uppercase tracking-[0.18em] text-marina dark:text-marina-light" lang="ta">திரை எழுத்து</p>
        <h1 className="mt-3 font-tamil text-3xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">{reader.work.titleTa}</h1>
        <p className="mt-1.5 font-display text-lg text-ink/60 dark:text-night-text/60">{reader.work.titleEn}</p>

        <p className="mt-6 font-tamil text-sm leading-[1.9] text-ink/70 dark:text-night-text/70" lang="ta">
          அச்சிடப்பட்ட வசன நூலின் {scenes.length} களஞ்சியப் பகுதிகள் — மூல தமிழில், உடன் இத்திட்டத்திற்காக
          உருவாக்கப்பட்ட ஆங்கில வாசிப்பும். நூல் திரைக்காட்சிகளை எண்ணிடவில்லை; கீழுள்ள பகுதி எண்கள் களஞ்சிய
          வழிசெலுத்தலுக்கானவை மட்டுமே. இது முழு வசன நூல்; “கலைஞர் திரை இசைப் பாடல்கள்” தொகுப்பு அன்று.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3" data-print="hide">
          <Link href={`/cinema/ammaiyappan/${sceneSlug(scenes[0].archivalSceneOrdinal)}`} className="focus-ring inline-flex items-center rounded-full bg-marina px-4 py-2 text-sm font-medium text-paper transition hover:bg-marina/90">
            <span className="font-tamil" lang="ta">வாசிக்கத் தொடங்கு</span>
          </Link>
          <Link href="/cinema/ammaiyappan/source" className="focus-ring inline-flex items-center rounded-full border border-ink/15 px-4 py-2 text-sm text-ink/70 transition hover:border-marina/40 hover:text-marina dark:border-white/15 dark:text-night-text/70">
            <span className="font-tamil" lang="ta">மூலமும் சான்றும்</span>
          </Link>
        </div>

        <section aria-label="திரைக்காட்சிப் பகுதிகள்" className="mt-12 border-t border-ink/10 pt-8 dark:border-white/10">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-tamil text-sm font-semibold tracking-wide text-marina dark:text-marina-light" lang="ta">திரைக்காட்சிப் பகுதிகள்</h2>
            {/* Not source-printed scene numbers — archive navigation over the screenplay. */}
            <span className="font-body text-[0.7rem] uppercase tracking-[0.15em] text-ink/40 dark:text-night-text/40" lang="ta">களஞ்சிய வழிசெலுத்தல்</span>
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {scenes.map((sc) => (
              <li key={sc.sceneId}>
                <Link href={`/cinema/ammaiyappan/${sceneSlug(sc.archivalSceneOrdinal)}`} className="focus-ring block break-words rounded-lg border border-ink/10 px-3 py-2 font-tamil text-sm text-ink/80 transition hover:border-marina/40 hover:text-marina dark:border-white/10 dark:text-night-text/80" lang="ta">
                  களஞ்சியப் பகுதி {sc.archivalSceneOrdinal}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}
