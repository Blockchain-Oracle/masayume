import Link from "next/link";
import { CLAIM } from "@/lib/copy";
import { cn } from "@/lib/utils";

interface ClaimPillProps {
  amountText: string;
  href: string;
  placement?: "fixed" | "inline";
  className?: string;
}

/** The global claim badge: announces once when it first surfaces, then stays polite until claimed. */
export function ClaimPill({ amountText, href, placement = "fixed", className }: ClaimPillProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        placement === "fixed" && "fixed right-gutter bottom-(--claim-pill-offset) z-40 lg:right-gutter-desktop lg:bottom-gutter-desktop",
        className,
      )}
    >
      <Link
        href={href}
        className="inline-flex min-h-touch items-center gap-2 rounded-full border border-gold-dim bg-gold-wash px-4 type-data text-ink"
      >
        <span className="size-2 rounded-full bg-gold" aria-hidden="true" />
        <span>{amountText}</span>
        <span className="type-label-micro text-ink-secondary">{CLAIM.claimable}</span>
      </Link>
    </div>
  );
}
