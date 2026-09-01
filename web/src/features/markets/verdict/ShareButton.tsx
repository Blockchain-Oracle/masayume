"use client";

import type { MarketId } from "@masayume/core/types";
import { marketDeepLink } from "@masayume/core/urls";
import { Share2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOASTS, VERDICT_UI } from "@/lib/copy";
import { webEnv } from "@/lib/env";
import { notify } from "@/lib/toast";

/** Copies the window's deep link; the rendered share card with proof attached lands in Epic 2. */
export function ShareButton({ marketId }: { marketId: MarketId }) {
  const share = async () => {
    try {
      await navigator.clipboard.writeText(marketDeepLink({ origin: webEnv.appOrigin, marketId }));
      notify.neutral(TOASTS.copied);
    } catch {
      notify.warning(VERDICT_UI.shareFailed);
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={share}>
      <Share2Icon data-icon="inline-start" />
      {VERDICT_UI.share}
    </Button>
  );
}
