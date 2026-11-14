import { describe, it, expect } from "vitest";
import type { MenuItem } from "@/types/posMenu";

describe("POS Menu Meal-Time Categories & Filtering Logic", () => {
  const sampleItems: MenuItem[] = [
    {
      id: "1",
      outletId: "out-1",
      name: "Chicken Biryani",
      code: "CB-01",
      category: "Rice",
      itemType: "Non-Veg",
      price: 280,
      taxRate: 5,
      status: "Active",
      mealTimes: ["Lunch", "Dinner"],
      images: [],
      updatedAt: "Today",
    },
    {
      id: "2",
      outletId: "out-1",
      name: "Masala Dosa",
      code: "MD-01",
      category: "Breakfast",
      itemType: "Veg",
      price: 90,
      taxRate: 5,
      status: "Active",
      mealTimes: ["Breakfast"],
      images: [],
      updatedAt: "Today",
    },
    {
      id: "3",
      outletId: "out-1",
      name: "Egg Biryani",
      code: "EB-01",
      category: "Rice",
      itemType: "Egg",
      price: 240,
      taxRate: 5,
      status: "Active",
      mealTimes: ["Lunch", "Dinner"],
      images: [],
      updatedAt: "Today",
    },
    {
      id: "4",
      outletId: "out-1",
      name: "Tea",
      code: "BV-01",
      category: "Beverages",
      itemType: "Veg",
      price: 25,
      taxRate: 5,
      status: "Active",
      mealTimes: ["Breakfast", "Lunch"],
      images: [],
      updatedAt: "Today",
    },
    {
      id: "5",
      outletId: "out-1",
      name: "Veg Thali",
      code: "VT-01",
      category: "Thali",
      itemType: "Veg",
      price: 180,
      taxRate: 5,
      status: "Active",
      mealTimes: ["Lunch"],
      images: [],
      updatedAt: "Today",
    },
    {
      id: "6",
      outletId: "out-1",
      name: "Coffee",
      code: "BV-02",
      category: "Beverages",
      itemType: "Veg",
      price: 35,
      taxRate: 5,
      status: "Active",
      mealTimes: ["Breakfast", "Dinner"],
      images: [],
      updatedAt: "Today",
    },
    {
      id: "7",
      outletId: "out-1",
      name: "Ice Cream",
      code: "DS-01",
      category: "Dessert",
      itemType: "Veg",
      price: 60,
      taxRate: 5,
      status: "Active",
      mealTimes: ["All Day"],
      images: [],
      updatedAt: "Today",
    },
    {
      id: "8",
      outletId: "out-1",
      name: "Legacy Dish",
      code: "LG-01",
      category: "Snacks",
      itemType: "Veg",
      price: 50,
      taxRate: 5,
      status: "Active",
      // No mealTimes defined (legacy data)
      images: [],
      updatedAt: "Today",
    },
  ];

  const isItemMatchingMealTime = (
    item: MenuItem,
    tab: "All" | "Breakfast" | "Lunch" | "Dinner",
  ): boolean => {
    if (tab === "All") return true;
    if (!item.mealTimes || !Array.isArray(item.mealTimes) || item.mealTimes.length === 0) {
      // Backward compatibility: existing items without meal-time assignments remain visible in all tabs!
      return true;
    }
    const normalized = item.mealTimes.map((m) => String(m).trim().toLowerCase());
    if (
      normalized.includes("all day") ||
      normalized.includes("allday") ||
      normalized.includes("all")
    ) {
      return true;
    }
    return normalized.includes(tab.toLowerCase());
  };

  it("filters items correctly for 'All' tab (shows all 8 items)", () => {
    const filtered = sampleItems.filter((i) => isItemMatchingMealTime(i, "All"));
    expect(filtered).toHaveLength(8);
  });

  it("filters items correctly for 'Breakfast' tab", () => {
    const filtered = sampleItems.filter((i) => isItemMatchingMealTime(i, "Breakfast"));
    const names = filtered.map((i) => i.name);
    // Masala Dosa, Tea, Coffee, Ice Cream (All Day), Legacy Dish (no mealTimes)
    expect(names).toContain("Masala Dosa");
    expect(names).toContain("Tea");
    expect(names).toContain("Coffee");
    expect(names).toContain("Ice Cream");
    expect(names).toContain("Legacy Dish");
    expect(names).not.toContain("Chicken Biryani");
    expect(names).not.toContain("Veg Thali");
  });

  it("filters items correctly for 'Lunch' tab", () => {
    const filtered = sampleItems.filter((i) => isItemMatchingMealTime(i, "Lunch"));
    const names = filtered.map((i) => i.name);
    // Chicken Biryani, Egg Biryani, Tea, Veg Thali, Ice Cream, Legacy Dish
    expect(names).toContain("Chicken Biryani");
    expect(names).toContain("Egg Biryani");
    expect(names).toContain("Tea");
    expect(names).toContain("Veg Thali");
    expect(names).toContain("Ice Cream");
    expect(names).toContain("Legacy Dish");
    expect(names).not.toContain("Masala Dosa");
  });

  it("filters items correctly for 'Dinner' tab", () => {
    const filtered = sampleItems.filter((i) => isItemMatchingMealTime(i, "Dinner"));
    const names = filtered.map((i) => i.name);
    // Chicken Biryani, Egg Biryani, Coffee, Ice Cream, Legacy Dish
    expect(names).toContain("Chicken Biryani");
    expect(names).toContain("Egg Biryani");
    expect(names).toContain("Coffee");
    expect(names).toContain("Ice Cream");
    expect(names).toContain("Legacy Dish");
    expect(names).not.toContain("Masala Dosa");
    expect(names).not.toContain("Veg Thali");
  });

  it("computes accurate meal-time count badges", () => {
    const counts = {
      All: sampleItems.length,
      Breakfast: sampleItems.filter((i) => isItemMatchingMealTime(i, "Breakfast")).length,
      Lunch: sampleItems.filter((i) => isItemMatchingMealTime(i, "Lunch")).length,
      Dinner: sampleItems.filter((i) => isItemMatchingMealTime(i, "Dinner")).length,
    };
    expect(counts.All).toBe(8);
    expect(counts.Breakfast).toBe(5);
    expect(counts.Lunch).toBe(6);
    expect(counts.Dinner).toBe(5);
  });
});
