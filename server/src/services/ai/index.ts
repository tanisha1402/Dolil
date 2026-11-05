import { env } from "../../lib/env.js";
import { createGoogleProvider } from "./googleProvider.js";

export const defaultAiProvider = createGoogleProvider({
  apiKey: env.GOOGLE_API_KEY,
  model: env.GOOGLE_MODEL,
  baseUrl: env.GOOGLE_API_BASE,
  timeoutMs: env.AI_TIMEOUT_MS,
});
export type { AiProvider, AiStatus, JsonRequest } from "./types.js";
