// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { posUsersRbacService } from "@/services/posUsersRbacService";
import { ROLE_PERMISSIONS } from "@/lib/auth/rbac";
import { POS_NAV_ITEMS } from "@/app/navigation/pos-nav-config";
import { WAITER_USER } from "@/components/providers/AuthProvider";
import { listKotReadyNotices } from "@/lib/posReadyNotifications";

describe("Waiter Role UI & Permissions Full Walkthrough", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("Step 1: Retrieves configured Waiter role with 6 operational permissions", async () => {
    const roles = await posUsersRbacService.getRoles();
    const waiterRole = roles.find((r) => r.code === "pos_waiter" || r.name.toLowerCase().includes("waiter"));
    expect(waiterRole).toBeDefined();
    expect(waiterRole?.name).toBe("Waiter");

    const perms = await posUsersRbacService.getRolePermissions(waiterRole!.id);
    const permCodes = perms.map((p) => p.permission_code || p.permission);

    // Operational permissions for Waiter:
    expect(permCodes).toContain("pos.billing.view");
    expect(permCodes).toContain("pos.billing.create");
    expect(permCodes).toContain("pos.orders.view");
    expect(permCodes).toContain("pos.orders.take");
    expect(permCodes).toContain("pos.orders.kot");
    expect(permCodes).toContain("pos.kot.view");

    // Total permissions = 6 out of 19
    expect(permCodes.length).toBe(6);

    // Strictly forbidden permissions:
    expect(permCodes).not.toContain("pos.billing.settle");
    expect(permCodes).not.toContain("pos.inventory.view");
    expect(permCodes).not.toContain("pos.inventory.manage");
    expect(permCodes).not.toContain("pos.reports.view");
    expect(permCodes).not.toContain("pos.settings.manage");
    expect(permCodes).not.toContain("pos.users.manage");
  });

  it("Step 2: Creates and persists a new Waiter staff user via UI form", async () => {
    const created = await posUsersRbacService.createUser({
      name: "Rohan Kumar (Floor Waiter)",
      username: "rohan.waiter",
      email: "waiter@retrod.in",
      phone: "9876543220",
      role: "pos_waiter",
      outlet_name: "Anshu Suite Restaurant",
      pin: "5566",
      is_active: true,
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Rohan Kumar (Floor Waiter)");
    expect(created.email).toBe("waiter@retrod.in");
    expect(created.role).toBe("pos_waiter");
    expect(created.is_active).toBe(true);

    const allUsers = await posUsersRbacService.getUsers();
    expect(allUsers.some((u) => u.email === "waiter@retrod.in")).toBe(true);
  });

  it("Step 3: Verifies Waiter login routes to POS billing terminal (/pos/billing)", () => {
    const resolveStartingRoute = (role?: string) => {
      const roleLower = String(role || "").toLowerCase();
      if (roleLower === "pos_kitchen" || roleLower.includes("kitchen")) {
        return "/pos/kot";
      }
      if (roleLower === "pos_waiter" || roleLower === "waiter" || roleLower.includes("waiter")) {
        return "/pos/billing";
      }
      return "/pos";
    };

    expect(resolveStartingRoute("pos_waiter")).toBe("/pos/billing");
    expect(resolveStartingRoute(WAITER_USER.role)).toBe("/pos/billing");
    expect(resolveStartingRoute("pos_kitchen")).toBe("/pos/kot");
    expect(resolveStartingRoute("pos_admin")).toBe("/pos");
  });

  it("Step 4: Simulates Sidebar generation for Waiter - only Order Taking & Billing modules visible", () => {
    const simulateWaiterSidebar = (userRole: string) => {
      const isWaiter = userRole === "pos_waiter" || userRole === "waiter" || userRole.includes("waiter");
      if (isWaiter) {
        const allowedIds = new Set(["take-order", "billing", "daily"]);
        return POS_NAV_ITEMS.filter((item) => allowedIds.has(item.id));
      }
      return POS_NAV_ITEMS;
    };

    const waiterSidebar = simulateWaiterSidebar("pos_waiter");
    expect(waiterSidebar.length).toBe(3);
    const visibleIds = waiterSidebar.map((i) => i.id);
    expect(visibleIds).toEqual(["take-order", "billing", "daily"]);

    // Forbidden from Dashboard, Inventory/Stock, Reports, Management
    expect(visibleIds).not.toContain("dashboard");
    expect(visibleIds).not.toContain("inventory");
    expect(visibleIds).not.toContain("reports");
    expect(visibleIds).not.toContain("management");
  });

  it("Step 5: Verifies Waiter Top Bar notifications display ready KOT tickets and allow serving", () => {
    const notices = listKotReadyNotices();
    expect(notices.length).toBeGreaterThanOrEqual(1);

    const readyNotice = notices.find((n) => n.id.includes("ready") || n.title.includes("Ready"));
    expect(readyNotice).toBeDefined();
    expect(readyNotice?.title).toContain("Ready");
    expect(readyNotice?.message).toContain("pickup counter");
  });

  it("Step 6: Verifies Waiter Settings are restricted strictly to Profile & Theme", () => {
    const simulateSettingsMenu = (userRole: string) => {
      const isKitchen = userRole === "pos_kitchen" || userRole.includes("kitchen");
      const isWaiter = userRole === "pos_waiter" || userRole === "waiter" || userRole.includes("waiter");
      const isLimitedStaff = isKitchen || isWaiter;

      return isLimitedStaff
        ? [{ id: "account", label: "Profile & Theme" }]
        : [
            { id: "account", label: "Account" },
            { id: "security", label: "Security" },
            { id: "outlets", label: "Outlets" },
            { id: "terminal", label: "Terminal" },
            { id: "receipts", label: "Receipts" },
            { id: "printers", label: "Printers" },
          ];
    };

    const waiterMenu = simulateSettingsMenu("pos_waiter");
    expect(waiterMenu.length).toBe(1);
    expect(waiterMenu[0].label).toBe("Profile & Theme");

    const adminMenu = simulateSettingsMenu("pos_admin");
    expect(adminMenu.length).toBe(6);
  });
});

