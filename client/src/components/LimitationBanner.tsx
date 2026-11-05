import { ShieldAlert } from "lucide-react";
import { useLang } from "../lib/i18n";

export default function LimitationBanner() {
  const { t } = useLang();
  return (
    <div className="flex gap-3 rounded-lg border border-amber/50 bg-amber/10 p-4 text-sm">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber" aria-hidden />
      <div>
        <p className="font-semibold">{t("limits.title")}</p>
        <p className="mt-1 text-ink-soft">{t("limits.body")}</p>
      </div>
    </div>
  );
}
