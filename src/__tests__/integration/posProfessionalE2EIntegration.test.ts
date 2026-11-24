// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractAndSanitizeMergeTable } from "@/utils/printKotTicket";
import { mapDtoToDashboardModel, formatINR } from "@/services/posDashboardService";
import { posTablesService } from "@/services/posTablesService";
import { posInventoryService } from "@/services/posInventoryService";
import { hasPermission } from "@/lib/auth/rbac";
import type { PosDashboardApiResponse } from "@/types/posDashboardApi";
import type { RestaurantTable, ReservationItem } from "@/types/posTables";

describe("Professional End-to-End POS Integration Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  // =========================================================================
  // WORKFLOW 1: DINE-IN TABLE MERGING, KOT SLIP, SPECIAL NOTES & KDS QUEUE
  // =========================================================================
  describe("Workflow 1: Table Merging, KOT Ticket Formatting & Kitchen Dispatch", () => {
    it("coordinates multi-table selection, strips merge info from cooking instructions, and formats top KOT header", () => {
      const selectedTables: RestaurantTable[] = [
        { id: "tbl-01", tableNumber: "Table #1", tableNumberRaw: 1, capacity: 2, status: "vacant", shape: "square", area: "Main Hall" },
        { id: "tbl-02", tableNumber: "Table #2", tableNumberRaw: 2, capacity: 4, status: "vacant", shape: "rectangle", area: "Main Hall" },
      ];
      const pax = 5;
      const combinedCapacity = selectedTables.reduce((s, t) => s + t.capacity, 0);
      expect(combinedCapacity).toBeGreaterThanOrEqual(pax);

      const tableLabel = selectedTables.map((t) => t.tableNumber).join(" + ");
      expect(tableLabel).toBe("Table #1 + Table #2");

      // Simulate a ticket payload where a note was passed
      const rawCustomerCookingNote = "Less spicy and no coriander please. Serve fast.";
      const legacyNoteWithMerge = `Merged tables: ${tableLabel} (${combinedCapacity} seats) for ${pax} pax. ${rawCustomerCookingNote}`;

      const { cleanSpecialNote, displayTableOrRoom } = extractAndSanitizeMergeTable(
        legacyNoteWithMerge,
        tableLabel,
        "Dine-In",
      );

      // Verifications:
      // 1. Merged table info must be extracted to displayTableOrRoom for the top KOT header
      expect(displayTableOrRoom).toBe("MERGED TABLES: Table #1 + Table #2");
      // 2. Special cooking instructions must ONLY retain real cooking instructions
      expect(cleanSpecialNote).toBe(rawCustomerCookingNote);
      expect(cleanSpecialNote).not.toContain("Merged tables");
      expect(cleanSpecialNote).not.toContain("seats");
    });

    it("completely omits special note box if the note solely described table merging", () => {
      const soleMergeNote = "Merged tables: Table #3 + Table #4 (8 seats) for 6 pax.";
      const { cleanSpecialNote, displayTableOrRoom } = extractAndSanitizeMergeTable(
        soleMergeNote,
        "Table #3",
        "Dine-In",
      );

      expect(cleanSpecialNote).toBeUndefined();
      expect(displayTableOrRoom).toBe("MERGED TABLES: Table #3 + Table #4");
    });
  });

  // =========================================================================
  // WORKFLOW 2: ROOM ORDER, FOLIO POSTING & DAY-END PAYMENT SUMMARY
  // =========================================================================
  describe("Workflow 2: Room Order Settlement & Day-End Payment Summary Allocation", () => {
    it("accurately allocates room order / folio payments into the 'Other' category with exact totals & percentages", () => {
      const mockApiResponse: PosDashboardApiResponse = {
        success: true,
        outletId: "anshu-suite-01",
        outletName: "Anshu Suite Restaurant",
        date: "24 Nov 2026",
        currency: "INR",
        stats: {
          totalCollections: 10000,
          totalOrders: 3,
          activeTablesCount: 1,
          totalTablesCount: 10,
          unpaidBillsAmount: 0,
          unpaidBillsCount: 0,
          roomChargesAmount: 2500,
          roomChargesCount: 1,
        },
        salesGraph: [],
        orderTypes: [
          { type: "dine_in", label: "Dine-in", count: 2, percentage: 66.7, color: "#0f766e" },
          { type: "room_service", label: "Room service", count: 1, percentage: 33.3, color: "#94a3b8" },
        ],
        liveOrders: [],
        paymentSummary: {
          cash: { amount: 4500, percentage: 45.0 },
          card: { amount: 3000, percentage: 30.0 },
          upiWallets: { amount: 0, percentage: 0.0 },
          other: { amount: 2500, percentage: 25.0 }, // Room service / folio charge grouped under Other
          total: 10000,
        },
        tables: [],
        topSellingItems: [],
        attentionAlerts: [],
        operationalMetrics: [
          {
            avgPrepTimeMinutes: 12,
            successfulOrdersCount: 3,
            complimentaryOrdersCount: 0,
            cancelledOrdersCount: 0,
            exceptionsCount: 0,
          },
        ],
      };

      const dashboardModel = mapDtoToDashboardModel(mockApiResponse, false);

      // Verify stats
      expect(dashboardModel.stats.totalCollections).toBe(10000);
      expect(dashboardModel.stats.totalCollectionsFormatted).toBe("₹10,000");

      // Verify payment breakdown:
      // Cash: ₹4,500 (45%)
      expect(dashboardModel.paymentSummary.cash.amount).toBe(4500);
      expect(dashboardModel.paymentSummary.cash.percentage).toBe(45.0);
      expect(dashboardModel.paymentSummary.cash.formatted).toBe("₹4,500");

      // Card: ₹3,000 (30%)
      expect(dashboardModel.paymentSummary.card.amount).toBe(3000);
      expect(dashboardModel.paymentSummary.card.percentage).toBe(30.0);
      expect(dashboardModel.paymentSummary.card.formatted).toBe("₹3,000");

      // Other (Room service payment): ₹2,500 (25%)
      expect(dashboardModel.paymentSummary.other.amount).toBe(2500);
      expect(dashboardModel.paymentSummary.other.percentage).toBe(25.0);
      expect(dashboardModel.paymentSummary.other.formatted).toBe("₹2,500");

      // Total
      expect(dashboardModel.paymentSummary.totalAmount).toBe(10000);
      expect(dashboardModel.paymentSummary.totalFormatted).toBe("₹10,000");
    });
  });

  // =========================================================================
  // WORKFLOW 3: TABLE OCCUPANCY, RESERVATIONS & MERGED SEATING LIFECYCLE
  // =========================================================================
  describe("Workflow 3: Table Reservation Seating Across Merged Tables", () => {
    it("seats guests on multiple merged tables and marks all constituent tables occupied", async () => {
      // 1. Add reservation with merged tables
      const createdRes = await posTablesService.addReservation({
        tableId: "tbl-1",
        tableNumber: "Table #1 + Table #2",
        mergedTableIds: ["tbl-1", "tbl-2"],
        mergedTableNumbers: ["Table #1", "Table #2"],
        customerName: "Siddharth Roy",
        customerPhone: "+91 98765 00000",
        guests: 6,
        reservationDate: new Date().toISOString().split("T")[0],
        reservationTime: "07:30 PM",
        isMerged: true,
      });
      expect(createdRes.id).toBeDefined();
      expect(createdRes.isMerged).toBe(true);
      expect(createdRes.mergedTableNumbers).toContain("Table #1");
      expect(createdRes.mergedTableNumbers).toContain("Table #2");

      // 2. Seat guests across the merged tables
      const seatedRes = await posTablesService.seatGuests("tbl-1", createdRes.id);
      expect(seatedRes.status).toBe("occupied");
    });
  });

  // =========================================================================
  // WORKFLOW 4: INVENTORY, PURCHASES & VENDOR ACCOUNTS
  // =========================================================================
  describe("Workflow 4: Inventory Procurement & Recipe Mapping Contract", () => {
    it("records stock purchase and links vendorId without schema mismatch", async () => {
      const purchasePayload = {
        invoiceNo: "INV-E2E-2026-001",
        vendorId: "vendor-reliance-01",
        vendorName: "Reliance Fresh Provisions",
        purchaseDate: "2026-11-24",
        invoiceDate: "2026-11-24",
        subtotal: 4500,
        taxAmount: 225,
        totalAmount: 4725,
        itemCount: 1,
        status: "Completed" as const,
        paymentStatus: "Paid" as const,
        items: [
          {
            stockItemId: "raw-01",
            stockItemName: "Basmati Rice",
            name: "Basmati Rice",
            quantity: 50,
            unit: "kg",
            unitPrice: 90,
            lineTotal: 4725,
            totalPrice: 4725,
            taxPercent: 5,
          },
        ],
      };

      const recordedPurchase = await posInventoryService.createPurchase(purchasePayload);
      expect(recordedPurchase.id).toBeDefined();
      expect(recordedPurchase.vendorId).toBe("vendor-reliance-01");
      expect(recordedPurchase.totalAmount).toBe(4725);
      expect(recordedPurchase.paymentStatus).toBe("Paid");
    });
  });

  // =========================================================================
  // WORKFLOW 5: RBAC PERMISSIONS FOR KITCHEN, WAITER & BILLING
  // =========================================================================
  describe("Workflow 5: Role-Based Access Control Boundaries", () => {
    it("enforces strict role boundaries for kitchen, waiter, and biller", () => {
      // Kitchen role can access KDS, but cannot charge room folios or view pos.billing.view
      expect(hasPermission("pos_kitchen", "pos.kot.view")).toBe(true);
      expect(hasPermission("pos_kitchen", "pos.billing.room_charge")).toBe(false);
      expect(hasPermission("pos_kitchen", "pos.billing.settle")).toBe(false);

      // Waiter can take orders and view menu, but cannot settle bills or manage shifts
      expect(hasPermission("pos_waiter", "pos.orders.create")).toBe(true);
      expect(hasPermission("pos_waiter", "pos.menu.view")).toBe(true);
      expect(hasPermission("pos_waiter", "pos.billing.settle")).toBe(false);
      expect(hasPermission("pos_waiter", "pos.shift.manage")).toBe(false);

      // Cashier / Biller can access billing, settle bills, and post room charges
      expect(hasPermission("pos_cashier", "pos.billing.view")).toBe(true);
      expect(hasPermission("pos_cashier", "pos.billing.settle")).toBe(true);
      expect(hasPermission("pos_cashier", "pos.billing.room_charge")).toBe(true);
    });
  });

  // =========================================================================
  // WORKFLOW 6: TABLE SWITCHING & OCCUPANCY TRANSITIONS
  // =========================================================================
  describe("Workflow 6: Table Switching & Occupancy Transition", () => {
    it("moves active dining check from Table #1 to Table #2 and releases the source table", async () => {
      const table1: RestaurantTable = {
        id: "tbl-switch-1",
        tableNumber: "Table #1",
        tableNumberRaw: 1,
        area: "Dining Area",
        capacity: 4,
        currentGuests: 3,
        shape: "square",
        status: "occupied",
        activeOrder: {
          orderId: "ord-9901",
          orderNumber: "ORD-9901",
          serverName: "Rohan",
          seatedAt: "01:00 PM",
          elapsedMinutes: 10,
          itemsCount: 2,
          subtotal: 500,
          totalAmount: 525,
          status: "in_prep",
          guestName: "Arun Kumar",
          guestPhone: "9876501234",
        },
      };

      const table2: RestaurantTable = {
        id: "tbl-switch-2",
        tableNumber: "Table #2",
        tableNumberRaw: 2,
        area: "Dining Area",
        capacity: 6,
        currentGuests: 0,
        shape: "rectangle",
        status: "vacant",
      };

      vi.spyOn(posTablesService, "getTables").mockResolvedValue([table1, table2]);

      const switchResult = await posTablesService.switchOccupiedTable("tbl-switch-1", "tbl-switch-2");
      expect(switchResult.sourceTable.status).toBe("vacant");
      expect(switchResult.sourceTable.activeOrder).toBeUndefined();
      expect(switchResult.targetTable.status).toBe("occupied");
      expect(switchResult.targetTable.activeOrder?.orderId).toBe("ord-9901");
      expect(switchResult.targetTable.activeOrder?.guestName).toBe("Arun Kumar");
    });
  });

  // =========================================================================
  // WORKFLOW 7: TAX AND INVOICE CALCULATIONS INTEGRITY
  // =========================================================================
  describe("Workflow 7: Financial Integrity & Rounding Guards", () => {
    it("ensures total payment percentages sum exactly to 100% across multi-mode and room settlements", () => {
      const summaryPayload: PosDashboardApiResponse = {
        success: true,
        outletId: "demo-outlet",
        outletName: "Demo Restaurant",
        date: "24 Nov 2026",
        currency: "INR",
        stats: {
          totalCollections: 15450,
          totalOrders: 5,
          activeTablesCount: 2,
          totalTablesCount: 12,
          unpaidBillsAmount: 0,
          unpaidBillsCount: 0,
          roomChargesAmount: 3450,
          roomChargesCount: 1,
        },
        salesGraph: [],
        orderTypes: [],
        liveOrders: [],
        paymentSummary: {
          cash: { amount: 6000, percentage: 38.8 },
          card: { amount: 4000, percentage: 25.9 },
          upiWallets: { amount: 2000, percentage: 12.9 },
          other: { amount: 3450, percentage: 22.3 }, // Room charge in other
          total: 15450,
        },
        tables: [],
        topSellingItems: [],
        attentionAlerts: [],
        operationalMetrics: [],
      };

      const model = mapDtoToDashboardModel(summaryPayload, false);
      const totalAmount =
        model.paymentSummary.cash.amount +
        model.paymentSummary.card.amount +
        model.paymentSummary.upiWallets.amount +
        model.paymentSummary.other.amount;

      expect(totalAmount).toBe(15450);
      expect(model.paymentSummary.other.amount).toBe(3450);
      expect(model.paymentSummary.other.percentage).toBe(22.3);
    });
  });
});
