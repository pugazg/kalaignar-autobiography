import Link from "next/link";
import type { ReactNode } from "react";

/** Shared shell for the standalone information pages (Privacy / Support / About).
 * Reuses the site's theme tokens; no new design system. */
export function InfoPage({
  title,
  tamil,
  updated,
  children,
}: {
  title: string;
  tamil?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-24 pt-24 sm:px-6">
      <Link
        href="/"
        className="focus-ring inline-flex items-center gap-2 rounded text-sm text-marina hover:underline dark:text-marina-light"
      >
        <span aria-hidden>←</span>
        <span className="font-tamil" lang="ta">நெஞ்சுக்கு நீதி</span>
        <span className="text-ink/50 dark:text-night-text/50">· Kalaignar Digital Library</span>
      </Link>

      <h1 className="mt-8 font-display text-3xl font-semibold text-ink dark:text-night-text sm:text-4xl">
        {title}
      </h1>
      {tamil ? (
        <p className="mt-1 font-tamil text-lg text-marina dark:text-marina-light" lang="ta">
          {tamil}
        </p>
      ) : null}
      {updated ? (
        <p className="mt-2 text-sm text-ink/50 dark:text-night-text/50">Last updated {updated}</p>
      ) : null}

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-ink/80 dark:text-night-text/80">
        {children}
      </div>
    </main>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold text-ink dark:text-night-text">{heading}</h2>
      {children}
    </section>
  );
}
