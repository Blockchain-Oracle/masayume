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
    title: "Match in progress",
    body: "The arena still has this match open. It always wins over starting a new one.",
    cta: "Go back to it",
  },

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

  history: {
    title: "Finished matches",
    pending:
      "Finished matches are read back from the arena's own events, indexed so a history page is one query rather than a log replay. The arena is not built yet.",
    dependency: "GameArena and the ops projector (slices 6–7)",
  },

  settings: {
    title: "Game settings",
    intro: "These apply the moment you change them, and they stay on this device.",
    sound: { label: "Sound", hint: "Short tones on picks, locks and results." },
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
