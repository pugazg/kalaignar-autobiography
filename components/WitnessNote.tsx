"use client";

import Link from "next/link";
import { GitCompareArrows } from "lucide-react";
import type { WitnessLink } from "@/lib/witness";
import { useLang } from "@/lib/i18n";

/**
 * A concise, discoverable link to another SOURCE WITNESS of the same poem. It never claims the two
 * texts are identical, that one supersedes the other, or that either is a "corrected"/"original"
 * version — only that another witness is available. Registry-driven; renders nothing when empty.
 */
export default function WitnessNote({ links }: { links: WitnessLink[] }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  if (!links.length) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-marina/30 bg-marina/[0.04] px-4 py-3 dark:border-marina-light/30 dark:bg-marina-light/[0.05]" data-print="hide">
      {links.map((l, i) => {
        const label = l.itemTitleTa
          ? ta
            ? `${l.itemTitleTa} — ${l.workTitleTa}`
            : `${l.itemTitleEn ?? ""} — ${l.workTitleEn}`
          : ta
            ? l.workTitleTa
            : l.workTitleEn;
        return (
          <p key={i} className={i > 0 ? "mt-2 text-sm" : "text-sm"} lang={lang}>
            <GitCompareArrows className="mr-1.5 inline h-3.5 w-3.5 text-marina dark:text-marina-light" aria-hidden />
            <span className="text-ink/70 dark:text-night-text/70">{ta ? l.noteTa : l.noteEn} </span>
            <Link href={l.href} className="focus-ring rounded font-medium text-marina underline decoration-dotted underline-offset-2 hover:text-marina/80 dark:text-marina-light" lang={l.itemTitleTa && !ta ? undefined : "ta"}>
              {label}
            </Link>
          </p>
        );
      })}
    </div>
  );
}
