import { z } from "zod";
import { AppError } from "../../lib/errors.js";
import type { AiProvider, AiStatus, JsonRequest } from "./types.js";

export interface GoogleConfig {
  apiKey?: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

interface GenResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

/** Pulls a JSON object out of model text, tolerating ```json fences and stray prose. */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object");
  return JSON.parse(body.slice(start, end + 1));
}

export function createGoogleProvider(cfg: GoogleConfig): AiProvider {
  const doFetch = cfg.fetchImpl ?? fetch;
  const url = `${cfg.baseUrl}/models/${cfg.model}:generateContent`;

  async function call(req: JsonRequest<unknown>, userSuffix: string, jsonMode: boolean): Promise<string> {
    if (!cfg.apiKey) throw new AppError(503, "ai_not_configured", "The AI service is not configured on the server (missing API key).");
    const parts: unknown[] = [];
    if (req.image) parts.push({ inlineData: { mimeType: req.image.mimeType, data: req.image.data.toString("base64") } });
    parts.push({ text: req.prompt + userSuffix });
    const body = {
      systemInstruction: { parts: [{ text: req.system }] },
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0, ...(jsonMode ? { responseMimeType: "application/json" } : {}) },
    };
    let res: Response;
    try {
      res = await doFetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": cfg.apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(cfg.timeoutMs),
      });
    } catch {
      throw new AppError(503, "ai_unavailable", "The AI service could not be reached or took too long. Please try again.");
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      if (res.status === 400 && jsonMode && /responseMimeType|mime|json mode|response_mime/i.test(detail)) {
        throw new JsonModeUnsupported();
      }
      if (res.status === 401 || res.status === 403) throw new AppError(502, "ai_auth", "The AI service rejected the server's API key.");
      if (res.status === 404) throw new AppError(503, "ai_model_not_found", "The configured AI model was not found. Check GOOGLE_MODEL on the server.");
      if (res.status === 429) throw new AppError(429, "ai_quota", "The AI service is busy or the free quota is used up. Try again later.");
      throw new AppError(503, "ai_unavailable", "The AI service returned an error. Please try again.");
    }
    const data = (await res.json().catch(() => ({}))) as GenResponse;
    if (data.promptFeedback?.blockReason) throw new AppError(502, "ai_blocked", "The AI service declined to process this content.");
    const text = (data.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought && p.text).map((p) => p.text).join("");
    if (!text.trim()) throw new AppError(502, "ai_empty", "The AI service returned an empty answer.");
    return text;
  }

  class JsonModeUnsupported extends Error {}

  async function generateJson<T>(req: JsonRequest<T>): Promise<T> {
    let jsonMode = true;
    let suffix = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      let text: string;
      try {
        text = await call(req, suffix, jsonMode);
      } catch (e) {
        if (e instanceof JsonModeUnsupported) {
          jsonMode = false;
          text = await call(req, suffix, false);
        } else throw e;
      }
      try {
        const parsed = req.schema.safeParse(extractJson(text));
        if (parsed.success) return parsed.data;
      } catch { /* fall through to retry */ }
      suffix = "\n\nYour previous reply was not valid JSON matching the required shape. Reply again with ONLY the JSON object.";
    }
    throw new AppError(502, "ai_bad_output", "The AI returned an answer in an unexpected format. Please try again.");
  }

  return {
    name: "google",
    model: cfg.model,
    configured: () => Boolean(cfg.apiKey),
    generateJson,
    async status(probe) {
      const base = { provider: "google" as const, model: cfg.model, configured: Boolean(cfg.apiKey) };
      if (!base.configured) return { ...base, reachable: null, detail: "GOOGLE_API_KEY is not set on the server." };
      if (!probe) return { ...base, reachable: null, detail: "API key is set. Add ?probe=1 to make one tiny real request and verify it." };
      try {
        await generateJson({ system: "Reply with JSON only.", prompt: 'Return {"ok": true}', schema: z.object({ ok: z.boolean() }) });
        return { ...base, reachable: true, detail: "The AI service answered correctly." };
      } catch (e) {
        return { ...base, reachable: false, detail: e instanceof AppError ? e.message : "The probe failed." };
      }
    },
  };
}
