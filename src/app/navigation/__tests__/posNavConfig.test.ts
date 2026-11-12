import { describe, expect, it } from "vitest";
import { POS_NAV_ITEMS, POS_FOOTER_NAV_ITEMS } from "../pos-nav-config";
import { getAllPosRouteNodes } from "../nav-personalization";
import { BookOpen } from "lucide-react";

describe("POS Navigation - Stock Reports placement", () => {
  it("removes Reports group from Stock (inventory) section", () => {
    const stockSection = POS_NAV_ITEMS.find((item) => item.id === "inventory");
    expect(stockSection).toBeDefined();

    const stockChildren = stockSection?.children || [];
    const reportsInStock = stockChildren.find(
      (child) => child.id === "reports-group" || child.label.toLowerCase() === "reports"
    );
    expect(reportsInStock).toBeUndefined();
  });

  it("places Stock Reports inside the main Reports folder with correct sub-routes", () => {
    const reportsSection = POS_NAV_ITEMS.find((item) => item.id === "reports");
    expect(reportsSection).toBeDefined();

    const reportsChildren = reportsSection?.children || [];
    const stockReportsGroup = reportsChildren.find(
      (child) => child.id === "stock-reports-group"
    );
    expect(stockReportsGroup).toBeDefined();
    expect(stockReportsGroup?.label).toBe("Stock Reports");

    const subRoutes = stockReportsGroup?.children?.map((c) => ({
      id: c.id,
      label: c.label,
      to: c.to,
    }));

    expect(subRoutes).toEqual([
      { id: "inv-rep-summary", label: "Stock Summary", to: "/pos/inventory/reports/stock-summary" },
      { id: "inv-rep-orderwise", label: "Usage by Order", to: "/pos/inventory/reports/orderwise-consumption" },
      { id: "inv-rep-other", label: "More Reports", to: "/pos/inventory/reports/other-reports" },
    ]);
  });

  it("ensures all Stock Report routes are discoverable in route nodes", () => {
    const allRoutes = getAllPosRouteNodes();
    const routePaths = allRoutes.map((r) => r.to);

    expect(routePaths).toContain("/pos/inventory/reports/stock-summary");
    expect(routePaths).toContain("/pos/inventory/reports/orderwise-consumption");
    expect(routePaths).toContain("/pos/inventory/reports/other-reports");
  });

  it("configures Help Guide correctly in footer navigation", () => {
    const helpItem = POS_FOOTER_NAV_ITEMS.find((item) => item.id === "help");
    expect(helpItem).toBeDefined();
    expect(helpItem?.label).toBe("Help Guide");
    expect(helpItem?.to).toBe("/pos/help");
    expect(helpItem?.icon).toBe(BookOpen);
  });

  it("configures User Management with only Users and User roles (removing biller and admin groups)", () => {
    const mgmtSection = POS_NAV_ITEMS.find((item) => item.id === "management");
    expect(mgmtSection).toBeDefined();

    const userGroup = mgmtSection?.children?.find(
      (c) => c.id === "user-management-group"
    );
    expect(userGroup).toBeDefined();
    expect(userGroup?.label).toBe("User Management");

    const children = userGroup?.children || [];
    expect(children.length).toBe(2);

    expect(children[0]).toMatchObject({
      id: "usr-users",
      label: "Users",
      to: "/pos/management/users",
    });

    expect(children[1]).toMatchObject({
      id: "usr-roles",
      label: "User roles",
      to: "/pos/management/users/roles",
    });

    // Verify biller and admin groups are completely removed
    const hasBiller = children.some(
      (c) => c.id.includes("biller") || c.label.toLowerCase().includes("biller")
    );
    const hasAdminGroup = children.some(
      (c) => c.id.includes("admin-group") || c.label.toLowerCase().includes("admin group")
    );
    expect(hasBiller).toBe(false);
    expect(hasAdminGroup).toBe(false);
  });

  it("keeps Daily Preparation only inside Manage Stock and removes duplicate from Food Menu", () => {
    const menuSection = POS_NAV_ITEMS.find((item) => item.id === "menu");
    expect(menuSection).toBeDefined();
    const menuDailyPrep = (menuSection?.children || []).find(
      (c) => c.id === "menu-daily-prep" || c.label === "Daily Preparation"
    );
    expect(menuDailyPrep).toBeUndefined();

    const stockSection = POS_NAV_ITEMS.find((item) => item.id === "inventory");
    const manageStockGroup = (stockSection?.children || []).find(
      (c) => c.id === "manage-stock-group"
    );
    expect(manageStockGroup).toBeDefined();
    const invDailyPrep = (manageStockGroup?.children || []).find(
      (c) => c.id === "inv-daily-prep"
    );
    expect(invDailyPrep).toMatchObject({
      id: "inv-daily-prep",
      label: "Daily Preparation",
      to: "/pos/inventory/production",
    });
  });
});

