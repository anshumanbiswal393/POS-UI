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
  const emailLower = (backendUser?.email || "").toLowerCase();

  // Check if this user exists in POS staff list (from user roles management)
  let posStaff: any = null;
  try {
    const rawRbac = typeof window !== "undefined" ? localStorage.getItem("retrod:pos:users:list") : null;
    if (rawRbac) {
      const list = JSON.parse(rawRbac);
      if (Array.isArray(list)) {
        posStaff = list.find(
          (u: any) =>
            (u.email && u.email.toLowerCase() === emailLower) ||
            (u.id && backendUser?.id && String(u.id) === String(backendUser.id))
        );
      }
    }
  } catch {}

  const isSampritaAdmin =
    emailLower === "sampritapatra123@gmail.com" ||
    emailLower === "sampritapatra@gmail.com" ||
    emailLower === "admin@retrod.in";
  const isKitchenChef =
    emailLower === "samkhusi123@gmail.com" || emailLower === "kitchen@retrod.in";
  const isWaiter =
    emailLower === "samprita2022@gift.edu.in" ||
    emailLower === "waiter@retrod.in" ||
    (posStaff && (posStaff.role === "pos_waiter" || posStaff.role === "waiter" || posStaff.role_code === "pos_waiter"));
  const isArnav = emailLower === "arnav@retrod.in";

  let role: Role | string = backendUser?.role || "front_desk_agent";
  let roleName: string | undefined = backendUser?.role_name || backendUser?.role;
  let userName = backendUser?.name || "Retrod User";
  let propertyName = "Anshu Suite Restaurant · Main Outlet";

  if (posStaff) {
    role =
      posStaff.role === "admin"
        ? "pos_admin"
        : posStaff.role === "kitchen"
          ? "pos_kitchen"
          : posStaff.role === "waiter" || posStaff.role === "pos_waiter"
            ? "pos_waiter"
            : posStaff.role || "pos_waiter";
    userName = posStaff.name || userName;
    roleName = posStaff.role_name || (role === "pos_waiter" ? "Waiter" : posStaff.role);
    propertyName = posStaff.outlet_name || "Anshu Suite Restaurant · Main Outlet";
  } else if (isWaiter) {
    role = "pos_waiter";
    userName = "Raju waiter";
    roleName = "Waiter";
    propertyName = "Anshu Suite Restaurant · Main Outlet";
  } else if (isKitchenChef) {
    role = "pos_kitchen";
    userName = "Kitchen Chef Station";
    roleName = "Kitchen Chef / KDS";
    propertyName = "Anshu Suite Restaurant · Main Kitchen";
  } else if (isSampritaAdmin) {
    role = "pos_admin";
    userName = "Samprita Patra";
    roleName = "POS Administrator";
    propertyName = "Anshu Suite Restaurant · Main Outlet";
  } else if (isArnav) {
    role = "pos_staff";
    userName = "Arnav";
    roleName = "Arnav Staff Role";
    propertyName = "Anshu Suite Restaurant · Main Outlet";
  } else {
    if (backendUser && (backendUser.role === "super_admin" || backendUser.is_superuser)) {
      role = "super_admin";
    } else if (backendUser && backendUser.role) {
      role = backendUser.role;
    } else if (backendProperties && backendProperties.length > 0) {
      role = backendProperties[0].role;
      propertyName = backendProperties[0].name;
    }
  }

  const initials = (userName || "User")
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
    const anshuProp = mappedProperties.find((p) => p.name.toLowerCase().includes("anshu"));
    const matched = storedPropId
      ? mappedProperties.find((p) => p.id === storedPropId)
      : null;
    propertyName = anshuProp ? anshuProp.name : matched ? matched.name : propertyName;
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
    id: String(posStaff?.id || backendUser?.id || "u0"),
    name: userName,
    email: backendUser?.email || posStaff?.email || "user@retrod.in",
    role: role as Role,
    role_name: roleName || (role === "pos_waiter" ? "Waiter" : role as string),
    initials: initials,
    active: true,
    property: propertyName,
    lastActive: "Just now",
    phone: backendUser?.phone || posStaff?.phone,
    properties: mappedProperties,
    permissions: posStaff?.permissions || backendPermissions || [],
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

