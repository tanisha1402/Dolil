import { Check } from "lucide-react";
import { useLang } from "../lib/i18n";

export default function StepRail({ step, onGo }: { step: number; onGo: (n: number) => void }) {
  const { t } = useLang();
  return (
    <nav aria-label="Progress" className="no-print">
      <ol className="flex gap-2 overflow-x-auto pb-1">
        {[1, 2, 3, 4].map((n) => {
          const active = n === step;
          const done = n < step;
          return (
            <li key={n} className="flex-1">
              <button
                type="button"
                onClick={() => onGo(n)}
                aria-current={active ? "step" : undefined}
                className={`flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border px-3 text-sm font-medium ${
                  active ? "border-mouza bg-mouza text-white" : "border-ink/15 bg-white/60 hover:bg-paper-deep"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${active ? "bg-white/20" : "bg-ink/10"}`}>
                  {done ? <Check className="h-3 w-3" aria-hidden /> : n}
                </span>
                {t(`step.${n}`)}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
