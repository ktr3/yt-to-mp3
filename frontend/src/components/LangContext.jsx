"use client";

import { createContext, useContext, useState, useEffect } from "react";

const LangContext = createContext({
  lang: "es",
  setLang: () => {},
  theme: "dark",
  setTheme: () => {},
});

export function LangProvider({ children }) {
  const [lang, setLangState] = useState("es");
  const [theme, setThemeState] = useState("dark");

  useEffect(() => {
    const savedLang = localStorage.getItem("yt2mp3_lang");
    if (savedLang && ["es", "en", "eu"].includes(savedLang)) {
      setLangState(savedLang);
    }
    const savedTheme = localStorage.getItem("yt2mp3_theme");
    if (savedTheme && ["dark", "light"].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem("yt2mp3_lang", code);
  };

  const setTheme = (t) => {
    setThemeState(t);
    localStorage.setItem("yt2mp3_theme", t);
  };

  return (
    <LangContext.Provider value={{ lang, setLang, theme, setTheme }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
