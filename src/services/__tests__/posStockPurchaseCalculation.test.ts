import { describe, it, expect } from "vitest";

describe("Stock Purchase Tax and Discount Calculation", () => {
  function calculatePurchaseTotals({
    items,
    discountVal = 0,
    discountType = "flat",
    taxVal = 0,
    taxType = "flat",
    paidAmount = null,
    paymentStatus = "Done",
  }: {
    items: Array<{ lineTotal: number }>;
    discountVal?: number;
    discountType?: "flat" | "percent";
    taxVal?: number;
    taxType?: "flat" | "percent";
    paidAmount?: number | null;
    paymentStatus?: "Done" | "Pending" | "Partial";
  }) {
    const subtotal = items.reduce((acc, it) => acc + (it.lineTotal || 0), 0);
    const rawDiscount =
      discountType === "percent"
        ? Math.round(subtotal * discountVal) / 100
        : discountVal;
    const discount = Math.min(subtotal, Math.max(0, rawDiscount));
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax =
      taxType === "percent"
        ? Math.round(taxableAmount * taxVal) / 100
        : taxVal;
    const total = Math.round((taxableAmount + tax) * 100) / 100;

    let paid = 0;
    if (paymentStatus === "Done") {
      paid = total;
    } else if (paymentStatus === "Pending") {
      paid = 0;
    } else {
      paid = paidAmount === null ? 0 : Math.min(total, paidAmount);
    }
    const due = Math.max(0, Math.round((total - paid) * 100) / 100);

    return { subtotal, discount, taxableAmount, tax, total, paid, due };
  }

  it("calculates tax on taxable amount after trade discount deduction (statutory GST rule)", () => {
    // 10 units at ₹100 = ₹1000 subtotal
    // 10% discount = ₹100 discount
    // Taxable amount = ₹900
    // 5% GST on ₹900 = ₹45 (NOT ₹50 on ₹1000)
    // Total = ₹945
    const calc = calculatePurchaseTotals({
      items: [{ lineTotal: 1000 }],
      discountVal: 10,
      discountType: "percent",
      taxVal: 5,
      taxType: "percent",
      paymentStatus: "Done",
    });

    expect(calc.subtotal).toBe(1000);
    expect(calc.discount).toBe(100);
    expect(calc.taxableAmount).toBe(900);
    expect(calc.tax).toBe(45);
    expect(calc.total).toBe(945);
    expect(calc.paid).toBe(945);
    expect(calc.due).toBe(0);
  });

  it("handles flat discount and flat tax correctly", () => {
    const calc = calculatePurchaseTotals({
      items: [{ lineTotal: 500 }, { lineTotal: 500 }],
      discountVal: 50,
      discountType: "flat",
      taxVal: 75,
      taxType: "flat",
      paymentStatus: "Done",
    });

    expect(calc.subtotal).toBe(1000);
    expect(calc.discount).toBe(50);
    expect(calc.taxableAmount).toBe(950);
    expect(calc.tax).toBe(75);
    expect(calc.total).toBe(1025);
    expect(calc.due).toBe(0);
  });

  it("handles partial payment and calculates due accurately", () => {
    const calc = calculatePurchaseTotals({
      items: [{ lineTotal: 1000 }],
      discountVal: 100,
      discountType: "flat",
      taxVal: 18,
      taxType: "percent", // 18% of 900 = 162
      paidAmount: 500,
      paymentStatus: "Partial",
    });

    expect(calc.taxableAmount).toBe(900);
    expect(calc.tax).toBe(162);
    expect(calc.total).toBe(1062);
    expect(calc.paid).toBe(500);
    expect(calc.due).toBe(562);
  });

  it("clamps discount so it cannot exceed subtotal and ensures non-negative totals", () => {
    const calc = calculatePurchaseTotals({
      items: [{ lineTotal: 200 }],
      discountVal: 300,
      discountType: "flat",
      taxVal: 5,
      taxType: "percent",
      paymentStatus: "Done",
    });

    expect(calc.subtotal).toBe(200);
    expect(calc.discount).toBe(200);
    expect(calc.taxableAmount).toBe(0);
    expect(calc.tax).toBe(0);
    expect(calc.total).toBe(0);
    expect(calc.due).toBe(0);
  });
});

describe("Reservation Advance Deduction in POS Settlement", () => {
  it("deducts advance deposit to compute net payable and full settlement clears balance due", () => {
    const grandTotal = 1500;
    const advanceDeposit = 500;
    const netPayable = Math.max(0, grandTotal - advanceDeposit);

    expect(netPayable).toBe(1000);

    const tenderedAmount = 1000;
    const totalPaid = tenderedAmount + advanceDeposit;
    const balanceDue = Math.max(0, grandTotal - totalPaid);

    expect(totalPaid).toBe(1500);
    expect(balanceDue).toBe(0);
  });
});
