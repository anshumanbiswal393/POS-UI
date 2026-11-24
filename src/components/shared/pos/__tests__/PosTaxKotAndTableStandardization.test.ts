import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { getPosTaxSettings, savePosTaxSettings, DEFAULT_POS_TAX_SETTINGS } from "@/lib/posTaxSettings";

describe("POS Tax Settings, KOT History Status & Table Standardization", () => {
  it("posTaxSettings supports configurable taxRates slabs", () => {
    const settings = getPosTaxSettings();
    expect(settings).toBeDefined();
    expect(Array.isArray(settings.taxRates)).toBe(true);
    expect(settings.taxRates).toContain(5);

    savePosTaxSettings({
      cgstPercent: 2.5,
      sgstPercent: 2.5,
      serviceChargePercent: 5,
      taxRates: [0, 5, 12, 18, 28, 40],
    });

    const updated = getPosTaxSettings();
    expect(updated.taxRates).toContain(40);

    // Reset back to default
    savePosTaxSettings(DEFAULT_POS_TAX_SETTINGS);
  });

  it("BillingCartRegister uses percentage-only for tax without flat option", () => {
    const cartPath = path.resolve(__dirname, "../billing/BillingCartRegister.tsx");
    const cartContent = fs.readFileSync(cartPath, "utf-8");

    // Tax control should NOT have flat option
    expect(cartContent).not.toMatch(/<option value="flat">₹ \(Flat\)<\/option>[\s\S]*?Tax Type/);
    expect(cartContent).toContain('title="Select Tax % Rate"');
    expect(cartContent).toContain("Math.round((taxableAmount * taxNumber) / 100)");
  });

  it("Settings Receipts allows adding custom tax % rates", () => {
    const settingsPath = path.resolve(__dirname, "../settings/PosSettingsScreen.tsx");
    const settingsContent = fs.readFileSync(settingsPath, "utf-8");

    expect(settingsContent).toContain("Selectable Tax % Values (POS Dropdown)");
    expect(settingsContent).toContain("+ Add Tax %");
  });

  it("printKotTicket prints COMPLETED status instead of NEW when isHistory is true", () => {
    const kotPath = path.resolve(__dirname, "../../../../utils/printKotTicket.ts");
    const kotContent = fs.readFileSync(kotPath, "utf-8");

    expect(kotContent).toContain("payload.isHistory");
    expect(kotContent).toContain("COMPLETED");
    expect(kotContent).toContain("Kitchen Order Ticket");
  });

  it("KotHistoryModal and KotHistoryTableView pass isHistory and status to printKotTicket", () => {
    const modalPath = path.resolve(__dirname, "../orders/KotHistoryModal.tsx");
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    expect(modalContent).toContain("isHistory: true");
    expect(modalContent).toContain('status: kot.status || "COMPLETED"');

    const tablePath = path.resolve(__dirname, "../orders/KotHistoryTableView.tsx");
    const tableContent = fs.readFileSync(tablePath, "utf-8");
    expect(tablePath).toBeDefined();
    expect(tableContent).toContain("isHistory: true");
    expect(tableContent).toContain('status: kot.status || "COMPLETED"');
  });

  it("Menu List table has S.No serial number column", () => {
    const menuPath = path.resolve(__dirname, "../menu/views/MenuListManagerView.tsx");
    const menuContent = fs.readFileSync(menuPath, "utf-8");

    expect(menuContent).toContain('header: "S.No"');
    expect(menuContent).toContain("filteredMenuItemsWithSerial");
  });

  it("Special Notes table has S.No serial number column", () => {
    const notePath = path.resolve(__dirname, "../menu/views/SpecialNoteView.tsx");
    const noteContent = fs.readFileSync(notePath, "utf-8");

    expect(noteContent).toContain('header: "S.No"');
    expect(noteContent).toContain("specialNotesWithSerial");
  });

  it("Set Item Commission table has S.No serial number column", () => {
    const commPath = path.resolve(__dirname, "../menu/views/SetItemCommissionView.tsx");
    const commContent = fs.readFileSync(commPath, "utf-8");

    expect(commContent).toContain('header: "S.No"');
    expect(commContent).toContain("filteredItemsWithSerial");
  });

  it("Stock Raw Materials table has S.No serial number column and Title Case headers", () => {
    const rawPath = path.resolve(__dirname, "../inventory/views/RawMaterialsManagementView.tsx");
    const rawContent = fs.readFileSync(rawPath, "utf-8");

    expect(rawContent).toContain('label: "S.No"');
    expect(rawContent).toContain('label: "Material Name"');
    expect(rawContent).toContain('label: "Category & Subcategory"');
    expect(rawContent).not.toContain('label: "MATERIAL NAME"');
  });

  it("Stock Categories table has S.No serial number column", () => {
    const catPath = path.resolve(__dirname, "../inventory/views/CategoriesManagementView.tsx");
    const catContent = fs.readFileSync(catPath, "utf-8");

    expect(catContent).toContain('header: "S.No"');
    expect(catContent).toContain("categoriesWithSerial");
  });
});
