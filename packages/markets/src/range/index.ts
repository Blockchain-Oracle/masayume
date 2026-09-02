export { resolveRangeDeployment } from "./deployment";
export { diagnoseRange } from "./errors";
export {
  getRange,
  getRangeReserveState,
  getRangeSharesOf,
  listRangesOf,
  previewRangeBasis,
  previewRangeOpen,
  quoteRangeOnchain,
  toRangeParams,
  toRangeRound,
  type RangeBand,
  type RangePreview,
  type RangeWindowBasis,
} from "./read";
export { bookRangeOpen, ensureRangeAllowance, sendRangeIntent, submitRangeOpen, submitRangeTx, summarizeRange, writeRangeReserve, type RangeOpenOutcome, type RangeTxContext } from "./write";
