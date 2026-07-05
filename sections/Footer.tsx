import { Download } from "lucide-react";
import { siteMeta } from "@/data/meta";

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-mist/60 dark:border-white/10 dark:bg-night-surface/60">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-tamil text-xl text-marina dark:text-marina-light" lang="ta">
            {siteMeta.heroTamil}
          </p>
          <p className="mt-2 text-sm text-ink/70 dark:text-night-text/70">
            {siteMeta.heroTamilTransliteration}. An interactive retelling of Volume&nbsp;1
            of the autobiography of Kalaignar M.&nbsp;Karunanidhi.
          </p>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="font-semibold">Author:</dt>
            <dd className="text-ink/70 dark:text-night-text/70">{siteMeta.source.author}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">First serialised in:</dt>
            <dd className="text-ink/70 dark:text-night-text/70">{siteMeta.source.firstSerialisedIn}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">Publisher:</dt>
            <dd className="text-ink/70 dark:text-night-text/70">{siteMeta.source.publisher}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">Period covered:</dt>
            <dd className="text-ink/70 dark:text-night-text/70">{siteMeta.source.periodCovered}</dd>
          </div>
        </dl>
        <div className="flex flex-col items-start gap-4">
          <a
            href="/source/nenjukku-neethi-volume-1.pdf"
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-marina px-6 py-2.5 text-sm font-semibold text-paper shadow-md shadow-marina/25 transition-transform hover:scale-[1.03]"
            download
          >
            <Download className="h-4 w-4" aria-hidden />
            Download the source (PDF)
          </a>
          <p className="text-xs text-ink/55 dark:text-night-text/55">
            Place the source file at <code>public/source/nenjukku-neethi-volume-1.pdf</code> to
            activate this link.
          </p>
        </div>
      </div>
      <div className="border-t border-ink/10 py-5 text-center text-xs text-ink/55 dark:border-white/10 dark:text-night-text/55">
        <p>
          Site content consists of original summaries of, and brief quotations from, the source
          memoir, with chapter citations throughout. Volumes loaded:{" "}
          {siteMeta.volumesLoaded.join(", ")} — more to come.
        </p>
        <p className="mt-1">© {new Date().getFullYear()} — built as an educational, non-commercial digital report.</p>
      </div>
    </footer>
  );
}
