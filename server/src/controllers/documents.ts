import type { Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { DocTypeFieldSchema, TextBodySchema } from "../schemas/documents.js";
import { parseBuffer, parsePastedText } from "../services/documents/parse.js";

export async function parseUpload(req: Request, res: Response) {
  if (!req.file) throw new AppError(400, "no_file", "No file received. Upload one file in the form field named \"file\".");
  const dt = DocTypeFieldSchema.safeParse(req.body?.docType || undefined);
  if (!dt.success) throw new AppError(400, "bad_doc_type", "docType must be one of: deed, khatian, mutation, other.");
  // The buffer lives only for this request; nothing is written to disk or logged.
  res.json(await parseBuffer(req.file.buffer, dt.data));
}

export function parseText(req: Request, res: Response) {
  const body = TextBodySchema.safeParse(req.body);
  if (!body.success) {
    throw new AppError(400, "bad_request", body.error.issues[0]?.message ?? "Invalid request.");
  }
  res.json(parsePastedText(body.data.text, body.data.docType));
}
