"use client";

import { LUCKY } from "./copy";

/** Beside the cabinet: the mode's own sentence and the two things a player should know before the first spin. */
export function LuckySide() {
  return (
    <aside className="lk-side">
      <p className="lk-intro">{LUCKY.intro}</p>
      <div className="gm-plate">
        <p className="gm-plate-title">{LUCKY.deal.proof.label}</p>
        <p className="gm-plate-body">{LUCKY.deal.proof.scope}</p>
      </div>
      <div className="gm-plate">
        <p className="gm-plate-body">{LUCKY.deal.honesty}</p>
      </div>
    </aside>
  );
}
