import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { SENSEI_ERRORS, SENSEI_SYSTEM, senseiSystemPrompt } from "@/features/sensei/prompt";
import { type SenseiRequest, senseiRequestSchema } from "@/features/sensei/protocol";

/**
 * Sensei's brain — ported from `reference/yosuku/app/api/sensei/route.ts`.
 *
 * Server-side only: the key never reaches the browser, which is the whole reason
 * this is a route and not a client call. The reference calls DeepSeek; Masayume
 * runs on Claude.
 *
 * The reference's honest-degradation path is kept exactly: with no key configured
 * the route says so rather than pretending, and the dock renders in full either
 * way. That is what lets the whole surface ship before the credential exists.
 *
 * No trade is placed here. Sensei reads and recommends; the user places the trade.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-opus-5";
/** Two to four sentences, with adaptive thinking's own tokens on top of them. */
const MAX_TOKENS = 4096;
const REQUEST_TIMEOUT_MS = 55_000;

function bad(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return bad(SENSEI_ERRORS.notConfigured, 503);

  let body: SenseiRequest;
  try {
    const parsed = senseiRequestSchema.safeParse(await req.json());
    if (!parsed.success) return bad(SENSEI_ERRORS.badRequest, 400);
    body = parsed.data;
  } catch {
    return bad(SENSEI_ERRORS.badRequest, 400);
  }
  if (body.messages.length === 0) return bad(SENSEI_ERRORS.saySomething, 400);

  const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS });

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // A market read is a short, latency-sensitive answer, not a research task.
      output_config: { effort: "low" },
      // Opus 5 thinks by default; naming it keeps the intent visible.
      thinking: { type: "adaptive" },
      // A policy decline would otherwise just stop the turn with nothing to show.
      betas: ["server-side-fallback-2026-06-01"],
      fallbacks: [{ model: "claude-opus-4-8" }],
      system: [{ type: "text", text: SENSEI_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        // Volatile per-turn context sits after the cached prefix, never inside it.
        { role: "user", content: senseiSystemPrompt(body) },
        ...body.messages.map((message) => ({ role: message.role, content: message.content })),
      ],
    });

    if (response.stop_reason === "refusal") return bad(SENSEI_ERRORS.declined, 200);

    const reply = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    return reply ? NextResponse.json({ reply }) : bad(SENSEI_ERRORS.wentQuiet, 502);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return bad(SENSEI_ERRORS.badKey, 503);
    if (error instanceof Anthropic.RateLimitError) return bad(SENSEI_ERRORS.rateLimited, 429);
    if (error instanceof Anthropic.APIError) return bad(SENSEI_ERRORS.upstream(error.status ?? 0), 502);
    return bad(SENSEI_ERRORS.unreachable, 502);
  }
}
