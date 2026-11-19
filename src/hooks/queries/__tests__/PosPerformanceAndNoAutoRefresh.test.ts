import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("POS Performance & Auto-Refresh Removal", () => {
  it("router.tsx disables automatic polling and sets instant navigation cache", () => {
    const routerPath = path.resolve(__dirname, "../../../router.tsx");
    const content = fs.readFileSync(routerPath, "utf-8");

    // No refetch intervals in router
    expect(content).not.toContain("refetchInterval:");
    expect(content).not.toContain("refetchIntervalInBackground:");

    // Window focus refetch disabled to prevent background network flooding
    expect(content).toContain("refetchOnWindowFocus: false");

    // Stale time set for instant cache-first navigation
    expect(content).toContain("staleTime: 5 * 60 * 1000");
  });

  it("Order and Table queries have zero refetchInterval auto-refresh loops", () => {
    const ordersPath = path.resolve(__dirname, "../usePosOrders.ts");
    const ordersContent = fs.readFileSync(ordersPath, "utf-8");
    expect(ordersContent).not.toContain("refetchInterval:");

    const tablesPath = path.resolve(__dirname, "../usePosTables.ts");
    const tablesContent = fs.readFileSync(tablesPath, "utf-8");
    expect(tablesContent).not.toContain("refetchInterval:");

    const dashPath = path.resolve(__dirname, "../usePosDashboard.ts");
    const dashContent = fs.readFileSync(dashPath, "utf-8");
    expect(dashContent).not.toContain("refetchInterval:");
  });

  it("PosKotManager removes background polling setInterval and provides on-demand Sync button", () => {
    const kotPath = path.resolve(__dirname, "../../../components/shared/pos/orders/PosKotManager.tsx");
    const kotContent = fs.readFileSync(kotPath, "utf-8");

    // No 4-second setInterval refetch
    expect(kotContent).not.toContain("setInterval(() => refetch(), 4000)");

    // Manual on-demand sync is available
    expect(kotContent).toContain("handleManualSync");
    expect(kotContent).toContain("RefreshCw");
  });

  it("vite.config.ts configures vendor manualChunks to optimize JS bundle loading", () => {
    const vitePath = path.resolve(__dirname, "../../../../vite.config.ts");
    const viteContent = fs.readFileSync(vitePath, "utf-8");

    expect(viteContent).toContain("manualChunks");
    expect(viteContent).toContain("vendor-core");
    expect(viteContent).toContain("vendor-charts");
    expect(viteContent).toContain("vendor-icons");
  });
});
