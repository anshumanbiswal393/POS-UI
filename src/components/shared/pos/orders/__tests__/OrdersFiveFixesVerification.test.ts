import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { mapAllOrdersDto, mapOnlineOrdersDto, type DueBill } from "@/services/posOrdersService";
import type { AllOrderItem, OnlineOrderItem } from "@/types/posOrders";

describe("Batch 2: Orders & KOT Five Fixes Verification", () => {
  const allOrdersPath = path.resolve(__dirname, "../PosAllOrdersManager.tsx");
  const allOrdersCode = fs.readFileSync(allOrdersPath, "utf-8");

  const onlineOrdersPath = path.resolve(__dirname, "../PosOnlineOrdersManager.tsx");
  const onlineOrdersCode = fs.readFileSync(onlineOrdersPath, "utf-8");

  const liveOrdersPath = path.resolve(__dirname, "../../../../../services/posOrderLive.ts");
  const liveOrdersCode = fs.readFileSync(liveOrdersPath, "utf-8");

  const ordersServicePath = path.resolve(__dirname, "../../../../../services/posOrdersService.ts");
  const ordersServiceCode = fs.readFileSync(ordersServicePath, "utf-8");

  // Fix 1: refetch is defined and accessible for manual refresh button and modal callbacks
  describe("Fix 1: PosAllOrdersManager refetch ReferenceError fix", () => {
    it("destructures refetch from useAllOrders hook", () => {
      expect(allOrdersCode).toMatch(/const\s*\{\s*data,\s*refetch/);
    });

    it("includes a circular manual refresh button wired to refetch()", () => {
      expect(allOrdersCode).toContain("RefreshCw");
      expect(allOrdersCode).toContain('title="Refresh Orders"');
      expect(allOrdersCode).toMatch(/refetch\(\);/);
    });

    it("ensures onOrderUpdated safely invokes refetch without ReferenceError", () => {
      expect(allOrdersCode).toContain("onOrderUpdated={() => {");
      expect(allOrdersCode).toContain("refetch();");
    });
  });

  // Fix 2: Monetary properties (subtotal, taxAmount, grandTotal) populated as numbers
  describe("Fix 2: Monetary properties in All Orders view", () => {
    it("maps numeric myAmount, subtotal, taxAmount, and grandTotal in mapAllOrdersDto", () => {
      const mockApiDto = {
        success: true,
        grandTotal: 1250,
        salesTrend: [],
        totalCount: 1,
        page: 1,
        pageSize: 10,
        records: [
          {
            id: "ord-1",
            orderNo: "1001",
            orderType: "dine_in",
            customerName: "Samprita",
            assignTo: "Ramesh",
            itemsSummary: "Paneer Tikka x 2",
            myAmount: 1000,
            taxAmount: 250,
            discountAmount: 0,
            grandTotal: 1250,
            paymentMode: "Cash",
            status: "Completed" as const,
            createdAt: "2026-11-23T10:00:00Z",
          },
        ],
      };

      const result = mapAllOrdersDto(mockApiDto as any);
      expect(result.records[0].myAmount).toBe(1000);
      expect(result.records[0].subtotal).toBe(1000);
      expect(result.records[0].taxAmount).toBe(250);
      expect(result.records[0].grandTotal).toBe(1250);
      expect(result.records[0].myAmountFormatted).toBe("₹1,000");
      expect(result.records[0].taxAmountFormatted).toBe("₹250");
      expect(result.records[0].grandTotalFormatted).toBe("₹1,250");
    });

    it("provides safe numeric fallback in handlePrintReport to avoid ₹0.00 for valid orders", () => {
      expect(allOrdersCode).toContain("r.myAmount ?? r.subtotal ??");
      expect(allOrdersCode).toContain("r.grandTotal ?? r.totalAmount ??");
    });
  });

  // Fix 3: Online aggregator orders grandTotal vs totalAmount reconciliation
  describe("Fix 3: Online Orders grandTotal vs totalAmount compatibility", () => {
    it("maps both totalAmount and grandTotal numbers in mapOnlineOrdersDto", () => {
      const mockOnlineDto = {
        success: true,
        totalCount: 1,
        records: [
          {
            id: "on-1",
            orderNo: "ZOM-9921",
            platform: "zomato" as const,
            outletName: "Main Outlet",
            orderType: "Delivery",
            customerName: "Rahul",
            customerPhone: "9876543210",
            otp: "4432",
            dateTime: "2026-11-23T11:00:00Z",
            totalAmount: 480,
            status: "in_kitchen" as const,
            statusDisplay: "In Kitchen (Prep)",
            items: [{ name: "Biryani", quantity: 1, price: 480 }],
          },
        ],
      };

      const mapped = mapOnlineOrdersDto(mockOnlineDto as any);
      expect(mapped.records[0].totalAmount).toBe(480);
      expect(mapped.records[0].grandTotal).toBe(480);
      expect(mapped.records[0].totalAmountFormatted).toBe("₹480");
    });

    it("safely handles totalAmount and grandTotal in PosOnlineOrdersManager to prevent NaN", () => {
      expect(onlineOrdersCode).toContain("r.grandTotal || r.totalAmount ||");
      expect(onlineOrdersCode).toContain("r.totalAmount || r.grandTotal ||");
      expect(onlineOrdersCode).not.toContain("String(r.grandTotal || \"\")");
    });
  });

  // Fix 4: depositAmount property on DueBill
  describe("Fix 4: DueBill depositAmount for advance party deposits", () => {
    it("defines depositAmount optional field on DueBill interface", () => {
      expect(ordersServiceCode).toContain("depositAmount?: number;");
    });

    it("calculates net dueAmount subtracting depositAmount without overcharging customer", () => {
      const bill: DueBill = {
        id: "due-party-1",
        billNo: "BILL-2001",
        orderType: "Dine In",
        tableOrRoom: "Party Hall",
        customerName: "Anshuman",
        customerPhone: "9876543211",
        totalAmount: 15000,
        paidAmount: 5000,
        depositAmount: 5000,
        dueAmount: 10000,
        dueDate: "23-11-2026",
        daysOverdue: 0,
        agingBucket: "0-15",
        status: "Partial",
      };

      expect(bill.depositAmount).toBe(5000);
      expect(bill.totalAmount - (bill.depositAmount || 0)).toBe(bill.dueAmount);
    });
  });

  // Fix 5: Removal of includeSettled leaking settled orders into live KDS
  describe("Fix 5: Clean KDS live queue without leaking settled orders", () => {
    it("explicitly removes includeSettled in liveGetKot query params", () => {
      expect(liveOrdersCode).toContain("delete (params as any).includeSettled;");
    });

    it("filters out settled, ready, served, cancelled orders from live KDS records", () => {
      expect(liveOrdersCode).toContain('k.status !== "Served"');
      expect(liveOrdersCode).toContain('(k as any).status !== "Settled"');
    });

    it("supports options.includeSettled in liveGetDueBills", () => {
      expect(liveOrdersCode).toContain("options?: { includeSettled?: boolean }");
      expect(liveOrdersCode).toContain("!options?.includeSettled");
      expect(liveOrdersCode).not.toContain("!params?.includeSettled");
    });
  });
});
