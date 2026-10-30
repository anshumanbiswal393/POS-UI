/**
 * Unified cross-subdomain authentication utilities for Retrod PMS & POS.
 * Enables seamless Single Sign-On (SSO) across *.retrod.in (e.g. app.dev.retrod.in and pos.dev.retrod.in)
 * and local development across ports.
 */

export const COOKIE_ACCESS_TOKEN = "retrod_access_token";
export const COOKIE_REFRESH_TOKEN = "retrod_refresh_token";
export const COOKIE_USER = "retrod_auth_user";
export const COOKIE_SUBDOMAIN = "retrod_subdomain";
export const COOKIE_PROPERTY_ID = "retrod_property_id";

export const LS_ACCESS_TOKEN = "retrod.auth.access_token";
export const LS_REFRESH_TOKEN = "retrod.auth.refresh_token";
export const LS_USER = "retrod.auth.user";
export const LS_USERS = "retrod.auth.users";
export const LS_ENTITLEMENTS = "retrod.auth.entitlements";
export const LS_AUDIT_EVENTS = "retrod.auth.audit-events";
export const LS_SUBDOMAIN = "retrod:active-subdomain";
export const LS_PROPERTY_ID = "retrod:active-property-id";

/**
 * Resolves the cookie domain to share across subdomains.
 * For app.dev.retrod.in and pos.dev.retrod.in, returns '.retrod.in'.
 */
export function getRootCookieDomain(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  if (host.endsWith("retrod.in")) {
    return ".retrod.in";
  }
  // For localhost or IP addresses, leave empty to set host-scoped cookie
  return "";
}

/**
 * Sets a cookie across all subdomains under .retrod.in or on the local host.
 */
export function setDomainCookie(name: string, value: string, days = 30): void {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  const domain = getRootCookieDomain();
  const domainPart = domain ? `; Domain=${domain}` : "";
  const securePart = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires.toUTCString()}; Path=/; SameSite=Lax${domainPart}${securePart}`;

  // Also set host-only for extra resiliency
  if (domainPart) {
    document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires.toUTCString()}; Path=/; SameSite=Lax${securePart}`;
  }
}

/**
 * Reads a cookie by name.
 */
export function getDomainCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Removes a cookie across root domain and host.
 */
export function removeDomainCookie(name: string): void {
  if (typeof document === "undefined") return;
  const domain = getRootCookieDomain();
  const domainPart = domain ? `; Domain=${domain}` : "";

  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/${domainPart}`;
  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/`;
}

/**
 * Retrieves the active access token, checking localStorage first then shared cookies.
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const ls = localStorage.getItem(LS_ACCESS_TOKEN);
    if (ls) return ls;
  } catch {}
  return getDomainCookie(COOKIE_ACCESS_TOKEN);
}

/**
 * Retrieves the active refresh token, checking localStorage first then shared cookies.
 */
export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const ls = localStorage.getItem(LS_REFRESH_TOKEN);
    if (ls) return ls;
  } catch {}
  return getDomainCookie(COOKIE_REFRESH_TOKEN);
}

/**
 * Retrieves the active tenant subdomain.
 */
export function getStoredSubdomain(): string {
  if (typeof window === "undefined") return "grandpalace";
  try {
    const ls = localStorage.getItem(LS_SUBDOMAIN);
    if (ls) return ls;
  } catch {}
  const cookieSub = getDomainCookie(COOKIE_SUBDOMAIN);
  if (cookieSub) return cookieSub;

  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  if (parts.length >= 2 && parts[0] !== "localhost" && parts[0] !== "127" && parts[0] !== "www" && parts[0] !== "app" && parts[0] !== "pos") {
    return parts[0];
  }

  const urlParams = new URLSearchParams(window.location.search);
  const param = urlParams.get("subdomain") || urlParams.get("tenant");
  if (param) return param;

  return "grandpalace";
}

/**
 * Synchronizes auth session tokens, user data, and tenant context across both localStorage and shared domain cookies.
 */
export function syncAuthSession(
  tokens: { access: string; refresh?: string | null },
  user?: any,
  subdomain?: string,
  propertyId?: string,
): void {
  if (typeof window === "undefined") return;

  // 1. Save to LocalStorage
  try {
    if (tokens.access) localStorage.setItem(LS_ACCESS_TOKEN, tokens.access);
    if (tokens.refresh) localStorage.setItem(LS_REFRESH_TOKEN, tokens.refresh);
    if (user) localStorage.setItem(LS_USER, JSON.stringify(user));
    if (subdomain) localStorage.setItem(LS_SUBDOMAIN, subdomain);
    if (propertyId) localStorage.setItem(LS_PROPERTY_ID, propertyId);
  } catch (e) {
    console.warn("Could not save auth session to localStorage:", e);
  }

  // 2. Save to shared Domain Cookies
  if (tokens.access) setDomainCookie(COOKIE_ACCESS_TOKEN, tokens.access);
  if (tokens.refresh) setDomainCookie(COOKIE_REFRESH_TOKEN, tokens.refresh);
  if (user) {
    try {
      const basicUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        role_name: user.role_name,
        tenant_subdomain: user.tenant_subdomain,
      };
      setDomainCookie(COOKIE_USER, JSON.stringify(basicUser));
    } catch {}
  }
  if (subdomain) setDomainCookie(COOKIE_SUBDOMAIN, subdomain);
  if (propertyId) setDomainCookie(COOKIE_PROPERTY_ID, propertyId);
}

/**
 * Clears all auth session data from localStorage and shared domain cookies.
 */
export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LS_ACCESS_TOKEN);
    localStorage.removeItem(LS_REFRESH_TOKEN);
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_SUBDOMAIN);
    localStorage.removeItem(LS_PROPERTY_ID);
  } catch {}

  removeDomainCookie(COOKIE_ACCESS_TOKEN);
  removeDomainCookie(COOKIE_REFRESH_TOKEN);
  removeDomainCookie(COOKIE_USER);
  removeDomainCookie(COOKIE_SUBDOMAIN);
  removeDomainCookie(COOKIE_PROPERTY_ID);
}

/**
 * Checks for SSO tokens in URL query params (e.g. from redirect),
 * stores them if found, and cleans up the browser address bar.
 */
export function parseSsoFromUrl(): {
  token: string | null;
  refresh: string | null;
  tenant: string | null;
  propertyId: string | null;
} {
  if (typeof window === "undefined") {
    return { token: null, refresh: null, tenant: null, propertyId: null };
  }

  const url = new URL(window.location.href);
  const token = url.searchParams.get("sso_token") || url.searchParams.get("token");
  const refresh = url.searchParams.get("sso_refresh") || url.searchParams.get("refresh");
  const tenant = url.searchParams.get("sso_tenant") || url.searchParams.get("tenant");
  const propertyId = url.searchParams.get("sso_property_id") || url.searchParams.get("property_id");

  if (token) {
    syncAuthSession({ access: token, refresh }, undefined, tenant || undefined, propertyId || undefined);

    // Clean URL query parameters without reloading
    url.searchParams.delete("sso_token");
    url.searchParams.delete("token");
    url.searchParams.delete("sso_refresh");
    url.searchParams.delete("refresh");
    url.searchParams.delete("sso_tenant");
    url.searchParams.delete("sso_property_id");

    const cleanUrl = url.pathname + (url.search ? url.search : "") + url.hash;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  return { token, refresh, tenant, propertyId };
}
