import { Router, type NextFunction, type Request, type Response } from "express";
import { parseText, parseUpload } from "../controllers/documents.js";
import { upload } from "../middleware/upload.js";

const wrap = (fn: (req: Request, res: Response) => unknown) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res)).catch(next);
};

export const documentsRouter = Router();
documentsRouter.post("/parse", upload.single("file"), wrap(parseUpload));
documentsRouter.post("/parse-text", wrap(parseText));
