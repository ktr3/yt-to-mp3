"use client";

import { useState, useRef, useEffect } from "react";
import { useLang } from "./LangContext";
import { LANGUAGES, BASQUE_FLAG_SVG } from "../i18n";

export default function LangSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const renderFlag = (l) =>
    l.code === "eu" ? (
      <img src={BASQUE_FLAG_SVG} alt="Euskadi" className="w-5 h-3.5 rounded-sm" />
    ) : (
      <span className="text-base leading-none">{l.flag}</span>
    );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{
          background: "var(--bg-tertiary)",
          color: "var(--text-primary)",
        }}
      >
        {renderFlag(current)}
        <span>{current.label}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-xl shadow-xl overflow-hidden z-50 min-w-[140px]"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium transition-colors hover:opacity-80"
              style={{
                background: lang === l.code ? "var(--accent-glow)" : "transparent",
                color: lang === l.code ? "var(--accent)" : "var(--text-primary)",
              }}
            >
              {renderFlag(l)}
              <span>{l.fullName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
