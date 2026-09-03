"use client";

import { ChevronLeft, Library } from "lucide-react";
import Link from "next/link";
import type { LibraryCollection } from "@/data/collections";
import { useLang } from "@/lib/i18n";

/**
 * One member row, resolved on the server.
 *
 * The rows arrive as props rather than being loaded here so the whole inventory is in the delivered
 * HTML: this page is an archival navigation surface, and it has to work with client JavaScript
 * unavailable. There is no client-side search or filter state for the same reason.
 */
export type CollectionMemberRow = {
  ordinal?: number;
  workId: string;
  titleTa: string;
  titleEn: string;
  href: string;
  printedPages?: { first: number; last: number };
};

/**
 * A collection landing page: archival context plus a way in to each member work.
 *
 * IT IS NOT A READER. No story text is duplicated here and no second reading surface is created —
 * every row links to the member's own existing `/stories/<slug>` route, which remains the one place
 * that story is read, cited and provenanced.
 */
export default function CollectionLanding({
  collection,
  members,
}: {
  collection: LibraryCollection;
  members: CollectionMemberRow[];
}) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const count = collection.memberCount;

  return (
    <div className="min-h-screen bg-paper pb-24 dark:bg-night dark:text-night-text">
      <header className="border-b border-ink/10 bg-mist/40 dark:border-white/10 dark:bg-night-surface/40">
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
          <Link
            href="/read"
            className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded py-2 text-xs text-ink/60 hover:text-marina dark:text-night-text/60"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> {ta ? "மின்னூலகம்" : "Digital Library"}
          </Link>

          <p className="mt-4 flex w-fit items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/65 dark:text-night-text/65">
            <Library className="h-4 w-4 text-marina dark:text-marina-light" aria-hidden />
            {ta ? "தொகுப்பு" : "Collection"}
          </p>

          <h1 className="mt-2 font-tamil text-3xl font-medium leading-tight" lang="ta">
            {collection.titleTa}
          </h1>
          <p className="mt-1 font-display text-xl text-ink/70 dark:text-night-text/70">{collection.titleEn}</p>

          {/* Only what the declaration carries, and each fact labelled as the publication's own. */}
          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink/60 dark:text-night-text/60">
            {collection.editionStatementTa && (
              <div>
                <dt className="text-ink/65 dark:text-night-text/65">{ta ? "பதிப்பு" : "Edition"}</dt>
                <dd className="mt-0.5 font-tamil" lang="ta">
                  {collection.editionStatementTa}
                </dd>
              </div>
            )}
            {collection.publisherTa && (
              <div>
                <dt className="text-ink/65 dark:text-night-text/65">{ta ? "பதிப்பகம்" : "Publisher"}</dt>
                <dd className="mt-0.5 font-tamil" lang="ta">
                  {collection.publisherTa}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-ink/65 dark:text-night-text/65">{ta ? "படைப்புகள்" : "Works"}</dt>
              <dd className="mt-0.5 tabular-nums">
                {count.value}{" "}
                {ta ? (
                  <span className="font-tamil" lang="ta">
                    {count.labelTa}
                  </span>
                ) : (
                  count.labelEn
                )}
              </dd>
            </div>
          </dl>

          {/* The point of the whole layer, said plainly: grouping did not demote anything. */}
          <p className="mt-5 max-w-xl text-xs leading-relaxed text-ink/65 dark:text-night-text/65" lang={lang}>
            {ta
              ? "இத்தொகுப்பில் உள்ள ஒவ்வொரு படைப்பும் தனித்தனிப் படைப்பாகவே — அதற்கே உரிய வாசிப்புப் பக்கம், மூலச் சான்று, மேற்கோள் அடையாளத்துடன் — இங்கு வெளியிடப்பட்டுள்ளது. இத்தொகுப்பு அவற்றை ஒன்றாக அச்சிட்ட நூலைக் காட்டுகிறது."
              : "Every work in this collection is published here in its own right, with its own reading page, source record and citation identity. The collection records the publication that printed them together."}
          </p>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">
        <h2 className="mb-3 flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 dark:text-night-text/50">
          <span className="font-tamil text-sm normal-case tracking-normal text-ink/70 dark:text-night-text/70" lang="ta">
            பொருளடக்கம்
          </span>
          <span>Contents</span>
          <span className="ml-auto shrink-0 font-normal tracking-normal tabular-nums text-ink/65 dark:text-night-text/65">
            {members.length}
          </span>
        </h2>

        {/* An ordered list because the order is a source fact — the publication's printed contents
            numbering — not a presentation preference. */}
        <ol className="flex flex-col gap-2">
          {members.map((m) => (
            <li key={m.workId}>
              <Link
                href={m.href}
                className="focus-ring group flex items-baseline gap-3 rounded-xl border border-marina/25 bg-white/60 px-4 py-3 transition hover:border-marina/60 dark:bg-night-surface/60"
              >
                {m.ordinal !== undefined && (
                  <span className="w-6 shrink-0 tabular-nums text-xs text-ink/65 dark:text-night-text/65">
                    {m.ordinal}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span
                    className="block font-tamil text-[15px] font-medium group-hover:text-marina dark:group-hover:text-marina-light"
                    lang="ta"
                  >
                    {m.titleTa}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink/65 dark:text-night-text/65">{m.titleEn}</span>
                </span>
                {m.printedPages && (
                  <span className="shrink-0 tabular-nums text-xs text-ink/65 dark:text-night-text/65">
                    {ta ? "பக்." : "pp."} {m.printedPages.first}–{m.printedPages.last}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
