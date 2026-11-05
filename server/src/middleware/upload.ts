import multer from "multer";
import { env } from "../lib/env.js";

/** Memory storage only: uploaded bytes are never written to disk. */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1, fields: 5 },
});
