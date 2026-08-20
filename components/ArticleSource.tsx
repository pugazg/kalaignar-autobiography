"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, FileCheck2, Home, Info, Landmark, ShieldCheck } from "lucide-react";
import type { EssayProvenance } from "@/data/essays";
import { useLang } from "@/lib/i18n";

export default function ArticleSource({ slug, prov }: { slug: string; prov: EssayProvenance }) {
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
            <Link href={`/essays/${slug}`} className="focus-ring inline-flex items-center gap-1 rounded hover:text-marina dark:hover:text-marina-light">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {ta ? "நூலுக்குத் திரும்பு" : "Back to the publication"}
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
              : "This page separates source facts (the printed publication / scan) from the archive-derived reading structure."}
          </p>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        <Card icon={Landmark} title={ta ? "மூல உண்மைகள் (அச்சிட்ட நூல்)" : "Source facts (the printed publication)"}>
          <dl className="mt-3">
            <Row label={ta ? "படைப்பு" : "Work"}><span className="font-tamil" lang="ta">{s.titleTa}</span></Row>
            <Row label={ta ? "ஆங்கிலத் தலைப்பு" : "English title"}>
              {s.titleEn} <span className="text-ink/45 dark:text-night-text/45">({ta ? "திட்டத்தால் உருவாக்கப்பட்ட மொழிபெயர்ப்புத் தலைப்பு — மூல நூலில் அச்சிடப்பட்டதல்ல" : "project-created translation title — not printed in the Tamil source edition"})</span>
            </Row>
            <Row label={ta ? "ஆசிரியர்" : "Author"}><span className="font-tamil" lang="ta">{s.authorTa}</span></Row>
            <Row label={ta ? "மூல களஞ்சியம்" : "Source repository"} mono>{prov.sourceRepo}</Row>
            <Row label={ta ? "மூலப் பாதை" : "Source path"} mono>{prov.sourcePath}</Row>
            <Row label={ta ? "மூல commit" : "Source commit"} mono>{prov.sourceCommit}</Row>
            <Row label={ta ? "கட்டுப்படுத்தும் scan" : "Controlling scan"} mono>{s.scanFilename}</Row>
            <Row label="SHA-256" mono>{s.scanSha256}</Row>
            <Row label={ta ? "அளவு" : "Size"}>{s.scanFileSizeBytes.toLocaleString("en-US")} {ta ? "பைட்டுகள்" : "bytes"}</Row>
            <Row label={ta ? "மொத்த scan பக்கங்கள்" : "Physical scans"}>{s.scanTotalPages} · {s.physicalVerification}</Row>
            <Row label={ta ? "கண்பார்வை உரைச் சரிபார்ப்பு" : "Strict text fidelity"}>{s.strictFidelityReview}</Row>
            <Row label={ta ? "கட்டுரைத் தொகுப்புகள்" : "Article assemblies"}>{s.articleAssemblies}</Row>
            <Row label={ta ? "தீர்க்கப்படாத தமிழ் சிக்கல்கள்" : "Unresolved Tamil fidelity items"}>{s.unresolvedTamilFidelityItems}</Row>
            <Row label={ta ? "அச்சுப் பக்கங்கள்" : "Printed page count"}>{s.printedPageCount}</Row>
            <Row label={ta ? "மூல PDF" : "Source PDF"}>{ta ? "இந்தக் களஞ்சியத்திற்குள் சேமிக்கப்படவில்லை" : "not vendored into this repository"}</Row>
          </dl>
          {/* EDITION DISTINCTION — kept explicit so the controlling 2018 reprint is never read as a
              1956 scan, and the 1956 first-edition history is never erased. */}
          <div className="mt-3 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-4 py-3 text-xs leading-relaxed text-ink/70 dark:text-night-text/70">
            <p className="font-semibold text-ink/80 dark:text-night-text/80">{ta ? "பதிப்பு வேறுபாடு" : "Edition distinction"}</p>
            <p className="mt-1">
              {ta ? "முதற்பதிப்பு: " : "First edition: "}<span className="font-tamil" lang="ta">{s.firstEditionTa}</span>
            </p>
            <p className="mt-1">
              {ta ? "இங்கே பயன்படுத்திய கட்டுப்படுத்தும் பதிப்பு: " : "Controlling edition integrated here: "}
              <span className="font-tamil" lang="ta">{s.controllingEditionTa}</span> · <span className="font-tamil" lang="ta">{s.titlePagePublisherTa}</span>
            </p>
            <p className="mt-1.5 italic">
              {ta
                ? "இந்த ஒருங்கிணைப்பு 2018 மறுபதிப்பின் scan-ஐ அடிப்படையாகக் கொண்டது; இது 1956 அச்சுப் பிரதியின் scan அல்ல."
                : "This integration is based on the 2018 reprint scan; it is not a scan of the 1956 physical edition."}
            </p>
          </div>
        </Card>

        <Card icon={BookOpen} title={ta ? `கட்டுரை வரைபடம் — ${s.articleMap.length}` : `Article map — ${s.articleMap.length} articles`}>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-ink/10 text-[10px] uppercase tracking-wider text-ink/45 dark:border-white/10 dark:text-night-text/45">
                  <th scope="col" className="py-1.5 pr-3 font-medium">#</th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">{ta ? "தலைப்பு (அச்சுத் தலைப்புப் பக்கம்)" : "Title (heading page)"}</th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">{ta ? "ஆங்கிலம்" : "English"}</th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">Scan</th>
                  <th scope="col" className="py-1.5 font-medium">{ta ? "அச்சு" : "Printed"}</th>
                </tr>
              </thead>
              <tbody>
                {s.articleMap.map((a) => (
                  <tr key={a.number} className="border-b border-ink/5 align-top dark:border-white/5">
                    <td className="py-1.5 pr-3 tabular-nums text-ink/60 dark:text-night-text/60">{a.number}</td>
                    <td className="py-1.5 pr-3 font-tamil text-ink/85 dark:text-night-text/85" lang="ta">
                      {a.titleTa}
                      {a.contentsTitleTa && (
                        <span className="mt-0.5 block text-[11px] italic text-ink/45 dark:text-night-text/45">
                          {ta ? "பொருளடக்கம்: " : "contents page: "}{a.contentsTitleTa}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 pr-3 text-ink/70 dark:text-night-text/70">{a.titleEn}</td>
                    <td className="py-1.5 pr-3 tabular-nums text-ink/55 dark:text-night-text/55">{a.scanPages}</td>
                    <td className="py-1.5 tabular-nums text-ink/55 dark:text-night-text/55">{a.printedPages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ink/50 dark:text-night-text/50" lang={ta ? "ta" : "en"}>
            {ta
              ? "1–14 என்ற எண்கள் அச்சிடப்பட்ட பொருளடக்கத்தில் உள்ளவை; ஒவ்வொரு கட்டுரை எல்லையும் அதன் தலைப்புப் பக்கத்துடன் ஒப்பிட்டு உறுதிப்படுத்தப்பட்டது. இவை காப்பகம் உருவாக்கிய வழிசெலுத்தல் எண்கள் அல்ல."
              : "The numbers 1–14 are printed in the publication's own contents page, and every article boundary was verified against its heading page. They are source-supported publication ordering, not archive-created navigation numbering."}
          </p>
          <div className="mt-3 space-y-1.5">
            {s.titleWitnessNotes.map((n, i) => (
              <p key={i} className="text-xs leading-relaxed text-ink/65 dark:text-night-text/65" lang="en">{n}</p>
            ))}
          </div>
        </Card>

        <Card icon={FileCheck2} title={ta ? "ஆங்கில வெளியீடு" : "English release"}>
          <dl className="mt-3">
            <Row label={ta ? "தலைப்பு" : "Title"}>{e.releaseTitle}</Row>
            <Row label={ta ? "வகை" : "Kind"}>{e.kind}</Row>
            <Row label={ta ? "கட்டுரைகள்" : "Articles"}>{e.articlesVerified}</Row>
            <Row label={ta ? "ஒருமைப்பாட்டு மதிப்பீடு" : "Consistency review"}>{e.consistencyReview}</Row>
            <Row label={ta ? "வெளியீட்டு நிறைவு" : "Release closeout"}>{e.releaseCloseout}</Row>
            <Row label={ta ? "வெளியீட்டு வாயில்" : "Release gate"}>{e.releaseGate}</Row>
            <Row label={ta ? "தீர்க்கப்படாத கேள்விகள் / தடைகள்" : "Unresolved questions / blockers"}>{e.unresolvedTranslationQuestions} / {e.releaseBlockers}</Row>
          </dl>
          <p className="mt-3 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">
            {e.translatorNotesSeparated}
          </p>
          <ul className="mt-2 space-y-1.5">
            {e.labelPolicy.map((n, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-ink/65 dark:text-night-text/65" lang="en">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-marina" aria-hidden />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card icon={BookOpen} title={ta ? "காப்பகத்தால் உருவான அமைப்பு" : "Archive-derived reading structure"}>
          <dl className="mt-3">
            <Row label={ta ? "கட்டுரைகள்" : "Articles"}>{d.articles}</Row>
            <Row label={ta ? "தமிழ் தொகுதிகள்" : "Tamil blocks"}>{d.tamilBlocks} · {ta ? "மேற்கோள்" : "quotations"} {d.tamilQuotations} · {ta ? "துணைத்தலைப்பு" : "subheadings"} {d.tamilSubheadings}</Row>
            <Row label={ta ? "ஆங்கிலத் தொகுதிகள்" : "English blocks"}>{d.englishBlocks} · {ta ? "மேற்கோள்" : "quotations"} {d.englishQuotations} · {ta ? "துணைத்தலைப்பு" : "subheadings"} {d.englishSubheadings}</Row>
            <Row label={ta ? "மொழிபெயர்ப்பாளர் குறிப்புகள்" : "Translator notes"}>{d.translatorNotes} ({ta ? "உரைக்கு வெளியே" : "held outside the body"})</Row>
            <Row label={ta ? "பக்க மாற்றங்கள்" : "Page transitions audited"}>{d.pageTransitionsAudited}</Row>
            <Row label={ta ? "ஒரே தொகுதி (மூலத்தால் நிறுவப்பட்டது)" : "Same block (source-established)"}>{d.relationSameBlock}</Row>
            <Row label={ta ? "தொகுதி எல்லை" : "Block boundary"}>{d.relationBlockBoundary}</Row>
            <Row label={ta ? "தீர்மானிக்கப்படாதவை" : "Unresolved"}>{d.relationUnknown}</Row>
            <Row label={ta ? "பக்கங்களைக் கடக்கும் தொகுதிகள்" : "Blocks spanning printed pages"}>{d.crossPageBlocks}</Row>
          </dl>
          <p className="mt-3 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">
            {d.boundaryNote}
          </p>
          <p className="mt-2 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">
            {d.provenanceGranularity}
          </p>
        </Card>

        <Card icon={Info} title={ta ? "கட்டுரைப் பகுதியிலிருந்து விலக்கப்பட்டவை" : "Locked exclusions from every article body"}>
          <ul className="mt-3 space-y-1.5 text-sm text-ink/80 dark:text-night-text/80">
            {s.lockedExclusions.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-marina" aria-hidden />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </Card>

        {prov.blockers && prov.blockers.length > 0 && (
          <Card icon={Info} title={ta ? "தீர்க்கப்படாதவை (மூல உண்மை)" : "Open blockers (source facts)"}>
            {prov.blockers.map((b, i) => (
              <div key={i} className="mt-3 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-4 py-3 text-xs leading-relaxed text-ink/75 dark:text-night-text/75">
                <p className="font-semibold" lang="en">{b.item} — {b.count}</p>
                <p className="mt-1.5" lang="en">{b.detail}</p>
                <p className="mt-2 italic" lang="en">{b.resolution}</p>
              </div>
            ))}
          </Card>
        )}

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
            <p>{pr.quotedThirdPartyNote}</p>
            <p className="italic">{pr.evidencePending}</p>
          </div>
        </Card>

        <Card icon={Info} title={ta ? "குறிப்புகள்" : "Notes"}>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/80 dark:text-night-text/80">
            {prov.notes.map((n, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-marina" aria-hidden />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </Card>
      </main>
    </div>
  );
}
