"use client";

import { useState, useEffect } from "react";
import { useLang } from "./LangContext";
import { t } from "../i18n";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function formatDuration(seconds) {
  if (!seconds) return "--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function timeAgo(dateStr, lang) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t(lang, "justNow");
  if (minutes < 60) return `${minutes}${t(lang, "mAgo")}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${t(lang, "hAgo")}`;
  return `${Math.floor(hours / 24)}${t(lang, "dAgo")}`;
}

const STATUS_STYLES = {
  pending: { bg: "rgba(255,204,0,0.1)", color: "#ffcc00" },
  processing: { bg: "rgba(0,122,255,0.1)", color: "#007aff" },
  completed: { bg: "rgba(52,199,89,0.1)", color: "#34c759" },
  failed: { bg: "rgba(252,60,68,0.1)", color: "#fc3c44" },
};

export default function History() {
  const { lang } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/history`)
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8" style={{ color: "var(--text-tertiary)" }}>
        {t(lang, "loadingHistory")}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: "var(--text-tertiary)" }}>
        <p className="text-base sm:text-lg">{t(lang, "noConversions")}</p>
        <p className="text-xs sm:text-sm mt-1">{t(lang, "historyHint")}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: "var(--text-primary)" }}>
        {t(lang, "recentConversions")}
      </h2>
      <div className="space-y-2 sm:space-y-3">
        {items.map((item) => {
          const st = STATUS_STYLES[item.status] || {};
          return (
            <div
              key={item.id}
              className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              {item.video_thumbnail && (
                <img src={item.video_thumbnail} alt="" className="w-14 h-9 sm:w-20 sm:h-12 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {item.video_title || "Untitled"}
                </p>
                <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {item.format?.toUpperCase()} &bull; {item.quality} kbps &bull;{" "}
                  <span className="hidden sm:inline">{formatDuration(item.video_duration)} &bull; </span>
                  {timeAgo(item.created_at, lang)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <span
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium"
                  style={{ background: st.bg, color: st.color }}
                >
                  {item.status}
                </span>
                {item.status === "completed" && (
                  <a
                    href={`${API}/download/${item.id}`}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium text-white transition-colors"
                    style={{ background: "var(--green)" }}
                  >
                    {t(lang, "download")}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
