import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("POS Billing UI Standardization", () => {
  it("BillingTablesOrdersSidebar has white tab container and theme-colored active tab", () => {
    const sidebarPath = path.resolve(__dirname, "../BillingTablesOrdersSidebar.tsx");
    const content = fs.readFileSync(sidebarPath, "utf-8");

    // Tab switcher container is white with border (not black/dark grey)
    expect(content).toContain("bg-white rounded-xl border border-slate-300");

    // Active tab has theme color, inactive is white with black text
    expect(content).toContain('activeTab === "tables"');
    expect(content).toContain("bg-primary text-primary-foreground");
    expect(content).toContain("bg-white text-black hover:bg-slate-100");
  });

  it("BillingCartRegister displays clean item rows without table box, high-contrast Clear button, and inline CGST/SGST tax", () => {
    const cartPath = path.resolve(__dirname, "../BillingCartRegister.tsx");
    const content = fs.readFileSync(cartPath, "utf-8");

    // Clean item row layout without table container
    expect(content).not.toContain("<table");
    expect(content).toContain("cartItems.map");
    expect(content).toContain("FoodTypeIcon");

    // High contrast dark red Clear button
    expect(content).toContain("bg-rose-600");
    expect(content).toContain("Clear");

    // Tax row displays CGST and SGST in the same row
    expect(content).toContain("(CGST");
    expect(content).toContain("SGST");
  });

  it("BillingMenuCatalog renders meal-time tabs at top of menu selection without 'Menu' suffix and Excel dishes table", () => {
    const catalogPath = path.resolve(__dirname, "../BillingMenuCatalog.tsx");
    const content = fs.readFileSync(catalogPath, "utf-8");

    // Meal-time tabs at top of menu selection without 'Menu' suffix
    expect(content).toContain('["All", "Breakfast", "Lunch", "Dinner"]');
    expect(content).toContain("<span>{meal}</span>");

    // Excel table with vertical column borders and centered element data
    expect(content).toContain("table className=");
    expect(content).toContain("excel-format");
    expect(content).toContain("border-r");
    expect(content).toContain("border-b");
    expect(content).toContain("text-center");

    // Meal-time filtering support
    expect(content).toContain("selectedMealTime");
    expect(content).toContain("targetMeal");

    // Categories with rounded-lg border (no circular corners)
    expect(content).toContain("rounded-lg px-3 py-1.5 text-[11.5px] font-bold whitespace-nowrap transition-all cursor-pointer border");

    // Plate count format without long (Sold Out) string
    expect(content).toContain('{item.plates} {item.plates === 1 ? "Plate" : "Plates"}');

    // Sold out button styling
    expect(content).toContain("Sold Out");
    expect(content).toContain("border-rose-600");
  });

  it("PosKotManager has Kitchen Orders heading matching sidebar navigation", () => {
    const kotPath = path.resolve(__dirname, "../../orders/PosKotManager.tsx");
    const content = fs.readFileSync(kotPath, "utf-8");

    expect(content).toContain("Kitchen Orders");
    expect(content).not.toContain("Kitchen Display");
  });

  it("PosGlobalSearch has removed the F3 tag from search bar", () => {
    const searchPath = path.resolve(__dirname, "../../../../layout/pos/PosGlobalSearch.tsx");
    const content = fs.readFileSync(searchPath, "utf-8");

    expect(content).not.toContain("(F3)");
    expect(content).not.toContain("F3 / ⌘K");
  });

  it("PosBillingManager wires selectedMealTime and provides gap so top nav border does not overlap content cards", () => {
    const managerPath = path.resolve(__dirname, "../PosBillingManager.tsx");
    const content = fs.readFileSync(managerPath, "utf-8");

    expect(content).toContain("const [selectedMealTime, setSelectedMealTime] = useState");
    expect(content).toContain("selectedMealTime={selectedMealTime}");
    expect(content).toContain("pt-2 lg:pt-2");
  });
});
