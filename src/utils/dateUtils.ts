/**
 * Global Indian Date Formatting Utility for POS SaaS
 * Standardizes all user-facing date displays to DD-MM-YYYY format (e.g. 14-11-2026)
 * Prevents timezone shifting and ensures sorting compares actual date values.
 */

/**
 * Format any date value into Indian standard DD-MM-YYYY string.
 *
 * Examples:
 * - "2026-11-14" -> "14-11-2026"
 * - "2026-01-05" -> "05-01-2026"
 * - "2026-12-25" -> "25-12-2026"
 * - "2026-11-14T08:30:00Z" -> "14-11-2026"
 */
export function formatDateIndian(
  value: string | Date | number | null | undefined,
  fallback: string = "—",
): string {
  if (value === null || value === undefined || value === "") return fallback;

  // If already DD-MM-YYYY
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    // Match pure YYYY-MM-DD
    const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
    if (ymd) {
      const [, y, m, d] = ymd;
      return `${d}-${m}-${y}`;
    }
    // Match DD/MM/YYYY
    const dmySlash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (dmySlash) {
      const [, d, m, y] = dmySlash;
      return `${d}-${m}-${y}`;
    }
  }

  // Fallback to Date object parsing
  const d = typeof value === "string" ? new Date(value) : typeof value === "number" ? new Date(value) : value;
  if (!d || isNaN(d.getTime())) return fallback;

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Format date and time in Indian format: DD-MM-YYYY hh:mm AM/PM
 * Example: "14-11-2026 01:30 PM"
 */
export function formatDateTimeIndian(
  value: string | Date | number | null | undefined,
  fallback: string = "—",
): string {
  if (value === null || value === undefined || value === "") return fallback;

  const datePart = formatDateIndian(value, "");
  if (!datePart) return fallback;

  let d: Date;
  if (typeof value === "string") {
    // If it was only YYYY-MM-DD without time
    if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim()) || /^\d{2}-\d{2}-\d{4}$/.test(value.trim())) {
      return datePart;
    }
    d = new Date(value);
  } else if (typeof value === "number") {
    d = new Date(value);
  } else {
    d = value;
  }

  if (isNaN(d.getTime())) return datePart;

  const rawHours = d.getHours();
  const rawMinutes = d.getMinutes();
  const ampm = rawHours >= 12 ? "PM" : "AM";
  const hours12 = rawHours % 12 || 12;
  const hStr = String(hours12).padStart(2, "0");
  const mStr = String(rawMinutes).padStart(2, "0");

  return `${datePart} ${hStr}:${mStr} ${ampm}`;
}

/**
 * Safely parse DD-MM-YYYY or YYYY-MM-DD into a Date instance without timezone shifting.
 */
export function parseDateSafeIndian(str?: string | Date | null): Date | undefined {
  if (!str) return undefined;
  if (str instanceof Date) return isNaN(str.getTime()) ? undefined : str;

  const trimmed = String(str).trim();
  // Check DD-MM-YYYY
  const ddmmyyyy = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return isNaN(date.getTime()) ? undefined : date;
  }

  // Check YYYY-MM-DD
  const yyyymmdd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (yyyymmdd) {
    const [, y, m, d] = yyyymmdd;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return isNaN(date.getTime()) ? undefined : date;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? undefined : d;
}

/**
 * Converts a DD-MM-YYYY or Date back into standardized ISO YYYY-MM-DD
 * for backend queries and database storage.
 */
export function toStorageIsoDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    const dmy = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dmy) {
      const [, d, m, y] = dmy;
      return `${y}-${m}-${d}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  }
  const d = parseDateSafeIndian(value);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Compare two dates for sorting (returns chronological order).
 * Works with DD-MM-YYYY, YYYY-MM-DD, ISO timestamps, or Date instances.
 */
export function compareDates(a: any, b: any): number {
  if (a === b) return 0;
  if (a === undefined || a === null || a === "") return 1;
  if (b === undefined || b === null || b === "") return -1;

  const dateA = parseDateSafeIndian(a);
  const dateB = parseDateSafeIndian(b);

  if (dateA && dateB) {
    return dateA.getTime() - dateB.getTime();
  }
  return String(a).localeCompare(String(b));
}

