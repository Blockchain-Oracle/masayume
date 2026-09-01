/**
 * The Room's storage. Social records only; chain truth is never stored here.
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
