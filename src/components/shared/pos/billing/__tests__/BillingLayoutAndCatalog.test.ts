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

  it("BillingCartRegister displays cart in Excel tabular format with centered columns and reduced-contrast borders", () => {
    const cartPath = path.resolve(__dirname, "../BillingCartRegister.tsx");
    const content = fs.readFileSync(cartPath, "utf-8");

    // Excel table format
    expect(content).toContain("border-collapse border border-slate-300");
    expect(content).toContain("w-full text-center");
    expect(content).toContain("Item");
    expect(content).toContain("Qty");
    expect(content).toContain("Rate");
    expect(content).toContain("Amount");
  });

  it("BillingHeader renders meal-time tabs in top pill container styled like order types", () => {
    const headerPath = path.resolve(__dirname, "../BillingHeader.tsx");
    const content = fs.readFileSync(headerPath, "utf-8");

    // Meal-time tabs in top pill bar
    expect(content).toContain('["All", "Breakfast", "Lunch", "Dinner"]');
    expect(content).toContain("${meal} Menu");
    expect(content).toContain("bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 overflow-x-auto");
  });

  it("BillingMenuCatalog has meal filtering, squared category borders, plate counts, and clearly visible sold-out button", () => {
    const catalogPath = path.resolve(__dirname, "../BillingMenuCatalog.tsx");
    const content = fs.readFileSync(catalogPath, "utf-8");

    // Meal-time filtering support
    expect(content).toContain("selectedMealTime");
    expect(content).toContain("targetMeal");

    // Categories with rounded-lg border border-slate-300 (no circular corners)
    expect(content).toContain("rounded-lg px-3 py-1.5 text-[11.5px] font-bold whitespace-nowrap transition-all cursor-pointer border");

    // Plate count format without long (Sold Out) string
    expect(content).toContain('{item.plates} {item.plates === 1 ? "Plate" : "Plates"}');

    // Sold out button styling
    expect(content).toContain("Sold Out");
    expect(content).toContain("border-rose-600");
  });

  it("PosBillingManager wires selectedMealTime and provides gap so top nav border does not overlap content cards", () => {
    const managerPath = path.resolve(__dirname, "../PosBillingManager.tsx");
    const content = fs.readFileSync(managerPath, "utf-8");

    expect(content).toContain("const [selectedMealTime, setSelectedMealTime] = useState");
    expect(content).toContain("selectedMealTime={selectedMealTime}");
    expect(content).toContain("pt-2 lg:pt-2");
  });
});
