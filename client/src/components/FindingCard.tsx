import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import { evidenceLabel } from "../lib/checks";
import { useLang } from "../lib/i18n";
import type { Finding, Severity } from "../lib/types";

const STYLE: Record<Severity, { box: string; stamp: string; Icon: typeof Info }> = {
  high: { box: "border-stamp/40", stamp: "border-stamp text-stamp", Icon: CircleAlert },
  medium: { box: "border-amber/50", stamp: "border-amber text-amber", Icon: TriangleAlert },
  low: { box: "border-ink/20", stamp: "border-ink-soft text-ink-soft", Icon: Info },
  info: { box: "border-ink/15", stamp: "border-ink-soft text-ink-soft", Icon: Info },
};

export default function FindingCard({ f }: { f: Finding }) {
  const { t, bi } = useLang();
  const s = STYLE[f.severity];
  return (
    <article className={`print-card rounded-lg border bg-white/70 p-5 ${s.box}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-display text-lg font-bold">{bi(f.title)}</h3>
        <span className={`stamp inline-flex items-center gap-1 rounded border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${s.stamp}`}>
          <s.Icon className="h-3.5 w-3.5" aria-hidden />
          {t(`sev.${f.severity}`)}
        </span>
      </div>
      <p className="mt-2 text-ink-soft">{bi(f.explanation)}</p>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("evidence")}</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {f.evidence.map((e, i) => (
            <li key={i} className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm">
              <span className="block text-xs text-ink-soft">{bi(evidenceLabel(e))}</span>
              <span className="font-semibold">{e.value}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 rounded-md bg-mouza/10 px-3 py-2 text-sm">
        <span className="font-semibold text-mouza">{t("question")}: </span>
        {bi(f.question)}
      </p>
    </article>
  );
}
