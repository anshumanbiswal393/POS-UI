import { getApiBaseUrl } from "@/config/variables";
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredSubdomain,
  syncAuthSession,
  clearAuthSession,
} from "@/utils/cookieAuth";
import type { AppUser } from "@/types/auth";
import type { Role } from "@/types/rbac";

export function mapBackendUserToAppUser(
  backendUser: any,
  backendProperties: any[] = [],
  backendPermissions: string[] = [],
): AppUser {
  const userName = backendUser?.name || backendUser?.username || "Staff User";
  const userEmail = backendUser?.email || "";
  const userPhone = backendUser?.phone || "";

  // 1. Resolve role from backendUser payload or property role
  let role: Role | string =
    backendUser?.role ||
    backendUser?.role_code ||
    (backendProperties && backendProperties.length > 0 ? backendProperties[0].role : "pos_waiter");

  if (backendUser && (backendUser.role === "super_admin" || backendUser.is_superuser)) {
    role = "super_admin";
  }

  // 2. Resolve display role name
  let roleName: string | undefined =
    backendUser?.role_name ||
    (backendProperties && backendProperties.length > 0 ? backendProperties[0].role_name : undefined);

  if (!roleName) {
    const roleClean = String(role).toLowerCase();
    if (roleClean.includes("waiter")) roleName = "Waiter";
    else if (roleClean.includes("kitchen") || roleClean.includes("chef")) roleName = "Kitchen Chef / KDS";
    else if (roleClean.includes("admin")) roleName = "POS Administrator";
    else if (roleClean.includes("cashier")) roleName = "Cashier";
    else if (roleClean.includes("manager")) roleName = "Store Manager";
    else roleName = String(role);
  }

  // 3. Initials
  const initials = (userName || "User")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  // 4. Mapped properties
  const mappedProperties = (backendProperties || []).map((p: any) => ({
    id: String(p.id),
    name: String(p.name),
    role: String(p.role || ""),
    role_name: String(p.role_name || ""),
  }));

  const assignedOutletId =
    backendUser?.assigned_outlet_id ||
    backendUser?.outlet_id ||
    undefined;

  const assignedOutletName =
    backendUser?.assigned_outlet_name ||
    backendUser?.outlet_name ||
    undefined;

  let propertyName =
    assignedOutletName ||
    (mappedProperties[0]?.name ? `${mappedProperties[0].name} Restaurant` : undefined) ||
    backendUser?.property ||
    "Anshu Suite Restaurant · Main Outlet";

  if (mappedProperties.length > 0) {
    let storedPropId =
      typeof window !== "undefined"
        ? localStorage.getItem("retrod:active-property-id") ||
          localStorage.getItem("retrod_property_id")
        : null;

    const anshuProp = mappedProperties.find((p) => p.name.toLowerCase().includes("anshu"));
    if (anshuProp && (!storedPropId || !mappedProperties.some((p) => p.id === storedPropId))) {
      storedPropId = anshuProp.id;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("retrod:active-property-id", storedPropId);
          localStorage.setItem("retrod_property_id", storedPropId);
        } catch {}
      }
    } else if (!storedPropId && mappedProperties[0]?.id) {
      storedPropId = mappedProperties[0].id;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("retrod:active-property-id", storedPropId);
          localStorage.setItem("retrod_property_id", storedPropId);
        } catch {}
      }
    }

    const matched = storedPropId
      ? mappedProperties.find((p) => p.id === storedPropId)
      : null;
    propertyName = matched ? matched.name : propertyName;
  } else if (role === "super_admin") {
    propertyName = "Retrod Global HQ";
  }

  const avatar =
    backendUser?.avatar_url ||
    backendUser?.avatarUrl ||
    backendUser?.avatar ||
    backendUser?.profile_picture ||
    backendUser?.profile_photo ||
    undefined;

  // 5. Dynamic Permissions
  const permissionsSet = new Set<string>(backendPermissions || []);
  const roleLower = String(role).toLowerCase();
  const isWaiter =
    roleLower === "pos_waiter" ||
    roleLower === "waiter" ||
    roleLower.includes("waiter") ||
    String(roleName).toLowerCase().includes("waiter") ||
    String(roleName).toLowerCase().includes("steward");

  if (isWaiter) {
    const waiterBasePerms = [
      "pos.billing.view",
      "pos.billing.create",
      "pos.orders.view",
      "pos.orders.take",
      "pos.orders.create",
      "pos.orders.kot",
      "pos.reservations.manage",
      "pos.reservations.view",
      "pos.menu.view",
      "pos.tables.view",
    ];
    for (const p of waiterBasePerms) permissionsSet.add(p);
  } else if (roleLower === "pos_admin" || roleLower === "admin" || backendUser?.is_superuser) {
    permissionsSet.add("*:*");
  }

  return {
    id: String(backendUser?.id || "u0"),
    name: userName,
    email: userEmail,
    role: role as Role,
    role_name: roleName,
    initials,
    active: backendUser?.is_active !== false,
    property: propertyName,
    lastActive: "Just now",
    phone: userPhone,
    properties: mappedProperties,
    permissions: Array.from(permissionsSet),
    avatarUrl: avatar,
    tenant_subdomain: backendUser?.tenant_subdomain,
    is_superuser: Boolean(backendUser?.is_superuser),
    subscription_plan: backendUser?.subscription_plan,
    subscription_expiry: backendUser?.subscription_expiry,
    license_key: backendUser?.license_key,
    assigned_outlet_id: assignedOutletId,
    assigned_outlet_name: assignedOutletName,
    outlet_id: assignedOutletId,
    outlet_name: assignedOutletName,
  };
}

