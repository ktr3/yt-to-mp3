"use client";

import { useLang } from "./LangContext";
import LangSwitcher from "./LangSwitcher";
import { t } from "../i18n";

export default function Header() {
  const { lang } = useLang();

  return (
    <header className="border-b border-white/10 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/logo.png" alt="YT to MP3" className="w-9 h-9 sm:w-12 sm:h-12 object-contain" />
          <div>
            <h1 className="text-base sm:text-xl font-bold tracking-tight">
              <span className="text-red-500">YT</span>{" "}
              <span className="text-white">to</span>{" "}
              <span className="text-green-500">MP3</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-400">{t(lang, "subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400">
            {t(lang, "badge")}
          </span>
          <LangSwitcher />
        </div>
      </div>
    </header>
  );
}
