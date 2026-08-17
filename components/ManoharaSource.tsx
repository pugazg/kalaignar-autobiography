"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Database, FileCheck2, Home, Info, Landmark, ShieldCheck } from "lucide-react";
import type { ManoharaProvenance } from "@/data/manohara";
import { useLang } from "@/lib/i18n";

export default function ManoharaSource({ prov }: { prov: ManoharaProvenance }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const s = prov.source;
  const pr = prov.projectRights;

  const Row = ({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) => (
    <div className="grid gap-0.5 border-b border-ink/5 py-2.5 last:border-0 dark:border-white/5 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-4">
      <dt className="text-xs text-ink/45 dark:text-night-text/45">{label}</dt>
      <dd
        className={
          mono
            ? "break-all font-mono text-[11px] leading-relaxed text-ink/70 dark:text-night-text/70"
            : "text-sm text-ink/85 dark:text-night-text/85"
        }
      >
        {children}
      </dd>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper pb-24 dark:bg-night dark:text-night-text">
      <header className="border-b border-ink/10 bg-mist/40 dark:border-white/10 dark:bg-night-surface/40">
        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
          <div className="flex items-center gap-3 text-xs text-ink/60 dark:text-night-text/60">
            <Link
              href="/cinema/manohara"
              className="focus-ring inline-flex items-center gap-1 rounded hover:text-marina dark:hover:text-marina-light"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {ta ? "மனோகரா" : "Manohara"}
            </Link>
            <Link href="/read" className="focus-ring inline-flex items-center gap-1 rounded hover:text-marina dark:hover:text-marina-light" aria-label={ta ? "மின்னூலகம்" : "Library"}>
              <Home className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <h1 className="mt-5 font-display text-3xl font-medium tracking-tight">
            {ta ? "மனோகரா — மூலமும் சான்றும்" : "Manohara — Source & provenance"}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/65 dark:text-night-text/65" lang={lang}>
            {ta
              ? "இப்பக்கம் இரண்டு வகைத் தகவல்களை வேறுபடுத்திக் காட்டுகிறது: அச்சிடப்பட்ட நூலின் மூல உண்மைகள், மற்றும் காப்பகத்தால் உருவாக்கப்பட்ட வழிசெலுத்தல்/மேனிலைத் தரவு."
              : "This page separates two kinds of information: facts about the printed source itself, and the archive-derived navigation / metadata layered on for reading."}
          </p>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        {/* ── SOURCE FACTS ─────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-ink/10 bg-white/50 p-5 dark:border-white/10 dark:bg-night-surface/50">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-marina dark:text-marina-light">
            <Landmark className="h-3.5 w-3.5" aria-hidden /> {ta ? "மூல உண்மைகள் (அச்சிட்ட நூல்)" : "Source facts (the printed booklet)"}
          </h2>
          <dl className="mt-3">
            <Row label={ta ? "வரவு (அச்சிட்டபடி)" : "Credit (as printed)"}>
              <span className="font-tamil" lang="ta">{s.credit_role} · {s.credit_name}</span>
            </Row>
            <Row label={ta ? "பதிப்பு (அச்சிட்டபடி)" : "Edition (as printed)"}>
              <span className="font-tamil" lang="ta">{s.edition_statement_as_printed}</span>{" "}
              <span className="text-ink/45 dark:text-night-text/45">({s.publication_year_as_printed})</span>
            </Row>
            <Row label={ta ? "பதிப்பகம்" : "Publisher"}>
              <span className="font-tamil" lang="ta">{s.publisher_name}</span>
            </Row>
            <Row label={ta ? "அச்சகம் (அச்சிட்டபடி)" : "Printer (as printed)"}>{s.printer_as_printed}</Row>
            <Row label={ta ? "விலை (அச்சிட்டபடி)" : "Price (as printed)"}>
              <span className="font-tamil" lang="ta">{s.price_as_printed}</span>
            </Row>
            <Row label={ta ? "இப்பதிப்பில் உரிமை அறிவிப்பு — அச்சிட்டபடி" : "Rights notice in this edition — as printed"}>
              <span className="font-tamil" lang="ta">“{s.rights_notice_as_printed}”</span>
              <span className="mt-1 block text-[11px] not-italic text-ink/40 dark:text-night-text/40">
                {ta
                  ? "1954 பதிப்பில் அச்சிடப்பட்டதன் வரலாற்றுச் சான்று மட்டுமே — தற்போதைய உரிமை நிலையை இது விவரிக்கவில்லை (கீழே காண்க)."
                  : "A historical witness of what the 1954 edition printed — it does not describe the present rights status (see below)."}
              </span>
            </Row>
            <Row label={ta ? "காப்பக அடையாளம்" : "Archive identifier"} mono>{s.identifier}</Row>
            <Row label={ta ? "நூல் பக்கங்கள் (PDF)" : "Body pages (PDF)"}>
              {s.main_text_pdf_pages} <span className="text-ink/45 dark:text-night-text/45">· {ta ? "அச்சிட்ட பக்கம்" : "printed"} {s.main_text_logical_printed_pages}</span>
            </Row>
            <Row label={ta ? "ஸ்கேன் SHA-256" : "Scan SHA-256"} mono>{s.scan_sha256}</Row>
          </dl>
          <p className="mt-3 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-4 py-2.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
            {ta
              ? "வழங்கப்பட்ட ஸ்கேன் படமே கட்டுப்படுத்தும் காப்பக மூலம். OCR எழுத்தடுக்கு நியமமற்றது — வழிசெலுத்தலுக்கு மட்டுமே."
              : "The rendered scan image is the controlling archival source. The OCR text layer is non-canonical — for navigation only."}
          </p>
        </section>

        {/* ── PRESENT RIGHTS / NATIONALISATION STATUS ──────────────────── */}
        {/* A DIFFERENT fact from the 1954 printed notice above: the present project-level
            rights status of Kalaignar's underlying authored work. */}
        {pr && (
          <section className="mt-4 rounded-2xl border border-marina/30 bg-marina/[0.05] p-5">
            <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-marina dark:text-marina-light">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> {ta ? "தற்போதைய உரிமை / தேசியமயமாக்கல் நிலை" : "Present rights / nationalisation status"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/80 dark:text-night-text/80" lang={lang}>
              {ta
                ? "முத்தமிழ் அறிஞர் கலைஞர் மு. கருணாநிதியின் படைப்புகளைத் தமிழ்நாடு அரசு தேசியமயமாக்கியுள்ளது. 2024 ஆகஸ்ட் 22 அன்று ராயல்டி இன்றி தேசியமயமாக்கப்படும் என அறிவிக்கப்பட்டு, 2024 டிசம்பரில் அரசாணை வழங்கப்பட்டது. இது இந்நூலின் அடிப்படை மூலப் படைப்புக்கு (கலைஞர் எழுதியது) பொருந்தும்."
                : "The works of Kalaignar M. Karunanidhi have been nationalised by the Government of Tamil Nadu — announced on 22 August 2024 (without royalty), with the Government Order issued in December 2024. This applies to the underlying work authored by Kalaignar."}
            </p>
            <dl className="mt-3">
              <Row label={ta ? "உரிமை நிலை" : "Rights status"}>
                {ta ? "தமிழ்நாடு அரசால் தேசியமயமாக்கப்பட்டது" : "Nationalised by the Government of Tamil Nadu"}
              </Row>
              <Row label={ta ? "அதிகாரம்" : "Authority"}>{pr.rightsAuthority}</Row>
              <Row label={ta ? "நடவடிக்கை" : "Action"}>{pr.rightsAction}</Row>
              <Row label={ta ? "அறிவிப்பு தேதி" : "Announcement date"}>{pr.rightsAnnouncementDate}</Row>
              <Row label={ta ? "அரசாணை" : "Government Order"}>
                {pr.governmentOrderNumber
                  ? pr.governmentOrderNumber
                  : `${pr.governmentOrderDateStated ?? "—"} · ${ta ? "எண் இன்னும் சரிபார்க்கப்படவில்லை" : "number not yet verified"}`}
              </Row>
            </dl>
            <p className="mt-3 rounded-xl border border-dashed border-marina/40 bg-marina/[0.05] px-4 py-2.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
              {ta
                ? "தேசியமயமாக்கல் கலைஞரின் அடிப்படை தமிழ்ப் படைப்பிற்கு மட்டுமே. இத்திட்டத்திற்காக உருவாக்கப்பட்ட ஆங்கில மொழிபெயர்ப்பு அல்லது பிறர் பங்களிப்புகளுக்கு இது நீட்டிக்கப்படவில்லை. அரசாணை எண் அதிகாரப்பூர்வ ஆவணத்திலிருந்து சரிபார்த்த பின்பே பதிவு செய்யப்படும்."
                : "The nationalisation covers Kalaignar's underlying Tamil work only. It does not extend to the project-created English translation or to third-party contributions. The exact Government Order number will be recorded only after verification from an authoritative record."}
            </p>
          </section>
        )}

        {/* ── ARCHIVE-DERIVED ──────────────────────────────────────────── */}
        <section className="mt-4 rounded-2xl border border-brass/30 bg-brass/[0.04] p-5">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brass">
            <Info className="h-3.5 w-3.5" aria-hidden /> {ta ? "காப்பகத்தால் உருவாக்கப்பட்ட வழிசெலுத்தல் / மேனிலைத் தரவு" : "Archive-derived navigation / metadata"}
          </h2>
          <dl className="mt-3">
            <Row label={ta ? "காட்சி எண்கள்" : "Scene numbering"}>
              {ta
                ? "அச்சிட்ட நூலில் காட்சிகள் எண்ணிடப்படவில்லை (none-printed)."
                : "The printed booklet numbers no scenes (none-printed)."}
            </Row>
            <Row label={ta ? "பகுதிகள்" : "Segments"}>
              {ta
                ? `${prov.segmentCount} — காப்பக வழிசெலுத்தல் பகுதிகள் மட்டுமே (derivative-navigation-only). இவை அச்சிட்ட காட்சி எண்கள் அல்ல.`
                : `${prov.segmentCount} — archive navigation segments only (derivative-navigation-only). These are not printed scene numbers.`}
            </Row>
          </dl>
        </section>

        {/* ── VERIFICATION STATE ───────────────────────────────────────── */}
        <section className="mt-4 rounded-2xl border border-ink/10 bg-white/50 p-5 dark:border-white/10 dark:bg-night-surface/50">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 dark:text-night-text/50">
            <FileCheck2 className="h-3.5 w-3.5" aria-hidden /> {ta ? "சரிபார்ப்பு நிலை" : "Verification state"}
          </h2>
          <dl className="mt-3">
            <Row label={ta ? "தமிழ் (மூலம்)" : "Tamil (source)"}>
              {ta ? `${prov.tamil.sceneDerivatives} பகுதி வழிப்படிகள் · ${prov.tamil.status}` : `${prov.tamil.sceneDerivatives} scene derivatives · ${prov.tamil.status}`}
            </Row>
            <Row label={ta ? "ஆங்கிலம் (வாசிப்பு அடுக்கு)" : "English (reading layer)"}>
              {ta
                ? `${prov.english.translationUnits} அலகுகள் · ${prov.english.edition} · ${prov.english.status} · QA ${prov.english.qaStatus}`
                : `${prov.english.translationUnits} units · ${prov.english.edition} · ${prov.english.status} · QA ${prov.english.qaStatus}`}
            </Row>
            <Row label={ta ? "அலகு வகைகள்" : "Unit kinds"}>
              {Object.entries(prov.english.unitKindCounts)
                .map(([k, v]) => `${k} ${v}`)
                .join(" · ")}
            </Row>
            <Row label={ta ? "பேச்சாளர் பெயரற்ற அலகுகள்" : "Source-unlabelled spoken units"}>
              {prov.english.sourceUnlabelledSpokenUnits}
              <span className="mt-1 block text-[11px] text-ink/40 dark:text-night-text/40">
                {ta ? "மூலத்தில் பெயரிடப்படாதவை பெயரிடப்படாமலேயே வைக்கப்பட்டுள்ளன." : "Left unlabelled exactly as in the source — no attribution is invented."}
              </span>
            </Row>
            <Row label={ta ? "ஆங்கில அதிகாரம்" : "English authority"} mono>{prov.english.translationAuthority}</Row>
          </dl>
        </section>

        {/* ── INTEGRITY / IMPORT ───────────────────────────────────────── */}
        <section className="mt-4 rounded-2xl border border-ink/10 bg-white/50 p-5 dark:border-white/10 dark:bg-night-surface/50">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 dark:text-night-text/50">
            <Database className="h-3.5 w-3.5" aria-hidden /> {ta ? "மூலமும் ஒருமைப்பாடும்" : "Source & integrity"}
          </h2>
          <dl className="mt-3">
            <Row label={ta ? "மூலக் களஞ்சியம்" : "Source repository"} mono>
              {prov.sourceRepo} · {prov.sourcePath}
            </Row>
            <Row label={ta ? "மூல commit" : "Source commit"} mono>{prov.sourceCommit}</Row>
            <Row label={ta ? "மொழிபெயர்ப்பு உள்ளீடு (aggregate)" : "Translation input (aggregate)"} mono>
              {prov.integrity.translationInputAggregateSha256}
            </Row>
            <Row label={ta ? "சரிபார்ப்பு உள்ளீடு (aggregate)" : "Validation input (aggregate)"} mono>
              {prov.integrity.validationInputAggregateSha256}
            </Row>
            {Object.entries(prov.integrity.readerEditionOutputs).map(([name, o]) => (
              <Row key={name} label={name} mono>
                {o.sha256} <span className="text-ink/40 dark:text-night-text/40">· {o.bytes} bytes</span>
              </Row>
            ))}
          </dl>
        </section>

        {/* Source-witness notes, verbatim from the manifest. */}
        <section className="mt-4 rounded-2xl border border-ink/10 bg-white/40 p-5 dark:border-white/10 dark:bg-night-surface/40">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 dark:text-night-text/50">
            {ta ? "குறிப்புகள்" : "Notes"}
          </h2>
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
          <Link href="/cinema/manohara" className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 hover:border-marina/50 dark:border-white/15" lang={lang}>
            <BookOpen className="h-3.5 w-3.5 text-marina" aria-hidden /> {ta ? "மனோகரா வாசிக்க" : "Read Manohara"}
          </Link>
        </div>
      </main>
    </div>
  );
}
