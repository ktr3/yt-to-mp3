"use client";

import Header from "../components/Header";
import Converter from "../components/Converter";
import History from "../components/History";
import { LangProvider } from "../components/LangContext";
import { useState } from "react";

export default function Home() {
  const [refreshHistory, setRefreshHistory] = useState(0);

  return (
    <LangProvider>
      <main className="min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <Converter onConversionComplete={() => setRefreshHistory((n) => n + 1)} />
          <History key={refreshHistory} />
        </div>
        <footer className="flex flex-col items-center gap-2 py-6 sm:py-8">
          <div className="flex items-center gap-2">
            <img src="/flag-ec.png" alt="Ecuador" title="Ecuador" className="w-7 h-5 rounded-sm object-cover" />
            <img src="/flag-es.png" alt="Espa&#241;a" title="Espa&#241;a" className="w-7 h-5 rounded-sm object-cover" />
            <img src="/flag-eu.svg" alt="Euskal Herria" title="Euskal Herria" className="w-7 h-5 rounded-sm object-cover" />
          </div>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            by <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>Ktr3</span>
          </p>
        </footer>
      </main>
    </LangProvider>
  );
}
