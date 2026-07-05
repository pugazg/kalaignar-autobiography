import type { Metadata } from "next";
import Library from "@/components/Library";

export const metadata: Metadata = {
  title: "The Reading Room — Nenjukku Neethi | Kalaignar Digital Library",
  description:
    "Read the complete six-volume Nenjukku Neethi in the original Tamil: 391 chapters with bookmarks, reading position and citations.",
};

export default function ReadIndex() {
  return <Library />;
}
