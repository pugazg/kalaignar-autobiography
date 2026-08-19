"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, FileCheck2, Home, Info, Landmark, Radio, ShieldCheck } from "lucide-react";
import type { PoemProvenance } from "@/data/poems";
import { useLang } from "@/lib/i18n";

export default function PoemSource({ slug, prov }: { slug: string; prov: PoemProvenance }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const s = prov.source;
  const v = prov.verification;
  const d = prov.archiveDerived;
  const pr = prov.projectRights;

  const Row = ({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) => (
    <div className="grid gap-0.5 border-b border-ink/5 py-2.5 last:border-0 dark:border-white/5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-4">
      <dt className="text-xs text-ink/45 dark:text-night-text/45">{label}</dt>
      <dd className={mono ? "break-all font-mono text-[11px] leading-relaxed text-ink/70 dark:text-night-text/70" : "text-sm text-ink/85 dark:text-night-text/85"}>{children}</dd>
    </div>
  );

  const Card = ({ icon: Icon, title, children }: { icon: typeof Landmark; title: string; children: React.ReactNode }) => (
    <section className="mt-6 rounded-2xl border border-ink/10 bg-white/50 p-5 first:mt-0 dark:border-white/10 dark:bg-night-surface/50">
      <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brass">
        <Icon className="h-3.5 w-3.5" aria-hidden /> {title}
      </h2>
      {children}
    </section>
  );

  return (
    <div className="min-h-screen bg-paper pb-24 dark:bg-night dark:text-night-text">
      <header className="border-b border-ink/10 bg-mist/40 dark:border-white/10 dark:bg-night-surface/40">
        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
          <div className="flex items-center gap-3 text-xs text-ink/60 dark:text-night-text/60">
            <Link href={`/poems/${slug}`} className="focus-ring inline-flex items-center gap-1 rounded hover:text-brass">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {ta ? "கவிதைக்குத் திரும்பு" : "Back to the poem"}
            </Link>
            <Link href="/read" className="focus-ring inline-flex items-center gap-1 rounded hover:text-brass" aria-label={ta ? "மின்னூலகம்" : "Library"}>
              <Home className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <h1 className="mt-5 font-display text-3xl font-medium tracking-tight">{ta ? "மூலமும் சான்றும்" : "Source & provenance"}</h1>
          <p className="mt-1 font-tamil text-lg text-brass" lang="ta">{s.titleTa}</p>
          <p className="font-display text-sm text-ink/55 dark:text-night-text/55">{s.titleEn}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/65 dark:text-night-text/65" lang={lang}>
            {ta
              ? "இப்பக்கம் மூல உண்மைகளையும் (அச்சிட்ட நூல்/scan) காப்பகத்தால் உருவாக்கப்பட்ட வாசிப்பு அமைப்பையும் வேறுபடுத்திக் காட்டுகிறது."
              : "This page separates source facts (the printed booklet / scan) from the archive-derived reading structure."}
          </p>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        {/* WORK + SOURCE FACTS */}
        <Card icon={Landmark} title={ta ? "மூல உண்மைகள் (அச்சிட்ட நூல்)" : "Source facts (the printed booklet)"}>
          <dl className="mt-3">
            <Row label={ta ? "படைப்பு" : "Work"}>
              <span className="font-tamil" lang="ta">{s.titleTa}</span> · {s.titleEn}
            </Row>
            <Row label={ta ? "ஆசிரியர்" : "Author"}>
              <span className="font-tamil" lang="ta">{s.authorTa}</span> · {s.authorEn}
            </Row>
            <Row label={ta ? "மூல களஞ்சியம்" : "Source repository"} mono>{prov.sourceRepo}</Row>
            <Row label={ta ? "மூலப் பாதை" : "Source path"} mono>{prov.sourcePath}</Row>
            <Row label={ta ? "மூல commit" : "Source commit"} mono>{prov.sourceCommit}</Row>
            <Row label={ta ? "கட்டுப்படுத்தும் scan" : "Controlling scan"} mono>{s.scanFilename}</Row>
            <Row label="SHA-256" mono>{s.scanSha256}</Row>
            <Row label={ta ? "அளவு" : "Size"}>{s.scanFileSizeBytes.toLocaleString("en-US")} {ta ? "பைட்டுகள்" : "bytes"}</Row>
            <Row label={ta ? "மொத்த scan பக்கங்கள்" : "Physical scans"}>{s.scanTotalPages} · {ta ? "சரிபார்ப்பு" : "verification"} {s.physicalVerification}</Row>
            <Row label={ta ? "கவிதைப் பகுதி" : "Poem body"}>
              {ta ? "scan" : "scans"} {s.poemScanPages} · {ta ? "சரிபார்ப்பு" : "verification"} {s.poemVerification}
            </Row>
            <Row label={ta ? "அச்சுப் பக்க எண்கள்" : "Printed pages"}>{s.printedPageMapping}</Row>
            <Row label={ta ? "மூல PDF" : "Source PDF"}>{ta ? "இந்தக் களஞ்சியத்திற்குள் சேமிக்கப்படவில்லை" : "not vendored into this repository"}</Row>
          </dl>
          <p className="mt-3 rounded-xl border border-dashed border-brass/40 bg-brass/[0.06] px-4 py-2.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
            {ta ? "scan 26: அச்சிடப்பட்ட பக்க எண் எதுவும் தெரியவில்லை. " : "Scan 26: no visible printed page number. "}
            {s.unnumberedScanNote}
          </p>
        </Card>

        {/* SOURCE CONTEXT — carefully separated from publication metadata. */}
        <Card icon={Radio} title={ta ? "மூலச் சூழல் (கவிதைக்கு மேலே அச்சிட்டது)" : "Source context (printed above the poem)"}>
          <p className="mt-3 whitespace-pre-line rounded-xl border-l-2 border-brass/50 bg-brass/[0.05] py-3 pl-4 pr-4 font-tamil text-sm leading-relaxed text-ink/80 dark:text-night-text/80" lang="ta">
            {s.contextNoteTa}
          </p>
          <dl className="mt-3">
            <Row label={ta ? "அச்சிட்ட தேதி" : "Date as printed"}>{s.contextDatePrinted} <span className="text-ink/45 dark:text-night-text/45">({s.contextDateIso})</span></Row>
            <Row label={ta ? "இடம்" : "Venue"}><span className="font-tamil" lang="ta">{s.contextVenueTa}</span> · {s.contextVenueEn}</Row>
            <Row label={ta ? "நிகழ்வு" : "Occasion"}><span className="font-tamil" lang="ta">{s.contextOccasionTa}</span> · {s.contextOccasionEn}</Row>
          </dl>
          {/* THE PUBLICATION RULE, stated plainly on the public page. */}
          <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-ink/[0.02] px-4 py-3 text-xs leading-relaxed text-ink/70 dark:border-white/20 dark:bg-white/[0.03] dark:text-night-text/70" lang={lang}>
            <p className="font-semibold text-ink/80 dark:text-night-text/80">{ta ? "வெளியீட்டுத் தேதி — நிறுவப்படவில்லை" : "Publication date — NOT established"}</p>
            <p className="mt-1">{s.publicationNotEstablished}</p>
            <p className="mt-2">{s.forewordDateNote}</p>
          </div>
        </Card>

        {/* VERIFICATION */}
        <Card icon={FileCheck2} title={ta ? "சரிபார்ப்பு நிலை" : "Verification state"}>
          <dl className="mt-3">
            <Row label={ta ? "தமிழ் தொகுப்பு" : "Tamil assembly"}>{v.tamilAssembly}</Row>
            <Row label={ta ? "தமிழ் வேறுபாடுகள்" : "Tamil discrepancies"}>{v.tamilDiscrepancies}</Row>
            <Row label={ta ? "ஆங்கில வெளியீடு" : "English release"}>{v.englishRelease} · {ta ? "திட்டத்தால் உருவாக்கப்பட்டது" : "project-created translation"}</Row>
            <Row label={ta ? "ஆங்கிலத் தொகுதிகள்" : "English batches"}>{v.englishBatches}</Row>
            <Row label={ta ? "விடுபடல் / இரட்டிப்பு" : "Omissions / duplications"}>{v.englishOmissions} / {v.englishDuplications}</Row>
            <Row label={ta ? "முழுக் கவிதை மதிப்பீடு" : "Full-poem review"}>{v.fullPoemVoiceReview}</Row>
          </dl>
        </Card>

        {/* ARCHIVE-DERIVED STRUCTURE — the two dimensions kept strictly apart. */}
        <Card icon={BookOpen} title={ta ? "காப்பகத்தால் உருவான அமைப்பு" : "Archive-derived reading structure"}>
          <dl className="mt-3">
            <Row label={ta ? "தமிழ்" : "Tamil"}>
              {d.tamilLines} {ta ? "மூல வரிகள்" : "source lines"} · {d.tamilInPageStanzaBreaks} {ta ? "பக்கத்திற்குள் பத்தி இடைவெளிகள்" : "in-page stanza breaks"} · {d.tamilVerseRuns} {ta ? "பாடல் தொகுதிகள்" : "verse runs"} · {d.tamilIndentedLines} {ta ? "இடைவெளியிட்ட வரிகள்" : "indented lines"}
            </Row>
            <Row label={ta ? "ஆங்கிலம்" : "English"}>
              {d.englishLines} {ta ? "வரிகள்" : "lines"} · {d.englishInPageStanzaBreaks} {ta ? "பக்கத்திற்குள் பத்தி இடைவெளிகள்" : "in-page stanza breaks"} · {d.englishVerseRuns} {ta ? "பாடல் தொகுதிகள்" : "verse runs"} · {d.englishIndentedLines} {ta ? "இடைவெளியிட்ட வரிகள்" : "indented lines"}
            </Row>
            <Row label={ta ? "மூலத்தால் நிறுவப்பட்ட பத்திகள்" : "Source-established stanzas"}>
              {ta ? "தமிழ்" : "Tamil"} {d.tamilSourceEstablishedStanzas} · {ta ? "ஆங்கிலம்" : "English"} {d.englishSourceEstablishedStanzas}
            </Row>
          </dl>
          <p className="mt-3 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">
            {d.terminologyNote}
          </p>
          <p className="mt-2 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">
            {d.provenanceGranularity}
          </p>
        </Card>

        {/* SOURCE AUTHORITY — page transitions: textual continuity vs typographic stanza relation. */}
        <Card icon={FileCheck2} title={ta ? "பக்க மாற்றங்கள் — மூலச் சான்று" : "Page transitions — source authority"}>
          <dl className="mt-3">
            <Row label={ta ? "இயற்பியல் பக்க மாற்றங்கள்" : "Physical page transitions"}>{d.pageTransitionsAudited}</Row>
          </dl>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45 dark:text-night-text/45">
            {ta ? "உரை / சொல்லாட்சித் தொடர்ச்சி" : "Textual / rhetorical continuity"}
          </p>
          <dl className="mt-1">
            <Row label={ta ? "மூலத்தால் பதிவான தொடர்ச்சி" : "Source-recorded continuation"}>{d.textualContinuations}</Row>
            <Row label={ta ? "மூலத்தால் பதிவான தொடர்ச்சியின்மை" : "Source-recorded non-continuation"}>{d.textualNonContinuations}</Row>
            <Row label={ta ? "தனியாகப் பதிவு செய்யப்படவில்லை" : "Not specifically recorded"}>{d.textualNotRecorded}</Row>
          </dl>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45 dark:text-night-text/45">
            {ta ? "அச்சுப் பத்தித் தொடர்பு" : "Typographic stanza relationship"}
          </p>
          <dl className="mt-1">
            <Row label={ta ? "மூலத்தால் நிறுவப்பட்ட ஒரே பத்தி" : "Source-established continuation"}>{d.stanzaRelationSameStanza}</Row>
            <Row label={ta ? "மூலத்தால் நிறுவப்பட்ட பத்தி எல்லை" : "Source-established stanza boundary"}>{d.stanzaRelationStanzaBoundary}</Row>
            <Row label={ta ? "தீர்மானிக்கப்படாதவை" : "Unresolved"}>{d.stanzaRelationUnresolved}</Row>
          </dl>

          <p className="mt-3 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">
            {d.boundaryNote}
          </p>

          {/* The full per-transition audit table, so a reviewer can check every classification. */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left text-xs">
              <caption className="sr-only">{ta ? "ஒவ்வொரு பக்க மாற்றத்திற்கும் மூலச் சான்று" : "Source evidence for each physical page transition"}</caption>
              <thead>
                <tr className="border-b border-ink/10 text-[10px] uppercase tracking-wider text-ink/45 dark:border-white/10 dark:text-night-text/45">
                  <th scope="col" className="py-1.5 pr-3 font-medium">{ta ? "மாற்றம்" : "Transition"}</th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">{ta ? "உரைத் தொடர்பு" : "Textual"}</th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">{ta ? "பத்தித் தொடர்பு" : "Stanza"}</th>
                  <th scope="col" className="py-1.5 font-medium">{ta ? "மேற்கோள்கள்" : "Citations"}</th>
                </tr>
              </thead>
              <tbody>
                {d.transitions.map((t) => (
                  <tr key={`${t.fromScan}-${t.toScan}`} className="border-b border-ink/5 align-top dark:border-white/5">
                    <td className="py-1.5 pr-3 tabular-nums text-ink/80 dark:text-night-text/80">{t.fromScan} → {t.toScan}</td>
                    <td className="py-1.5 pr-3 text-ink/70 dark:text-night-text/70" lang="en">{t.textualRelation}</td>
                    <td className="py-1.5 pr-3 font-medium text-ink/80 dark:text-night-text/80" lang="en">{t.stanzaRelation}</td>
                    <td className="py-1.5 text-ink/55 dark:text-night-text/55" lang="en">
                      {ta ? "பத்தி" : "stanza"} {t.stanzaEvidence.length} · {ta ? "உரை" : "textual"} {t.textualEvidence.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-ink/50 dark:text-night-text/50" lang={lang}>
            {ta
              ? "உரைத் தொடர்ச்சி என்பது அச்சுப் பத்தித் தொடர்பை நிறுவுவதில்லை: ஒரு வாக்கியமோ மேற்கோளோ அச்சுப் பத்தி எல்லையையும் கடந்து தொடரலாம்."
              : "A textual continuation does not establish the printed stanza relationship: a sentence or a quotation can run on across a printed stanza break."}
          </p>
        </Card>

        {/* BLOCKERS */}
        {prov.blockers && prov.blockers.length > 0 && (
          <Card icon={Info} title={ta ? "தீர்க்கப்படாதவை (மூல உண்மை)" : "Open blockers (source facts)"}>
            {prov.blockers.map((b, i) => (
              <div key={i} className="mt-3 rounded-xl border border-dashed border-brass/40 bg-brass/[0.06] px-4 py-3 text-xs leading-relaxed text-ink/75 dark:text-night-text/75">
                <p className="font-semibold text-ink/85 dark:text-night-text/85" lang="en">
                  {b.item} — {b.count}
                </p>
                <p className="mt-1.5" lang="en">{b.detail}</p>
                <p className="mt-2 italic" lang="en">{b.resolution}</p>
              </div>
            ))}
          </Card>
        )}

        {/* LOCKED EXCLUSIONS */}
        <Card icon={Info} title={ta ? "கவிதைப் பகுதியிலிருந்து விலக்கப்பட்டவை" : "Locked exclusions from the poem body"}>
          <ul className="mt-3 space-y-1.5 text-sm text-ink/80 dark:text-night-text/80">
            {s.lockedExclusions.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brass" aria-hidden />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* RIGHTS */}
        <Card icon={ShieldCheck} title={ta ? "உரிமை நிலை" : "Rights"}>
          <dl className="mt-3">
            <Row label={ta ? "பொருந்துவது" : "Applies to"}>{pr.appliesTo}</Row>
            <Row label={ta ? "நிலை" : "Status"}>{pr.rightsStatus}</Row>
            <Row label={ta ? "அதிகாரம்" : "Authority"}>{pr.rightsAuthority} · {pr.rightsAction}</Row>
            <Row label={ta ? "அறிவிப்பு" : "Announced"}>{pr.rightsAnnouncementDate}</Row>
            <Row label={ta ? "அரசாணை எண்" : "GO number"}>{pr.governmentOrderNumber ?? (ta ? "இன்னும் சரிபார்க்கப்படவில்லை" : "not yet verified")}</Row>
            <Row label={ta ? "அரசாணை வெளியீட்டுத் தேதி" : "GO issue date"}>{pr.governmentOrderDate ?? (ta ? "இன்னும் சரிபார்க்கப்படவில்லை" : "not yet verified")}</Row>
            <Row label={ta ? "அரசாணை ஒப்படைப்பு" : "GO handover"}>{pr.governmentOrderHandoverDate}</Row>
          </dl>
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-ink/65 dark:text-night-text/65" lang="en">
            <p>{pr.distinctionNote}</p>
            <p>{pr.thirdPartyNote}</p>
            <p>{pr.projectTranslationNote}</p>
            <p className="italic">{pr.evidencePending}</p>
          </div>
        </Card>

        {/* NOTES */}
        <Card icon={Info} title={ta ? "குறிப்புகள்" : "Notes"}>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/80 dark:text-night-text/80">
            {prov.notes.map((n, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brass" aria-hidden />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </Card>
      </main>
    </div>
  );
}
