"use client";

import type { RatingRow } from "@masayume/db";
import { shortHex } from "@masayume/core/units";
import { useEffect, useState, type CSSProperties } from "react";
import { addressHue } from "@/lib/address-hue";
import { useWalletSession } from "@/lib/wallet-session";
import { GAMES } from "../copy";

/** Flicky polls its leaderboard every ten seconds. */
const POLL_MS = 10_000;

type Feed = { configured: boolean; rows: RatingRow[]; me: RatingRow | null } | null;

/**
 * `/games/rank` — the ladder, top first, each row the settler's own rating and the matches it was
 * earned over; the connected wallet's row lit, and shown beneath the cut when it sits there. Flicky's
 * `rank.tsx` without its Season 0 overlay: there is no season programme here, and a prize breakdown
 * over a pool nobody funded would be a fabrication.
 */
export function DuelRank() {
  const { address } = useWalletSession();
  const [feed, setFeed] = useState<Feed>(null);
  const words = GAMES.rankPage;

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(`/api/games/rank${address ? `?address=${address}` : ""}`)
        .then((r) => r.json() as Promise<NonNullable<Feed>>)
        .then((body) => {
          if (alive) setFeed(body);
        })
        .catch(() => undefined);
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [address]);

  const you = address?.toLowerCase() ?? null;
  const listed = feed?.rows.some((row) => row.wallet === you) ?? false;

  return (
    <div className="container gm-page">
      <header className="du-head">
        <span className="gm-eyebrow">{GAMES.eyebrow}</span>
        <h1 className="du-title">
          {words.title}
          <span className="accent">.</span>
        </h1>
        <p className="du-body">{words.intro}</p>
      </header>
      {feed === null ? (
        <p className="du-body">{words.loading}</p>
      ) : !feed.configured ? (
        <p className="du-refusal">{words.notConfigured}</p>
      ) : feed.rows.length === 0 ? (
        <p className="du-body">{words.empty}</p>
      ) : (
        <ol className="du-ladder">
          {feed.rows.map((row, i) => (
            <Rung key={row.wallet} place={i + 1} row={row} you={row.wallet === you} />
          ))}
          {feed.me && !listed && feed.me.verifiedMatches > 0 && <Rung place={null} row={feed.me} you />}
        </ol>
      )}
    </div>
  );
}

function Rung({ place, row, you }: { place: number | null; row: RatingRow; you: boolean }) {
  const words = GAMES.rankPage;
  return (
    <li className="du-rung" data-you={you || undefined}>
      <span className="du-rung-place">{place === null ? "—" : place}</span>
      <span className="du-avatar" style={{ "--du-hue": addressHue(row.wallet) } as CSSProperties} aria-hidden />
      <span className="du-rung-main">
        <span className="du-v du-mono">
          {shortHex(row.wallet, 6, 4)}
          {you ? ` · ${words.you}` : ""}
        </span>
        <span className="du-k">{words.matches(row.verifiedMatches)}</span>
      </span>
      <span className="du-rung-rating">{row.rating}</span>
    </li>
  );
}
