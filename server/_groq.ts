// ─────────────────────────────────────────────────────────────────────────────
// server/_groq.ts
// Centralised GROQ helper. Re-uses the GROQ_API_KEY pattern already present in
// server/routers.ts (process.env.GROQ_API_KEY OR app setting "groq_api_key").
// ─────────────────────────────────────────────────────────────────────────────

import { TRPCError } from "@trpc/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

export interface GroqInvokeOpts {
  messages: GroqMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

async function resolveApiKey(): Promise<string | null> {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  try {
    const { getAppSetting } = await import("./db");
    return (await getAppSetting("groq_api_key")) || null;
  } catch {
    return null;
  }
}

/**
 * Calls GROQ chat completions and returns the raw assistant text.
 * Throws a TRPCError if AI is disabled or the key is missing.
 */
export async function groqChat(opts: GroqInvokeOpts): Promise<string> {
  const { getAppSetting } = await import("./db");
  const aiEnabled = (await getAppSetting("ai_features_enabled")) !== "false";
  if (!aiEnabled) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "AI features are currently disabled." });
  }

  const apiKey = await resolveApiKey();
  if (!apiKey) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "GROQ_API_KEY not configured." });
  }

  const body: Record<string, unknown> = {
    model: opts.model || DEFAULT_MODEL,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 2048,
  };
  if (opts.jsonMode) body.response_format = { type: "json_object" };

  const resp = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error("[GROQ] Error:", err);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI service error. Please try again." });
  }

  const data = (await resp.json()) as any;
  const text: string = data.choices?.[0]?.message?.content || "";
  if (!text) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Empty AI response." });
  return text;
}

/**
 * Strips ```json fences and parses JSON. Throws on parse failure.
 */
export function parseJsonLoose<T = any>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
  return JSON.parse(cleaned) as T;
}
