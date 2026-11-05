import type { ZodType } from "zod";

export interface AiStatus {
  provider: "google";
  model: string;
  configured: boolean;
  /** null = not probed (a probe makes one tiny real request and uses quota) */
  reachable: boolean | null;
  detail: string;
}

export interface JsonRequest<T> {
  system: string;
  prompt: string;
  schema: ZodType<T>;
  image?: { mimeType: string; data: Buffer };
}

export interface AiProvider {
  readonly name: "google";
  readonly model: string;
  configured(): boolean;
  /** Returns schema-validated JSON or throws AppError. Never returns invented output on failure. */
  generateJson<T>(req: JsonRequest<T>): Promise<T>;
  status(probe: boolean): Promise<AiStatus>;
}
