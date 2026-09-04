import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import RajaRaniSource from "@/components/RajaRaniSource";
import type { RajaRaniReader } from "@/data/raja-rani";

const DIR = "public/data/cinema/raja-rani";
function load<T>(file: string): T | null {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, file), "utf-8")); } catch { return null; }
}

export const metadata: Metadata = {
  title: "மூலமும் சான்றும் — Raja Rani source & provenance | Kalaignar Digital Library",
  description:
    "The controlling scan, page census, screenplay/song structure, frozen song-authorship tiers, the " +
    "review-level archival-segment-58/song-11 relation and the deleted-record and stamp exclusions behind the " +
    "Digital Library's ராஜா ராணி edition.",
};

export default function RajaRaniSourcePage() {
  const reader = load<RajaRaniReader>("reader.json");
  const prov = load<Parameters<typeof RajaRaniSource>[0]["prov"]>("provenance.json");
  if (!reader || !prov) notFound();
  return <RajaRaniSource reader={reader} prov={prov} />;
}
