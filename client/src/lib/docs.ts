import type { Bi, CaseState, DocDef, DocType, Transaction } from "./types";

export const DOCS: DocDef[] = [
  {
    type: "deed",
    title: { en: "Sale deed (dolil)", bn: "বিক্রয় দলিল" },
    blurb: { en: "Who sells, who buys, which land, how much.", bn: "কে বিক্রি করছেন, কে কিনছেন, কোন জমি, কতটুকু।" },
    fields: [
      { key: "sellerName", kind: "text", label: { en: "Seller name", bn: "বিক্রেতার নাম" } },
      { key: "buyerName", kind: "text", label: { en: "Buyer name", bn: "ক্রেতার নাম" } },
      { key: "plotNumber", kind: "text", label: { en: "Plot (dag) number", bn: "দাগ নম্বর" } },
      { key: "khatianNumber", kind: "text", label: { en: "Khatian number", bn: "খতিয়ান নম্বর" } },
      { key: "areaSold", kind: "area", label: { en: "Land area being sold", bn: "বিক্রিত জমির পরিমাণ" } },
      { key: "deedDate", kind: "date", label: { en: "Deed date", bn: "দলিলের তারিখ" } },
    ],
  },
  {
    type: "khatian",
    title: { en: "Khatian (land record)", bn: "খতিয়ান (ভূমি রেকর্ড)" },
    blurb: { en: "Who is recorded as owner, and in what share.", bn: "রেকর্ডে মালিক কে এবং কত অংশের মালিক।" },
    fields: [
      { key: "ownerName", kind: "text", label: { en: "Recorded owner", bn: "রেকর্ডভুক্ত মালিকের নাম" } },
      { key: "khatianNumber", kind: "text", label: { en: "Khatian number", bn: "খতিয়ান নম্বর" } },
      { key: "plotNumber", kind: "text", label: { en: "Plot (dag) number", bn: "দাগ নম্বর" } },
      { key: "plotArea", kind: "area", label: { en: "Total area of the plot", bn: "দাগের মোট জমি" } },
      {
        key: "ownerShare",
        kind: "fraction",
        label: { en: "Owner's share", bn: "মালিকের অংশ" },
        hint: {
          en: "e.g. 1/4, 0.25 or 25%. Convert ana-ganda shares to a fraction first.",
          bn: "যেমন ১/৪, ০.২৫ বা ২৫%। আনা-গণ্ডার অংশ আগে ভগ্নাংশে রূপান্তর করুন।",
        },
      },
    ],
  },
  {
    type: "mutation",
    title: { en: "Mutation (namjari) record", bn: "নামজারি (মিউটেশন) রেকর্ড" },
    blurb: { en: "Whether the land office updated the owner's name.", bn: "ভূমি অফিস মালিকের নাম হালনাগাদ করেছে কি না।" },
    fields: [
      { key: "ownerName", kind: "text", label: { en: "Owner named in mutation", bn: "নামজারিতে মালিকের নাম" } },
      { key: "khatianNumber", kind: "text", label: { en: "Khatian number", bn: "খতিয়ান নম্বর" } },
      { key: "plotNumber", kind: "text", label: { en: "Plot (dag) number", bn: "দাগ নম্বর" } },
    ],
  },
];

export const docDef = (t: DocType) => DOCS.find((d) => d.type === t)!;

export interface ChecklistItem { key: string; label: Bi; why: Bi; doc?: DocType; forTx: Transaction[] }

export const CHECKLIST: ChecklistItem[] = [
  {
    key: "deed", doc: "deed", forTx: ["buy"],
    label: { en: "Sale deed (dolil) copy or draft", bn: "বিক্রয় দলিলের কপি বা খসড়া" },
    why: { en: "States who sells, who buys, which land and how much.", bn: "কে বিক্রি করছেন, কে কিনছেন, কোন জমি ও কতটুকু — তা থাকে।" },
  },
  {
    key: "khatian", doc: "khatian", forTx: ["buy", "inherit"],
    label: { en: "Khatian (latest available record, e.g. RS / SA / BS)", bn: "খতিয়ান (সর্বশেষ পাওয়া রেকর্ড, যেমন আরএস / এসএ / বিএস)" },
    why: { en: "Shows who is recorded as owner and in what share.", bn: "রেকর্ডে মালিক কে এবং কত অংশের মালিক, তা দেখায়।" },
  },
  {
    key: "mutation", doc: "mutation", forTx: ["buy", "inherit"],
    label: { en: "Mutation (namjari) record", bn: "নামজারি (মিউটেশন) রেকর্ড" },
    why: { en: "Shows whether the land office updated the owner's name after the land was acquired.", bn: "জমি পাওয়ার পর ভূমি অফিসে মালিকের নাম হালনাগাদ হয়েছে কি না, তা বোঝা যায়।" },
  },
  {
    key: "tax", forTx: ["buy", "inherit"],
    label: { en: "Land development tax (khajna) receipts", bn: "ভূমি উন্নয়ন কর (খাজনা) এর দাখিলা" },
    why: { en: "Recent receipts suggest the tax is being paid regularly.", bn: "সাম্প্রতিক দাখিলা থেকে বোঝা যায় কর নিয়মিত দেওয়া হচ্ছে কি না।" },
  },
  {
    key: "chain", forTx: ["buy"],
    label: { en: "Earlier deeds (how the seller acquired the land)", bn: "আগের দলিলপত্র (বিক্রেতা কীভাবে জমি পেয়েছেন)" },
    why: { en: "Shows how ownership moved to the seller.", bn: "মালিকানা কীভাবে বিক্রেতার কাছে এসেছে, তা দেখায়।" },
  },
  {
    key: "warish", forTx: ["buy", "inherit"],
    label: { en: "Warish (heirship) certificate, if the land was inherited", bn: "ওয়ারিশ সনদ (জমি উত্তরাধিকারসূত্রে পেলে)" },
    why: { en: "Shows who the legal heirs are.", bn: "আইনগত উত্তরাধিকারী কারা, তা দেখায়।" },
  },
  {
    key: "partition", forTx: ["inherit"],
    label: { en: "Family partition or agreement papers, if any", bn: "পারিবারিক বণ্টননামা বা ভাগের কাগজ (থাকলে)" },
    why: { en: "Shows which family member received which part.", bn: "পরিবারের কে কোন অংশ পেয়েছেন, তা দেখায়।" },
  },
];

export const emptyCase = (): CaseState => ({
  transaction: "buy",
  abroad: false,
  have: {},
  docs: { deed: {}, khatian: {}, mutation: {} },
  isSample: false,
});

/** Invented demo data. Not a real record. Plants two discrepancies: plot-number slip and sold area > recorded share. */
export const sampleCase = (): CaseState => ({
  transaction: "buy",
  abroad: false,
  have: { deed: true, khatian: true, mutation: true, tax: true },
  isSample: true,
  docs: {
    deed: {
      sellerName: "Md. Abdul Karim", buyerName: "Rafiq Ahmed", plotNumber: "1245", khatianNumber: "389",
      areaSold: "10", areaSold__unit: "decimal", deedDate: "2026-08-14",
    },
    khatian: {
      ownerName: "Abdul Karim", khatianNumber: "389", plotNumber: "1245",
      plotArea: "24", plotArea__unit: "decimal", ownerShare: "1/4",
    },
    mutation: { ownerName: "Abdul Karim", khatianNumber: "389", plotNumber: "1254" },
  },
});
