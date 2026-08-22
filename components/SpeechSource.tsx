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
  const ad = prov.archiveDerived;
  // TWO BOUNDARY-EVIDENCE MODELS. `boundaryAudit` means every Tamil page transition was examined
  // and classified; `crossPageJoinPolicy` means the archive's normalisation policy was applied and
  // no per-boundary adjudication exists. They are rendered separately and never share wording: to
  // describe the second with the first's copy would upgrade policy into scan-by-scan adjudication.
  const audit = ad.boundaryAudit;
  // The two archive eras write the SAME fact under different keys — verified as the same concept,
  // not assumed from the similar name: in both, the speech's printed range where it differs from
  // the scan range. Resolved once here so every printed-range rendering agrees.
  const printedPages = s.printedSpeechPages ?? s.speechPrintedPages;
  const joinPolicy = prov.crossPageJoinPolicy;

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
              : "This page separates source facts (the printed publication / scan) from the archive-derived reading structure."}
          </p>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        {/* SOURCE FACTS */}
        <section className="rounded-2xl border border-ink/10 bg-white/50 p-5 dark:border-white/10 dark:bg-night-surface/50">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-marina dark:text-marina-light">
            <Landmark className="h-3.5 w-3.5" aria-hidden /> {ta ? "மூல உண்மைகள் (அச்சிட்ட நூல்)" : "Source facts (the printed publication)"}
          </h2>
          <dl className="mt-3">
            <Row label={ta ? "நூல் தலைப்பு" : "Publication title"}><span className="font-tamil" lang="ta">{s.publicationTitleTa}</span></Row>
            {s.authorTa && <Row label={ta ? "ஆசிரியர்" : "Author"}><span className="font-tamil" lang="ta">{s.authorTa}</span></Row>}
            {(s.editionTa || s.publicationDate) && (<Row label={ta ? "பதிப்பு" : "Edition"}><span className="font-tamil" lang="ta">{s.editionTa}</span> <span className="text-ink/45 dark:text-night-text/45">({s.publicationDate})</span></Row>)}
            {s.firstEditionTa && <Row label={ta ? "முதற்பதிப்பு" : "First edition"}><span className="font-tamil" lang="ta">{s.firstEditionTa}</span></Row>}
            {s.publisherTa && (<Row label={ta ? "பதிப்பகம்" : "Publisher"}><span className="font-tamil" lang="ta">{s.publisherTa}{s.publisherLocationTa ? `, ${s.publisherLocationTa}` : ""}</span></Row>)}
            {s.printerTa && (<Row label={ta ? "அச்சகம்" : "Printer"}><span className="font-tamil" lang="ta">{s.printerTa}{s.printerLocationTa ? `, ${s.printerLocationTa}` : ""}</span></Row>)}
            {s.coverPriceTa && (<Row label={ta ? "விலை (அச்சிட்டபடி)" : "Price (as printed)"}><span className="font-tamil" lang="ta">{s.coverPriceTa}</span></Row>)}
            <Row label={ta ? "Scan கோப்பு" : "Scan file"} mono>{s.scanFilename}</Row>
            {s.scanSha256 && <Row label={ta ? "Scan SHA-256" : "Scan SHA-256"} mono>{s.scanSha256}</Row>}
            {s.scanFileSizeBytes != null && <Row label={ta ? "Scan அளவு" : "Scan size"}>{s.scanFileSizeBytes.toLocaleString("en-US")} {ta ? "பைட்டுகள்" : "bytes"}</Row>}
            <Row label={ta ? "Scan பக்கங்கள்" : "Scan pages"}>
              {s.scanTotalPages} {ta ? "மொத்தம்" : "total"} · {ta ? "உரை" : "speech"} {s.speechScanPages}
              {printedPages ? ` (${ta ? "அச்சு" : "printed"} ${printedPages})` : ""}
              {/* Front-matter and advertisement ranges belong to standalone booklets. An anthology
                  section states neither, so neither label is printed for it. */}
              {s.frontMatterScanPages ? ` · ${ta ? "முன்பகுதி" : "front"} ${s.frontMatterScanPages}` : ""}
              {s.advertisementScanPages ? ` · ${ta ? "பின்பகுதி" : "back"} ${s.advertisementScanPages}` : ""}
            </Row>
          </dl>
          {/* Page-range wording is subtype-agnostic but PROVENANCE-honest: a printed-page range is
              named "printed" ONLY when the source actually publishes one (`printedSpeechPages` in the
              benchmark era, `speechPrintedPages` in the assembly anthology — the same fact).
              Where it does not (e.g. Udhaya Kathir), the scan range is described as scan/PDF pages
              and is never relabelled as a printed-page range. */}
          <p className="mt-3 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-4 py-2.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
            {ta
              ? printedPages
                ? `கட்டுப்படுத்தும் மூலம் அச்சிடப்பட்ட நூலின் scan. உரையின் பக்கங்கள் மட்டுமே (scan பக்கம் ${s.speechScanPages} · அச்சுப் பக்கம் ${printedPages}) படியெடுக்கப்பட்டுள்ளன. மூல PDF இங்கு சேமிக்கப்படவில்லை.`
                : `கட்டுப்படுத்தும் மூலம் அச்சிடப்பட்ட நூலின் scan. உரையின் scan பக்கங்கள் மட்டுமே (${s.speechScanPages}) படியெடுக்கப்பட்டுள்ளன. மூல PDF இங்கு சேமிக்கப்படவில்லை.`
              : printedPages
                ? `The controlling source is the scanned printed publication; only the speech pages (scan ${s.speechScanPages} · printed ${printedPages}) are transcribed. The source PDF is not vendored here.`
                : `The controlling source is the scanned printed publication; only the speech scan pages (${s.speechScanPages}) are transcribed. The source PDF is not vendored here.`}
          </p>
          {/* Written in English in the source provenance → always marked lang="en", even when the
              surrounding UI language is Tamil. */}
          {/* SOURCE FACTS THE EXAMINED SOURCE DOES NOT STATE. These are valid source facts — not
              implementation blockers and not missing work — so they are stated plainly here, and a
              publication/edition date is never substituted for a speech date. */}
          {s.speechFactsNotStated?.length ? (
            <div className="mt-3 rounded-xl border border-dashed border-ink/25 bg-ink/[0.03] px-4 py-2.5 dark:border-white/25 dark:bg-white/[0.03]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/50 dark:text-night-text/50" lang={lang}>
                {ta ? "மூலம் குறிப்பிடாத உரை விவரங்கள்" : "Speech facts not stated in the examined source"}
              </p>
              <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-ink/65 dark:text-night-text/65">
                {s.speechFactsNotStated.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink/30 dark:bg-white/30" />
                    <span lang="en">{f}</span>
                  </li>
                ))}
              </ul>
              {s.speechFactsNoteEn && (
                <p className="mt-2 text-xs leading-relaxed text-ink/55 dark:text-night-text/55" lang="en">{s.speechFactsNoteEn}</p>
              )}
            </div>
          ) : null}
          {s.editionMatterNoteEn && (
            <p className="mt-2 rounded-xl border border-dashed border-ink/20 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/60 dark:border-white/20 dark:bg-white/[0.03] dark:text-night-text/60" lang="en">
              {s.editionMatterNoteEn}
            </p>
          )}
        </section>

        {/* ARCHIVE-DERIVED */}
        <section className="mt-4 rounded-2xl border border-brass/30 bg-brass/[0.04] p-5">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brass">
            <Info className="h-3.5 w-3.5" aria-hidden /> {ta ? "காப்பகத்தால் உருவாக்கப்பட்ட அமைப்பு" : "Archive-derived structure"}
          </h2>
          <dl className="mt-3">
            {ad.sectionHeadings != null && <Row label={ta ? "அச்சுத் தலைப்புகள்" : "Printed section headings"}>{prov.archiveDerived.sectionHeadings}</Row>}
            {ad.tamilResolvedParagraphs != null && <Row label={ta ? "தீர்மானிக்கப்பட்ட வாசிப்புப் பத்திகள் (த/ஆ)" : "Resolved paragraphs (Ta/En)"}>{prov.archiveDerived.tamilResolvedParagraphs} / {prov.archiveDerived.englishParagraphs}</Row>}
            {ad.tamilSourceTextSegments != null && <Row label={ta ? "மூலப் பக்கத் துண்டுகள் (த/ஆ)" : "Source-page text segments (Ta/En)"}>{prov.archiveDerived.tamilSourceTextSegments} / {prov.archiveDerived.englishSourceTextSegments}</Row>}
            {ad.sourcePagesCovered != null && <Row label={ta ? "மூலப் பக்கங்கள்" : "Source pages covered"}>{prov.archiveDerived.sourcePagesCovered} ({s.speechScanPages})</Row>}

            {/* Anthology counts. Reported under their OWN labels: they are not the legacy metrics under a

                different name, so none of them is shown in a legacy row. */}

            {ad.tamilSourcePages != null && (

              <Row label={ta ? "மூலப் பக்கங்கள் (த/ஆ)" : "Source pages (Ta/En)"}>

                {ad.tamilSourcePages} / {ad.englishSourcePages}

              </Row>

            )}

            {ad.tamilHeadings != null && (

              <Row label={ta ? "அச்சுத் தலைப்புகள் (த/ஆ)" : "Printed headings (Ta/En)"}>

                {ad.tamilHeadings} / {ad.englishHeadings}

              </Row>

            )}

            {ad.tamilParagraphs != null && (

              <Row label={ta ? "வாசிப்புப் பத்திகள் (த/ஆ)" : "Reading paragraphs (Ta/En)"}>

                {ad.tamilParagraphs} / {ad.englishParagraphs}

              </Row>

            )}

            {ad.tamilUnresolvedBreaks != null && (

              <Row label={ta ? "தீர்மானிக்கப்படாத பத்தி உறவுகள்" : "Unresolved paragraph relations"}>

                {ad.tamilUnresolvedBreaks}

              </Row>

            )}

          </dl>
          {/* BOUNDARY EVIDENCE — whichever model this speech's archive actually supports. */}

          {audit && (
            <div className="mt-4 rounded-xl border border-brass/30 bg-brass/[0.05] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">
                {ta ? "மூல-தணிக்கை செய்யப்பட்ட பக்க எல்லைகள் (தமிழ்)" : "Source-audited page boundaries (Tamil)"}
              </p>
              <dl className="mt-2">
                <Row label={ta ? "மொத்த எல்லைகள்" : "Total transitions"}>{audit.tamilTransitions}</Row>
                <Row label={ta ? "அதே பத்தி (தொடர்ச்சி)" : "Same paragraph (continuation)"}>{audit.sameParagraph}</Row>
                <Row label={ta ? "மூலத்தால் உறுதிசெய்யப்பட்ட பத்தி எல்லைகள்" : "Source-established paragraph boundaries"}>{audit.paragraphBoundary}</Row>
                <Row label={ta ? "இணைப்பு: இடைவெளியின்றி / இடைவெளி / தீர்மானிக்கப்படாதது" : "Joins: none / space / unresolved"}>
                  {audit.lexicalJoinNone} / {audit.lexicalJoinSpace} / {audit.lexicalJoinUnknown}
                </Row>
                <Row label={ta ? "அச்சுப் பத்தி உறவு தீர்மானிக்கப்படாதவை" : "Unresolved paragraph relationships"}>{audit.unknownParagraphRelation}</Row>
              </dl>
            </div>

          )}

          {joinPolicy && (

            <div className="mt-4 rounded-xl border border-brass/30 bg-brass/[0.05] p-3">

              <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">

                {ta ? "பக்க எல்லைக் கொள்கை (தமிழ்)" : "Page-boundary policy (Tamil)"}

              </p>

              <dl className="mt-2">

                <Row label={ta ? "கொள்கை" : "Policy"}>

                  {ta

                    ? "இயற்பியல் பக்க எல்லையில் ஒரு இடைவெளி சேர்க்கப்படுகிறது"

                    : "one space inserted at a physical page boundary"}

                </Row>

                <Row label={ta ? "அடிப்படை" : "Basis"}>

                  {ta ? "காப்பகத்தின் இயல்பாக்கல் விதி" : "the archive's normalisation rule"}

                </Row>

                <Row label={ta ? "தனித்தனி எல்லை ஆய்வு" : "Per-boundary adjudication"}>

                  {ta ? "பதிவு செய்யப்படவில்லை" : "not recorded by the archive"}

                </Row>

                <Row label={ta ? "கொள்கைப்படி இணைக்கப்பட்டவை" : "Policy-joined continuations"}>

                  {joinPolicy.appliedBoundaries}

                </Row>

                <Row label={ta ? "தீர்மானிக்கப்படாத எல்லைகள்" : "Boundaries left unresolved"}>

                  {joinPolicy.unresolvedBoundaries}

                </Row>

              </dl>

              {/* The wording here deliberately stops short of the audited model's claim: this speech has

                  no per-transition table, and saying it did would turn policy into adjudication. */}

              <p className="mt-2 text-xs leading-relaxed text-ink/60 dark:text-night-text/60" lang={lang}>

                {ta

                  ? "இடைவெளி அல்லது பத்தி உறவு குறித்த தனித்தனி எல்லை ஆய்வை இந்த உரைக்குக் காப்பகம் பதிவு செய்யவில்லை. அதன் இயல்பாக்கல் விதிப்படி, ஒரு வாக்கியம் பக்க எல்லையைத் தாண்டித் தொடரும்போது ஒரு இடைவெளி மட்டும் சேர்க்கப்படுகிறது. முந்தைய பகுதி ஒரு வாக்கியத்தை முடிக்கும் இடங்களில் பத்தி உறவு ஊகிக்கப்படாமல், தீர்மானிக்கப்படாமலே விடப்படுகிறது."

                  : "The archive does not record per-boundary adjudication of spacing or paragraph relationship for this speech. Under its normalisation rule, a sentence running on across a page edge is joined with a single space; where the preceding fragment closes a sentence, the paragraph relationship is left explicitly unresolved rather than guessed."}

              </p>

            </div>

          )}
          {/* This paragraph makes the audited claim — every transition classified in an explicit
              table — so it is shown only where a boundaryAudit actually exists. An anthology
              speech has no such table and must not inherit the sentence. */}
          {audit && (
            <p className="mt-2 text-xs leading-relaxed text-ink/60 dark:text-night-text/60" lang={lang}>
              {ta
                ? "தலைப்புகள் மூலத்தில் அச்சிடப்பட்டவை. மூலப் பக்க எல்லை என்பது பத்தி எல்லை அல்ல; பத்தி உறவுகள் நிறுத்தற்குறியிலிருந்து ஊகிக்கப்படவில்லை — ஒவ்வொரு எல்லையும் மூல ஆவணங்களின் அடிப்படையில் வெளிப்படையாகத் தணிக்கை செய்யப்பட்டது. ஆங்கிலப் பத்தி அமைப்பு மொழிபெயர்ப்பாளரின் சொந்த அமைப்பே; பக்க அடையாளங்கள் மூலச் சான்று மட்டுமே."
                : "Section headings are printed in the source. A source-page boundary is not a paragraph boundary, and paragraph relationships are NOT inferred from punctuation — every transition is classified in an explicit source-audited table. English paragraph structure is the translator's own; its source-page anchors are provenance only."}
            </p>
          )}
          {/* Both blocker classes, explicitly and separately surfaced. */}
          {/* Blocker presentation. Two things must reach the reader: WHAT is unresolved
              (`detail`) and HOW it can legitimately be resolved (`resolution`) — the durable
              source-authority rule. `resolution` was previously never rendered, and the Tamil copy
              hardcoded a temporary environment observation; both are fixed here. The provenance
              strings are authored in English, so they are marked lang="en"; Tamil UI gets concise
              Tamil presentation copy carrying the SAME authority rule (never an availability claim,
              never an inferred fact). Bounded to the two existing blocker classes. */}
          {prov.blockers?.map((b, i) => {
            const isLexical = b.item === "unresolved-lexical-join";
            return (
              <div key={i} className="mt-2 rounded-xl border border-dashed border-ink/25 bg-ink/[0.03] px-3 py-2 text-[11px] leading-relaxed text-ink/60 dark:border-white/25 dark:bg-white/[0.03] dark:text-night-text/60">
                <p lang={lang}>
                  <span className="font-semibold">
                    {ta
                      ? isLexical
                        ? `தடை — சொல் இணைவு தீர்மானிக்கப்படாத ${b.count} பக்க எல்லைகள்: `
                        : `தடை — அச்சுப் பத்தி உறவு தீர்மானிக்கப்படாத ${b.count} பக்க எல்லைகள்: `
                      : isLexical
                        ? `Blocker — ${b.count} unresolved lexical joins: `
                        : `Blocker — ${b.count} unresolved paragraph relationships: `}
                  </span>
                  {ta ? (
                    isLexical
                      ? `சரியான அச்சு இடைவெளி/இணைவு தீர்மானிக்கப்படவில்லை. இதைத் தீர்க்க, கட்டுப்படுத்தும் scan-ஐ மூலக் காப்பகமே நேரில் பரிசோதித்து அந்த அச்சு வடிவத்தைப் பதிவுசெய்ய வேண்டும்; இம்மின்னூலகம் அதைத் தானாக நிறுவுவதில்லை. அதுவரை நடுநிலைக் குறியீடு காட்டப்படுகிறது — இடைவெளியோ இணைப்போ கூறப்படவில்லை.`
                      : `அச்சுப் பத்தி உறவு தீர்மானிக்கப்படவில்லை. இதைத் தீர்க்க, கட்டுப்படுத்தும் scan-ஐ மூலக் காப்பகமே நேரில் பரிசோதித்து அந்த அச்சு அமைப்பைப் பதிவுசெய்ய வேண்டும்; இம்மின்னூலகம் அதைத் தானாக நிறுவுவதில்லை. அதுவரை நடுநிலையாகக் காட்டப்படுகிறது — பத்தித் தொடர்ச்சியோ பத்தி எல்லையோ கூறப்படவில்லை.`
                  ) : (
                    <span lang="en">{b.detail}</span>
                  )}
                </p>
                {/* The durable resolution rule. Provenance authors it in English, so it is always
                    marked lang="en"; under Tamil UI it is introduced by a short Tamil label. */}
                {b.resolution && (
                  <p className="mt-1.5 text-ink/50 dark:text-night-text/50">
                    {ta && <span className="font-semibold" lang="ta">{"தீர்வு வழி: "}</span>}
                    {!ta && <span className="font-semibold" lang="en">{"Resolution: "}</span>}
                    <span lang="en">{b.resolution}</span>
                  </p>
                )}
              </div>
            );
          })}
        </section>

        {/* VERIFICATION */}
        <section className="mt-4 rounded-2xl border border-ink/10 bg-white/50 p-5 dark:border-white/10 dark:bg-night-surface/50">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 dark:text-night-text/50">
            <FileCheck2 className="h-3.5 w-3.5" aria-hidden /> {ta ? "சரிபார்ப்பு நிலை" : "Verification state"}
          </h2>
          <dl className="mt-3">
            <Row label={ta ? "தமிழ் படியெடுப்பு" : "Tamil transcription"}>{String(prov.transcription.status)} · {prov.transcription.verified_against_scan ? (ta ? "scan-உடன் சரிபார்க்கப்பட்டது" : "verified against scan") : "—"}</Row>
            <Row label={ta ? "ஆங்கில மொழிபெயர்ப்பு" : "English translation"}>{String(prov.translation.status)}{prov.translation.type ? ` · ${String(prov.translation.type)}` : ""}</Row>
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

        {/* Notes — omitted entirely when the archive records none for this speech. */}


        {prov.notes && prov.notes.length > 0 && (
          <section className="mt-4 rounded-2xl border border-ink/10 bg-white/40 p-5 dark:border-white/10 dark:bg-night-surface/40">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 dark:text-night-text/50">{ta ? "குறிப்புகள்" : "Notes"}</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink/70 dark:text-night-text/70">
              {prov.notes!.map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink/30 dark:bg-white/30" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </section>


        )}

        <div className="mt-8 flex flex-wrap gap-2 text-sm">
          <Link href={`/speeches/${slug}`} className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 hover:border-marina/50 dark:border-white/15" lang={lang}>
            <BookOpen className="h-3.5 w-3.5 text-marina" aria-hidden /> {ta ? "உரையை வாசிக்க" : "Read the speech"}
          </Link>
        </div>
      </main>
    </div>
  );
}
