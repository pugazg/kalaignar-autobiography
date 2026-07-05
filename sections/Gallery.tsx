"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { gallery } from "@/data/gallery";
import { Reveal, SectionHeading } from "@/components/shared";

export default function Gallery() {
  const [index, setIndex] = useState<number | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (d: number) =>
      setIndex((i) => (i === null ? null : (i + d + gallery.length) % gallery.length)),
    []
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, step]);

  return (
    <section
      id="gallery"
      className="bg-mist/40 py-24 dark:bg-night-surface/40"
      aria-labelledby="gallery-label"
    >
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading
          id="gallery"
          tamil="காட்சி"
          eyebrow="Gallery"
          title="Six frames from one life"
          lede="The source text carries no printable figures, so these are original illustrations keyed to the memoir's eras — placeholders ready to be swapped for archival photographs."
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {gallery.map((g, i) => (
            <Reveal key={g.src} delay={i * 0.04}>
              <li>
                <button
                  onClick={() => setIndex(i)}
                  className="focus-ring group block w-full overflow-hidden rounded-2xl border border-ink/10 bg-white/70 text-left shadow-sm dark:border-white/10 dark:bg-night-surface/80"
                  aria-label={`Open ${g.title} in lightbox`}
                >
                  <div className="overflow-hidden">
                    <Image
                      src={g.src}
                      alt={g.caption}
                      width={640}
                      height={360}
                      className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-base font-medium">{g.title}</h3>
                    <p className="mt-1 text-sm text-ink/65 dark:text-night-text/65">{g.caption}</p>
                  </div>
                </button>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {index !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm dark:bg-black/85"
            role="dialog"
            aria-modal="true"
            aria-label={gallery[index].title}
            onClick={close}
          >
            <button
              onClick={close}
              className="focus-ring absolute right-4 top-4 rounded-full bg-white/10 p-2 text-paper"
              aria-label="Close lightbox"
            >
              <X className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              className="focus-ring absolute left-3 rounded-full bg-white/10 p-2 text-paper"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <figure
              className="max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={gallery[index].src}
                alt={gallery[index].caption}
                width={1024}
                height={576}
                className="max-h-[70vh] w-full rounded-2xl object-contain"
              />
              <figcaption className="mt-4 text-center text-paper">
                <span className="font-display text-lg">{gallery[index].title}</span>
                <span className="mt-1 block text-sm text-paper/70">{gallery[index].caption}</span>
              </figcaption>
            </figure>
            <button
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              className="focus-ring absolute right-3 rounded-full bg-white/10 p-2 text-paper"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
