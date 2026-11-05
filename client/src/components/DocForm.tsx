import { DOCS } from "../lib/docs";
import AiAssist from "./AiAssist";
import { useLang } from "../lib/i18n";
import { UNIT_LABEL, type AreaUnit } from "../lib/normalize";
import type { CaseState, DocType, ExtractResult } from "../lib/types";

const inputCls = "min-h-11 w-full rounded-md border border-ink/25 bg-white px-3 text-base";

export default function DocForm({ state, onChange, onApplyAi }: { state: CaseState; onChange: (d: DocType, key: string, v: string) => void; onApplyAi: (d: DocType, r: ExtractResult) => void }) {
  const { bi, lang, t } = useLang();
  return (
    <div className="space-y-6">
      {DOCS.map((doc) => (
        <fieldset key={doc.type} className="rounded-lg border border-ink/15 bg-white/70 p-5">
          <legend className="px-2 font-display text-lg font-bold">{bi(doc.title)}</legend>
          <p className="-mt-1 mb-4 text-sm text-ink-soft">{bi(doc.blurb)}</p>
          <AiAssist docType={doc.type} onApply={onApplyAi} />
          <div className="grid gap-4 sm:grid-cols-2">
            {doc.fields.map((f) => {
              const id = `${doc.type}-${f.key}`;
              const v = state.docs[doc.type][f.key] ?? "";
              return (
                <div key={f.key}>
                  <label htmlFor={id} className="mb-1 block text-sm font-medium">{bi(f.label)}</label>
                  {f.kind === "area" ? (
                    <div className="flex gap-2">
                      <input id={id} inputMode="decimal" className={inputCls} value={v} onChange={(e) => onChange(doc.type, f.key, e.target.value)} />
                      <select
                        aria-label={`${bi(f.label)} unit`}
                        className="min-h-11 rounded-md border border-ink/25 bg-white px-2"
                        value={(state.docs[doc.type][`${f.key}__unit`] as AreaUnit) || "decimal"}
                        onChange={(e) => onChange(doc.type, `${f.key}__unit`, e.target.value)}
                      >
                        {(Object.keys(UNIT_LABEL) as AreaUnit[]).map((u) => (
                          <option key={u} value={u}>{UNIT_LABEL[u][lang]}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <input
                      id={id}
                      type={f.kind === "date" ? "date" : "text"}
                      className={inputCls}
                      value={v}
                      onChange={(e) => onChange(doc.type, f.key, e.target.value)}
                    />
                  )}
                  {f.hint && <p className="mt-1 text-xs text-ink-soft">{bi(f.hint)}</p>}
                  {(() => {
                    const m = state.ai?.[doc.type]?.[f.key];
                    if (!m) return null;
                    const cls = m.verified === true ? "text-mouza" : "text-amber";
                    return (
                      <p className={`mt-1 text-xs ${cls}`}>
                        {m.verified === true ? t("ai.mark.ok") : m.verified === false ? t("ai.mark.bad") : t("ai.mark.img")}
                        {m.evidence ? <span className="block text-ink-soft">{t("ai.quote")}: “{m.evidence}”</span> : null}
                      </p>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
