/**
 * Document text is UNTRUSTED input (it may contain prompt-injection attempts). This cleans formatting only;
 * the real defenses are architectural: schema-validated model output and deterministic checks.
 */
const INJECTION_PATTERNS = [
  /ignore (all |any )?(the )?(previous|prior|above) (instructions|prompts?)/i,
  /disregard (all |any )?(the )?(previous|prior|above)/i,
  /(reveal|print|show) (your |the )?(system )?prompt/i,
  /you are now (a|an|in)\b/i,
  /\bnew instructions?:/i,
];

export interface SanitizeResult {
  text: string;
  truncated: boolean;
  suspectedInjection: boolean;
}

export function sanitizeText(input: string, maxChars: number): SanitizeResult {
  let t = input.normalize("NFC");
  // Remove control characters (keep \n, \t) and invisible/bidi controls. Keep ZWNJ/ZWJ (U+200C/U+200D): Bangla needs them.
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  t = t.replace(/[\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g, "");
  t = t.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const truncated = t.length > maxChars;
  if (truncated) t = t.slice(0, maxChars);
  return { text: t, truncated, suspectedInjection: INJECTION_PATTERNS.some((p) => p.test(t)) };
}
