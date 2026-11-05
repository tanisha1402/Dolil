import { ArrowRight, FlaskConical } from "lucide-react";
import LimitationBanner from "../components/LimitationBanner";
import { useLang } from "../lib/i18n";

export default function Landing({ onStart, onSample, onResume }: { onStart: () => void; onSample: () => void; onResume: (() => void) | null }) {
  const { t } = useLang();
  const btn = "inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 font-semibold";
  return (
    <div className="space-y-10">
      <section className="pt-4">
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">{t("app.tagline")}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">{t("landing.sub")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onStart} className={`${btn} bg-mouza text-white hover:bg-mouza/90`}>
            {t("cta.start")} <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={onSample} className={`${btn} border border-ink/25 bg-white/70 hover:bg-paper-deep`}>
            <FlaskConical className="h-4 w-4" aria-hidden /> {t("cta.sample")}
          </button>
          {onResume && (
            <button type="button" onClick={onResume} className={`${btn} border border-ink/25 hover:bg-paper-deep`}>{t("cta.resume")}</button>
          )}
        </div>
        <p className="mt-3 text-xs text-ink-soft">{t("preview.note")}</p>
      </section>
      <section>
        <h2 className="font-display text-2xl font-bold">{t("landing.how")}</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className="flex gap-3 rounded-lg border border-ink/15 bg-white/70 p-4">
              <span className="font-display text-2xl font-bold text-mouza">{n}</span>
              <span>{t(`how.${n}`)}</span>
            </li>
          ))}
        </ol>
      </section>
      <LimitationBanner />
    </div>
  );
}
