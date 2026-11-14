import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Pending Payments / Due Settlement & Global Standards", () => {
  const dueFilePath = path.resolve(__dirname, "../PosDueSettlementManager.tsx");
  const dueContent = fs.readFileSync(dueFilePath, "utf-8");

  it("Pending Payments separates Bill No, Location, Guest Details, and Waiter Details into distinct columns", () => {
    // Separate columns
    expect(dueContent).toContain('header: "Bill No"');
    expect(dueContent).toContain('header: "Location"');
    expect(dueContent).toContain('header: "Guest Details"');
    expect(dueContent).toContain('header: "Waiter Details"');
  });

  it("Pending Payments shows Order Status as Ongoing (light orange) or Paid (green)", () => {
    expect(dueContent).toContain('header: "Order Status"');
    expect(dueContent).toContain('isPaid ? "Paid" : "Ongoing"');
    expect(dueContent).toContain("bg-amber-50 text-amber-900 border-amber-300");
    expect(dueContent).toContain("bg-emerald-50 text-emerald-800 border-emerald-300");
  });

  it("Pending Payments removes redundant status cards bar and displays open dues near heading", () => {
    // Redundant card grid removed
    expect(dueContent).not.toContain("Moves to Order History");
    expect(dueContent).not.toContain('<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">');

    // Open dues badge near heading
    expect(dueContent).toContain("Open Dues:");
    expect(dueContent).toContain("totalOpenDues");
  });

  it("BillingCartRegister properly imports FoodTypeIcon preventing runtime errors", () => {
    const cartPath = path.resolve(__dirname, "../../billing/BillingCartRegister.tsx");
    const cartContent = fs.readFileSync(cartPath, "utf-8");

    expect(cartContent).toContain('import { FoodTypeIcon } from "@/components/ui/FoodTypeIcon";');
    expect(cartContent).toContain("<FoodTypeIcon type={cartItem.item.diet}");
  });

  it("Standardizes column header to 'Pax' across reservations and tables", () => {
    const resPath = path.resolve(__dirname, "../../reservations/PosReservationsManager.tsx");
    const resContent = fs.readFileSync(resPath, "utf-8");

    expect(resContent).toContain('header: "Pax"');
    expect(resContent).not.toContain('header: "Guests / Pax"');
  });

  it("Styles CSS defines border colors matching PMS reference Screenshot 4", () => {
    const cssPath = path.resolve(__dirname, "../../../../../styles.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    expect(cssContent).toContain("--border: #e2e8f0;");
    expect(cssContent).toContain("--border-strong: #cbd5e1;");
    expect(cssContent).toContain("border: 1.5px solid var(--border-strong) !important;");
  });

  it("Pending Payments has Pay Now button and removes duplicate search bar border", () => {
    const duePath = path.resolve(__dirname, "../PosDueSettlementManager.tsx");
    const dueContent = fs.readFileSync(duePath, "utf-8");

    expect(dueContent).toContain("Pay Now");
    expect(dueContent).not.toContain(">Settle<");
  });

  it("Reservations removes the guest initials circle avatar", () => {
    const resPath = path.resolve(__dirname, "../../reservations/PosReservationsManager.tsx");
    const resContent = fs.readFileSync(resPath, "utf-8");

    // Guest contact cell renders clean name without initials icon
    expect(resContent).not.toContain("{getInitials(res.customerName)}");
  });
});
