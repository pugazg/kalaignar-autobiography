import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import ManoharaLanding from "@/components/ManoharaLanding";
import type { ManoharaIndex, ManoharaProvenance } from "@/data/manohara";

function loadIndex(): ManoharaIndex | null {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public/data/cinema/manohara/index.json"), "utf-8"),
    );
  } catch {
    return null;
  }
}

function loadProvenance(): ManoharaProvenance | null {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public/data/cinema/manohara/provenance.json"), "utf-8"),
    );
  } catch {
    return null;
  }
}

const description =
  "Manohara (மனோகரா) — Kalaignar M. Karunanidhi's 1954 screenplay/dialogue booklet, in the original Tamil with a source-linked English reading layer. Read across 57 archival navigation segments; the printed booklet numbers no scenes.";

export const metadata: Metadata = {
  title: "Manohara — மனோகரா | Kalaignar Digital Library",
  description,
  openGraph: { title: "Manohara — மனோகரா | Kalaignar Digital Library", description },
  twitter: { title: "Manohara — மனோகரா", description },
};

export default function ManoharaLandingPage() {
  const index = loadIndex();
  const provenance = loadProvenance();
  if (!index) {
    // Data missing (should never happen in a built deploy) — render nothing rather
    // than a fabricated page. The route still exists; the catalog link is the source of truth.
    return null;
  }
  return <ManoharaLanding index={index} source={provenance?.source ?? null} />;
}
