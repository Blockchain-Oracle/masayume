/**
 * Stage 6's off-chain records: who a player is in the games, who they follow, how they like the stages
 * to feel, and a readable history of matches the arena already settled.
 *
 * The boundary this file must not blur: `GameArena` is the economic truth. `duel_matches` and
 * `duel_cards` are an **indexed projection** of its events, kept so a history page is one query rather
 * than a log replay — never a second opinion. Every economic row therefore carries the chain's own
 * `(chainId, txHash, logIndex)` as `log_key`, so re-indexing is idempotent, and any disagreement is
 * settled by re-reading the arena rather than by trusting a row here. Ratings, follows, settings and
 * arcade scores have no chain counterpart at all; they are this store's own.
 *
 * Writers (AD-7): `game_profiles`, `game_settings`, `game_follows` and `arcade_scores` → web (each
 * behind a signature check); `duel_matches`, `duel_cards` and `game_ratings` → ops (the projector and
 * the settler). Web never writes a rating: a ladder a browser can post to is not a ladder.
 */
export const GAMES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS game_profiles (
  -- Lowercased 0x address, verified from a signature before upsert.
  wallet        TEXT        PRIMARY KEY,
  -- The accent the player picked for their stage and share cards; one of the shell's own tokens.
  accent        TEXT        NOT NULL DEFAULT 'default',
  -- Consecutive days with at least one verified game. Recomputed by ops, never incremented by a client.
  streak_days   INTEGER     NOT NULL DEFAULT 0,
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_settings (
  wallet          TEXT        PRIMARY KEY,
  sound           BOOLEAN     NOT NULL DEFAULT true,
  haptics         BOOLEAN     NOT NULL DEFAULT true,
  -- The player's explicit choice. Absent, the stage still follows the OS's prefers-reduced-motion.
  reduced_motion  BOOLEAN,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Directional follows, the owner's decision: no approval handshake, so following is never blocked on
-- someone else acting. A mutual pair is simply two rows.
CREATE TABLE IF NOT EXISTS game_follows (
  follower    TEXT        NOT NULL,
  followee    TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower, followee),
  CHECK (follower <> followee)
);

CREATE INDEX IF NOT EXISTS game_follows_followee_idx
  ON game_follows (followee, created_at DESC);

-- One transparent Elo ladder: 1000 to start, K=48 for the first ten verified matches, then K=24.
CREATE TABLE IF NOT EXISTS game_ratings (
  wallet            TEXT        PRIMARY KEY,
  rating            INTEGER     NOT NULL DEFAULT 1000,
  -- Matches that reached a real result. Refunds and void-only matches are excluded, so they cannot
  -- push a player out of their provisional window without the ladder having learned anything.
  verified_matches  INTEGER     NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS game_ratings_ladder_idx
  ON game_ratings (rating DESC);

CREATE TABLE IF NOT EXISTS duel_matches (
  -- The arena's own match id, hex. Unique per chain, so the chain id rides along for a multi-chain read.
  match_id        TEXT        PRIMARY KEY,
  chain_id        INTEGER     NOT NULL,
  arena           TEXT        NOT NULL,
  mode            TEXT        NOT NULL CHECK (mode IN ('free', 'ranked')),
  tier            TEXT        NOT NULL CHECK (tier IN ('free', 't1', 't5', 't10')),
  creator         TEXT        NOT NULL,
  challenger      TEXT,
  status          TEXT        NOT NULL CHECK (status IN
                    ('waiting','activeUnrevealed','picking','settling','finalized','refunded','forfeited')),
  deck_hash       TEXT        NOT NULL,
  deck_size       INTEGER     NOT NULL CHECK (deck_size BETWEEN 3 AND 5),
  policy_version  INTEGER     NOT NULL,
  -- Base units as decimal strings, never floats — the same rule the strategy fills follow.
  pot_per_player  TEXT        NOT NULL,
  winner          TEXT,
  creator_pnl     TEXT,
  challenger_pnl  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalized_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS duel_matches_creator_idx
  ON duel_matches (creator, created_at DESC);

CREATE INDEX IF NOT EXISTS duel_matches_challenger_idx
  ON duel_matches (challenger, created_at DESC);

CREATE TABLE IF NOT EXISTS duel_cards (
  -- The chain's own log identity for the fill: re-indexing the same event twice writes the same row.
  log_key       TEXT        PRIMARY KEY,
  match_id      TEXT        NOT NULL,
  card_index    INTEGER     NOT NULL,
  player        TEXT        NOT NULL,
  market_id     TEXT        NOT NULL,
  side          TEXT        NOT NULL CHECK (side IN ('up', 'down')),
  -- Measured by the arena around the IOC, not quoted by a screen. Decimal strings.
  quantity      TEXT        NOT NULL,
  cost          TEXT        NOT NULL,
  -- Null until the card settles; a voided card still pays its real redemption.
  payout        TEXT,
  filled_at_sec BIGINT      NOT NULL,
  UNIQUE (match_id, card_index, player)
);

CREATE INDEX IF NOT EXISTS duel_cards_match_idx
  ON duel_cards (match_id, card_index);

-- Arcade scores are product state and say so on every board: "arcade score · not on-chain".
CREATE TABLE IF NOT EXISTS arcade_scores (
  id              BIGSERIAL   PRIMARY KEY,
  game            TEXT        NOT NULL CHECK (game IN ('line-rider', 'candle-hop')),
  wallet          TEXT        NOT NULL,
  score           INTEGER     NOT NULL CHECK (score >= 0),
  -- The engine build the run was produced by: a score from an older engine is not comparable.
  engine_version  INTEGER     NOT NULL,
  duration_ms     INTEGER     NOT NULL CHECK (duration_ms > 0),
  -- What the server checked before accepting: 'replayed' re-ran the trace, 'envelope' only bounded it.
  checked         TEXT        NOT NULL CHECK (checked IN ('replayed', 'envelope')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS arcade_scores_board_idx
  ON arcade_scores (game, engine_version, score DESC);

CREATE INDEX IF NOT EXISTS arcade_scores_wallet_idx
  ON arcade_scores (wallet, created_at DESC);
`;
