/**
 * Text formatting utility for POS SaaS
 * Automatically formats user inputs into Title Case (capitalizing first letter of each word)
 * while strictly adhering to operational exceptions (emails, phones, passwords, SKUs, search, etc.)
 */

/**
 * Capitalizes the first letter of every word while preserving
 * existing casing within words, whitespace, and special characters.
 *
 * Examples:
 * - "samprita patra" -> "Samprita Patra"
 * - "chicken biryani" -> "Chicken Biryani"
 * - "special fried rice" -> "Special Fried Rice"
 * - "samprita " -> "Samprita " (preserves trailing space while typing)
 */
export function toTitleCase(input: string): string {
  if (!input || typeof input !== "string") return input ?? "";
  return input.replace(/(^|[\s\-_/(\[])([a-z\u00E0-\u00FC])/g, (_match, prefix, char) => {
    return prefix + char.toUpperCase();
  });
}

/**
 * Checks whether an input field should be exempt from title-casing.
 * Exceptions:
 * - Email addresses
 * - Passwords
 * - PINs
 * - OTPs
 * - Phone/mobile numbers
 * - URLs
 * - API keys / tokens
 * - GSTIN, PAN, IFSC, and official tax/gov identifiers
 * - Product codes and SKUs / Barcodes
 * - Alphanumeric IDs
 * - Search queries
 * - Free-text notes / instructions where preserving user's original casing is required
 */
export function isExcludedFromTitleCase(
  type?: string,
  name?: string,
  id?: string,
  placeholder?: string,
  explicitNoTitleCase?: boolean,
): boolean {
  if (explicitNoTitleCase) return true;

  const t = (type || "").toLowerCase().trim();
  if (
    [
      "email",
      "password",
      "number",
      "tel",
      "url",
      "search",
      "date",
      "time",
      "datetime-local",
      "month",
      "week",
      "file",
      "hidden",
      "checkbox",
      "radio",
      "range",
      "color",
    ].includes(t)
  ) {
    return true;
  }

  // Normalize camelCase and underscores/hyphens so words can be matched cleanly
  const rawCombined = `${name || ""} ${id || ""} ${placeholder || ""}`;
  const combined = rawCombined
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_\-./]/g, " ")
    .toLowerCase();

  const excludedKeywords = [
    "email",
    "password",
    "pass",
    "pin",
    "otp",
    "phone",
    "mobile",
    "tel",
    "contact",
    "url",
    "link",
    "token",
    "api key",
    "apikey",
    "secret",
    "gst",
    "gstin",
    "pan",
    "ifsc",
    "sku",
    "code",
    "barcode",
    "search",
    "query",
    "note",
    "notes",
    "comment",
    "comments",
    "instruction",
    "instructions",
    "address",
  ];

  return excludedKeywords.some((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    return regex.test(combined);
  });
}

/**
 * Formats a text field safely with Title Case unless exempt.
 */
export function formatTitleCaseSafe(
  text: string,
  fieldName?: string,
  fieldType?: string,
): string {
  if (!text) return "";
  if (isExcludedFromTitleCase(fieldType, fieldName)) {
    return text;
  }
  return toTitleCase(text);
}

/**
 * Recursively normalizes string fields within existing runtime/stored data
 * to Title Case, respecting operational exclusions (ids, emails, codes, dates, etc.).
 */
export function deepNormalizeTitleCase<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    return toTitleCase(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => deepNormalizeTitleCase(item)) as unknown as T;
  }

  if (typeof data === "object") {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (typeof val === "string") {
        const lowerKey = key.toLowerCase();
        // Check if key is excluded (e.g. id, email, token, date, sku, code, etc.)
        if (
          lowerKey === "id" ||
          lowerKey.endsWith("_id") ||
          lowerKey.endsWith("id") ||
          isExcludedFromTitleCase("text", key)
        ) {
          result[key] = val;
        } else if (
          [
            "name",
            "title",
            "category",
            "subcategory",
            "sub_category",
            "department",
            "role",
            "designation",
            "itemname",
            "item_name",
            "dishname",
            "dish_name",
            "customername",
            "customer_name",
            "guestname",
            "guest_name",
            "outletname",
            "outlet_name",
            "vendorname",
            "vendor_name",
            "sectionname",
            "section_name",
            "floorname",
            "floor_name",
            "tablename",
            "table_name",
          ].includes(lowerKey.replace(/[_\-]/g, ""))
        ) {
          result[key] = toTitleCase(val);
        } else {
          result[key] = val;
        }
      } else if (typeof val === "object" && val !== null) {
        result[key] = deepNormalizeTitleCase(val);
      } else {
        result[key] = val;
      }
    }
    return result as T;
  }

  return data;
}

/**
 * Standardizes any existing stored localStorage data in POS to Title Case
 * without disrupting session tokens, property IDs, or credentials.
 */
export function standardizeExistingPosLocalStorage(): void {
  if (typeof window === "undefined" || !window.localStorage) return;

  const targetPrefixes = [
    "retrod_pos_",
    "retrod:pos",
    "retrod_menu",
    "pos_reports",
    "pos_stock",
  ];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Skip tokens, credentials, settings, column layout keys
      if (
        key.includes("token") ||
        key.includes("subdomain") ||
        key.includes("property-id") ||
        key.includes("column") ||
        key.includes("theme") ||
        key.includes("favorites")
      ) {
        continue;
      }

      if (targetPrefixes.some((prefix) => key.startsWith(prefix))) {
        const raw = localStorage.getItem(key);
        if (!raw || (!raw.startsWith("{") && !raw.startsWith("["))) continue;

        try {
          const parsed = JSON.parse(raw);
          const normalized = deepNormalizeTitleCase(parsed);
          const serialized = JSON.stringify(normalized);
          if (serialized !== raw) {
            localStorage.setItem(key, serialized);
          }
        } catch {
          // not JSON, leave untouched
        }
      }
    }
  } catch {
    // ignore
  }
}

