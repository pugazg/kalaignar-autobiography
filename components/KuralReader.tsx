import Link from "next/link";
import { THIRUKKURAL_ATTRIBUTION as ATTR, type ThirukkuralAdhikaram, type ThirukkuralEntry } from "@/data/thirukkural";

/**
 * One குறள் and Kalaignar's உரை on it.
 *
 * TWO VOICES, NAMED BEFORE THEY SPEAK. The page carries Thiruvalluvar's couplet, then Kalaignar's
 * prose commentary on it, and they must never read as one continuous text. Each is introduced by a
 * heading that says whose voice follows — "திருவள்ளுவர் அருளிய குறள்", then "கலைஞர் மு. கருணாநிதி
 * அவர்களின் உரை" — so a reader arriving cold cannot mistake the commentary for the couplet, or
 * suppose Kalaignar wrote the Kural. The two headings are siblings (both h2 under the page's h1),
 * because the two voices are of equal standing here: neither is a subsection of the other.
 * The couplet is set in a `blockquote` at the largest size on the page; the உரை follows in a
 * different weight and colour.
 *
 * WRAPPING. A printed line is longer than a narrow viewport, so it will wrap. Left alone, that
 * second visual row would look exactly like a new line of the couplet, and a reader could no longer
 * tell Thiruvalluvar's lineation from the browser's. Continuation rows therefore get a hanging
 * indent (the same convention PoemReader uses): the line box is pushed right and the first row
 * pulled back by the same amount, so each printed line starts on the margin and every wrapped row
 * sits visibly inset beneath it. The data is untouched — a wrapped line is still ONE printed line.
 *
 * PRINT. Every element here that carries literary content or provenance is a `div`/`section`, never
 * a `header` or `footer`: the global print stylesheet deletes `nav`, `header` and `footer` outright,
 * so a couplet or a source line placed in one would silently vanish from Print → Save as PDF.
 * Only the navigation links are in a `nav`, where their removal from paper is correct.
 */
/** Indent applied to wrapped continuation rows, in `em` so it tracks the type size. */
const HANG_EM = 1.15;

export default function KuralReader({
  entry, adhikaram, prev, next,
}: {
  entry: ThirukkuralEntry;
  adhikaram: ThirukkuralAdhikaram;
  prev: number | null;
  next: number | null;
}) {
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label="வழிசெலுத்தல்" className="mb-8 text-sm" data-print="hide">
        <Link href="/thirukkural" className="text-marina hover:underline dark:text-marina-light">
          திருக்குறள்
        </Link>
        <span className="mx-2 text-ink/30 dark:text-night-text/30">/</span>
        <Link
          href={`/thirukkural/adhikaram/${adhikaram.number}`}
          className="font-tamil text-marina hover:underline dark:text-marina-light"
          lang="ta"
        >
          {adhikaram.number}. {adhikaram.tamil}
        </Link>
      </nav>

      {/* Hierarchy as CONTENT, not chrome: பால் → இயல் → அதிகாரம் → குறள். It prints. */}
      <div className="font-tamil text-sm leading-relaxed text-ink/55 dark:text-night-text/55" lang="ta">
        {entry.paal.tamil} · {entry.iyal.tamil} · {entry.adhikaram.tamil}
      </div>

      <article className="mt-6">
        {/* The page's h1. Kept visually quiet so it does not compete with the couplet, which is the
            largest thing on the page — but it is a real heading, so the document does not open at
            h2 and screen-reader users get a title for the page. */}
        <h1 className="font-body text-xs font-normal uppercase tracking-[0.18em] text-ink/40 dark:text-night-text/40">
          குறள் {entry.number}
          <span className="sr-only">
            {" — "}
            <span lang="ta">{entry.adhikaram.tamil}</span>
          </span>
        </h1>

        {/* VOICE 1 — திருவள்ளுவர். The two printed lines are separate block elements. They are
            never joined, never re-wrapped, and no punctuation or spacing is adjusted. */}
        <h2 className="mt-6 font-tamil text-sm font-semibold tracking-wide text-ink/55 dark:text-night-text/55" lang="ta">
          திருவள்ளுவர் அருளிய குறள்
        </h2>
        <blockquote
          lang="ta"
          className="mt-5 border-l-2 border-marina/40 pl-5 font-tamil text-xl leading-[1.95] text-ink dark:border-marina-light/40 dark:text-night-text sm:text-[1.6rem] sm:leading-[2.05]"
        >
          {entry.tamilText.map((line, i) => (
            <span
              key={i}
              className="block"
              style={{ paddingLeft: `${HANG_EM}em`, textIndent: `-${HANG_EM}em` }}
            >
              {line}
            </span>
          ))}
        </blockquote>

        {/* VOICE 2 — கலைஞர். Its own labelled region, visibly a different voice. */}
        <section aria-label="கலைஞர் மு. கருணாநிதி அவர்களின் உரை" className="mt-10 border-t border-ink/10 pt-8 dark:border-white/10">
          <h2 className="font-tamil text-sm font-semibold tracking-wide text-marina dark:text-marina-light" lang="ta">
            {ATTR.commentator.ta} அவர்களின் {ATTR.contribution.ta}
          </h2>
          <p lang="ta" className="mt-4 font-tamil text-lg leading-[1.95] text-ink/85 dark:text-night-text/85">
            {entry.kalaignarUrai}
          </p>
        </section>

        {/* Provenance. A div, so it survives print — a printed page with no source line would
            present the text as if it came from nowhere. */}
        <div className="mt-10 border-t border-ink/10 pt-5 font-body text-xs leading-relaxed text-ink/45 dark:border-white/10 dark:text-night-text/45">
          <span lang="ta" className="font-tamil">மூலம்</span>
          {" · "}
          {entry.source.printedPage !== null && <>அச்சுப் பக்கம் {entry.source.printedPage} · </>}
          ஸ்கேன் {entry.source.scan}
          {" · "}
          <Link href="/thirukkural/source" className="underline decoration-ink/20 underline-offset-2 hover:text-marina dark:decoration-white/20 dark:hover:text-marina-light">
            மூலமும் சான்றும்
          </Link>
        </div>
      </article>

      <nav aria-label="குறள் வழிசெலுத்தல்" className="mt-12 flex items-center justify-between gap-4 text-sm" data-print="hide">
        {prev ? (
          <Link href={`/thirukkural/kural/${prev}`} className="text-marina hover:underline dark:text-marina-light">
            ← குறள் {prev}
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/thirukkural/kural/${next}`} className="text-marina hover:underline dark:text-marina-light">
            குறள் {next} →
          </Link>
        ) : <span />}
      </nav>
    </main>
  );
}
