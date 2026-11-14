import { formatDateIndian, formatDateTimeIndian, parseDateSafeIndian, toStorageIsoDate } from "./dateUtils";
import { toTitleCase, formatTitleCaseSafe, isExcludedFromTitleCase } from "./textUtils";

export {
  formatDateIndian,
  formatDateTimeIndian,
  parseDateSafeIndian,
  toStorageIsoDate,
  toTitleCase,
  formatTitleCaseSafe,
  isExcludedFromTitleCase,
};

/**
 * Standardized Date Formatter for POS SaaS.
 * Defaults to Indian standard format DD-MM-YYYY (e.g. 14-11-2026).
 */
export function formatDate(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "—";
  if (!options) {
    return formatDateIndian(value);
  }
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, options);
}

export function formatNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(undefined, options).format(value);
}

export function formatCurrency(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "₹0";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}
