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
  // 1. Billing & Cashier
  {
    id: "perm-pos-billing-view",
    code: "pos.billing.view",
    category: "Billing & Cashier",
    name: "View Billing Terminal",
    description: "Access cashier billing desk, open checkouts, and pending tabs.",
  },
  {
    id: "perm-pos-billing-create",
    code: "pos.billing.create",
    category: "Billing & Cashier",
    name: "Create & Punch Bills",
    description: "Add items to cart, modify quantities, and generate customer checks.",
  },
  {
    id: "perm-pos-billing-settle",
    code: "pos.billing.settle",
    category: "Billing & Cashier",
    name: "Settle Payments",
    description: "Accept cash, UPI/QR, credit cards, or post balance to Room Folio.",
  },
  {
    id: "perm-pos-billing-discount",
    code: "pos.billing.discount",
    category: "Billing & Cashier",
    name: "Apply Discounts",
    description: "Apply custom percentage or flat monetary discounts to bills.",
  },
  {
    id: "perm-pos-billing-split",
    code: "pos.billing.split",
    category: "Billing & Cashier",
    name: "Split Bills",
    description: "Split checks by seat, item count, or equal monetary divisions.",
  },

  // 2. Floor Plan & Orders
  {
    id: "perm-pos-orders-view",
    code: "pos.orders.view",
    category: "Floor Plan & Orders",
    name: "View Live Orders",
    description: "Monitor real-time floor occupancy and running orders list.",
  },
  {
    id: "perm-pos-orders-take",
    code: "pos.orders.take",
    category: "Floor Plan & Orders",
    name: "Seat & Take Orders",
    description: "Seat walk-in guests, assign table pax, and pick menu dishes.",
  },
  {
    id: "perm-pos-orders-kot",
    code: "pos.orders.kot",
    category: "Floor Plan & Orders",
    name: "Dispatch KOT",
    description: "Send kitchen order tickets and custom cooking notes to chef stations.",
  },
  {
    id: "perm-pos-orders-switch-table",
    code: "pos.orders.switch_table",
    category: "Floor Plan & Orders",
    name: "Switch & Merge Tables",
    description: "Transfer running dining orders and open bills between tables.",
  },
  {
    id: "perm-pos-reservations-manage",
    code: "pos.reservations.manage",
    category: "Floor Plan & Orders",
    name: "Manage Table Reservations",
    description: "Schedule advance table bookings and view upcoming 30-min arrival alerts.",
  },

  // 3. Kitchen & KDS
  {
    id: "perm-pos-kot-view",
    code: "pos.kot.view",
    category: "Kitchen & KDS",
    name: "View Kitchen Display (KDS)",
    description: "View live queue of incoming orders and preparation tickets.",
  },
  {
    id: "perm-pos-kot-status",
    code: "pos.kot.status",
    category: "Kitchen & KDS",
    name: "Update Cooking Status",
    description: "Mark tickets as In-Preparation, Food Ready, or Served.",
  },
  {
    id: "perm-pos-kot-void",
    code: "pos.kot.void",
    category: "Kitchen & KDS",
    name: "Void / Cancel KOT",
    description: "Cancel active cooking orders (supervisor privilege).",
  },

  // 4. Stock & Inventory
  {
    id: "perm-pos-inventory-view",
    code: "pos.inventory.view",
    category: "Stock & Inventory",
    name: "View Stock Levels",
    description: "Inspect available ingredients, raw material stock, and low stock warnings.",
  },
  {
    id: "perm-pos-inventory-manage",
    code: "pos.inventory.manage",
    category: "Stock & Inventory",
    name: "Manage Purchases & Wastage",
    description: "Receive stock inward, log food wastage, and configure recipe formulations.",
  },

  // 5. Reports & Day End Closing
  {
    id: "perm-pos-reports-view",
    code: "pos.reports.view",
    category: "Reports & Financials",
    name: "View Sales Reports",
    description: "Access day-wise sales, item performance, and payment reconciliation.",
  },
  {
    id: "perm-pos-reports-close-day",
    code: "pos.reports.close_day",
    category: "Reports & Financials",
    name: "Execute Day End Closing",
    description: "Settle daily register, lock transactions, and roll over operational date.",
  },

  // 6. User & System Management
  {
    id: "perm-pos-users-manage",
    code: "pos.users.manage",
    category: "Users & Security",
    name: "Manage Users & Roles",
    description: "Create staff users, assign roles, and grant granular module access.",
  },
  {
    id: "perm-pos-settings-manage",
    code: "pos.settings.manage",
    category: "Users & Security",
    name: "Configure POS Hardware & Outlets",
    description: "Map thermal receipt printers, KOT stations, and outlet profiles.",
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
    id: "role-pos-cashier",
    code: "pos_cashier",
    name: "Cashier / Biller",
    description: "Dedicated to rapid checkouts, split bills, payment collection, and daily shift cash counting.",
    domain: "pos",
    is_managed: false,
  },
  {
    id: "role-pos-captain",
    code: "pos_captain",
    name: "Restaurant Captain",
    description: "Floor supervisor managing table seating, order punching, KOTs, and table switches.",
    domain: "pos",
    is_managed: false,
  },
  {
    id: "role-pos-waiter",
    code: "pos_waiter",
    name: "Service Waiter",
    description: "Taking dine-in orders, entering guest requests, and sending tickets to the kitchen.",
    domain: "pos",
    is_managed: false,
  },
  {
    id: "role-pos-chef",
    code: "pos_chef",
    name: "Kitchen Chef / KDS",
    description: "Access to Kitchen Display System (KDS), preparation timers, and ready food marking.",
    domain: "pos",
    is_managed: false,
  },
  {
    id: "role-pos-inventory",
    code: "pos_inventory_manager",
    name: "Stock Controller",
    description: "Managing purchases, raw materials, supplier records, recipes, and wastage logs.",
    domain: "pos",
    is_managed: false,
  },
  {
    id: "role-tenant-owner",
    code: "TENANT_OWNER",
    name: "Hotel & POS Owner",
    description: "Platform owner privileges spanning entire hotel operations, rooms, and restaurants.",
    domain: "all",
    is_managed: true,
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
          return JSON.parse(local);
        } catch {
          return [];
        }
      }
    }

    // Zero dummy data initially
    return [];
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
      const updated = [savedUser, ...current];
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));
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
        return mapped;
      }
    } catch {
      // Fall through to defaults
    }

    if (typeof window !== "undefined") {
      const local = localStorage.getItem(STORAGE_ROLES_KEY);
      if (local) {
        try {
          return JSON.parse(local);
        } catch {
          // ignore
        }
      }
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
          if (roleId) {
            return list.filter((rp) => rp.role === roleId);
          }
          return list;
        } catch {
          // ignore
        }
      }
    }

    // Default permission mappings for seeded roles
    const defaults: POSRolePermission[] = [];
    const allPerms = DEFAULT_POS_PERMISSIONS;

    // pos_admin has all permissions
    allPerms.forEach((p) => {
      defaults.push({
        id: `rp-admin-${p.id}`,
        role: "role-pos-admin",
        permission: p.id,
        permission_code: p.code,
      });
    });

    // pos_cashier has billing & reports
    allPerms
      .filter((p) => p.category.includes("Billing") || p.category.includes("Reports"))
      .forEach((p) => {
        defaults.push({
          id: `rp-cashier-${p.id}`,
          role: "role-pos-cashier",
          permission: p.id,
          permission_code: p.code,
        });
      });

    // pos_captain has floor & orders & reservations
    allPerms
      .filter((p) => p.category.includes("Floor") || p.code.includes("kot"))
      .forEach((p) => {
        defaults.push({
          id: `rp-captain-${p.id}`,
          role: "role-pos-captain",
          permission: p.id,
          permission_code: p.code,
        });
      });

    return roleId ? defaults.filter((d) => d.role === roleId) : defaults;
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
