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
  let role: Role | string = backendUser?.role || "front_desk_agent";
  let propertyName = "Main Property";

  if (backendUser && (backendUser.role === "super_admin" || backendUser.is_superuser)) {
    role = "super_admin";
  } else if (backendUser && backendUser.role) {
    role = backendUser.role;
  } else if (backendProperties && backendProperties.length > 0) {
    role = backendProperties[0].role;
    propertyName = backendProperties[0].name;
  }

  const initials = (backendUser?.name || "User")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const mappedProperties = (backendProperties || []).map((p: any) => ({
    id: String(p.id),
    name: String(p.name),
    role: String(p.role || ""),
  }));

  if (mappedProperties.length > 0) {
    const storedPropId =
      typeof window !== "undefined"
        ? localStorage.getItem("retrod:active-property-id") ||
          localStorage.getItem("retrod_property_id")
        : null;
    const matched = storedPropId
      ? mappedProperties.find((p) => p.id === storedPropId)
      : null;
    propertyName = matched ? matched.name : mappedProperties[0].name;
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

  return {
    id: String(backendUser?.id || "u0"),
    name: backendUser?.name || "Retrod User",
    email: backendUser?.email || "user@retrod.in",
    role: role as Role,
    role_name: backendUser?.role_name || backendUser?.role,
    initials: initials,
    active: true,
    property: propertyName,
    lastActive: "Just now",
    phone: backendUser?.phone,
    properties: mappedProperties,
    permissions: backendPermissions || [],
    avatarUrl: avatar,
    tenant_subdomain: backendUser?.tenant_subdomain,
    is_superuser: backendUser?.is_superuser,
    subscription_plan: backendUser?.subscription_plan,
    subscription_expiry: backendUser?.subscription_expiry,
    license_key: backendUser?.license_key,
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

