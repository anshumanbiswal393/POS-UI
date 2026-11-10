import { describe, it, expect } from "vitest";

// =========================================================================
// 1. Menu Search Filtering (Item 1)
// =========================================================================
interface TestMenuItem {
  id: string;
  code: string;
  name: string;
  category: string;
}

function filterMenuItems(items: TestMenuItem[], query: string): TestMenuItem[] {
  if (!query.trim()) return items;
  const q = query.toLowerCase().trim();
  return items.filter((item) => {
    const nameMatch = item.name.toLowerCase().includes(q);
    const codeMatch = item.code.toLowerCase().includes(q);
    const catMatch = item.category.toLowerCase().includes(q);
    return Boolean(nameMatch || codeMatch || catMatch);
  });
}

describe("Menu List Search by Name, Code, and Category", () => {
  const sampleItems: TestMenuItem[] = [
    { id: "1", code: "FD-101", name: "Chicken Biryani", category: "Rice" },
    { id: "2", code: "FD-102", name: "Egg Biryani", category: "Rice" },
    { id: "3", code: "BEV-01", name: "Cold Coffee Shake", category: "Beverages" },
    { id: "4", code: "ST-05", name: "Hariyali Paneer Tikka", category: "Starters" },
  ];

  it("filters accurately by dish name", () => {
    const result = filterMenuItems(sampleItems, "Chicken");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("FD-101");
  });

  it("filters accurately by item code / SKU", () => {
    const result = filterMenuItems(sampleItems, "BEV-01");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Cold Coffee Shake");
  });

  it("filters case-insensitively and trims input", () => {
    const result = filterMenuItems(sampleItems, "  fd-102  ");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Egg Biryani");
  });

  it("returns all items when search query is empty", () => {
    const result = filterMenuItems(sampleItems, "   ");
    expect(result).toHaveLength(4);
  });
});

// =========================================================================
// 2. Partial Payment Calculations (Item 4)
// =========================================================================
function computePaymentBreakdown(grandTotal: number, enteredAmount: string) {
  const parsed = parseFloat(enteredAmount);
  const amt = Number.isFinite(parsed) && parsed >= 0 ? parsed : grandTotal;
  const payingNow = Math.min(amt, grandTotal);
  const remainingDue = Math.max(0, grandTotal - amt);
  const isPartial = amt < grandTotal && amt > 0;
  const isFull = amt >= grandTotal;
  const canProceed = !isNaN(amt) && amt > 0;

  return {
    payingNow,
    remainingDue,
    isPartial,
    isFull,
    canProceed,
    targetDestination: isPartial ? "Pending Payments" : "Order History",
  };
}

describe("Partial Payment Billing Calculations & Flow", () => {
  const grandTotal = 500;

  it("allows half payment and routes remaining balance to Pending Payments", () => {
    const halfPayment = computePaymentBreakdown(grandTotal, "250");
    expect(halfPayment.payingNow).toBe(250);
    expect(halfPayment.remainingDue).toBe(250);
    expect(halfPayment.isPartial).toBe(true);
    expect(halfPayment.isFull).toBe(false);
    expect(halfPayment.canProceed).toBe(true);
    expect(halfPayment.targetDestination).toBe("Pending Payments");
  });

  it("handles full payment and routes order to Order History", () => {
    const fullPayment = computePaymentBreakdown(grandTotal, "500");
    expect(fullPayment.payingNow).toBe(500);
    expect(fullPayment.remainingDue).toBe(0);
    expect(fullPayment.isPartial).toBe(false);
    expect(fullPayment.isFull).toBe(true);
    expect(fullPayment.canProceed).toBe(true);
    expect(fullPayment.targetDestination).toBe("Order History");
  });

  it("disallows non-positive amounts", () => {
    const zeroPayment = computePaymentBreakdown(grandTotal, "0");
    expect(zeroPayment.canProceed).toBe(false);
  });
});

// =========================================================================
// 3. Category Isolation & Culinary Sequence in Printed Menu (Item 5)
// =========================================================================
const CULINARY_ORDER = [
  "starters",
  "staters",
  "main course",
  "rice",
  "desserts",
  "beverages",
  "drinks",
];

function resolveDishCategory(name: string, category: string): string {
  const rawCat = (category || "").trim();
  const nameLower = name.toLowerCase();

  const isDrink =
    /coffee|tea|shake|smoothie|juice|lassi|mojito|mocktail|cocktail|soda|lemonade|coke|pepsi|sprite|water|drink|beverage/i.test(
      nameLower,
    );
  if (isDrink && (!rawCat || rawCat.toLowerCase().includes("rice"))) {
    return "Beverages";
  }

  if (!rawCat) return "Chef Specials";
  if (rawCat.toLowerCase() === "staters") return "Starters";
  return rawCat.charAt(0).toUpperCase() + rawCat.slice(1);
}

describe("Printed Menu Category Isolation & Normalization", () => {
  it("isolates beverages mistakenly tagged as rice into Beverages category", () => {
    const correctedCategory = resolveDishCategory("Cold Coffee Frappe", "rice");
    expect(correctedCategory).toBe("Beverages");
  });

  it("keeps true rice dishes in Rice category", () => {
    const riceCategory = resolveDishCategory("Dum Mutton Biryani", "rice");
    expect(riceCategory).toBe("Rice");
  });

  it("normalizes typo 'staters' to 'Starters'", () => {
    const starterCategory = resolveDishCategory("Crispy Corn", "staters");
    expect(starterCategory).toBe("Starters");
  });

  it("sorts categories in culinary sequence (Starters -> Rice -> Beverages)", () => {
    const categories = ["Beverages", "Rice", "Starters"];
    const sorted = [...categories].sort((a, b) => {
      const aIdx = CULINARY_ORDER.indexOf(a.toLowerCase());
      const bIdx = CULINARY_ORDER.indexOf(b.toLowerCase());
      return aIdx - bIdx;
    });
    expect(sorted).toEqual(["Starters", "Rice", "Beverages"]);
  });
});
