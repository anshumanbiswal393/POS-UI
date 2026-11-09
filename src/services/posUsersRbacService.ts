import { httpClient } from "@/utils/httpClient";

export interface POSUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  role: string; // role code or id
  role_name?: string;
  role_code?: string;
  outlet_id?: string;
  outlet_name?: string;
  user_code?: string;
  pin?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface POSUserPayload {
  name: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  outlet_id?: string;
  outlet_name?: string;
  user_code?: string;
  pin?: string;
  password?: string;
  is_active?: boolean;
}

export interface POSRole {
  id: string;
  tenant?: string | null;
  code: string;
  name: string;
  description: string;
  domain: "pos" | "pms" | "all";
  is_managed?: boolean;
}

export interface POSPermission {
  id: string;
  code: string;
  category: string;
  name: string;
  description: string;
  screenName?: string;
  screenPath?: string;
}

export interface POSRolePermission {
  id: string;
  role: string;
  permission: string;
  permission_code?: string;
}

const STORAGE_USERS_KEY = "retrod:pos:users:list";
const STORAGE_ROLES_KEY = "retrod:pos:roles:list";
const STORAGE_ROLE_PERMS_KEY = "retrod:pos:role_permissions:list";

export const DEFAULT_POS_PERMISSIONS: POSPermission[] = [
  // 1. Billing & Cashier Desk
  {
    id: "perm-pos-billing-view",
    code: "pos.billing.view",
    category: "Billing & Cashier",
    name: "View Billing Terminal",
    description: "Open the cashier billing desk and view active tables/checks.",
    screenName: "Billing Terminal",
    screenPath: "/pos/billing",
  },
  {
    id: "perm-pos-billing-create",
    code: "pos.billing.create",
    category: "Billing & Cashier",
    name: "Punch Bills & Add Dishes",
    description: "Add items to check, customize portion variants, and punch dining bills.",
    screenName: "Billing Terminal",
    screenPath: "/pos/billing",
  },
  {
    id: "perm-pos-billing-settle",
    code: "pos.billing.settle",
    category: "Billing & Cashier",
    name: "Accept Payments & Settle",
    description: "Accept Cash, UPI/QR, Card settlements, or post charge to Room Folio.",
    screenName: "Pay Now Modal",
    screenPath: "/pos/billing",
  },
  {
    id: "perm-pos-billing-discount",
    code: "pos.billing.discount",
    category: "Billing & Cashier",
    name: "Apply Bill Discounts",
    description: "Apply custom percentage or flat monetary discounts to bills.",
    screenName: "Billing Terminal",
    screenPath: "/pos/billing",
  },
  {
    id: "perm-pos-billing-split",
    code: "pos.billing.split",
    category: "Billing & Cashier",
    name: "Split Customer Checks",
    description: "Split checks by seat, item count, or equal split divisions.",
    screenName: "Split Bill Modal",
    screenPath: "/pos/billing",
  },

  // 2. Floor Plan & Table Ordering
  {
    id: "perm-pos-orders-view",
    code: "pos.orders.view",
    category: "Floor Plan & Orders",
    name: "View Live Orders",
    description: "Monitor running dining occupancy, table status, and active order tickets.",
    screenName: "Live Orders",
    screenPath: "/pos/orders",
  },
  {
    id: "perm-pos-orders-take",
    code: "pos.orders.take",
    category: "Floor Plan & Orders",
    name: "Seat & Take Orders",
    description: "Seat walk-in guests, assign table pax, and pick menu dishes from tables.",
    screenName: "Manage Tables",
    screenPath: "/pos/take-order",
  },
  {
    id: "perm-pos-orders-kot",
    code: "pos.orders.kot",
    category: "Floor Plan & Orders",
    name: "Dispatch KOT to Kitchen",
    description: "Send kitchen order tickets and custom cooking notes to chef stations.",
    screenName: "Kitchen Orders",
    screenPath: "/pos/kot",
  },
  {
    id: "perm-pos-orders-switch-table",
    code: "pos.orders.switch_table",
    category: "Floor Plan & Orders",
    name: "Switch & Merge Tables",
    description: "Transfer running dining orders and open bills between tables.",
    screenName: "Manage Tables",
    screenPath: "/pos/take-order",
  },
  {
    id: "perm-pos-reservations-manage",
    code: "pos.reservations.manage",
    category: "Floor Plan & Orders",
    name: "Manage Table Reservations",
    description: "Book advance tables, manage advance deposits (or ₹0), and seat guests.",
    screenName: "Reservations",
    screenPath: "/pos/reservations",
  },

  // 3. Kitchen Display System (KDS)
  {
    id: "perm-pos-kot-view",
    code: "pos.kot.view",
    category: "Kitchen & KDS",
    name: "View Kitchen Display (KDS)",
    description: "Live queue of incoming food tickets, timer countdowns, and preparation station.",
    screenName: "Kitchen Orders (KOT)",
    screenPath: "/pos/kot",
  },
  {
    id: "perm-pos-kot-status",
    code: "pos.kot.status",
    category: "Kitchen & KDS",
    name: "Update Cooking Status",
    description: "Mark tickets as In-Prep, Food Ready (notifies Waiters), or Served.",
    screenName: "Kitchen Orders (KOT)",
    screenPath: "/pos/kot",
  },
  {
    id: "perm-pos-kot-void",
    code: "pos.kot.void",
    category: "Kitchen & KDS",
    name: "Void / Cancel KOT",
    description: "Cancel active cooking orders (supervisor privilege).",
    screenName: "Kitchen Orders (KOT)",
    screenPath: "/pos/kot",
  },

  // 4. Stock & Inventory Management
  {
    id: "perm-pos-inventory-view",
    code: "pos.inventory.view",
    category: "Stock & Inventory",
    name: "View Stock Levels & Catalog",
    description: "Inspect available ingredients, raw material stock, and low stock warnings.",
    screenName: "Stock & Inventory",
    screenPath: "/pos/inventory",
  },
  {
    id: "perm-pos-inventory-manage",
    code: "pos.inventory.manage",
    category: "Stock & Inventory",
    name: "Manage Purchases & Wastage",
    description: "Receive stock inward, log food wastage, and configure recipe formulations.",
    screenName: "Purchases & Stock",
    screenPath: "/pos/inventory/purchases",
  },

  // 5. Reports & Financials
  {
    id: "perm-pos-reports-view",
    code: "pos.reports.view",
    category: "Reports & Financials",
    name: "View Sales & Revenue Reports",
    description: "Access day-wise sales, item performance, and payment reconciliation.",
    screenName: "POS Reports",
    screenPath: "/pos/reports",
  },
  {
    id: "perm-pos-reports-close-day",
    code: "pos.reports.close_day",
    category: "Reports & Financials",
    name: "Execute Day End Closing",
    description: "Settle daily register, lock transactions, and roll over operational date.",
    screenName: "Day End Closing",
    screenPath: "/pos/reports/day-end",
  },

  // 6. Users & Security Management
  {
    id: "perm-pos-users-manage",
    code: "pos.users.manage",
    category: "Users & Security",
    name: "Manage Staff Users & Roles",
    description: "Create staff users, assign roles, and grant granular screen access.",
    screenName: "User Management",
    screenPath: "/pos/management/users",
  },
  {
    id: "perm-pos-settings-manage",
    code: "pos.settings.manage",
    category: "Users & Security",
    name: "Configure POS Hardware & Outlets",
    description: "Map thermal receipt printers, KOT stations, and outlet profiles.",
    screenName: "POS Settings",
    screenPath: "/pos/settings",
  },
];

