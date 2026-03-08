"use client";

import { useLang } from "./LangContext";
import LangSwitcher from "./LangSwitcher";
import ThemeToggle from "./ThemeToggle";
import { t, BASQUE_FLAG_SVG } from "../i18n";

export default function Header() {
  const { lang } = useLang();

  return (
    <header style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent)" }}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
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
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: "var(--bg-tertiary)" }}>
            <span className="text-sm" title="Ecuador">{"\u{1F1EA}\u{1F1E8}"}</span>
            <span className="text-sm" title="Espa\u00f1a">{"\u{1F1EA}\u{1F1F8}"}</span>
            <img src={BASQUE_FLAG_SVG} alt="Euskadi" title="Euskal Herria" className="w-4 h-3 rounded-sm" />
          </div>
          <LangSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
