/**
 * Resolves API base URL with automatic fallback for deployed domains.
 * - On production/staging (*.retrod.in or server IP), connects directly to Django backend on :8443
 * - In local dev (localhost/127.0.0.1), uses VITE_API_BASE_URL or defaults to http://127.0.0.1:8000
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("retrod.in") || host === "144.31.146.64") {
      return "https://app.dev.retrod.in:8443";
    }
  }
  const envUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
  if (envUrl && envUrl !== "/api/") {
    return envUrl.replace(/\/+$/, "");
  }
  return "http://127.0.0.1:8000";
}

export const BASEURL = getApiBaseUrl();
