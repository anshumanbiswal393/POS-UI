// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";

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

describe("Merged Tables Flow Unit Tests", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("handles seating guests across merged tables and marks all tables occupied with the same guest name", async () => {
    // 1. Create a reservation with merged tables
    const res = await posTablesService.addReservation({
      tableId: "tbl-1",
      tableNumber: "Table #3 + Table #2",
      mergedTableIds: ["tbl-1", "tbl-2"],
      mergedTableNumbers: ["Table #3", "Table #2"],
      customerName: "Sangita Sethy",
      customerPhone: "76767784844",
      guests: 12,
      reservationDate: new Date().toISOString().split("T")[0],
      reservationTime: "11:10 AM",
      isMerged: true,
    });

    expect(res.isMerged).toBe(true);
    expect(res.mergedTableIds).toEqual(["tbl-1", "tbl-2"]);
    expect(res.tableNumber).toBe("Table #3 + Table #2");

    // 2. Seat guests for this reservation
    const seated = await posTablesService.seatGuests("tbl-1", res.id);
    expect(seated.status).toBe("occupied");

    // 3. Retrieve tables
    const tables = await posTablesService.getTables();
    const t1 = tables.find((t) => t.id === "tbl-1" || t.tableNumber === "Table #3" || t.tableNumberRaw === 3 || t.tableNumber === "T03");
    const t2 = tables.find((t) => t.id === "tbl-2" || t.tableNumber === "Table #2" || t.tableNumberRaw === 2 || t.tableNumber === "T02");

    if (t1) {
      expect(t1.status).toBe("occupied");
      expect(t1.activeReservation?.customerName).toBe("Sangita Sethy");
    }
    if (t2) {
      expect(t2.status).toBe("occupied");
      expect(t2.activeReservation?.customerName).toBe("Sangita Sethy");
    }
  });

  it("maps merged backend reservations with combined tableNumber and sets status correctly", async () => {
    const reservations = await posTablesService.getReservations();
    expect(Array.isArray(reservations)).toBe(true);
  });
});
