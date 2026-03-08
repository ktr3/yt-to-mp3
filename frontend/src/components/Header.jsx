"use client";

import { useLang } from "./LangContext";
import LangSwitcher from "./LangSwitcher";
import ThemeToggle from "./ThemeToggle";
import { t } from "../i18n";

export default function Header() {
  const { lang } = useLang();

  return (
    <header style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/logo.png" alt="YT to MP3" className="w-9 h-9 sm:w-12 sm:h-12 object-contain" />
          <div>
            <h1 className="text-base sm:text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              <span style={{ color: "var(--accent)" }}>YT</span>{" "}
              <span>to</span>{" "}
              <span style={{ color: "var(--green)" }}>MP3</span>
            </h1>
            <p className="text-[10px] sm:text-xs" style={{ color: "var(--text-secondary)" }}>
              {t(lang, "subtitle")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
            <img src="/flag-ec.png" alt="Ecuador" title="Ecuador" className="w-6 h-4 rounded-sm object-cover" />
            <img src="/flag-es.png" alt="Espa&#241;a" title="Espa&#241;a" className="w-6 h-4 rounded-sm object-cover" />
            <img src="/flag-eu.svg" alt="Euskal Herria" title="Euskal Herria" className="w-6 h-4 rounded-sm object-cover" />
          </div>
          <LangSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