export class AuthApiClient {
  private getBaseUrl(): string {
    return getApiBaseUrl();
  }

  private getHeaders(authRequired = false): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Tenant-Subdomain": getStoredSubdomain(),
    };

    if (authRequired) {
      const token = getStoredAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      let errMsg = "An error occurred";
      try {
        const errorData = await res.json();
        errMsg = errorData.error || errorData.detail || errorData.message || JSON.stringify(errorData);
      } catch {
        errMsg = await res.text();
      }
      throw new Error(errMsg);
    }
    return res.json() as Promise<T>;
  }

  async login(emailOrUsername: string, password: string): Promise<any> {
    const res = await fetch(`${this.getBaseUrl()}/api/auth/login/`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ email_or_username: emailOrUsername, password }),
    });
    const data = await this.handleResponse<any>(res);
    if (data?.tokens?.access) {
      syncAuthSession(
        { access: data.tokens.access, refresh: data.tokens.refresh },
        data.user,
        data.user?.tenant_subdomain,
      );
    }
    return data;
  }

  async requestOtp(contact: string): Promise<any> {
    const payload: Record<string, string> = {};
    if (contact.includes("@")) {
      payload["email"] = contact;
    } else {
      payload["phone"] = contact;
    }

    const res = await fetch(`${this.getBaseUrl()}/api/auth/request-otp/`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async verifyOtp(contact: string, otpCode: string): Promise<any> {
    const payload: Record<string, string> = { otp_code: otpCode };
    if (contact.includes("@")) {
      payload["email"] = contact;
    } else {
      payload["phone"] = contact;
    }

    const res = await fetch(`${this.getBaseUrl()}/api/auth/verify-otp/`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await this.handleResponse<any>(res);
    if (data?.tokens?.access) {
      syncAuthSession(
        { access: data.tokens.access, refresh: data.tokens.refresh },
        data.user,
        data.user?.tenant_subdomain,
      );
    }
    return data;
  }

  async refreshToken(): Promise<string | null> {
    const refresh = getStoredRefreshToken();
    if (!refresh) return null;

    try {
      const res = await fetch(`${this.getBaseUrl()}/api/auth/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Subdomain": getStoredSubdomain(),
        },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) {
        this.clearTokens();
        return null;
      }
      const data = await res.json();
      if (data.access) {
        syncAuthSession({ access: data.access, refresh: data.refresh || refresh });
        return data.access;
      }
      return null;
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    const refresh = getStoredRefreshToken();
    const headers = this.getHeaders(true);
    this.clearTokens();
    if (refresh) {
      try {
        await fetch(`${this.getBaseUrl()}/api/auth/logout/`, {
          method: "POST",
          headers,
          body: JSON.stringify({ refresh }),
        });
      } catch (err) {
        console.error("POS logout request error:", err);
      }
    }
  }

  async getCurrentUser(): Promise<any> {
    const token = getStoredAccessToken();
    if (!token) return null;

    let res = await fetch(`${this.getBaseUrl()}/api/auth/me/`, {
      method: "GET",
      headers: this.getHeaders(true),
    });

    if (res.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        res = await fetch(`${this.getBaseUrl()}/api/auth/me/`, {
          method: "GET",
          headers: this.getHeaders(true),
        });
      } else {
        this.clearTokens();
        return null;
      }
    }
    return this.handleResponse(res);
  }

  saveTokens(access: string, refresh: string) {
    syncAuthSession({ access, refresh });
  }

  clearTokens() {
    clearAuthSession();
  }
}

export const authApi = new AuthApiClient();

