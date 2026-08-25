import Link from "next/link";
import type { ParasakthiIndex, ParasakthiProvenance } from "@/data/parasakthi";

/**
 * Reader-facing provenance for பராசக்தி — the evidence interface.
 *
 * Everything the reading pages deliberately withhold lives here: the scan and its hash, the PDF and
 * printed page ranges, the canonical-versus-printed scene numbers, the archive's verification
 * states, the integrity aggregates, and — most carefully — the song attribution.
 *
 * THE ONE THING THIS PAGE MUST NOT FLATTEN. The booklet's title and credits pages name Kalaignar for
 * திரைக்கதை/வசனம் — and those credits ARE evidence for that role. They are not evidence about the
 * songs. The booklet's song-credits page names SIX poets for the songs as a whole and pairs none of
 * them with a song, so item-level attribution comes from elsewhere, across THREE tiers of unequal
 * weight: a secondary soundtrack tracklist, the verified Kalaignar film-song anthology, and the
 * booklet's own words. Two of the fourteen occurrences are Kalaignar's, both on ANTHOLOGY evidence —
 * which is not an original-film credit and is never described as one. Presenting the tiers as equal,
 * or letting the screenplay credit imply the songs, would attribute five other poets' work to him.
 * The tiers are shown, labelled and counted FROM THE GENERATED DATA, because hardcoding the counts
 * here is exactly how this page went stale when the archive corrected two attributions.
 *
 * The page also keeps a superseded witness visible: scene 4's song was attributed to பாரதிதாசன் by
 * the tracklist before the anthology named it Kalaignar's. That earlier reading is preserved and
 * described as no longer controlling — never as wrong, and never as deleted, because the tracklist
 * file is unchanged and still says it.
 *
 * Everything here must print: it is the evidence for the text. Nothing sits in a `header` or
 * `footer`, which the global print stylesheet deletes.
 */
