import { Code } from "./DocsCode";
import { Cards, ContractsTable, KeyVals, Links, Section } from "./DocsBlocks";
import { CHAIN_ID, CONTRACTS, SDK_VERSION } from "./contracts";
import { CODE, DOCS, DREAMDEX_DOCS_URL, SDK_NPM_URL, SOURCE_URL } from "./copy";
import { DocsFoot } from "./DocsFoot";

const S = DOCS.sections;

/**
 * The nine sections, in the reference's order (L159–281), with this app's facts.
 *
 * Every claim has a file behind it:
 *   01–02  `core/copy/question.ts` (the question), `core/claims/payout.ts` (1 unit less the
 *          fee; a void pays half), `submitter/steps/quote.ts` + `funding.ts` (escrow is the limit)
 *   04     `packages/markets/package.json` (the pin), `core/ports/markets-provider.ts`,
 *          `markets/runtime/read-runtime.ts`, `markets/sessions/*`
 *   05     `markets/runtime/coordinator.ts`, `markets/provider/clock-sync.ts`, `provider/reading.ts`
 *   06     `submitter/steps/send.ts`, `status-gate.ts`, `core/lifecycle/headroom.ts`,
 *          `submitter/journal.ts`, `steps/assert-tx-ok.ts`
 *   07     `docs/implementation/parity-ledger.md` §Fill projection (the chain verification)
 *   08     `markets/src/addresses.pinned.json`
 *   09     `core/constants/faucet.ts`, `context/01-dreamdex-event-contracts.md`
 */
