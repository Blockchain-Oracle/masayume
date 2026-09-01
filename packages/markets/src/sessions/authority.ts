/**
 * Who is signing, and under what authority.
 *
 * Authority is part of a session's identity because the product has several actors that
 * can sign concurrently. Naming the authority makes "which actor sent this?" answerable
 * from the journal and the receipt, rather than inferred from whichever signer happened to
 * be bound at the time.
 */
export type AuthorityKind =
  /** The person, signing from their own external wallet. Unrestricted over their own funds. */
  | "user-wallet"
  /** The person, signing from an embedded/smart account they own. */
  | "smart-wallet"
  /** A short-lived browser session key acting for the user under a bounded grant. */
  | "session-key"
  /** The X relay executing a parsed instruction under an X_EXECUTOR grant. */
  | "x-executor"
  /** A strategy runner executing inside a STRATEGY grant. */
  | "strategy-runner"
  /** A per-player game submitter under a GAME_SESSION grant. */
  | "game-session"
  /** The market-making actor for the Earn vault. */
  | "market-maker"
  /** Claim/settlement advancement. Cannot redirect a payout. */
  | "claim-actor"
  /** Pays policy-approved gas. Never has user-fund authority. */
  | "sponsor";

/** Authorities that act on a user's behalf rather than as the user, so they must be granted. */
const DELEGATED: ReadonlySet<AuthorityKind> = new Set<AuthorityKind>([
  "session-key",
  "x-executor",
  "strategy-runner",
  "game-session",
  "market-maker",
  "claim-actor",
  "sponsor",
]);

export function isDelegated(authority: AuthorityKind): boolean {
  return DELEGATED.has(authority);
}