export default function ParasakthiSource({ index, prov }: { index: ParasakthiIndex; prov: ParasakthiProvenance }) {
  const s = prov.source;
  const identity: [string, string][] = [
    ["அடையாளம்", s.identifier],
    ["கோப்பு", s.filename],
    ["SHA-256", s.scanSha256],
    ["PDF பக்கங்கள்", String(s.pdfPages)],
    ["ஆளும் வரம்பு", `PDF ${s.canonicalPdfPages} · அச்சுப் பக்கம் ${s.canonicalPrintedPages}`],
    ["பின் அட்டை விளம்பரம்", `PDF ${s.rearAdvertisementPdfPage}`],
    ["ஸ்கேன் வகை", s.scanType],
    ["காப்பகம்", prov.sourceRepo],
    ["மூலப் பாதை", prov.sourcePath],
    ["மூலப் பதிவு", prov.sourceCommit],
  ];
  const machineRow = (k: string) => k === "SHA-256" || k === "கோப்பு" || k === "மூலப் பதிவு";

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label="வழிசெலுத்தல்" className="mb-8 text-sm" data-print="hide">
        <Link href="/cinema/parasakthi" className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">
          பராசக்தி
        </Link>
        <span className="mx-2 text-ink/30 dark:text-night-text/30">/</span>
        <Link href="/read" className="text-marina hover:underline dark:text-marina-light">
          <span lang="ta">மின்னூலகம்</span>
        </Link>
      </nav>

      <h1 className="font-tamil text-3xl font-semibold text-ink dark:text-night-text" lang="ta">
        மூலமும் சான்றும்
      </h1>
      <p className="mt-3 font-tamil text-base leading-relaxed text-ink/70 dark:text-night-text/70" lang="ta">
        {index.titleTa} — {index.sourceTitleTa}
      </p>

      {/* 1 — SOURCE IDENTITY */}
      <Section label="ஆளும் மூலம்">
        {/* Narrowed from "stored in no repository at all", which claimed far more than is known.
            What the project can say is only where it did NOT put the file. */}
        <Prose>
          இந்தப் பதிப்பின் ஆளும் மூலம் கீழ்க்காணும் ஒற்றைக் கோப்பு மட்டுமே. அந்த மூல PDF இந்தத்
          திட்டத்தின் GitHub களஞ்சியங்களில் சேர்க்கப்படவில்லை.
        </Prose>
        <dl className="mt-5 space-y-3">
          {identity.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-3 border-b border-ink/8 pb-3 dark:border-white/8 sm:grid-cols-[10rem_1fr]">
              <dt className="font-tamil text-sm text-ink/50 dark:text-night-text/50" lang="ta">{k}</dt>
              {/* `break-all` only for opaque machine identifiers — a hash has no word boundaries.
                  Tamil rows break between words. */}
              <dd className={`${machineRow(k) ? "break-all font-body" : "break-words font-tamil"} text-sm text-ink/85 dark:text-night-text/85`}>{v}</dd>
            </div>
          ))}
        </dl>
        <Note>{s.controllingSourceNote}</Note>
        <Note>{prov.sourceCommitNote}</Note>
        <Prose className="mt-3">
          அச்சிடப்பட்ட ஆண்டு, பதிப்பு, வெளியீட்டாளர் ஆகியவை நூலில் காணப்படவில்லை; எனவே அவை இங்கு
          ஊகிக்கப்படவில்லை.
        </Prose>
      </Section>

      {/* 2 — CREDITS AS PRINTED */}
      <Section label="அச்சில் உள்ள சான்றுகள்">
        <dl className="mt-2 space-y-3">
          <Row k={`தலைப்புப் பக்கம் — ${prov.creditsAsPrinted.titlePageRoleTa}`} v={prov.creditsAsPrinted.titlePageNameTa} />
          <Row k={`சான்றுப் பக்கம் — ${prov.creditsAsPrinted.creditsPageRoleTa}`} v={prov.creditsAsPrinted.creditsPageNameTa} />
        </dl>
        {/* These credits ARE evidence for the screenplay and dialogue — the earlier wording wrongly
            cast doubt on that too. The caution belongs only to song authorship. */}
        <Prose className="mt-4">
          இவை திரைக்கதை, கதை-வசனம் ஆகியவற்றிற்கான அச்சுச் சான்றுகள். ஆனால் நூலில் உள்ள பாடல்களின்
          தனித்தனி ஆசிரியத்துவத்தை இச்சான்றுகள் நிர்ணயிக்கவில்லை — பாடல்களுக்கான சான்று தனியே கீழே
          தரப்பட்டுள்ளது.
        </Prose>
      </Section>

      {/* 3 — SCENE STRUCTURE AND THE ABSENCES */}
      <Section label="காட்சி அமைப்பு">
        <Prose>
          நூலில் நேரடியாகக் காணப்படும் காட்சித் தலைப்புகள் {prov.structure.sceneHeadingsObserved}. காட்சி
          எண்கள் {prov.structure.canonicalRange} வரை செல்கின்றன; ஆனால் {prov.structure.absentCanonicalScenes.join(", ")}{" "}
          எனும் தலைப்புகள் நூலில் எங்கும் அச்சிடப்படவில்லை.
        </Prose>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Figure label="காணப்பட்ட தலைப்புகள்" value={String(prov.structure.sceneHeadingsObserved)} />
          <Figure label="எண் வரம்பு" value={prov.structure.canonicalRange} />
          <Figure label="அச்சில் இல்லாதவை" value={prov.structure.absentCanonicalScenes.join(", ")} />
          <Figure label="வாசிப்புப் பக்கங்கள்" value={String(index.sceneCount)} />
        </dl>
        <Note>{prov.structure.absenceNote}</Note>
      </Section>

      {/* 4 — THE PRINTED-NUMBER TRANSPOSITION */}
      <Section label="அச்சிடப்பட்ட காட்சி எண் மாற்றம்">
        <Prose>
          நூலின் இறுதிப் பகுதியில் இரண்டு காட்சி எண்கள் இடம் மாறி அச்சிடப்பட்டுள்ளன. வாசிப்பு வரிசை
          ஒருங்கிணைந்த எண்ணைப் பின்பற்றுகிறது; நூலில் அச்சிடப்பட்ட எண்கள் இங்கு அப்படியே
          பாதுகாக்கப்படுகின்றன.
        </Prose>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[26rem] border-collapse text-left font-body text-xs">
            <thead>
              <tr className="border-b border-ink/15 text-ink/50 dark:border-white/15 dark:text-night-text/50">
                <th scope="col" className="py-2 pr-3 font-normal"><span className="font-tamil" lang="ta">ஒருங்கிணைந்த காட்சி</span></th>
                <th scope="col" className="py-2 pr-3 font-normal"><span className="font-tamil" lang="ta">அச்சில் உள்ள எண்</span></th>
                <th scope="col" className="py-2 pr-3 font-normal">PDF</th>
                <th scope="col" className="py-2 font-normal"><span className="font-tamil" lang="ta">அச்சுப் பக்கம்</span></th>
              </tr>
            </thead>
            <tbody className="text-ink/80 dark:text-night-text/80">
              {prov.structure.editorialNumberCorrections.map((c) => (
                <tr key={c.canonicalScene} className="border-b border-ink/8 dark:border-white/8">
                  <td className="py-2 pr-3 tabular-nums">{c.canonicalScene}</td>
                  <td className="py-2 pr-3 tabular-nums">{c.sourceHeading}</td>
                  <td className="py-2 pr-3 tabular-nums">{c.pdfPage}</td>
                  <td className="py-2 tabular-nums">{c.printedPage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>{prov.structure.misnumberingNote}</Note>
      </Section>

      {/* 5 — TAMIL LAYER */}
      <Section label="தமிழ் அடுக்கு">
        <Prose>
          வாசிப்பின் சான்றுநிலை காப்பகத்தின் சரிபார்க்கப்பட்ட காட்சி வழிப்பொருள்களே
          ({prov.tamil.sceneDerivatives} கோப்புகள்). ஆளும் வரம்பில் {prov.tamil.canonicalPages} பக்கங்கள்;
          அவற்றுள் {prov.tamil.verifiedPages} சரிபார்க்கப்பட்டவை, {prov.tamil.reviewPages} மறுபார்வையில்.
          வசன அட்டவணையில் {prov.tamil.dialogueRecords} பதிவுகள்.
        </Prose>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Figure label="காட்சி வழிப்பொருள்" value={String(prov.tamil.sceneDerivatives)} />
          <Figure label="ஆளும் பக்கங்கள்" value={`${prov.tamil.verifiedPages}/${prov.tamil.canonicalPages}`} />
          <Figure label="மறுபார்வையில்" value={String(prov.tamil.reviewPages)} />
          <Figure label="வசனப் பதிவுகள்" value={String(prov.tamil.dialogueRecords)} />
        </dl>
        <Note>{prov.tamil.verificationNote}</Note>
        <Note>{prov.tamil.contentNote}</Note>
      </Section>

      {/* 6 — ENGLISH LAYER */}
      <Section label="ஆங்கில அடுக்கு">
        <Prose>
          ஆங்கிலப் பகுதி இத்திட்டத்தால் உருவாக்கப்பட்டது ({prov.english.kind}) — தனியே வெளியிடப்பட்ட
          மொழிபெயர்ப்பு அல்ல. {prov.english.scenesVerified} காட்சிகளில் {prov.english.translationUnits}{" "}
          அலகுகள்.
        </Prose>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Figure label="மொத்த அலகுகள்" value={String(prov.english.translationUnits)} />
          {Object.entries(prov.english.unitKindCounts).map(([k, v]) => (
            <Figure key={k} label={k} value={String(v)} />
          ))}
        </dl>
        <Note>{prov.english.kindBasis}</Note>
        <div className="mt-4 rounded-xl border border-dashed border-ink/15 px-4 py-3 dark:border-white/15">
          <p className="font-tamil text-xs text-ink/50 dark:text-night-text/50" lang="ta">
            காப்பகம் பதிவு செய்த நிலைக் குறிப்பு
          </p>
          <p className="mt-1 font-body text-sm text-ink/85 dark:text-night-text/85">
            complete-verified · QA {prov.english.readerEditionQa}
          </p>
          <Note>{prov.english.qaNote}</Note>
        </div>
        <Prose className="mt-4">
          ஆங்கிலப் பகுதியில் பேசுபவர் குறிப்புகள் நூலில் உள்ள தமிழ்ச் சுருக்கங்களாகவே
          (எ.கா. <span className="font-semibold">ஞான</span>, <span className="font-semibold">குண</span>)
          வேண்டுமென்றே தக்கவைக்கப்படுகின்றன. அவை ஆங்கிலப் பெயர்களாக விரிவாக்கப்படவில்லை — நூல்
          காட்டுவது அச்சுருக்கங்களையே.
        </Prose>
      </Section>

      {/* 7 — SONG / VERSE ATTRIBUTION: three tiers of unequal weight, kept apart */}
      <Section label="பாடல் / செய்யுள் சான்று">
        <Prose>
          நூலின் {prov.songs.bookletCredits.pdfPage}-ஆம் PDF பக்கத்தில் உள்ள “{prov.songs.bookletCredits.headingTa}”
          பகுதி {prov.songs.bookletCredits.contributorsAsPrinted.length} பங்களிப்பாளர்களை நூல் முழுமைக்கும்
          பொதுவாகக் குறிப்பிடுகிறது. எந்தப் பாடலுக்கு யார் என்பதை நூல் இணைக்கவில்லை.
        </Prose>
        <ul className="mt-4 flex flex-wrap gap-2">
          {prov.songs.bookletCredits.contributorsAsPrinted.map((c) => (
            <li key={c} className="rounded-full border border-ink/15 px-3 py-1 font-tamil text-sm text-ink/80 dark:border-white/15 dark:text-night-text/80" lang="ta">
              {c}
            </li>
          ))}
        </ul>
        <Note>{prov.songs.bookletCredits.note}</Note>

        <h3 className="mt-8 font-tamil text-base font-semibold text-ink dark:text-night-text" lang="ta">
          தனித்தனிப் பாடல் சான்று
        </h3>
        <Prose>
          {prov.songs.itemLevelAuthority.occurrenceRecords} பாடல்/செய்யுள் இடங்கள்;{" "}
          {prov.songs.itemLevelAuthority.soundtrackTracks} ஒலித்தட்டுப் பாடல்கள்,{" "}
          {prov.songs.itemLevelAuthority.quotedVerseRecords} மேற்கோள் செய்யுள். இவற்றின் சான்று
          வலிமை ஒரே மாதிரியானது அல்ல — மூன்று நிலைகள் உள்ளன.
        </Prose>
        {/* Counts come from the generated data, never from a literal here: hardcoding them in the
            component is exactly how the page went stale after the archive corrected two songs. */}
        <dl className="mt-4 space-y-3">
          {Object.entries(prov.songs.itemLevelAuthority.evidenceTiers).map(([tier, text]) => (
            <div key={tier} className="rounded-xl border border-ink/10 px-4 py-3 dark:border-white/10">
              <dt className="flex flex-wrap items-baseline gap-2 font-body text-xs font-semibold uppercase tracking-wider text-marina dark:text-marina-light">
                {tier}
                <span className="rounded-full bg-marina/10 px-2 py-0.5 font-normal normal-case tracking-normal text-ink/70 dark:text-night-text/70">
                  {prov.songs.itemLevelAuthority.evidenceTierCounts[tier] ?? 0}
                  <span className="font-tamil" lang="ta"> / {prov.songs.itemLevelAuthority.occurrenceRecords}</span>
                </span>
              </dt>
              <dd className="mt-1 font-body text-xs leading-relaxed text-ink/60 dark:text-night-text/60">{text}</dd>
            </div>
          ))}
        </dl>

        {/* The Kalaignar occurrences, named — but on anthology evidence, which the tier text
            above is careful to distinguish from an original-film credit. */}
        <h3 className="mt-8 font-tamil text-base font-semibold text-ink dark:text-night-text" lang="ta">
          கலைஞருக்குச் சாட்டப்பட்ட பாடல்கள்
        </h3>
        <Prose>
          {prov.songs.items.filter((s) => s.lyricistTa === "மு. கருணாநிதி").length} பாடல் இடங்கள்
          மு. கருணாநிதிக்குச் சாட்டப்பட்டுள்ளன. இரண்டுமே சரிபார்க்கப்பட்ட{" "}
          <span className="font-semibold">கலைஞர் திரை இசைப் பாடல்கள்</span> தொகுப்பின்
          தனித்தனிப் பெயரிடலின் அடிப்படையிலானவை — 1952 நூல் இப்பாடல்களுக்குத் தனித்தனியாகக்
          கலைஞரைச் சான்று காட்டவில்லை.
        </Prose>
        <ul className="mt-4 space-y-2">
          {prov.songs.items
            .filter((s) => s.lyricistTa === "மு. கருணாநிதி")
            .map((s) => (
              <li key={s.id} className="rounded-xl border border-ink/10 px-4 py-3 dark:border-white/10">
                <p className="font-tamil text-sm text-ink/85 dark:text-night-text/85" lang="ta">
                  காட்சி {s.canonicalScene} — {s.openingLineTa}
                </p>
                <p className="mt-1 font-body text-xs text-ink/50 dark:text-night-text/50">
                  {s.lyricistTa} · {s.evidenceBasis}
                </p>
              </li>
            ))}
        </ul>

        {/* THE DISAGREEMENT, KEPT VISIBLE. One witness supersedes another for this project's
            attribution decision; both remain documented. */}
        {prov.songs.itemLevelAuthority.supersededWitnesses.length > 0 && (
          <>
            <h3 className="mt-8 font-tamil text-base font-semibold text-ink dark:text-night-text" lang="ta">
              முந்தைய, முரண்படும் சான்று
            </h3>
            {prov.songs.itemLevelAuthority.supersededWitnesses.map((w) => (
              <div key={w.occurrenceId} className="mt-3 rounded-xl border border-dashed border-ink/20 px-4 py-3 dark:border-white/20">
                <p className="font-tamil text-sm text-ink/85 dark:text-night-text/85" lang="ta">
                  காட்சி {w.canonicalScene}
                </p>
                <dl className="mt-3 space-y-2">
                  <div className="grid grid-cols-[8.5rem_1fr] gap-3">
                    <dt className="font-tamil text-xs text-ink/50 dark:text-night-text/50" lang="ta">தற்போதைய சாட்டல்</dt>
                    <dd className="font-tamil text-sm text-ink/85 dark:text-night-text/85" lang="ta">
                      {w.nowAttributedTo} <span className="font-body text-xs text-ink/50 dark:text-night-text/50">· {w.nowOn}</span>
                    </dd>
                  </div>
                  <div className="grid grid-cols-[8.5rem_1fr] gap-3">
                    <dt className="font-tamil text-xs text-ink/50 dark:text-night-text/50" lang="ta">முந்தைய சாட்டல்</dt>
                    <dd className="font-tamil text-sm text-ink/70 dark:text-night-text/70" lang="ta">
                      {w.previouslyAttributedTo} <span className="font-body text-xs text-ink/50 dark:text-night-text/50">· {w.previouslyOn}</span>
                    </dd>
                  </div>
                  <div className="grid grid-cols-[8.5rem_1fr] gap-3">
                    <dt className="font-tamil text-xs text-ink/50 dark:text-night-text/50" lang="ta">முந்தைய ஆதாரம்</dt>
                    <dd className="break-words font-body text-xs text-ink/60 dark:text-night-text/60">{w.previousReference}</dd>
                  </div>
                </dl>
                <Note>{w.note}</Note>
              </div>
            ))}
          </>
        )}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left font-body text-xs">
            <thead>
              <tr className="border-b border-ink/15 text-ink/50 dark:border-white/15 dark:text-night-text/50">
                <th scope="col" className="py-2 pr-3 font-normal"><span className="font-tamil" lang="ta">காட்சி</span></th>
                <th scope="col" className="py-2 pr-3 font-normal"><span className="font-tamil" lang="ta">தொடக்க வரி</span></th>
                <th scope="col" className="py-2 pr-3 font-normal"><span className="font-tamil" lang="ta">இயற்றியவர்</span></th>
                <th scope="col" className="py-2 pr-3 font-normal"><span className="font-tamil" lang="ta">வகை</span></th>
                <th scope="col" className="py-2 font-normal"><span className="font-tamil" lang="ta">சான்று அடிப்படை</span></th>
              </tr>
            </thead>
            <tbody className="text-ink/80 dark:text-night-text/80">
              {prov.songs.items.map((it) => (
                <tr key={it.id} className="border-b border-ink/8 dark:border-white/8">
                  <td className="py-2 pr-3 tabular-nums">{it.canonicalScene}</td>
                  <td className="py-2 pr-3 font-tamil" lang="ta">{it.openingLineTa}</td>
                  <td className="py-2 pr-3 font-tamil" lang="ta">{it.lyricistTa}</td>
                  <td className="py-2 pr-3">{it.kind}</td>
                  <td className="py-2">{it.evidenceBasis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>{prov.songs.itemLevelAuthority.attributionNote}</Note>
        <Note>{prov.songs.itemLevelAuthority.externalEvidence.qualityNote}</Note>

        {/* Four levels, ordered strongest first and deliberately not collapsed into one authority.
            This belongs on the evidence page and nowhere near the reader. */}
        <h3 className="mt-8 font-tamil text-base font-semibold text-ink dark:text-night-text" lang="ta">
          சான்று வரிசை
        </h3>
        <ol className="mt-3 space-y-2">
          {prov.songs.itemLevelAuthority.authorityOrder.map((line, i) => (
            <li key={i} className="flex gap-3 font-body text-xs leading-relaxed text-ink/65 dark:text-night-text/65">
              <span className="shrink-0 tabular-nums text-marina dark:text-marina-light">{i + 1}.</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
        <Prose className="mt-3">
          குறுக்குச் சான்று மூலம்: {prov.songs.itemLevelAuthority.crossWitnessSource}
          {prov.songs.itemLevelAuthority.crossWitnessReports.length > 0 && (
            <> — ஒப்பீட்டு அறிக்கைகள்: {prov.songs.itemLevelAuthority.crossWitnessReports.join(", ")}</>
          )}
        </Prose>
        <Prose className="mt-3">
          ஆளும் தமிழ்ப் பாடம் எப்போதும் சரிபார்க்கப்பட்ட அச்சு நூலின் ஸ்கேனால் மட்டுமே
          தீர்மானிக்கப்படுகிறது. வெளி ஆதாரம் பாடல் இயற்றியவர் குறித்த சான்று மட்டுமே; அது தமிழ்ப்
          பாடத்தை மாற்றுவதில்லை.
        </Prose>
      </Section>

      {/* 8 — INTEGRITY */}
      <Section label="ஒருமைப்பாட்டுச் சான்று">
        <Prose>
          உருவாக்கப்பட்ட தரவு எந்தப் பதிவின் உள்ளடக்கத்திலிருந்து வந்தது என்பதைச் சரிபார்க்க
          உதவும் மதிப்புகள்.
        </Prose>
        <dl className="mt-5 space-y-3">
          <Row k="ஸ்கேன் SHA-256" v={prov.integrity.sourceScanSha256} mono />
          <Row k="மூல உள்ளீட்டுத் தொகுப்பு SHA-256" v={prov.integrity.sourceInputAggregateSha256} mono />
          <Row k="மூல உள்ளீட்டுக் கோப்புகள்" v={String(prov.integrity.sourceInputFiles)} />
          <Row k="மொழிபெயர்ப்புத் தொகுப்பு SHA-256" v={prov.integrity.translationInputAggregateSha256} mono />
          <Row k="மொழிபெயர்ப்பு உள்ளீட்டுக் கோப்புகள்" v={String(prov.integrity.translationInputFiles)} />
        </dl>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[26rem] border-collapse text-left font-body text-xs">
            <thead>
              <tr className="border-b border-ink/15 text-ink/50 dark:border-white/15 dark:text-night-text/50">
                <th scope="col" className="py-2 pr-3 font-normal"><span className="font-tamil" lang="ta">காப்பக வெளியீடு</span></th>
                <th scope="col" className="py-2 pr-3 font-normal">SHA-256</th>
                <th scope="col" className="py-2 font-normal"><span className="font-tamil" lang="ta">அளவு</span></th>
              </tr>
            </thead>
            <tbody className="text-ink/80 dark:text-night-text/80">
              {Object.entries(prov.integrity.readerEditionOutputs).map(([name, o]) => (
                <tr key={name} className="border-b border-ink/8 dark:border-white/8">
                  <td className="break-all py-2 pr-3">{name}</td>
                  <td className="break-all py-2 pr-3 text-ink/50 dark:text-night-text/50">{o.sha256}</td>
                  <td className="py-2 tabular-nums">{o.bytes.toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="mt-12 border-t border-ink/10 pt-5 font-body text-xs leading-relaxed text-ink/45 dark:border-white/10 dark:text-night-text/45">
        {prov.notes.map((n, i) => (
          <p key={i} className={i ? "mt-1" : ""}>{n}</p>
        ))}
        <p className="mt-2 break-all">
          {prov.sourceRepo} · {prov.sourcePath} · {prov.sourceCommit.slice(0, 12)}
        </p>
      </div>
    </main>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section aria-label={label} className="mt-12">
      <h2 className="font-tamil text-lg font-semibold text-ink dark:text-night-text" lang="ta">{label}</h2>
      {children}
    </section>
  );
}
function Prose({ children, className = "mt-2" }: { children: React.ReactNode; className?: string }) {
  return <p className={`${className} font-tamil text-sm leading-[1.9] text-ink/65 dark:text-night-text/65`} lang="ta">{children}</p>;
}
function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 border-b border-ink/8 pb-3 dark:border-white/8 sm:grid-cols-[13rem_1fr]">
      <dt className="font-tamil text-sm text-ink/50 dark:text-night-text/50" lang="ta">{k}</dt>
      <dd className={`${mono ? "break-all font-body" : "break-words font-tamil"} text-sm text-ink/85 dark:text-night-text/85`}>{v}</dd>
    </div>
  );
}
function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink/10 px-3 py-2.5 dark:border-white/10">
      <dt className="font-tamil text-[11px] leading-tight text-ink/50 dark:text-night-text/50" lang="ta">{label}</dt>
      <dd className="mt-1 font-body text-sm text-ink/85 dark:text-night-text/85">{value}</dd>
    </div>
  );
}
/** The archive's own note, verbatim. Quoting the record beats paraphrasing it. */
function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 font-body text-xs leading-relaxed text-ink/50 dark:text-night-text/50" lang="en">{children}</p>;
}