export function DocsContent() {
  return (
    <>
      <Section id="overview" meta={S.overview}>
        <p className="docs-lead">
          A Window is one question: <em className="ink">“Will BTC close this 5m Window at or above its opening print?”</em> You take{" "}
          <span className="ink">UP</span> or <span className="ink">DOWN</span> on a fully on-chain order book, so there is a real fill and a real
          counterparty behind every position. At expiry the oracle prints the close, settlement runs on-chain, and a winning contract redeems for one
          unit of collateral less the settlement fee. A void pays both sides 0.5.
        </p>
      </Section>

      <Section id="how-it-works" meta={S.howItWorks}>
        <p>
          An order book, a counterparty, and an oracle. Your fill is someone else’s on the other side — or a fresh Up/Down pair the pool mints from
          two opposing buyers — and the oracle decides the outcome at the close.
        </p>
        <KeyVals
          items={[
            ["Sign in", "Any EVM wallet on Somnia Shannon, through RainbowKit. This app never shows you a seed phrase."],
            ["Settle", "The oracle’s opening and closing prints. UP pays if the close is at or above the open."],
            ["Cost", "The book’s real asks for your exact size, quoted before you sign. Escrow is the protective limit, so a fill can never cost more than shown."],
          ]}
        />
      </Section>

      <Section id="four-ways" meta={S.fourWays}>
        <Cards
          items={[
            { name: "Markets", href: "/markets", body: "The hero is the ticket. Pick a side on the live Window, at every cadence the venue runs." },
            { name: "Reels", href: "/reels", body: "Swipe through live Windows, one framed card each, and tap into the one you like." },
            { name: "Portfolio", href: "/portfolio", body: "Your money by pool, open bets, settled history, and what is waiting to be collected." },
            { name: "Leaderboard", href: "/leaderboard", body: "The banzuke: a rolling day of closed calls, ranked off the venue’s own fill tape." },
          ]}
        />
      </Section>

      <Section id="chain-layer" meta={S.chainLayer}>
        <p>
          <code className="dcode">@somnia-chain/markets-sdk</code> {SDK_VERSION}, pinned to the exact version and to the protocol addresses this app was
          verified against — a drift in either fails the build. Every read and write goes through it: the indexer’s GraphQL for discovery and
          history, the RPC for anything that may gate a write. One read-only runtime is shared by every screen, and signing lives in isolated
          sessions, one per wallet, that never hand out a mutable client.
        </p>
        <Code label={CODE.provider.label}>{CODE.provider.body}</Code>
        <Links
          items={[
            ["SDK on npm", SDK_NPM_URL],
            ["Event Contracts docs", DREAMDEX_DOCS_URL],
            ["source", SOURCE_URL],
          ]}
        />
      </Section>

      <Section id="read-runtime" meta={S.readRuntime}>
        <p>
          Every route that shows a book reads one normalised book per market, derived once at a canonical depth of ten and fanned out only when
          the resting liquidity actually moved. Consumers slice what they display out of that reading, so the live store keeps one entry per pool
          instead of one per consumer.
        </p>
        <KeyVals
          items={[
            ["Book", "One entry per market at a canonical depth; the SDK’s pool watches stay ref-counted underneath."],
            ["Clock", "The chain’s, corrected by a sampled head-block offset — a countdown never runs on raw device time."],
            ["Readings", "Every read is ok, stale with its reason, or an error with a diagnosis. A failed refresh keeps the last good value and says so."],
          ]}
        />
      </Section>

      <Section id="signing" meta={S.signing}>
        <p>
          A taker order is immediate-or-cancel at the protective limit: what crosses fills now, the remainder is cancelled, and no escrow ever rests
          unseen. Before it is sent, the lane gates on the <span className="ink">head-fresh on-chain status</span> — Trading, never the indexer’s
          lagging copy — derives the order’s expiry from the headroom formula, max(30, min(300, interval × 0.4)) seconds past now and never beyond the
          market, and journals the intent, so a timeout with no hash is reconciled rather than retried. Every receipt is asserted; a reverted
          transaction is never shown as success.
        </p>
        <Code label={CODE.send.label}>{CODE.send.body}</Code>
      </Section>

      <Section id="projection" meta={S.projection}>
        <p>
          Settled history, P&amp;L, the equity curve, Trader Edge, reputation, badges and the leaderboard are one derivation: a wallet’s indexed
          fills and complete-set actions replayed into a ledger per Window, each settled by the chain’s own rule. It was checked against live
          ERC-6909 balances on <span className="ink">89 settled markets across four wallets</span> before any of it was shown — money exact on all
          89. Three venue facts it depends on, and says so where they bite: a sell beyond inventory is a collateral-backed short; redemptions leave
          no per-wallet indexer record, so whether a payout was collected is read from the live balance; the indexer pages at 1,000, so a capped
          history says it is a prefix.
        </p>
      </Section>

      <Section id="verify" meta={S.verify}>
        <p>Everything is on Somnia Shannon (chain {CHAIN_ID}). Don’t trust it. Click it.</p>
        <ContractsTable rows={CONTRACTS} />
      </Section>

      {/* Honest — the reference's cream ledger plate, a tactile inversion of the page (L257–275) */}
      <Section id="honest" meta={S.honest}>
        <div className="ledger-plate docs-plate">
          <div className="docs-disclosure-label">{DOCS.disclosureLabel}</div>
          <ul className="docs-disclosure">
            {DISCLOSURE.map(([term, detail]) => (
              <li key={term}>
                <span className="docs-disclosure-bullet" aria-hidden>
                  ·
                </span>
                <span>
                  <span className="docs-disclosure-term">{term}</span> <span className="docs-disclosure-detail">{detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <DocsFoot />
    </>
  );
}

const DISCLOSURE: ReadonlyArray<readonly [string, string]> = [
  ["Testnet only.", `Somnia Shannon, chain ${CHAIN_ID}. Collateral is tUSDC from the venue’s own faucet, up to 10,000 per call. Nothing here is money.`],
  ["Assets are the venue’s.", "The lanes list whatever DreamDEX lists — BTC and ETH today, at every cadence it runs."],
  ["The settlement fee is read from the chain.", "Never assumed. It comes off winning legs, and every receipt shows it."],
  [
    "Not yet.",
    "Leverage, range, parlays, Earn, strategies and trading from X each keep their page and say what they wait on. No page invents a number to fill itself.",
  ],
  ["Built on Somnia’s own primitives.", "The DreamDEX CLOB, ERC-6909 outcome tokens, the oracle hub. Composed, not bolted on."],
];
