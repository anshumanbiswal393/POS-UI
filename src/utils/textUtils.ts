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
