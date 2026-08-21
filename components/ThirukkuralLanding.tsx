import Link from "next/link";
import { THIRUKKURAL_ATTRIBUTION as ATTR, type ThirukkuralIndex, type ThirukkuralProvenance } from "@/data/thirukkural";

/**
 * The way into the edition: who wrote it, who commented on it, how large it is, and the 133
 * அதிகாரங்கள் grouped under their பால் and இயல்.
 *
 * Every count comes from the generated index. Nothing about rights or licensing is claimed here:
 * the archive records the edition's own printed notice and nothing further, so nothing further is
 * shown. The title block is a `div`, not a `header` — the print stylesheet deletes headers.
 */
export default function ThirukkuralLanding({
  index, prov,
}: { index: ThirukkuralIndex; prov: ThirukkuralProvenance }) {
  const byPaal = index.paal.map((p) => ({
    ...p,
    iyal: index.iyal
      .filter((i) => i.paal === p.index)
      .map((i) => ({ ...i, adhikarams: index.adhikarams.filter((a) => a.paal.index === p.index && a.iyal.index === i.index) })),
  }));

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-10 sm:px-6">
      <div>
        <h1 className="font-tamil text-4xl font-semibold leading-tight text-ink dark:text-night-text" lang="ta">
          {index.title.ta}
        </h1>
        <p className="mt-2 font-tamil text-xl text-marina dark:text-marina-light" lang="ta">
          {index.subtitle.ta}
        </p>
        {/* The editorial introduction. One factual sentence naming both voices and what this
            reading room contains — no interpretation, no claim the sources do not support. */}
        <p className="mt-7 font-tamil text-base leading-[1.9] text-ink/75 dark:text-night-text/75" lang="ta">
          {ATTR.summaryTa}
        </p>
      </div>

      {/* Work identity, stated as a list so the relationship between the two names cannot be
          misread: Thiruvalluvar composed the work, Kalaignar wrote the commentary on it. */}
      <dl className="mt-8 space-y-2.5 border-l-2 border-ink/10 pl-5 dark:border-white/10">
        {[
          ["மூல நூல்", ATTR.originalWork.ta],
          ["மூல ஆசிரியர்", ATTR.originalCreator.ta],
          ["உரையாசிரியர்", ATTR.commentator.ta],
          ["பங்களிப்பு", ATTR.contribution.ta],
          ["பதிப்பு", prov.edition.statement],
          ["பதிப்பகம்", prov.edition.publisher],
        ]
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k as string} className="grid grid-cols-[7.5rem_1fr] gap-3">
              {/* 60% rather than the 45% used for incidental metadata elsewhere: at 14px, 45%
                  falls to 3.9:1 on the dark surface, and this block exists to be read. */}
              <dt className="font-tamil text-sm text-ink/60 dark:text-night-text/60" lang="ta">{k}</dt>
              <dd className="font-tamil text-sm text-ink/85 dark:text-night-text/85" lang="ta">{v}</dd>
            </div>
          ))}
      </dl>

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-ink/10 py-6 dark:border-white/10 sm:grid-cols-4">
        {[
          { n: index.counts.kurals, label: "குறள்கள்" },
          { n: index.counts.adhikarams, label: "அதிகாரங்கள்" },
          { n: index.counts.iyal, label: "இயல்கள்" },
          { n: index.counts.paal, label: "பால்" },
        ].map((m) => (
          <div key={m.label}>
            <dt className="font-tamil text-xs text-ink/45 dark:text-night-text/45" lang="ta">{m.label}</dt>
            <dd className="mt-1 font-body text-2xl font-medium text-ink dark:text-night-text">{m.n}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 font-body text-sm">
        <Link href="/thirukkural/kural/1" className="text-marina hover:underline dark:text-marina-light">
          <span lang="ta" className="font-tamil">முதல் குறளிலிருந்து படிக்க</span>
        </Link>
        <Link href="/thirukkural/source" className="text-marina hover:underline dark:text-marina-light">
          <span lang="ta" className="font-tamil">மூலமும் சான்றும்</span>
        </Link>
      </div>

      {byPaal.map((p) => (
        <section key={p.index} className="mt-14" aria-label={p.tamil}>
          <h2 className="font-tamil text-2xl font-semibold text-ink dark:text-night-text" lang="ta">
            {p.tamil}
          </h2>
          {p.iyal.map((i) => (
            <div key={i.index} className="mt-7">
              <h3 className="font-tamil text-sm font-medium tracking-wide text-marina dark:text-marina-light" lang="ta">
                {i.tamil}
              </h3>
              <ul className="mt-3 space-y-1.5">
                {i.adhikarams.map((a) => (
                  <li key={a.number}>
                    <Link
                      href={`/thirukkural/adhikaram/${a.number}`}
                      className="focus-ring flex items-baseline gap-3 rounded-sm py-0.5 text-ink/80 hover:text-marina dark:text-night-text/80 dark:hover:text-marina-light"
                    >
                      <span className="w-8 shrink-0 text-right font-body text-xs text-ink/35 dark:text-night-text/35">
                        {a.number}
                      </span>
                      <span className="font-tamil text-base" lang="ta">{a.tamil}</span>
                      <span className="ml-auto shrink-0 font-body text-xs text-ink/30 dark:text-night-text/30">
                        {a.from}–{a.to}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
