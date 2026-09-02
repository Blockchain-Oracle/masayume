/**
 * The social store's schema. Social records only; chain truth is never stored here.
 *
 * Inline rather than a `.sql` file read at runtime: a bundler does not carry loose
 * files next to the module that reads them, so a schema loaded off disk works in
 * dev and fails on deploy — the worst place to find out. This travels with the code
 * that runs it.
 *
 * Idempotent, so applying it twice is safe and it can run on first use.
 *
 * What is deliberately NOT here: any claim about who may read or post. That gate is
 * the chain's — the route checks the caller holds a position before it will accept
 * a row — and a second copy of the rule in a constraint is how the two drift apart.
 */
export const ROOM_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS room_comments (
  id           BIGSERIAL PRIMARY KEY,
  -- The market this Room is about. Rooms are per-Window, as the reference's are: a
  -- comment about a 5m round is not a comment about the next one.
  market_id    TEXT        NOT NULL,
  -- Lowercased 0x address, verified from a signature before insert.
  author       TEXT        NOT NULL,
  body         TEXT        NOT NULL CHECK (length(body) BETWEEN 1 AND 280),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The only read the Room makes: newest comments for one market.
CREATE INDEX IF NOT EXISTS room_comments_market_idx
  ON room_comments (market_id, created_at DESC);
`;

/**
 * A take: a public call on one Window, in the caller's words.
 *
 * The reference's take is two records — the words on Walrus and a `TakePosted` event
 * on-chain that carries author, market, side and the backing order id, "the
 * verifiable spine". Here one row carries both, and the spine is the wallet's own
 * signature over the call (`signature`, `issued_at_ms`), which the route verifies
 * before insert and which anyone can re-verify from the row.
 *
 * The Window's facts are snapshotted at post time (asset, cadence, expiry, the line)
 * because a take outlives its Window: the reel renders a call about a round that
 * closed an hour ago without a market lookup that may no longer answer.
 */
export const TAKES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS takes (
  id            BIGSERIAL PRIMARY KEY,
  market_id     TEXT        NOT NULL,
  -- Lowercased 0x address, verified from the signature before insert.
  author        TEXT        NOT NULL,
  side          TEXT        NOT NULL CHECK (side IN ('up', 'down')),
  caption       TEXT        NOT NULL CHECK (length(caption) <= 240),
  asset         TEXT        NOT NULL,
  interval_sec  INTEGER     NOT NULL,
  expiry_sec    INTEGER     NOT NULL,
  -- The opening print on the oracle's scale, as a decimal string; null when the
  -- call was posted before the print landed.
  line_raw      TEXT,
  -- Held a position on this Window at post time — a chain read the route makes,
  -- never a claim the client gets to assert.
  backed        BOOLEAN     NOT NULL,
  signature     TEXT        NOT NULL,
  issued_at_ms  BIGINT      NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The only read the reel makes: the newest takes, venue-wide.
CREATE INDEX IF NOT EXISTS takes_created_idx
  ON takes (created_at DESC);
`;

export const SCHEMA_SQL = `${ROOM_SCHEMA_SQL}\n${TAKES_SCHEMA_SQL}`;
