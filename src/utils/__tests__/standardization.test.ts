import { describe, it, expect } from "vitest";
import { toTitleCase, isExcludedFromTitleCase, formatTitleCaseSafe } from "../textUtils";
import { formatDateIndian, formatDateTimeIndian, parseDateSafeIndian, toStorageIsoDate, compareDates } from "../dateUtils";
import { fuzzyMatch, fuzzyFilter, matchTermAgainstString } from "../fuzzySearch";

describe("Title Case Formatting Utility", () => {
  it("automatically capitalizes the first letter of each word", () => {
    expect(toTitleCase("samprita patra")).toBe("Samprita Patra");
    expect(toTitleCase("john doe")).toBe("John Doe");
    expect(toTitleCase("chicken biryani")).toBe("Chicken Biryani");
    expect(toTitleCase("special fried rice")).toBe("Special Fried Rice");
    expect(toTitleCase("table reservation")).toBe("Table Reservation");
    expect(toTitleCase("guest name")).toBe("Guest Name");
    expect(toTitleCase("veg manchurian")).toBe("Veg Manchurian");
    expect(toTitleCase("cash payment")).toBe("Cash Payment");
  });

  it("preserves trailing whitespace while typing", () => {
    expect(toTitleCase("samprita ")).toBe("Samprita ");
    expect(toTitleCase("chicken ")).toBe("Chicken ");
  });

  it("handles hyphenated and punctuated words", () => {
    expect(toTitleCase("t-shirt")).toBe("T-Shirt");
    expect(toTitleCase("dine-in order")).toBe("Dine-In Order");
    expect(toTitleCase("paneer tikka (half)")).toBe("Paneer Tikka (Half)");
  });

  it("respects exclusion rules for emails, passwords, pins, otps, skus, etc.", () => {
    expect(isExcludedFromTitleCase("email")).toBe(true);
    expect(isExcludedFromTitleCase("password")).toBe(true);
    expect(isExcludedFromTitleCase("tel")).toBe(true);
    expect(isExcludedFromTitleCase("text", "customer_email")).toBe(true);
    expect(isExcludedFromTitleCase("text", "otp")).toBe(true);
    expect(isExcludedFromTitleCase("text", "gstin")).toBe(true);
    expect(isExcludedFromTitleCase("text", "sku_code")).toBe(true);
    expect(isExcludedFromTitleCase("text", "search")).toBe(true);
    expect(isExcludedFromTitleCase("text", "notes")).toBe(true);
    expect(isExcludedFromTitleCase("text", "customerName")).toBe(false);
    expect(isExcludedFromTitleCase("text", "category_name")).toBe(false);
  });

  it("formatTitleCaseSafe formats eligible inputs and leaves exempt inputs untouched", () => {
    expect(formatTitleCaseSafe("samprita patra", "customerName")).toBe("Samprita Patra");
    expect(formatTitleCaseSafe("samprita@gmail.com", "email", "email")).toBe("samprita@gmail.com");
    expect(formatTitleCaseSafe("9876543210", "mobile", "tel")).toBe("9876543210");
  });
});

describe("Indian Date Formatting Utility (DD-MM-YYYY)", () => {
  it("formats dates into DD-MM-YYYY format", () => {
    expect(formatDateIndian("2026-11-14")).toBe("14-11-2026");
    expect(formatDateIndian("2026-01-05")).toBe("05-01-2026");
    expect(formatDateIndian("2026-12-25")).toBe("25-12-2026");
    expect(formatDateIndian("14-11-2026")).toBe("14-11-2026");
    expect(formatDateIndian(new Date(2026, 10, 14))).toBe("14-11-2026");
  });

  it("handles null and undefined gracefully", () => {
    expect(formatDateIndian(null)).toBe("—");
    expect(formatDateIndian(undefined)).toBe("—");
    expect(formatDateIndian("")).toBe("—");
  });

  it("formats date and time accurately", () => {
    const formatted = formatDateTimeIndian("2026-11-14T14:30:00");
    expect(formatted).toContain("14-11-2026");
    expect(formatted).toMatch(/02:30 PM|2:30 PM/);
  });

  it("parses DD-MM-YYYY without timezone day shift", () => {
    const d = parseDateSafeIndian("14-11-2026");
    expect(d).toBeDefined();
    expect(d?.getDate()).toBe(14);
    expect(d?.getMonth()).toBe(10); // November
    expect(d?.getFullYear()).toBe(2026);
  });

  it("converts back to ISO YYYY-MM-DD for backend storage", () => {
    expect(toStorageIsoDate("14-11-2026")).toBe("2026-11-14");
    expect(toStorageIsoDate("05-01-2026")).toBe("2026-01-05");
  });

  it("correctly compares and sorts dates chronologically rather than string compare", () => {
    // String comparison: "05-12-2026" < "14-01-2026" (because '0' < '1')
    // But chronologically: Jan 14 comes before Dec 5!
    const dates = ["05-12-2026", "14-01-2026", "25-06-2026"];
    dates.sort(compareDates);
    expect(dates).toEqual(["14-01-2026", "25-06-2026", "05-12-2026"]);
  });
});

describe("Fuzzy Search Utility", () => {
  it("matches full name, partial name, and case insensitively", () => {
    const record = {
      name: "Samprita Patra",
      phone: "9876543210",
      table: "T04",
      orderId: "ORD-10519",
    };

    expect(fuzzyMatch(record, "Samprita")).toBe(true);
    expect(fuzzyMatch(record, "Patra")).toBe(true);
    expect(fuzzyMatch(record, "samprita patra")).toBe(true);
    expect(fuzzyMatch(record, "Samprita P")).toBe(true);
    expect(fuzzyMatch(record, "9876543210")).toBe(true);
    expect(fuzzyMatch(record, "T04")).toBe(true);
    expect(fuzzyMatch(record, "10519")).toBe(true);
  });

  it("matches minor spelling mistakes / typos via fuzzy Levenshtein distance", () => {
    const record = { name: "Samprita Patra", item: "Chicken Biryani" };

    // "samprtia" has minor typo
    expect(fuzzyMatch(record, "samprtia")).toBe(true);
    // "chiken" typo for "Chicken"
    expect(fuzzyMatch(record, "chiken")).toBe(true);
    // "biriyani" typo for "Biryani"
    expect(fuzzyMatch(record, "biriyani")).toBe(true);
  });

  it("searches across nested arrays and objects", () => {
    const order = {
      orderNo: "ORD-2001",
      customer: { name: "John Doe", phone: "9123456789" },
      items: [
        { name: "Special Fried Rice", price: 280 },
        { name: "Veg Manchurian", price: 220 },
      ],
      payment: { method: "Cash Payment", status: "Completed" },
    };

    expect(fuzzyMatch(order, "John")).toBe(true);
    expect(fuzzyMatch(order, "Manchurian")).toBe(true);
    expect(fuzzyMatch(order, "Fried Rice")).toBe(true);
    expect(fuzzyMatch(order, "Cash Payment")).toBe(true);
    expect(fuzzyMatch(order, "ORD-2001")).toBe(true);
  });

  it("filters and ranks items correctly", () => {
    const items = [
      { name: "Chicken Tikka" },
      { name: "Paneer Tikka" },
      { name: "Chicken Biryani" },
      { name: "Mutton Biryani" },
    ];

    const results = fuzzyFilter(items, "Chicken");
    expect(results.length).toBe(2);
    expect(results[0].name).toContain("Chicken");
    expect(results[1].name).toContain("Chicken");
  });
});

