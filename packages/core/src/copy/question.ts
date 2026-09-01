import { formatOracleRaw } from "../units/format";
import { formatCadence } from "./between-rounds";

export interface PlainQuestion {
  text: string;
  /** True while the opening print has not landed — the question has no level yet, and none is invented. */
  pending: boolean;
}

export const PLAIN_WORDS = {
  yes: "Yes",
  no: "No",
  pendingPrint: "waiting for the opening print",
} as const;

interface QuestionInput {
  asset: string;
  intervalSec: number;
  openingPriceRaw: bigint | null;
}

/** Restates an up/down Window as a yes/no question from typed fields only — question text is never parsed (canon #13). */
export function plainQuestion(market: QuestionInput, oracleScale: number): PlainQuestion {
  const cadence = formatCadence(market.intervalSec);
  if (market.openingPriceRaw === null) {
    return { text: `Will ${market.asset} close this ${cadence} Window at or above its opening print? (${PLAIN_WORDS.pendingPrint})`, pending: true };
  }
  const level = formatOracleRaw(market.openingPriceRaw, oracleScale);
  return { text: `Will ${market.asset} close this ${cadence} Window at or above $${level}?`, pending: false };
}
