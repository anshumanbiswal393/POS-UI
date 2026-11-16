import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("POS Navigation, Billing Runtime, and Management Logs Standardization", () => {
  it("pos-nav-config removes Expense & Withdrawal and Service Payment History completely from Accounting", () => {
    const navPath = path.resolve(__dirname, "../../../../../app/navigation/pos-nav-config.ts");
    const content = fs.readFileSync(navPath, "utf-8");

    // Accounting section must NOT contain Expense & Withdrawal or Service Payment History
    expect(content).not.toContain("Expense & Withdrawal");
    expect(content).not.toContain("Service Payment History");
    expect(content).not.toContain("acc-expenses");
    expect(content).not.toContain("acc-service");

    // But must keep required accounting sections:
    expect(content).toContain("Payment Information");
    expect(content).toContain("GST Information");
    expect(content).toContain("Bank Details");
    expect(content).toContain("KYC Details");
  });

  it("PosBillingManager does not reference undefined global 'search' and parses editOrder safely", () => {
    const managerPath = path.resolve(__dirname, "../../billing/PosBillingManager.tsx");
    const content = fs.readFileSync(managerPath, "utf-8");

    // Must not have naked search.editOrder
    expect(content).not.toContain("!search.editOrder");
    expect(content).not.toContain("search.editOrder");
    expect(content).toContain("isEditOrderParam");
  });

  it("NotificationsLogsView integrates live in-app notifications and populates fallback logs", () => {
    const notifPath = path.resolve(__dirname, "../views/logs/NotificationsLogsView.tsx");
    const content = fs.readFileSync(notifPath, "utf-8");

    expect(content).toContain("usePosNotifications");
    expect(content).toContain("activeNotifications");
    expect(content).toContain("activeMapped");
  });

  it("AuditTrailView populates baseline operational audit events when server log is empty", () => {
    const auditPath = path.resolve(__dirname, "../views/audit/AuditTrailView.tsx");
    const content = fs.readFileSync(auditPath, "utf-8");

    expect(content).toContain("fallbackAudit");
    expect(content).toContain("LOGIN");
    expect(content).toContain("SETTINGS_CHANGE");
    expect(content).toContain("SHIFT_OPEN");
    expect(content).toContain("formatAuditUserName");
    expect(content).toContain("formatAuditRole");
    expect(content).toContain("Frontdesk Agent");
    expect(content).toContain("POS Admin");
    expect(content).toContain("Store Manager");
    expect(content).toContain("Floor Captain");
  });
});
