import { describe, expect, it } from "vitest";
import { POS_NAV_ITEMS } from "../pos-nav-config";
import { getAllPosRouteNodes } from "../nav-personalization";

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
});

