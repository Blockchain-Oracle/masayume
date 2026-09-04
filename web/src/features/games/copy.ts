/**
 * Every word the games shell says. Kept in one file so the honesty rules are readable in one
 * place: no sentence here promises an opponent, a payout, a rating or a streak that some real
 * record does not already carry, and every "not yet" names what it is waiting on.
 */
export const GAMES = {
  eyebrow: "Play the same live Windows",
  title: "Games",
  intro:
    "Seven modes over the same live markets. Each one says plainly whose money is at risk before you start, because a game that hides that is not a game.",

  sections: {
    prediction: { number: "01", title: "Prediction", desc: "Real positions or a house-funded outcome on a live Window." },
    duel: { number: "02", title: "Duel", desc: "The swipe loop — alone with no stake, or against another player." },
    arcade: { number: "03", title: "Arcade", desc: "Score-only runs. Nothing here touches the chain." },
    profile: { number: "04", title: "Your games", desc: "Who you are in the games, and what the arena has recorded for you." },
    history: { number: "05", title: "History", desc: "Every finished match, with the transactions that decided it." },
  },

  card: {
    open: "Open",
    pendingBadge: "Not connected",
    liveBadge: "Live",
    unavailableBadge: "Unavailable",
    waitingOn: (dependency: string) => `Waiting on ${dependency}`,
    paused: "Paused by the operator",
    /**
     * Who is here, said on the card and before any wallet is involved.
     *
     * The one question that decides whether a mode is worth opening used to cost a signature to answer:
     * the duel showed nothing at all until a wallet had connected and signed. A count is not private —
     * it is the same number the room already broadcasts to everyone in a queue.
     */
    searching: (n: number) => (n === 1 ? "1 player searching" : `${n} players searching`),
    inMatch: (n: number) => (n === 1 ? "1 duel in progress" : `${n} duels in progress`),
    nobody: "Nobody is searching right now",
    roomDown: "The duel room is not answering",
  },

  rail: {
    back: "Games",
    settings: "Game settings",
    resume: "Resume match",
    resumeHint: "You have a match in progress",
  },

  resume: {
    title: "Your match",
    body: "The arena still has this match open. It always wins over starting a new one.",
    cta: "Open",
    result: "See the result",
    live: "Live",
    done: "Done",
    versus: "vs",
    settled: "Cards settled",
  },
  lastGame: {
    title: "Pick up where you left off",
    body: (name: string) => `You were last in ${name}.`,
    cta: "Continue",
  },
  rank: { cta: "See the ladder" },
  howToWords: { open: "How to play", eyebrow: "How to play", close: "Close", got: "Got it" },
  /** Pips's per-game HOW TO, three sentences each — what a first-time player needs and nothing they do not. */
  howTo: {
    practice: ["Five live Windows come as cards. Swipe up if you think the price settles above its line, down if below.", "Nothing is staked; the round scores you against a bot on the real closing prints.", "Every Window's clock is real — the round ends when the last card settles."],
    duel: ["Pick a stake, find an opponent, and sign once: the entry names a key that places your picks.", "Both of you play the same sealed deck. Each swipe is a real order on that Window, at most the card's cap.", "When every card settles, the higher measured PnL takes the side-pot. Your positions are yours either way."],
    lucky: ["A live Window and a side are drawn for you from a seed you can check.", "You see the real quote before anything is placed; one tap places one order.", "It settles like any other order on the book."],
    range: ["Choose a band around the price and a Window.", "The house prices the band; you win the full payout if the print closes inside it.", "Outside the band, the stake is lost — and the odds say so up front."],
    moonshot: ["Pick a multiple. A level is solved so that hitting it pays that multiple.", "It is one band with a far edge, priced by the same house model as Range.", "Hit it and the payout is the multiple; miss and the stake is lost."],
    "line-rider": ["Ride the live price line; stay on it as long as you can.", "The score is verified against the tape after the run.", "No stake — the arcade is for the leaderboard."],
    "candle-hop": ["Hop the candles as they form on the live feed.", "The score is verified against the tape after the run.", "No stake — the arcade is for the leaderboard."],
  } as Record<string, readonly string[]>,

  profile: {
    signedOut: {
      title: "Connect a wallet to carry a profile",
      body: "Your games identity is your address — the same one that signs the orders. Nothing is stored until you play.",
    },
    you: "You",
    accent: "Accent",
    accentHint: "Your ring on stages and share cards.",
    rating: "Rating",
    record: "Record",
    streak: "Streak",
    /** Shown in place of a number when nothing has ever written that number. */
    unrecorded: "—",
    pending: "The ladder, the record and the streak are written by the arena and its projector. Neither exists yet, so there is nothing to show — not a zero.",
  },

  achievements: {
    title: "Achievements",
    pending:
      "Achievements unlock from evidence — a settled match, a verified score, a claimed credit. Until the arena writes those receipts there is nothing to unlock.",
    dependency: "GameArena's settlement events and the arcade score API",
  },

  historyPage: {
    title: "Your duels",
    connect: "Connect a wallet to see the duels it has played.",
    loading: "Reading your duels…",
    notConfigured: "This deployment has no games store, so there is no history to read here. Every match is still on chain.",
    empty: "No duels yet. The first one is one queue away.",
    live: "Live",
    won: "Won",
    lost: "Lost",
    tied: "Draw",
    free: "Free",
    ranked: (pot: string, symbol: string) => `Ranked · ${pot} ${symbol}`,
    cards: "cards",
    noOpponent: "no opponent yet",
  },
  rankPage: {
    title: "The ladder",
    intro: "Ratings move only on ranked duels the settler has verified. There is no season and no prize here — the ladder is the record.",
    loading: "Reading the ladder…",
    notConfigured: "This deployment has no games store, so there is no ladder to read here.",
    empty: "Nobody has a verified ranked duel yet.",
    you: "you",
    matches: (n: number) => (n === 1 ? "1 verified duel" : `${n} verified duels`),
  },
  history: {
    body: "Every duel you have played, newest first, with how it ended and what the arena measured.",
    cta: "See your duels",
    title: "Finished matches",
    pending:
      "Finished matches are read back from the arena's own events, indexed so a history page is one query rather than a log replay. The arena is not built yet.",
    dependency: "GameArena and the ops projector (slices 6–7)",
  },

  settings: {
    title: "Game settings",
    intro: "These apply the moment you change them, and they stay on this device.",
    sfx: { label: "Sound effects", hint: "Swipes, the match, each card as it settles, and the result. Zero is silent." },
    music: { label: "Music", hint: "A chiptune bed under the games, sequenced by the app itself rather than played from a track. Zero is silent." },
    credits: "Sound effects by Kenney (kenney.nl), CC0. The music bed is this app's own. Pixel type m6x11plus by Daniel Linssen.",
    haptics: { label: "Haptics", hint: "A short buzz on the same moments." },
    hapticsUnsupported: "This device does not report vibration support.",
    motion: {
      label: "Motion",
      hint: "Stages animate by default. Reduced keeps every state change, and drops the movement.",
      system: "Follow system",
      systemOnHint: "Your system currently asks for reduced motion.",
      systemOffHint: "Your system currently allows full motion.",
      full: "Full",
      reduced: "Reduced",
    },
    close: "Done",
    /** The one thing a player could otherwise get wrong about where these live. */
    scope: "Kept on this device. Nothing here is signed or sent anywhere.",
  },
} as const;
