import { Router } from "express";
import type { AiProvider } from "../services/ai/types.js";

export function healthRouter(ai: AiProvider) {
  const r = Router();
  r.get("/", (_req, res) => {
    res.json({ status: "ok", service: "dolil-server", provider: ai.name, model: ai.model, aiConfigured: ai.configured() });
  });
  r.get("/ai", async (req, res) => {
    res.json(await ai.status(req.query.probe === "1"));
  });
  return r;
}
