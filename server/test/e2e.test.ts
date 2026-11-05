import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { fileURLToPath } from "node:url";

// Journey test over real HTTP: built client served by the server + extraction + deterministic checks.
// Google is STUBBED (no key, no network). Requires `npm run build` first so client/dist exists.
process.env.NODE_ENV = "production";

import { runChecks } from "../../client/src/lib/checks.ts";
import { emptyCase } from "../../client/src/lib/docs.ts";
import type { CaseState, DocType, ExtractResult } from "../../client/src/lib/types.ts";

const dist = fileURLToPath(new URL("../../client/dist", import.meta.url));
const samples = (n: string) => readFileSync(fileURLToPath(new URL(`../../samples/${n}_sample.txt`, import.meta.url)), "utf-8");
const nul = { value: null, evidence: null };

// What a good model would return for each synthetic sample (quotes copied verbatim from samples/*.txt).
const MODEL: Record<string, unknown> = {
  deed: {
    sellerName: { value: "মোঃ আব্দুল করিম", evidence: "বিক্রেতা: মোঃ আব্দুল করিম" },
    buyerName: { value: "রফিক আহমেদ", evidence: "ক্রেতা: রফিক আহমেদ" },
    plotNumber: { value: "১২৪৫", evidence: "দাগ নম্বর: ১২৪৫" },
    khatianNumber: { value: "৩৮৯", evidence: "খতিয়ান নম্বর: ৩৮৯" },
    areaSold: { value: "১০", unit: "decimal", evidence: "বিক্রিত জমির পরিমাণ: ১০ শতাংশ" },
    deedDate: { value: "2026-08-14", evidence: "দলিলের তারিখ: ১৪/০৮/২০২৬" },
  },
  khatian: {
    ownerName: { value: "Abdul Karim", evidence: "Recorded owner: Abdul Karim" },
    khatianNumber: { value: "389", evidence: "Khatian No: 389" },
    plotNumber: { value: "1245", evidence: "Plot (Dag) No: 1245" },
    plotArea: { value: "24", unit: "decimal", evidence: "Total area of plot: 24 decimal" },
    ownerShare: { value: "1/4", evidence: "Owner's share: 1/4" },
  },
  mutation: {
    ownerName: { value: "আব্দুল করিম", evidence: "মালিকের নাম: আব্দুল করিম" },
    khatianNumber: { value: "৩৮৯", evidence: "খতিয়ান নম্বর: ৩৮৯" },
    plotNumber: { value: "১২৫৪", evidence: "দাগ নম্বর: ১২৫৪" },
  },
};

let delayMs = 0;
const stubFetch: typeof fetch = async (_url, init) => {
  const body = JSON.parse(String(init?.body));
  const prompt: string = body.contents[0].parts.at(-1).text;
  // Like real fetch, honor the abort signal so the provider's timeout is exercised.
  if (delayMs) {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, delayMs);
      init?.signal?.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("timed out", "TimeoutError")); });
    });
  }
  const m = prompt.match(/Document type: (\w+)/);
  const out = m ? MODEL[m[1]] : { ok: true };
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(out) }] } }] }), { status: 200 });
};

