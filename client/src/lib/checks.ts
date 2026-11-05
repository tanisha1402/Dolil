import { docDef } from "./docs";
import { compareNames, normId, parseNum, parseShare, toDecimal, type AreaUnit } from "./normalize";
import type { Bi, CaseState, CheckResult, DocType, Evidence, Finding, Severity } from "./types";

const fmt = (n: number) => String(Math.round(n * 100) / 100);
const docName = (d: DocType): Bi => docDef(d).title;
const fieldLabel = (d: DocType, k: string): Bi => docDef(d).fields.find((f) => f.key === k)!.label;
const val = (c: CaseState, d: DocType, k: string) => (c.docs[d][k] ?? "").trim();
const unitOf = (c: CaseState, d: DocType, k: string): AreaUnit => (c.docs[d][`${k}__unit`] as AreaUnit) || "decimal";
const ev = (c: CaseState, doc: DocType, fieldKey: string): Evidence => ({ doc, fieldKey, value: val(c, doc, fieldKey) });
export const evidenceLabel = (e: Evidence): Bi => ({
  en: `${docName(e.doc).en} — ${fieldLabel(e.doc, e.fieldKey).en}`,
  bn: `${docName(e.doc).bn} — ${fieldLabel(e.doc, e.fieldKey).bn}`,
});

const ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2, info: 3 };

