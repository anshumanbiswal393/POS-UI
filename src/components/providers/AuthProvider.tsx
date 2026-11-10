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
  getDomainCookie,
  COOKIE_USER,
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
  login: (userIdOrUser: string | AppUser) => void;
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

export const SAMPRITA_ADMIN_USER: AppUser = {
  id: "usr-admin-samprita",
  name: "Samprita Patra",
  email: "sampritapatra123@gmail.com",
  role: "pos_admin",
  phone: "9937884878",
  active: true,
  lastActive: "Now",
  initials: "SP",
  property: "Anshu Suite Restaurant · Main Outlet",
  permissions: ["*:*"],
};

export const KITCHEN_USER: AppUser = {
  id: "usr-kitchen-01",
  name: "Kitchen Chef Station",
  email: "samkhusi123@gmail.com",
  role: "pos_kitchen",
  phone: "9937884878",
  active: true,
  lastActive: "Now",
  initials: "KC",
  property: "Anshu Suite Restaurant · Main Kitchen",
  permissions: [
    "pos.kot.view",
    "pos.kot.status",
    "pos.orders.kot",
    "pos.orders.view",
    "pos.inventory.view",
    "pos.inventory.manage",
    "pos.inventory.wastage",
    "pos.inventory.production",
    "pos.inventory.purchase_orders",
  ],
};

export const ARNAV_STAFF_USER: AppUser = {
  id: "usr-staff-arnav",
  name: "Arnav",
  email: "arnav@retrod.in",
  role: "pos_staff",
  phone: "9876543210",
  active: true,
  lastActive: "Now",
  initials: "AR",
  property: "Anshu Suite Restaurant · Main Outlet",
  permissions: [
    "pos.billing.view",
    "pos.billing.create",
    "pos.orders.view",
    "pos.orders.take",
  ],
};

export const WAITER_USER: AppUser = {
  id: "usr-waiter-01",
  name: "Raju waiter",
  email: "samprita2022@gift.edu.in",
  role: "pos_waiter",
  role_name: "Waiter",
  phone: "9937884878",
  active: true,
  lastActive: "Now",
  initials: "RW",
  property: "Anshu Suite Restaurant · Main Outlet",
  permissions: [
    "pos.billing.view",
    "pos.billing.create",
    "pos.orders.view",
    "pos.orders.take",
    "pos.orders.kot",
    "pos.kot.view",
  ],
};

