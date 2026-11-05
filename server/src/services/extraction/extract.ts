import type { ZodType } from "zod";
import { AppError } from "../../lib/errors.js";
import { normalizeDigits } from "../../lib/text.js";
import type { AiProvider } from "../ai/types.js";
import { buildExplainPrompt, buildExtractPrompt, EXPLAIN_SYSTEM, EXTRACT_SYSTEM } from "./prompts.js";
import { EXTRACT_SCHEMAS, ExplainSchema, FIELD_META, type ExtractDocType, type Explanation } from "./schemas.js";

export interface ExtractedField {
  value: string;
  unit?: "decimal" | "acre" | "sqft";
  evidence: string | null;
  /** true: the quote and value were found in the document text. false: NOT found (possible hallucination). null: read from an image, cannot be checked. */
  verified: boolean | null;
}
export interface ExtractResult {
  docType: ExtractDocType;
  source: "text" | "image";
  fields: Record<string, ExtractedField>;
  warnings: { code: string; message: string }[];
}

type RawField = { value: string | null; evidence: string | null; unit?: string | null };
const squash = (s: string) => normalizeDigits(s.normalize("NFC")).toLowerCase().replace(/[\s.,:;।ঃ'"“”‘’()\-_/\\]+/g, "");

export async function extractFields(
  ai: AiProvider,
  docType: ExtractDocType,
  input: { text: string } | { image: { mimeType: string; data: Buffer } },
): Promise<ExtractResult> {
  const text = "text" in input ? input.text : null;
  const raw = await ai.generateJson({
    system: EXTRACT_SYSTEM,
    prompt: buildExtractPrompt(docType, text),
    schema: EXTRACT_SCHEMAS[docType] as unknown as ZodType<Record<string, RawField>>,
    image: "image" in input ? input.image : undefined,
  });

  const hay = text === null ? null : squash(text);
  const fields: Record<string, ExtractedField> = {};
  const warnings: ExtractResult["warnings"] = [];
  if (text === null) warnings.push({ code: "image_unverified", message: "Read from an image: none of these values can be checked against text. Verify every field against the original." });

  for (const [key, meta] of Object.entries(FIELD_META[docType])) {
    const f = raw[key];
    const rawValue = f?.value?.trim();
    if (!rawValue) continue;
    let value = rawValue;
    if (meta.kind === "id" || meta.kind === "share" || meta.kind === "date") value = normalizeDigits(value);
    if (meta.kind === "area") value = normalizeDigits(value).replace(/,/g, "");

    let verified: boolean | null = null;
    if (hay !== null) {
      const ev = f.evidence ? squash(f.evidence) : "";
      const evidenceFound = ev.length > 0 && hay.includes(ev);
      // The value should come from the quote. Dates are often reformatted by the model, so only the quote is checked for them.
      const valueInQuote = meta.kind === "date" || squash(value).length === 0 || ev.includes(squash(value));
      verified = evidenceFound && valueInQuote;
    }
    const out: ExtractedField = { value, evidence: f.evidence ?? null, verified };
    if (meta.kind === "area") {
      if (f.unit === "decimal" || f.unit === "acre" || f.unit === "sqft") out.unit = f.unit;
      else warnings.push({ code: "unsupported_unit", message: `The unit for "${key}" is not supported (katha/bigha vary by region). Pick the unit yourself after converting.` });
    }
    fields[key] = out;
  }
  if (Object.values(fields).some((f) => f.verified === false)) {
    warnings.push({ code: "unverified_fields", message: "Some values could not be found in the document text. They are marked and must be checked by you." });
  }
  if (Object.keys(fields).length === 0) warnings.push({ code: "nothing_found", message: "No fields were found in this document." });
  return { docType, source: text === null ? "image" : "text", fields, warnings };
}

export async function explainDocument(ai: AiProvider, docType: string, text: string, lang: "en" | "bn"): Promise<Explanation> {
  if (!text.trim()) throw new AppError(400, "bad_request", "There is no text to explain.");
  return ai.generateJson({ system: EXPLAIN_SYSTEM, prompt: buildExplainPrompt(docType, text, lang), schema: ExplainSchema });
}