export function runChecks(c: CaseState, today: Date = new Date()): CheckResult {
  const findings: Finding[] = [];
  let compared = 0;
  let skipped = 0;
  const add = (f: Omit<Finding, "id">) => findings.push({ ...f, id: `${f.ruleId}-${findings.length + 1}` });

  // Identifier rules: plot and khatian numbers should agree wherever they appear.
  const idRules: { key: "plotNumber" | "khatianNumber"; docs: DocType[]; ruleId: string; title: Bi; what: Bi; q: Bi }[] = [
    {
      key: "plotNumber", docs: ["deed", "khatian", "mutation"], ruleId: "plot-mismatch",
      title: { en: "Plot numbers differ across documents", bn: "কাগজপত্রে দাগ নম্বর মিলছে না" },
      what: { en: "plot (dag) number", bn: "দাগ নম্বর" },
      q: { en: "Which plot number is correct, and which official record confirms it?", bn: "কোন দাগ নম্বরটি সঠিক, এবং কোন সরকারি রেকর্ড তা নিশ্চিত করে?" },
    },
    {
      key: "khatianNumber", docs: ["deed", "khatian", "mutation"], ruleId: "khatian-mismatch",
      title: { en: "Khatian numbers differ across documents", bn: "কাগজপত্রে খতিয়ান নম্বর মিলছে না" },
      what: { en: "khatian number", bn: "খতিয়ান নম্বর" },
      q: { en: "Which khatian number is correct, and why do the documents disagree?", bn: "কোন খতিয়ান নম্বরটি সঠিক, এবং কাগজগুলোতে অমিল কেন?" },
    },
  ];
  for (const r of idRules) {
    const present = r.docs.filter((d) => val(c, d, r.key));
    if (present.length < 2) { skipped++; continue; }
    compared++;
    if (new Set(present.map((d) => normId(val(c, d, r.key)))).size > 1) {
      const listEn = present.map((d) => `${docName(d).en}: ${val(c, d, r.key)}`).join("; ");
      const listBn = present.map((d) => `${docName(d).bn}: ${val(c, d, r.key)}`).join("; ");
      add({
        ruleId: r.ruleId, severity: "high", title: r.title,
        explanation: {
          en: `The ${r.what.en} is not the same everywhere (${listEn}). This can be a typing slip, or the papers may describe different land. Only the land office or a lawyer can tell which.`,
          bn: `${r.what.bn} সব কাগজে এক নয় (${listBn})। এটি টাইপের ভুল হতে পারে, আবার ভিন্ন জমির কথাও হতে পারে। কোনটি সঠিক তা ভূমি অফিস বা আইনজীবীই বলতে পারবেন।`,
        },
        question: r.q,
        evidence: present.map((d) => ev(c, d, r.key)),
      });
    }
  }

  // Name rule: deed seller vs. names in the khatian and mutation records.
  const seller = val(c, "deed", "sellerName");
  for (const other of ["khatian", "mutation"] as DocType[]) {
    const name = val(c, other, "ownerName");
    if (!seller || !name) { skipped++; continue; }
    compared++;
    const m = compareNames(seller, name);
    if (m === "same") continue;
    const evidence = [ev(c, "deed", "sellerName"), ev(c, other, "ownerName")];
    if (m === "script") {
      add({
        ruleId: "name-script", severity: "info", evidence,
        title: { en: "Names are in different scripts", bn: "নাম দুটি ভিন্ন লিপিতে লেখা" },
        explanation: {
          en: `Dolil cannot reliably compare a Bangla and an English spelling of a name ("${seller}" vs "${name}"). Please compare them yourself or ask your lawyer.`,
          bn: `বাংলা ও ইংরেজি বানানে লেখা নাম ("${seller}" ও "${name}") দলিল নির্ভরযোগ্যভাবে মেলাতে পারে না। নিজে মিলিয়ে দেখুন বা আইনজীবীকে জিজ্ঞেস করুন।`,
        },
        question: { en: "Are these two names the same person? What document shows it?", bn: "এই দুই নাম কি একই ব্যক্তির? কোন কাগজে তা প্রমাণ হয়?" },
      });
    } else if (m === "similar") {
      add({
        ruleId: "name-similar", severity: "low", evidence,
        title: { en: "Seller's name is spelled slightly differently", bn: "বিক্রেতার নামের বানানে সামান্য পার্থক্য" },
        explanation: {
          en: `The deed says "${seller}" while ${docName(other).en} says "${name}". Small spelling differences are common, but they should be confirmed as the same person.`,
          bn: `দলিলে "${seller}", আর ${docName(other).bn}-এ "${name}"। বানানের ছোট পার্থক্য সাধারণ, তবে একই ব্যক্তি কি না নিশ্চিত হওয়া উচিত।`,
        },
        question: { en: "Can you confirm these spellings refer to the same person?", bn: "এই বানানগুলো যে একই ব্যক্তির, তা কি নিশ্চিত করতে পারবেন?" },
      });
    } else {
      add({
        ruleId: "name-mismatch", severity: "high", evidence,
        title: { en: "Seller's name does not match the record", bn: "বিক্রেতার নাম রেকর্ডের সাথে মিলছে না" },
        explanation: {
          en: `The deed names "${seller}" as seller, but ${docName(other).en} shows "${name}". It may be a spelling variation or a different person.`,
          bn: `দলিলে বিক্রেতা "${seller}", কিন্তু ${docName(other).bn}-এ "${name}"। এটি বানানের পার্থক্য হতে পারে, আবার ভিন্ন ব্যক্তিও হতে পারে।`,
        },
        question: { en: "Why does the seller's name differ from the land record, and who is the recorded owner?", bn: "বিক্রেতার নাম ভূমি রেকর্ডের সাথে ভিন্ন কেন, এবং রেকর্ডভুক্ত মালিক কে?" },
      });
    }
  }

  // Share arithmetic: area sold must not exceed plot area x owner's share.
  const shareRaw = val(c, "khatian", "ownerShare");
  const share = parseShare(shareRaw);
  if (shareRaw && (share === null || share <= 0 || share > 1)) {
    add({
      ruleId: "share-invalid", severity: "medium", evidence: [ev(c, "khatian", "ownerShare")],
      title: { en: "Owner's share could not be used", bn: "মালিকের অংশ ব্যবহার করা যায়নি" },
      explanation: {
        en: `"${shareRaw}" is not a valid share between 0 and 100%. Check the khatian and enter it as a fraction such as 1/4.`,
        bn: `"${shareRaw}" ০ থেকে ১০০%-এর মধ্যে বৈধ অংশ নয়। খতিয়ান দেখে ১/৪-এর মতো ভগ্নাংশে লিখুন।`,
      },
      question: { en: "What exactly is the owner's share recorded in the khatian?", bn: "খতিয়ানে মালিকের অংশ ঠিক কত লেখা আছে?" },
    });
    skipped++;
  } else {
    const plot = parseNum(val(c, "khatian", "plotArea"));
    const sold = parseNum(val(c, "deed", "areaSold"));
    if (share === null || plot === null || sold === null) {
      skipped++;
    } else {
      compared++;
      const owned = toDecimal(plot, unitOf(c, "khatian", "plotArea")) * share;
      const soldDec = toDecimal(sold, unitOf(c, "deed", "areaSold"));
      if (soldDec > owned + 1e-9) {
        add({
          ruleId: "area-exceeds-share", severity: "high",
          evidence: [ev(c, "khatian", "plotArea"), ev(c, "khatian", "ownerShare"), ev(c, "deed", "areaSold")],
          title: { en: "Area being sold is larger than the recorded share", bn: "বিক্রির জমি রেকর্ডভুক্ত অংশের চেয়ে বেশি" },
          explanation: {
            en: `The khatian shows a plot of ${fmt(toDecimal(plot, unitOf(c, "khatian", "plotArea")))} decimal and a share of ${shareRaw}, about ${fmt(owned)} decimal. The deed sells ${fmt(soldDec)} decimal. The seller may hold other shares elsewhere, or a figure may be wrong. Dolil cannot tell which.`,
            bn: `খতিয়ানে দাগের জমি ${fmt(toDecimal(plot, unitOf(c, "khatian", "plotArea")))} শতাংশ এবং অংশ ${shareRaw}, অর্থাৎ প্রায় ${fmt(owned)} শতাংশ। দলিলে বিক্রি হচ্ছে ${fmt(soldDec)} শতাংশ। বিক্রেতার অন্য কোথাও আরও অংশ থাকতে পারে, অথবা কোনো সংখ্যা ভুল হতে পারে। কোনটি তা দলিল বলতে পারে না।`,
          },
          question: {
            en: `How does the seller own ${fmt(soldDec)} decimal when the khatian shows about ${fmt(owned)}? Which other records show the rest?`,
            bn: `খতিয়ানে প্রায় ${fmt(owned)} শতাংশ থাকলে বিক্রেতা ${fmt(soldDec)} শতাংশের মালিক কীভাবে? বাকি অংশ কোন রেকর্ডে আছে?`,
          },
        });
      }
    }
  }

  // Date plausibility.
  const dd = val(c, "deed", "deedDate");
  if (dd) {
    compared++;
    const d = new Date(dd);
    if (!Number.isNaN(d.getTime()) && d.getTime() > today.getTime()) {
      add({
        ruleId: "date-future", severity: "low", evidence: [ev(c, "deed", "deedDate")],
        title: { en: "Deed date is in the future", bn: "দলিলের তারিখ ভবিষ্যতের" },
        explanation: { en: `The deed is dated ${dd}, which is later than today. It may be a draft or a typing error.`, bn: `দলিলের তারিখ ${dd}, যা আজকের পরে। এটি খসড়া বা টাইপের ভুল হতে পারে।` },
        question: { en: "Is this a draft? When will it actually be signed and registered?", bn: "এটি কি খসড়া? আসলে কবে সই ও রেজিস্ট্রি হবে?" },
      });
    }
  }

  findings.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  return { findings, compared, skipped };
}
