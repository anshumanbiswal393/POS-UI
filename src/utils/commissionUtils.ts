/**
 * Utilities for calculating internal menu item commission markups.
 * Internal rule: Commission is an internal markup added to base price.
 * Customer-facing surfaces (Billing, Invoices, Physical Menu) display
 * the effective final selling price without revealing the word "commission".
 */

export type CommissionType = "Not Configured" | "Percentage" | "Fixed Amount";

/**
 * Calculates the additional commission amount given base price, type, and value.
 */
export function calculateCommissionAmount(
  basePrice: number,
  commissionType?: CommissionType | string | null,
  commissionValue?: number | null,
): number {
  if (
    !commissionType ||
    commissionType === "Not Configured" ||
    commissionValue == null ||
    commissionValue <= 0 ||
    basePrice <= 0
  ) {
    return 0;
  }

  if (commissionType === "Percentage") {
    const raw = (basePrice * commissionValue) / 100;
    return Math.round(raw * 100) / 100;
  }

  if (commissionType === "Fixed Amount") {
    return Math.round(commissionValue * 100) / 100;
  }

  return 0;
}

/**
 * Calculates the effective selling price (Base Price + Commission).
 * If no commission is configured, returns the base price untouched.
 */
export function calculateEffectivePrice(
  basePrice: number,
  commissionType?: CommissionType | string | null,
  commissionValue?: number | null,
): number {
  const commAmt = calculateCommissionAmount(basePrice, commissionType, commissionValue);
  return Math.round((basePrice + commAmt) * 100) / 100;
}

/**
 * Formats commission rule for display in management screens.
 */
export function formatCommissionRule(
  commissionType?: CommissionType | string | null,
  commissionValue?: number | null,
): string {
  if (!commissionType || commissionType === "Not Configured" || commissionValue == null) {
    return "Not Configured";
  }
  if (commissionType === "Percentage") {
    return `${commissionValue}%`;
  }
  if (commissionType === "Fixed Amount") {
    return `₹${commissionValue}`;
  }
  return "Not Configured";
}

