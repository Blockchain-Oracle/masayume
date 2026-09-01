"use client";

import type { BalanceSheet } from "@masayume/core/types";
import { SOMNIA_SHANNON } from "@masayume/markets/chain";
import { useBalanceSheet, useSigner } from "@masayume/markets/react";
import { SectionHeader } from "@/components/chrome";
import { Hash, Money } from "@/components/data";
import { ReadingBoundary } from "@/components/states";
import { FaucetCard } from "@/features/markets/faucet";
import { ConnectButton } from "@/features/markets/wallet";
import { WALLET_DEV } from "@/lib/copy";
import { useWalletSession } from "@/lib/wallet-session";

const NATIVE = SOMNIA_SHANNON.nativeCurrency;

function BalanceRows({ sheet }: { sheet: BalanceSheet }) {
  const rows = [
    { label: WALLET_DEV.spendable, node: <Money value={sheet.spendableBase} decimals={sheet.decimals} /> },
    { label: WALLET_DEV.native, node: <Money value={sheet.nativeWei} decimals={NATIVE.decimals} maxDp={4} symbol={NATIVE.symbol} /> },
    { label: WALLET_DEV.escrow, node: <Money value={sheet.orderEscrowBase} decimals={sheet.decimals} /> },
    { label: WALLET_DEV.credit, node: <Money value={sheet.venueCreditBase} decimals={sheet.decimals} /> },
  ];
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 rounded-lg border border-hairline bg-surface-1 p-4">
      {rows.map(({ label, node }) => (
        <div key={label} className="contents">
          <dt className="type-caption text-ink-secondary">{label}</dt>
          <dd className="type-data text-ink">{node}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function DevWalletPage() {
  const session = useWalletSession();
  const { hasSigner } = useSigner();
  const sheet = useBalanceSheet(session.address);

  return (
    <div className="mx-auto flex w-full max-w-(--content-reading) flex-col gap-8 px-gutter py-8">
      <section className="flex flex-col gap-4">
        <SectionHeader index="01" title={WALLET_DEV.connection} aside={<ConnectButton />} />
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 type-caption text-ink-secondary">
          <dt>{WALLET_DEV.address}</dt>
          <dd className="text-ink">{session.address ? <Hash value={session.address} lead={10} tail={6} /> : "—"}</dd>
          <dt>{WALLET_DEV.chain}</dt>
          <dd className="text-ink">
            <span className="numbers">{session.chainId ?? "—"}</span>
            {session.isConnected && ` · ${session.isRightChain ? WALLET_DEV.rightChain : WALLET_DEV.wrongChain}`}
          </dd>
          <dt>{WALLET_DEV.signer}</dt>
          <dd className="text-ink">{hasSigner ? WALLET_DEV.signerBound : WALLET_DEV.noSigner}</dd>
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader index="02" title={WALLET_DEV.balances} />
        {session.address ? (
          <ReadingBoundary reading={sheet} shape="plate">
            {(value) => <BalanceRows sheet={value} />}
          </ReadingBoundary>
        ) : (
          <p className="type-caption text-ink-secondary">{WALLET_DEV.connectFirst}</p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader index="03" title={WALLET_DEV.faucet} />
        <FaucetCard />
      </section>
    </div>
  );
}