export const DEFAULT_POS_ROLES: POSRole[] = [
  {
    id: "role-pos-admin",
    code: "pos_admin",
    name: "POS Administrator",
    description: "Full master control over billing, tables, KDS, inventory, reports, and security.",
    domain: "pos",
    is_managed: true,
  },
  {
    id: "role-pos-chef",
    code: "pos_kitchen",
    name: "Kitchen Chef / KDS",
    description: "Access to Kitchen Display System (KDS), preparation timers, and complete Stock & Inventory.",
    domain: "pos",
    is_managed: false,
  },
  {
    id: "role-arnav",
    code: "pos_staff",
    name: "Arnav Staff Role",
    description: "Staff role for orders, table seating, and cashier billing operations.",
    domain: "pos",
    is_managed: false,
  },
  {
    id: "role-pos-waiter",
    code: "pos_waiter",
    name: "Waiter",
    description: "Floor staff for taking orders from customers, KOT dispatch, and ready food pickup alerts.",
    domain: "pos",
    is_managed: false,
  },
];

export const DEFAULT_SEED_USERS: POSUser[] = [
  {
    id: "usr-admin-samprita",
    name: "Samprita Patra",
    username: "sampritapatra",
    email: "sampritapatra123@gmail.com",
    phone: "9937884878",
    role: "pos_admin",
    role_name: "POS Administrator",
    role_code: "pos_admin",
    outlet_name: "Anshu Suite Restaurant",
    user_code: "ADM-SAMPRITA",
    pin: "9988",
    is_active: true,
    created_at: "2026-11-01T00:00:00.000Z",
  },
  {
    id: "usr-kitchen-01",
    name: "Kitchen Chef Station",
    username: "kitchen",
    email: "samkhusi123@gmail.com",
    phone: "9937884878",
    role: "pos_kitchen",
    role_name: "Kitchen Chef / KDS",
    role_code: "pos_kitchen",
    outlet_name: "Main Kitchen",
    user_code: "KITCHEN-01",
    pin: "1122",
    is_active: true,
    created_at: "2026-11-01T00:00:00.000Z",
  },
  {
    id: "usr-staff-arnav",
    name: "Arnav",
    username: "arnav",
    email: "arnav@retrod.in",
    phone: "9876543210",
    role: "pos_staff",
    role_name: "Arnav Staff Role",
    role_code: "pos_staff",
    outlet_name: "Anshu Suite Restaurant",
    user_code: "STF-ARNAV",
    pin: "3344",
    is_active: true,
    created_at: "2026-11-01T00:00:00.000Z",
  },
  {
    id: "usr-waiter-01",
    name: "Raju waiter",
    username: "raju.waiter",
    email: "samprita2022@gift.edu.in",
    phone: "9937884878",
    role: "pos_waiter",
    role_name: "Waiter",
    role_code: "pos_waiter",
    outlet_name: "Anshu Suite Restaurant",
    user_code: "WTR-01",
    pin: "5566",
    is_active: true,
    created_at: "2026-11-01T00:00:00.000Z",
  },
];

