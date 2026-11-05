import { z } from "zod";

const F = z.object({ value: z.string().nullable(), evidence: z.string().nullable() });
const AreaF = z.object({
  value: z.string().nullable(),
  unit: z.enum(["decimal", "acre", "sqft", "other"]).nullable(),
  evidence: z.string().nullable(),
});

export const EXTRACT_SCHEMAS = {
  deed: z.object({ sellerName: F, buyerName: F, plotNumber: F, khatianNumber: F, areaSold: AreaF, deedDate: F }),
  khatian: z.object({ ownerName: F, khatianNumber: F, plotNumber: F, plotArea: AreaF, ownerShare: F }),
  mutation: z.object({ ownerName: F, khatianNumber: F, plotNumber: F }),
} as const;

export type ExtractDocType = keyof typeof EXTRACT_SCHEMAS;
export const ExtractDocTypeSchema = z.enum(["deed", "khatian", "mutation"]);

export type FieldKind = "text" | "id" | "area" | "share" | "date";

/** Field keys match the client (client/src/lib/docs.ts). */
export const FIELD_META: Record<ExtractDocType, Record<string, { kind: FieldKind; hint: string }>> = {
  deed: {
    sellerName: { kind: "text", hint: "Name of the seller (বিক্রেতা), exactly as written." },
    buyerName: { kind: "text", hint: "Name of the buyer (ক্রেতা), exactly as written." },
    plotNumber: { kind: "id", hint: "Plot / dag number (দাগ নম্বর)." },
    khatianNumber: { kind: "id", hint: "Khatian number (খতিয়ান নম্বর)." },
    areaSold: { kind: "area", hint: "Land area being sold; value as a number, unit one of decimal (শতাংশ/শতক), acre (একর), sqft (বর্গফুট), or other (katha, bigha, etc.)." },
    deedDate: { kind: "date", hint: "Date of the deed as YYYY-MM-DD if it is unambiguous, otherwise null." },
  },
  khatian: {
    ownerName: { kind: "text", hint: "Recorded owner's name, exactly as written." },
    khatianNumber: { kind: "id", hint: "Khatian number." },
    plotNumber: { kind: "id", hint: "Plot / dag number." },
    plotArea: { kind: "area", hint: "TOTAL area of the plot; value as a number, unit one of decimal, acre, sqft, other." },
    ownerShare: { kind: "share", hint: "The owner's share exactly as written (e.g. 1/4, 25%, or text like '৪ আনা'). Do not convert." },
  },
  mutation: {
    ownerName: { kind: "text", hint: "Owner named in the mutation (namjari) record, exactly as written." },
    khatianNumber: { kind: "id", hint: "Khatian number." },
    plotNumber: { kind: "id", hint: "Plot / dag number." },
  },
};

export const ExplainSchema = z.object({
  summary: z.string().min(1),
  keyTerms: z.array(z.object({ term: z.string(), meaning: z.string() })).max(8),
  notes: z.array(z.string()).max(5),
});
export type Explanation = z.infer<typeof ExplainSchema>;
