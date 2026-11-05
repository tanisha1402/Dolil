import { extractText, getDocumentProxy } from "unpdf";
import { env } from "../../lib/env.js";
import { AppError } from "../../lib/errors.js";
import type { DocType, ParsedDocument } from "../../schemas/documents.js";
import { detectKind } from "./detect.js";
import { sanitizeText } from "./sanitize.js";

const MIN_USEFUL_CHARS = 20;
const PDF_TIMEOUT_MS = 20_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<T>((_, rej) => {
    timer = setTimeout(() => rej(new AppError(422, "pdf_timeout", "The PDF took too long to read.")), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

async function readPdf(buf: Buffer): Promise<{ text: string; pages: number }> {
  try {
    const pdf = await withTimeout(getDocumentProxy(new Uint8Array(buf)), PDF_TIMEOUT_MS);
    if (pdf.numPages > env.MAX_PDF_PAGES) {
      throw new AppError(413, "too_many_pages", `The PDF has ${pdf.numPages} pages; the limit is ${env.MAX_PDF_PAGES}.`);
    }
    const { text, totalPages } = await withTimeout(extractText(pdf, { mergePages: true }), PDF_TIMEOUT_MS);
    return { text: Array.isArray(text) ? text.join("\n") : text, pages: totalPages };
  } catch (e) {
    if (e instanceof AppError) throw e;
    const name = e instanceof Error ? e.name : "";
    if (name === "PasswordException") {
      throw new AppError(422, "pdf_encrypted", "This PDF is password-protected. Remove the password and try again.");
    }
    throw new AppError(422, "pdf_unreadable", "This PDF could not be read. It may be damaged.");
  }
}

export async function parseBuffer(buf: Buffer, docType?: DocType): Promise<ParsedDocument> {
  const kind = detectKind(buf);
  if (!kind) {
    throw new AppError(415, "unsupported_type", "Unsupported or empty file. Upload a PDF, a PNG/JPEG/WebP image, or a UTF-8 text file.");
  }
  const warnings: ParsedDocument["warnings"] = [];

  if (kind === "image") {
    warnings.push({ code: "needs_vision", message: "Images cannot be read as text yet. Reading images needs the AI model (later phase)." });
    return { docType, kind, text: "", chars: 0, truncated: false, needsVision: true, warnings };
  }

  let raw: string;
  let pages: number | undefined;
  if (kind === "pdf") {
    const r = await readPdf(buf);
    raw = r.text;
    pages = r.pages;
  } else {
    raw = buf.toString("utf-8");
  }

  const s = sanitizeText(raw, env.MAX_TEXT_CHARS);
  if (s.truncated) warnings.push({ code: "truncated", message: `Text was cut at ${env.MAX_TEXT_CHARS} characters.` });
  if (s.suspectedInjection) {
    warnings.push({ code: "possible_instructions", message: "The document contains text that looks like instructions to an AI. It will be treated as plain document text only." });
  }
  const needsVision = kind === "pdf" && s.text.length < MIN_USEFUL_CHARS;
  if (needsVision) warnings.push({ code: "no_text_layer", message: "No readable text was found. This looks like a scanned PDF; reading it needs the AI model (later phase)." });
  return { docType, kind, text: s.text, chars: s.text.length, truncated: s.truncated, pages, needsVision, warnings };
}

export function parsePastedText(text: string, docType?: DocType): ParsedDocument {
  const s = sanitizeText(text, env.MAX_TEXT_CHARS);
  const warnings: ParsedDocument["warnings"] = [];
  if (s.truncated) warnings.push({ code: "truncated", message: `Text was cut at ${env.MAX_TEXT_CHARS} characters.` });
  if (s.suspectedInjection) {
    warnings.push({ code: "possible_instructions", message: "The text contains phrases that look like instructions to an AI. It will be treated as plain document text only." });
  }
  return { docType, kind: "text", text: s.text, chars: s.text.length, truncated: s.truncated, needsVision: false, warnings };
}
