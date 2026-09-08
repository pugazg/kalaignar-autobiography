import Link from "next/link";
import type { AmmaiyappanReader } from "@/data/ammaiyappan";

/** The provenance interface for அம்மையப்பன். Everything the reading pages withhold lives here: the scan
 *  hash, page counts, the structural census, the printed 1954 source witnesses (kept as witnesses, never
 *  promoted to a present-day determination), the retained-song-occurrence safeguard, and the integrity
 *  hashes. Counts are read from the generated data, never hardcoded. No publication year, edition or
 *  rights is asserted. */
type Prov = {
  sourceRepo: string; sourceCommit: string; repoTree: string; workTree: string; sourcePath: string;
  pdf: { filename: string; sha256: string; pages: number; mainTextPdfPages: string };
  readingRoomPayloadSha256: string; readerSha256: string; integrationQaStatus: string;
  englishProvenance: { status: string; kind: string; titleEnIsEditorial: boolean };
  printedSourceWitnesses: {
    titlePageCredit: { roleTa: string; nameTa: string };
    edition: string; publicationMonthYear: string; price: string; publisher: string; rightsLine: string;
  };
  structuralExceptions: { id: string; rule: string }[];
  rights: { publicationYear: null | number; editionStatement: null | string; rightsStatus: null | string; note: string };
};

/** Leading `TVA_<LETTERS>_<digits>` archive id; whole filename if the shape is unexpected. */
function archiveId(filename: string): string {
  return /^(TVA_[A-Z]+_\d+)/.exec(filename)?.[1] ?? filename;
}

