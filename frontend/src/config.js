function getApiUrl() {
  // 1. Build-time env var (set during docker build)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. Runtime detection from browser
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Production: derive API URL from frontend domain
    if (host !== "localhost" && host !== "127.0.0.1") {
      return `https://api-${host}/api`;
    }
  }

  // 3. Local development fallback
  return "http://localhost:3001/api";
}

export const API = getApiUrl();
