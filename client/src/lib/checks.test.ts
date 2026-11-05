import test from "node:test";
import assert from "node:assert/strict";
import { runChecks } from "./checks";
import { emptyCase, sampleCase } from "./docs";
import { compareNames, parseShare, toDecimal } from "./normalize";

const today = new Date("2026-11-05");

test("sample case flags plot mismatch and share overflow, but not the Md./honorific name difference", () => {
  const r = runChecks(sampleCase(), today);
  const ids = r.findings.map((f) => f.ruleId);
  assert.ok(ids.includes("plot-mismatch"));
  assert.ok(ids.includes("area-exceeds-share"));
  assert.ok(!ids.some((i) => i.startsWith("name-")));
  assert.ok(!ids.includes("khatian-mismatch"));
  assert.equal(r.findings.length, 2);
  const share = r.findings.find((f) => f.ruleId === "area-exceeds-share")!;
  assert.match(share.explanation.en, /about 6 decimal/);
  assert.equal(share.evidence.length, 3);
});

test("clean case raises nothing", () => {
  const c = sampleCase();
  c.docs.mutation.plotNumber = "1245";
  c.docs.deed.areaSold = "6";
  assert.equal(runChecks(c, today).findings.length, 0);
});

test("empty case compares nothing and skips", () => {
  const r = runChecks(emptyCase(), today);
  assert.equal(r.compared, 0);
  assert.ok(r.skipped > 0);
  assert.equal(r.findings.length, 0);
});

test("Bangla digits are normalized in identifiers and numbers", () => {
  const c = sampleCase();
  c.docs.mutation.plotNumber = "১২৪৫";
  assert.ok(!runChecks(c, today).findings.some((f) => f.ruleId === "plot-mismatch"));
});

test("unit conversion and share parsing", () => {
  assert.equal(toDecimal(1, "acre"), 100);
  assert.ok(Math.abs(toDecimal(435.6, "sqft") - 1) < 1e-9);
  assert.equal(parseShare("1/4"), 0.25);
  assert.equal(parseShare("25%"), 0.25);
  assert.equal(parseShare("১/২"), 0.5);
  assert.equal(parseShare("abc"), null);
});

test("name comparison levels", () => {
  assert.equal(compareNames("Md. Abdul Karim", "Abdul Karim"), "same");
  assert.equal(compareNames("Abdul Karim", "Abdul Korim"), "similar");
  assert.equal(compareNames("Abdul Karim", "Rahim Uddin"), "different");
  assert.equal(compareNames("Abdul Karim", "আব্দুল করিম"), "script");
});

test("invalid share is reported, not silently used", () => {
  const c = sampleCase();
  c.docs.khatian.ownerShare = "3/2";
  assert.ok(runChecks(c, today).findings.some((f) => f.ruleId === "share-invalid"));
});

test("future deed date is flagged", () => {
  const c = sampleCase();
  c.docs.deed.deedDate = "2027-01-01";
  assert.ok(runChecks(c, today).findings.some((f) => f.ruleId === "date-future"));
});
