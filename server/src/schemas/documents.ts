import { z } from "zod";

export const DocTypeSchema = z.enum(["deed", "khatian", "mutation", "other"]);
export type DocType = z.infer<typeof DocTypeSchema>;

export const TextBodySchema = z.object({
  text: z.string().min(1, "Paste some text.").max(100_000, "Text is too long."),
  docType: DocTypeSchema.optional(),
});

export const DocTypeFieldSchema = DocTypeSchema.optional();

export interface ParsedDocument {
  docType?: DocType;
  kind: "pdf" | "image" | "text";
  text: string;
  chars: number;
  truncated: boolean;
  pages?: number;
  /** True when no usable text was found (image, or scanned PDF): a vision-capable model is needed (Phase 5). */
  needsVision: boolean;
  warnings: { code: string; message: string }[];
}
