import Link from "next/link";
import type { Wave7CinemaWork, Wave7CinemaProvenance } from "@/data/wave7-cinema";

/**
 * Source & provenance surface for a Wave-7 Batch-1 cinema work. Server component. Records only what the
 * frozen source establishes: the controlling scan by SHA-256 (the PDF is not vendored), the source pins,
 * the vendored Reading-Room payload SHA, the source-verified counts, and the English-layer status. A
 * printed publication year is shown as a SOURCE WITNESS, not a catalogue claim. Unresolved source
 * conditions (e.g. item-level lyric authorships) are stated honestly and never resolved by inference.
 */
export default function Wave7CinemaSource({ work, prov }: { work: Wave7CinemaWork; prov: Wave7CinemaProvenance }) {
  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: "அச்சுத் தலைப்பு", value: prov.title.ta },
    { label: "English title (editorial)", value: prov.title.en },
    { label: "வடிவம்", value: prov.kind },
    { label: "மூலக் களஞ்சியம்", value: prov.sourceRepo, mono: true },
    { label: "மூல commit", value: prov.sourceCommit, mono: true },
    { label: "work tree", value: prov.workTree, mono: true },
    { label: "கட்டுப்படுத்தும் scan SHA-256", value: prov.source.scanSha256, mono: true },
    { label: "Reading-Room payload SHA-256", value: prov.readingRoomPayloadSha256, mono: true },
    ...(prov.source.sourceIdentifier ? [{ label: "மூல அடையாளம்", value: prov.source.sourceIdentifier, mono: true as const }] : []),
    ...(prov.source.publicationYearAsPrinted != null ? [{ label: "அச்சில் பதிப்பாண்டு (source witness)", value: String(prov.source.publicationYearAsPrinted) }] : []),
  ];
  const unresolved = (prov.counts?.unresolved_item_level_lyric_authorships ?? 0) as number;
  const perf = (prov.counts?.performance_occurrence_identities ?? prov.counts?.retained_performance_records ?? 0) as number;
  return (
    <article className="mx-auto max-w-2xl px-5 py-8 sm:px-6">
      <nav aria-label="வழிசெலுத்தல்" className="mb-8 text-sm" data-print="hide">
        <Link href={`/cinema/${work.slug}`} className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">{prov.title.ta}</Link>
        <span className="mx-2 text-ink/30 dark:text-night-text/30">/</span>
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light"><span lang="ta">மின்னூலகம்</span></Link>
      </nav>
      <header className="mb-6">
        <p className="font-tamil text-sm uppercase tracking-wide text-ink/50 dark:text-night-text/50" lang="ta">மூலமும் சான்றும் · Source &amp; provenance</p>
        <h1 className="mt-1 font-tamil text-2xl text-ink dark:text-night-text" lang="ta">{prov.title.ta}</h1>
        <p className="mt-1 text-lg text-ink/60 dark:text-night-text/60">{prov.title.en}</p>
      </header>

      <section className="mb-6">
        <h2 className="font-tamil text-lg text-ink dark:text-night-text" lang="ta">அடையாளம் · Identity</h2>
        <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="contents">
              <dt className="font-tamil text-ink/60 dark:text-night-text/60" lang="ta">{r.label}</dt>
              <dd className={r.mono ? "break-all font-mono text-xs" : "break-words"}>{r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-ink/50 dark:text-night-text/50">{prov.source.note}</p>
      </section>

      <section className="mb-6">
        <h2 className="font-tamil text-lg text-ink dark:text-night-text" lang="ta">அமைப்பு · Structure</h2>
        <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink/60 dark:text-night-text/60">Scenes / segments</dt><dd className="tabular-nums">{work.scenes.length}</dd>
          {Object.entries(prov.counts ?? {}).map(([k, v]) => (
            <div key={k} className="contents"><dt className="text-ink/60 dark:text-night-text/60">{k}</dt><dd className="tabular-nums">{String(v)}</dd></div>
          ))}
        </dl>
      </section>

      <section className="mb-6">
        <h2 className="font-tamil text-lg text-ink dark:text-night-text" lang="ta">ஆங்கில அடுக்கு · English layer</h2>
        <p className="mt-1 text-sm">Kind: {prov.englishProvenance.kind} · status: {prov.englishProvenance.status}.</p>
        <p className="mt-1 text-xs text-ink/50 dark:text-night-text/50">{prov.englishProvenance.note}</p>
        {perf > 0 && <p className="mt-2 text-xs text-ink/60 dark:text-night-text/60">Retained song / performance occurrences: {perf} — source-visible occurrence references only, never a lyric-authorship claim.</p>}
        {unresolved > 0 && <p className="mt-1 text-xs text-ink/60 dark:text-night-text/60">Unresolved item-level lyric authorships: {unresolved} — left unresolved; the source does not establish them and none is inferred.</p>}
      </section>

      <section className="mb-2 text-xs text-ink/50 dark:text-night-text/50">
        <p>Source: {prov.sourceRepo} @ {prov.sourceCommit.slice(0, 12)} · work tree {prov.workTree.slice(0, 12)} · Wave 7 Batch 1. The controlling scan and payload are pinned by SHA-256; runtime never fetches the source.</p>
      </section>
    </article>
  );
}
