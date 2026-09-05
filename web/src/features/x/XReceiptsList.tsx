import type { XReceipt } from "@masayume/core/x";
import { shortHex } from "@masayume/core/units";
import { EXPLORER_URL } from "@masayume/markets/chain";
import { TRADE_FROM_X } from "./copy";
import { receiptDisplay } from "./receipt-display";

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
        receipts.map((r) => {
          const display = receiptDisplay(r, decimals, symbol);
          return (
            <div key={r.mentionId} className="xt-receipt">
              <span className={`xt-receipt-status xt-receipt-status--${display.status}`}>{display.label}</span>
              <span className="xt-receipt-words">{r.instruction}</span>
              <span>
                {display.summary}
                {display.txHash ? (
                  <>
                    {display.summary ? " · " : ""}
                    <a href={`${EXPLORER_URL}/tx/${display.txHash}`} className="xt-receipt-link">
                      {shortHex(display.txHash)}
                    </a>
                  </>
                ) : null}
              </span>
              {r.reason && <span className="xt-receipt-reason">{r.reason}</span>}
            </div>
          );
        })
      )}
    </div>
  );
}
