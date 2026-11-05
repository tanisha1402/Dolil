import { Router, type NextFunction, type Request, type Response } from "express";
import { explainHandler, extractHandler } from "../controllers/ai.js";
import { upload } from "../middleware/upload.js";
import type { AiProvider } from "../services/ai/types.js";

const wrap = (fn: (req: Request, res: Response) => unknown) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res)).catch(next);
};

export function aiRouter(ai: AiProvider) {
  const r = Router();
  r.post("/extract", upload.single("file"), wrap(extractHandler(ai)));
  r.post("/explain", wrap(explainHandler(ai)));
  return r;
}
