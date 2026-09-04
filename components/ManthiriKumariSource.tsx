import Link from "next/link";
import type { ManthiriReader } from "@/data/manthiri-kumari";

/** The provenance interface for மந்திரி குமாரி. Everything the reading pages withhold — the scan hash,
 *  page counts, structural census, authorship posture and rights position — lives here. Counts are read
 *  from the generated data, never hardcoded, so this page cannot drift from the frozen contract.
 *
 *  TWO THINGS IT MUST NOT FLATTEN: the cover credit `கதை, வசனம் : மு. கருணாநிதி` is story-and-dialogue
 *  evidence only — not one of the 15 song/performance blocks has an established item-level lyricist, and
 *  the credit is not stretched over them; and no publication year, edition or rights status is asserted,
 *  because the booklet establishes none. */
type Prov = {
  sourceRepo: string; sourceCommit: string; repoTree: string; workTree: string; sourcePath: string;
  pdf: { filename: string; sha256: string; pages: number };
  readingRoomPayloadSha256: string; readerSha256: string; integrationQaStatus: string;
  englishProvenance: { status: string; kind: string; titleEnIsEditorial: boolean };
  crossWitness: { confirmed: number; sourceOnly: number; confirmedBlock: number; confirmedAnthologyRecordId: string; rule: string };
  authorship: { verified: number; unresolved: number; rule: string };
  rights: { publicationYear: null | number; editionStatement: null | string; rightsStatus: null | string; note: string };
};

/** The archive identifier is the leading `TVA_<LETTERS>_<digits>` of the filename. Extract it
 *  deterministically; if the filename shape is unexpected, show the whole filename rather than a wrong
 *  truncation. */
function archiveId(filename: string): string {
  return /^(TVA_[A-Z]+_\d+)/.exec(filename)?.[1] ?? filename;
}

