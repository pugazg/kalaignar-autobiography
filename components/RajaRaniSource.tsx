import Link from "next/link";
import type { RajaRaniReader } from "@/data/raja-rani";

/** The provenance interface for ராஜா ராணி. Everything the reading pages withhold lives here: the scan
 *  hash, page counts, the structural census, the frozen song-authorship tiers, the sole review-level
 *  scene↔song relation, and the exclusions (deleted T055 duplicate ids; the PDF-74 ownership stamp).
 *  Counts are read from the generated data, never hardcoded. No publication year, edition or rights is
 *  asserted — the booklet establishes none. */
type Prov = {
  sourceRepo: string; sourceCommit: string; repoTree: string; workTree: string; sourcePath: string;
  pdf: { filename: string; sha256: string; pages: number; canonicalSourcePages: number };
  readingRoomPayloadSha256: string; readerSha256: string; integrationQaStatus: string;
  englishProvenance: { status: string; kind: string; titleEnIsEditorial: boolean };
  authorship: { anthologyAttributed: number; unresolved: number; rule: string };
  structuralExceptions: { id: string; rule: string; ids?: string[] }[];
  rights: { publicationYear: null | number; editionStatement: null | string; rightsStatus: null | string; note: string };
};

export default function RajaRaniSource({ reader, prov }: { reader: RajaRaniReader; prov: Prov }) {
  const c = reader.counts;
  const attributedNumbers = reader.numberedSongs.filter((s) => s.authorshipStatus === "anthology-attributed").map((s) => s.numberedSongNumber).join(", ");
  const unresolvedNumbers = reader.numberedSongs.filter((s) => s.authorshipStatus === "unresolved").map((s) => s.numberedSongNumber).join(", ");
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label="வழிசெலுத்தல்" className="mb-8 text-sm" data-print="hide">
        <Link href="/cinema/raja-rani" className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">{reader.work.titleTa}</Link>
        <span className="mx-2 text-ink/30 dark:text-night-text/30">/</span>
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light"><span lang="ta">மின்னூலகம்</span></Link>
      </nav>

      <h1 className="font-tamil text-2xl font-semibold leading-snug text-ink dark:text-night-text" lang="ta">மூலமும் சான்றும்</h1>
      <p className="mt-1.5 font-display text-base text-ink/55 dark:text-night-text/55">{reader.work.titleEn} — source &amp; provenance</p>

      <Section label="ஆளும் மூலம்">
        <Prose>அச்சிடப்பட்ட வசன நூலின் ஸ்கேன் நகலே இப்பதிப்பின் ஆளும் மூலம். மூல PDF இணையதளத்திலோ மூலக் களஞ்சியத்திலோ சேர்க்கப்படவில்லை; SHA-256 கைரேகை அதை அடையாளப்படுத்துகிறது.</Prose>
        <Facts rows={[
          ["அடையாளம்", prov.pdf.filename.replace(/_.*$/, "")],
          ["கோப்பு", prov.pdf.filename],
          ["ஸ்கேன் SHA-256", prov.pdf.sha256],
          ["PDF பக்கங்கள்", String(prov.pdf.pages)],
          ["மூல பக்கங்கள்", `${prov.pdf.canonicalSourcePages}`],
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
          ["ஆங்கில வசன அலகுகள்", `${c.screenplayUnits} (உரையாடல் ${c.unitKinds.dialogue} / அரங்கக் குறிப்பு ${c.unitKinds["stage-direction"]} / நிகழ்ச்சிக் குறிப்பு ${c.unitKinds["performance-cue"]} / எழுத்துப் பகுதி ${c.unitKinds["written-text"]})`],
          ["மாறாத உரையாடல் இணைப்புகள்", String(c.immutableDialogueLinks)],
          ["மூலத்தில் பெயரிடப்படாத பேச்சு அலகுகள்", String(c.sourceUnlabelledSpokenUnits)],
          ["பக்கம் தாண்டிய வசன அலகுகள்", String(c.crossPageScreenplayUnits)],
          ["எண்ணிடப்பட்ட பாடல்கள்", String(c.numberedSongs)],
          ["பாடல் பிரிவுகள்", String(c.songSections)],
          ["தமிழ்/ஆங்கில பாடல் வரி இணைகள்", `${c.songLineCues} / ${c.songLineCues}`],
        ]} />
      </Section>

      <Section label="பாடல் எண்ணிடல் vs காட்சி எண்ணிடல்">
        <Prose>11 பாடல்களின் எண்கள் (பாட்டு 1–11) நூலின் சொந்த மூல எண்ணிடல். ஆனால் நூல் திரைக்காட்சிகளை எண்ணிடவில்லை: 58 காட்சிப் பகுதிகள் களஞ்சிய/பதிப்பாசிரிய வழிசெலுத்தல் மட்டுமே. இவ்விரண்டையும் ஒன்றெனக் கருதக்கூடாது.</Prose>
      </Section>

      <Section label="பாடலாசிரியப் பொறுப்பு">
        <Facts rows={[
          ["பிற்கால தொகுப்பில் ஏற்றப்பட்டவை", `${prov.authorship.anthologyAttributed} — பாடல்கள் ${attributedNumbers}`],
          ["தீர்க்கப்படாதவை", `${prov.authorship.unresolved} — பாடல்கள் ${unresolvedNumbers}`],
        ]} />
        <Prose className="mt-3">பிற்கால தொகுப்புச் சான்று மூல நூலின் தனி நிலைப் பாடலாசிரியப் பொறுப்பை நிறுவாது. எந்த அடுக்கும் உயர்த்தப்படவில்லை; தீர்க்கப்படாத நிலை “கலைஞர் அல்லாதவர்” என்று பொருள்படாது.</Prose>
      </Section>

      <Section label="காட்சி 58 ↔ பாட்டு 11 தொடர்பு">
        <Prose>காட்சி 58-க்கும் பாட்டு 11-க்கும் இடையிலான நிகழ்ச்சித் தொடர்பு (raja-rani-song-perf-004) “மறு ஆய்வுக்குரியது” (review) நிலையிலேயே உள்ளது. இது உறுதிப்படுத்தப்பட்டதாக உயர்த்தப்படவில்லை.</Prose>
      </Section>

      <Section label="விலக்கப்பட்டவை">
        <Prose>PDF 74-இல் உள்ள உரிமையாளர்/நூலக முத்திரை மூல வசன உரையின் பகுதியன்று; அது வாசிப்பில் தோன்றாது. முந்தைய T055 நகல் உரையாடல் அடையாளங்கள் (s055-d026–s055-d030) நீக்கப்பட்டவை; அவை மீண்டும் தோன்றா.</Prose>
      </Section>

      <Section label="ஆங்கில அடுக்கு">
        <Facts rows={[["நிலை", prov.englishProvenance.status], ["வகை", prov.englishProvenance.kind]]} />
        <Prose className="mt-3">ஆங்கிலம் இத்திட்டத்திற்காக உருவாக்கப்பட்ட, மூலத்துடன் இணைக்கப்பட்ட வாசிப்பு அடுக்கு. அதிகாரபூர்வ வரலாற்று வெளியீட்டு மொழிபெயர்ப்பு அன்று; மூல தமிழே அதிகாரபூர்வமானது.</Prose>
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
