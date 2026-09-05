# Reply cards: clear status, a little personality

Pair short plain text with a small branded card. The status and clickable transaction link remain understandable if the image does not load. A full hash does not need to become tiny text inside an image that cannot make it clickable.

The approved [Order filled concept](assets/x-reply-filled-concept.png) became a deterministic 1200 × 600 template using the exact mark, black, warm white and burnt orange. A paper receipt carries a different icon for each state. The renderer uses actual receipt facts; it does not ask an image model to invent transaction details. See the [six DEMO previews](previews/README.md).

## Words for each state

| What is known | Main line | Extra information |
| --- | --- | --- |
| Booked fill confirmed with a valid hash | Order filled | Asset, side, Window end and actual cost when retained. The market result comes later. |
| Confirmed transaction booked no position | No fill | A successful transaction does not guarantee a fill. |
| Transaction reverted | Order reverted | Gas may still have been spent. |
| Uncertain result or incomplete receipt data | Status needs checking | Check the transaction or app before another instruction. |
| Instruction could not be confirmed | Order not confirmed | One plain-language next step, without raw provider errors. |
| Initial instruction claim only | Instruction received | Execution has not been confirmed. Not posted automatically. |

Requested stake and actual cost are different facts. Lower cost alone does not prove a partial fill: a better price can also cost less. Historical receipts without actual cost do not turn a requested budget into a Spent amount. A fill does not prove a winning prediction or payout. Settlement cards remain future work.

## Text alongside the card

This is a template, not a real receipt:

```text
Order filled
Somnia testnet / BTC / UP / 5m Window / ends {UTC end time}
Spent {actual cost} tUSDC.
The market result comes later.
{transaction explorer URL}
```

The formatter keeps complete links and fits ordinary X posts without a Premium long-form switch. It uses fixed ASCII copy and known URLs; optional context is shortened first. Unknown states say Status needs checking, including when a transaction hash exists but local bookkeeping failed.

All essential facts remain in the text. The existing Rettiwt media method has no alt-text parameter, so this implementation does not claim to attach alt metadata. A supported transport with alt text remains an improvement to make.

## Personality

The card eyebrow is **Your call has a receipt.** The paper receipt supplies the character. Memes and more playful copy belong in the optional [manual promotion plan](promotion-plan-2026-09-05.md), where they can be reviewed in context.

Avoid You won, profit secured, easy money or called it for an order that has merely filled. Show failures calmly, with an icon and heading that match the known result.

## Delivery behavior

Image failure falls back to the same truthful text before one posting attempt. An uncertain posting result is held for inspection; it does not trigger another trade or reply. Historical mentions are not replayed. Images have a separate off switch, and the existing posting switch still controls publication.

See the [operator guide](../../services/ops/src/actors/x-relay/README.md) for configuration, delivery state and the existing account-session transport's platform-policy limitation. See [release evidence](receipt-release-2026-09-05.md) for validation and deployment. Durable transaction recovery, automatic settlement follow-ups and scheduled marketing are not part of this release.
