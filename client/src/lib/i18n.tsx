import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Bi, Lang } from "./types";

const D: Record<string, Bi> = {
  "app.tagline": { en: "Know what you're signing before you buy.", bn: "সই করার আগে জানুন, আপনি কী সই করছেন।" },
  "landing.sub": {
    en: "Dolil helps you read property documents, compare them, and prepare better questions for your lawyer.",
    bn: "দলিল আপনাকে সম্পত্তির কাগজপত্র বুঝতে, মিলিয়ে দেখতে এবং আইনজীবীকে করার প্রশ্ন তৈরি করতে সাহায্য করে।",
  },
  "cta.start": { en: "Start a case", bn: "নতুন কেস শুরু করুন" },
  "cta.sample": { en: "Try the sample case", bn: "নমুনা কেস দেখুন" },
  "cta.resume": { en: "Continue my case", bn: "আমার কেস চালিয়ে যান" },
  "landing.how": { en: "How it works", bn: "কীভাবে কাজ করে" },
  "how.1": { en: "Pick your situation and see which documents are usually worth collecting.", bn: "আপনার পরিস্থিতি বেছে নিন এবং কোন কাগজ সাধারণত সংগ্রহ করা ভালো তা দেখুন।" },
  "how.2": { en: "Enter the key fields from each document.", bn: "প্রতিটি কাগজ থেকে মূল তথ্যগুলো লিখুন।" },
  "how.3": { en: "Dolil compares them with fixed rules and shows the evidence for anything that doesn't line up.", bn: "দলিল নির্দিষ্ট নিয়মে মিলিয়ে দেখে এবং যা মেলে না তার প্রমাণ দেখায়।" },
  "how.4": { en: "Print a report with questions to take to your lawyer.", bn: "আইনজীবীর কাছে নেওয়ার প্রশ্নসহ রিপোর্ট প্রিন্ট করুন।" },
  "limits.title": { en: "What Dolil is — and isn't", bn: "দলিল কী — এবং কী নয়" },
  "limits.body": {
    en: "Dolil is a preliminary understanding tool. It does not verify title, ownership or legality, and it is not a substitute for a lawyer or official land-record verification.",
    bn: "দলিল একটি প্রাথমিক বোঝার সহায়ক টুল। এটি মালিকানা, স্বত্ব বা বৈধতা যাচাই করে না এবং আইনজীবী বা সরকারি ভূমি রেকর্ড যাচাইয়ের বিকল্প নয়।",
  },
  "preview.note": {
    en: "You can type fields yourself, or let AI read pasted text or an uploaded file for you to confirm. Try the sample case first.",
    bn: "আপনি নিজে তথ্য লিখতে পারেন, অথবা এআই-কে লেখা বা ফাইল পড়তে দিয়ে নিজে নিশ্চিত করতে পারেন। আগে নমুনা কেস দেখুন।",
  },
  "step.1": { en: "Checklist", bn: "চেকলিস্ট" },
  "step.2": { en: "Documents", bn: "কাগজপত্র" },
  "step.3": { en: "Findings", bn: "পর্যবেক্ষণ" },
  "step.4": { en: "Report", bn: "রিপোর্ট" },
  "setup.q": { en: "What are you doing?", bn: "আপনি কী করছেন?" },
  "tx.buy": { en: "Buying land or property", bn: "জমি বা সম্পত্তি কিনছি" },
  "tx.inherit": { en: "Dealing with inherited property", bn: "উত্তরাধিকারসূত্রে পাওয়া সম্পত্তি নিয়ে কাজ করছি" },
  "abroad": { en: "I am based abroad", bn: "আমি দেশের বাইরে থাকি" },
  "abroad.note": { en: "Tip: a Bangla/English report is easy to share with a lawyer in Bangladesh.", bn: "পরামর্শ: বাংলা/ইংরেজি রিপোর্ট বাংলাদেশের আইনজীবীর সঙ্গে সহজে শেয়ার করা যায়।" },
  "check.title": { en: "Documents usually worth collecting", bn: "সাধারণত যেসব কাগজ সংগ্রহ করা ভালো" },
  "check.note": {
    en: "General guidance, not legal advice. A lawyer should confirm what your case needs.",
    bn: "এটি সাধারণ নির্দেশনা, আইনি পরামর্শ নয়। আপনার ক্ষেত্রে কী লাগবে তা আইনজীবীকে নিশ্চিত করতে বলুন।",
  },
  "check.have": { en: "I have this", bn: "আমার কাছে আছে" },
  "check.progress": { en: "{n} of {total} collected", bn: "{total}টির মধ্যে {n}টি সংগ্রহ হয়েছে" },
  "docs.title": { en: "Enter the fields from each document", bn: "প্রতিটি কাগজ থেকে তথ্য লিখুন" },
  "docs.sub": { en: "Type what the document says, or use the AI panel in each box. Leave a field empty if you don't have it — Dolil will skip checks that need it.", bn: "কাগজে যা লেখা আছে তা লিখুন, অথবা প্রতিটি বক্সের এআই অংশ ব্যবহার করুন। না থাকলে ঘরটি ফাঁকা রাখুন — সংশ্লিষ্ট মিলানো বাদ যাবে।" },
  "ai.title": { en: "Read this document with AI (optional)", bn: "এই কাগজ এআই দিয়ে পড়ুন (ঐচ্ছিক)" },
  "ai.consent": {
    en: "I understand the text or image I send goes to Google's AI service. I will only use sample or anonymized documents I am allowed to share.",
    bn: "আমি বুঝি যে আমার পাঠানো লেখা বা ছবি গুগলের এআই সেবায় যাবে। আমি শুধু নমুনা বা পরিচয় মুছে ফেলা কাগজ ব্যবহার করব, যা শেয়ার করার অনুমতি আমার আছে।",
  },
  "ai.paste": { en: "Paste the document text", bn: "কাগজের লেখা পেস্ট করুন" },
  "ai.file": { en: "…or upload a PDF with text, a .txt file, or a photo of the page", bn: "…অথবা লেখাসহ পিডিএফ, .txt ফাইল বা পাতার ছবি আপলোড করুন" },
  "ai.read": { en: "Read fields with AI", bn: "এআই দিয়ে তথ্য পড়ুন" },
  "ai.explain": { en: "Explain this document", bn: "কাগজটি সহজ ভাষায় বুঝিয়ে দিন" },
  "ai.busy": { en: "Working… this can take up to a minute.", bn: "কাজ চলছে… এক মিনিট পর্যন্ত লাগতে পারে।" },
  "ai.filled": { en: "{n} field(s) filled by AI. Check each one against your document.", bn: "এআই {n}টি ঘর পূরণ করেছে। প্রতিটি ঘর আপনার কাগজের সাথে মিলিয়ে নিন।" },
  "ai.mark.ok": { en: "AI-read · quote found in your text", bn: "এআই-পঠিত · আপনার লেখায় উদ্ধৃতি পাওয়া গেছে" },
  "ai.mark.bad": { en: "AI-read · NOT found in your text — check carefully", bn: "এআই-পঠিত · আপনার লেখায় পাওয়া যায়নি — সাবধানে মিলিয়ে দেখুন" },
  "ai.mark.img": { en: "AI-read from an image · cannot be checked, verify it", bn: "ছবি থেকে এআই-পঠিত · যাচাই করা যায়নি, নিজে মিলিয়ে নিন" },
  "ai.quote": { en: "Quote", bn: "উদ্ধৃতি" },
  "ai.disclaimer": { en: "AI-written explanation. Not legal advice; it can contain mistakes.", bn: "এআই-লেখা ব্যাখ্যা। এটি আইনি পরামর্শ নয়; ভুল থাকতে পারে।" },
  "ai.terms": { en: "Key terms", bn: "গুরুত্বপূর্ণ শব্দ" },
  "ai.ask": { en: "Worth asking your lawyer", bn: "আইনজীবীকে জিজ্ঞেস করার মতো" },
  "ai.noinput": { en: "Paste text or choose a file first.", bn: "আগে লেখা পেস্ট করুন বা ফাইল বেছে নিন।" },
  "ai.explain.text": { en: "To explain a document, paste its text or upload a text file or PDF.", bn: "কাগজ বোঝাতে এর লেখা পেস্ট করুন বা টেক্সট ফাইল/পিডিএফ আপলোড করুন।" },
  "docs.sample.btn": { en: "Load synthetic sample", bn: "কাল্পনিক নমুনা লোড করুন" },
  "docs.clear": { en: "Clear all fields", bn: "সব ঘর মুছুন" },
  "sample.banner": { en: "Synthetic sample — invented for demonstration, not a real record.", bn: "কাল্পনিক নমুনা — প্রদর্শনের জন্য বানানো, কোনো আসল রেকর্ড নয়।" },
  "cta.run": { en: "Run checks", bn: "মিলিয়ে দেখুন" },
  "nav.back": { en: "Back", bn: "পিছনে" },
  "nav.next": { en: "Next", bn: "পরবর্তী" },
  "nav.startover": { en: "Start over", bn: "নতুন করে শুরু" },
  "nav.confirm": { en: "Delete this case and start over?", bn: "এই কেস মুছে নতুন করে শুরু করবেন?" },
  "find.title": { en: "Findings", bn: "পর্যবেক্ষণ" },
  "find.empty": { en: "Enter some document fields first, then come back to run the checks.", bn: "আগে কাগজের কিছু তথ্য লিখুন, তারপর এখানে এসে মিলিয়ে দেখুন।" },
  "find.go": { en: "Go to documents", bn: "কাগজপত্রে যান" },
  "find.none": { en: "No inconsistencies found in the fields you entered. This does not mean the documents are correct.", bn: "আপনার দেওয়া তথ্যে কোনো অমিল পাওয়া যায়নি। এর মানে এই নয় যে কাগজপত্র নির্ভুল।" },
  "find.count": { en: "{n} possible issue(s) to look into", bn: "{n}টি বিষয় খতিয়ে দেখা দরকার" },
  "find.stats": { en: "{c} comparison(s) made, {s} skipped because fields were empty.", bn: "{c}টি মিলানো হয়েছে, ফাঁকা ঘরের কারণে {s}টি বাদ গেছে।" },
  "sev.high": { en: "Needs attention", bn: "গুরুত্বপূর্ণ" },
  "sev.medium": { en: "Worth checking", bn: "যাচাই করুন" },
  "sev.low": { en: "Minor", bn: "সামান্য" },
  "sev.info": { en: "Note", bn: "নোট" },
  "evidence": { en: "Evidence", bn: "প্রমাণ" },
  "question": { en: "Question to ask", bn: "যে প্রশ্ন করবেন" },
  "report.title": { en: "Preliminary due-diligence report", bn: "প্রাথমিক যাচাই রিপোর্ট" },
  "report.print": { en: "Print / save as PDF", bn: "প্রিন্ট / পিডিএফ সংরক্ষণ" },
  "report.summary": { en: "Summary", bn: "সারসংক্ষেপ" },
  "report.docs": { en: "Information entered", bn: "যে তথ্য দেওয়া হয়েছে" },
  "report.questions": { en: "Questions for your lawyer", bn: "আইনজীবীকে করার প্রশ্ন" },
  "report.limits": { en: "Limitations", bn: "সীমাবদ্ধতা" },
  "report.limits.body": {
    en: "This report compares only the fields typed in. It does not verify title, ownership, legality or the authenticity of any document, and it may miss problems. Confirm everything with a qualified lawyer and the relevant land office before signing or paying.",
    bn: "এই রিপোর্ট কেবল টাইপ করা তথ্য মিলিয়েছে। এটি মালিকানা, স্বত্ব, বৈধতা বা কোনো কাগজের সত্যতা যাচাই করে না এবং সমস্যা বাদ পড়তে পারে। সই বা টাকা দেওয়ার আগে যোগ্য আইনজীবী ও সংশ্লিষ্ট ভূমি অফিসের মাধ্যমে সবকিছু নিশ্চিত করুন।",
  },
  "report.noq": { en: "No questions generated from the checks. Still ask your lawyer to verify the documents.", bn: "মিলানো থেকে কোনো প্রশ্ন আসেনি। তবুও আইনজীবীকে দিয়ে কাগজ যাচাই করান।" },
  "report.notentered": { en: "(not entered)", bn: "(দেওয়া হয়নি)" },
  "report.collected": { en: "Documents collected", bn: "সংগৃহীত কাগজ" },
  "report.date": { en: "Prepared", bn: "তৈরির তারিখ" },
  "footer": { en: "Dolil gives preliminary information only — not legal advice.", bn: "দলিল শুধু প্রাথমিক তথ্য দেয় — এটি আইনি পরামর্শ নয়।" },
  "privacy.note": {
    en: "Your case stays in this browser. Text or images you send to the AI are processed by Google's AI service under Google's terms (they may be retained). Dolil does not store them. Use sample or anonymized documents only.",
    bn: "আপনার কেস এই ব্রাউজারেই থাকে। এআই-কে পাঠানো লেখা বা ছবি গুগলের এআই সেবা গুগলের শর্তে প্রক্রিয়া করে (সংরক্ষিত থাকতে পারে)। দলিল এগুলো সংরক্ষণ করে না। শুধু নমুনা বা পরিচয় মুছে ফেলা কাগজ ব্যবহার করুন।",
  },
  "lang.switch": { en: "বাংলা", bn: "English" },
};

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: (k: string, v?: Record<string, string | number>) => string; bi: (b: Bi) => string }
const LangCtx = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return localStorage.getItem("dolil.lang") === "bn" ? "bn" : "en"; } catch { return "en"; }
  });
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("dolil.lang", l); } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const value = useMemo<Ctx>(() => ({
    lang, setLang,
    bi: (b) => b[lang],
    t: (k, v) => {
      let s = D[k]?.[lang] ?? k;
      if (v) for (const [key, x] of Object.entries(v)) s = s.replace(`{${key}}`, String(x));
      return s;
    },
  }), [lang, setLang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang(): Ctx {
  const c = useContext(LangCtx);
  if (!c) throw new Error("useLang must be used inside LangProvider");
  return c;
}
