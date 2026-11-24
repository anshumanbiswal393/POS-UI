import { describe, it, expect } from "vitest";
import { extractAndSanitizeMergeTable } from "../printKotTicket";

describe("KOT Print - Merged Tables & Special Instructions Sanitization", () => {
  it("strips merged table notes from cooking instructions and displays merged tables prominently", () => {
    const rawNote = "Merged tables: Table #1, Table #2 (6 seats) for 4 pax.";
    const tableOrRoom = "Table #1";

    const { cleanSpecialNote, displayTableOrRoom } = extractAndSanitizeMergeTable(rawNote, tableOrRoom);

    expect(cleanSpecialNote).toBeUndefined();
    expect(displayTableOrRoom).toBe("MERGED TABLES: Table #1, Table #2");
  });

  it("extracts merged table info while preserving real cooking instructions", () => {
    const rawNote = "Merged tables: Table #1 + Table #2 (6 seats) for 4 pax. Extra spicy and less oil.";
    const tableOrRoom = "Table #1";

    const { cleanSpecialNote, displayTableOrRoom } = extractAndSanitizeMergeTable(rawNote, tableOrRoom);

    expect(cleanSpecialNote).toBe("Extra spicy and less oil.");
    expect(displayTableOrRoom).toBe("MERGED TABLES: Table #1 + Table #2");
  });

  it("handles tableOrRoom with plus sign and shows MERGED TABLES header", () => {
    const tableOrRoom = "Table #3 + Table #4";
    const rawNote = "Make sure food is hot.";

    const { cleanSpecialNote, displayTableOrRoom } = extractAndSanitizeMergeTable(rawNote, tableOrRoom);

    expect(cleanSpecialNote).toBe("Make sure food is hot.");
    expect(displayTableOrRoom).toBe("MERGED TABLES: Table #3 + Table #4");
  });

  it("leaves single table without merge note intact and displays regular table name", () => {
    const tableOrRoom = "Table #5";
    const rawNote = "No onions please.";

    const { cleanSpecialNote, displayTableOrRoom } = extractAndSanitizeMergeTable(rawNote, tableOrRoom);

    expect(cleanSpecialNote).toBe("No onions please.");
    expect(displayTableOrRoom).toBe("Table #5");
  });

  it("handles Merged with Table X pattern", () => {
    const rawNote = "Merged with Table 2. Serve fast.";
    const tableOrRoom = "Table 1";

    const { cleanSpecialNote, displayTableOrRoom } = extractAndSanitizeMergeTable(rawNote, tableOrRoom);

    expect(cleanSpecialNote).toBe("Serve fast.");
    expect(displayTableOrRoom).toBe("MERGED TABLES: Table 1 + Table 2");
  });
});
