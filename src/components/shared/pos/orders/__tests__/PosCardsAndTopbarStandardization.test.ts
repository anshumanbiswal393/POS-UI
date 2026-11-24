import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("PMS Cards & TopBar Standardization in POS", () => {
  it("Primitives defines PMS-identical PageHeader and KpiCard with left accent borders", () => {
    const primitivesPath = path.resolve(__dirname, "../../../../ui/Primitives.tsx");
    const content = fs.readFileSync(primitivesPath, "utf-8");

    // PageHeader gradient matching PMS
    expect(content).toContain("bg-gradient-to-r from-primary-tint/40 via-primary/5 to-surface");
    expect(content).toContain("border-b border-primary/20");

    // KpiCard left-border accent stripe matching PMS
    expect(content).toContain("w-[3.5px] rounded-r");
    expect(content).toContain('brand: "var(--color-primary, #006a4e)"');
    expect(content).toContain('warning: "var(--color-warning, #d97706)"');
    expect(content).toContain('success: "var(--color-success, #16a34a)"');
    expect(content).toContain('info: "var(--color-info, #2563eb)"');
    expect(content).toContain('error: "var(--color-error, #dc2626)"');
  });

  it("PosTopBar correctly resolves breadcrumbs for all operational POS routes", () => {
    const topBarPath = path.resolve(__dirname, "../../../../layout/pos/PosTopBar.tsx");
    const content = fs.readFileSync(topBarPath, "utf-8");

    expect(content).toContain('if (pathname.includes("/reservations")) return "Reservations";');
    expect(content).toContain('if (pathname.includes("/kot")) return "Kitchen Orders";');
    expect(content).toContain('if (pathname.includes("/settlement")) return "Pending Payments";');
    expect(content).toContain('if (pathname.includes("/orders/all")) return "Order History";');
    expect(content).toContain('if (pathname.includes("/inventory/purchase")) return "Purchases & Invoices";');
    expect(content).toContain('if (pathname.includes("/inventory/production")) return "Daily Kitchen Prep";');
    expect(content).toContain('if (pathname.includes("/inventory/wastage")) return "Stock Wastage";');
    expect(content).toContain('if (pathname.includes("/inventory/available-stock")) return "Available Stock";');

    // Star icon / Upgrade plan removed from user profile dropdown
    expect(content).not.toContain("<Sparkles");
    expect(content).not.toContain("Upgrade plan");
  });

  it("Current Orders and KOT use standardized PageHeader and KpiCards", () => {
    const liveOrdersPath = path.resolve(__dirname, "../PosLiveOrdersManager.tsx");
    const liveContent = fs.readFileSync(liveOrdersPath, "utf-8");
    expect(liveContent).toContain("<PageHeader");
    expect(liveContent).toContain("<KpiCard");
    expect(liveContent).toContain('label="Active Orders"');
    expect(liveContent).toContain('label="Live Revenue"');

    const kotPath = path.resolve(__dirname, "../PosKotManager.tsx");
    const kotContent = fs.readFileSync(kotPath, "utf-8");
    expect(kotContent).toContain("<PageHeader");
    expect(kotContent).toContain('title="Kitchen Orders"');
  });

  it("Stock Purchase and Daily Preparation views use standardized PageHeader and KpiCards", () => {
    const purchasePath = path.resolve(__dirname, "../../inventory/views/StockPurchaseView.tsx");
    const purchaseContent = fs.readFileSync(purchasePath, "utf-8");
    expect(purchaseContent).toContain("<PageHeader");
    expect(purchaseContent).toContain("<KpiCard");
    expect(purchaseContent).toContain('label="Total Purchases"');
    expect(purchaseContent).toContain('label="Active Vendors"');

    const prepPath = path.resolve(__dirname, "../../inventory/views/DailyPreparationView.tsx");
    const prepContent = fs.readFileSync(prepPath, "utf-8");
    expect(prepContent).toContain("<PageHeader");
    expect(prepContent).toContain("<KpiCard");
    expect(prepContent).toContain('label="Plates Prepared Today"');
  });
});
