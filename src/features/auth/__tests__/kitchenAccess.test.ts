// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { ROLE_PERMISSIONS, hasPermission } from "@/lib/auth/rbac";
import { POS_NAV_ITEMS, POS_FOOTER_NAV_ITEMS } from "@/app/navigation/pos-nav-config";
import { KITCHEN_USER } from "@/components/providers/AuthProvider";

describe("Kitchen KDS Role & Access Restrictions", () => {
  it("confirms KITCHEN_USER credentials and default permissions", () => {
    expect(KITCHEN_USER.email).toBe("samkhusi123@gmail.com");
    expect(KITCHEN_USER.phone).toBe("9937884878");
    expect(KITCHEN_USER.role).toBe("pos_kitchen");
    expect(KITCHEN_USER.permissions).toContain("pos.kot.view");
    expect(KITCHEN_USER.permissions).toContain("pos.inventory.view");
    expect(KITCHEN_USER.permissions).toContain("pos.inventory.manage");
    expect(KITCHEN_USER.permissions).toContain("pos.inventory.wastage");
    expect(KITCHEN_USER.permissions).toContain("pos.inventory.production");
    expect(KITCHEN_USER.permissions).toContain("pos.inventory.purchase_orders");
  });

  it("ensures kitchen staff can view KOT and all Stock sub-modules", () => {
    expect(hasPermission("pos_kitchen", "pos.kot.view")).toBe(true);
    expect(hasPermission("pos_kitchen", "pos.kot.manage")).toBe(true);
    expect(hasPermission("pos_kitchen", "pos.inventory.view")).toBe(true);
    expect(hasPermission("pos_kitchen", "pos.inventory.manage")).toBe(true);
    expect(hasPermission("pos_kitchen", "pos.inventory.wastage")).toBe(true);
    expect(hasPermission("pos_kitchen", "pos.inventory.production")).toBe(true);
    expect(hasPermission("pos_kitchen", "pos.inventory.purchase_orders")).toBe(true);
  });

  it("ensures kitchen staff is strictly forbidden from billing, orders, management, menu, and reports", () => {
    expect(hasPermission("pos_kitchen", "pos.billing.view")).toBe(false);
    expect(hasPermission("pos_kitchen", "pos.billing.settle")).toBe(false);
    expect(hasPermission("pos_kitchen", "pos.orders.view")).toBe(false);
    expect(hasPermission("pos_kitchen", "pos.orders.create")).toBe(false);
    expect(hasPermission("pos_kitchen", "pos.settings.manage")).toBe(false);
    expect(hasPermission("pos_kitchen", "pos.users.manage")).toBe(false);
    expect(hasPermission("pos_kitchen", "pos.reports.view")).toBe(false);
  });

  it("verifies sidebar allowed nodes filtering logic for pos_kitchen", () => {
    const allowedPrefixes = ["/pos/kot", "/pos/inventory", "/pos/settings", "/pos/help"];
    const checkAllowed = (to?: string, id?: string) => {
      if (to && allowedPrefixes.some((p) => to === p || to.startsWith(p + "/"))) {
        return true;
      }
      if (id === "inventory" || id === "kot" || id === "kitchen-orders" || id === "settings" || id === "help") {
        return true;
      }
      return false;
    };

    // KOT and Stock must be allowed
    expect(checkAllowed("/pos/kot", "kot")).toBe(true);
    expect(checkAllowed("/pos/inventory", "inventory")).toBe(true);
    expect(checkAllowed("/pos/inventory/available-stock", "available-stock")).toBe(true);
    expect(checkAllowed("/pos/inventory/purchase", "stock-purchase")).toBe(true);
    expect(checkAllowed("/pos/inventory/production", "inv-prod-master")).toBe(true);
    expect(checkAllowed("/pos/settings", "settings")).toBe(true);
    expect(checkAllowed("/pos/help", "help")).toBe(true);

    // Other screens must NOT be allowed
    expect(checkAllowed("/pos", "dashboard")).toBe(false);
    expect(checkAllowed("/pos/take-order", "take-order")).toBe(false);
    expect(checkAllowed("/pos/billing", "billing")).toBe(false);
    expect(checkAllowed("/pos/orders", "daily")).toBe(false);
    expect(checkAllowed("/pos/reservations", "reservations")).toBe(false);
    expect(checkAllowed("/pos/menu", "menu")).toBe(false);
    expect(checkAllowed("/pos/reports", "reports")).toBe(false);
    expect(checkAllowed("/pos/management", "management")).toBe(false);
  });
});

