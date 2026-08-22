import Link from "next/link";
import type { StoryProvenance } from "@/data/stories";

/**
 * Reader-facing provenance for a Fiction short story.
 *
 * NOT the speech provenance page. A story's record shares only five keys with a speech's
 * (`workId`, `sourceRepo`, `sourcePath`, `sourceCommit`, `source`); the eight sections below —
 * story scope, the whole-copy figure, printed-page uncertainty, the join policy, the erratum
 * witness, the Tamil assembly, the English layer and the recheck queue — exist only for this form,
 * and the speech record's rights/blockers/notes sections do not exist here at all. Rendering this
 * record through the speech component would have produced six empty sections and two silent
 * omissions, so it gets its own.
 *
 * WHAT THIS PAGE IS CAREFUL ABOUT, in the order the mistakes would be made:
 *
 *  1. `24 of 26 verified` is a fact about the BOOKLET, and `16 of 16 verified` is the fact about the
 *     STORY. They are in two separate sections, and the whole-copy figure never appears without the
 *     sentence saying the two unverified scans are front matter the story does not occupy. A reader
 *     who takes 24/26 for the story's completeness has been misled by the page, not by the archive.
 *  2. Scan 7 carries no printed page number and none is supplied. Scan 8 prints 4; 3 is not inferred.
 *  3. The cross-scan joins are a NORMALISATION RULE applied uniformly, not 15 individually adjudicated
 *     boundaries. The archive records no per-boundary adjudication, and this page says so.
 *  4. The publisher's erratum sheet is a SECOND WITNESS, not a correction: the reading text keeps the
 *     archival page reading (`வைத்திருந்தான்`) and the erratum (`வைத்திருந்தாள்`) is recorded here only.
 *  5. The archive's recorded English status label is carried as a label. It does not establish that a
 *     human editorial review happened, and nothing on this page claims one did. The same goes for the
 *     recheck queue: an entry in it is a place worth looking at again, not a known error and not
 *     evidence of a completed review.
 *
 * Everything here must print — it is the evidence for the text. Nothing sits in a `header` or `footer`.
 */
