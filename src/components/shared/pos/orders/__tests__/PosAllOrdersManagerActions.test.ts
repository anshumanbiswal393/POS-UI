import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("PosAllOrdersManager Standardization & Actions", () => {
  const filePath = path.resolve(__dirname, "../PosAllOrdersManager.tsx");
  const sourceCode = fs.readFileSync(filePath, "utf-8");

  it("removes the Advance Order tab completely", () => {
    // There should be no tab switcher button with 'Advance Order'
    expect(sourceCode).not.toContain("setActiveTab(\"advance_order\")");
    expect(sourceCode).not.toContain(">Advance Order<");
  });

  it("removes the re-order button and reorder action completely", () => {
    // Reorder button with RotateCcw and alert should be completely removed
    expect(sourceCode).not.toContain('title="Reorder"');
    expect(sourceCode).not.toContain("Reorder items from");
    expect(sourceCode).not.toContain("<RotateCcw");
  });

  it("uses colorful action symbols matching Screenshots 3 & 4", () => {
    expect(sourceCode).toContain("ColorActionPrint");
    expect(sourceCode).toContain("ColorActionEdit");
    expect(sourceCode).toContain("ColorActionView");
  });

  it("applies theme-based background (bg-primary text-primary-foreground) to active table/grid tab", () => {
    expect(sourceCode).toContain('viewMode === "table"');
    expect(sourceCode).toContain("bg-primary text-primary-foreground");
  });
});

