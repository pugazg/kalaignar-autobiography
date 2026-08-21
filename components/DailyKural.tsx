import Link from "next/link";
import { getDailyKural, istDateString } from "@/lib/daily-kural";
import { loadKural } from "@/data/thirukkural";

/**
 * இன்றைய குறள் — one Kural a day, on the Reading Room's front door.
 *
 * A SERVER COMPONENT, deliberately. The date is resolved on the server, so every reader is served
 * the same markup and there is no hydration flash, no client clock to disagree with, and the couplet
 * is in the HTML for crawlers and for Reader mode. See app/read/page.tsx for how the page is kept
 * from freezing this value at build time.
 *
 * THE SAME THREE VOICES, IN THE SAME ORDER, as the full Kural page: Thiruvalluvar's couplet is
 * introduced and set apart, Kalaignar's உரை follows in its own labelled region, and the reader's
 * own reading is left to them — nothing here paraphrases, summarises or "explains" either voice.
 * The panel is an entry point into that relationship, not a digest of it.
 *
 * PRINT. Nothing here carries `data-print="hide"`: the Kural, the உரை, the attribution and the
 * provenance line all belong on paper. The panel is a `section`, never a `header` or `footer`,
 * because the print stylesheet deletes those.
 */
export default function DailyKural() {
  const day = istDateString();
  const number = getDailyKural(day);
  const found = loadKural(number);
  // The archive is the authority: if a number somehow does not resolve, show nothing rather than
  // a placeholder that would look like a Kural.
  if (!found) return null;
  const { entry, adhikaram } = found;

  return (
    <section
      aria-labelledby="daily-kural-heading"
      className="mb-12 border-b border-ink/10 pb-10 dark:border-white/10"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="daily-kural-heading"
          className="font-tamil text-lg font-semibold text-ink dark:text-night-text"
          lang="ta"
        >
          இன்றைய குறள்
        </h2>
        {/* The date this selection belongs to, so a printed page says which day it was. */}
        <time
          dateTime={day}
          className="font-body text-xs tracking-wide text-ink/40 dark:text-night-text/40"
        >
          {day}
        </time>
      </div>

      <div className="mt-5 font-tamil text-xs text-ink/50 dark:text-night-text/50" lang="ta">
        {entry.paal.tamil} · {entry.iyal.tamil} · {adhikaram.number}. {adhikaram.tamil}
      </div>

      {/* VOICE 1 — திருவள்ளுவர். A label rather than a heading, so the panel keeps exactly two
          headings (இன்றைய குறள், கலைஞர் உரை) and adds no level to the page outline. */}
      <div className="mt-4 font-tamil text-sm font-semibold tracking-wide text-ink/55 dark:text-night-text/55" lang="ta">
        திருவள்ளுவர் இயற்றிய குறள் — குறள் {entry.number}
      </div>
      <blockquote
        lang="ta"
        className="mt-3 border-l-2 border-marina/40 pl-5 font-tamil text-xl leading-[1.95] text-ink dark:border-marina-light/40 dark:text-night-text sm:text-[1.6rem] sm:leading-[2.05]"
      >
        {/* Both printed lines, never joined; wrapped rows hang-indent so a viewport break can
            never be read as one of Thiruvalluvar's line breaks. Same rule as KuralReader. */}
        {entry.tamilText.map((line, i) => (
          <span key={i} className="block" style={{ paddingLeft: "1.15em", textIndent: "-1.15em" }}>
            {line}
          </span>
        ))}
      </blockquote>

      {/* VOICE 2 — கலைஞர். Its own labelled region, visibly a different voice.
          h3, not h2: the உரை is part of this panel, not a section of the Reading Room. As an h2 it
          would sit in the page outline as a peer of the shelves — as though the library had a
          "கலைஞர் உரை" shelf — and a screen-reader user moving by heading would leave the panel
          without being told they had. The visual size is unchanged; only the level moves. */}
      <section aria-label="கலைஞர் உரை" className="mt-8 border-t border-ink/8 pt-6 dark:border-white/8">
        <h3 className="font-tamil text-sm font-semibold tracking-wide text-marina dark:text-marina-light" lang="ta">
          கலைஞர் உரை
        </h3>
        <p lang="ta" className="mt-3 font-tamil text-base leading-[1.95] text-ink/85 dark:text-night-text/85">
          {entry.kalaignarUrai}
        </p>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 font-body text-xs text-ink/45 dark:text-night-text/45">
        <span>
          <span className="font-tamil" lang="ta">மூலம்</span>
          {entry.source.printedPage !== null && <> · அச்சுப் பக்கம் {entry.source.printedPage}</>}
          {" · "}ஸ்கேன் {entry.source.scan}
        </span>
        <Link
          href={`/thirukkural/kural/${entry.number}`}
          className="focus-ring rounded-sm font-tamil text-marina underline decoration-marina/30 underline-offset-2 hover:decoration-marina dark:text-marina-light dark:decoration-marina-light/30"
          lang="ta"
        >
          இந்தக் குறளை முழுமையாகப் படிக்க →
        </Link>
      </div>
    </section>
  );
}