let server: Server, base: string;
before(async () => {
  assert.ok(existsSync(`${dist}/index.html`), "client/dist is missing: run `npm run build` before this test");
  const { createApp } = await import("../src/app.js");
  const { createGoogleProvider } = await import("../src/services/ai/googleProvider.js");
  const ai = createGoogleProvider({ apiKey: "k", model: "m", baseUrl: "http://stub.test/v1beta", timeoutMs: 300, fetchImpl: stubFetch });
  server = createApp({ ai, rateLimitMax: 1000, aiRateLimitMax: 1000 }).listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => server.close());

const post = (path: string, body: unknown) => fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

test("serves the built client, SPA fallback, and JSON 404 for unknown API routes", async () => {
  const home = await fetch(base);
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.match(html, /<div id="root">/);
  assert.equal(home.headers.get("cache-control"), "no-cache");
  const deep = await fetch(`${base}/some/client/route`);
  assert.equal(deep.status, 200);
  assert.match(await deep.text(), /<div id="root">/);
  const asset = html.match(/\/assets\/[^"]+\.js/)![0];
  const a = await fetch(`${base}${asset}`);
  assert.equal(a.status, 200);
  assert.match(a.headers.get("cache-control") ?? "", /immutable/);
  const api = await fetch(`${base}/api/nope`);
  assert.equal(api.status, 404);
  assert.equal(((await api.json()) as { error: string }).error, "not_found");
});

test("security headers are present and the CSP allows only what the app uses", async () => {
  const r = await fetch(base);
  const csp = r.headers.get("content-security-policy") ?? "";
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self'/);
  assert.equal(r.headers.get("x-powered-by"), null);
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  // Google Fonts: stylesheet from fonts.googleapis.com (style-src https:), files from fonts.gstatic.com (font-src https:)
  assert.match(csp, /style-src [^;]*https:/);
  assert.match(csp, /font-src [^;]*https:/);
});

test("full journey over HTTP: AI extraction of 3 synthetic documents -> checks find the planted issues", async () => {
  const c: CaseState = emptyCase();
  for (const d of ["deed", "khatian", "mutation"] as DocType[]) {
    const r = await post("/api/extract", { docType: d, text: samples(d) });
    assert.equal(r.status, 200, d);
    const j = (await r.json()) as ExtractResult;
    assert.ok(Object.values(j.fields).every((f) => f.verified === true), `${d}: every value should be found in the text`);
    for (const [k, f] of Object.entries(j.fields)) {
      c.docs[d][k] = f.value;
      if (f.unit) c.docs[d][`${k}__unit`] = f.unit;
    }
  }
  const res = runChecks(c, new Date("2026-11-05"));
  const ids = res.findings.map((f) => f.ruleId).sort();
  assert.deepEqual(ids, ["area-exceeds-share", "name-script", "plot-mismatch"]);
  assert.equal(res.findings.find((f) => f.ruleId === "area-exceeds-share")!.severity, "high");
  assert.match(res.findings.find((f) => f.ruleId === "area-exceeds-share")!.explanation.en, /about 6 decimal/);
});

test("10 parallel extractions all succeed", async () => {
  const rs = await Promise.all(Array.from({ length: 10 }, () => post("/api/extract", { docType: "mutation", text: samples("mutation") })));
  assert.deepEqual(rs.map((r) => r.status), Array(10).fill(200));
});

test("a slow AI service becomes a clear 503, not a hang", async () => {
  delayMs = 800;
  const r = await post("/api/extract", { docType: "mutation", text: samples("mutation") });
  delayMs = 0;
  assert.equal(r.status, 503);
  assert.equal(((await r.json()) as { error: string }).error, "ai_unavailable");
});

test("the AI probe endpoint is rate limited so it cannot drain the quota", async () => {
  const { createApp } = await import("../src/app.js");
  const { createGoogleProvider } = await import("../src/services/ai/googleProvider.js");
  let upstream = 0;
  const counting: typeof fetch = async (u, i) => { upstream++; return stubFetch(u, i); };
  const s = createApp({ ai: createGoogleProvider({ apiKey: "k", model: "m", baseUrl: "http://stub.test/v1beta", timeoutMs: 1000, fetchImpl: counting }) }).listen(0);
  const u = `http://127.0.0.1:${(s.address() as AddressInfo).port}/api/health/ai?probe=1`;
  const codes: number[] = [];
  for (let i = 0; i < 12; i++) codes.push((await fetch(u)).status);
  s.close();
  assert.equal(codes.filter((c) => c === 200).length, 10);
  assert.equal(codes.filter((c) => c === 429).length, 2);
  assert.equal(upstream, 10);
});
