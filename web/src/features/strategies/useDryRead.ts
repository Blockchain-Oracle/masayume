"use client";

import { useCallback, useState } from "react";
import { STRATEGIES } from "./copy";
import { agentPreviewResponseSchema, type AgentPreviewRequest, type AgentPreviewResponse } from "./protocol";

export type DryRead = { status: "idle" } | { status: "reading" } | { status: "ok"; result: AgentPreviewResponse } | { status: "error"; error: string };

const DRY = STRATEGIES.studio.agent.dry;

/** One click, one real model call through `/api/strategies/preview`; the route's own words come back on refusal. */
export function useDryRead(): { state: DryRead; read: (request: AgentPreviewRequest) => Promise<void>; reset: () => void } {
  const [state, setState] = useState<DryRead>({ status: "idle" });
  const read = useCallback(async (request: AgentPreviewRequest) => {
    setState({ status: "reading" });
    try {
      const response = await fetch("/api/strategies/preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const error = body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string" ? (body as { error: string }).error : DRY.unreadable;
        return setState({ status: "error", error });
      }
      const parsed = agentPreviewResponseSchema.safeParse(body);
      setState(parsed.success ? { status: "ok", result: parsed.data } : { status: "error", error: DRY.unreadable });
    } catch {
      setState({ status: "error", error: DRY.unreadable });
    }
  }, []);
  const reset = useCallback(() => setState({ status: "idle" }), []);
  return { state, read, reset };
}
