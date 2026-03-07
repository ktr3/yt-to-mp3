"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function formatDuration(seconds) {
  if (!seconds) return "--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const STATUS_STYLES = {
  pending: "bg-yellow-500/10 text-yellow-400",
  processing: "bg-blue-500/10 text-blue-400",
  completed: "bg-green-500/10 text-green-400",
  failed: "bg-red-500/10 text-red-400",
};

export default function History() {
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
      <div className="text-center text-gray-500 py-8">
        Loading history...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p className="text-lg">No conversions yet</p>
        <p className="text-sm mt-1">Your conversion history will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-gray-200">
        Recent Conversions
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-xl"
          >
            {item.video_thumbnail && (
              <img
                src={item.video_thumbnail}
                alt=""
                className="w-20 h-12 object-cover rounded-lg flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {item.video_title || "Untitled"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {item.format?.toUpperCase()} &bull; {item.quality} kbps &bull;{" "}
                {formatDuration(item.video_duration)} &bull;{" "}
                {timeAgo(item.created_at)}
              </p>
            </div>
            <span
              className={`px-2 py-1 rounded-md text-xs font-medium ${
                STATUS_STYLES[item.status] || ""
              }`}
            >
              {item.status}
            </span>
            {item.status === "completed" && (
              <a
                href={`${API}/download/${item.id}`}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium transition-colors"
              >
                Download
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
