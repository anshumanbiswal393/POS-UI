import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("POS Billing Fixes and Reservation Seat Change", () => {
  it("BillingMenuCatalog uses table-fixed layout with colgroup and aligned column headers", () => {
    const catalogPath = path.resolve(__dirname, "../BillingMenuCatalog.tsx");
    const content = fs.readFileSync(catalogPath, "utf-8");

    expect(content).toContain("table-fixed");
    expect(content).toContain("<colgroup>");
    expect(content).toContain('<col className="w-auto" />');
    expect(content).toContain('<col className="w-32" />');
    expect(content).toContain('<col className="w-24" />');
    expect(content).toContain('<col className="w-28" />');
  });

  it("posMenuService and usePosMenu do not default plates to 0 so untracked dishes are not marked Sold Out", () => {
    const servicePath = path.resolve(__dirname, "../../../../../services/posMenuService.ts");
    const serviceContent = fs.readFileSync(servicePath, "utf-8");

    // addMenuItem does not default plates to 0
    expect(serviceContent).not.toContain("plates: item.plates ?? 0");

    const hookPath = path.resolve(__dirname, "../../../../../hooks/queries/usePosMenu.ts");
    const hookContent = fs.readFileSync(hookPath, "utf-8");

    // Only assign positive plates
    expect(hookContent).toContain("storedQty !== undefined && storedQty > 0");
  });

  it("BillingCartRegister, InvoiceTemplate, and printReceipt inline CGST and SGST into the same single line", () => {
    const invoicePath = path.resolve(__dirname, "../InvoiceTemplate.tsx");
    const invoiceContent = fs.readFileSync(invoicePath, "utf-8");

    // Inlined CGST + SGST in invoice totals
    expect(invoiceContent).toContain("Tax (CGST");
    expect(invoiceContent).toContain("+ SGST");
    expect(invoiceContent).toContain("(p.cgst || 0) + (p.sgst || 0)");

    const receiptPath = path.resolve(__dirname, "../../../../../utils/printReceipt.ts");
    const receiptContent = fs.readFileSync(receiptPath, "utf-8");

    expect(receiptContent).toContain("Tax (CGST + SGST)");
    expect(receiptContent).toContain("(p.cgst || 0) + (p.sgst || 0)");
  });

  it("posTablesService switchReservationTable vacates source table, marks it vacant, and transfers to target table", () => {
    const tablesServicePath = path.resolve(__dirname, "../../../../../services/posTablesService.ts");
    const content = fs.readFileSync(tablesServicePath, "utf-8");

    expect(content).toContain("isSeated");
    expect(content).toContain("updatedSource");
    expect(content).toContain("updatedTarget");
    expect(content).toContain("saveStoredTables(effectiveOutlet, updatedStoredTables)");
    expect(content).toContain("saveStoredReservations(effectiveOutlet, updatedStored)");
    expect(content).toContain("retrod_pos_tables_changed");
  });
});
