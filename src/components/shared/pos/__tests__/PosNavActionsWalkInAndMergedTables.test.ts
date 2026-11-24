import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("POS Nav Buttons, Icon-Only Actions, Walk-In Guest & Merged Tables", () => {
  it("ExportToExcelButton matches standard pill layout with Download icon and 'Excel' text", () => {
    const excelBtnPath = path.resolve(__dirname, "../../../ui/ExportToExcelButton.tsx");
    const content = fs.readFileSync(excelBtnPath, "utf-8");

    expect(content).toContain("Download");
    expect(content).toContain('label = "Excel"');
    expect(content).toContain("rounded-xl");
    expect(content).toContain("border-slate-300");
  });

  it("PrintReportButton matches standard pill layout with Printer icon and 'Print' text", () => {
    const printBtnPath = path.resolve(__dirname, "../../../ui/PrintReportButton.tsx");
    const content = fs.readFileSync(printBtnPath, "utf-8");

    expect(content).toContain("Printer");
    expect(content).toContain('label = "Print"');
    expect(content).toContain("rounded-xl");
    expect(content).toContain("border-slate-300");
  });

  it("KotHistoryTableView uses ColorActionPrint without text in action column", () => {
    const kotPath = path.resolve(__dirname, "../orders/KotHistoryTableView.tsx");
    const content = fs.readFileSync(kotPath, "utf-8");

    expect(content).toContain("ColorActionPrint");
    expect(content).toContain('title="Print KOT Ticket"');
    // Ensure no plain text label inside action button
    expect(content).not.toMatch(/<ColorActionPrint[\s\S]*?>\s*<span>Print<\/span>/);
  });

  it("SpecialNoteView uses ColorActionEdit and ColorActionDelete without text", () => {
    const specialNotePath = path.resolve(__dirname, "../menu/views/SpecialNoteView.tsx");
    const content = fs.readFileSync(specialNotePath, "utf-8");

    expect(content).toContain("ColorActionEdit");
    expect(content).toContain("ColorActionDelete");
    expect(content).not.toMatch(/<button[^>]*>[\s\S]*?<Edit2/);
  });

  it("PosAllOrdersManager, PosDueSettlementManager, and PosReservationsManager use canonical Export and Print buttons", () => {
    const allOrdersPath = path.resolve(__dirname, "../orders/PosAllOrdersManager.tsx");
    const duePath = path.resolve(__dirname, "../orders/PosDueSettlementManager.tsx");
    const resPath = path.resolve(__dirname, "../reservations/PosReservationsManager.tsx");

    const allOrdersContent = fs.readFileSync(allOrdersPath, "utf-8");
    const dueContent = fs.readFileSync(duePath, "utf-8");
    const resContent = fs.readFileSync(resPath, "utf-8");

    expect(allOrdersContent).toContain("<ExportToExcelButton");
    expect(allOrdersContent).toContain("<PrintReportButton");

    expect(dueContent).toContain("<ExportToExcelButton");
    expect(dueContent).toContain("<PrintReportButton");

    expect(resContent).toContain("<ExportToExcelButton");
    expect(resContent).toContain("<PrintReportButton");
  });

  it("BillingCartRegister shows Walk-in Guest (Default) and allows switching back and forth", () => {
    const cartPath = path.resolve(__dirname, "../billing/BillingCartRegister.tsx");
    const content = fs.readFileSync(cartPath, "utf-8");

    expect(content).toContain("Walk-in Guest (Default)");
    expect(content).toContain('onSelectCustomer(null)');
    expect(content).not.toContain("Choose Guest (Walk-in)...");
  });

  it("PosBillingManager tracks isExplicitWalkIn and prevents overriding user selection", () => {
    const billingPath = path.resolve(__dirname, "../billing/PosBillingManager.tsx");
    const content = fs.readFileSync(billingPath, "utf-8");

    expect(content).toContain("isExplicitWalkIn");
    expect(content).toContain("if (orderType !== \"dine_in\" || !activeTable || selectedCustomer || isExplicitWalkIn) return;");
  });

  it("posTablesService marks all constituent merged tables as occupied with active order", () => {
    const servicePath = path.resolve(__dirname, "../../../../services/posTablesService.ts");
    const content = fs.readFileSync(servicePath, "utf-8");

    expect(content).toContain("orderSrc.includes(\"+\")");
    expect(content).toContain("status: \"occupied\"");
    expect(content).toContain("tblNumOnly === pNumOnly");
  });

  it("BillingCartRegister displays cumulative totals when runningOrder is present", () => {
    const cartPath = path.resolve(__dirname, "../billing/BillingCartRegister.tsx");
    const content = fs.readFileSync(cartPath, "utf-8");

    expect(content).toContain("Previous Bill");
    expect(content).toContain("Extra Items Total");
    expect(content).toContain("Cumulative Grand Total");
    expect(content).toContain("runningOrder.amount + grandTotal");
  });
});
