import type { XReceipt } from "@masayume/core/x";
import { formatBaseUnits, shortHex } from "@masayume/core/units";
import { EXPLORER_URL } from "@masayume/markets/chain";
import { TRADE_FROM_X } from "./copy";

/** Every receipt links the instruction to what became of it; a refusal carries its reason in words. */
export function XReceiptsList({ receipts, configured, decimals, symbol }: { receipts: XReceipt[]; configured: boolean; decimals: number; symbol: string }) {
  return (
    <div className="xt-receipts" aria-label={TRADE_FROM_X.receipts.title}>
      <div className="xt-flow-label">{TRADE_FROM_X.receipts.title}</div>
      {!configured ? (
        <p className="xt-composer-note">{TRADE_FROM_X.receipts.none}</p>
      ) : receipts.length === 0 ? (
        <p className="xt-composer-note">{TRADE_FROM_X.receipts.empty}</p>
      ) : (
        receipts.map((r) => (
          <div key={r.mentionId} className="xt-receipt">
            <span className={`xt-receipt-status xt-receipt-status--${r.status}`}>{r.status}</span>
            <span className="xt-receipt-words">{r.instruction}</span>
            <span>
              {r.side && r.stakeBase ? `${r.side.toUpperCase()} · ${formatBaseUnits(BigInt(r.stakeBase), decimals)} ${symbol}` : ""}
              {r.txHash ? (
                <>
                  {" · "}
                  <a href={`${EXPLORER_URL}/tx/${r.txHash}`} className="xt-receipt-link">
                    {shortHex(r.txHash)}
                  </a>
                </>
              ) : null}
            </span>
            {r.reason && <span className="xt-receipt-reason">{r.reason}</span>}
          </div>
        ))
      )}
    </div>
  );
}
