// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => { storageMap.set(k, String(v)); },
  removeItem: (k: string) => { storageMap.delete(k); },
  clear: () => { storageMap.clear(); },
  get length() { return storageMap.size; },
  key: (i: number) => Array.from(storageMap.keys())[i] ?? null,
};
if (typeof globalThis.localStorage === "undefined" || !globalThis.localStorage?.clear) {
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
}

import { posTablesService } from "@/services/posTablesService";
import type { RestaurantTable } from "@/types/posTables";

describe("Switch Table & Occupancy Lifecycle Unit Tests", () => {
  const mockTable1: RestaurantTable = {
    id: "tbl-1",
    tableNumber: "Table #1",
    tableNumberRaw: 1,
    capacity: 4,
    currentGuests: 4,
    shape: "square",
    area: "Dining Area",
    status: "occupied",
    activeOrder: {
      orderId: "ord-1001",
      orderNumber: "ORD-1001",
      serverName: "Captain Jack",
      seatedAt: "12:30 PM",
      elapsedMinutes: 15,
      itemsCount: 3,
      subtotal: 750,
      totalAmount: 787.5,
      status: "in_prep",
      guestName: "Manoranjan Sahoo",
      guestPhone: "9876543210",
    },
  };

  const mockTable2: RestaurantTable = {
    id: "tbl-2",
    tableNumber: "Table #2",
    tableNumberRaw: 2,
    capacity: 6,
    currentGuests: 0,
    shape: "rectangle",
    area: "Dining Area",
    status: "vacant",
  };

  beforeEach(async () => {
    localStorage.clear();
    vi.clearAllMocks();
    // Seed store with initial tables
    vi.spyOn(posTablesService, "getTables").mockResolvedValue([mockTable1, mockTable2]);
  });

  it("successfully transfers dining session and active order from source to target table", async () => {
    const result = await posTablesService.switchOccupiedTable("tbl-1", "tbl-2");

    // Source table must be vacant and free of active order
    expect(result.sourceTable.status).toBe("vacant");
    expect(result.sourceTable.activeOrder).toBeUndefined();
    expect(result.sourceTable.currentGuests).toBe(0);

    // Target table must now be occupied with the active order
    expect(result.targetTable.status).toBe("occupied");
    expect(result.targetTable.activeOrder).toBeDefined();
    expect(result.targetTable.activeOrder?.orderId).toBe("ord-1001");
    expect(result.targetTable.activeOrder?.guestName).toBe("Manoranjan Sahoo");
  });

  it("rejects switching to an already occupied table", async () => {
    vi.spyOn(posTablesService, "getTables").mockResolvedValue([
      mockTable1,
      { ...mockTable2, status: "occupied" },
    ]);

    await expect(posTablesService.switchOccupiedTable("tbl-1", "tbl-2")).rejects.toThrow(
      "already occupied",
    );
  });

  it("vacates table and releases occupancy cleanly when payment is completed", async () => {
    // Vacate table after payment settlement
    const vacated = await posTablesService.vacateTable("tbl-1");
    expect(vacated.status).toBe("vacant");
    expect(vacated.activeOrder).toBeUndefined();
    expect(vacated.currentGuests).toBe(0);
  });
});
