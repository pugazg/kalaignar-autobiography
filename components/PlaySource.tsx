"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, BookOpen, Info, ScrollText, Scale } from "lucide-react";
import type { Play, PlayProvenance } from "@/data/plays";
import { useLang } from "@/lib/i18n";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-ink/5 py-2 last:border-0 sm:flex-row sm:gap-3 dark:border-white/5">
      <dt className="shrink-0 text-xs uppercase tracking-wide text-ink/45 sm:w-56 dark:text-night-text/45">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-ink/80 dark:text-night-text/80">{children}</dd>
    </div>
  );
}
function Card({ icon: Icon, title, children }: { icon: typeof Info; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 rounded-2xl border border-ink/10 p-5 dark:border-white/10">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-night-text">
        <Icon className="h-4 w-4 text-marina" aria-hidden /> {title}
      </h2>
      {children}
    </section>
  );
}

/** Provenance page: what the source is, what it establishes, and what stays unresolved. */
export default function PlaySource({ play, prov }: { play: Play; prov: PlayProvenance }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const s = prov.source;
  const d = prov.archiveDerived;
  const r = prov.projectRights;

  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
        <Link href={`/plays/${play.slug}`} className="focus-ring inline-flex items-center gap-1 rounded text-xs text-ink/60 hover:text-marina dark:text-night-text/60">
          <ArrowLeft className="h-4 w-4" aria-hidden /> {ta ? "நூல் முகப்பு" : "Back to the play"}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-ink dark:text-night-text sm:text-3xl">
          {ta ? "மூலமும் சான்றும்" : "Source & provenance"}
        </h1>
        <p className="mt-1 font-tamil text-ink/70 dark:text-night-text/70" lang="ta">{play.title.ta} — {play.descriptor.ta}</p>

        <Card icon={BookOpen} title={ta ? "மூல ஆவணம்" : "The controlling source"}>
          <dl className="mt-3">
            <Row label={ta ? "கோப்பு" : "Scan file"}><span className="font-mono text-xs">{s.scanFilename}</span></Row>
            <Row label="SHA-256"><span className="font-mono text-[11px] break-all">{s.scanSha256}</span></Row>
            <Row label={ta ? "அளவு" : "File size"}>{s.scanFileSizeBytes?.toLocaleString() ?? "—"} bytes</Row>
            <Row label={ta ? "ஸ்கேன் பக்கங்கள்" : "Scan pages"}>{s.scanTotalPages}</Row>
            <Row label={ta ? "PDF சேமிப்பு" : "PDF committed"}>{ta ? "இல்லை — களஞ்சியத்திற்கு வெளியே" : "No — held outside the repository"}</Row>
            <Row label={ta ? "பக்கப் பதிவுகள்" : "Page records"}>{s.pageRecordsVerified}</Row>
            <Row label={ta ? "தணிக்கை" : "Audit"}>{s.sourceAudit}</Row>
            <Row label={ta ? "தொகுக்கப்பட்ட அடுக்கு" : "Assembled layer"}>{s.assembledLayer}</Row>
            <Row label={ta ? "உடல் ஸ்கேன்கள்" : "Body scans"}>{s.bodyScans}</Row>
            <Row label={ta ? "மூலக் களஞ்சியம்" : "Source repository"}>
              <span className="font-mono text-xs">{prov.sourceRepo}</span> @ <span className="font-mono text-[11px]">{prov.sourceCommit}</span>
            </Row>
          </dl>
          <p className="mt-3 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">
            {s.publicationYearNote}
          </p>
        </Card>

        <Card icon={ScrollText} title={ta ? "காப்பகத்திலிருந்து பெறப்பட்ட அமைப்பு" : "Structure derived from the archive"}>
          <dl className="mt-3">
            <Row label={ta ? "காட்சிகள்" : "Numbered scenes"}>{d.scenes}</Row>
            <Row label={ta ? "நிறைவுக் காட்சி" : "Closing tableau"}>{d.closingTableau} — {ta ? "தனியானது; காட்சி-39 அல்ல" : "separate; never Scene 39"}</Row>
            <Row label={ta ? "தமிழ் அலகுகள்" : "Tamil units"}>
              {d.tamilUnits} · {d.tamilDialogue} {ta ? "உரையாடல்" : "dialogue"} · {d.tamilStageDirections} {ta ? "அரங்கக் குறிப்புகள்" : "stage directions"} · {d.tamilVerse} {ta ? "மேற்கோள் பாடல்" : "quoted verse"}
            </Row>
            <Row label={ta ? "ஆங்கில அலகுகள்" : "English units"}>{d.englishUnits}</Row>
            <Row label={ta ? "பேச்சாளர் பெயர்கள்" : "Distinct printed speaker labels"}>{d.distinctSpeakerLabels}</Row>
            <Row label={ta ? "பெயரிடப்படாத பேச்சுகள்" : "Unlabelled speeches"}>{d.unlabelledDialogueUnits}</Row>
            <Row label={ta ? "பல ஸ்கேன் காட்சிகள்" : "Scenes spanning several scans"}>{d.multiScanScenes}</Row>
            <Row label={ta ? "அச்சுப் பக்க எண்கள்" : "Printed folios"}>
              {d.printedPageNumbersPresent} {ta ? "உள்ளன" : "present"} · {d.printedPageNumbersAbsent} {ta ? "இல்லை (ஊகிக்கப்படவில்லை)" : "absent (never inferred)"}
            </Row>
            <Row label={ta ? "அமைவிடம் இல்லாத காட்சிகள்" : "Scenes printing no setting"}>{d.scenesWithoutPrintedSetting}</Row>
          </dl>
          <p className="mt-3 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">{d.speakerNote}</p>
          <p className="mt-2 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">{s.twoColumnNote}</p>
          <p className="mt-2 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">{s.closingTableauNote}</p>
        </Card>

        <Card icon={AlertTriangle} title={ta ? "தீர்க்கப்படாத மூலப் பகுதி" : "Unresolved source area"}>
          {prov.unresolved.map((u, i) => (
            <div key={i} className="mt-3">
              <p className="text-sm text-ink/80 dark:text-night-text/80" lang="en">
                <span className="font-mono text-xs">{ta ? "ஸ்கேன்" : "scan"} {u.scan}</span> — {u.description}
              </p>
              <p className="mt-2 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-4 py-2.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang="en">{u.policy}</p>
              <p className="mt-2 font-mono text-[11px] text-ink/50 dark:text-night-text/50">{u.marker}</p>
            </div>
          ))}
        </Card>

        <Card icon={Info} title={ta ? "ஆங்கில அடுக்கு" : "The English layer"}>
          <dl className="mt-3">
            <Row label={ta ? "வகை" : "Kind"}>{prov.english.kind}</Row>
            <Row label={ta ? "நிலை" : "Status"}>{prov.english.status}</Row>
          </dl>
          <p className="mt-3 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">{prov.english.independence}</p>
          <p className="mt-2 rounded-xl border border-dashed border-marina/40 bg-marina/[0.06] px-4 py-2.5 text-xs leading-relaxed text-ink/70 dark:text-night-text/70" lang="en">{prov.english.secondaryWitnessNote}</p>
          <p className="mt-2 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">{prov.english.notesSeparated}</p>
        </Card>

        <Card icon={Info} title={ta ? "வாசிப்புப் பகுதியிலிருந்து விலக்கப்பட்டவை" : "Locked exclusions from the reading body"}>
          <ul className="mt-3 space-y-1.5 text-sm text-ink/80 dark:text-night-text/80">
            {prov.lockedExclusions.map((x, i) => (
              <li key={i} className="flex gap-2" lang="en"><span className="text-marina" aria-hidden>·</span><span>{x}</span></li>
            ))}
          </ul>
        </Card>

        <Card icon={Scale} title={ta ? "உரிமை நிலை" : "Rights"}>
          <dl className="mt-3">
            <Row label={ta ? "பொருந்துவது" : "Applies to"}>{r.appliesTo}</Row>
            <Row label={ta ? "நிலை" : "Status"}>{r.rightsStatus}</Row>
            <Row label={ta ? "அதிகாரம்" : "Authority"}>{r.rightsAuthority}</Row>
            <Row label={ta ? "அறிவிப்பு" : "Announced"}>{r.rightsAnnouncementDate}</Row>
            <Row label={ta ? "ஒப்படைப்பு" : "Handover"}>{r.governmentOrderHandoverDate}</Row>
            <Row label={ta ? "அரசாணை எண்" : "G.O. number"}>{r.governmentOrderNumber ?? (ta ? "சரிபார்க்கப்படவில்லை" : "not verified")}</Row>
            <Row label={ta ? "அரசாணை நாள்" : "G.O. date"}>{r.governmentOrderDate ?? (ta ? "சரிபார்க்கப்படவில்லை" : "not verified")}</Row>
          </dl>
          {[r.distinctionNote, r.thirdPartyNote, r.publishedWitnessNote, r.projectTranslationNote, r.archivalStatusNote, r.evidencePending].map((n, i) => (
            <p key={i} className="mt-2 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-2.5 text-xs leading-relaxed text-ink/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-night-text/65" lang="en">{n}</p>
          ))}
        </Card>

        <Card icon={Info} title={ta ? "குறிப்புகள்" : "Notes"}>
          <ul className="mt-3 space-y-2 text-sm text-ink/80 dark:text-night-text/80">
            {prov.notes.map((n, i) => <li key={i} className="flex gap-2" lang="en"><span className="text-marina" aria-hidden>·</span><span>{n}</span></li>)}
          </ul>
        </Card>
      </div>
    </div>
  );
}
