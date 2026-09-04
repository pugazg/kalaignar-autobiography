import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import ManthiriKumariSource from "@/components/ManthiriKumariSource";
import type { ManthiriReader } from "@/data/manthiri-kumari";

const DIR = "public/data/cinema/manthiri-kumari";
function load<T>(file: string): T | null {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), DIR, file), "utf-8")); } catch { return null; }
}

export const metadata: Metadata = {
  title: "மூலமும் சான்றும் — Manthiri Kumari source & provenance | Kalaignar Digital Library",
  description:
    "The controlling scan, printed credit, structural census, unresolved song authorship, cross-witness " +
    "posture and integrity aggregates behind the Digital Library's மந்திரி குமாரி edition.",
};

export default function ManthiriKumariSourcePage() {
  const reader = load<ManthiriReader>("reader.json");
  const prov = load<Parameters<typeof ManthiriKumariSource>[0]["prov"]>("provenance.json");
  if (!reader || !prov) notFound();
  return <ManthiriKumariSource reader={reader} prov={prov} />;
}
