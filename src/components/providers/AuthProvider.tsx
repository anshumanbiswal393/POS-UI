import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Permission, type Role } from "@/types/rbac";
import { type AppUser, type TenantEntitlements } from "@/types/auth";
import type { FeatureFlags, FeatureKey } from "@/types/entitlements";
import { DEFAULT_PLATFORM_APPS } from "@/types/entitlements";
import { hasPermission, ROLE_LABEL } from "@/lib/auth/rbac";
import { authApi, mapBackendUserToAppUser } from "@/services/auth-api";
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  syncAuthSession,
  clearAuthSession,
  parseSsoFromUrl,
  LS_USER,
  LS_USERS,
  LS_ENTITLEMENTS,
  LS_AUDIT_EVENTS,
} from "@/utils/cookieAuth";

export interface AuthCtx {
  user: AppUser | null;
  users: AppUser[];
  auditEvents: AuthAuditEvent[];
  entitlements: TenantEntitlements;
  featureEnabled: (feature: FeatureKey) => boolean;
  effectiveFeatures: FeatureFlags;
  setTenantFeature: (feature: FeatureKey, enabled: boolean) => void;
  setPropertyFeatures: (property: string, features: Partial<FeatureFlags>) => void;
  setEntitlementPlan: (plan: TenantEntitlements["plan"]) => void;
  isAuthenticated: boolean;
  loading: boolean;
  login: (userId: string) => void;
  loginWithPassword: (emailOrUsername: string, password: string) => Promise<AppUser>;
  loginWithTokens: (tokens: any, user: any, properties: any, permissions: any) => AppUser;
  logout: () => void;
  redirectToPmsLogin: () => void;
  can: (perm: Permission | string) => boolean;
  switchRole: (role: Role) => void;
  inviteUser: (u: Omit<AppUser, "id" | "initials" | "active" | "lastActive">) => void;
  updateUser: (id: string, patch: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
  roleLabel: (r: Role | string | undefined) => string;
  logAuditEvent: (action: string, target?: string, detail?: string) => void;
}

export const Ctx = createContext<AuthCtx | null>(null);

export interface AuthAuditEvent {
  id: string;
  ts: string;
  actor: string;
  actorRole: string;
  action: string;
  target?: string;
  detail?: string;
}

const SEED_USERS: AppUser[] = [];

const DEFAULT_ENTITLEMENTS: TenantEntitlements = {
  tenantId: "retrod-pos-tenant",
  plan: "growth",
  features: {
    channelManager: true,
    websiteBuilder: true,
    bookingEngine: true,
    revenueAi: true,
    masterData: true,
  },
  platformApps: { ...DEFAULT_PLATFORM_APPS },
  propertyOverrides: [
    {
      property: "Retrod Bistro & Cafe · Connaught Place",
      features: {
        channelManager: true,
        websiteBuilder: true,
        bookingEngine: true,
        revenueAi: true,
        masterData: true,
      },
    },
  ],
};

function loadCachedUsers(): AppUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_USERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppUser[];
    return Array.isArray(parsed)
      ? parsed.filter((u) => !["u0", "u1", "u2"].includes(u.id))
      : [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(loadCachedUsers);
  useEffect(() => {
    if (user) {
      setUsers((prev) => {
        const clean = prev.filter((u) => !["u0", "u1", "u2"].includes(u.id));
        if (!clean.some((u) => u.id === user.id)) {
          return [user, ...clean];
        }
        return clean.map((u) => (u.id === user.id ? user : u));
      });
    }
  }, [user]);

  const [user, setUser] = useState<AppUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(LS_USER);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [auditEvents, setAuditEvents] = useState<AuthAuditEvent[]>([]);
  const [entitlements, setEntitlements] = useState<TenantEntitlements>(DEFAULT_ENTITLEMENTS);
  const [hydrated, setHydrated] = useState<boolean>(false);

  const redirectToPmsLogin = () => {
    if (typeof window === "undefined") return;
    const isRetrodDomain = window.location.hostname.endsWith("retrod.in");
    if (isRetrodDomain) {
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `https://app.dev.retrod.in/login?returnUrl=${returnUrl}`;
    } else {
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    const u = loadCachedUsers();
    const e = loadEntitlements();
    const a = loadAuditEvents();
    setUsers(u);
    setEntitlements(e);
    setAuditEvents(a);

    async function initSession() {
      // 1. Process any SSO redirect tokens in URL (?sso_token=...&sso_refresh=...)
      parseSsoFromUrl();

      // 2. Read access token from storage / cookie
      const token = getStoredAccessToken();
      if (token) {
        try {
          const data = await authApi.getCurrentUser();
          if (data && data.user) {
            const mappedUser = mapBackendUserToAppUser(data.user, data.properties, data.permissions);
            setUser(mappedUser);
            syncAuthSession(
              { access: token, refresh: getStoredRefreshToken() },
              mappedUser,
              mappedUser.tenant_subdomain,
            );
          } else if (!data) {
            // Server explicitly invalidated session
            setUser(null);
            authApi.clearTokens();
          }
        } catch (err: any) {
          console.warn("POS session verification background notice:", err?.message || err);
          // If offline or network glitch, retain existing cached user
        }
      } else {
        // No token present
        const isRetrod = window.location.hostname.endsWith("retrod.in");
        const isLoginPage = window.location.pathname === "/login";
        if (isRetrod && !isLoginPage) {
          // Unauthenticated on live POS: redirect to PMS login
          redirectToPmsLogin();
          return;
        }
      }
      setHydrated(true);
      setLoading(false);
    }

    initSession();

    // Listen for session expiration events from HTTP client
    const handleAuthExpired = () => {
      console.warn("POS auth session expired. Redirecting to login...");
      authApi.clearTokens();
      setUser(null);
      redirectToPmsLogin();
    };

    window.addEventListener("pos-auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("pos-auth-expired", handleAuthExpired);
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      if (user) {
        localStorage.setItem(LS_USER, JSON.stringify(user));
        if (user.tenant_subdomain) {
          localStorage.setItem("retrod:active-subdomain", user.tenant_subdomain);
        }
      } else {
        localStorage.removeItem(LS_USER);
      }
    }
  }, [user, hydrated]);

  const addAuditEvent = (
    action: string,
    target?: string,
    detail?: string,
    actorOverride?: { name: string; role: Role | "system" },
  ) => {
    const actor = actorOverride?.name ?? user?.name ?? "System";
    const actorRole =
      actorOverride?.role === "system"
        ? "System"
        : actorOverride?.role
          ? (ROLE_LABEL[actorOverride.role] || String(actorOverride.role))
          : user
            ? (ROLE_LABEL[user.role as Role] || String(user.role))
            : "System";
    setAuditEvents((prev) => [
      {
        id: `ae-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ts: formatAuditTimestamp(new Date()),
        actor,
        actorRole,
        action,
        target,
        detail,
      },
      ...prev,
    ]);
  };

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      users,
      loading,
      auditEvents,
      entitlements,
      effectiveFeatures: resolveEffectiveFeatures(entitlements, user?.property),
      featureEnabled: (feature) => resolveEffectiveFeatures(entitlements, user?.property)[feature],
      setTenantFeature: (feature, enabled) => {
        setEntitlements((prev) => {
          if (prev.features[feature] === enabled) return prev;
          addAuditEvent(
            "Tenant feature updated",
            feature,
            `${feature} set to ${enabled ? "enabled" : "disabled"} at tenant level.`,
          );
          return { ...prev, features: { ...prev.features, [feature]: enabled } };
        });
      },
      setPropertyFeatures: (property, features) => {
        setEntitlements((prev) => {
          const current = prev.propertyOverrides?.find((p) => p.property === property);
          const nextOverrides = (prev.propertyOverrides ?? []).filter((p) => p.property !== property);
          nextOverrides.push({
            property,
            features: { ...(current?.features ?? {}), ...features },
          });
          return { ...prev, propertyOverrides: nextOverrides };
        });
      },
      setEntitlementPlan: (plan) => {
        setEntitlements((prev) => ({ ...prev, plan }));
      },
      isAuthenticated: !!user,
      login: (userId: string) => {
        const found = users.find((u) => u.id === userId);
        if (found) {
          setUser(found);
          addAuditEvent("User logged in", found.email, `Session started for ${found.name}.`, {
            name: found.name,
            role: found.role as Role,
          });
        }
      },
      loginWithPassword: async (emailOrUsername: string, password: string) => {
        const data = await authApi.login(emailOrUsername, password);
        const mappedUser = mapBackendUserToAppUser(data.user, data.properties, data.permissions);
        setUser(mappedUser);
        addAuditEvent("User logged in (Password)", mappedUser.email, `Session started for ${mappedUser.name}.`, {
          name: mappedUser.name,
          role: mappedUser.role as Role,
        });
        return mappedUser;
      },
      loginWithTokens: (tokens: any, userVal: any, propsVal: any, permsVal: any) => {
        authApi.saveTokens(tokens.access, tokens.refresh);
        const mappedUser = mapBackendUserToAppUser(userVal, propsVal, permsVal);
        setUser(mappedUser);
        return mappedUser;
      },
      logout: () => {
        if (user) {
          addAuditEvent("User logged out", user.email, `Session ended for ${user.name}.`);
        }
        authApi.logout();
        setUser(null);
        redirectToPmsLogin();
      },
      redirectToPmsLogin,
      can: (perm: Permission | string) => {
        if (!user) return false;

        // 1. Super Admin and Owner have master access
        const roleStr = String(user.role || "").toLowerCase();
        if (
          roleStr === "super_admin" ||
          roleStr === "owner" ||
          roleStr === "tenant_owner" ||
          user.is_superuser ||
          user.permissions?.includes("*:*") ||
          user.permissions?.includes("*")
        ) {
          return true;
        }

        // 2. Pure dynamic database permission evaluation from backend
        if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
          const raw = String(perm).toLowerCase();
          const dotVersion = raw.replace(/:/g, ".");
          const colonVersion = raw.replace(/\./g, ":");

          const granted = user.permissions.some((p) => {
            const pLower = String(p).toLowerCase();
            const pDot = pLower.replace(/:/g, ".");
            const pColon = pLower.replace(/\./g, ":");
            return (
              pLower === raw ||
              pDot === dotVersion ||
              pColon === colonVersion ||
              pLower === "*:*" ||
              pLower === "*" ||
              (pLower.startsWith("pos") && (raw.startsWith("pos") || dotVersion.startsWith("pos")))
            );
          });
          if (granted) return true;
        }

        // 3. Fallback to static role defaults
        return hasPermission(user.role as Role, perm as Permission);
      },
      switchRole: (role) => {
        if (!user) return;
        const previousRole = user.role;
        const next = { ...user, role };
        setUser(next);
        addAuditEvent(
          "Role switched",
          user.email,
          `Role changed from ${ROLE_LABEL[previousRole as Role] || previousRole} to ${ROLE_LABEL[role] || role}.`,
        );
      },
      inviteUser: (u) => {
        const id = `u${Date.now()}`;
        const initials = u.name
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        const invited: AppUser = { ...u, id, initials, active: true, lastActive: "Invited" };
        setUsers((prev) => [...prev, invited]);
      },
      updateUser: (id, patch) => {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
        if (user?.id === id) setUser((u) => (u ? { ...u, ...patch } : u));
      },
      deleteUser: (id) => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        if (user?.id === id) setUser(null);
      },
      roleLabel: (r) => (r && ROLE_LABEL[r as Role]) || String(r ?? "Staff").replace(/_/g, " "),
      logAuditEvent: (action, target, detail) => addAuditEvent(action, target, detail),
    }),
    [auditEvents, entitlements, user, users, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function loadEntitlements(): TenantEntitlements {
  if (typeof window === "undefined") return DEFAULT_ENTITLEMENTS;
  try {
    const raw = localStorage.getItem(LS_ENTITLEMENTS);
    if (!raw) return DEFAULT_ENTITLEMENTS;
    const parsed = JSON.parse(raw) as Partial<TenantEntitlements>;
    return {
      ...DEFAULT_ENTITLEMENTS,
      ...parsed,
      features: { ...DEFAULT_ENTITLEMENTS.features, ...(parsed.features ?? {}) },
      platformApps: { ...DEFAULT_PLATFORM_APPS, ...(parsed.platformApps ?? {}) },
      propertyOverrides: parsed.propertyOverrides ?? DEFAULT_ENTITLEMENTS.propertyOverrides,
    };
  } catch {
    return DEFAULT_ENTITLEMENTS;
  }
}

function loadAuditEvents(): AuthAuditEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_AUDIT_EVENTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AuthAuditEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function resolveEffectiveFeatures(
  entitlements: TenantEntitlements,
  property?: string,
): FeatureFlags {
  const base = { ...entitlements.features };
  if (!property) return base;
  const override = entitlements.propertyOverrides?.find((p) => p.property === property);
  if (!override) return base;
  return { ...base, ...override.features };
}

function formatAuditTimestamp(date: Date) {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
