import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8787),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  // Hosted Gemma via Google AI Studio (Gemini API). The key is optional so the server can start without it.
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_MODEL: z.string().default("gemma-4-31b-it"),
  GOOGLE_API_BASE: z.string().default("https://generativelanguage.googleapis.com/v1beta"),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(8),
  MAX_TEXT_CHARS: z.coerce.number().int().positive().default(20000),
  MAX_PDF_PAGES: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_AI_MAX: z.coerce.number().int().positive().default(40),
  /** Number of reverse proxies in front of the server (Render = 1). Needed for correct per-IP rate limits. */
  TRUST_PROXY: z.coerce.number().int().min(0).optional(),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:", z.prettifyError(parsed.error));
  process.exit(1);
}
export const env = parsed.data;
