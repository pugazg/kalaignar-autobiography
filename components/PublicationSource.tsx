"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, FileCheck2, Home, Info, Landmark, ListOrdered, ShieldCheck } from "lucide-react";
import type { PoetryPublicationProvenance } from "@/data/poems";
import { useLang } from "@/lib/i18n";

export default function PublicationSource({ slug, prov }: { slug: string; prov: PoetryPublicationProvenance }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const s = prov.source;
  const v = prov.verification;
  const pr = prov.projectRights;
  const sourceTypeTa = s.sourceTypeLabel?.ta ?? "அச்சிட்ட மூலம்";
  const sourceTypeEn = s.sourceTypeLabel?.en ?? "printed source";

  const Row = ({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) => (
    <div className="grid gap-0.5 border-b border-ink/5 py-2.5 last:border-0 dark:border-white/5 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-4">
      <dt className="text-xs text-ink/45 dark:text-night-text/45">{label}</dt>
      <dd className={mono ? "break-all font-mono text-[11px] leading-relaxed text-ink/70 dark:text-night-text/70" : "text-sm text-ink/85 dark:text-night-text/85"}>{children}</dd>
    </div>
  );
  const Card = ({ icon: Icon, title, children }: { icon: typeof Info; title: string; children: React.ReactNode }) => (
    <section className="mt-6 rounded-2xl border border-ink/10 bg-white/40 p-5 dark:border-white/10 dark:bg-white/[0.02]">
      <h2 className="flex items-center gap-2 font-display text-sm font-medium text-ink/80 dark:text-night-text/80"><Icon className="h-4 w-4 text-brass" aria-hidden />{title}</h2>
      {children}
    </section>
  );

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <header className="border-b border-ink/10 dark:border-white/10">
        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
          <div className="flex items-center gap-3 text-xs text-ink/60 dark:text-night-text/60">
            <Link href={`/poems/${slug}`} className="focus-ring inline-flex items-center gap-1 rounded p-1 hover:text-marina dark:hover:text-marina-light">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {ta ? "தொகுப்புக்குத் திரும்பு" : "Back to the collection"}
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
              ? `இப்பக்கம் மூல உண்மைகளையும் (${sourceTypeTa}/scan) காப்பகத்தால் உருவாக்கப்பட்ட வாசிப்பு அமைப்பையும் வேறுபடுத்திக் காட்டுகிறது.`
              : `This page separates source facts (the ${sourceTypeEn} / scan) from the archive-derived reading structure.`}
          </p>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        <Card icon={Landmark} title={ta ? `மூல உண்மைகள் (${sourceTypeTa})` : `Source facts (the ${sourceTypeEn})`}>
          <dl className="mt-3">
            <Row label={ta ? "படைப்பு" : "Work"}><span className="font-tamil" lang="ta">{s.titleTa}</span> · {s.titleEn}</Row>
            <Row label={ta ? "ஆசிரியர்" : "Author"}><span className="font-tamil" lang="ta">{s.authorTa}</span> · {s.authorEn}</Row>
            <Row label={ta ? "மூல களஞ்சியம்" : "Source repository"} mono>{prov.sourceRepo}</Row>
            <Row label={ta ? "மூலப் பாதை" : "Source path"} mono>{prov.sourcePath}</Row>
            <Row label={ta ? "மூல சமர்ப்பணம்" : "Source commit"} mono>{prov.sourceCommit}</Row>
            <Row label={ta ? "படைப்பு மரம்" : "Work tree"} mono>{prov.sourceTree}</Row>
            <Row label={ta ? "கட்டுப்படுத்தும் ஸ்கேன்" : "Controlling scan"} mono>{s.scanFilename}</Row>
            <Row label="SHA-256" mono>{s.scanSha256}</Row>
            <Row label={ta ? "கோப்பு அளவு" : "File size"}>{s.scanFileSizeBytes.toLocaleString("en-US")} {ta ? "பைட்டுகள்" : "bytes"}</Row>
            <Row label={ta ? "மொத்த ஸ்கேன்கள்" : "Total scans"}>{s.scanTotalPages}</Row>
            <Row label={ta ? "மூல PDF" : "Source PDF"}>{ta ? "களஞ்சியத்தில் சேர்க்கப்படவில்லை" : "not committed to the repository"}</Row>
          </dl>
        </Card>

        {s.publicationEstablished && (
          <Card icon={BookOpen} title={ta ? "வெளியீட்டுச் சான்று" : "Publication evidence"}>
            <div className="mt-3 rounded-xl border border-dashed border-brass/40 bg-brass/[0.06] px-4 py-3 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang={lang}>
              <p className="font-semibold text-ink/80 dark:text-night-text/80">{ta ? "வெளியீடு" : "Publication"}</p>
              <p className="mt-1"><span className="font-tamil" lang="ta">{s.publicationEstablished.publicationTa}</span>{s.publicationEstablished.publicationEn && <> · {s.publicationEstablished.publicationEn}</>}</p>
              {s.publicationEstablished.editionStatement && <p className="mt-1 font-tamil" lang="ta">{s.publicationEstablished.editionStatement}</p>}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink/75 dark:text-night-text/75" lang={lang}>{s.paginationNote}</p>
          </Card>
        )}

        <Card icon={Info} title={ta ? "பகுதி எல்லை" : "Publication boundary"}>
          <p className="mt-3 text-sm leading-relaxed text-ink/80 dark:text-night-text/80" lang={lang}>{s.boundaryNote}</p>
          {prov.itemNumberingAnomalies.length > 0 && (
            <div className="mt-3 rounded-xl border border-dashed border-ink/20 bg-ink/[0.02] px-4 py-3 text-xs leading-relaxed text-ink/70 dark:border-white/20 dark:bg-white/[0.03] dark:text-night-text/70" lang={lang}>
              {prov.itemNumberingAnomalies.map((a) => (
                <p key={a.ordinal}>{a.note}</p>
              ))}
            </div>
          )}
        </Card>

        <Card icon={FileCheck2} title={ta ? "சரிபார்ப்பு நிலை" : "Verification state"}>
          <dl className="mt-3">
            <Row label={ta ? "தமிழ் இறுதி அனுமதி" : "Tamil final clearance"}>{v.tamilFinalClearance}</Row>
            <Row label={ta ? "நியம கவிதைகள்" : "Canonical items"}>{v.canonicalItems}</Row>
            <Row label={ta ? "ஆங்கில வெளியீடு" : "English release"}>{v.englishRelease}</Row>
            <Row label={ta ? "ஆங்கில கவிதைகள்" : "English items"}>{v.englishItems}</Row>
            <Row label={ta ? "ஆங்கில தொகுதிகள்" : "English batches"}>{v.englishBatches}</Row>
            <Row label={ta ? "எண்ணிடப்பட்ட ஸ்கேன்கள்" : "Numbered-item scans"}>{v.numberedItemScans}</Row>
            <Row label={ta ? "தீர்க்கப்படாதவை" : "Unresolved"}>{v.unresolved}</Row>
          </dl>
        </Card>

        <Card
          icon={ListOrdered}
          title={
            prov.titleWitnesses.overall
              ? ta
                ? `தலைப்புச் சான்றுகள் — மூல மொத்தம் ${prov.titleWitnesses.overall.total}`
                : `Title witnesses — ${prov.titleWitnesses.overall.total} in source`
              : ta
                ? `தலைப்புச் சான்றுகள் (${prov.titleWitnesses.count})`
                : `Title witnesses (${prov.titleWitnesses.count})`
          }
        >
          {/* The overall Gate-3 accounting, where the source records it, so the item table below is
              never mistaken for the whole. total = exact + variants; variants = item + group. */}
          {prov.titleWitnesses.overall && (
            <p className="mt-3 rounded-lg border border-dashed border-brass/40 bg-brass/[0.06] px-3 py-2 text-xs text-ink/75 dark:text-night-text/75" lang={lang}>
              {ta
                ? `${prov.titleWitnesses.overall.total} சான்றுகள் · ${prov.titleWitnesses.overall.exact} சரியொப்பு · ${prov.titleWitnesses.overall.variants} மூல மாறுபாடுகள் (${prov.titleWitnesses.count} கவிதை + ${prov.titleWitnesses.groupVariants?.count ?? 0} பிரிவு) · ${prov.titleWitnesses.overall.unresolved} தீர்க்கப்படாதவை`
                : `${prov.titleWitnesses.overall.total} witnesses · ${prov.titleWitnesses.overall.exact} exact · ${prov.titleWitnesses.overall.variants} source-valid variants (${prov.titleWitnesses.count} item + ${prov.titleWitnesses.groupVariants?.count ?? 0} group) · ${prov.titleWitnesses.overall.unresolved} unresolved`}
            </p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-ink/80 dark:text-night-text/80" lang={lang}>{prov.titleWitnesses.note}</p>
          {prov.titleWitnesses.groupVariants && prov.titleWitnesses.groupVariants.count > 0 && (
            <div className="mt-3">
              <h3 className="text-xs font-medium text-ink/55 dark:text-night-text/55">{ta ? `பிரிவுத் தலைப்பு மாறுபாடு (${prov.titleWitnesses.groupVariants.count})` : `Group title variant (${prov.titleWitnesses.groupVariants.count})`}</h3>
              {prov.titleWitnesses.groupVariants.groups.map((g) => (
                <p key={g.ordinal} className="mt-1 text-xs" lang="ta">
                  <span className="font-tamil text-ink/70 dark:text-night-text/70">{g.contentsWitness}</span>
                  <span className="mx-1.5 text-ink/40 dark:text-night-text/40">↔</span>
                  <span className="font-tamil text-ink/85 dark:text-night-text/85">{g.canonicalWitness}</span>
                </p>
              ))}
            </div>
          )}
          <h3 className="mt-4 text-xs font-medium text-ink/55 dark:text-night-text/55">
            {prov.titleWitnesses.overall ? (ta ? `கவிதைத் தலைப்பு மாறுபாடுகள் (${prov.titleWitnesses.count})` : `Item title variants (${prov.titleWitnesses.count})`) : ""}
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-ink/45 dark:text-night-text/45">
                <tr>
                  <th className="py-1.5 pr-3 font-medium">{ta ? "எண்" : "Item"}</th>
                  <th className="py-1.5 pr-3 font-medium">{ta ? "தலைப்புப் பக்கச் சான்று (நியமம்)" : "Title-page witness (canonical)"}</th>
                  <th className="py-1.5 font-medium">{ta ? "பொருளடக்கச் சான்று" : "Contents witness"}</th>
                </tr>
              </thead>
              <tbody className="align-top">
                {prov.titleWitnesses.items.map((w) => (
                  <tr key={w.ordinal} className="border-t border-ink/8 dark:border-white/8">
                    <td className="py-1.5 pr-3 tabular-nums text-ink/60 dark:text-night-text/60">{w.ordinal}</td>
                    <td className="py-1.5 pr-3 font-tamil text-ink/85 dark:text-night-text/85" lang="ta">{w.titlePageWitness}</td>
                    <td className="py-1.5 font-tamil text-ink/70 dark:text-night-text/70" lang="ta">{w.contentsWitness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card icon={Info} title={ta ? "கவிதைப் பகுதியிலிருந்து விலக்கப்பட்டவை" : "Locked exclusions from the reading content"}>
          <ul className="mt-3 space-y-1.5 text-sm text-ink/80 dark:text-night-text/80">
            {s.lockedExclusions.map((x, i) => (
              <li key={i} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brass" aria-hidden /><span>{x}</span></li>
            ))}
          </ul>
        </Card>

        <Card icon={ShieldCheck} title={ta ? "உரிமை நிலை" : "Rights"}>
          <dl className="mt-3">
            <Row label={ta ? "நிலை" : "Status"}>{pr.rightsStatus}</Row>
            <Row label={ta ? "அதிகாரம்" : "Authority"}>{pr.rightsAuthority}</Row>
            <Row label={ta ? "அறிவிப்பு நாள்" : "Announced"}>{pr.rightsAnnouncementDate}</Row>
            <Row label={ta ? "ஒப்படைப்பு நாள்" : "Handover"}>{pr.governmentOrderHandoverDate}</Row>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-ink/65 dark:text-night-text/65" lang={lang}>{pr.thirdPartyNote}</p>
          <p className="mt-2 text-xs leading-relaxed text-ink/65 dark:text-night-text/65" lang={lang}>{pr.projectTranslationNote}</p>
        </Card>

        <Card icon={Info} title={ta ? "குறிப்புகள்" : "Notes"}>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/75 dark:text-night-text/75">
            {prov.notes.map((n, i) => (<li key={i} lang={lang}>{n}</li>))}
          </ul>
        </Card>

        <div className="h-16" />
      </main>
    </div>
  );
}
