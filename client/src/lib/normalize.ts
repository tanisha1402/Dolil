const BN = "০১২৩৪৫৬৭৮৯";

export function normalizeDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String(BN.indexOf(d)));
}

export function normId(s: string): string {
  return normalizeDigits(s).toLowerCase().replace(/\s+/g, "");
}

export function parseNum(s: string | undefined): number | null {
  if (!s || !s.trim()) return null;
  const n = Number(normalizeDigits(s).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

/** Accepts "1/4", "0.25", "25%". Returns a fraction, or null if unreadable. */
export function parseShare(s: string | undefined): number | null {
  if (!s || !s.trim()) return null;
  const t = normalizeDigits(s).replace(/\s+/g, "");
  if (t.endsWith("%")) {
    const n = Number(t.slice(0, -1));
    return Number.isFinite(n) ? n / 100 : null;
  }
  if (t.includes("/")) {
    const [a, b] = t.split("/");
    const na = Number(a), nb = Number(b);
    return Number.isFinite(na) && Number.isFinite(nb) && nb !== 0 ? na / nb : null;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export type AreaUnit = "decimal" | "acre" | "sqft";
export const UNIT_LABEL: Record<AreaUnit, { en: string; bn: string }> = {
  decimal: { en: "decimal", bn: "শতাংশ" },
  acre: { en: "acre", bn: "একর" },
  sqft: { en: "sq ft", bn: "বর্গফুট" },
};
/** 1 acre = 100 decimal = 43,560 sq ft. Katha/bigha are intentionally unsupported: they vary by region. */
export function toDecimal(value: number, unit: AreaUnit): number {
  if (unit === "acre") return value * 100;
  if (unit === "sqft") return value / 435.6;
  return value;
}

const HONORIFICS = new Set(["md", "mohammad", "muhammad", "mohammed", "mohd", "mr", "mrs", "late", "মো", "মোহাম্মদ", "মুহাম্মদ", "মোহাম্মাদ"]);
export const hasBengali = (s: string) => /[\u0980-\u09FF]/.test(s);

export function nameTokens(s: string): string[] {
  return normalizeDigits(s)
    .toLowerCase()
    .replace(/[.,:;ঃ।()'"-]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !HONORIFICS.has(t));
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

export type NameMatch = "same" | "similar" | "different" | "script";
export function compareNames(a: string, b: string): NameMatch {
  if (hasBengali(a) !== hasBengali(b)) return "script";
  const ta = nameTokens(a).sort().join(" ");
  const tb = nameTokens(b).sort().join(" ");
  if (ta === tb) return "same";
  const ratio = 1 - levenshtein(ta, tb) / Math.max(ta.length, tb.length, 1);
  return ratio >= 0.8 ? "similar" : "different";
}
