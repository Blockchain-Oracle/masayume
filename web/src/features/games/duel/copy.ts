/**
 * Everything the duel says.
 *
 * Two claims here have to stay exactly true, because they are the ones a player would be angriest to
 * find wrong. **Free is not free of money**: a Free duel escrows no side-pot, but every pick is a real
 * capped market order on the venue, and the player keeps that position's economics either way. And
 * **nobody pays the gas but the player** — there is no sponsor on this deployment, so every pick is a
 * transaction they sign and fund themselves (`06-game-architecture.md` §Actors, keys, gas and security).
 */
export const DUEL = {
  eyebrow: "Head to head on live Windows",
  title: "Duel",
  intro: "A committed deck of the venue's live Windows, dealt to two players at once. Both swipe every card; the arena places each pick as a real order and settles on the venue's own outcome.",

  auth: {
    unavailable:
      "This deployment has no duel room. The arena, the room server and the matchmaker are separate things, and at least one of them is not configured here.",
    signTitle: "One signature opens the room",
    signBody:
      "The duel room needs to know this browser is your wallet. Signing is not a transaction: it moves no funds, costs no gas, and lasts one sitting.",
    sign: "Sign to open the room",
    signing: "Waiting for your wallet…",
    refused: "The room refused that signature.",
    retry: "Try again",
    connectTitle: "Connect a wallet to duel",
    connectBody: "A duel escrows against your address and places orders you own. There is nothing to show until there is a wallet.",
  },

  status: {
    connecting: "Opening the room…",
    reconnecting: "The room dropped. Reconnecting…",
    closed: "The room is closed.",
    open: "Room open",
  },

  entry: {
    mode: "Mode",
    tier: "Stake",
    free: "Free",
    ranked: "Ranked",
    freeBlurb: "No side-pot. Every pick is still a real order you own.",
    rankedBlurb: "A side-pot both players escrow, plus the same real orders. Only Ranked moves a rating.",
    tierFree: "No pot",
    tierUnits: (units: number, symbol: string) => `${units} ${symbol}`,
    cost: "What this costs",
    costPot: (amount: string, symbol: string) => `${amount} ${symbol} escrowed as your half of the side-pot, returned or won at the end.`,
    costNoPot: "No side-pot is escrowed.",
    costCards: (cap: string, symbol: string) =>
      `Up to ${cap} ${symbol} per card, spent as a real order on that Window. You keep what those positions pay, win or lose the pot.`,
    costGas: "One transaction per pick, signed and paid by you. There is no sponsor on this deployment.",
    find: "Find a match",
    finding: "Finding…",
    /** The room is not reachable, so the search cannot even be asked for. Not the same as searching. */
    waitingRoom: "Waiting for the room…",
    unavailable: "Unavailable",
    paused: "The arena is paused by its operator. No new match can be created.",
    tierDisabled: "That stake is not enabled on the deployed arena.",
    notDeployed: "No GameArena is deployed on this network.",
    balance: "Your balance",
    balanceShort: (need: string, have: string, symbol: string) => `This entry needs ${need} ${symbol} and this wallet holds ${have}.`,
    gasNeeded: "Picks are your own transactions, so this wallet also needs STT for gas.",
    /**
     * Said before the search, not at the first transaction.
     *
     * A duel with no gas is a duel that cannot be opened, joined or played, and finding that out at the
     * "open the match" button costs the other player the whole pairing. On 2026-09-04 both browsers in a
     * live session held 0 STT and the entry let them queue anyway.
     */
    gasShort: "This wallet holds no STT, and every step of a duel — opening the match, joining it, each pick — is a transaction you sign and pay for yourself.",
    gasCheck: "Checking this wallet can pay for its own transactions…",
    gasRecheck: "I have funded it — check again",
  },

  queue: {
    title: "Looking for an opponent",
    waiting: (n: number) => `${n} waiting in this queue`,
    band: (band: number) => `Rating band ±${band}`,
    waited: (sec: number) => `Waited ${sec}s`,
    /** Three answers, never merged — see `QueueView.nextDeckInSec`. */
    deckUnknown: "Checking what the venue can deal…",
    deckNone: "The venue has no deck to deal within the hour. The queue stays open; a Window opening changes this.",
    deckIn: (sec: number) => (sec === 0 ? "A deck is dealable now" : `Next deck dealable in ${sec}s`),
    deckWhy: "A duel needs live Windows with enough time left for both players to play every card.",
    leave: "Leave the queue",
    left: "You left the queue.",
    expired: "The queue timed out before it found an opponent.",
  },

  lobby: {
    matched: "Opponent found",
    opponent: "Opponent",
    you: "You",
    rating: (rating: number) => `Rating ${rating}`,
    committing: "Sealing the deck…",
    committingBody:
      "The deck is chosen and hashed before either of you sees a card. The hash goes on chain first, so the cards cannot be changed once they are known.",
    committed: "Deck sealed",
    committedBody: "This is the commitment the arena will check the revealed deck against.",
    /** The creator's own transaction, named as one: it escrows and puts the deck's hash on chain. */
    openCta: "Open the match",
    openBody: (pot: string, symbol: string) =>
      pot === "0"
        ? "You opened this search, so the match is yours to put on chain. This transaction escrows nothing and publishes the sealed deck's hash."
        : `You opened this search, so the match is yours to put on chain. This transaction escrows your ${pot} ${symbol} and publishes the sealed deck's hash.`,
    joinCta: "Join the match",
    joinBody: (pot: string, symbol: string) =>
      pot === "0" ? "The match is on chain and waiting for you. Joining escrows nothing and starts the reveal." : `The match is on chain and waiting for you. Joining escrows your ${pot} ${symbol} and starts the reveal.`,
    waitingCreate: "Waiting for the other player to put the match on chain.",
    opening: "Opening…",
    joining: "Joining…",
    noSigner: "This browser has no signing session, so it cannot send the transaction this match needs.",
    commitment: "Commitment",
    cards: (n: number) => `${n} cards`,
    revealing: "Opening the deck…",
    revealed: "Deck open",
    waitingPot: "Waiting for both side-pots to land on chain.",
    seatCreator: "You opened this match",
    seatChallenger: "You were matched into this one",

    /** The wait, named. A spinner cannot tell a browser's second from the venue's ninety. */
    seedWait: (seedsIn: number) => (seedsIn >= 2 ? "Both seeds are in." : `${seedsIn} of 2 seeds are in.`),
    seedBody: "Each browser reveals the seed it committed to when it queued. Neither side, and not the server, can choose one after seeing the other's.",
    venueWait: "The venue rolls its Windows on fixed boundaries, and a duel needs ones with enough life left for both players to play every card. For a few minutes an hour there are none, and this is one of those minutes.",
    deckIn: (sec: number) => (sec <= 0 ? "A deck is dealable now" : `Next dealable deck in ${sec}s`),
    deckUnknown: "Checking what the venue can deal…",
    deckNone: "The venue has nothing dealable within the hour.",
    givesUp: (sec: number) => `This pairing is given up on in ${sec}s`,
    /** The pre-chain deadline: a sealed deck nobody pays for is released rather than left on screen. */
    createBy: (sec: number) => `${sec}s left to put this match on chain`,
    createLapsed: "The window to put this match on chain has passed.",

    /** A pairing that ended before anything reached the chain. Never an error plate: it is a state. */
    dissolvedTitle: "That pairing fell through",
    dissolvedAgain: "Nobody paid anything and nothing was staked. Searching again with a fresh seed…",
    dissolvedStop: "That will happen the same way again. Nothing was staked.",

    /** A transaction the arena or this browser refused, said out loud rather than swallowed. */
    refusedTitle: "That transaction was not sent",
    refusedRetry: "Try again",
  },

  picking: {
    title: "Play every card",
    stake: "Stake per card",
    cost: "This buys",
    costPending: "Reading the book…",
    left: "Left to pick",
    deadline: "Pick deadline",
    /** The arena's own gate, not our client buffer — see `picking.ts`. */
    tooLate: "This card is too close to its settlement for the arena to take an order on it. It cannot be played.",
    placing: (attempt: number) => (attempt === 1 ? "Placing your pick…" : `Asking again — attempt ${attempt}`),
    raceNote: "Both players draw on the same book, so a pick can lose a race. Asking again is normal and costs nothing extra.",
    failed: "That card did not fill before the deadline. The pot still settles on the cards that did.",
    opponentDeciding: "Your opponent is on this card",
    yourPicks: "Your picks",
    filled: (size: string, cost: string, symbol: string) => `${size} for ${cost} ${symbol}`,
  },

  settling: {
    lockedTitle: "Every pick is in",
    lockedBody: "Nothing more can be played. Each card settles when its own Window closes, which is the venue's clock and not this screen's.",
    title: "Settling",
    progress: (settled: number, total: number) => `${settled} of ${total} cards settled`,
    body: "A card is settled by anyone — the operator's settler, you, or the other player. Nothing here depends on this page staying open.",
    waitingCard: "waiting on its Window",
    /** Doc 04's recovery requirement: the operator's settler is not the only way this finishes. */
    crankTitle: "Nothing has to wait for the operator",
    crankBody:
      "Settling a card and awarding the pot are permissionless. If the operator's settler is not running, you can send either yourself — neither can send the money anywhere the arena has not already recorded.",
    settleCard: (asset: string) => `Settle ${asset}`,
    settling: "Settling…",
    finalize: "Award the pot",
    finalizing: "Awarding…",
  },

  result: {
    title: "Result",
    won: "You took the match",
    lost: "Your opponent took it",
    tied: "Level — the pot was split",
    noWinner: "No winner",
    you: "You",
    opponent: "Opponent",
    pnl: "Real PnL",
    pnlNote: "Payout minus what the arena actually paid for each fill, measured by the contract around the order. Not a score.",
    /** No amount here on purpose: this screen does not hold the pot's size, and a wrong 0 is worse than none. */
    potNote: "Both side-pots follow that comparison — the arena credits them to the winner.",
    freePotNote: "Free duels escrow no side-pot, so the only money here is your own positions.",
    forfeitTitle: "A player did not finish",
    forfeitBody: "The cards that were played still settle and still pay whoever played them. Only the pot follows the forfeit.",
    /** What the arena is holding for this wallet — card payouts and pot alike, waiting on a pull. */
    credit: "The arena owes you",
    claim: "Claim",
    claiming: "Claiming…",
    claimed: "Claimed",
    nothingToClaim: "The arena is holding nothing for this wallet.",
    claimNote: "One transaction, and it pays the player named on it — never the caller. The credit does not expire.",
    cards: "Cards",
    cost: "Cost",
    payout: "Payout",
    unsettled: "—",
    again: "Play another",
  },

  /** Phases this build does not draw yet. It says where the match really is; it invents nothing. */
  beyond: {
    title: "This match is past what this build can show",
    /** Still running: the cranks that finish it need nobody watching. */
    live: "Every pick is in and the match is settling on chain. Nothing is lost: settlement, the pot and every payout are permissionless cranks that run without this screen.",
    /** Already decided: the arena holds the result and the credit, and neither expires. */
    done: "The arena has decided this match and holds whatever it owes you as credit. The result and the claim are the next slice; the credit does not expire while you wait for it.",
    match: "Match",
    phase: "Phase",
  },

  ended: {
    cancelled: "You left before a match was found.",
    dropped: "The room dropped while you were waiting, and a queue entry does not survive its connection — so you are no longer in it. Nothing was staked. Search again whenever you like.",
    expired: "The queue timed out.",
    refunded: {
      "creator-cancelled": "The match was withdrawn before anyone joined. Both pots were returned.",
      "join-timeout": "Nobody joined in time. The pot was returned.",
      "reveal-unavailable": "The deck could not be opened, so both pots were returned. No card was ever played.",
      "both-incomplete": "Neither player finished their picks, so both pots were returned.",
    },
    again: "Find another match",
  },

  error: {
    dismiss: "Dismiss",
    retryable: "That is worth trying again.",
    terminal: "That will be refused again the same way.",
  },
} as const;
