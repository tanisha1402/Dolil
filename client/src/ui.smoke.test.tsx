import test from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";

// Server-render smoke tests (no browser available in CI sandbox): verify screens render real content in both languages.
function withLang(lang: "en" | "bn") {
  (globalThis as any).localStorage = { getItem: (k: string) => (k === "dolil.lang" ? lang : null), setItem() {}, removeItem() {} };
}

async function render(lang: "en" | "bn", step: number, sample = true) {
  withLang(lang);
  const { LangProvider } = await import("./lib/i18n");
  const { default: AppLayout } = await import("./layouts/AppLayout");
  const { default: CasePage } = await import("./pages/CasePage");
  const { default: Landing } = await import("./pages/Landing");
  const { sampleCase, emptyCase } = await import("./lib/docs");
  const noop = () => {};
  const el = step === 0
    ? <Landing onStart={noop} onSample={noop} onResume={null} />
    : <CasePage state={sample ? sampleCase() : emptyCase()} update={noop} replace={noop} step={step} setStep={noop} onReset={noop} />;
  return renderToString(<LangProvider><AppLayout onHome={noop}>{el}</AppLayout></LangProvider>);
}

test("landing shows tagline, CTAs, limitations and the sticker in the header", async () => {
  const html = await render("en", 0);
  assert.match(html, /Know what you(&#x27;|')re signing before you buy/);
  assert.match(html, /Try the sample case/);
  assert.match(html, /does not verify title/);
  assert.match(html, /Built For Ostad Presents YUNet AIgnite Buildathon 2026/);
});

test("checklist step renders items and general-guidance note", async () => {
  const html = await render("en", 1);
  assert.match(html, /Sale deed \(dolil\) copy or draft/);
  assert.match(html, /not legal advice/);
});

test("documents step offers the AI panel per document and the synthetic-sample banner", async () => {
  const html = await render("en", 2);
  assert.equal((html.match(/Read this document with AI \(optional\)/g) ?? []).length, 3);
  assert.doesNotMatch(html, /Not available yet/);
  assert.match(html, /Synthetic sample/);
});

test("findings step shows the two planted issues with evidence (EN)", async () => {
  const html = await render("en", 3);
  assert.match(html, /Plot numbers differ across documents/);
  assert.match(html, /Area being sold is larger than the recorded share/);
  assert.match(html, /1254/);
});

test("findings step is in Bangla when language is bn", async () => {
  const html = await render("bn", 3);
  assert.match(html, /কাগজপত্রে দাগ নম্বর মিলছে না/);
  assert.match(html, /বিক্রির জমি রেকর্ডভুক্ত অংশের চেয়ে বেশি/);
});

test("empty case shows the empty state, not fake findings", async () => {
  const html = await render("en", 3, false);
  assert.match(html, /Enter some document fields first/);
  assert.doesNotMatch(html, /Plot numbers differ/);
});

test("report includes questions, entered data and limitations", async () => {
  const html = await render("en", 4);
  assert.match(html, /Questions for your lawyer/);
  assert.match(html, /Limitations/);
  assert.match(html, /Print \/ save as PDF/);
});
