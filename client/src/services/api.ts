import type { DocType, ExtractResult, Explanation, Lang } from "../lib/types";

export class ApiError extends Error {
  constructor(public code: string, message: string, public status = 0) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiError("network", "Cannot reach the Dolil server. Is it running?");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
  if (!res.ok) throw new ApiError(data.error ?? "error", data.message ?? `Server returned HTTP ${res.status}.`, res.status);
  return data as T;
}

const json = (body: unknown): RequestInit => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export const extractFromText = (docType: DocType, text: string) => request<ExtractResult>("/api/extract", json({ docType, text }));

export function extractFromFile(docType: DocType, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("docType", docType);
  return request<ExtractResult>("/api/extract", { method: "POST", body: fd });
}

export function parseFile(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return request<{ kind: string; text: string; needsVision: boolean }>("/api/documents/parse", { method: "POST", body: fd });
}

export const explainText = (docType: DocType, text: string, lang: Lang) => request<Explanation>("/api/explain", json({ docType, text, lang }));
