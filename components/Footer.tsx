import Link from "next/link";

/** Subtle site-wide footer with the information-page links (About / Privacy / Support).
 * Rendered globally from the root layout. */
export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/10 dark:border-white/10">
      <div className="mx-auto flex max-w-content flex-col gap-3 px-5 py-8 text-sm text-ink/55 dark:text-night-text/55 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>An independent digital archive · not an official publication.</p>
        <nav aria-label="Site information" className="flex gap-5">
          <Link href="/about" className="focus-ring rounded hover:text-marina dark:hover:text-marina-light">About</Link>
          <Link href="/privacy" className="focus-ring rounded hover:text-marina dark:hover:text-marina-light">Privacy</Link>
          <Link href="/support" className="focus-ring rounded hover:text-marina dark:hover:text-marina-light">Support</Link>
        </nav>
      </div>
    </footer>
  );
}
