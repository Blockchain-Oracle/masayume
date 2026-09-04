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
    /**
     * True of this build and nothing else: the pairing and the commitment are done, and the next step
     * is the creator's own `createMatch` transaction, which the pick surface carries. Until that
     * exists a sealed deck stays sealed, and a screen that implied otherwise would be lying by
     * omission — a spinner is a promise.
     */
    createPending:
      "The next step is a transaction from the player who opened this match, which escrows the pot and puts the deck on chain. This build does not send it yet, so this deck stays sealed. Nothing has been staked.",
    commitment: "Commitment",
    cards: (n: number) => `${n} cards`,
    revealing: "Opening the deck…",
    revealed: "Deck open",
    waitingPot: "Waiting for both side-pots to land on chain.",
    seatCreator: "You opened this match",
    seatChallenger: "You were matched into this one",
  },

  /** Phases this build does not draw yet. It says where the match really is; it invents nothing. */
  beyond: {
    title: "This match is past what this build can show",
    body: "The deck is open and the match is live on chain. Nothing is lost: settlement, the pot and every payout are permissionless cranks that run without this screen.",
    match: "Match",
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