export default function AmmaiyappanSource({ reader, prov }: { reader: AmmaiyappanReader; prov: Prov }) {
  const c = reader.counts;
  const w = prov.printedSourceWitnesses;
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label="வழிசெலுத்தல்" className="mb-8 text-sm" data-print="hide">
        <Link href="/cinema/ammaiyappan" className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">{reader.work.titleTa}</Link>
        <span className="mx-2 text-ink/30 dark:text-night-text/30">/</span>
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light"><span lang="ta">மின்னூலகம்</span></Link>
      </nav>

      <h1 className="font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">மூலமும் சான்றும்</h1>
      <p className="mt-1.5 font-display text-base text-ink/55 dark:text-night-text/55">{reader.work.titleEn} — source &amp; provenance</p>

      <Section label="ஆளும் மூலம்">
        <Prose>அச்சிடப்பட்ட வசன நூலின் ஸ்கேன் நகலே இப்பதிப்பின் ஆளும் மூலம். மூல PDF இணையதளத்திலோ மூலக் களஞ்சியத்திலோ சேர்க்கப்படவில்லை; SHA-256 கைரேகை அதை அடையாளப்படுத்துகிறது.</Prose>
        <Facts rows={[
          ["அடையாளம்", archiveId(prov.pdf.filename)],
          ["கோப்பு", prov.pdf.filename],
          ["ஸ்கேன் SHA-256", prov.pdf.sha256],
          ["PDF பக்கங்கள்", String(prov.pdf.pages)],
          ["மூல வசனப் பக்கங்கள் (PDF)", prov.pdf.mainTextPdfPages],
          ["மூலக் களஞ்சியம்", prov.sourceRepo],
          ["நிலைநிறுத்தப்பட்ட commit", prov.sourceCommit],
          ["படைப்பு மரம் (tree)", prov.workTree],
          ["மூலப் பாதை", prov.sourcePath],
        ]} />
      </Section>

      <Section label="கட்டமைப்புக் கணக்கு">
        <Facts rows={[
          ["களஞ்சியத் திரைக்காட்சிப் பகுதிகள்", String(c.scenes)],
          ["மூலத்தில் எண்ணிடப்பட்ட காட்சிகள்", `${c.sourceNumberedScenes} — பகுதி எண்கள் களஞ்சிய வழிசெலுத்தல் மட்டுமே`],
          ["ஆங்கில அலகுகள்", `${c.englishUnits} (உரையாடல் ${c.unitKinds.dialogue} / அரங்கக் குறிப்பு ${c.unitKinds["stage-direction"]} / பாடல் குறிப்பு ${c.unitKinds["song-reference"]} / ஜப ${c.unitKinds.japa})`],
          ["உரையாடல் மூல இணைப்புகள்", String(c.dialogueSourceLinks)],
          ["பக்கம் தாண்டிய அலகுகள்", String(c.crossPageUnits)],
        ]} />
      </Section>

      <Section label="காட்சி எண்ணிடல்">
        <Prose>1954 நூல் திரைக்காட்சிகளை எண்ணிடவில்லை: 63 காட்சிப் பகுதிகள் களஞ்சிய/பதிப்பாசிரிய வழிசெலுத்தல் மட்டுமே; அவை மூல அச்சிடப்பட்ட காட்சி எண்கள் அல்ல.</Prose>
      </Section>

      <Section label="பாடல் நிகழ்ச்சிக் குறிப்புகள்">
        <Prose>நூலினுள் தோன்றும் ஒரு சில பாடல்/நிகழ்ச்சிக் குறிப்புகள் மூலத்தில் தோன்றும் நிகழ்வுக் குறிப்புகள் மட்டுமே. அவை கலைஞர் இயற்றிய தனி நிலைப் பாடல் வரிகளாக உயர்த்தப்படவில்லை; முழு பெயரிடப்பட்ட பாடல் வரிப் பகுதிகள் எதுவும் இந்நூலில் அச்சிடப்படவில்லை.</Prose>
      </Section>

      <Section label="அச்சில் தோன்றும் மூலச் சான்றுகள்">
        <Prose>கீழுள்ளவை நூலில் அச்சிடப்பட்ட சான்றுகள் மட்டுமே — தற்கால உரிமை/வெளியீட்டு நிர்ணயங்களாக உயர்த்தப்படவில்லை.</Prose>
        <Facts rows={[
          ["தலைப்புப் பக்கக் குறிப்பு", `${w.titlePageCredit.roleTa} : ${w.titlePageCredit.nameTa}`],
          ["பதிப்பு", w.edition],
          ["வெளியீடு", w.publicationMonthYear],
          ["விலை", w.price],
          ["பதிப்பகம்", w.publisher],
          ["உரிமை வரி (அச்சில்)", w.rightsLine],
        ]} />
      </Section>

      <Section label="ஆங்கில அடுக்கு">
        <Facts rows={[["நிலை", prov.englishProvenance.status], ["வகை", prov.englishProvenance.kind]]} />
        <Prose className="mt-3">ஆங்கிலம் இத்திட்டத்திற்காக உருவாக்கப்பட்ட, மூலத்துடன் இணைக்கப்பட்ட வாசிப்பு அடுக்கு. அதிகாரபூர்வ வரலாற்று வெளியீட்டு மொழிபெயர்ப்பு அன்று; மூல தமிழே ஆளும் உரை.</Prose>
      </Section>

      <Section label="ஒருமைப்பாட்டுக் கைரேகைகள்">
        <Facts rows={[
          ["மூல reading-room SHA-256", prov.readingRoomPayloadSha256],
          ["வாசிப்புத் தரவு SHA-256", prov.readerSha256],
          ["ஒருங்கிணைப்பு நிலை", prov.integrationQaStatus],
        ]} />
      </Section>

      <Section label="உரிமை நிலை">
        <Prose>தற்கால வெளியீட்டு ஆண்டு, பதிப்பு நிர்ணயம், உரிமை நிலை எதுவும் மூலத்திலிருந்து உய்த்துணரப்படவில்லை; மேலே உள்ள அச்சுச் சான்றுகள் வரலாற்றுச் சான்றுகளாக மட்டுமே பாதுகாக்கப்படுகின்றன.</Prose>
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
