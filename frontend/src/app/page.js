"use client";

import Header from "../components/Header";
import Converter from "../components/Converter";
import History from "../components/History";
import { useState } from "react";

export default function Home() {
  const [refreshHistory, setRefreshHistory] = useState(0);

  return (
    <main className="min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Converter onConversionComplete={() => setRefreshHistory((n) => n + 1)} />
        <History key={refreshHistory} />
      </div>
    </main>
  );
}
