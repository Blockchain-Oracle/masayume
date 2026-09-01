"use client";

import { Switch } from "@/components/ui/switch";
import { MARKETS } from "@/lib/copy";

interface PlainWordsToggleProps {
  on: boolean;
  onChange: (on: boolean) => void;
}

export function PlainWordsToggle({ on, onChange }: PlainWordsToggleProps) {
  return (
    <label className="flex min-h-touch cursor-pointer items-center gap-2 type-caption text-ink-secondary">
      <Switch checked={on} onCheckedChange={(checked) => onChange(checked)} aria-label={MARKETS.plainWords} />
      {MARKETS.plainWords}
    </label>
  );
}