const SEED_USERS: AppUser[] = [SAMPRITA_ADMIN_USER, KITCHEN_USER, ARNAV_STAFF_USER, WAITER_USER];

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
  let list: AppUser[] = [SAMPRITA_ADMIN_USER, KITCHEN_USER, ARNAV_STAFF_USER, WAITER_USER];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LS_USERS);
      if (raw) {
        const parsed = JSON.parse(raw) as AppUser[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed.filter((u) => !["u0", "u1", "u2", "usr-admin-01"].includes(u.id) && u.email !== "aarav@retrod.in");
        }
      }

      // Also hydrate staff created in POS User Management
      const rawPos = localStorage.getItem("retrod:pos:users:list");
      if (rawPos) {
        const posUsers = JSON.parse(rawPos);
        if (Array.isArray(posUsers)) {
          for (const pu of posUsers) {
            if (!list.some((u) => u.id === pu.id || (pu.email && u.email?.toLowerCase() === pu.email.toLowerCase()))) {
              list.push({
                id: pu.id,
                name: pu.name,
                email: pu.email || `${pu.username || "user"}@retrod.in`,
                role: (pu.role === "admin" ? "pos_admin" : pu.role === "kitchen" ? "pos_kitchen" : pu.role === "waiter" ? "pos_waiter" : pu.role || "pos_staff") as any,
                phone: pu.phone || "",
                active: pu.is_active ?? true,
                lastActive: "Now",
                initials: pu.initials || pu.name?.slice(0, 2).toUpperCase() || "US",
                property: pu.outlet_name || "Anshu Suite Restaurant · Main Outlet",
                permissions: pu.permissions || [],
              });
            }
          }
        }
      }

      // Always guarantee the 4 core users exist
      if (!list.some((u) => u.id === KITCHEN_USER.id || u.email.toLowerCase() === KITCHEN_USER.email.toLowerCase())) {
        list.push(KITCHEN_USER);
      }
      if (!list.some((u) => u.id === ARNAV_STAFF_USER.id || u.email.toLowerCase() === ARNAV_STAFF_USER.email.toLowerCase())) {
        list.push(ARNAV_STAFF_USER);
      }
      if (!list.some((u) => u.id === WAITER_USER.id || u.email.toLowerCase() === WAITER_USER.email.toLowerCase())) {
        list.push(WAITER_USER);
      }
      if (!list.some((u) => u.id === SAMPRITA_ADMIN_USER.id || u.email.toLowerCase() === SAMPRITA_ADMIN_USER.email.toLowerCase())) {
        list.unshift(SAMPRITA_ADMIN_USER);
      }
    } catch {
      // ignore
    }
  }
  return list;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(LS_USER);
      if (raw) return JSON.parse(raw);
    } catch {}
    const cUser = getDomainCookie(COOKIE_USER);
    if (cUser) {
      try {
        return JSON.parse(cUser);
      } catch {}
    }
    return null;
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    const cached = loadCachedUsers();
    return cached;
  });

  useEffect(() => {
    if (user) {
      setUsers((prev) => {
        const clean = prev.filter((u) => !["u0", "u1", "u2", "usr-admin-01"].includes(u.id) && u.email !== "aarav@retrod.in");
        if (!clean.some((u) => u.id === user.id)) {
          return [user, ...clean];
        }
        return clean.map((u) => (u.id === user.id ? user : u));
      });
    }
  }, [user]);
  const [loading, setLoading] = useState<boolean>(true);
  const [auditEvents, setAuditEvents] = useState<AuthAuditEvent[]>([]);
  const [entitlements, setEntitlements] = useState<TenantEntitlements>(DEFAULT_ENTITLEMENTS);
  const [hydrated, setHydrated] = useState<boolean>(false);

  const redirectToPmsLogin = () => {
    if (typeof window === "undefined") return;
    if (window.location.pathname !== "/login") {
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
      login: (userIdOrUser: string | AppUser) => {
        let found: AppUser | undefined;
        if (typeof userIdOrUser === "string") {
          const q = userIdOrUser.trim().toLowerCase();
          found = users.find(
            (u) =>
              u.id === userIdOrUser ||
              u.email?.toLowerCase() === q ||
              (u.phone && u.phone === userIdOrUser)
          );

          if (!found && typeof window !== "undefined") {
            try {
              const rawPosUsers = localStorage.getItem("retrod:pos:users:list");
              if (rawPosUsers) {
                const list = JSON.parse(rawPosUsers);
                if (Array.isArray(list)) {
                  const match = list.find(
                    (u: any) =>
                      u.id === userIdOrUser ||
                      u.email?.toLowerCase() === q ||
                      (u.phone && u.phone === userIdOrUser)
                  );
                  if (match) {
                    found = {
                      id: match.id,
                      name: match.name,
                      email: match.email || `${match.username || "user"}@retrod.in`,
                      role: (match.role === "admin" ? "pos_admin" : match.role === "kitchen" ? "pos_kitchen" : match.role === "waiter" ? "pos_waiter" : match.role || "pos_staff") as any,
                      phone: match.phone || "",
                      active: match.is_active ?? true,
                      lastActive: "Now",
                      initials: match.initials || match.name?.slice(0, 2).toUpperCase() || "US",
                      property: match.outlet_name || "Anshu Suite Restaurant · Main Outlet",
                      permissions: match.permissions || [],
                    };
                  }
                }
              }
            } catch {}
          }
        } else {
          found = userIdOrUser;
        }

        if (found) {
          setUser(found);
          if (typeof window !== "undefined") {
            localStorage.setItem(LS_USER, JSON.stringify(found));
            localStorage.setItem("retrod:access-token", "pos-session-" + found.id);
          }
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

        // 1. Super Admin, Owner, and POS Admin have master access
        const roleStr = String(user.role || "").toLowerCase();
        if (
          roleStr === "super_admin" ||
          roleStr === "owner" ||
          roleStr === "tenant_owner" ||
          roleStr === "general_manager" ||
          roleStr === "pos_admin" ||
          roleStr === "admin" ||
          user.is_superuser ||
          user.permissions?.includes("*:*") ||
          user.permissions?.includes("*")
        ) {
          return true;
        }

        // 1. Check dynamic RBAC configured by Admin in User Roles & Permissions
        if (typeof window !== "undefined") {
          try {
            const rawRolePerms = localStorage.getItem("retrod:pos:role_permissions:list");
            if (rawRolePerms) {
              const list = JSON.parse(rawRolePerms) as Array<{
                role: string;
                permission?: string;
                permission_code?: string;
              }>;
              if (Array.isArray(list)) {
                const roleMatches = (r: string) => {
                  if (r === roleStr) return true;
                  if (roleStr === "pos_kitchen" && (r === "role-pos-chef" || r === "pos_chef")) return true;
                  if (roleStr === "pos_staff" && r === "role-arnav") return true;
                  if (roleStr === "pos_admin" && r === "role-pos-admin") return true;
                  if (
                    (roleStr === "pos_waiter" || roleStr === "waiter" || roleStr.includes("waiter")) &&
                    (r === "role-pos-waiter" || r === "pos_waiter" || r.toLowerCase().includes("waiter"))
                  ) {
                    return true;
                  }
                  return false;
                };

                const roleEntries = list.filter((rp) => roleMatches(rp.role));
                if (roleEntries.length > 0) {
                  const rawPerm = String(perm).toLowerCase();
                  const dotPerm = rawPerm.replace(/:/g, ".");
                  const colonPerm = rawPerm.replace(/\./g, ":");

                  return roleEntries.some((rp) => {
                    const c = (rp.permission_code || "").toLowerCase();
                    const p = (rp.permission || "").toLowerCase();
                    return (
                      c === rawPerm ||
                      c === dotPerm ||
                      c === colonPerm ||
                      p === rawPerm ||
                      p.endsWith(rawPerm.replace("pos.", "")) ||
                      (c.endsWith(".*") && dotPerm.startsWith(c.slice(0, -1)))
                    );
                  });
                }
              }
            }
          } catch {
            // fallback
          }
        }

        // Waiter staff default fallback (if RBAC storage not yet seeded)
        const isWaiter = roleStr === "pos_waiter" || roleStr === "waiter" || roleStr.includes("waiter");
        if (isWaiter) {
          const raw = String(perm).toLowerCase();
          if (
            raw.startsWith("pos.billing.view") ||
            raw.startsWith("pos:billing:view") ||
            raw.startsWith("pos.billing.create") ||
            raw.startsWith("pos:billing:create") ||
            raw.startsWith("pos.orders") ||
            raw.startsWith("pos:orders") ||
            raw.startsWith("pos.kot.view") ||
            raw.startsWith("pos:kot:view") ||
            raw.startsWith("pos.menu.view") ||
            raw.startsWith("pos:menu:view")
          ) {
            if (raw.includes("settle") || raw.includes("discount") || raw.includes("void")) {
              return false;
            }
            return true;
          }
        }

        // Kitchen staff default fallback (if RBAC storage not yet seeded)
        const isKitchen = roleStr === "pos_kitchen" || roleStr.includes("kitchen");
        if (isKitchen) {
          const raw = String(perm).toLowerCase();
          if (
            raw.startsWith("pos.kot") ||
            raw.startsWith("pos:kot") ||
            raw.startsWith("pos.inventory") ||
            raw.startsWith("pos:inventory") ||
            raw.startsWith("pos.recipes") ||
            raw.startsWith("pos:recipes")
          ) {
            return true;
          }
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
              pLower === "pos:*" || pLower === "pos.*" || (pDot.endsWith(".*") && dotVersion.startsWith(pDot.slice(0, -1)))
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
