"use client";

import type { ReactNode } from "react";
import { GameSettingsSheet } from "./GameSettingsSheet";
import { GamesProvider, useGames } from "./GamesProvider";
import { GamesRail } from "./GamesRail";
import "./games.css";

/**
 * The `/games` frame: settings, the rail, the active match and the accent, owned once for all
 * seven modes.
 *
 * Doc 06 calls this a "dark stage frame". It follows the theme instead, and that is a deliberate
 * divergence: the owner ruled on 2026-09-01 that the reel card must follow the theme after a dark
 * island rendered near-black ink on a near-black card in light mode. The one place a dark ground is
 * genuinely part of the mechanic is the arcade canvas, which paints its own surface in slice 4 and
 * will take `reel-theme.css`'s ink-triplet treatment rather than raw `var(--white)`.
 */
export function GamesShell({ children }: { children: ReactNode }) {
  return (
    <GamesProvider>
      <GamesFrame>{children}</GamesFrame>
    </GamesProvider>
  );
}

function GamesFrame({ children }: { children: ReactNode }) {
  const { reducedMotion, settings } = useGames();
  return (
    // `data-reduced-motion` is the single switch every stage animation reads. A stage must never
    // consult the media query itself: the player's explicit choice has to beat the OS, and it can
    // only do that if there is one place that resolves the two.
    <div className="gm-frame" data-reduced-motion={reducedMotion ? "true" : "false"} data-accent={settings.accent}>
      <GamesRail />
      {children}
      <GameSettingsSheet />
    </div>
  );
}
