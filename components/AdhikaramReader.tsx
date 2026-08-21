import Link from "next/link";
import type { ThirukkuralAdhikaram } from "@/data/thirukkural";

/**
 * One அதிகாரம் — its ten குறள்கள், each opening to its own page.
 *
 * Both printed lines of every couplet are shown here, on separate lines, exactly as on the Kural
 * page. Showing only a first line would make the listing a different text from the edition.
 * Wrapped rows get the same hanging indent as the Kural page, so a viewport break can never be
 * mistaken for one of Thiruvalluvar's line breaks.
 * The உரை is deliberately NOT repeated here; this is a way in, not a second reading surface.
 */
export default function AdhikaramReader({
  adhikaram, prev, next,
}: {
  adhikaram: ThirukkuralAdhikaram;
  prev: { number: number; tamil: string } | null;
  next: { number: number; tamil: string } | null;
}) {
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label="வழிசெலுத்தல்" className="mb-8 text-sm" data-print="hide">
        <Link href="/thirukkural" className="text-marina hover:underline dark:text-marina-light">
          திருக்குறள்
        </Link>
      </nav>

      <div className="font-tamil text-sm leading-relaxed text-ink/55 dark:text-night-text/55" lang="ta">
        {adhikaram.paal.tamil} · {adhikaram.iyal.tamil}
      </div>

      <h1 className="mt-3 font-tamil text-3xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">
        {adhikaram.number}. {adhikaram.tamil}
      </h1>
      <div className="mt-2 font-body text-sm text-ink/50 dark:text-night-text/50">
        குறள் {adhikaram.from}–{adhikaram.to}
      </div>

      <ol className="mt-10 space-y-8">
        {adhikaram.kurals.map((k) => (
          <li key={k.number} className="border-t border-ink/8 pt-6 dark:border-white/8">
            <Link
              href={`/thirukkural/kural/${k.number}`}
              className="group block focus-ring rounded-sm"
            >
              <div className="font-body text-xs uppercase tracking-[0.18em] text-ink/40 dark:text-night-text/40">
                குறள் {k.number}
              </div>
              <div
                lang="ta"
                className="mt-3 font-tamil text-lg leading-[1.9] sm:text-xl sm:leading-[1.95] text-ink group-hover:text-marina dark:text-night-text dark:group-hover:text-marina-light"
              >
                {/* Two printed lines, kept apart here as everywhere else. */}
                {k.tamilText.map((line, i) => (
                  <span
                    key={i}
                    className="block"
                    style={{ paddingLeft: "1.15em", textIndent: "-1.15em" }}
                  >
                    {line}
                  </span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <nav aria-label="அதிகார வழிசெலுத்தல்" className="mt-14 flex items-start justify-between gap-6 text-sm" data-print="hide">
        {prev ? (
          <Link href={`/thirukkural/adhikaram/${prev.number}`} className="max-w-[45%] text-marina hover:underline dark:text-marina-light">
            <span className="block font-body text-xs text-ink/40 dark:text-night-text/40">முந்தைய அதிகாரம்</span>
            <span className="font-tamil" lang="ta">{prev.number}. {prev.tamil}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/thirukkural/adhikaram/${next.number}`} className="max-w-[45%] text-right text-marina hover:underline dark:text-marina-light">
            <span className="block font-body text-xs text-ink/40 dark:text-night-text/40">அடுத்த அதிகாரம்</span>
            <span className="font-tamil" lang="ta">{next.number}. {next.tamil}</span>
          </Link>
        ) : <span />}
      </nav>
    </main>
  );
}
