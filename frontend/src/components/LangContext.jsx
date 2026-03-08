"use client";

import { createContext, useContext, useState, useEffect } from "react";

const LangContext = createContext({ lang: "en", setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    const saved = localStorage.getItem("yt2mp3_lang");
    if (saved && ["es", "en", "eu"].includes(saved)) {
      setLangState(saved);
    }
  }, []);

  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem("yt2mp3_lang", code);
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
