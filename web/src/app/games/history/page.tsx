import type { Metadata } from "next";
import { DuelHistory } from "@/features/games/duel/DuelHistory";

export const metadata: Metadata = { title: "Your duels" };

export default function Page() {
  return <DuelHistory />;
}
