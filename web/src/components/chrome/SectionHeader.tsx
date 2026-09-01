import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  /** "01", "02" … — the numbered-section rhythm. */
  index: string;
  title: string;
  eyebrow?: string;
  aside?: ReactNode;
  className?: string;
}

export function SectionHeader({ index, title, eyebrow, aside, className }: SectionHeaderProps) {
  return (
    <header className={cn("flex items-end justify-between gap-3 border-b border-hairline pb-2", className)}>
      <div className="flex items-baseline gap-2">
        <span className="type-label-micro text-ink-muted">{index}</span>
        <span className="text-ink-muted" aria-hidden="true">
          ·
        </span>
        <h2 className="type-title text-ink">{title}</h2>
        {eyebrow && <span className="type-label-micro text-ink-secondary">{eyebrow}</span>}
      </div>
      {aside}
    </header>
  );
}
