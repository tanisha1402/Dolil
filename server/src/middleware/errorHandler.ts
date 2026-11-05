import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { AppError } from "../lib/errors.js";
import { env } from "../lib/env.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.code, message: err.message });
    return;
  }
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "file_too_large", message: `The file is larger than ${env.MAX_UPLOAD_MB} MB.` });
    } else {
      res.status(400).json({ error: "bad_upload", message: "Upload one file in the form field named \"file\"." });
    }
    return;
  }
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "bad_json", message: "The request body is not valid JSON." });
    return;
  }
  // Never log request bodies or document text; log only the error itself.
  console.error("Unhandled error:", err instanceof Error ? err.message : err);
  res.status(500).json({ error: "internal_error", message: "Something went wrong on the server." });
};
