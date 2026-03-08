"use client";

import { useState, useRef, useCallback } from "react";
import Turnstile from "./Turnstile";
import { useLang } from "./LangContext";
import { t } from "../i18n";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const FORMATS = [
  { value: "mp3", label: "MP3" },
  { value: "wav", label: "WAV" },
];

const QUALITIES = [
  { value: "128", label: "128 kbps" },
  { value: "192", label: "192 kbps" },
  { value: "256", label: "256 kbps" },
  { value: "320", label: "320 kbps" },
];

function formatDuration(seconds) {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Converter({ onConversionComplete }) {
  const { lang } = useLang();
  const [mode, setMode] = useState("single");
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp3");
  const [quality, setQuality] = useState("192");

  const [videoInfo, setVideoInfo] = useState(null);
  const [conversion, setConversion] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const pollingRef = useRef(null);

  const [turnstileToken, setTurnstileToken] = useState("");

  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [playlistUnavailable, setPlaylistUnavailable] = useState([]);
  const [playlistConversions, setPlaylistConversions] = useState([]);
  const [playlistStatus, setPlaylistStatus] = useState("idle");
  const playlistPollingRef = useRef(null);

  const reset = () => {
    setVideoInfo(null);
    setConversion(null);
    setStatus("idle");
    setError("");
    setPlaylistVideos([]);
    setPlaylistUnavailable([]);
    setPlaylistConversions([]);
    setPlaylistStatus("idle");
    setTurnstileToken("");
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (playlistPollingRef.current) clearInterval(playlistPollingRef.current);
  };

  const fetchInfo = async () => {
    reset();
    setStatus("loading");
    try {
      const res = await fetch(`${API}/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVideoInfo(data);
      setStatus("info");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  };

  const startConversion = async () => {
    setStatus("converting");
    setError("");
    try {
      const res = await fetch(`${API}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format, quality, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConversion(data);
      pollStatus(data.id);
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  };

  const pollStatus = useCallback(
    (id) => {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${API}/status/${id}`);
          const data = await res.json();
          if (data.status === "completed") {
            clearInterval(pollingRef.current);
            setConversion(data);
            setStatus("done");
            onConversionComplete?.();
          } else if (data.status === "failed") {
            clearInterval(pollingRef.current);
            setError(data.error_message || "Conversion failed");
            setStatus("error");
          }
        } catch {}
      }, 2000);
    },
    [onConversionComplete]
  );

  const fetchPlaylistInfo = async () => {
    reset();
    setPlaylistStatus("loading");
    try {
      const res = await fetch(`${API}/playlist-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlaylistVideos(data.videos);
      setPlaylistUnavailable(data.unavailable || []);
      setPlaylistStatus("info");
    } catch (err) {
      setError(err.message);
      setPlaylistStatus("error");
    }
  };

  const startPlaylistConversion = async () => {
    setPlaylistStatus("converting");
    setError("");
    try {
      const videoUrls = playlistVideos.map((v) => v.url || v.id);
      const res = await fetch(`${API}/convert-playlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format, quality, videoUrls, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlaylistConversions(data.conversions.map((c) => ({ ...c, status: "pending" })));
      pollPlaylistStatus(data.conversions.map((c) => c.id));
    } catch (err) {
      setError(err.message);
      setPlaylistStatus("error");
    }
  };

  const pollPlaylistStatus = useCallback(
    (ids) => {
      playlistPollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${API}/status-batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
          });
          const data = await res.json();
          if (!Array.isArray(data)) return;
          setPlaylistConversions(data);
          const allDone = data.every((c) => c.status === "completed" || c.status === "failed");
          if (allDone) {
            clearInterval(playlistPollingRef.current);
            setPlaylistStatus("done");
            onConversionComplete?.();
          }
        } catch {}
      }, 3000);
    },
    [onConversionComplete]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    if (mode === "single") fetchInfo();
    else fetchPlaylistInfo();
  };

  const completedPlaylist = playlistConversions.filter((c) => c.status === "completed");
  const failedPlaylist = playlistConversions.filter((c) => c.status === "failed");

  return (
    <div className="rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      {/* Mode Tabs */}
      <div className="flex gap-2 mb-4 sm:mb-6">
        <button
          onClick={() => { setMode("single"); reset(); }}
          className="flex-1 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2"
          style={{
            background: mode === "single" ? "var(--accent)" : "var(--bg-tertiary)",
            color: mode === "single" ? "#fff" : "var(--text-secondary)",
          }}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t(lang, "singleVideo")}
        </button>
        <button
          onClick={() => { setMode("playlist"); reset(); }}
          className="flex-1 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2"
          style={{
            background: mode === "playlist" ? "var(--green)" : "var(--bg-tertiary)",
            color: mode === "playlist" ? "#fff" : "var(--text-secondary)",
          }}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          {t(lang, "playlist")}
        </button>
      </div>

      {/* URL Input */}
      <form onSubmit={handleSubmit} className="mb-4 sm:mb-6">
        <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          {mode === "single" ? t(lang, "pasteVideoUrl") : t(lang, "pastePlaylistUrl")}
        </label>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "converting" || playlistStatus === "loading" || playlistStatus === "converting"}
            className="px-6 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: mode === "single" ? "var(--accent)" : "var(--green)" }}
          >
            {(status === "loading" || playlistStatus === "loading") ? t(lang, "loading") : t(lang, "getInfo")}
          </button>
        </div>
      </form>

      {/* Error */}
      {(status === "error" || playlistStatus === "error") && error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl text-xs sm:text-sm" style={{ background: "rgba(252,60,68,0.1)", border: "1px solid rgba(252,60,68,0.2)", color: "#fc3c44" }}>
          {error}
        </div>
      )}

      {/* SINGLE VIDEO MODE */}
      {mode === "single" && (
        <>
          {videoInfo && status !== "idle" && (
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl" style={{ background: "var(--bg-tertiary)" }}>
              {videoInfo.thumbnail && (
                <img src={videoInfo.thumbnail} alt={videoInfo.title} className="w-full sm:w-40 h-auto sm:h-24 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base line-clamp-2 sm:truncate" style={{ color: "var(--text-primary)" }}>{videoInfo.title}</h3>
                <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  {videoInfo.uploader} &bull; {formatDuration(videoInfo.duration)}
                </p>
              </div>
            </div>
          )}

          {(status === "info" || status === "converting" || status === "done") && (
            <FormatQualitySelector
              lang={lang} format={format} setFormat={setFormat}
              quality={quality} setQuality={setQuality} disabled={status !== "info"}
            />
          )}

          {status === "info" && (
            <>
              <Turnstile onToken={setTurnstileToken} />
              <button
                onClick={startConversion}
                disabled={!turnstileToken}
                className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-base sm:text-lg text-white transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--accent)" }}
              >
                {t(lang, "download")} {format.toUpperCase()}
              </button>
            </>
          )}

          {status === "converting" && <ConvertingSpinner lang={lang} />}
          {status === "done" && conversion && (
            <DownloadButton lang={lang} id={conversion.id} format={format} fileSize={conversion.file_size} onReset={() => { reset(); setUrl(""); }} />
          )}
        </>
      )}

      {/* PLAYLIST MODE */}
      {mode === "playlist" && (
        <>
          {playlistStatus === "info" && playlistVideos.length > 0 && (
            <>
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl" style={{ background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.2)" }}>
                <p className="font-semibold text-sm sm:text-base" style={{ color: "var(--green)" }}>
                  {playlistVideos.length} {t(lang, "videosFound")}
                </p>
              </div>

              {playlistUnavailable.length > 0 && (
                <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl" style={{ background: "rgba(255,204,0,0.1)", border: "1px solid rgba(255,204,0,0.2)", color: "#ffcc00" }}>
                  <p className="text-xs sm:text-sm font-medium">
                    {playlistUnavailable.length} {t(lang, "videosSkipped")}
                  </p>
                </div>
              )}

              <div className="mb-4 sm:mb-6 max-h-52 sm:max-h-64 overflow-y-auto space-y-2 pr-1 sm:pr-2">
                {playlistVideos.map((v, i) => (
                  <div key={v.id || i} className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
                    <span className="text-xs w-5 sm:w-6 text-right flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>{i + 1}</span>
                    {v.thumbnail && (
                      <img src={v.thumbnail} alt="" className="w-12 h-8 sm:w-16 sm:h-10 object-cover rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm truncate" style={{ color: "var(--text-primary)" }}>{v.title || `Video ${v.id}`}</p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDuration(v.duration)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <FormatQualitySelector
                lang={lang} format={format} setFormat={setFormat}
                quality={quality} setQuality={setQuality} disabled={false}
              />

              <Turnstile onToken={setTurnstileToken} />
              <button
                onClick={startPlaylistConversion}
                disabled={!turnstileToken}
                className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-lg text-white transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--green)" }}
              >
                {t(lang, "downloadAll")} {playlistVideos.length} {t(lang, "videosAs")} {format.toUpperCase()}
              </button>
            </>
          )}

          {playlistStatus === "loading" && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 sm:gap-3" style={{ color: "var(--green)" }}>
                <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-base sm:text-lg font-medium">{t(lang, "fetchingPlaylist")}</span>
              </div>
            </div>
          )}

          {playlistStatus === "converting" && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 sm:gap-3 mb-4" style={{ color: "var(--green)" }}>
                <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-base sm:text-lg font-medium">
                  {t(lang, "convertingProgress")} {completedPlaylist.length}/{playlistConversions.length}
                </span>
              </div>
              <div className="w-full rounded-full h-2" style={{ background: "var(--bg-tertiary)" }}>
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ background: "var(--green)", width: `${(completedPlaylist.length / playlistConversions.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {playlistStatus === "done" && (
            <div className="space-y-3">
              <div className="p-3 sm:p-4 rounded-xl text-center" style={{ background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.2)" }}>
                <p className="font-semibold text-base sm:text-lg" style={{ color: "var(--green)" }}>
                  {completedPlaylist.length} {t(lang, "ofConverted")} {playlistConversions.length} {t(lang, "converted")}
                </p>
                {failedPlaylist.length > 0 && (
                  <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--accent)" }}>{failedPlaylist.length} {t(lang, "failed")}</p>
                )}
              </div>
              <div className="max-h-52 sm:max-h-64 overflow-y-auto space-y-2 pr-1 sm:pr-2">
                {playlistConversions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm truncate" style={{ color: "var(--text-primary)" }}>{c.video_title || t(lang, "processing")}</p>
                      <p className="text-xs" style={{ color: c.status === "completed" ? "var(--green)" : "var(--accent)" }}>
                        {c.status}
                      </p>
                    </div>
                    {c.status === "completed" && (
                      <a
                        href={`${API}/download/${c.id}`}
                        className="px-3 sm:px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors flex-shrink-0"
                        style={{ background: "var(--green)" }}
                      >
                        {t(lang, "download")}
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => { reset(); setUrl(""); }}
                className="block mx-auto mt-4 text-xs sm:text-sm transition-colors hover:opacity-80"
                style={{ color: "var(--text-secondary)" }}
              >
                {t(lang, "convertAnotherPlaylist")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FormatQualitySelector({ lang, format, setFormat, quality, setQuality, disabled }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div>
        <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: "var(--text-secondary)" }}>{t(lang, "format")}</label>
        <div className="flex gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFormat(f.value)}
              disabled={disabled}
              className="flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              style={{
                background: format === f.value ? "var(--accent)" : "var(--bg-tertiary)",
                color: format === f.value ? "#fff" : "var(--text-secondary)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: "var(--text-secondary)" }}>{t(lang, "quality")}</label>
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          disabled={disabled}
          className="w-full py-2 px-2 sm:px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        >
          {QUALITIES.map((q) => (
            <option key={q.value} value={q.value}>{q.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ConvertingSpinner({ lang }) {
  return (
    <div className="text-center py-4">
      <div className="inline-flex items-center gap-2 sm:gap-3" style={{ color: "var(--accent)" }}>
        <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-base sm:text-lg font-medium">{t(lang, "converting")}</span>
      </div>
      <p className="text-xs sm:text-sm mt-2" style={{ color: "var(--text-secondary)" }}>{t(lang, "convertingWait")}</p>
    </div>
  );
}

function DownloadButton({ lang, id, format, fileSize, onReset }) {
  return (
    <div className="text-center">
      <a
        href={`${API}/download/${id}`}
        className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-base sm:text-lg text-white transition-colors"
        style={{ background: "var(--green)" }}
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {t(lang, "download")} {format.toUpperCase()}
        {fileSize && (
          <span className="text-xs sm:text-sm opacity-75">({(fileSize / 1024 / 1024).toFixed(1)} MB)</span>
        )}
      </a>
      <button onClick={onReset} className="block mx-auto mt-4 text-xs sm:text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
        {t(lang, "convertAnother")}
      </button>
    </div>
  );
}
