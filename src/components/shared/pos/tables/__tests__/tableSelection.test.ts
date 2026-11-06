// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  findBestTableSelection,
  findOptimalMergeIds,
  tableCapacitySum,
} from "../TableOrderWizardModal";
import type { RestaurantTable } from "@/types/posTables";

function mockTable(id: string, num: string, capacity: number): RestaurantTable {
  return {
    id,
    tableNumber: num,
    tableNumberRaw: parseInt(num.replace(/\D/g, "") || "1", 10),
    capacity,
    shape: "rectangle",
    area: "Indoor",
    status: "vacant",
  };
}

describe("Table Selection & Dynamic Merge Logic", () => {
  const sampleTables: RestaurantTable[] = [
    mockTable("t21", "Table #21", 2),
    mockTable("t22", "Table #22", 2),
    mockTable("t23", "Table #23", 2),
    mockTable("t24", "Table #24", 2),
    mockTable("t11", "Table #11", 4),
    mockTable("t12", "Table #12", 4),
    mockTable("t13", "Table #13", 12),
  ];

  it("chooses exact single table matching pax when available (2 pax)", () => {
    const result = findBestTableSelection(sampleTables, 2);
    expect(result.isMerge).toBe(false);
    expect(result.tableIds).toEqual(["t21"]);
  });

  it("chooses exact single table matching pax when available (4 pax)", () => {
    const result = findBestTableSelection(sampleTables, 4);
    expect(result.isMerge).toBe(false);
    expect(result.tableIds).toEqual(["t11"]);
  });

  it("chooses exact single table matching pax when available (12 pax)", () => {
    const result = findBestTableSelection(sampleTables, 12);
    expect(result.isMerge).toBe(false);
    expect(result.tableIds).toEqual(["t13"]);
  });

  it("picks closest single table for intermediate pax (3 pax -> 4-seater)", () => {
    const result = findBestTableSelection(sampleTables, 3);
    expect(result.isMerge).toBe(false);
    expect(result.tableIds).toEqual(["t11"]);
  });

  it("picks 2-seater table for 1 pax without merging", () => {
    const result = findBestTableSelection(sampleTables, 1);
    expect(result.isMerge).toBe(false);
    expect(result.tableIds).toEqual(["t21"]);
  });

  it("preserves preferred table if its capacity matches target pax", () => {
    const result = findBestTableSelection(sampleTables, 4, "t12");
    expect(result.isMerge).toBe(false);
    expect(result.tableIds).toEqual(["t12"]);
  });

  it("handles very large pax by merging sufficient tables (20 pax)", () => {
    const result = findBestTableSelection(sampleTables, 20);
    expect(result.isMerge).toBe(true);
    const totalCapacity = tableCapacitySum(sampleTables, result.tableIds);
    expect(totalCapacity).toBeGreaterThanOrEqual(20);
  });

  it("merges tables when pax is large and exceeds largest single table (14 pax -> 12 + 2)", () => {
    const result = findBestTableSelection(sampleTables, 14);
    expect(result.isMerge).toBe(true);
    expect(result.tableIds.length).toBe(2);
    const totalCapacity = tableCapacitySum(sampleTables, result.tableIds);
    expect(totalCapacity).toBe(14);
    expect(result.tableIds).toContain("t13"); // 12-seater
  });

  it("merges tables for 6 pax instead of wasting a 12-seater (4 + 2 = 6)", () => {
    const result = findBestTableSelection(sampleTables, 6);
    expect(result.isMerge).toBe(true);
    const totalCapacity = tableCapacitySum(sampleTables, result.tableIds);
    expect(totalCapacity).toBe(6);
  });

  it("merges tables for 8 pax (4 + 4 = 8)", () => {
    const result = findBestTableSelection(sampleTables, 8);
    expect(result.isMerge).toBe(true);
    const totalCapacity = tableCapacitySum(sampleTables, result.tableIds);
    expect(totalCapacity).toBe(8);
    expect(result.tableIds).toContain("t11");
    expect(result.tableIds).toContain("t12");
  });

  it("findOptimalMergeIds handles edge case where total available < targetPax", () => {
    const smallTables = [mockTable("t1", "T1", 2), mockTable("t2", "T2", 2)];
    const merged = findOptimalMergeIds(smallTables, 10);
    expect(merged).toEqual(["t1", "t2"]);
  });

  it("correctly computes tableCapacitySum", () => {
    const sum = tableCapacitySum(sampleTables, ["t11", "t12", "t13"]);
    expect(sum).toBe(4 + 4 + 12);
  });
});
