import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors.js";
import type { AiProvider } from "../services/ai/types.js";
import { detectKind, imageMime } from "../services/documents/detect.js";
import { parseBuffer, parsePastedText } from "../services/documents/parse.js";
import { explainDocument, extractFields } from "../services/extraction/extract.js";
import { ExtractDocTypeSchema } from "../services/extraction/schemas.js";

const ExtractTextBody = z.object({ text: z.string().min(1, "Paste some text.").max(100_000), docType: ExtractDocTypeSchema });
const ExplainBody = z.object({ text: z.string().min(1, "Paste some text.").max(100_000), docType: z.string().max(30).default("document"), lang: z.enum(["en", "bn"]).default("en") });

export const extractHandler = (ai: AiProvider) => async (req: Request, res: Response) => {
  if (req.file) {
    const dt = ExtractDocTypeSchema.safeParse(req.body?.docType);
    if (!dt.success) throw new AppError(400, "bad_doc_type", "docType must be one of: deed, khatian, mutation.");
    const buf = req.file.buffer;
    if (detectKind(buf) === "image") {
      res.json(await extractFields(ai, dt.data, { image: { mimeType: imageMime(buf)!, data: buf } }));
      return;
    }
    const parsed = await parseBuffer(buf, dt.data);
    if (parsed.needsVision) {
      throw new AppError(422, "scanned_pdf_unsupported", "This PDF has no readable text (it looks scanned). Upload a photo/scan of the page as an image instead.");
    }
    res.json(await extractFields(ai, dt.data, { text: parsed.text }));
    return;
  }
  const body = ExtractTextBody.safeParse(req.body);
  if (!body.success) throw new AppError(400, "bad_request", body.error.issues[0]?.message ?? "Invalid request.");
  const parsed = parsePastedText(body.data.text, body.data.docType);
  res.json(await extractFields(ai, body.data.docType, { text: parsed.text }));
};

export const explainHandler = (ai: AiProvider) => async (req: Request, res: Response) => {
  const body = ExplainBody.safeParse(req.body);
  if (!body.success) throw new AppError(400, "bad_request", body.error.issues[0]?.message ?? "Invalid request.");
  const parsed = parsePastedText(body.data.text);
  res.json(await explainDocument(ai, body.data.docType, parsed.text, body.data.lang));
};
