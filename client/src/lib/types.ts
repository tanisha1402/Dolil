export type Lang = "en" | "bn";
export interface Bi { en: string; bn: string }

export type DocType = "deed" | "khatian" | "mutation";
export type FieldKind = "text" | "area" | "fraction" | "date";
export interface FieldDef { key: string; kind: FieldKind; label: Bi; hint?: Bi }
export interface DocDef { type: DocType; title: Bi; blurb: Bi; fields: FieldDef[] }
export type DocValues = Record<string, string>;

export type Transaction = "buy" | "inherit";
export interface AiMark { evidence: string | null; verified: boolean | null }
export interface ExtractedField { value: string; unit?: "decimal" | "acre" | "sqft"; evidence: string | null; verified: boolean | null }
export interface ExtractResult {
  docType: DocType;
  source: "text" | "image";
  fields: Record<string, ExtractedField>;
  warnings: { code: string; message: string }[];
}
export interface Explanation { summary: string; keyTerms: { term: string; meaning: string }[]; notes: string[] }

export interface CaseState {
  transaction: Transaction;
  abroad: boolean;
  have: Record<string, boolean>;
  docs: Record<DocType, DocValues>;
  isSample: boolean;
  /** Marks on fields filled by AI; removed when the user edits the field. */
  ai?: Partial<Record<DocType, Record<string, AiMark>>>;
}

export type Severity = "high" | "medium" | "low" | "info";
export interface Evidence { doc: DocType; fieldKey: string; value: string }
export interface Finding {
  id: string;
  ruleId: string;
  severity: Severity;
  title: Bi;
  explanation: Bi;
  question: Bi;
  evidence: Evidence[];
}
export interface CheckResult { findings: Finding[]; compared: number; skipped: number }
