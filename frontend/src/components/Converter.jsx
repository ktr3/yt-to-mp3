"use client";

import { useState, useRef, useCallback } from "react";
import Turnstile from "./Turnstile";

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
  const [mode, setMode] = useState("single"); // single | playlist
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp3");
  const [quality, setQuality] = useState("192");

  // Single video state
  const [videoInfo, setVideoInfo] = useState(null);
  const [conversion, setConversion] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const pollingRef = useRef(null);

  // Turnstile token
  const [turnstileToken, setTurnstileToken] = useState("");

  // Playlist state
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [playlistConversions, setPlaylistConversions] = useState([]);
  const [playlistStatus, setPlaylistStatus] = useState("idle");
  const playlistPollingRef = useRef(null);

  const reset = () => {
    setVideoInfo(null);
    setConversion(null);
    setStatus("idle");
    setError("");
    setPlaylistVideos([]);
    setPlaylistConversions([]);
    setPlaylistStatus("idle");
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (playlistPollingRef.current) clearInterval(playlistPollingRef.current);
  };

  // ─── SINGLE VIDEO ────────────────────────────────────────

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

  // ─── PLAYLIST ────────────────────────────────────────────

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
  const pendingPlaylist = playlistConversions.filter(
    (c) => c.status === "pending" || c.status === "processing"
  );

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8">
      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setMode("single"); reset(); }}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            mode === "single"
              ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Single Video
        </button>
        <button
          onClick={() => { setMode("playlist"); reset(); }}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            mode === "playlist"
              ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Playlist
        </button>
      </div>

      {/* URL Input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {mode === "single" ? "Paste YouTube Video URL" : "Paste YouTube Playlist URL"}
        </label>
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={
              mode === "single"
                ? "https://www.youtube.com/watch?v=..."
                : "https://www.youtube.com/playlist?list=... or video URL with &list="
            }
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={
              status === "loading" || status === "converting" ||
              playlistStatus === "loading" || playlistStatus === "converting"
            }
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              mode === "single"
                ? "bg-red-600 hover:bg-red-700 disabled:opacity-50"
                : "bg-green-600 hover:bg-green-700 disabled:opacity-50"
            } disabled:cursor-not-allowed`}
          >
            {(status === "loading" || playlistStatus === "loading") ? "Loading..." : "Get Info"}
          </button>
        </div>
      </form>

      {/* Error */}
      {(status === "error" || playlistStatus === "error") && error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* ────── SINGLE VIDEO MODE ────── */}
      {mode === "single" && (
        <>
          {videoInfo && status !== "idle" && (
            <div className="mb-6 flex gap-4 p-4 bg-white/5 rounded-xl">
              {videoInfo.thumbnail && (
                <img src={videoInfo.thumbnail} alt={videoInfo.title} className="w-40 h-24 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-white truncate">{videoInfo.title}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {videoInfo.uploader} &bull; {formatDuration(videoInfo.duration)}
                </p>
              </div>
            </div>
          )}

          {(status === "info" || status === "converting" || status === "done") && (
            <FormatQualitySelector
              format={format} setFormat={setFormat}
              quality={quality} setQuality={setQuality}
              disabled={status !== "info"}
            />
          )}

          {status === "info" && (
            <>
              <Turnstile onToken={setTurnstileToken} />
              <button
                onClick={startConversion}
                disabled={!turnstileToken}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold text-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download {format.toUpperCase()}
              </button>
            </>
          )}

          {status === "converting" && <ConvertingSpinner />}

          {status === "done" && conversion && (
            <DownloadButton id={conversion.id} format={format} fileSize={conversion.file_size} onReset={() => { reset(); setUrl(""); }} />
          )}
        </>
      )}

      {/* ────── PLAYLIST MODE ────── */}
      {mode === "playlist" && (
        <>
          {playlistStatus === "info" && playlistVideos.length > 0 && (
            <>
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-green-300 font-semibold">
                  {playlistVideos.length} videos found in playlist
                </p>
              </div>

              <div className="mb-6 max-h-64 overflow-y-auto space-y-2 pr-2">
                {playlistVideos.map((v, i) => (
                  <div key={v.id || i} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                    <span className="text-xs text-gray-500 w-6 text-right">{i + 1}</span>
                    {v.thumbnail && (
                      <img src={v.thumbnail} alt="" className="w-16 h-10 object-cover rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{v.title || `Video ${v.id}`}</p>
                      <p className="text-xs text-gray-500">{formatDuration(v.duration)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <FormatQualitySelector
                format={format} setFormat={setFormat}
                quality={quality} setQuality={setQuality}
                disabled={false}
              />

              <Turnstile onToken={setTurnstileToken} />
              <button
                onClick={startPlaylistConversion}
                disabled={!turnstileToken}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-semibold text-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download All ({playlistVideos.length} videos) as {format.toUpperCase()}
              </button>
            </>
          )}

          {playlistStatus === "loading" && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-3 text-green-400">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-lg font-medium">Fetching playlist...</span>
              </div>
            </div>
          )}

          {playlistStatus === "converting" && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-3 text-green-400 mb-4">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-lg font-medium">
                  Converting... {completedPlaylist.length}/{playlistConversions.length}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(completedPlaylist.length / playlistConversions.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {playlistStatus === "done" && (
            <div className="space-y-3">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                <p className="text-green-300 font-semibold text-lg">
                  {completedPlaylist.length} of {playlistConversions.length} converted
                </p>
                {failedPlaylist.length > 0 && (
                  <p className="text-red-400 text-sm mt-1">{failedPlaylist.length} failed</p>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                {playlistConversions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{c.video_title || "Processing..."}</p>
                      <p className={`text-xs ${c.status === "completed" ? "text-green-400" : "text-red-400"}`}>
                        {c.status}
                      </p>
                    </div>
                    {c.status === "completed" && (
                      <a
                        href={`${API}/download/${c.id}`}
                        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => { reset(); setUrl(""); }}
                className="block mx-auto mt-4 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Convert another playlist
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FormatQualitySelector({ format, setFormat, quality, setQuality, disabled }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
        <div className="flex gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFormat(f.value)}
              disabled={disabled}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                format === f.value
                  ? "bg-red-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Quality</label>
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          disabled={disabled}
          className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {QUALITIES.map((q) => (
            <option key={q.value} value={q.value} className="bg-gray-900">{q.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ConvertingSpinner() {
  return (
    <div className="text-center py-4">
      <div className="inline-flex items-center gap-3 text-red-400">
        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-lg font-medium">Converting...</span>
      </div>
      <p className="text-sm text-gray-400 mt-2">This may take a moment</p>
    </div>
  );
}

function DownloadButton({ id, format, fileSize, onReset }) {
  return (
    <div className="text-center">
      <a
        href={`${API}/download/${id}`}
        className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold text-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download {format.toUpperCase()}
        {fileSize && (
          <span className="text-sm opacity-75">({(fileSize / 1024 / 1024).toFixed(1)} MB)</span>
        )}
      </a>
      <button onClick={onReset} className="block mx-auto mt-4 text-sm text-gray-400 hover:text-white transition-colors">
        Convert another video
      </button>
    </div>
  );
}
