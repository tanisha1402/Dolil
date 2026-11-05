import type { ReactNode } from "react";
import { FileSearch } from "lucide-react";
import LangToggle from "../components/LangToggle";
import StickerBadge from "../components/StickerBadge";
import { useLang } from "../lib/i18n";

export default function AppLayout({ children, onHome }: { children: ReactNode; onHome: () => void }) {
  const { t } = useLang();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print sticky top-0 z-10 border-b border-ink/10 bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <button type="button" onClick={onHome} className="flex min-h-11 items-center gap-2" aria-label="Dolil home">
            <FileSearch className="h-6 w-6 text-mouza" aria-hidden />
            <span className="font-display text-2xl font-bold">Dolil</span>
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <StickerBadge />
            <LangToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      <footer className="no-print border-t border-ink/10 px-4 py-4 text-center text-xs text-ink-soft">
        <p>{t("footer")}</p>
        <p className="mx-auto mt-1 max-w-2xl">{t("privacy.note")}</p>
      </footer>
    </div>
  );
}
