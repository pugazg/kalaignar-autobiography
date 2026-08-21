import Link from "next/link";
import type { ThirukkuralIndex, ThirukkuralProvenance } from "@/data/thirukkural";

/**
 * Reader-facing provenance for the edition.
 *
 * It answers the questions a reader can reasonably ask — which physical book this is, how it was
 * verified, and why the front-matter quotations are not part of the reading text. It deliberately
 * does not report validator internals such as assertion counts.
 *
 * Everything on this page must print: it is the evidence for the text, and a printed page that
 * dropped it would present the edition as unsourced. Nothing here sits in a `header` or `footer`.
 */
export default function ThirukkuralSource({
  index, prov,
}: { index: ThirukkuralIndex; prov: ThirukkuralProvenance }) {
  const cs = prov.controllingSource;
  const rows: [string, string][] = [
    ["கோப்பு", cs.filename],
    ["SHA-256", cs.sha256],
    // Grouped the way the archival record states it, so a reader can compare the two figures
    // character by character. Indian digit grouping would re-group the same number and make that
    // comparison harder, which is the only thing this row is for.
    ["அளவு", `${cs.byteSize.toLocaleString("en-US")} bytes`],
    ["பக்கங்கள்", String(cs.pageCount)],
    ["அடையாளச் சரிபார்ப்பு", prov.identityVerification.level],
  ];
  if (cs.archiveIdentifier) rows.push(["தொகுப்பு அடையாளம்", cs.archiveIdentifier]);
  if (cs.repository) rows.push(["காப்பகம்", cs.repository]);

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label="வழிசெலுத்தல்" className="mb-8 text-sm" data-print="hide">
        <Link href="/thirukkural" className="text-marina hover:underline dark:text-marina-light">
          திருக்குறள்
        </Link>
      </nav>

      <h1 className="font-tamil text-3xl font-semibold text-ink dark:text-night-text" lang="ta">
        மூலமும் சான்றும்
      </h1>
      <p className="mt-3 font-tamil text-base leading-relaxed text-ink/70 dark:text-night-text/70" lang="ta">
        {index.title.ta} — {index.subtitle.ta}
      </p>

      <section aria-label="ஆளும் மூலம்" className="mt-10">
        <h2 className="font-tamil text-lg font-semibold text-ink dark:text-night-text" lang="ta">
          ஆளும் மூலம்
        </h2>
        <p className="mt-2 font-tamil text-sm leading-relaxed text-ink/65 dark:text-night-text/65" lang="ta">
          இந்தப் பதிப்பின் ஒரே ஆளும் மூலம் கீழ்க்காணும் ஒற்றைக் கோப்பு மட்டுமே.
        </p>
        <dl className="mt-5 space-y-3">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[9rem_1fr] gap-3 border-b border-ink/8 pb-3 dark:border-white/8">
              <dt className="font-tamil text-sm text-ink/50 dark:text-night-text/50" lang="ta">{k}</dt>
              <dd className="break-all font-body text-sm text-ink/85 dark:text-night-text/85">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="செயலாக்கப் பிரிவுக் கோப்புகள்" className="mt-12">
        <h2 className="font-tamil text-lg font-semibold text-ink dark:text-night-text" lang="ta">
          செயலாக்கப் பிரிவுக் கோப்புகள்
        </h2>
        <p className="mt-2 font-tamil text-sm leading-relaxed text-ink/65 dark:text-night-text/65" lang="ta">
          நகலெடுப்பின் பொருட்டு ஆளும் மூலம் {prov.transcriptionWitnesses.declaredDerivedFiles} பகுதிக்
          கோப்புகளாகப் பிரிக்கப்பட்டது. ஒவ்வொரு குறளும் தான் நகலெடுக்கப்பட்ட பகுதிக் கோப்பைப்
          பதிவு செய்கிறது. அவை நகலெடுப்புச் சான்றுகள் மட்டுமே; அவை ஆளும் மூலம் அல்ல.
        </p>
      </section>

      <section aria-label="பக்கத் தொடர்பு" className="mt-12">
        <h2 className="font-tamil text-lg font-semibold text-ink dark:text-night-text" lang="ta">
          பக்கத் தொடர்பு
        </h2>
        <p className="mt-2 font-tamil text-sm leading-relaxed text-ink/65 dark:text-night-text/65" lang="ta">
          மூலக் கோப்பின் பக்க எண்ணும் காப்பக ஸ்கேன் எண்ணும் ஒன்றுக்கொன்று நேரடியாகப் பொருந்துகின்றன.
          மொத்தம் {prov.derived.totalPageRecords} பக்கப் பதிவுகளில் {prov.derived.commentaryPages} உரைப்
          பக்கங்கள்.
        </p>
      </section>

      <section aria-label="வாசிப்புப் பகுதியிலிருந்து விலக்கப்பட்டவை" className="mt-12">
        <h2 className="font-tamil text-lg font-semibold text-ink dark:text-night-text" lang="ta">
          வாசிப்புப் பகுதியிலிருந்து விலக்கப்பட்டவை
        </h2>
        <p className="mt-2 font-tamil text-sm leading-relaxed text-ink/65 dark:text-night-text/65" lang="ta">
          நூலின் முன்னுரைப் பகுதியில் உள்ள மதிப்புரைக் கட்டுரைகள்{" "}
          {prov.excludedFromReadingBody.quotationsExcluded} குறள்களை மேற்கோள் காட்டுகின்றன. அவற்றின்
          சந்தி வடிவம் கலைஞர் பதிப்பில் அச்சிடப்பட்ட வடிவத்திலிருந்து வேறுபடுவதுண்டு. எனவே குறள்
          பாடமும் உரையும் உரைப் பக்கங்களிலிருந்து மட்டுமே எடுக்கப்படுகின்றன; மேற்கோள்கள் வாசிப்புப்
          பகுதிக்குள் நுழைவதில்லை.
        </p>
      </section>

      <section aria-label="பாட நம்பகத்தன்மை" className="mt-12">
        <h2 className="font-tamil text-lg font-semibold text-ink dark:text-night-text" lang="ta">
          பாட நம்பகத்தன்மை
        </h2>
        <p className="mt-2 font-tamil text-sm leading-relaxed text-ink/65 dark:text-night-text/65" lang="ta">
          குறளின் இரு அடிகளும் தனித்தனியே காக்கப்படுகின்றன; அவை இணைக்கப்படுவதில்லை. எழுத்துப்
          பிழை, சந்தி, நிறுத்தக் குறி, இடைவெளி ஆகியன அச்சில் உள்ளவாறே தரப்படுகின்றன.
        </p>
      </section>

      <div className="mt-12 border-t border-ink/10 pt-5 font-body text-xs leading-relaxed text-ink/45 dark:border-white/10 dark:text-night-text/45">
        {prov.identitySourceNote}
        <br />
        <span className="mt-1 inline-block">
          {prov.sourceRepo} · {prov.sourcePath} · {prov.sourceCommit.slice(0, 12)}
        </span>
      </div>
    </main>
  );
}
