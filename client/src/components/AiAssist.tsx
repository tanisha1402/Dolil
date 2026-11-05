import { useState } from "react";
import { BookOpen, ChevronDown, Loader2, Sparkles } from "lucide-react";
import { explainText, extractFromFile, extractFromText, parseFile, ApiError } from "../services/api";
import { useLang } from "../lib/i18n";
import type { DocType, ExtractResult, Explanation } from "../lib/types";

export default function AiAssist({ docType, onApply }: { docType: DocType; onApply: (d: DocType, r: ExtractResult) => void }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<{ filled: number; warnings: string[] } | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);

  const hasInput = text.trim().length > 0 || file !== null;
  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null); setInfo(null); setExplanation(null);
    try { await fn(); } catch (e) { setError(e instanceof ApiError ? e.message : "Something went wrong."); } finally { setBusy(false); }
  };

  const read = () => run(async () => {
    const r = text.trim() ? await extractFromText(docType, text) : await extractFromFile(docType, file!);
    onApply(docType, r);
    setInfo({ filled: Object.keys(r.fields).length, warnings: r.warnings.map((w) => w.message) });
  });

  const explain = () => run(async () => {
    let source = text.trim();
    if (!source && file) {
      const p = await parseFile(file);
      if (p.needsVision || !p.text) throw new ApiError("no_text", t("ai.explain.text"));
      source = p.text;
    }
    if (!source) throw new ApiError("no_text", t("ai.explain.text"));
    setExplanation(await explainText(docType, source, lang));
  });

  const btn = "inline-flex min-h-11 items-center gap-2 rounded-md px-4 font-medium disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <div className="no-print mb-4 rounded-md border border-mouza/30 bg-mouza/5">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-11 w-full items-center justify-between gap-2 px-4 text-left font-medium text-mouza">
        <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" aria-hidden /> {t("ai.title")}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div className="space-y-3 border-t border-mouza/20 p-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-[#1f6f5b]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{t("ai.consent")}</span>
          </label>
          <div>
            <label htmlFor={`ai-text-${docType}`} className="mb-1 block text-sm font-medium">{t("ai.paste")}</label>
            <textarea id={`ai-text-${docType}`} rows={5} value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded-md border border-ink/25 bg-white p-3 text-base" />
          </div>
          <div>
            <label htmlFor={`ai-file-${docType}`} className="mb-1 block text-sm font-medium">{t("ai.file")}</label>
            <input id={`ai-file-${docType}`} type="file" accept=".pdf,.txt,.png,.jpg,.jpeg,.webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm" />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={!consent || !hasInput || busy} onClick={read} className={`${btn} bg-mouza text-white hover:bg-mouza/90`}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />} {t("ai.read")}
            </button>
            <button type="button" disabled={!consent || !hasInput || busy} onClick={explain} className={`${btn} border border-ink/25 bg-white/70 hover:bg-paper-deep`}>
              <BookOpen className="h-4 w-4" aria-hidden /> {t("ai.explain")}
            </button>
          </div>
          {busy && <p role="status" className="text-sm text-ink-soft">{t("ai.busy")}</p>}
          {error && <p role="alert" className="rounded-md border border-stamp/40 bg-stamp/10 px-3 py-2 text-sm text-stamp">{error}</p>}
          {info && (
            <div role="status" className="rounded-md border border-ink/15 bg-white/70 px-3 py-2 text-sm">
              <p className="font-medium">{t("ai.filled", { n: info.filled })}</p>
              {info.warnings.map((w, i) => <p key={i} className="mt-1 text-amber">{w}</p>)}
            </div>
          )}
          {explanation && (
            <div className="rounded-md border border-ink/15 bg-white/80 p-4 text-sm">
              <p>{explanation.summary}</p>
              {explanation.keyTerms.length > 0 && (
                <>
                  <p className="mt-3 font-semibold">{t("ai.terms")}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">{explanation.keyTerms.map((k, i) => <li key={i}><b>{k.term}</b>: {k.meaning}</li>)}</ul>
                </>
              )}
              {explanation.notes.length > 0 && (
                <>
                  <p className="mt-3 font-semibold">{t("ai.ask")}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">{explanation.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
                </>
              )}
              <p className="mt-3 text-xs text-ink-soft">{t("ai.disclaimer")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
