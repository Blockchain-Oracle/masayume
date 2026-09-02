/**
 * The strategy desk's off-chain records. Consent, caps and fees live on the StrategyRegistry and
 * the EventVault; this store holds only what the chain cannot say for a browser: the runner's own
 * heartbeats, the receipts of the fills it placed, and creators' plain-text playbooks.
 *
 * Writers (AD-7): `runner_heartbeats` and `strategy_fills` → ops (the runner); `strategy_playbooks` → web.
 */
export const STRATEGIES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS runner_heartbeats (
  id            BIGSERIAL PRIMARY KEY,
  -- Lowercased runner key.
  runner        TEXT        NOT NULL,
  strategy_id   TEXT        NOT NULL,
  tick_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  interval_ms   INTEGER     NOT NULL,
  -- The cycle in the runner's own words: "scanned 6 markets, closest trigger 8 bps away".
  why           TEXT        NOT NULL,
  scanned       INTEGER     NOT NULL DEFAULT 0,
  closest_bps   INTEGER,
  dry_run       BOOLEAN     NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS runner_heartbeats_strategy_idx
  ON runner_heartbeats (strategy_id, tick_at DESC);

CREATE TABLE IF NOT EXISTS strategy_fills (
  tx_hash       TEXT        PRIMARY KEY,
  strategy_id   TEXT        NOT NULL,
  grant_id      TEXT        NOT NULL,
  -- Lowercased subscriber address: the position's owner, by construction.
  owner         TEXT        NOT NULL,
  market_id     TEXT        NOT NULL,
  side          TEXT        NOT NULL CHECK (side IN ('up', 'down')),
  -- Base units as decimal strings, never floats.
  cash_delta    TEXT        NOT NULL,
  token_delta   TEXT        NOT NULL,
  at_sec        BIGINT      NOT NULL,
  dry_run       BOOLEAN     NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS strategy_fills_strategy_idx
  ON strategy_fills (strategy_id, at_sec DESC);

CREATE TABLE IF NOT EXISTS strategy_playbooks (
  strategy_id   TEXT        PRIMARY KEY,
  -- Lowercased creator address that wrote it, verified from a signature before upsert.
  creator       TEXT        NOT NULL,
  body          TEXT        NOT NULL CHECK (length(body) <= 4000),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;
