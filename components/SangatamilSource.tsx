"use client";

import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import type { PublicSangatamilProvenance } from "@/lib/wave8-public-provenance";
import { useLang } from "@/lib/i18n";

/** சங்கத் தமிழ் — source and provenance. Renders only the public projection (lib/wave8-public-provenance.ts). */
export default function SangatamilSource({ prov }: { prov: PublicSangatamilProvenance }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const d = prov.structure;
  const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="grid grid-cols-[10rem_1fr] gap-3 py-1.5 text-sm">
      <dt className="text-ink/50 dark:text-night-text/50">{k}</dt>
      <dd className="min-w-0 break-words text-ink/80 dark:text-night-text/80">{v}</dd>
    </div>
  );
  return (
    <div className="min-h-screen bg-paper dark:bg-night dark:text-night-text">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6" data-testid="sangatamil-source">
        <Link href="/sangatamil" className="focus-ring inline-flex items-center gap-1 rounded text-xs text-ink/60 hover:text-marina dark:text-night-text/60">
          <ArrowLeft className="h-4 w-4" aria-hidden /> {ta ? "நூலுக்குத் திரும்பு" : "Back to the book"}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-ink dark:text-night-text" lang={ta ? "ta" : "en"}>{ta ? "மூலமும் சான்றும்" : "Source & provenance"}</h1>
        <p className="mt-1 font-tamil text-lg text-ink/70 dark:text-night-text/70" lang="ta">{prov.title.ta}</p>

        <h2 className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-ink/45 dark:text-night-text/45">{ta ? "கட்டுப்படுத்தும் மூலம்" : "The controlling source"}</h2>
        <dl className="mt-2 divide-y divide-ink/10 dark:divide-white/10">
          <Row k={ta ? "ஸ்கேன் கோப்பு" : "Scan file"} v={prov.source.scanFilename} />
          <Row k="SHA-256" v={prov.source.scanSha256} />
          <Row k={ta ? "ஸ்கேன் பக்கங்கள்" : "Scan pages"} v={String(prov.source.physicalScans)} />
          <Row k={ta ? "PDF களஞ்சியத்தில்" : "PDF committed"} v={ta ? "இல்லை — களஞ்சியத்துக்கு வெளியே" : "No — held outside the repository"} />
          <Row k={ta ? "மூலக் களஞ்சியம்" : "Source repository"} v={`${prov.sourceRepo} @ ${prov.sourceCommit}`} />
        </dl>

        <h2 className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-ink/45 dark:text-night-text/45">{ta ? "அமைப்பு" : "Structure"}</h2>
        <dl className="mt-2 divide-y divide-ink/10 dark:divide-white/10">
          <Row k={ta ? "பகுதிகள்" : "Sections"} v={ta ? `${d.poemSections} பகுதிகள் + முன்பக்கங்கள் + பின்னட்டை` : `${d.poemSections} sections + front matter + back cover`} />
          <Row k={ta ? "பக்கங்கள்" : "Pages"} v={ta ? `${d.pages} (அவற்றில் முழுப்பக்க ஓவியங்கள் ${d.illustrationPages})` : `${d.pages} (${d.illustrationPages} of them full-page illustrations)`} />
          <Row k={ta ? "மூல மேற்கோள்கள்" : "Source citations"} v={ta ? `${d.formalCitations} மூல மேற்கோள்கள்; ${d.sourceNotes} மூலக் குறிப்புகள்` : `${d.formalCitations} printed source citations; ${d.sourceNotes} source notes`} />
        </dl>

        <h2 className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-ink/45 dark:text-night-text/45">{ta ? "உரை அடுக்குகள்" : "Text layers"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/75 dark:text-night-text/75" lang="en">{prov.tamilLayer}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/75 dark:text-night-text/75" lang="en">{prov.englishLayer}</p>

        <div className="mt-6 rounded-xl border border-dashed border-ink/30 bg-ink/[0.03] px-4 py-3 text-sm leading-relaxed text-ink/75 dark:border-white/25 dark:bg-white/[0.04] dark:text-night-text/75" role="note" data-role="source-limited" data-scan={prov.sourceLimitation.scan}>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink/55 dark:text-night-text/55">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden /> {ta ? `மூலத்தின் நிலையான வரம்பு — ஸ்கேன் ${prov.sourceLimitation.scan}` : `Permanent source condition — scan ${prov.sourceLimitation.scan}`}
          </p>
          <p className="mt-1.5" lang={ta ? "ta" : "en"}>{ta ? prov.sourceLimitation.statementTa : prov.sourceLimitation.statementEn}</p>
        </div>

        <h2 className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-ink/45 dark:text-night-text/45">{ta ? "வாசிப்பு உரையிலிருந்து விலக்கப்பட்டவை" : "Kept out of the reading text"}</h2>
        <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-ink/70 dark:text-night-text/70" lang="en">
          {prov.exclusions.map((e) => <li key={e}>{e}</li>)}
        </ul>
      </div>
    </div>
  );
}
