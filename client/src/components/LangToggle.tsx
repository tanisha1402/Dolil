import { Languages } from "lucide-react";
import { useLang } from "../lib/i18n";

export default function LangToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "bn" : "en")}
      className="no-print inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/20 px-4 text-sm font-medium hover:bg-paper-deep"
    >
      <Languages className="h-4 w-4" aria-hidden />
      {t("lang.switch")}
    </button>
  );
}
