import Link from "next/link";
import type { TirumbippaarIndex, TirumbippaarProvenance } from "@/data/tirumbippaar";

/**
 * Reader-facing provenance for திரும்பிப்பார்! — the evidence interface.
 *
 * Everything the reading pages deliberately withhold lives here: the controlling scan and its hash,
 * the PDF and printed page ranges, the archive's recorded verification states, the integrity
 * aggregates, the front-matter crop, and — carefully — the song attribution and the rights posture.
 *
 * TWO THINGS THIS PAGE MUST NOT FLATTEN.
 *
 * First, the credit. The cover names Kalaignar for கதை - வசனம் — story and dialogue — and that IS
 * evidence for that role. It is not evidence about the songs. Not one of the eight song occurrences
 * is attributed to him, and letting the cover credit imply otherwise would hand him five other
 * people's unresolved work.
 *
 * Second, the rights. The booklet prints `உரிமையுடையது.` in 1953. That is a historical statement
 * recorded as printed evidence, and it is not a present-day determination. The Digital Library
 * asserts no blanket rights block for this composite cinema publication, and this page says so
 * explicitly rather than leaving the notice to be read as current.
 *
 * The counts here are read FROM THE GENERATED DATA rather than written into the markup, because
 * hardcoding them is exactly how a provenance page goes quietly stale after the archive corrects
 * something.
 *
 * Everything here must print: it is the evidence for the text. Nothing sits in a `header` or
 * `footer`, which the global print stylesheet deletes.
 */
