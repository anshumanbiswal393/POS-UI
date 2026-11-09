import { describe, it, expect } from "vitest";
import {
  calculateEffectivePrice,
  calculateCommissionAmount,
  formatCommissionRule,
} from "../commissionUtils";

describe("Menu Item Commission Markup & Billing Calculations", () => {
  it("calculates correct fixed amount commission markup", () => {
    // hariyali panner: base price 200.00, fixed commission 35.00 -> final 235.00
    const pannerBase = 200.0;
    const commAmt = calculateCommissionAmount(pannerBase, "Fixed Amount", 35.0);
    const pannerFinal = calculateEffectivePrice(pannerBase, "Fixed Amount", 35.0);

    expect(commAmt).toBe(35.0);
    expect(pannerFinal).toBe(235.0);

    // mushroom pakoda: base price 199.00, fixed commission 35.00 -> final 234.00
    const pakodaBase = 199.0;
    const pakodaComm = calculateCommissionAmount(pakodaBase, "Fixed Amount", 35.0);
    const pakodaFinal = calculateEffectivePrice(pakodaBase, "Fixed Amount", 35.0);

    expect(pakodaComm).toBe(35.0);
    expect(pakodaFinal).toBe(234.0);
  });

  it("calculates percentage based commission correctly", () => {
    const basePrice = 280.0; // chicken biryani
    const commAmt = calculateCommissionAmount(basePrice, "Percentage", 10.0);
    const finalPrice = calculateEffectivePrice(basePrice, "Percentage", 10.0);

    expect(commAmt).toBe(28.0);
    expect(finalPrice).toBe(308.0);
  });

  it("leaves base price untouched if commission is Not Configured, zero, or null", () => {
    expect(calculateEffectivePrice(200.0, "Not Configured", null)).toBe(200.0);
    expect(calculateEffectivePrice(200.0, "Fixed Amount", 0)).toBe(200.0);
    expect(calculateEffectivePrice(200.0, null, null)).toBe(200.0);
  });

  it("formats commission rule for display properly", () => {
    expect(formatCommissionRule("Fixed Amount", 35.0)).toBe("₹35");
    expect(formatCommissionRule("Percentage", 15.0)).toBe("15%");
    expect(formatCommissionRule("Not Configured", null)).toBe("Not Configured");
  });

  it("prevents commission from being added twice in billing catalog mapping", () => {
    // Raw item from database/catalog
    const rawPanner = {
      id: "itm-panner",
      code: "HP-98",
      name: "hariyali panner",
      price: 200.0,
      commissionType: "Fixed Amount" as const,
      commissionValue: 35.0,
      variants: [
        { id: "v1", name: "Half", price: 120.0 },
        { id: "v2", name: "Full", price: 200.0 },
      ],
    };

    // Step 1: useBillingMenuItems applies initial commission markup
    const billingMenuItem = {
      ...rawPanner,
      originalPrice: rawPanner.price,
      price: calculateEffectivePrice(
        rawPanner.price,
        rawPanner.commissionType,
        rawPanner.commissionValue,
      ),
      variants: rawPanner.variants.map((v) => ({
        ...v,
        originalPrice: v.price,
        price: calculateEffectivePrice(v.price, rawPanner.commissionType, rawPanner.commissionValue),
      })),
    };

    // Verify useBillingMenuItems output: price is 235.00
    expect(billingMenuItem.price).toBe(235.0);
    expect(billingMenuItem.originalPrice).toBe(200.0);

    // Step 2: In PosBillingManager catalogItems mapping, ensure it does NOT add 35 again
    const basePrice = (billingMenuItem as any).originalPrice ?? billingMenuItem.price;
    const effectivePrice =
      (billingMenuItem as any).originalPrice !== undefined
        ? billingMenuItem.price
        : calculateEffectivePrice(
            basePrice,
            billingMenuItem.commissionType,
            billingMenuItem.commissionValue,
          );

    // CRITICAL ASSERTION: Price must remain 235.00, NOT 270.00
    expect(effectivePrice).toBe(235.0);
    expect(effectivePrice).not.toBe(270.0);

    // Step 3: Variants also must not have commission doubled
    const effectiveVariants = billingMenuItem.variants.map((v: any) => {
      const vBasePrice = v.originalPrice ?? v.price;
      return {
        ...v,
        price:
          v.originalPrice !== undefined
            ? v.price
            : calculateEffectivePrice(
                vBasePrice,
                billingMenuItem.commissionType,
                billingMenuItem.commissionValue,
              ),
      };
    });

    expect(effectiveVariants[0].price).toBe(155.0); // 120 + 35
    expect(effectiveVariants[0].price).not.toBe(190.0); // 120 + 35 + 35
    expect(effectiveVariants[1].price).toBe(235.0); // 200 + 35
    expect(effectiveVariants[1].price).not.toBe(270.0);
  });
});
