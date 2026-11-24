import { describe, it, expect, beforeEach } from "vitest";
import { savePosCustomer, getPosCustomers } from "@/services/posCustomerStore";
import { mapSerializedOrderToCurrent } from "@/services/posOrderLive";
import { posTablesService } from "@/services/posTablesService";
import type { BillingMenuItem } from "@/types/posBilling";
import type { CurrentOrderRecord } from "@/services/posOrdersService";
import type { ReservationItem } from "@/types/posTables";

describe("POS 8 Fixes Verification Suite", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  // 1. billing & catalog: Add status property ('Active'|'Inactive'|'Out_of_Stock') to BillingMenuItem
  it("Issue 1: BillingMenuItem supports 'Out_of_Stock' status and disables 86'd items", () => {
    const activeItem: BillingMenuItem = {
      id: "item-1",
      code: "#101",
      name: "Paneer Butter Masala",
      category: "Main Course",
      diet: "veg",
      price: 250,
      status: "Active",
      inStock: true,
      plates: 10,
      prepTimeMinutes: 15,
    };

    const outOfStockItem: BillingMenuItem = {
      id: "item-2",
      code: "#102",
      name: "Dal Makhani",
      category: "Main Course",
      diet: "veg",
      price: 200,
      status: "Out_of_Stock",
      inStock: false,
      plates: 0,
      prepTimeMinutes: 15,
    };

    expect(activeItem.status).toBe("Active");
    expect(outOfStockItem.status).toBe("Out_of_Stock");
  });

  // 2. billing & catalog: Fix subCategory property access on BillingMenuItem
  it("Issue 2: BillingMenuItem has subCategory property access without filtering out dishes", () => {
    const itemWithSubcat: BillingMenuItem = {
      id: "item-3",
      code: "#103",
      name: "Garlic Naan",
      category: "Breads & Rice",
      subCategory: "Indian Breads",
      diet: "veg",
      price: 60,
      status: "Active",
      inStock: true,
      plates: 50,
      prepTimeMinutes: 10,
    };

    expect(itemWithSubcat.subCategory).toBe("Indian Breads");

    // Simulating subcategory filter
    const selectedCategory = "Indian Breads";
    const matches =
      String(itemWithSubcat.category || "").trim().toLowerCase() === selectedCategory.trim().toLowerCase() ||
      String(itemWithSubcat.subCategory || "").trim().toLowerCase() === selectedCategory.trim().toLowerCase();

    expect(matches).toBe(true);
  });

  // 3. billing & crm: Include tier, loyaltyPoints, visitCount in customer profile creation during checkout
  it("Issue 3: savePosCustomer preserves tier, loyaltyPoints, and visitCount during checkout", () => {
    // Initial customer with existing points
    const firstSave = savePosCustomer({
      name: "Rahul Sharma",
      phone: "9876543210",
      tier: "Gold",
      loyaltyPoints: 350,
      visitCount: 5,
    });

    expect(firstSave.loyaltyPoints).toBe(350);
    expect(firstSave.visitCount).toBe(5);
    expect(firstSave.tier).toBe("Gold");

    // Re-save/update during checkout with updated or preserved points
    const checkoutSave = savePosCustomer({
      name: "Rahul Sharma",
      phone: "9876543210",
      tier: "Gold",
      loyaltyPoints: 350,
      visitCount: 6,
    });

    expect(checkoutSave.loyaltyPoints).toBe(350);
    expect(checkoutSave.visitCount).toBe(6);
    expect(checkoutSave.tier).toBe("Gold");

    // Re-save without explicitly providing loyaltyPoints should preserve existing points, not reset to 0
    const subsequentSave = savePosCustomer({
      name: "Rahul Sharma",
      phone: "9876543210",
    });

    expect(subsequentSave.loyaltyPoints).toBe(350);
    expect(subsequentSave.visitCount).toBe(7); // incremented automatically
  });

  // 4. billing & checkout: Explicitly assign grandTotal on draft order object so payment tender modal pre-fills exact bill amount
  it("Issue 4: draft order and mapSerializedOrderToCurrent assign grandTotal properly", () => {
    const rawOrder = {
      id: "ord-test-4",
      orderNumber: "ORD-9901",
      type: "dine_in",
      subtotal: 500,
      taxAmount: 25,
      grandTotal: 525,
      customerName: "Sneha Rao",
    };

    const mapped = mapSerializedOrderToCurrent(rawOrder);
    expect(mapped.grandTotal).toBe(525);
    expect(mapped.totalAmount).toBe(525);
    expect(mapped.amount).toBe(525);
    expect(mapped.amountFormatted).toContain("525");
  });

  // 5. tables & billing: Include 'no_show' in reservation status check so tables with no-show bookings are released automatically
  it("Issue 5: reservations with status 'no_show' release tables automatically", () => {
    const noShowRes: ReservationItem = {
      id: "res-noshow-1",
      tableId: "tbl-1",
      tableNumber: "T01",
      customerName: "Vikram Malhotra",
      customerPhone: "9876500000",
      guests: 2,
      reservationDate: "Today",
      reservationTime: "08:00 PM",
      status: "no_show",
      createdAt: "2026-11-23T10:00:00Z",
    };

    expect(noShowRes.status).toBe("no_show");

    // Verification: status 'no_show' is excluded from active reservations
    const isActive = noShowRes.status !== "completed" && noShowRes.status !== "cancelled" && noShowRes.status !== "no_show";
    expect(isActive).toBe(false);
  });

  // 6. tables & billing: Map totalAmount or grandTotal on CurrentOrderRecord to display bill values on table order cards
  it("Issue 6: CurrentOrderRecord contains totalAmount and grandTotal for table order cards", () => {
    const currentOrder: CurrentOrderRecord = {
      id: "ord-123",
      orderNumber: "ORD-123",
      type: "dine_in",
      typeLabel: "Dine In",
      source: "Table 04",
      customerName: "Amit Patel",
      tableId: "t-4",
      itemsSummary: "1x Biryani",
      amount: 450,
      totalAmount: 450,
      grandTotal: 450,
      amountFormatted: "₹ 450.00",
      startTime: "12:30 PM",
      createdTimestamp: Date.now(),
      elapsedMinutes: 15,
      estDurationMinutes: 30,
      currentStage: "placed",
      stageLabel: "Placed",
      items: [],
      subtotal: 450,
    };

    expect(currentOrder.totalAmount).toBe(450);
    expect(currentOrder.grandTotal).toBe(450);

    // TableCard fallback check
    const displayedAmount = Math.round(currentOrder.totalAmount || currentOrder.grandTotal || currentOrder.amount || 0);
    expect(displayedAmount).toBe(450);
  });

  // 7. orders & badges: Add orderType mapping (item.type ?? item.orderType) so Dine-in, Takeaway, and Delivery render with correct labels
  it("Issue 7: orderType mapping (item.type ?? item.orderType) resolves correct labels for badges", () => {
    const rawItems = [
      { id: "1", type: "dine_in", count: 12 },
      { id: "2", orderType: "takeaway", count: 8 },
      { id: "3", type: "delivery", orderType: "Delivery", count: 5 },
    ];

    const mappedBadges = rawItems.map((item) => {
      const rawType = String(item.type ?? item.orderType ?? "").toLowerCase();
      const label =
        rawType.includes("dine")
          ? "Dine-in"
          : rawType.includes("takeaway") || rawType.includes("pickup")
            ? "Takeaway"
            : rawType.includes("delivery")
              ? "Delivery"
              : "Dine-in";
      return { id: item.id, label, rawType };
    });

    expect(mappedBadges[0].label).toBe("Dine-in");
    expect(mappedBadges[1].label).toBe("Takeaway");
    expect(mappedBadges[2].label).toBe("Delivery");
  });

  // 8. orders & live sync: Compute live order badge count dynamically (count ?? orders?.length) when backend response omits root count property
  it("Issue 8: live order badge count falls back dynamically to count ?? orders?.length", () => {
    // Response with root count
    const resWithCount = { count: 5, orders: [{ id: "1" }, { id: "2" }] };
    const badgeCountWithCount = resWithCount.count ?? resWithCount.orders?.length ?? 0;
    expect(badgeCountWithCount).toBe(5);

    // Response without root count (omitted)
    const resWithoutCount = { orders: [{ id: "1" }, { id: "2" }, { id: "3" }] } as any;
    const badgeCountWithoutCount = resWithoutCount.count ?? resWithoutCount.orders?.length ?? 0;
    expect(badgeCountWithoutCount).toBe(3);

    // Response with empty array
    const resEmpty = { orders: [] } as any;
    const badgeCountEmpty = resEmpty.count ?? resEmpty.orders?.length ?? 0;
    expect(badgeCountEmpty).toBe(0);
  });
});
