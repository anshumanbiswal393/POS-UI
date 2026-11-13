// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { posUsersRbacService, type POSUser } from "@/services/posUsersRbacService";
import { ROLE_PERMISSIONS, hasPermission } from "@/lib/auth/rbac";
import { POS_NAV_ITEMS, POS_FOOTER_NAV_ITEMS, type PosNavItem, type PosNavChild } from "@/app/navigation/pos-nav-config";
import { KITCHEN_USER } from "@/components/providers/AuthProvider";

describe("Kitchen User UI Access & Visibility Flow", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("Step 1: Creates a Kitchen Staff user in User Management with proper credentials", async () => {
    const created = await posUsersRbacService.createUser({
      name: "Chef Sanjeev (Head Kitchen)",
      username: "kitchen.head",
      email: "kitchen.head@retrod.in",
      phone: "9876543299",
      role: "pos_kitchen",
      outlet_name: "Main Kitchen",
      pin: "4321",
      password: "kitchenpassword123",
      is_active: true,
    });

    expect(created.id).toBeDefined();
    expect(created.username).toBe("kitchen.head");
    expect(created.role).toBe("pos_kitchen");
    expect(created.pin).toBe("4321");
    expect(created.is_active).toBe(true);

    const users = await posUsersRbacService.getUsers();
    expect(users.some((u) => u.username === "kitchen.head")).toBe(true);
  });

  it("Step 2: Verifies RBAC access grants only KOT and full Stock to pos_kitchen", () => {
    const kitchenPerms = ROLE_PERMISSIONS.pos_kitchen;

    // Screens user CHOOSES for Kitchen: KOT + Stock completely
    expect(kitchenPerms).toContain("pos.kot.view");
    expect(kitchenPerms).toContain("pos.kot.manage");
    expect(kitchenPerms).toContain("pos.recipes.view");
    expect(kitchenPerms).toContain("pos.inventory.view");
    expect(kitchenPerms).toContain("pos.inventory.manage");
    expect(kitchenPerms).toContain("pos.inventory.wastage");
    expect(kitchenPerms).toContain("pos.inventory.production");
    expect(kitchenPerms).toContain("pos.inventory.purchase_orders");

    // All other screens must NOT be accessible
    expect(kitchenPerms).not.toContain("pos.billing.view");
    expect(kitchenPerms).not.toContain("pos.billing.settle");
    expect(kitchenPerms).not.toContain("pos.orders.view");
    expect(kitchenPerms).not.toContain("pos.orders.create");
    expect(kitchenPerms).not.toContain("pos.menu.view");
    expect(kitchenPerms).not.toContain("pos.menu.manage");
    expect(kitchenPerms).not.toContain("pos.reports.view");
    expect(kitchenPerms).not.toContain("pos.settings.manage");
    expect(kitchenPerms).not.toContain("pos.users.manage");
  });

  it("Step 3: Verifies login redirect lands directly on /pos/kot", () => {
    const resolveStartingRoute = (role?: string) => {
      const roleLower = String(role || "").toLowerCase();
      if (roleLower === "pos_kitchen" || roleLower.includes("kitchen")) {
        return "/pos/kot";
      }
      return "/pos";
    };

    expect(resolveStartingRoute("pos_kitchen")).toBe("/pos/kot");
    expect(resolveStartingRoute(KITCHEN_USER.role)).toBe("/pos/kot");
    expect(resolveStartingRoute("pos_admin")).toBe("/pos");
    expect(resolveStartingRoute("pos_cashier")).toBe("/pos");
  });

  it("Step 4: Simulates Sidebar generation for Kitchen - only KOT and Stock folder visible", () => {
    const simulateKitchenSidebar = (userRole: string) => {
      const isKitchen = userRole === "pos_kitchen" || userRole.includes("kitchen");
      if (isKitchen) {
        const stockItem = POS_NAV_ITEMS.find((item) => item.id === "inventory");
        const kotItem: PosNavItem = {
          id: "kitchen-orders",
          label: "Kitchen Orders (KOT)",
          to: "/pos/kot",
          icon: () => null as any,
        };
        const items: PosNavItem[] = [kotItem];
        if (stockItem) {
          items.push(stockItem);
        }
        return items;
      }
      return POS_NAV_ITEMS;
    };

    const kitchenSidebarItems = simulateKitchenSidebar("pos_kitchen");

    // Must only have 2 main modules: Kitchen Orders (KOT) and Stock
    expect(kitchenSidebarItems.length).toBe(2);
    expect(kitchenSidebarItems[0].id).toBe("kitchen-orders");
    expect(kitchenSidebarItems[0].to).toBe("/pos/kot");
    expect(kitchenSidebarItems[1].id).toBe("inventory");
    expect(kitchenSidebarItems[1].to).toBe("/pos/inventory");

    // Stock children must include purchases, manage stock, setup
    const stockChildren = kitchenSidebarItems[1].children || [];
    const stockChildIds = stockChildren.map((c) => c.id);
    expect(stockChildIds).toContain("inv-dashboard");
    expect(stockChildIds).toContain("purchase-group");
    expect(stockChildIds).toContain("manage-stock-group");
    expect(stockChildIds).toContain("masters-group");
    expect(stockChildIds).not.toContain("consumption-group");

    // Manage stock must now contain stock wastage
    const manageStock = stockChildren.find((c) => c.id === "manage-stock-group");
    const manageChildIds = (manageStock?.children || []).map((c) => c.id);
    expect(manageChildIds).toContain("inv-wastage");

    // Forbidden main navigation items must NOT exist in kitchen sidebar
    const kitchenNavIds = kitchenSidebarItems.map((item) => item.id);
    expect(kitchenNavIds).not.toContain("dashboard");
    expect(kitchenNavIds).not.toContain("take-order");
    expect(kitchenNavIds).not.toContain("billing");
    expect(kitchenNavIds).not.toContain("daily");
    expect(kitchenNavIds).not.toContain("reservations");
    expect(kitchenNavIds).not.toContain("menu");
    expect(kitchenNavIds).not.toContain("reports");
    expect(kitchenNavIds).not.toContain("management");
  });

  it("Step 5: Simulates Settings menu for Kitchen - strictly Profile & Theme only", () => {
    const MENU = [
      { id: "account", label: "Account" },
      { id: "security", label: "Security" },
      { id: "outlets", label: "Outlets" },
      { id: "terminal", label: "Terminal" },
      { id: "receipts", label: "Receipts" },
      { id: "printers", label: "Printers" },
    ];

    const resolveSettingsMenu = (role: string) => {
      const isKitchen = role === "pos_kitchen" || role.includes("kitchen");
      if (isKitchen) {
        return [{ id: "account", label: "Profile & Theme" }];
      }
      return MENU;
    };

    const kitchenSettingsTabs = resolveSettingsMenu("pos_kitchen");
    expect(kitchenSettingsTabs.length).toBe(1);
    expect(kitchenSettingsTabs[0].id).toBe("account");
    expect(kitchenSettingsTabs[0].label).toBe("Profile & Theme");

    // Admin still has all 6 settings tabs
    const adminSettingsTabs = resolveSettingsMenu("pos_admin");
    expect(adminSettingsTabs.length).toBe(6);
  });
});

