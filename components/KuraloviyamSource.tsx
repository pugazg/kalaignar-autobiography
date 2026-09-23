"use client";

import Link from "next/link";
import { ArrowLeft, FileCheck2, Home, Info, Landmark, TriangleAlert } from "lucide-react";
import type { PublicKuraloviyamProvenance } from "@/lib/kuraloviyam-public-provenance";
import { useLang } from "@/lib/i18n";

// Source & provenance for குறளோவியம். Receives the PUBLIC projection only (lib/kuraloviyam-public-provenance).
// Visual verification, Tamil textual verification and English coverage are three different facts and are shown
// as three separate rows — never merged into one "verified" figure. The four source-limited scans are presented
// as a permanent condition of the source, not as outstanding work.
export default function KuraloviyamSource({ prov }: { prov: PublicKuraloviyamProvenance }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const s = prov.source; const v = prov.verification;
  const Row = ({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) => (
    <div className="grid gap-0.5 border-b border-ink/5 py-2.5 last:border-0 dark:border-white/5 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-4">
      <dt className="text-xs text-ink/45 dark:text-night-text/45">{label}</dt>
      <dd className={mono ? "break-all font-mono text-[11px] leading-relaxed text-ink/70 dark:text-night-text/70" : "text-sm text-ink/85 dark:text-night-text/85"}>{children}</dd>
    </div>
  );
  const Card = ({ icon: Icon, title, children }: { icon: typeof Landmark; title: string; children: React.ReactNode }) => (
    <section className="mt-6 rounded-2xl border border-ink/10 bg-white/50 p-5 first:mt-0 dark:border-white/10 dark:bg-night-surface/50">
      <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-marina dark:text-marina-light"><Icon className="h-3.5 w-3.5" aria-hidden /> {title}</h2>
      {children}
    </section>
  );

  return (
    <div className="min-h-screen bg-paper pb-24 dark:bg-night dark:text-night-text">
      <header className="border-b border-ink/10 bg-mist/40 dark:border-white/10 dark:bg-night-surface/40">
        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
          <div className="flex items-center gap-3 text-xs text-ink/60 dark:text-night-text/60">
            <Link href="/kuraloviyam" className="focus-ring inline-flex items-center gap-1 rounded hover:text-marina dark:hover:text-marina-light"><ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {ta ? "நூலுக்குத் திரும்பு" : "Back to the work"}</Link>
            <Link href="/" className="focus-ring inline-flex items-center gap-1 rounded hover:text-marina dark:hover:text-marina-light" aria-label="Home"><Home className="h-3.5 w-3.5" aria-hidden /></Link>
          </div>
          <h1 className="mt-5 font-display text-3xl font-medium tracking-tight">{ta ? "மூலமும் சான்றும்" : "Source & provenance"}</h1>
          <p className="mt-1 font-tamil text-lg text-marina/80 dark:text-marina-light/80" lang="ta">{s.titleTa} — {s.authorTa}</p>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        <Card icon={Landmark} title={ta ? "மூல உண்மைகள் (அச்சிட்ட நூல்)" : "Source facts (the printed book)"}>
          <dl className="mt-3">
            <Row label={ta ? "நூல்" : "Title"}><span className="font-tamil" lang="ta">{s.titleTa}</span></Row>
            <Row label={ta ? "ஆசிரியர்" : "Author"}><span className="font-tamil" lang="ta">{s.authorTa}</span></Row>
            <Row label={ta ? "பதிப்பகம்" : "Publisher"}><span className="font-tamil" lang="ta">{s.publisherTa}</span></Row>
            <Row label={ta ? "விலை (அச்சிட்டபடி)" : "Price (as printed)"}><span className="font-tamil" lang="ta">{s.priceTa}</span></Row>
            <Row label={ta ? "பதிப்புகள் (அச்சிட்டபடி)" : "Editions (as printed)"}><span lang="en">{s.editionsEn.join(" · ")}</span></Row>
            <Row label={ta ? "Scan பக்கங்கள்" : "Scans"}>{s.scanTotal}</Row>
            <Row label={ta ? "Scan பிரிவுக் கோப்புகள்" : "Scan split files"} mono>
              {s.splits.map((x) => (
                <span key={x.part} className="block">{x.filename} · {ta ? "scan" : "scans"} {x.scans}{x.sha256 ? ` · ${x.sha256}` : ""}</span>
              ))}
            </Row>
          </dl>
          <p className="mt-3 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-4 py-2.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang={ta ? "ta" : "en"}>
            {ta
              ? "கட்டுப்படுத்தும் மூலம் 666 பக்க ஸ்கேன் நூல்; பெரிய கோப்பு என்பதால் 111 பக்கங்கள் கொண்ட ஆறு பிரிவுக் கோப்புகளாக வழங்கப்பட்டது. அவை ஆறு தனிப் படைப்புகள் அல்ல. PDF இங்கு சேமிக்கப்படவில்லை."
              : "The controlling source is the 666-scan book, supplied as six 111-scan split files because of its size. The splits are transfer units, not six works. The PDFs are not vendored here."}
          </p>
        </Card>

        <Card icon={FileCheck2} title={ta ? "சரிபார்ப்பு நிலை" : "Verification"}>
          <dl className="mt-3">
            <Row label={ta ? "காட்சிநிலைச் சரிபார்ப்பு" : "Visual verification"}><span data-testid="k-visual">{v.visualVerified} / {s.scanTotal}</span></Row>
            <Row label={ta ? "தமிழ் உரைச் சரிபார்ப்பு" : "Tamil text verified"}><span data-testid="k-textual">{v.tamilTextualVerified} / {s.scanTotal}</span></Row>
            <Row label={ta ? "ஆங்கில மொழிபெயர்ப்பு (திட்டம் உருவாக்கியது)" : "English (project-created)"}><span data-testid="k-english">{v.englishReleaseReady} / {s.scanTotal}</span></Row>
            <Row label={ta ? "மூல வரம்புடைய ஸ்கேன்" : "Source-limited scans"}><span data-testid="k-limited">{v.sourceLimitedScans.join(", ")}</span></Row>
          </dl>
          <div className="mt-3 rounded-xl border border-dashed border-ink/25 bg-ink/[0.03] px-4 py-3 text-xs leading-relaxed text-ink/70 dark:border-white/25 dark:bg-white/[0.03] dark:text-night-text/70">
            <p className="flex items-center gap-1.5 font-semibold" lang={ta ? "ta" : "en"}><TriangleAlert className="h-3.5 w-3.5" aria-hidden /> {ta ? "நிலையான மூல வரம்பு" : "Permanent source condition"}</p>
            <p className="mt-1" lang={ta ? "ta" : "en"}>
              {ta
                ? "ஸ்கேன் 13, 14, 15 ஆகியவை கையெழுத்து முகப்புரைப் படிவங்கள்; ஸ்கேன் 19-இல் சில சொற்கள் மங்கியுள்ளன. அவற்றின் வாசிக்க இயலாத சொற்கள் படியெடுக்கப்படவில்லை, மொழிபெயர்க்கப்படவில்லை, ஊகிக்கப்படவும் இல்லை. இது மூலத்தின் நிலை; நிலுவையிலுள்ள பணி அல்ல."
                : "Scans 13, 14 and 15 are handwritten preface facsimiles; on scan 19 a few words are washed out. Their unreadable wording is not transcribed, translated or inferred. This is a condition of the source, not outstanding work."}
            </p>
            <ul className="mt-2 space-y-0.5">
              {prov.sourceLimitedPages.map((p) => (
                <li key={p.scan}>
                  <Link href={`/kuraloviyam/${p.unit}`} className="focus-ring rounded underline decoration-ink/30 underline-offset-2 hover:text-marina dark:hover:text-marina-light">{ta ? `ஸ்கேன் ${p.scan} (அச்சுப் பக்கம் ${p.printed})` : `Scan ${p.scan} (printed ${p.printed})`}</Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card icon={Info} title={ta ? "காப்பகத்தால் உருவான அமைப்பு" : "Archive-derived structure"}>
          <dl className="mt-3">
            <Row label={ta ? "பொருளடக்கப் பகுதிகள்" : "Contents entries"}>{prov.structure.entries}</Row>
            <Row label={ta ? "அதிகார இணைப்பு தீர்மானிக்கப்பட்டவை" : "Adhikaram placement resolved"}>{prov.structure.crosswalk.resolved}</Row>
            <Row label={ta ? "பகுதி மூலத் தரவு மட்டும்" : "Partial source metadata"}>{prov.structure.crosswalk.partialSourceMetadata.join(", ")}</Row>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-ink/60 dark:text-night-text/60" lang="en">{prov.structure.note}</p>
        </Card>

        <Card icon={Info} title={ta ? "மூலம்" : "Source"}>
          <dl className="mt-3">
            <Row label={ta ? "மூலக் களஞ்சியம்" : "Source repository"} mono>{prov.sourceRepo} · {prov.sourcePath}</Row>
            <Row label={ta ? "மூல commit" : "Source commit"} mono>{prov.sourceCommit}</Row>
          </dl>
        </Card>

        <Card icon={Info} title={ta ? "குறிப்புகள்" : "Notes"}>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/80 dark:text-night-text/80">
            {prov.notes.map((n, i) => (
              <li key={i} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-marina" aria-hidden /><span lang="en">{n}</span></li>
            ))}
          </ul>
        </Card>
      </main>
    </div>
  );
}
