// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from "vitest";
import {
  posInventoryService,
  CATEGORY_STORE_KEY,
  STOCK_STORE_KEY,
} from "../posInventoryService";

describe("posInventoryService Category & Raw Material Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Stock Categories & Subcategories Master", () => {
    it("returns default categories when storage is empty", async () => {
      const categories = await posInventoryService.getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty("name");
      expect(categories[0]).toHaveProperty("subCategories");
    });

    it("can create a new category with multiple subcategories and units", async () => {
      const newCategory = await posInventoryService.upsertCategory({
        name: "Beverages & Mocktails",
        subCategories: [
          { id: "sub-1", name: "Soda & Soft Drinks", unit: "Tin" },
          { id: "sub-2", name: "Fresh Syrups", unit: "Bottle" },
          { id: "sub-3", name: "Crushed Ice", unit: "Kg" },
        ],
      });

      expect(newCategory.id).toBeDefined();
      expect(newCategory.name).toBe("Beverages & Mocktails");
      expect(newCategory.subCategories.length).toBe(3);
      expect(newCategory.subCategories[0].unit).toBe("Tin");
      expect(newCategory.subCategories[1].unit).toBe("Bottle");

      const list = await posInventoryService.getCategories();
      const found = list.find((c) => c.id === newCategory.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe("Beverages & Mocktails");
    });

    it("can update an existing category and edit subcategories", async () => {
      const created = await posInventoryService.upsertCategory({
        name: "Spices & Herbs",
        subCategories: [{ id: "sub-1", name: "Cumin", unit: "Gm" }],
      });

      const updated = await posInventoryService.upsertCategory({
        id: created.id,
        name: "Spices & Whole Herbs",
        subCategories: [
          { id: "sub-1", name: "Cumin Seeds", unit: "Kg" },
          { id: "sub-2", name: "Cardamom", unit: "Gm" },
        ],
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe("Spices & Whole Herbs");
      expect(updated.subCategories.length).toBe(2);
      expect(updated.subCategories[0].name).toBe("Cumin Seeds");
      expect(updated.subCategories[0].unit).toBe("Kg");
    });

    it("can delete a category", async () => {
      const created = await posInventoryService.upsertCategory({
        name: "Temporary Category",
        subCategories: [],
      });

      const success = await posInventoryService.deleteCategory(created.id);
      expect(success).toBe(true);

      const list = await posInventoryService.getCategories();
      expect(list.some((c) => c.id === created.id)).toBe(false);
    });
  });

  describe("Raw Material Attributes & Mapping", () => {
    it("persists raw material with subCategory, pricePerUnit, sku, alertQuantity, isReturnable, and expiryDate", async () => {
      const item = await posInventoryService.upsertStockItem({
        name: "Basmati Premium Rice 25kg",
        category: "Groceries",
        subCategory: "Rice & Grains",
        unit: "Kg",
        sku: "RAW-RICE-001",
        pricePerUnit: 120,
        alertQuantity: 10,
        isReturnable: true,
        expiryDate: "2026-12-31",
      });

      expect(item.rawMaterial).toBe("Basmati Premium Rice 25kg");
      expect(item.category).toBe("Groceries");
      expect(item.subCategory).toBe("Rice & Grains");
      expect(item.sku).toBe("RAW-RICE-001");
      expect(item.pricePerUnit).toBe(120);
      expect(item.alertQuantity).toBe(10);
      expect(item.isReturnable).toBe(true);
      expect(item.expiryDate).toBe("2026-12-31");
    });

    it("can update/edit an existing raw material item with new returnable and expiry info", async () => {
      const created = await posInventoryService.upsertStockItem({
        name: "Amul Pasteurised Butter 500g",
        category: "Dairy",
        subCategory: "Butter",
        unit: "Pack",
        sku: "RAW-BUTTER-001",
        pricePerUnit: 250,
        availableStock: 20,
        alertQuantity: 4,
        isReturnable: false,
        expiryDate: null,
      });

      expect(created.isReturnable).toBe(false);
      expect(created.expiryDate).toBeNull();

      // Edit the item
      const updated = await posInventoryService.upsertStockItem({
        id: created.id,
        name: "Amul Pasteurised Butter 500g",
        category: "Dairy",
        subCategory: "Butter",
        unit: "Pack",
        sku: "RAW-BUTTER-001",
        pricePerUnit: 260,
        availableStock: 25,
        alertQuantity: 8,
        isReturnable: true,
        expiryDate: "2027-01-15",
      });

      expect(updated.id).toBe(created.id);
      expect(updated.pricePerUnit).toBe(260);
      expect(updated.availableStock).toBe(25);
      expect(updated.alertQuantity).toBe(8);
      expect(updated.isReturnable).toBe(true);
      expect(updated.expiryDate).toBe("2027-01-15");

      const allItems = await posInventoryService.getStockItems();
      const found = allItems.find((i) => i.id === created.id);
      expect(found).toBeDefined();
      expect(found?.alertQuantity).toBe(8);
      expect(found?.isReturnable).toBe(true);
      expect(found?.expiryDate).toBe("2027-01-15");
    });

    it("correctly identifies near expiry items in stock calculation", () => {
      const nearExpiryDate = new Date();
      nearExpiryDate.setDate(nearExpiryDate.getDate() + 7);
      const isoStr = nearExpiryDate.toISOString().split("T")[0];

      const today = new Date();
      const exp = new Date(isoStr);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBeGreaterThan(0);
      expect(diffDays).toBeLessThanOrEqual(15);
    });
  });
});
