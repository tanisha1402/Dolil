import { useMemo } from "react";
import { ArrowLeft, ArrowRight, FlaskConical, Printer, RotateCcw, Trash2 } from "lucide-react";
import DocForm from "../components/DocForm";
import FindingCard from "../components/FindingCard";
import LimitationBanner from "../components/LimitationBanner";
import StepRail from "../components/StepRail";
import { runChecks } from "../lib/checks";
import { CHECKLIST, DOCS, emptyCase, sampleCase } from "../lib/docs";
import { useLang } from "../lib/i18n";
import { UNIT_LABEL, type AreaUnit } from "../lib/normalize";
import type { CaseState, DocType, ExtractResult, Transaction } from "../lib/types";

interface Props {
  state: CaseState;
  update: (fn: (c: CaseState) => CaseState) => void;
  replace: (c: CaseState) => void;
  step: number;
  setStep: (n: number) => void;
  onReset: () => void;
}

const primary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-mouza px-5 font-semibold text-white hover:bg-mouza/90";
const secondary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-ink/25 bg-white/70 px-5 font-medium hover:bg-paper-deep";

export default function CasePage({ state, update, replace, step, setStep, onReset }: Props) {
  const { t, bi, lang } = useLang();
  const result = useMemo(() => runChecks(state), [state]);

  const setField = (d: DocType, key: string, v: string) =>
    update((c) => {
      // Editing a field means the user has reviewed it, so its AI mark is removed.
      const marks = { ...(c.ai?.[d] ?? {}) };
      delete marks[key];
      return { ...c, isSample: false, docs: { ...c.docs, [d]: { ...c.docs[d], [key]: v } }, ai: { ...c.ai, [d]: marks } };
    });

  const applyAi = (d: DocType, r: ExtractResult) =>
    update((c) => {
      const values = { ...c.docs[d] };
      const marks = { ...(c.ai?.[d] ?? {}) };
      for (const [key, f] of Object.entries(r.fields)) {
        values[key] = f.value;
        if (f.unit) values[`${key}__unit`] = f.unit;
        marks[key] = { evidence: f.evidence, verified: f.verified };
      }
      return { ...c, isSample: false, docs: { ...c.docs, [d]: values }, ai: { ...c.ai, [d]: marks } };
    });

  const items = CHECKLIST.filter((i) => i.forTx.includes(state.transaction));
  const haveCount = items.filter((i) => state.have[i.key]).length;

  const nav = (back: number | null, next: { label: string; to: number } | null) => (
    <div className="no-print mt-8 flex flex-wrap justify-between gap-3">
      {back !== null ? (
        <button type="button" onClick={() => setStep(back)} className={secondary}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> {t("nav.back")}
        </button>
      ) : <span />}
      {next && (
        <button type="button" onClick={() => setStep(next.to)} className={primary}>
          {next.label} <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );

  const questions = Array.from(new Map(result.findings.map((f) => [f.question.en, f.question])).values());
  const showVal = (d: DocType, key: string, kind: string) => {
    const v = (state.docs[d][key] ?? "").trim();
    if (!v) return t("report.notentered");
    if (kind === "area") return `${v} ${UNIT_LABEL[((state.docs[d][`${key}__unit`] as AreaUnit) || "decimal")][lang]}`;
    return v;
  };

  return (
    <div className="space-y-6">
      <StepRail step={step} onGo={setStep} />

      {state.isSample && (
        <p className="flex items-center gap-2 rounded-md border border-mouza/40 bg-mouza/10 px-3 py-2 text-sm">
          <FlaskConical className="h-4 w-4 shrink-0 text-mouza" aria-hidden /> {t("sample.banner")}
        </p>
      )}

      {step === 1 && (
        <section className="space-y-6">
          <fieldset>
            <legend className="font-display text-2xl font-bold">{t("setup.q")}</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(["buy", "inherit"] as Transaction[]).map((tx) => (
                <label key={tx} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-4 ${state.transaction === tx ? "border-mouza bg-mouza/10" : "border-ink/15 bg-white/70"}`}>
                  <input type="radio" name="tx" className="h-4 w-4 accent-[#1f6f5b]" checked={state.transaction === tx} onChange={() => update((c) => ({ ...c, transaction: tx }))} />
                  {t(`tx.${tx}`)}
                </label>
              ))}
            </div>
            <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3">
              <input type="checkbox" className="h-4 w-4 accent-[#1f6f5b]" checked={state.abroad} onChange={(e) => update((c) => ({ ...c, abroad: e.target.checked }))} />
              {t("abroad")}
            </label>
            {state.abroad && <p className="mt-1 text-sm text-ink-soft">{t("abroad.note")}</p>}
          </fieldset>

          <div>
            <h2 className="font-display text-2xl font-bold">{t("check.title")}</h2>
            <p className="mt-1 text-sm text-ink-soft">{t("check.note")}</p>
            <p className="mt-2 text-sm font-medium text-mouza">{t("check.progress", { n: haveCount, total: items.length })}</p>
            <ul className="mt-3 space-y-3">
              {items.map((i) => (
                <li key={i.key} className="rounded-lg border border-ink/15 bg-white/70 p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" className="mt-1.5 h-4 w-4 accent-[#1f6f5b]" checked={!!state.have[i.key]} onChange={(e) => update((c) => ({ ...c, have: { ...c.have, [i.key]: e.target.checked } }))} />
                    <span>
                      <span className="block font-medium">{bi(i.label)}</span>
                      <span className="block text-sm text-ink-soft">{bi(i.why)}</span>
                      <span className="mt-1 block text-xs text-mouza">{t("check.have")}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <LimitationBanner />
          {nav(null, { label: t("nav.next"), to: 2 })}
        </section>
      )}

      {step === 2 && (
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold">{t("docs.title")}</h2>
            <p className="mt-1 text-sm text-ink-soft">{t("docs.sub")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => replace({ ...sampleCase(), transaction: state.transaction, abroad: state.abroad })} className={`${secondary} min-h-11`}>
              <FlaskConical className="h-4 w-4" aria-hidden /> {t("docs.sample.btn")}
            </button>
            <button type="button" onClick={() => replace({ ...emptyCase(), transaction: state.transaction, abroad: state.abroad, have: state.have })} className={`${secondary} min-h-11`}>
              <Trash2 className="h-4 w-4" aria-hidden /> {t("docs.clear")}
            </button>
          </div>
          <DocForm state={state} onChange={setField} onApplyAi={applyAi} />
          {nav(1, { label: t("cta.run"), to: 3 })}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-5">
          <h2 className="font-display text-2xl font-bold">{t("find.title")}</h2>
          {result.compared === 0 ? (
            <div className="rounded-lg border border-dashed border-ink/30 bg-white/60 p-6 text-center">
              <p>{t("find.empty")}</p>
              <button type="button" onClick={() => setStep(2)} className={`${primary} mt-4`}>{t("find.go")}</button>
            </div>
          ) : (
            <>
              <p className={`font-medium ${result.findings.length ? "text-stamp" : "text-mouza"}`}>
                {result.findings.length ? t("find.count", { n: result.findings.length }) : t("find.none")}
              </p>
              <p className="text-sm text-ink-soft">{t("find.stats", { c: result.compared, s: result.skipped })}</p>
              <div className="space-y-4">{result.findings.map((f) => <FindingCard key={f.id} f={f} />)}</div>
            </>
          )}
          {nav(2, { label: t("step.4"), to: 4 })}
        </section>
      )}

      {step === 4 && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-bold">{t("report.title")}</h2>
              <p className="text-sm text-ink-soft">
                {t("report.date")}: {new Date().toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB")} · {t(`tx.${state.transaction}`)}
              </p>
            </div>
            <button type="button" onClick={() => window.print()} className={`${primary} no-print`}>
              <Printer className="h-4 w-4" aria-hidden /> {t("report.print")}
            </button>
          </div>
          {state.isSample && <p className="rounded-md border border-mouza/40 bg-mouza/10 px-3 py-2 text-sm">{t("sample.banner")}</p>}

          <div className="print-card rounded-lg border border-ink/15 bg-white/70 p-5">
            <h3 className="font-display text-xl font-bold">{t("report.summary")}</h3>
            <p className="mt-2">{result.compared === 0 ? t("find.empty") : result.findings.length ? t("find.count", { n: result.findings.length }) : t("find.none")}</p>
            <p className="text-sm text-ink-soft">{t("find.stats", { c: result.compared, s: result.skipped })}</p>
            <p className="mt-2 text-sm">{t("report.collected")}: {t("check.progress", { n: haveCount, total: items.length })}</p>
          </div>

          {result.findings.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-display text-xl font-bold">{t("find.title")}</h3>
              {result.findings.map((f) => <FindingCard key={f.id} f={f} />)}
            </div>
          )}

          <div className="print-card rounded-lg border border-ink/15 bg-white/70 p-5">
            <h3 className="font-display text-xl font-bold">{t("report.questions")}</h3>
            {questions.length ? (
              <ol className="mt-2 list-decimal space-y-2 pl-5">{questions.map((q) => <li key={q.en}>{bi(q)}</li>)}</ol>
            ) : (
              <p className="mt-2 text-ink-soft">{t("report.noq")}</p>
            )}
          </div>

          <div className="print-card rounded-lg border border-ink/15 bg-white/70 p-5">
            <h3 className="font-display text-xl font-bold">{t("report.docs")}</h3>
            {DOCS.map((d) => (
              <div key={d.type} className="mt-3">
                <p className="font-medium">{bi(d.title)}</p>
                <dl className="mt-1 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                  {d.fields.map((f) => (
                    <div key={f.key} className="flex justify-between gap-3 border-b border-ink/10 py-1">
                      <dt className="text-ink-soft">{bi(f.label)}</dt>
                      <dd className="text-right font-medium">{showVal(d.type, f.key, f.kind)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          <div className="print-card rounded-lg border border-amber/50 bg-amber/10 p-5">
            <h3 className="font-display text-xl font-bold">{t("report.limits")}</h3>
            <p className="mt-2 text-sm">{t("report.limits.body")}</p>
          </div>

          <div className="no-print flex flex-wrap justify-between gap-3">
            <button type="button" onClick={() => setStep(3)} className={secondary}><ArrowLeft className="h-4 w-4" aria-hidden /> {t("nav.back")}</button>
            <button type="button" onClick={() => { if (window.confirm(t("nav.confirm"))) onReset(); }} className={secondary}>
              <RotateCcw className="h-4 w-4" aria-hidden /> {t("nav.startover")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
