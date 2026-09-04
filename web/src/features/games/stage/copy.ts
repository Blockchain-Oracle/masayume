/**
 * Every word the swipe stage says, for both modes that use it.
 *
 * The gesture is vertical because the question is: up means the price rises, down means it falls.
 * Horizontal would have been the reference's motion and the wrong metaphor here — and on a phone it
 * fights the browser's own back-swipe.
 */
export const STAGE = {
  up: "Up",
  down: "Down",
  hint: "Swipe the card up or down — or use the arrow keys, or these two.",
  hintHeld: "This card is not playable right now. The reason is above.",
  cardOf: (n: number, total: number) => `Card ${n} of ${total}`,
  cardLabel: (asset: string, cadence: string) => `${asset}, ${cadence} Window`,
  /** Read out when a card comes up, so a screen reader hears the deck advance. */
  announce: (n: number, total: number, asset: string, cadence: string) => `Card ${n} of ${total}. ${asset}, ${cadence} Window.`,
  played: (side: "up" | "down") => (side === "up" ? "You called up" : "You called down"),
  empty: {
    title: "Nothing to play",
    body: "Every card in this deck has been played.",
  },
} as const;
