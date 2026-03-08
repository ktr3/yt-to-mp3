"use client";

import { useLang } from "./LangContext";
import { LANGUAGES, BASQUE_FLAG_SVG } from "../i18n";

export default function LangSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center gap-1">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          title={l.label}
          className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium transition-all ${
            lang === l.code
              ? "bg-white/15 text-white ring-1 ring-white/30"
              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
          }`}
        >
          {l.code === "eu" ? (
            <img src={BASQUE_FLAG_SVG} alt="Euskadi" className="w-4 h-3 sm:w-5 sm:h-3.5 rounded-sm" />
          ) : (
            <span className="text-sm sm:text-base leading-none">{l.flag}</span>
          )}
          <span className="hidden sm:inline">{l.label}</span>
        </button>
      ))}
    </div>
  );
}
