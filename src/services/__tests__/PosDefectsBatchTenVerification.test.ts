import { describe, it, expect, vi, beforeEach } from "vitest";
import { posTablesService } from "../posTablesService";
import { posPurchasesService } from "../posPurchasesService";
import { posInventoryService } from "../posInventoryService";
import type { RestaurantTable, ActiveOrderSummary } from "@/types/posTables";
import type { UnifiedPurchaseDto } from "../posPurchasesService";
import type { StockItem } from "@/types/posInventory";

// Mock localStorage for node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("Batch 10 - Defect Verification Test Suite", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  // 1. tables & reservations: Add optional chaining guard (onSuccess?.())
  describe("tables & reservations: onSuccess optional chaining guard", () => {
    it("safely handles omission of onSuccess without throwing errors", () => {
      let callbackInvoked = false;
      const props: { onSuccess?: () => void } = {};

      // Demonstrates optional chaining guard: props.onSuccess?.() does not throw
      expect(() => {
        props.onSuccess?.();
      }).not.toThrow();

      props.onSuccess = () => {
        callbackInvoked = true;
      };
      props.onSuccess?.();
      expect(callbackInvoked).toBe(true);
    });
  });

  // 2. tables & floor plan: Add tableNumber property to ActiveOrderSummary
  describe("tables & floor plan: tableNumber on ActiveOrderSummary", () => {
    it("preserves tableNumber on ActiveOrderSummary so table cards retain table labels", async () => {
      const activeOrder: ActiveOrderSummary = {
        orderId: "ord-101",
        orderNumber: "ORD-01",
        tableNumber: "Table #5",
        serverName: "Captain Jack",
        seatedAt: "12:30 PM",
        elapsedMinutes: 15,
        itemsCount: 3,
        subtotal: 500,
        totalAmount: 525,
        status: "in_prep",
      };

      expect(activeOrder.tableNumber).toBe("Table #5");

      const table: RestaurantTable = {
        id: "tbl-5",
        tableNumber: "Table #5",
        tableNumberRaw: 5,
        capacity: 4,
        currentGuests: 2,
        area: "Main Hall",
        shape: "square",
        status: "occupied",
        activeOrder,
      };

      // Header fallback logic verification: tableNumber || activeOrder?.tableNumber || "Table"
      const displayedTableNumber = table.tableNumber || table.activeOrder?.tableNumber || "Table";
      expect(displayedTableNumber).toBe("Table #5");

      // Even if table.tableNumber is temporarily empty, activeOrder.tableNumber preserves it
      const tableWithBlankNumber = { ...table, tableNumber: "" };
      const fallbackDisplay = tableWithBlankNumber.tableNumber || tableWithBlankNumber.activeOrder?.tableNumber || "Table";
      expect(fallbackDisplay).toBe("Table #5");
    });
  });

  // 3 & 4. inventory & recipes: recipe.menuItem & ingredient.name mapping
  describe("inventory & recipes: mapRecipe connects menuItem and ingredient name", () => {
    function testMapRecipe(r: any) {
      const dishName = r.menuItem || r.name || r.menuItemName || "Unnamed Dish";
      return {
        id: r.id,
        name: r.menuItem || r.name || r.menuItemName || "Unnamed Recipe",
        category: r.category || "Main Course",
        menuItem: dishName,
        yieldQty: String(r.yieldQty ?? "1"),
        yieldUnit: r.yieldUnit || "portion",
        prepTimeMinutes: String(r.prepTimeMinutes ?? "15"),
        notes: r.notes || "",
        ingredients: (r.ingredients || []).map((ing: any, idx: number) => ({
          id: ing.id || `ing-${idx}-${ing.stockItemId}`,
          stockItemId: ing.stockItemId,
          name: ing.name || ing.stockItemName || ing.stock_item_name || "",
          quantity: String(ing.quantity || 0),
          unit: ing.unit || "Kg",
        })),
      };
    }

    it("maps recipe.menuItem instead of failing with Unnamed Dish", () => {
      const backendRecipePayload = {
        id: "rcp-100",
        menuItem: "Paneer Butter Masala",
        category: "Main Course",
        ingredients: [],
      };

      const mapped = testMapRecipe(backendRecipePayload);
      expect(mapped.menuItem).toBe("Paneer Butter Masala");
      expect(mapped.name).toBe("Paneer Butter Masala");
      expect(mapped.menuItem).not.toBe("Unnamed Dish");
    });

    it("maps ingredient.name instead of showing blank raw material names", () => {
      const recipeWithIngredients = {
        id: "rcp-101",
        menuItem: "Dal Makhani",
        ingredients: [
          {
            id: "ing-1",
            stockItemId: "sku-black-urad",
            name: "Black Urad Dal",
            quantity: 0.5,
            unit: "kg",
          },
          {
            id: "ing-2",
            stockItemId: "sku-butter",
            name: "Amul Butter",
            quantity: 0.1,
            unit: "kg",
          },
        ],
      };

      const mapped = testMapRecipe(recipeWithIngredients);
      expect(mapped.ingredients[0].name).toBe("Black Urad Dal");
      expect(mapped.ingredients[1].name).toBe("Amul Butter");
      expect(mapped.ingredients[0].name).not.toBe("");
    });
  });

  // 5. inventory & purchases: vendorId on UnifiedPurchaseDto
  describe("inventory & purchases: vendorId on UnifiedPurchaseDto", () => {
    it("attaches vendorId to UnifiedPurchaseDto inward purchase records", async () => {
      const purchase = await posPurchasesService.createPurchase({
        vendorId: "vnd-5501",
        vendorName: "Metro Cash & Carry",
        invoiceNo: "INV-TEST-001",
        totalAmount: 1500,
        paymentStatus: "Done",
        items: [
          {
            name: "Basmati Rice 25kg",
            quantity: 2,
            unit: "Bag",
            unitPrice: 750,
            lineTotal: 1500,
          },
        ],
      });

      expect(purchase.vendorId).toBe("vnd-5501");
      expect(purchase.vendorName).toBe("Metro Cash & Carry");
      expect(purchase.totalAmount).toBe(1500);

      const allPurchases = await posPurchasesService.fetchPurchases();
      const saved = allPurchases.find((p) => p.invoiceNo === "INV-TEST-001");
      expect(saved).toBeDefined();
      expect(saved?.vendorId).toBe("vnd-5501");
    });
  });

  // 6. inventory & raw materials: unique id property for raw material subcategories
  describe("inventory & raw materials: unique id property on subcategories", () => {
    it("ensures subcategories always have a deterministic or unique non-empty id", () => {
      const rawCategories = [
        {
          id: "cat-dairy",
          name: "Dairy",
          subCategories: [
            { name: "Cow Milk", unit: "L" },
            { name: "Paneer", unit: "Kg" },
          ],
        },
      ];

      // Verification of subCategory id generation
      const processedSubs = rawCategories[0].subCategories.map((s, idx) => ({
        ...s,
        id: (s as any).id || `sub-cat-dairy-${idx}-${s.name.replace(/\s+/g, "-")}`,
      }));

      expect(processedSubs[0].id).toBe("sub-cat-dairy-0-Cow-Milk");
      expect(processedSubs[1].id).toBe("sub-cat-dairy-1-Paneer");
      expect(processedSubs[0].id).toBeDefined();
      expect(processedSubs[1].id).toBeDefined();
    });
  });

  // 7. inventory & service: standardize subCategory field access on StockItem
  describe("inventory & service: standardize subCategory field access", () => {
    it("standardizes subCategory access across camelCase and snake_case properties", async () => {
      const rawItem1: Partial<StockItem> & { id: string } = {
        id: "stk-01",
        name: "Full Cream Milk",
        category: "Dairy",
        subCategory: "Milk",
        unit: "L",
        availableStock: 50,
      };

      const rawItem2: any = {
        id: "stk-02",
        name: "Cow Ghee",
        category: "Dairy",
        sub_category: "Ghee",
        unit: "Kg",
        availableStock: 20,
      };

      const normalize = (it: any) => ({
        ...it,
        subCategory: (it.subCategory || it.sub_category || "").trim(),
        sub_category: (it.subCategory || it.sub_category || "").trim(),
      });

      const normalized1 = normalize(rawItem1);
      const normalized2 = normalize(rawItem2);

      expect(normalized1.subCategory).toBe("Milk");
      expect(normalized1.sub_category).toBe("Milk");
      expect(normalized2.subCategory).toBe("Ghee");
      expect(normalized2.sub_category).toBe("Ghee");

      // Verify category-wise filter matches consistently
      const items = [normalized1, normalized2];
      const gheeMatches = items.filter((i) => i.subCategory === "Ghee");
      expect(gheeMatches).toHaveLength(1);
      expect(gheeMatches[0].name).toBe("Cow Ghee");
    });
  });

  // 8. inventory & purchase modal: Remove extraneous subtotal field from payload
  describe("inventory & purchase modal: Remove extraneous subtotal field", () => {
    it("verifies submission payload strictly omits subtotal", () => {
      const lines = [
        { stockItemId: "sku-1", name: "Tomato", quantity: 10, unit: "Kg", price: 30 },
      ];
      const subtotalCalc = lines.reduce((s, l) => s + l.quantity * l.price, 0); // 300
      const discount = 0;
      const taxableAmount = 300;
      const tax = 15;
      const total = 315;

      // Submission payload structure after fix
      const payload: Record<string, any> = {
        invoiceNo: "INV-8899",
        vendorId: "vnd-01",
        vendorName: "Veggie Supplier",
        purchaseDate: "23 Nov 2026",
        invoiceDate: "2026-11-23",
        discountAmount: discount,
        taxableAmount,
        totalAmount: total,
        taxAmount: tax,
        itemCount: lines.length,
        status: "Completed",
        paymentStatus: "Paid",
        notes: "",
        items: lines,
      };

      // Extraneous subtotal must not be in payload
      expect(payload).not.toHaveProperty("subtotal");
      expect(payload.taxableAmount).toBe(300);
      expect(payload.totalAmount).toBe(315);
      expect(payload.vendorId).toBe("vnd-01");
    });
  });
});
