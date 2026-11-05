import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { env } from "./lib/env.js";
import { aiRouter } from "./routes/ai.js";
import { documentsRouter } from "./routes/documents.js";
import { healthRouter } from "./routes/health.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { defaultAiProvider } from "./services/ai/index.js";
import type { AiProvider } from "./services/ai/types.js";

// server/src and server/dist are both one level below server/, so this resolves to <repo>/client/dist either way.
const DEFAULT_STATIC_DIR = fileURLToPath(new URL("../../client/dist", import.meta.url));

export function createApp(opts: { rateLimitMax?: number; aiRateLimitMax?: number; ai?: AiProvider; staticDir?: string | null } = {}) {
  const ai = opts.ai ?? defaultAiProvider;
  const app = express();
  app.disable("x-powered-by");
  const proxies = env.TRUST_PROXY ?? (env.NODE_ENV === "production" ? 1 : 0);
  if (proxies > 0) app.set("trust proxy", proxies);
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));

  const limiter = (limit: number) =>
    rateLimit({
      windowMs: 10 * 60 * 1000,
      limit,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "rate_limited", message: "Too many requests. Please wait a few minutes and try again." },
    });

  // The probe spends AI quota and is public, so it gets a small limit of its own.
  app.use("/api/health/ai", limiter(10));
  app.use("/api/health", healthRouter(ai));
  app.use("/api/documents", limiter(opts.rateLimitMax ?? env.RATE_LIMIT_MAX), documentsRouter);
  // AI routes use the free quota, so they get a stricter limit.
  app.use("/api", limiter(opts.aiRateLimitMax ?? env.RATE_LIMIT_AI_MAX), aiRouter(ai));
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "not_found", message: "Unknown API route." });
  });

  // One service in production: serve the built client and fall back to index.html for client-side routes.
  const staticDir = opts.staticDir === undefined ? DEFAULT_STATIC_DIR : opts.staticDir;
  if (staticDir && existsSync(path.join(staticDir, "index.html"))) {
    app.use(
      express.static(staticDir, {
        index: false,
        setHeaders: (res, file) => {
          if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        },
      }),
    );
    app.get(/.*/, (_req, res) => {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }
  app.use(errorHandler);
  return app;
}