export default function TirumbippaarSource({
  index,
  prov,
}: {
  index: TirumbippaarIndex;
  prov: TirumbippaarProvenance;
}) {
  const songVerified = index.songs.filter((s) => s.authorshipStatus === "verified").length;
  const songUnresolved = index.songs.filter((s) => s.authorshipStatus === "unresolved").length;

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label="வழிசெலுத்தல்" className="mb-8 text-sm" data-print="hide">
        <Link href="/cinema/tirumbippaar" className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">
          திரும்பிப்பார்!
        </Link>
        <span className="mx-2 text-ink/30 dark:text-night-text/30">/</span>
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light">
          <span lang="ta">மின்னூலகம்</span>
        </Link>
      </nav>

      <h1 className="font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">
        மூலமும் சான்றும்
      </h1>
      <p className="mt-1.5 font-display text-base text-ink/55 dark:text-night-text/55">
        {index.titleEn} — source &amp; provenance
      </p>

      <Section label="ஆளும் மூலம்">
        <Prose>
          அச்சிடப்பட்ட நூலின் ஸ்கேன் செய்யப்பட்ட நகலே இப்பதிப்பின் ஆளும் மூலம். அந்த ஸ்கேன் இந்த
          இணையதளத்தின் செயலாக்கக் களஞ்சியத்திலும் மூல உரைக் களஞ்சியத்திலும் சேர்க்கப்படவில்லை;
          கீழ்க்காணும் SHA-256 கைரேகை அதனை அடையாளப்படுத்துகிறது.
        </Prose>
        <Facts
          rows={[
            ["அடையாளம்", prov.source.identifier],
            ["கோப்பு", prov.source.filename],
            ["ஸ்கேன் SHA-256", prov.source.scanSha256],
            ["PDF பக்கங்கள்", String(prov.source.pdfPages)],
            ["மூல PDF வரம்பு", prov.source.canonicalPdfPages],
            ["அச்சுப் பக்க வரம்பு", prov.source.canonicalPrintedPages],
            ["பக்கக் கணக்கு", prov.source.printedPageFormula],
            ["ஸ்கேன் வகை", prov.source.scanType],
            ["மூலக் களஞ்சியம்", prov.sourceRepo],
            ["நிலைநிறுத்தப்பட்ட commit", prov.sourceCommit],
          ]}
        />
        <Prose className="mt-3">{prov.source.controllingSourceNote}</Prose>
      </Section>

      <Section label="அச்சில் உள்ள சான்றுகள்">
        <Facts
          rows={[
            ["பதிப்பு", prov.source.editionAsPrinted],
            ["ஆண்டு", String(prov.source.publicationYearAsPrinted)],
            [prov.creditsAsPrinted.coverRoleTa, prov.creditsAsPrinted.coverNameTa],
            ["விலை", prov.historicalNotices.priceAsPrinted],
            ["அச்சிட்ட உரிமை அறிவிப்பு", prov.historicalNotices.rightsNoticeAsPrinted],
          ]}
        />
        <Prose className="mt-3">{prov.creditsAsPrinted.note}</Prose>
        {/* The distinction that matters: a 1953 line of print is not a present-day determination. */}
        <Prose className="mt-3">{prov.historicalNotices.note}</Prose>
      </Section>

      <Section label="முன்னட்டைப் பகுதி — வெட்டப்பட்ட வரி">
        <Facts
          rows={[
            ["PDF பக்கம்", String(prov.frontMatterCrop.pdfPage)],
            ["தெரியும் பகுதி", prov.frontMatterCrop.visiblePartialReading],
            ["நிலை", prov.frontMatterCrop.status],
          ]}
        />
        <Prose className="mt-3">{prov.frontMatterCrop.note}</Prose>
      </Section>

      <Section label="காட்சி அமைப்பு">
        <Facts
          rows={[
            ["கண்ட காட்சித் தலைப்புகள்", String(prov.structure.sceneHeadingsObserved)],
            ["வரம்பு", prov.structure.canonicalRange],
            ["அச்சிடப்படாத தலைப்புகள்", String(prov.structure.headingsNotObserved.length)],
          ]}
        />
        <Prose className="mt-3">{prov.structure.numberingNote}</Prose>
        <h3 className="mt-6 font-tamil text-base font-semibold text-ink dark:text-night-text" lang="ta">
          அச்சிடப்பட்ட தலைப்பு வேறுபாடுகள்
        </h3>
        <ul className="mt-2 space-y-1.5 font-tamil text-sm text-ink/70 dark:text-night-text/70" lang="ta">
          {prov.structure.headingAnomalies.map((a) => (
            <li key={a.canonicalScene} className="break-words">
              <span className="font-semibold text-ink dark:text-night-text">காட்சி {a.canonicalScene}</span>
              <span className="mx-2 text-ink/30 dark:text-night-text/30">·</span>
              <code className="font-mono text-[0.95em]">{a.printed}</code>
              <span className="mx-2 text-ink/30 dark:text-night-text/30">·</span>
              {a.note}
            </li>
          ))}
        </ul>
        <Prose className="mt-3">{prov.structure.anomalyNote}</Prose>
      </Section>

      <Section label="தமிழ் அடுக்கு">
        <Facts
          rows={[
            ["காட்சி வழிநூல்கள்", String(prov.tamil.sceneDerivatives)],
            ["மூலப் பக்கங்கள்", String(prov.tamil.canonicalPages)],
            ["வாசிப்பு உரையாடல் தொகுதிகள்", String(prov.tamil.tamilDialogueBlocks)],
            ["மாறாத உரையாடல் பதிவுகள்", String(prov.tamil.dialogueRecords)],
            ["கட்டமைப்புப் பிரிப்பான்கள்", String(prov.tamil.separatorBlocks)],
          ]}
        />
        {/* Two different granularities, stated as such rather than presented as a mismatch. */}
        <Prose className="mt-3">{prov.tamil.granularityNote}</Prose>
        <Prose className="mt-3">{prov.tamil.zeroDialogueNote}</Prose>
        <Prose className="mt-3">{prov.tamil.verificationNote}</Prose>
      </Section>

      <Section label="ஆங்கில அடுக்கு">
        <Facts
          rows={[
            ["வகை", prov.english.kind],
            ["மொழிபெயர்ப்பு அலகுகள்", String(prov.english.translationUnits)],
            ["பக்கம் கடக்கும் அலகுகள்", String(prov.english.crossPageUnits)],
            ["சரிபார்க்கப்பட்ட காட்சிகள்", String(prov.english.scenesVerified)],
            ["வாசிப்புப் பதிப்பு QA", prov.english.readerEditionQa],
          ]}
        />
        <h3 className="mt-6 font-tamil text-base font-semibold text-ink dark:text-night-text" lang="ta">
          அலகு வகைகள்
        </h3>
        <Facts rows={Object.entries(prov.english.unitKindCounts).map(([k, v]) => [k, String(v)])} />
        <Prose className="mt-3">{prov.english.kindBasis}</Prose>
        <Prose className="mt-3">{prov.english.noFullSongUnitsNote}</Prose>
        {/* Automated publication state, recorded by the archive. Not a human review claim. */}
        <Prose className="mt-3">{prov.english.qaNote}</Prose>
      </Section>

      <Section label="பாத்திரங்கள்">
        <Facts
          rows={[
            ["பாத்திர அடையாளங்கள்", String(prov.characters.entities)],
            ["அச்சிட்ட பேச்சாளர் பெயர்கள்", String(prov.characters.exactSourceLabels)],
          ]}
        />
        <Prose className="mt-3">{prov.characters.note}</Prose>
      </Section>

      <Section label="பாடல் / நிகழ்த்துகை சான்று">
        <Facts
          rows={[
            ["நிகழ்வுகள்", String(index.songs.length)],
            ["சான்றுடன் உறுதி", String(songVerified)],
            ["தீர்க்கப்படாதவை", String(songUnresolved)],
            ["கலைஞருக்குச் சாற்றப்பட்டவை", String(prov.songs.kalaignarAttributedOccurrences)],
          ]}
        />
        <Prose className="mt-3">{prov.songs.note}</Prose>
        <ul className="mt-4 space-y-2 text-sm text-ink/70 dark:text-night-text/70">
          {index.songs.map((s) => (
            <li key={s.id} className="break-words border-l-2 border-ink/10 pl-3 dark:border-white/10">
              <span className="font-tamil" lang="ta">
                {s.sourceTextTa ?? "—"}
              </span>
              <span className="mx-2 text-ink/30 dark:text-night-text/30">·</span>
              காட்சி {s.canonicalScene}
              <span className="mx-2 text-ink/30 dark:text-night-text/30">·</span>
              {s.authorshipStatus === "verified" ? (
                <>
                  <span className="font-tamil" lang="ta">{s.lyricistTa}</span>
                  <span className="mx-2 text-ink/30 dark:text-night-text/30">·</span>
                  <span className="text-ink/50 dark:text-night-text/50">{s.evidenceBasis}</span>
                </>
              ) : (
                <span className="text-ink/50 dark:text-night-text/50">தீர்க்கப்படவில்லை</span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section label="ஒருமைப்பாட்டுச் சான்று">
        <Facts
          rows={[
            ["ஸ்கேன் SHA-256", prov.integrity.sourceScanSha256],
            ["மூல உள்ளீட்டுக் கோப்புகள்", String(prov.integrity.sourceInputFiles)],
            ["மூல உள்ளீட்டுத் திரட்டு", prov.integrity.sourceInputAggregateSha256],
            ["மொழிபெயர்ப்பு உள்ளீட்டுக் கோப்புகள்", String(prov.integrity.translationInputFiles)],
            ["மொழிபெயர்ப்புத் திரட்டு", prov.integrity.translationInputAggregateSha256],
            ["EPUB SHA-256", prov.publication.epubSha256],
            ["வாசிப்புப் பதிப்பு SHA-256", prov.publication.readerSha256],
            ["தொகுப்பு நிலை", prov.publication.packageStatus],
          ]}
        />
        <Prose className="mt-3">{prov.integrity.aggregateNote}</Prose>
        <Prose className="mt-3">{prov.publication.note}</Prose>
      </Section>

      {/* `prov.notes` is deliberately NOT rendered. It is a phase-local field: one entry records that
          D2.1 produced generated data with no public route yet — true when it was written, false the
          moment these pages shipped — and the other restates the rights position that
          `historicalNotices.note` already states above, more precisely. A provenance page that
          replays implementation-phase status text goes stale silently, so the durable facts are
          surfaced from the specific fields that carry them and nothing is echoed from this array.
          The generated data itself is frozen and untouched. */}
    </main>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 border-t border-ink/10 pt-7 dark:border-white/10">
      <h2 className="font-tamil text-lg font-semibold text-ink dark:text-night-text" lang="ta">
        {label}
      </h2>
      {children}
    </section>
  );
}

function Prose({ children, className = "mt-2" }: { children: React.ReactNode; className?: string }) {
  return <p className={`${className} text-sm leading-[1.85] text-ink/65 dark:text-night-text/65`}>{children}</p>;
}

/**
 * A definition list rather than a table: it stacks cleanly at 375px without a horizontal scroller.
 * Hashes wrap with `break-all` — they are never truncated, because a shortened hash cannot be
 * checked against anything.
 */
function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mt-3 space-y-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="sm:flex sm:gap-3">
          <dt className="font-tamil text-ink/45 dark:text-night-text/45 sm:w-56 sm:shrink-0" lang="ta">
            {k}
          </dt>
          <dd className="break-all font-mono text-[0.92em] text-ink/80 dark:text-night-text/80">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
