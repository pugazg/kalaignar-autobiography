"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, FileCheck2, Home, Info, Landmark, ShieldCheck } from "lucide-react";
import type { SpeechProvenance } from "@/data/speeches";
import { useLang } from "@/lib/i18n";

export default function SpeechSource({ slug, prov }: { slug: string; prov: SpeechProvenance }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const s = prov.source;
  const pr = prov.projectRights;

  const Row = ({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) => (
    <div className="grid gap-0.5 border-b border-ink/5 py-2.5 last:border-0 dark:border-white/5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-4">
      <dt className="text-xs text-ink/45 dark:text-night-text/45">{label}</dt>
      <dd className={mono ? "break-all font-mono text-[11px] leading-relaxed text-ink/70 dark:text-night-text/70" : "text-sm text-ink/85 dark:text-night-text/85"}>{children}</dd>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper pb-24 dark:bg-night dark:text-night-text">
      <header className="border-b border-ink/10 bg-mist/40 dark:border-white/10 dark:bg-night-surface/40">
        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
          <div className="flex items-center gap-3 text-xs text-ink/60 dark:text-night-text/60">
            <Link href={`/speeches/${slug}`} className="focus-ring inline-flex items-center gap-1 rounded hover:text-marina dark:hover:text-marina-light">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {ta ? "உரைக்குத் திரும்பு" : "Back to the speech"}
            </Link>
            <Link href="/read" className="focus-ring inline-flex items-center gap-1 rounded hover:text-marina dark:hover:text-marina-light" aria-label={ta ? "மின்னூலகம்" : "Library"}>
              <Home className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <h1 className="mt-5 font-display text-3xl font-medium tracking-tight">{ta ? "மூலமும் சான்றும்" : "Source & provenance"}</h1>
          <p className="mt-1 font-tamil text-lg text-marina/80 dark:text-marina-light/80" lang="ta">{s.publicationTitleTa}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/65 dark:text-night-text/65" lang={lang}>
            {ta
              ? "இப்பக்கம் மூல உண்மைகளையும் (அச்சிட்ட நூல்/scan) காப்பகத்தால் உருவாக்கப்பட்ட அமைப்பையும் வேறுபடுத்திக் காட்டுகிறது."
              : "This page separates source facts (the printed booklet / scan) from the archive-derived reading structure."}
          </p>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        {/* SOURCE FACTS */}
        <section className="rounded-2xl border border-ink/10 bg-white/50 p-5 dark:border-white/10 dark:bg-night-surface/50">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-marina dark:text-marina-light">
            <Landmark className="h-3.5 w-3.5" aria-hidden /> {ta ? "மூல உண்மைகள் (அச்சிட்ட நூல்)" : "Source facts (the printed booklet)"}
          </h2>
          <dl className="mt-3">
            <Row label={ta ? "நூல் தலைப்பு" : "Publication title"}><span className="font-tamil" lang="ta">{s.publicationTitleTa}</span></Row>
            <Row label={ta ? "ஆசிரியர்" : "Author"}><span className="font-tamil" lang="ta">{s.authorTa}</span></Row>
            <Row label={ta ? "பதிப்பு" : "Edition"}><span className="font-tamil" lang="ta">{s.editionTa}</span> <span className="text-ink/45 dark:text-night-text/45">({s.publicationDate})</span></Row>
            <Row label={ta ? "பதிப்பகம்" : "Publisher"}><span className="font-tamil" lang="ta">{s.publisherTa}, {s.publisherLocationTa}</span></Row>
            <Row label={ta ? "அச்சகம்" : "Printer"}><span className="font-tamil" lang="ta">{s.printerTa}, {s.printerLocationTa}</span></Row>
            <Row label={ta ? "விலை (அச்சிட்டபடி)" : "Price (as printed)"}><span className="font-tamil" lang="ta">{s.coverPriceTa}</span></Row>
            <Row label={ta ? "Scan கோப்பு" : "Scan file"} mono>{s.scanFilename}</Row>
            <Row label={ta ? "Scan பக்கங்கள்" : "Scan pages"}>
              {s.scanTotalPages} {ta ? "மொத்தம்" : "total"} · {ta ? "உரை" : "speech"} {s.speechScanPages} · {ta ? "முன்பகுதி" : "front"} {s.frontMatterScanPages} · {ta ? "விளம்பரம்" : "ads"} {s.advertisementScanPages}
            </Row>
          </dl>
          <p className="mt-3 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-4 py-2.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
            {ta
              ? "கட்டுப்படுத்தும் மூலம் அச்சிடப்பட்ட 1970 நூலின் scan. உரையின் பக்கங்கள் மட்டுமே (5–46) படியெடுக்கப்பட்டுள்ளன. மூல PDF இங்கு சேமிக்கப்படவில்லை."
              : "The controlling source is the scanned 1970 booklet; only the speech pages (5–46) are transcribed. The source PDF is not vendored here."}
          </p>
        </section>

        {/* ARCHIVE-DERIVED */}
        <section className="mt-4 rounded-2xl border border-brass/30 bg-brass/[0.04] p-5">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brass">
            <Info className="h-3.5 w-3.5" aria-hidden /> {ta ? "காப்பகத்தால் உருவாக்கப்பட்ட அமைப்பு" : "Archive-derived structure"}
          </h2>
          <dl className="mt-3">
            <Row label={ta ? "அச்சுத் தலைப்புகள்" : "Printed section headings"}>{prov.archiveDerived.sectionHeadings}</Row>
            <Row label={ta ? "வாசிப்புப் பத்திகள் (த/ஆ)" : "Logical paragraphs (Ta/En)"}>{prov.archiveDerived.tamilParagraphs} / {prov.archiveDerived.englishParagraphs}</Row>
            <Row label={ta ? "மூலப் பக்கத் துண்டுகள் (த/ஆ)" : "Source-page text segments (Ta/En)"}>{prov.archiveDerived.tamilSourceTextSegments} / {prov.archiveDerived.englishSourceTextSegments}</Row>
            <Row label={ta ? "பக்கம் தாண்டும் பத்திகள் (த/ஆ)" : "Cross-page paragraphs (Ta/En)"}>
              {prov.archiveDerived.tamilCrossPageParagraphs} / {prov.archiveDerived.englishCrossPageParagraphs}
              <span className="mt-1 block text-[11px] text-ink/40 dark:text-night-text/40">
                {ta
                  ? `இதில் ${prov.archiveDerived.tamilMidWordJoins} சொல்-நடு பக்கப் பிரிப்புகள் (இடைவெளியின்றி இணைக்கப்படுகின்றன).`
                  : `incl. ${prov.archiveDerived.tamilMidWordJoins} mid-word page splits (joined with no space).`}
              </span>
            </Row>
            <Row label={ta ? "மூலப் பக்கங்கள்" : "Source pages covered"}>{prov.archiveDerived.sourcePagesCovered} ({s.speechScanPages})</Row>
          </dl>
          <p className="mt-2 text-xs leading-relaxed text-ink/60 dark:text-night-text/60" lang={lang}>
            {ta
              ? "தலைப்புகள் மூலத்தில் அச்சிடப்பட்டவை. மூலப் பக்க எல்லை என்பது பத்தி எல்லை அல்ல — ஒரு வாசிப்புப் பத்தி பல மூலப் பக்கங்களில் நீளலாம்; ஒவ்வொரு பக்கத் துண்டும் அதன் மூலப் பக்கத்தைத் தக்கவைக்கிறது. வாசிப்பிற்கு எந்த காப்பக எண்ணிடலும் மூல எண்ணிடலாகக் காட்டப்படவில்லை."
              : "Section headings are printed in the source. A source-page boundary is not a paragraph boundary — one logical reading paragraph may span several source pages, and each page segment keeps its source page. No archive-created numbering is presented as source numbering."}
          </p>
        </section>

        {/* VERIFICATION */}
        <section className="mt-4 rounded-2xl border border-ink/10 bg-white/50 p-5 dark:border-white/10 dark:bg-night-surface/50">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 dark:text-night-text/50">
            <FileCheck2 className="h-3.5 w-3.5" aria-hidden /> {ta ? "சரிபார்ப்பு நிலை" : "Verification state"}
          </h2>
          <dl className="mt-3">
            <Row label={ta ? "தமிழ் படியெடுப்பு" : "Tamil transcription"}>{String(prov.transcription.status)} · {prov.transcription.verified_against_scan ? (ta ? "scan-உடன் சரிபார்க்கப்பட்டது" : "verified against scan") : "—"}</Row>
            <Row label={ta ? "ஆங்கில மொழிபெயர்ப்பு" : "English translation"}>{String(prov.translation.status)} · {String(prov.translation.type)}</Row>
          </dl>
        </section>

        {/* PRESENT RIGHTS / NATIONALISATION */}
        {pr && (
          <section className="mt-4 rounded-2xl border border-marina/30 bg-marina/[0.05] p-5">
            <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-marina dark:text-marina-light">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> {ta ? "தற்போதைய உரிமை / நாட்டுடைமை நிலை" : "Present rights / nationalisation status"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/80 dark:text-night-text/80" lang={lang}>
              {ta
                ? "கலைஞர் மு. கருணாநிதியின் படைப்புகள் தமிழ்நாடு அரசால் நாட்டுடைமையாக்கப்பட்டுள்ளன. 2024 ஆகஸ்ட் 22 அன்றைய அறிவிப்பையடுத்து, ராயல்டி இன்றி நாட்டுடைமையாக்கப்பட்டன. அரசாணை 2024 டிசம்பர் 22 அன்று ராஜாத்தி அம்மாளிடம் பொதுவில் வழங்கப்பட்டது. அரசாணையின் சரியான எண்ணும் முறையான வெளியீட்டுத் தேதியும் இன்னும் சரிபார்க்கப்படவில்லை. இது கலைஞர் ஆற்றிய அடிப்படை உரைக்கு மட்டுமே பொருந்தும்."
                : "Kalaignar M. Karunanidhi's works were nationalised by the Government of Tamil Nadu following the 22 August 2024 announcement, without royalty. The Government Order was publicly handed over to Rajathi Ammal on 22 December 2024. Its exact GO number and formal issue date have not yet been verified from the order itself. This applies to the underlying speech authored by Kalaignar."}
            </p>
            <dl className="mt-3">
              <Row label={ta ? "உரிமை நிலை" : "Rights status"}>{ta ? "தமிழ்நாடு அரசால் நாட்டுடைமையாக்கப்பட்டது" : "Nationalised by the Government of Tamil Nadu"}</Row>
              <Row label={ta ? "அறிவிப்பு தேதி" : "Announcement date"}>{pr.rightsAnnouncementDate}</Row>
              <Row label={ta ? "அரசாணை பொதுவில் வழங்கப்பட்டது" : "GO publicly handed over"}>
                {pr.governmentOrderHandoverDate}
                <span className="mt-1 block text-[11px] text-ink/40 dark:text-night-text/40">{ta ? "ராஜாத்தி அம்மாளிடம் — இது வெளியீட்டுத் தேதி அல்ல." : "To Rajathi Ammal — not the GO issue date."}</span>
              </Row>
              <Row label={ta ? "அரசாணை எண்" : "GO number"}>{pr.governmentOrderNumber ?? (ta ? "இன்னும் சரிபார்க்கப்படவில்லை" : "not yet verified")}</Row>
              <Row label={ta ? "அரசாணை வெளியீட்டுத் தேதி" : "GO issue date"}>{pr.governmentOrderDate ?? (ta ? "இன்னும் சரிபார்க்கப்படவில்லை" : "not yet verified")}</Row>
            </dl>
            <p className="mt-3 rounded-xl border border-dashed border-marina/40 bg-marina/[0.05] px-4 py-2.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
              {ta
                ? "நாட்டுடைமையாக்கல் கலைஞரின் அடிப்படை தமிழ் உரைக்கு மட்டுமே. இத்திட்டத்திற்காக உருவாக்கப்பட்ட ஆங்கில மொழிபெயர்ப்பு, தனித்தனியே வெளியிடப்பட்ட மொழிபெயர்ப்புகள், அல்லது பிறர் பங்களிப்புகளுக்கு இது நீட்டிக்கப்படவில்லை."
                : "The nationalisation covers Kalaignar's underlying Tamil speech only. It does not extend to the project-created English translation, separately published translations, or third-party contributions, which retain their own provenance."}
            </p>
          </section>
        )}

        {/* SOURCE & INTEGRITY */}
        <section className="mt-4 rounded-2xl border border-ink/10 bg-white/50 p-5 dark:border-white/10 dark:bg-night-surface/50">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 dark:text-night-text/50">{ta ? "மூலம்" : "Source"}</h2>
          <dl className="mt-3">
            <Row label={ta ? "மூலக் களஞ்சியம்" : "Source repository"} mono>{prov.sourceRepo} · {prov.sourcePath}</Row>
            <Row label={ta ? "மூல commit" : "Source commit"} mono>{prov.sourceCommit}</Row>
          </dl>
        </section>

        {/* Notes */}
        <section className="mt-4 rounded-2xl border border-ink/10 bg-white/40 p-5 dark:border-white/10 dark:bg-night-surface/40">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 dark:text-night-text/50">{ta ? "குறிப்புகள்" : "Notes"}</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/70 dark:text-night-text/70">
            {prov.notes.map((n, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink/30 dark:bg-white/30" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-2 text-sm">
          <Link href={`/speeches/${slug}`} className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 hover:border-marina/50 dark:border-white/15" lang={lang}>
            <BookOpen className="h-3.5 w-3.5 text-marina" aria-hidden /> {ta ? "உரையை வாசிக்க" : "Read the speech"}
          </Link>
        </div>
      </main>
    </div>
  );
}