export const posUsersRbacService = {
  // ── Users Management ───────────────────────────────────
  getUsers: async (): Promise<POSUser[]> => {
    try {
      const res = await httpClient.get<any>("/api/users/");
      const rawList = Array.isArray(res) ? res : res?.results || [];
      if (rawList.length > 0) {
        const mapped: POSUser[] = rawList.map((u: any) => ({
          id: String(u.id),
          name: u.name || u.username || "Staff User",
          username: u.username || "",
          email: u.email || "",
          phone: u.phone || "",
          role: u.role || u.role_code || "pos_waiter",
          role_name: u.role_name || u.role || "Staff",
          role_code: u.role_code || u.role,
          outlet_id: u.outlet_id ? String(u.outlet_id) : undefined,
          outlet_name: u.outlet_name || "Main Outlet",
          user_code: u.user_code || u.pin || "",
          pin: u.pin || "",
          is_active: u.is_active !== false,
          created_at: u.created_at || u.date_joined || new Date().toISOString(),
        }));
        // Ensure the 3 core users are included
        for (const seed of DEFAULT_SEED_USERS) {
          if (!mapped.some((u) => u.email.toLowerCase() === seed.email.toLowerCase() || u.id === seed.id)) {
            mapped.push(seed);
          }
        }
        // Cache locally for offline availability
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(mapped));
        }
        return mapped;
      }
    } catch {
      // Backend not reached; fall back to local storage
    }

    if (typeof window !== "undefined") {
      const local = localStorage.getItem(STORAGE_USERS_KEY);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Remove dummy Aarav user if present
            const filtered = parsed.filter((u: any) => u.id !== "usr-admin-01" && u.email !== "aarav@retrod.in");
            for (const seed of DEFAULT_SEED_USERS) {
              if (!filtered.some((u: any) => u.email?.toLowerCase() === seed.email.toLowerCase() || u.id === seed.id)) {
                filtered.push(seed);
              }
            }
            localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(filtered));
            return filtered;
          }
        } catch {
          // ignore
        }
      }
    }

    // Default seed users with Admin, Kitchen Station, and Arnav
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_SEED_USERS));
    }
    return DEFAULT_SEED_USERS;
  },

  createUser: async (payload: POSUserPayload): Promise<POSUser> => {
    let savedUser: POSUser | null = null;
    try {
      const res = await httpClient.post<any>("/api/users/", payload);
      if (res && res.id) {
        savedUser = {
          id: String(res.id),
          name: res.name || payload.name,
          username: res.username || payload.username,
          email: res.email || payload.email,
          phone: res.phone || payload.phone,
          role: res.role || payload.role,
          role_name: res.role_name || payload.role,
          outlet_id: payload.outlet_id,
          outlet_name: payload.outlet_name,
          user_code: payload.user_code,
          pin: payload.pin,
          is_active: payload.is_active !== false,
          created_at: res.created_at || new Date().toISOString(),
        };
      }
    } catch {
      // Local fallback creation
    }

    if (!savedUser) {
      savedUser = {
        id: `usr-${Date.now()}`,
        name: payload.name,
        username: payload.username,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        role_name: payload.role,
        outlet_id: payload.outlet_id,
        outlet_name: payload.outlet_name,
        user_code: payload.user_code,
        pin: payload.pin,
        is_active: payload.is_active !== false,
        created_at: new Date().toISOString(),
      };
    }

    if (typeof window !== "undefined") {
      const current = await posUsersRbacService.getUsers();
      const updated = [savedUser, ...current.filter((u) => u.id !== savedUser!.id && u.email?.toLowerCase() !== savedUser!.email?.toLowerCase())];
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));
      try {
        const rawCached = localStorage.getItem("retrod:users");
        const cachedList: any[] = rawCached ? JSON.parse(rawCached) : [];
        const appUser = {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          phone: savedUser.phone || "",
          role: savedUser.role || savedUser.role_code || "pos_waiter",
          active: savedUser.is_active !== false,
          lastActive: "Now",
          initials: savedUser.name ? savedUser.name.slice(0, 2).toUpperCase() : "ST",
          property: savedUser.outlet_name || "Anshu Suite Restaurant",
        };
        const nextList = [appUser, ...cachedList.filter((u: any) => u.id !== savedUser!.id && u.email?.toLowerCase() !== savedUser!.email?.toLowerCase())];
        localStorage.setItem("retrod:users", JSON.stringify(nextList));
      } catch {}
    }

    return savedUser;
  },

  updateUser: async (id: string, payload: Partial<POSUserPayload>): Promise<POSUser> => {
    try {
      await httpClient.patch(`/api/users/${id}/`, payload);
    } catch {
      // Offline fallback
    }

    if (typeof window !== "undefined") {
      const current = await posUsersRbacService.getUsers();
      const index = current.findIndex((u) => u.id === id);
      if (index !== -1) {
        current[index] = {
          ...current[index],
          ...payload,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(current));
        return current[index];
      }
    }

    return {
      id,
      name: payload.name || "User",
      username: payload.username || "",
      email: payload.email || "",
      role: payload.role || "pos_waiter",
      is_active: payload.is_active !== false,
    };
  },

  deleteUser: async (id: string): Promise<void> => {
    try {
      await httpClient.delete(`/api/users/${id}/`);
    } catch {
      // Offline fallback
    }

    if (typeof window !== "undefined") {
      const current = await posUsersRbacService.getUsers();
      const updated = current.filter((u) => u.id !== id);
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));
    }
  },

  // ── Roles & Permissions ─────────────────────────────────
  getRoles: async (): Promise<POSRole[]> => {
    const DUMMY_IDS = new Set([
      "role-pos-cashier",
      "role-pos-captain",
      "role-pos-inventory",
      "role-tenant-owner",
    ]);
    const DUMMY_CODES = new Set([
      "pos_cashier",
      "pos_captain",
      "pos_inventory_manager",
      "TENANT_OWNER",
    ]);

    const sanitizeRoles = (list: POSRole[]): POSRole[] => {
      const filtered = list.filter(
        (r) => !DUMMY_IDS.has(r.id) && !DUMMY_CODES.has(r.code)
      );
      // Ensure the 4 core roles exist
      for (const core of DEFAULT_POS_ROLES) {
        if (!filtered.some((r) => r.id === core.id || r.code === core.code)) {
          filtered.push(core);
        }
      }
      return filtered;
    };

    try {
      const res = await httpClient.get<any>("/api/roles/");
      const rawList = Array.isArray(res) ? res : res?.results || [];
      if (rawList.length > 0) {
        const mapped: POSRole[] = rawList.map((r: any) => ({
          id: String(r.id),
          tenant: r.tenant,
          code: r.code || r.name?.toLowerCase().replace(/\s+/g, "_"),
          name: r.name,
          description: r.description || "Custom role configuration",
          domain: r.code?.startsWith("pos_") || r.name?.toLowerCase().includes("pos") ? "pos" : "pms",
          is_managed: r.code === "OWNER" || r.code === "TENANT_OWNER" || r.code === "pos_admin",
        }));
        const sanitized = sanitizeRoles(mapped);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(sanitized));
        }
        return sanitized;
      }
    } catch {
      // Fall through to defaults
    }

    if (typeof window !== "undefined") {
      const local = localStorage.getItem(STORAGE_ROLES_KEY);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const sanitized = sanitizeRoles(parsed);
            localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(sanitized));
            return sanitized;
          }
        } catch {
          // ignore
        }
      }
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(DEFAULT_POS_ROLES));
    }
    return DEFAULT_POS_ROLES;
  },

  createRole: async (role: Omit<POSRole, "id">): Promise<POSRole> => {
    const newRole: POSRole = {
      ...role,
      id: `role-${Date.now()}`,
    };

    try {
      const res = await httpClient.post<any>("/api/roles/", role);
      if (res && res.id) {
        newRole.id = String(res.id);
      }
    } catch {
      // Local fallback
    }

    if (typeof window !== "undefined") {
      const existing = await posUsersRbacService.getRoles();
      const updated = [...existing, newRole];
      localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(updated));
    }

    return newRole;
  },

  deleteRole: async (id: string): Promise<void> => {
    try {
      await httpClient.delete(`/api/roles/${id}/`);
    } catch {
      // Local fallback
    }

    if (typeof window !== "undefined") {
      const existing = await posUsersRbacService.getRoles();
      const updated = existing.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(updated));
    }
  },

  getPermissions: async (): Promise<POSPermission[]> => {
    try {
      const res = await httpClient.get<any>("/api/permissions/");
      const rawList = Array.isArray(res) ? res : res?.results || [];
      if (rawList.length > 0) {
        const mapped: POSPermission[] = rawList.map((p: any) => ({
          id: String(p.id),
          code: p.code,
          category: p.category || "General",
          name: p.name || p.code.split(".").pop()?.replace(/_/g, " ").toUpperCase() || p.code,
          description: p.description || p.code,
        }));
        return mapped;
      }
    } catch {
      // Fallback to default catalog
    }
    return DEFAULT_POS_PERMISSIONS;
  },

  getRolePermissions: async (roleId?: string): Promise<POSRolePermission[]> => {
    const DUMMY_IDS = new Set([
      "role-pos-cashier",
      "role-pos-captain",
      "role-pos-inventory",
      "role-tenant-owner",
      "pos_cashier",
      "pos_captain",
      "pos_inventory_manager",
      "TENANT_OWNER",
    ]);

    // Build standard default mappings
    const buildDefaultPermissions = (): POSRolePermission[] => {
      const defs: POSRolePermission[] = [];
      const allPerms = DEFAULT_POS_PERMISSIONS;

      // 1. pos_admin has all 19 permissions
      allPerms.forEach((p) => {
        defs.push({
          id: `rp-admin-${p.id}`,
          role: "role-pos-admin",
          permission: p.id,
          permission_code: p.code,
        });
      });

      // 2. Kitchen Chef / KDS has KOT + Stock permissions
      const chefCodes = new Set([
        "pos.kot.view",
        "pos.kot.status",
        "pos.orders.kot",
        "pos.orders.view",
        "pos.inventory.view",
        "pos.inventory.manage",
      ]);
      allPerms
        .filter((p) => chefCodes.has(p.code))
        .forEach((p) => {
          defs.push({
            id: `rp-chef-${p.id}`,
            role: "role-pos-chef",
            permission: p.id,
            permission_code: p.code,
          });
        });

      // 3. Arnav Staff has billing & floor orders
      const staffCodes = new Set([
        "pos.billing.view",
        "pos.billing.create",
        "pos.orders.view",
        "pos.orders.take",
      ]);
      allPerms
        .filter((p) => staffCodes.has(p.code))
        .forEach((p) => {
          defs.push({
            id: `rp-arnav-${p.id}`,
            role: "role-arnav",
            permission: p.id,
            permission_code: p.code,
          });
        });

      // 4. Waiter has billing view & create, floor order view, take, KOT, and KDS food ready alerts view
      const waiterCodes = new Set([
        "pos.billing.view",
        "pos.billing.create",
        "pos.orders.view",
        "pos.orders.take",
        "pos.orders.kot",
        "pos.kot.view",
      ]);
      allPerms
        .filter((p) => waiterCodes.has(p.code))
        .forEach((p) => {
          defs.push({
            id: `rp-waiter-${p.id}`,
            role: "role-pos-waiter",
            permission: p.id,
            permission_code: p.code,
          });
        });

      return defs;
    };

    const isMatch = (target: string, query: string) => {
      if (target === query) return true;
      if (query === "role-pos-chef" && (target === "pos_kitchen" || target === "pos_chef")) return true;
      if (query === "pos_kitchen" && (target === "role-pos-chef" || target === "pos_chef")) return true;
      if (query === "role-pos-admin" && target === "pos_admin") return true;
      if (query === "pos_admin" && target === "role-pos-admin") return true;
      if (query === "role-arnav" && target === "pos_staff") return true;
      if (query === "pos_staff" && target === "role-arnav") return true;
      if (
        (query === "role-pos-waiter" || query === "pos_waiter" || query.toLowerCase().includes("waiter")) &&
        (target === "role-pos-waiter" || target === "pos_waiter" || target.toLowerCase().includes("waiter"))
      ) {
        return true;
      }
      return false;
    };

    try {
      const url = roleId ? `/api/role-permissions/?role=${roleId}` : "/api/role-permissions/";
      const res = await httpClient.get<any>(url);
      const rawList = Array.isArray(res) ? res : res?.results || [];
      if (rawList.length > 0) {
        return rawList.map((rp: any) => ({
          id: String(rp.id),
          role: String(rp.role),
          permission: String(rp.permission),
          permission_code: rp.permission_code,
        }));
      }
    } catch {
      // Fallback to local storage
    }

    if (typeof window !== "undefined") {
      const local = localStorage.getItem(STORAGE_ROLE_PERMS_KEY);
      if (local) {
        try {
          const list: POSRolePermission[] = JSON.parse(local);
          if (Array.isArray(list)) {
            // Filter out dummy role permissions
            const cleanList = list.filter((rp) => !DUMMY_IDS.has(rp.role));
            // Ensure chef permissions exist
            const hasChef = cleanList.some((rp) => isMatch(rp.role, "role-pos-chef"));
            if (!hasChef) {
              const chefDefaults = buildDefaultPermissions().filter((rp) => rp.role === "role-pos-chef");
              cleanList.push(...chefDefaults);
            }
            // Ensure arnav permissions exist
            const hasArnav = cleanList.some((rp) => isMatch(rp.role, "role-arnav"));
            if (!hasArnav) {
              const arnavDefaults = buildDefaultPermissions().filter((rp) => rp.role === "role-arnav");
              cleanList.push(...arnavDefaults);
            }
            // Ensure waiter permissions exist
            const hasWaiter = cleanList.some((rp) => isMatch(rp.role, "role-pos-waiter"));
            if (!hasWaiter) {
              const waiterDefaults = buildDefaultPermissions().filter((rp) => rp.role === "role-pos-waiter");
              cleanList.push(...waiterDefaults);
            }
            localStorage.setItem(STORAGE_ROLE_PERMS_KEY, JSON.stringify(cleanList));

            if (roleId) {
              return cleanList.filter((rp) => isMatch(rp.role, roleId));
            }
            return cleanList;
          }
        } catch {
          // ignore
        }
      }
    }

    const defaultList = buildDefaultPermissions();
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_ROLE_PERMS_KEY, JSON.stringify(defaultList));
    }
    return roleId ? defaultList.filter((d) => isMatch(d.role, roleId)) : defaultList;
  },

  syncRolePermissions: async (
    roleId: string,
    permissionIds: string[],
    action: "assign" | "revoke"
  ): Promise<POSRolePermission[]> => {
    try {
      await httpClient.post(`/api/role-permissions/bulk-sync/`, {
        role_id: roleId,
        permission_ids: permissionIds,
        action,
      });
    } catch {
      // Local fallback
    }

    if (typeof window !== "undefined") {
      const current = await posUsersRbacService.getRolePermissions();
      let updated: POSRolePermission[];

      if (action === "assign") {
        const newEntries: POSRolePermission[] = permissionIds.map((pId) => ({
          id: `rp-${roleId}-${pId}`,
          role: roleId,
          permission: pId,
        }));
        const remaining = current.filter(
          (rp) => !(rp.role === roleId && permissionIds.includes(rp.permission))
        );
        updated = [...remaining, ...newEntries];
      } else {
        updated = current.filter(
          (rp) => !(rp.role === roleId && permissionIds.includes(rp.permission))
        );
      }

      localStorage.setItem(STORAGE_ROLE_PERMS_KEY, JSON.stringify(updated));
      return updated.filter((rp) => rp.role === roleId);
    }

    return [];
  },
};