export default function ManthiriKumariSource({ reader, prov }: { reader: ManthiriReader; prov: Prov }) {
  const c = reader.counts;
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label="வழிசெலுத்தல்" className="mb-8 text-sm" data-print="hide">
        <Link href="/cinema/manthiri-kumari" className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">{reader.work.titleTa}</Link>
        <span className="mx-2 text-ink/30 dark:text-night-text/30">/</span>
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light"><span lang="ta">மின்னூலகம்</span></Link>
      </nav>

      <h1 className="font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">மூலமும் சான்றும்</h1>
      <p className="mt-1.5 font-display text-base text-ink/55 dark:text-night-text/55">{reader.work.titleEn} — source &amp; provenance</p>

      <Section label="ஆளும் மூலம்">
        <Prose>அச்சிடப்பட்ட திரைப்படப் புத்தகத்தின் ஸ்கேன் நகலே இப்பதிப்பின் ஆளும் மூலம். மூல PDF இந்த இணையதளத்திலோ மூலக் களஞ்சியத்திலோ சேர்க்கப்படவில்லை; கீழ்க்காணும் SHA-256 கைரேகை அதை அடையாளப்படுத்துகிறது.</Prose>
        <Facts rows={[
          ["அடையாளம்", archiveId(prov.pdf.filename)],
          ["கோப்பு", prov.pdf.filename],
          ["ஸ்கேன் SHA-256", prov.pdf.sha256],
          ["PDF பக்கங்கள்", String(prov.pdf.pages)],
          ["மூலக் களஞ்சியம்", prov.sourceRepo],
          ["நிலைநிறுத்தப்பட்ட commit", prov.sourceCommit],
          ["படைப்பு மரம் (tree)", prov.workTree],
          ["மூலப் பாதை", prov.sourcePath],
        ]} />
      </Section>

      <Section label="அச்சில் உள்ள சான்றுகள்">
        <Facts rows={[["கதை, வசனம்", reader.work.storyDialogueCreditAsPrinted]]} />
        <Prose className="mt-3">அட்டைப் பட்டியலின் இப்பொறுப்பு கதைக்கும் வசனத்திற்கும் மட்டுமே. இது பாடலாசிரியப் பொறுப்பு அன்று. PDF 14-இல் உள்ள விளம்பரம் மூல உரை வரம்பில் சேர்க்கப்படவில்லை. வெளியீட்டு ஆண்டு அல்லது பதிப்பு அறிவிப்பு எதுவும் அச்சில் காணப்படவில்லை.</Prose>
      </Section>

      <Section label="கட்டமைப்புக் கணக்கு">
        <Facts rows={[
          ["கதைச்சுருக்கம்", `${c.storySummaryRecords} பதிவு / ${c.storySummaryUnits} பகுதிகள் (${c.storySummaryCrossPageUnits} பக்கம் தாண்டியது)`],
          ["பாடல்/நடனக் காட்சிகள்", String(c.performanceBlocks)],
          ["பிரிவுகள்", String(c.performanceSections)],
          ["தமிழ்/ஆங்கில வரி இணைகள்", `${c.performanceLineCues} / ${c.performanceLineCues}`],
          ["பக்கம் தாண்டிய காட்சிகள்", String(c.crossPagePerformanceBlocks)],
          ["மூலத்தில் எண்ணிடப்பட்ட காட்சிகள்", "0 — வரிசை களஞ்சிய வழிசெலுத்தல் மட்டுமே"],
        ]} />
      </Section>

      <Section label="பாடலாசிரியப் பொறுப்பு">
        <Facts rows={[
          ["உறுதிப்படுத்தப்பட்ட தனி பாடலாசிரியர்", String(prov.authorship.verified)],
          ["தீர்க்கப்படாதவை", String(prov.authorship.unresolved)],
        ]} />
        <Prose className="mt-3">15 காட்சிகளிலும் தனி நிலைப் பாடலாசிரியர் தீர்க்கப்படவில்லை. கதை–வசனப் பொறுப்பு பாடலாசிரியப் பொறுப்பை நிறுவாது; தீர்க்கப்படாத நிலை “கலைஞர் அல்லாதவர்” என்று பொருள்படாது.</Prose>
      </Section>

      <Section label="குறுக்கு-சான்று நிலை">
        <Facts rows={[
          ["உறுதிப்படுத்தப்பட்ட தற்போதைய தொகுப்புச் சான்று", `${prov.crossWitness.confirmed} — களஞ்சிய வரிசை ${prov.crossWitness.confirmedBlock} ↔ ${prov.crossWitness.confirmedAnthologyRecordId}`],
          ["மூலத்தில் மட்டும் உள்ளவை", String(prov.crossWitness.sourceOnly)],
        ]} />
        <Prose className="mt-3">களஞ்சிய வரிசை 11 (மாட்டுக்கார பையன்) மட்டுமே தற்போதைய தொகுப்பில் உறுதிப்படுத்தப்பட்ட ஒரு சான்று-தொடர்பைக் கொண்டுள்ளது. இது ஒரே உரை என்பதற்கோ, இந்நூலைத் தொகுப்பு உரையால் மாற்றுவதற்கோ, நூல் நிலைப் பாடலாசிரியப் பொறுப்பை உயர்த்துவதற்கோ சான்று அன்று.</Prose>
      </Section>

      <Section label="ஆங்கில அடுக்கு">
        <Facts rows={[
          ["நிலை", prov.englishProvenance.status],
          ["வகை", prov.englishProvenance.kind],
        ]} />
        <Prose className="mt-3">ஆங்கிலம் இத்திட்டத்திற்காக உருவாக்கப்பட்ட, மூலத்துடன் இணைக்கப்பட்ட வாசிப்பு அடுக்கு. இது அதிகாரபூர்வ வரலாற்று வெளியீட்டு மொழிபெயர்ப்பு அன்று. மூல தமிழே ஆளும் உரை.</Prose>
      </Section>

      <Section label="ஒருமைப்பாட்டுக் கைரேகைகள்">
        <Facts rows={[
          ["மூல reading-room SHA-256", prov.readingRoomPayloadSha256],
          ["வாசிப்புத் தரவு SHA-256", prov.readerSha256],
          ["ஒருங்கிணைப்பு நிலை", prov.integrationQaStatus],
        ]} />
      </Section>

      <Section label="உரிமை நிலை">
        <Prose>வெளியீட்டு ஆண்டு, பதிப்பு அறிவிப்பு, உரிமை நிலை எதுவும் மூலத்தில் நிறுவப்படவில்லை; எனவே எதுவும் கூறப்படவில்லை.</Prose>
      </Section>
    </main>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 border-t border-ink/10 pt-7 dark:border-white/10">
      <h2 className="font-tamil text-lg font-semibold text-ink dark:text-night-text" lang="ta">{label}</h2>
      {children}
    </section>
  );
}
function Prose({ children, className = "mt-2" }: { children: React.ReactNode; className?: string }) {
  return <p className={`${className} font-tamil text-sm leading-[1.85] text-ink/65 dark:text-night-text/65`} lang="ta">{children}</p>;
}
function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mt-3 space-y-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="sm:flex sm:gap-3">
          <dt className="font-tamil text-ink/45 dark:text-night-text/45 sm:w-56 sm:shrink-0" lang="ta">{k}</dt>
          <dd className="break-all font-mono text-[0.92em] text-ink/80 dark:text-night-text/80">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
