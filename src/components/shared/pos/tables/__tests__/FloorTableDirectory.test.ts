import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Floor & Table Directory and Persistence", () => {
  it("PosTakeOrderManager replaces static text with List of Floors & Tables button", () => {
    const takeOrderFilePath = path.resolve(__dirname, "../../PosTakeOrderManager.tsx");
    const content = fs.readFileSync(takeOrderFilePath, "utf-8");

    // Static text 'Restaurant Seating & Table Ordering' should not exist
    expect(content).not.toContain("Restaurant Seating & Table Ordering");

    // 'List of Floors & Tables' button should be present
    expect(content).toContain("List of Floors & Tables");
    expect(content).toContain("FloorTableDirectoryDrawer");
  });

  it("FloorTableDirectoryDrawer has delete confirmation warning popup and Excel grid structure", () => {
    const drawerFilePath = path.resolve(__dirname, "../FloorTableDirectoryDrawer.tsx");
    const content = fs.readFileSync(drawerFilePath, "utf-8");

    // Drawer header and buttons
    expect(content).toContain("List of Floors & Tables");
    expect(content).toContain("Add Floor");
    expect(content).toContain("Add Table");

    // Warning confirmation popup before deletion
    expect(content).toContain("Confirm Delete");
    expect(content).toContain("Are you sure you want to delete");

    // Excel grid formatting
    expect(content).toContain("text-center border-collapse border border-slate-300");
  });

  it("posTablesService supports dual persistence for floors and tables", () => {
    const serviceFilePath = path.resolve(__dirname, "../../../../../services/posTablesService.ts");
    const content = fs.readFileSync(serviceFilePath, "utf-8");

    expect(content).toContain("retrod_pos_areas_");
    expect(content).toContain("retrod_pos_tables_");
    expect(content).toContain("getStoredAreas");
    expect(content).toContain("saveStoredAreas");
    expect(content).toContain("getStoredTables");
    expect(content).toContain("saveStoredTables");
  });
});
