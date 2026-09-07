# Masayume

Masayume is a prediction arcade built on Somnia Shannon and DreamDEX Event Contracts. It brings live BTC and ETH event markets, bounded trading agents, trade commands on X, and short market games into one application.

Prediction markets often ask users to understand a trading terminal before they can try a simple idea. Masayume presents each market as a **Window**: an asset, an opening price, an expiry, and an UP or DOWN outcome. The same contracts power several ways to participate, with the cost and permission requirements shown before execution.

## Try the product

- App: https://masayume.app
- Demo video and transaction evidence: https://masayume.app/demo
- Step-by-step documentation: https://docs.masayume.app
- Source repository: https://github.com/Blockchain-Oracle/masayume
- X demonstration: https://x.com/masayume_app/status/2096704007112696288

The deployed application uses **Somnia Shannon testnet, chain 50312, and faucet assets**. Arcade scores are stored by the game service; they are not on-chain trades.

## What people can do

**Trade a Window.** Choose BTC or ETH, review the available Window and price, select a side, and see the actual route and required funds before confirming. Resolved positions expose settlement and claim actions.

**Create or copy an agent.** The builder moves through identity and approach, behavior and limits, a real test read, and publication. Momentum follows a deterministic opening-price/EMA signal. AI agents make persisted model decisions and can hold when the evidence or configured limits do not support a trade. Publication is followed by explicit funding and copy permission; it does not imply that trading has begun.

**Keep permission bounded.** Copying uses a Trading Balance grant with limits on total spending, individual trades, daily spending, open positions, execution price and expiry. Users can pause their subscription and revoke permission. Settlement proceeds return to available balance without silently replenishing a grant.

**Trade from X.** A linked wallet and a separate executor permission let an eligible mention request a trade. The reply includes a branded receipt generated from the saved execution facts: sender, market, side, Window, actual spend, outcome status and transaction hash, with a complete explorer link in the text. Invalid instructions are refused without a transaction.

**Play the arcade.** Candle Hop records a server-checked score. Moonshot creates a market-backed round with explicit purchase, settlement and payout stages. These are separate experiences with different evidence and accounting.

## How it works

The application combines a Next.js interface, TypeScript services, Solidity contracts and PostgreSQL persistence. DreamDEX market discovery, quotes, order execution and settlement are core dependencies. Existing StrategyRegistry and vault interfaces provide publication, subscriptions and bounded execution permission.

The strategy runner serializes its cycles, reserves decisions before model calls and records execution attempts before submission. Recovery reconciles uncertain transactions instead of blindly sending another order. The X relay separates mention polling, execution and reply delivery, persists receipt evidence, drains paginated mentions and fences its own replies against recursive execution.

## Verified rehearsal

The Shannon rehearsal has produced a real AI decision, bounded fill and automatic losing settlement; a corrected Momentum fill; a complete Moonshot purchase, winning settlement and claimed payout; and an X command with one execution and a publicly delivered image containing the matching sender and transaction hash. The AI loss is retained as evidence rather than presented as profitable performance.

The demo uses actual application captures and transaction evidence. The repository's acceptance ledger records revisions, failed attempts, superseded findings and remaining checks. Short Window availability still depends on upstream market creation. Paid Memory Market, Reversion and achievements remain backlog.

## Next steps

Extend the strategy acceptance record across additional market conditions, improve dependency observability, and use the documented SDK feedback to make integration and recovery easier for other builders.
