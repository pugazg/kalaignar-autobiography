import type { StoryProvenanceB7 } from "@/data/stories";

/**
 * Wave-6 Batch-7 short-story provenance page. A dedicated renderer for the `batch: 7` provenance variant
 * so the heterogeneous Batch-7 sources are never forced into the legacy 1977/booklet model. Every row is
 * rendered ONLY when the source establishes it: a null edition, publisher or scan-SHA prints NOTHING, not
 * "null", not 0, and never a fabricated value. The controlling text remains the canonical Tamil; the
 * English is a project-created translation whose recorded review status is quoted as a label, not a claim.
 */
export default function StorySourceB7({ slug, prov }: { slug: string; prov: StoryProvenanceB7 }) {
  const s = prov.source;
  // Identity rows — only those the source actually establishes.
  const identity: { label: string; value: string; machineId?: true }[] = [
    { label: "அச்சுத் தலைப்பு", value: s.printedTitleTa },
    ...(s.collectionTa ? [{ label: "தொகுப்பு", value: s.collectionTa }] : []),
    ...(s.editionStatementTa ? [{ label: "பதிப்பு", value: s.editionStatementTa }] : []),
    ...(s.publisherTa ? [{ label: "பதிப்பகம்", value: s.publisherTa }] : []),
    ...(s.scanFilename ? [{ label: "மூலக் கோப்பு", value: s.scanFilename, machineId: true as const }] : []),
    ...(s.scanSha256 ? [{ label: "SHA-256", value: s.scanSha256, machineId: true as const }] : []),
  ];
  return (
    <article className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <p className="font-display text-sm uppercase tracking-wide text-ink/50 dark:text-night-text/50">மூலமும் சான்றும் · Source &amp; provenance</p>
        <h1 className="mt-1 font-display text-2xl text-ink dark:text-night-text">{s.printedTitleTa}</h1>
        <p className="mt-1 text-lg text-ink/60 dark:text-night-text/60">{prov.english.titleEn}</p>
      </header>

      <section className="mb-6">
        <h2 className="font-display text-lg text-ink dark:text-night-text">அடையாளம் · Identity</h2>
        <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
          {identity.map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-ink/60 dark:text-night-text/60">{row.label}</dt>
              <dd className={row.machineId ? "break-all font-mono text-xs" : "break-words"}>{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-ink/50 dark:text-night-text/50">{s.controllingSourceNote}</p>
      </section>

      <section className="mb-6">
        <h2 className="font-display text-lg text-ink dark:text-night-text">கதையின் வரம்பு · Story scope</h2>
        <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink/60 dark:text-night-text/60">மூல ஸ்கேன்கள்</dt><dd>{prov.storyScope.storyScans} ({prov.storyScope.storyScanCount})</dd>
          {prov.storyScope.printedPages ? (<><dt className="text-ink/60 dark:text-night-text/60">அச்சுப் பக்கங்கள்</dt><dd>{prov.storyScope.printedPages}</dd></>) : null}
          <dt className="text-ink/60 dark:text-night-text/60">சரிபார்க்கப்பட்டவை</dt><dd>{prov.storyScope.verifiedPages}</dd>
          <dt className="text-ink/60 dark:text-night-text/60">நிலை</dt><dd>{prov.storyScope.complete ? "முழுமை · complete" : "நிலுவை · in progress"}</dd>
        </dl>
      </section>

      <section className="mb-6">
        <h2 className="font-display text-lg text-ink dark:text-night-text">ஸ்கேன் இடையிணைப்பு · Cross-scan join policy</h2>
        <p className="mt-1 text-sm">{prov.crossScanJoinPolicy.policy}</p>
        <p className="mt-1 text-xs text-ink/50 dark:text-night-text/50">{prov.crossScanJoinPolicy.basis} ({prov.crossScanJoinPolicy.appliedBoundaries})</p>
      </section>

      <section className="mb-6">
        <h2 className="font-display text-lg text-ink dark:text-night-text">ஆங்கில மொழிபெயர்ப்பு · English layer</h2>
        <p className="mt-1 text-sm">{prov.english.kindBasis}</p>
        <p className="mt-1 text-xs text-ink/50 dark:text-night-text/50">Recorded status: {prov.english.reviewRecorded}. {prov.english.paragraphingNote}</p>
      </section>

      <section className="mb-2 text-xs text-ink/50 dark:text-night-text/50">
        <p>Source: {prov.sourceRepo} @ {prov.sourceCommit.slice(0, 12)} · work tree {prov.sourceTree.slice(0, 12)} · validation group {prov.validationGroup} · Wave 6 Batch 7.</p>
        <p className="mt-1">Tamil authority: {prov.tamilAssembly.authority}. {prov.tamilAssembly.note}</p>
      </section>
    </article>
  );
}
