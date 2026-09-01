"use client";

import { useState } from "react";
import { usePlainWords } from "@/features/markets/plain-words";
import { ConnectButton } from "@/features/markets/wallet";
import { cn } from "@/lib/utils";
import { TUTORIAL_UI } from "./steps";

type Reading = "plain" | "full";

/**
 * The closing screen — ported from Tutorial.tsx L117–137.
 *
 * The reference asks Simple/Pro and writes `yosuku_trade_mode` for a TradePanel
 * that has two layouts. Masayume's ticket has one, so a literal port would ship a
 * choice that changes nothing. The same question is asked of the control that
 * *does* exist: `plainWords`, which switches the live-Window rail between chart
 * cards and plain Yes/No questions, and which sits on the page behind this modal.
 *
 * Picking does not close the walkthrough. Like the reference, the last screen
 * ends on Connect, so it stays open until the wallet lands (or the user skips).
 */
export function TutorialChoice({ description }: { description: string }) {
  const [, setPlainWords] = usePlainWords();
  const [picked, setPicked] = useState<Reading | null>(null);

  const choose = (reading: Reading) => {
    setPicked(reading);
    setPlainWords(reading === "plain");
  };

  return (
    <>
      <p className="mb-3 text-sm leading-relaxed text-gray-400">{TUTORIAL_UI.choicePrompt}</p>

      <div className="mb-5 grid grid-cols-2 gap-3">
        {(
          [
            ["plain", TUTORIAL_UI.plain],
            ["full", TUTORIAL_UI.full],
          ] as const
        ).map(([reading, copy]) => (
          <button
            key={reading}
            type="button"
            onClick={() => choose(reading)}
            aria-pressed={picked === reading}
            data-cursor="hover"
            className={cn(
              "rounded-xl border px-4 py-4 text-left transition-colors",
              picked === reading
                ? "border-vermilion bg-vermilion/[0.1]"
                : "border-white/[0.12] bg-white/[0.03] hover:border-vermilion/50 hover:bg-white/[0.06]",
            )}
          >
            <span className="block font-display text-lg font-bold text-white">{copy.title}</span>
            <span className="mt-1 block text-xs leading-snug text-gray-500">{copy.note}</span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-4">
        <div className="tutorial-eyebrow mb-1 font-mono uppercase text-gray-600">{TUTORIAL_UI.lastStep}</div>
        <p className="mb-0.5 text-sm font-semibold text-white">{TUTORIAL_UI.connectTitle}</p>
        <p className="mb-3 text-xs leading-snug text-gray-500">{TUTORIAL_UI.connectNote}</p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>

      <p className="tutorial-fineprint mt-3 text-gray-600">{description}</p>
    </>
  );
}