export default function StorySource({ slug, prov }: { slug: string; prov: StoryProvenance }) {
  const s = prov.source;
  const scope = prov.storyScope;
  const book = prov.physicalPublication;
  const pp = prov.printedPageUncertainty;
  const join = prov.crossScanJoinPolicy;
  const errata = prov.errata;
  const en = prov.english;

  // `machineId` marks the rows that are opaque identifiers rather than language. Those may break at
  // any character, because a 64-character hash has no word boundaries to break at and would
  // otherwise overflow the column. Everything else is Tamil the reader actually reads, and must
  // break only between words — `break-all` on a name splits `கருணாநிதி` mid-syllable.
  const identity: { label: string; value: string; machineId?: true }[] = [
    { label: "அச்சுத் தலைப்பு", value: s.printedTitleTa },
    { label: "தீட்டியவர்", value: s.printedAuthorshipLineTa },
    { label: "பதிப்பு", value: s.editionStatementTa },
    { label: "கோப்பு", value: s.scanFilename, machineId: true },
    { label: "SHA-256", value: s.scanSha256, machineId: true },
    // Grouped as the archival record states it, so a reader can compare the two figures digit by digit.
    { label: "அளவு", value: `${s.scanFileSizeBytes.toLocaleString("en-US")} bytes` },
    { label: "ஸ்கேன் பக்கங்கள்", value: String(s.scanTotalPages) },
  ];

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      <nav aria-label="வழிசெலுத்தல்" className="mb-8 text-sm" data-print="hide">
        <Link href={`/stories/${slug}`} className="font-tamil text-marina hover:underline dark:text-marina-light" lang="ta">
          {s.printedTitleTa}
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
        {s.printedTitleTa} — {en.titleEn}
      </p>

      {/* ── 1. SOURCE IDENTITY ──────────────────────────────────────────────────────────────────── */}
      <section aria-label="ஆளும் மூலம்" className="mt-12">
        <SectionHeading>ஆளும் மூலம்</SectionHeading>
        <Prose>
          இந்தப் பதிப்பின் ஒரே ஆளும் மூலம் கீழ்க்காணும் ஒற்றைக் கோப்பு மட்டுமே. அது எந்தக் களஞ்சியத்திலும்
          சேமிக்கப்படவில்லை.
        </Prose>
        <dl className="mt-5 space-y-3">
          {identity.map((row) => (
            <div key={row.label} className="grid grid-cols-[7.5rem_1fr] gap-3 border-b border-ink/8 pb-3 dark:border-white/8 sm:grid-cols-[9rem_1fr]">
              <dt className="font-tamil text-sm text-ink/50 dark:text-night-text/50" lang="ta">{row.label}</dt>
              <dd className={`${row.machineId ? "break-all" : "break-words"} font-tamil text-sm text-ink/85 dark:text-night-text/85`}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
        <ArchiveNote>{s.controllingSourceNote}</ArchiveNote>
      </section>

      {/* ── 2a. STORY SCOPE — the figure that is about the STORY ─────────────────────────────────── */}
      <section aria-label="கதையின் எல்லை" className="mt-12">
        <SectionHeading>கதையின் எல்லை</SectionHeading>
        <Prose>
          கதை ஸ்கேன் {scope.storyScans} — மொத்தம் {scope.storyScanCount} ஸ்கேன்கள். அவற்றுள்{" "}
          {scope.verified} சரிபார்க்கப்பட்டுள்ளன; {scope.blocked} தடைபட்டவை;{" "}
          {scope.unresolvedReadings} தீர்வுறாத வாசிப்பு. கதை முழுமையாக இறக்குமதி செய்யப்பட்டுள்ளது.
        </Prose>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Figure label="ஸ்கேன்கள்" value={scope.storyScans} />
          <Figure label="சரிபார்க்கப்பட்டவை" value={`${scope.verified}/${scope.storyScanCount}`} />
          <Figure label="தடைபட்டவை" value={String(scope.blocked)} />
          <Figure label="தீர்வுறாத வாசிப்பு" value={String(scope.unresolvedReadings)} />
        </dl>
        <Prose className="mt-5">கதை முடியும் வரி, அப்படியே:</Prose>
        <blockquote
          lang="ta"
          className="mt-2 border-l-2 border-marina/40 pl-4 font-tamil text-sm leading-[1.9] text-ink/80 dark:border-marina-light/40 dark:text-night-text/80"
        >
          {scope.conclusionTa}
        </blockquote>
        <ArchiveNote>{scope.boundaryNote}</ArchiveNote>
      </section>

      {/* ── 2b. THE WHOLE COPY — a different figure about a different thing ──────────────────────── */}
      <section aria-label="முழு நூலின் நிலை" className="mt-12">
        <SectionHeading>முழு நூலின் நிலை</SectionHeading>
        <Prose>
          இது கதையைப் பற்றிய கூற்று அல்ல; அச்சிடப்பட்ட நூல் முழுவதைப் பற்றியது. மொத்தம்{" "}
          {book.totalScans} ஸ்கேன் பதிவுகளில் {book.verified} சரிபார்க்கப்பட்டுள்ளன. சரிபார்க்கப்படாத{" "}
          {book.blocked} ஸ்கேன்களும் — ஸ்கேன் {book.blockedScans.join(", ")} — கதைக்கு வெளியே உள்ள
          முன்னுரைப் பகுதிச் சேர்க்கைகள். எனவே இந்த எண் கதை முழுமையடையவில்லை என்பதைக் குறிக்காது: கதை{" "}
          {scope.verified}/{scope.storyScanCount} சரிபார்க்கப்பட்டது.
        </Prose>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Figure label="ஸ்கேன் பதிவுகள்" value={String(book.totalScans)} />
          <Figure label="சரிபார்க்கப்பட்டவை" value={`${book.verified}/${book.totalScans}`} />
          <Figure label="தடைபட்டவை" value={book.blockedScans.join(", ")} />
          <Figure label="வகைப்பாடு" value={book.blockedClassification} />
        </dl>
        <ArchiveNote>{book.note}</ArchiveNote>
      </section>

      {/* ── 3. PRINTED-PAGE UNCERTAINTY ──────────────────────────────────────────────────────────── */}
      <section aria-label="அச்சுப் பக்க நிச்சயமின்மை" className="mt-12">
        <SectionHeading>அச்சுப் பக்க நிச்சயமின்மை</SectionHeading>
        <Prose>
          ஸ்கேன் {pp.scan}-க்கு அச்சுப் பக்க எண் எதுவும் மூலத்தில் காணப்படவில்லை; எனவே இங்கு எதுவும்
          தரப்படவில்லை. அச்சுப் பக்க எண் மூலத்திலிருந்து வாசிக்கப்பட வேண்டும் — அடுத்த பக்கத்திலிருந்து
          கணிக்கப்படக் கூடாது.
        </Prose>
        <ArchiveNote>{pp.note}</ArchiveNote>
      </section>

      {/* ── 4. CROSS-SCAN JOIN POLICY ────────────────────────────────────────────────────────────── */}
      <section aria-label="ஸ்கேன் எல்லை இணைப்புக் கொள்கை" className="mt-12">
        <SectionHeading>ஸ்கேன் எல்லை இணைப்புக் கொள்கை</SectionHeading>
        <Prose>
          கதையில் {join.transitions} ஸ்கேன் எல்லை மாற்றங்கள் உள்ளன. அவற்றுள் {join.appliedBoundaries}{" "}
          இடங்களில், காப்பகத்தின் ஒருங்கிணைப்பு விதிப்படி, ஒரு இடைவெளியுடன் இணைக்கப்பட்டுள்ளன.{" "}
          {join.unresolvedBoundaries} இடங்களில் பத்தி உறவு தீர்மானிக்கப்படவில்லை என்று வெளிப்படையாகக்
          குறிக்கப்பட்டுள்ளது. இது ஒரு பொதுவிதி; ஒவ்வொரு எல்லையும் தனித்தனியே ஸ்கேனுடன்
          ஒப்பிடப்பட்டதாகக் காப்பகம் எந்தப் பதிவும் வைத்திருக்கவில்லை, அத்தகைய கூற்றும் இங்கு
          முன்வைக்கப்படவில்லை.
        </Prose>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Figure label="எல்லை மாற்றங்கள்" value={String(join.transitions)} />
          <Figure label="விதிப்படி இணைப்பு" value={String(join.appliedBoundaries)} />
          <Figure label="தீர்வுறாதவை" value={String(join.unresolvedBoundaries)} />
          <Figure label="தனித்தனி ஆய்வு" value="இல்லை" />
        </dl>
        <ArchiveNote>{join.note}</ArchiveNote>
      </section>

      {/* ── 5. ERRATUM WITNESS ───────────────────────────────────────────────────────────────────── */}
      <section aria-label="வெளியீட்டாளர் பிழைத்திருத்தச் சான்று" className="mt-12">
        <SectionHeading>வெளியீட்டாளர் பிழைத்திருத்தச் சான்று</SectionHeading>
        <Prose>
          ஸ்கேன் {errata.printedOnScan}-இல் வெளியீட்டாளரின் பிழைத்திருத்தப் பட்டியல்{" "}
          {errata.correctionCount} உள்ளீடுகளுடன் அச்சிடப்பட்டுள்ளது. அவை ஒரே வரிக்கான இரண்டாவது சான்று;
          வாசிப்புப் பகுதியில் அவை பயன்படுத்தப்படவில்லை. வாசிப்புப் பகுதி பக்கப் பதிவின் வாசிப்பையே
          தக்கவைக்கிறது.
        </Prose>

        {/* The one place the two witnesses substantively disagree, shown side by side. */}
        <div className="mt-5 rounded-xl border border-ink/10 p-4 dark:border-white/10">
          <p className="font-tamil text-xs text-ink/50 dark:text-night-text/50" lang="ta">
            அச்சுப் பக்கம் {errata.demonstrativeCase.printedPage} · ஸ்கேன் {errata.demonstrativeCase.sourceScan}
          </p>
          <dl className="mt-3 space-y-2">
            <div className="grid grid-cols-[9rem_1fr] gap-3">
              <dt className="font-tamil text-sm text-ink/50 dark:text-night-text/50" lang="ta">வாசிப்புப் பகுதி</dt>
              <dd className="font-tamil text-sm font-semibold text-ink dark:text-night-text" lang="ta">
                {errata.demonstrativeCase.archivalReadingTa}
              </dd>
            </div>
            <div className="grid grid-cols-[9rem_1fr] gap-3">
              <dt className="font-tamil text-sm text-ink/50 dark:text-night-text/50" lang="ta">பிழைத்திருத்தச் சான்று</dt>
              <dd className="font-tamil text-sm text-ink/70 dark:text-night-text/70" lang="ta">
                {errata.demonstrativeCase.publisherErratumTa}
              </dd>
            </div>
          </dl>
          <p className="mt-3 font-tamil text-xs leading-relaxed text-ink/55 dark:text-night-text/55" lang="ta">
            வாசிப்புப் பகுதியில் மாற்றப்படவில்லை.
          </p>
          <ArchiveNote>{errata.demonstrativeCase.note}</ArchiveNote>
        </div>

        {/* All ten entries. Scrolls inside itself on a narrow viewport; the page never scrolls sideways. */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[26rem] border-collapse text-left font-body text-xs">
            <thead>
              <tr className="border-b border-ink/15 text-ink/50 dark:border-white/15 dark:text-night-text/50">
                <th scope="col" className="py-2 pr-3 font-normal"><span className="font-tamil" lang="ta">அச்சுப் பக்கம்</span></th>
                <th scope="col" className="py-2 pr-3 font-normal"><span className="font-tamil" lang="ta">ஸ்கேன்</span></th>
                <th scope="col" className="py-2 pr-3 font-normal"><span className="font-tamil" lang="ta">வரி</span></th>
                <th scope="col" className="py-2 pr-3 font-normal"><span className="font-tamil" lang="ta">பிழைத்திருத்தம்</span></th>
                <th scope="col" className="py-2 font-normal"><span className="font-tamil" lang="ta">பக்கப் பதிவு</span></th>
              </tr>
            </thead>
            <tbody className="text-ink/80 dark:text-night-text/80">
              {errata.corrections.map((c, i) => (
                <tr key={i} className="border-b border-ink/8 dark:border-white/8">
                  <td className="py-2 pr-3 tabular-nums">{c.printedPage}</td>
                  <td className="py-2 pr-3 tabular-nums">{c.sourceScan}</td>
                  <td className="py-2 pr-3 tabular-nums">{c.line}</td>
                  <td className="py-2 pr-3 font-tamil" lang="ta">{c.printedCorrection}</td>
                  <td className="break-all py-2 text-ink/50 dark:text-night-text/50">{c.pageRecord}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 6. TAMIL ASSEMBLY ────────────────────────────────────────────────────────────────────── */}
      <section aria-label="தமிழ் வாசிப்பு உருவாக்கம்" className="mt-12">
        <SectionHeading>தமிழ் வாசிப்பு உருவாக்கம்</SectionHeading>
        <Prose>
          சான்றுநிலை பக்கப் பதிவுகளுக்கே ({prov.tamilAssembly.authority}). தொடர்ச்சியான வாசிப்புக்காக
          உருவாக்கப்பட்ட தொகுப்புக் கோப்பு ({prov.tamilAssembly.derivedAssembly}) ஒரு வசதி மட்டுமே.
        </Prose>
        <ArchiveNote>{prov.tamilAssembly.note}</ArchiveNote>
      </section>

      {/* ── 7. ENGLISH LAYER ─────────────────────────────────────────────────────────────────────── */}
      <section aria-label="ஆங்கில மொழிபெயர்ப்பு" className="mt-12">
        <SectionHeading>ஆங்கில மொழிபெயர்ப்பு</SectionHeading>
        <Prose>
          ஆங்கிலப் பகுதி இத்திட்டத்தால் உருவாக்கப்பட்டது ({en.kind}) — தனியே வெளியிடப்பட்ட மொழிபெயர்ப்பு
          அல்ல. அது கதையின் ஸ்கேன் {en.sourceScans} பகுதியை உள்ளடக்கியது; {en.scanAnchors} ஸ்கேன்
          நங்கூரங்கள்; தடைபட்ட இடங்கள் {en.blockedSourceLocations}.
        </Prose>
        <ArchiveNote>{en.kindBasis}</ArchiveNote>
        {/* The archive's recorded status LABEL, carried with the sentence that says what it does not
            establish. The label is never presented as evidence of completed human review. */}
        <div className="mt-4 rounded-xl border border-dashed border-ink/15 px-4 py-3 dark:border-white/15">
          <p className="font-tamil text-xs text-ink/50 dark:text-night-text/50" lang="ta">
            காப்பகம் பதிவு செய்த நிலைக் குறிப்பு
          </p>
          <p className="mt-1 font-body text-sm text-ink/85 dark:text-night-text/85">{en.archiveStatus.statusAsRecorded}</p>
          <ArchiveNote>{en.archiveStatus.note}</ArchiveNote>
        </div>
        <ArchiveNote>{en.paragraphingNote}</ArchiveNote>
      </section>

      {/* ── 8. RECHECK QUEUE ─────────────────────────────────────────────────────────────────────── */}
      <section aria-label="மறுபார்வைப் பட்டியல்" className="mt-12">
        <SectionHeading>மறுபார்வைப் பட்டியல்</SectionHeading>
        <Prose>
          காப்பகம் ஒரு முன்நோக்கிய மறுபார்வைப் பட்டியலை ({prov.reviewQueue.file}) வைத்திருக்கிறது. அதில்
          ஓர் உள்ளீடு இருப்பது தற்போதைய வாசிப்பு தவறு என்பதைக் குறிக்காது; கதையின் சரிபார்ப்பு நிலையைக்
          குறைக்காது; ஒரு மனிதரின் மறுபார்வை நிறைவடைந்துவிட்டது என்பதற்கும் சான்று அல்ல.
        </Prose>
        <ArchiveNote>{prov.reviewQueue.note}</ArchiveNote>
      </section>

      <div className="mt-12 border-t border-ink/10 pt-5 font-body text-xs leading-relaxed text-ink/45 dark:border-white/10 dark:text-night-text/45">
        {prov.sourceRepo} · {prov.sourcePath} · {prov.sourceCommit.slice(0, 12)}
      </div>
    </main>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-tamil text-lg font-semibold text-ink dark:text-night-text" lang="ta">
      {children}
    </h2>
  );
}

function Prose({ children, className = "mt-2" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`${className} font-tamil text-sm leading-[1.9] text-ink/65 dark:text-night-text/65`} lang="ta">
      {children}
    </p>
  );
}

/** One archival figure. `value` is always rendered from the record — never computed, never defaulted. */
function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink/10 px-3 py-2.5 dark:border-white/10">
      <dt className="font-tamil text-[11px] leading-tight text-ink/50 dark:text-night-text/50" lang="ta">{label}</dt>
      <dd className="mt-1 font-body text-sm text-ink/85 dark:text-night-text/85">{value}</dd>
    </div>
  );
}

/** The archive's own note, verbatim and in its own words. Quoting the record beats paraphrasing it. */
function ArchiveNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 font-body text-xs leading-relaxed text-ink/50 dark:text-night-text/50" lang="en">
      {children}
    </p>
  );
}
