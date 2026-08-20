"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, FileCheck2, Film, Home, Info, Landmark, ShieldCheck } from "lucide-react";
import type { NovelProvenance } from "@/data/novels";
import { useLang } from "@/lib/i18n";

export default function NovelSource({ slug, prov }: { slug: string; prov: NovelProvenance }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const s = prov.source;
  const e = prov.english;
  const d = prov.archiveDerived;
  const pr = prov.projectRights;

  const Row = ({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) => (
    <div className="grid gap-0.5 border-b border-ink/5 py-2.5 last:border-0 dark:border-white/5 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-4">
      <dt className="text-xs text-ink/45 dark:text-night-text/45">{label}</dt>
      <dd className={mono ? "break-all font-mono text-[11px] leading-relaxed text-ink/70 dark:text-night-text/70" : "text-sm text-ink/85 dark:text-night-text/85"}>{children}</dd>
    </div>
  );
  const Card = ({ icon: Icon, title, children }: { icon: typeof Landmark; title: string; children: React.ReactNode }) => (
    <section className="mt-6 rounded-2xl border border-ink/10 bg-white/50 p-5 first:mt-0 dark:border-white/10 dark:bg-night-surface/50">
      <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-marina dark:text-marina-light">
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
            <Link href={`/novels/${slug}`} className="focus-ring inline-flex items-center gap-1 rounded hover:text-marina dark:hover:text-marina-light">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {ta ? "நூலுக்குத் திரும்பு" : "Back to the novel"}
            </Link>
            <Link href="/read" className="focus-ring inline-flex items-center gap-1 rounded hover:text-marina dark:hover:text-marina-light" aria-label={ta ? "மின்னூலகம்" : "Library"}>
              <Home className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <h1 className="mt-5 font-display text-3xl font-medium tracking-tight">{ta ? "மூலமும் சான்றும்" : "Source & provenance"}</h1>
          <p className="mt-1 font-tamil text-lg text-marina/80 dark:text-marina-light/80" lang="ta">{s.titleTa}</p>
          <p className="font-display text-sm text-ink/55 dark:text-night-text/55">{s.titleEn}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/65 dark:text-night-text/65" lang={ta ? "ta" : "en"}>
            {ta
              ? "இப்பக்கம் மூல உண்மைகளையும் (அச்சிட்ட நூல்/scan) காப்பகத்தால் உருவாக்கப்பட்ட வாசிப்பு அமைப்பையும் வேறுபடுத்திக் காட்டுகிறது."
              : "This page separates source facts (the printed book / scan) from the archive-derived reading structure."}
          </p>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        <Card icon={Landmark} title={ta ? "மூல உண்மைகள் (அச்சிட்ட நூல்)" : "Source facts (the printed book)"}>
          <dl className="mt-3">
            <Row label={ta ? "படைப்பு" : "Work"}><span className="font-tamil" lang="ta">{s.titleTa}</span> · {s.titleEn}</Row>
            <Row label={ta ? "ஆசிரியர்" : "Author"}><span className="font-tamil" lang="ta">{s.authorTa}</span></Row>
            <Row label={ta ? "மூல களஞ்சியம்" : "Source repository"} mono>{prov.sourceRepo}</Row>
            <Row label={ta ? "மூலப் பாதை" : "Source path"} mono>{prov.sourcePath}</Row>
            <Row label={ta ? "மூல commit" : "Source commit"} mono>{prov.sourceCommit}</Row>
            <Row label={ta ? "கட்டுப்படுத்தும் scan" : "Controlling scan"} mono>{s.scanFilename}</Row>
            <Row label="SHA-256" mono>{s.scanSha256}</Row>
            <Row label={ta ? "அளவு" : "Size"}>{s.scanFileSizeBytes.toLocaleString("en-US")} {ta ? "பைட்டுகள்" : "bytes"}</Row>
            <Row label={ta ? "மொத்த scan பக்கங்கள்" : "Physical scans"}>{s.scanTotalPages} · {s.pageRecordsVerified}</Row>
            <Row label={ta ? "மூல தணிக்கை" : "Source audit"}>{s.sourceAudit}</Row>
            <Row label={ta ? "தொகுக்கப்பட்ட அடுக்கு" : "Assembled layer"}>{s.assembledLayer}</Row>
            <Row label={ta ? "நூல் பகுதி" : "Body scans"}>{s.bodyScans}</Row>
            <Row label={ta ? "பதிப்பு" : "Edition"}><span className="font-tamil" lang="ta">{s.editionTa}</span></Row>
            <Row label={ta ? "பதிப்பகம்" : "Publisher"}><span className="font-tamil" lang="ta">{s.publisherTa}, {s.placeTa}</span></Row>
            <Row label={ta ? "தொடர்" : "Series"}><span className="font-tamil" lang="ta">{s.seriesTa}</span></Row>
            <Row label={ta ? "விலை (அச்சிட்டபடி)" : "Price (as printed)"}><span className="font-tamil" lang="ta">{s.priceTa}</span></Row>
            <Row label={ta ? "அச்சகம்" : "Printer"}><span className="font-tamil" lang="ta">{s.printerTa}</span></Row>
            <Row label={ta ? "அச்சிட்ட குறியீடு" : "Printed code"} mono>{s.printedCode}</Row>
            <Row label={ta ? "மூல PDF" : "Source PDF"}>{ta ? "இந்தக் களஞ்சியத்திற்குள் சேமிக்கப்படவில்லை" : "not vendored into this repository"}</Row>
          </dl>
          <p className="mt-3 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">
            {s.printedPageNumbering}
          </p>
        </Card>

        {/* THE EMBEDDED-SEQUENCE RULE — the most important structural fact about this work. */}
        <Card icon={Film} title={ta ? "உள்ளமைந்த திரைப்படக் காட்சி" : "The embedded sequence"}>
          <p className="mt-3 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-4 py-3 text-xs leading-relaxed text-ink/75 dark:text-night-text/75" lang="en">
            {s.embeddedSequenceNote}
          </p>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45 dark:text-night-text/45">
            {ta ? "மூலத் தொடர்ச்சி" : "Source continuity"}
          </p>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70">
            {s.sourceContinuity.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-marina" aria-hidden />
                <span lang="en">{x}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3">
            <Row label={ta ? "உள்ளமைந்த பகுதிகள்" : "Embedded-sequence sections"}>{d.embeddedSequenceSections} {ta ? "(தனி நூல் அல்ல)" : "(never a separate work)"}</Row>
          </dl>
        </Card>

        <Card icon={FileCheck2} title={ta ? "ஆங்கில வெளியீடு" : "English release"}>
          <dl className="mt-3">
            <Row label={ta ? "வகை" : "Kind"}>{e.kind}</Row>
            <Row label={ta ? "நிலை" : "Status"}>{e.status}</Row>
            <Row label={ta ? "தொகுதிகள்" : "Batches"}>{e.batches}</Row>
            <Row label={ta ? "உரைப் பரப்பு" : "Body coverage"}>{e.bodyCoverage}</Row>
            <Row label={ta ? "இருமொழி ஒப்பீடு" : "Bilingual alignment"}>{e.bilingualAlignment}</Row>
            <Row label={ta ? "வெளியீட்டுத் தயார்நிலை" : "Release readiness"}>{e.releaseReadiness}</Row>
          </dl>
          <p className="mt-3 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">
            {e.translatorNotesSeparated}
          </p>
        </Card>

        <Card icon={BookOpen} title={ta ? "காப்பகத்தால் உருவான அமைப்பு" : "Archive-derived reading structure"}>
          <dl className="mt-3">
            <Row label={ta ? "பகுதிகள்" : "Sections"}>{d.sections}</Row>
            <Row label={ta ? "தமிழ்" : "Tamil"}>
              {d.tamilBlocks} {ta ? "தொகுதிகள்" : "blocks"} · {d.tamilParagraphs} {ta ? "பத்திகள்" : "paragraphs"} · {d.tamilHeadings} {ta ? "தலைப்புகள்" : "headings"} · {d.tamilBlocksWithLineBreaks} {ta ? "வரி முறிவுள்ளவை" : "with source line breaks"}
            </Row>
            <Row label={ta ? "ஆங்கிலம்" : "English"}>
              {d.englishBlocks} {ta ? "தொகுதிகள்" : "blocks"} · {d.englishParagraphs} {ta ? "பத்திகள்" : "paragraphs"} · {d.englishHeadings} {ta ? "தலைப்புகள்" : "headings"} · {d.englishBlocksWithLineBreaks} {ta ? "வரி முறிவுள்ளவை" : "with source line breaks"}
            </Row>
            <Row label={ta ? "அச்சு அலங்காரங்கள்" : "Printed ornaments"}>{d.ornaments}</Row>
            <Row label={ta ? "மொழிபெயர்ப்பாளர் குறிப்புகள்" : "Translator notes"}>{d.translatorNotes} ({ta ? "உரைக்கு வெளியே" : "held outside the body"})</Row>
            <Row label={ta ? "மூலத்தால் நிறுவப்பட்ட இணைப்புகள்" : "Source-established joins"}>{d.sourceEstablishedJoins}</Row>
            <Row label={ta ? "அச்சிடப்பட்ட தலைப்புகள்" : "Headings the edition prints"}>
              {d.printedHeadingsInSource.map((h) => `${h.text} (${ta ? "ஸ்கேன்" : "scan"} ${h.scans.join(", ")})`).join(" · ")}
            </Row>
          </dl>

          {/* Section titles are the archive's labels. Only a heading the 1947 edition actually
              prints is carried in the reading body, and only cited to the scan that prints it. */}
          <p className="mt-3 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang={ta ? "ta" : "en"}>
            {ta
              ? `பகுதித் தலைப்புகள் மூலக் காப்பகத்தின் வாசிப்புப் பிரிவுகளுக்கான விளக்கக் குறிப்புகள். அச்சிடப்பட்ட தலைப்பு எதுவோ அதுமட்டுமே — அதை அச்சிட்ட ஸ்கேன் மேற்கோளுடன் — வாசிப்பு உரையில் இடம்பெறுகிறது. ${d.sectionsWithArchiveOnlyTitle} பகுதியின் தலைப்பு அச்சில் இல்லாததால் அது உரையிலிருந்து விலக்கப்பட்டு, எந்தப் பக்கச் சான்றும் அதற்குக் கூறப்படவில்லை.`
              : `Section titles are the archive's descriptive labels for its reading divisions. Only a heading the edition actually prints is carried in the reading body, and only cited to the scan that prints it. ${d.sectionsWithArchiveOnlyTitle} section's label is printed nowhere in the edition, so it was kept out of the body and no page provenance is claimed for it.`}
          </p>
          <p className="mt-3 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">
            {d.joinNote}
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[26rem] border-collapse text-left text-xs">
              <caption className="sr-only">{ta ? "மூலத் தணிக்கை நிறுவிய பக்க இணைப்புகள்" : "Cross-page joins established by the source audit"}</caption>
              <thead>
                <tr className="border-b border-ink/10 text-[10px] uppercase tracking-wider text-ink/45 dark:border-white/10 dark:text-night-text/45">
                  <th scope="col" className="py-1.5 pr-3 font-medium">{ta ? "இணைப்பு" : "Join"}</th>
                  <th scope="col" className="py-1.5 font-medium">{ta ? "மூலச் சான்று" : "Source evidence"}</th>
                </tr>
              </thead>
              <tbody>
                {d.joins.map((j) => (
                  <tr key={`${j.fromScan}-${j.toScan}`} className="border-b border-ink/5 align-top dark:border-white/5">
                    <td className="py-1.5 pr-3 tabular-nums text-ink/80 dark:text-night-text/80">{j.fromScan} → {j.toScan}</td>
                    <td className="py-1.5 text-ink/60 dark:text-night-text/60">{j.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">
            {d.provenanceGranularity}
          </p>
        </Card>

        <Card icon={Info} title={ta ? "வாசிப்புப் பகுதியிலிருந்து விலக்கப்பட்டவை" : "Locked exclusions from the reading body"}>
          <ul className="mt-3 space-y-1.5 text-sm text-ink/80 dark:text-night-text/80">
            {s.lockedExclusions.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-marina" aria-hidden />
                <span lang="en">{x}</span>
              </li>
            ))}
          </ul>
        </Card>

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
            <p>{pr.archivalStatusNote}</p>
            <p className="italic">{pr.evidencePending}</p>
          </div>
        </Card>

        <Card icon={Info} title={ta ? "குறிப்புகள்" : "Notes"}>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/80 dark:text-night-text/80">
            {prov.notes.map((n, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-marina" aria-hidden />
                <span lang="en">{n}</span>
              </li>
            ))}
          </ul>
        </Card>
      </main>
    </div>
  );
}
