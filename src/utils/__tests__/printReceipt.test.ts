import { describe, it, expect } from "vitest";
import {
  numberToWords,
  formatINR,
  generatePosInvoiceHtml,
  settlementRecordToInvoicePayload,
  allOrderItemToInvoicePayload,
  roomOrderToInvoicePayload,
  roomFolioOrderToInvoicePayload,
  type PosInvoicePrintPayload,
} from "../printReceipt";
import type { BillSettlementRecord } from "@/types/posBilling";
import type { AllOrderItem } from "@/types/posOrders";
import type { RoomServiceOrder } from "@/types/posRoomService";

describe("Unified POS Tax Invoice (PMS standard)", () => {
  it("converts numbers to Indian English words accurately", () => {
    expect(numberToWords(0)).toBe("Zero");
    expect(numberToWords(45)).toBe("Forty Five");
    expect(numberToWords(1197)).toBe("One Thousand One Hundred Ninety Seven");
    expect(numberToWords(150000)).toBe("One Lakh Fifty Thousand");
  });

  it("formats INR currency numbers with two decimal places", () => {
    expect(formatINR(0)).toBe("0.00");
    expect(formatINR(1250.5)).toBe("1,250.50");
    expect(formatINR(100000)).toBe("1,00,000.00");
  });

  it("generates exact PMS Tax Invoice HTML matching standard structure", () => {
    const payload: PosInvoicePrintPayload = {
      invoiceNo: "INV-2026/001",
      orderNo: "ORD-99",
      orderType: "Dine-In",
      source: "POS Dine-In",
      issueDate: "13-Nov-2026",
      issueTime: "01:30 PM",
      outletName: "RETROD FINE DINING & BAR",
      outletAddress: "Plot 42, Park Street, Mumbai - 400050",
      outletPhone: "+91 22 2640 8899",
      gstin: "27AABCR8841M1ZU",
      fssai: "11521008000492",
      guestName: "Rahul Sharma",
      guestPhone: "+91 98765 43210",
      tableOrRoom: "Table T-04",
      pax: 2,
      captainName: "Vikram N.",
      status: "SETTLED",
      items: [
        {
          sr: 1,
          name: "Butter Chicken",
          variant: "Full",
          sac: "996331",
          quantity: 2,
          unitPrice: 450,
          amount: 900,
          sgst: 22.5,
          cgst: 22.5,
        },
        {
          sr: 2,
          name: "Garlic Naan",
          sac: "996331",
          quantity: 4,
          unitPrice: 60,
          amount: 240,
          sgst: 6,
          cgst: 6,
        },
      ],
      subtotal: 1140,
      discountAmount: 0,
      taxableAmount: 1140,
      cgst: 28.5,
      sgst: 28.5,
      grandTotal: 1197,
      paidAmount: 1197,
      balanceAmount: 0,
      paymentMethod: "UPI",
    };

    const html = generatePosInvoiceHtml(payload);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("class=\"invoice-box\"");
    expect(html).toContain("RETROD FINE DINING &amp; BAR");
    expect(html).toContain("TAX INVOICE");
    expect(html).toContain("ORIGINAL FOR RECIPIENT");
    expect(html).toContain("Table T-04");
    expect(html).toContain("Rahul Sharma");
    expect(html).toContain("Butter Chicken");
    expect(html).toContain("Garlic Naan");
    expect(html).toContain("996331");
    expect(html).toContain("1,140.00");
    expect(html).toContain("1,197.00");
    expect(html).toContain("One Thousand One Hundred Ninety Seven Only.");
    expect(html).toContain("Conditions &amp; Policies");
    expect(html).toContain("Guest Signature");
    expect(html).toContain("Cashier / Authorized Signatory");
  });

  it("converts BillSettlementRecord via adapter correctly", () => {
    const record: BillSettlementRecord = {
      billNumber: "BILL-2026-881",
      orderType: "dine_in",
      tableNumber: "T-02",
      customerName: "Aman Verma",
      customerPhone: "9876500000",
      guestCount: 3,
      captainName: "Elena",
      terminal: "POS-1",
      shift: "Dinner",
      items: [
        {
          cartId: "c-1",
          item: {
            id: "m-1",
            code: "BC-1",
            name: "Butter Chicken",
            category: "Main Course",
            diet: "non_veg",
            price: 400,
            inStock: true,
            prepTimeMinutes: 15,
          },
          quantity: 2,
          selectedModifiers: [],
          addedAt: "2026-11-13T12:00:00Z",
        },
      ],
      subtotal: 800,
      discountAmount: 50,
      discountCode: "WELCOME50",
      cgst: 18.75,
      sgst: 18.75,
      serviceCharge: 0,
      roundOff: 0,
      grandTotal: 787.5,
      paymentMethod: "cash",
      tenderedAmount: 1000,
      changeDue: 212.5,
      settledAt: "13-Nov-2026 13:45:00",
    };

    const payload = settlementRecordToInvoicePayload(record);

    expect(payload.invoiceNo).toBe("BILL-2026-881");
    expect(payload.guestName).toBe("Aman Verma");
    expect(payload.tableOrRoom).toBe("Table T-02");
    expect(payload.subtotal).toBe(800);
    expect(payload.discountAmount).toBe(50);
    expect(payload.grandTotal).toBe(787.5);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].name).toBe("Butter Chicken");
  });

  it("converts AllOrderItem via adapter correctly", () => {
    const order: AllOrderItem = {
      id: "ord-1",
      orderNo: "ORD-2026-55",
      orderTypeDisplay: "Dine-In",
      tableNo: "T-05",
      customerName: "Priya Singh",
      customerPhone: "9876543210",
      assignTo: "Marcus",
      itemsSummary: "2x Paneer Tikka, 1x Dal Makhani",
      myAmountFormatted: "₹650.00",
      taxAmountFormatted: "₹32.50",
      discountAmountFormatted: "₹0.00",
      grandTotalFormatted: "₹682.50",
      paymentMode: "UPI",
      status: "Settled",
      createdAt: "13-Nov-2026 14:10",
    };

    const payload = allOrderItemToInvoicePayload(order);

    expect(payload.invoiceNo).toBe("INV-ORD-2026-55");
    expect(payload.orderNo).toBe("ORD-2026-55");
    expect(payload.guestName).toBe("Priya Singh");
    expect(payload.subtotal).toBe(650);
    expect(payload.grandTotal).toBe(682.5);
    expect(payload.items).toHaveLength(2);
    expect(payload.items[0].name).toBe("Paneer Tikka");
    expect(payload.items[0].quantity).toBe(2);
  });

  it("converts RoomServiceOrder via adapter correctly", () => {
    const rsOrder: RoomServiceOrder = {
      id: "rs-101",
      orderNumber: "RS-4081",
      roomNumber: "304",
      floor: "Floor 3",
      roomType: "Deluxe Room",
      guest: {
        name: "Vikram Oberoi",
        phoneExtension: "304",
        pax: 2,
      },
      items: [
        {
          id: "it-1",
          name: "Club Sandwich",
          quantity: 1,
          unitPrice: 320,
          specialInstructions: "Extra toasted",
        },
      ],
      status: "settled",
      subtotal: 320,
      serviceCharge: 48,
      tax: 25.6,
      totalAmount: 393.6,
      paymentStatus: "settled",
      billingType: "Room Charge",
      createdAt: "13-Nov-2026 11:30",
    };

    const payload = roomOrderToInvoicePayload(rsOrder);

    expect(payload.invoiceNo).toBe("INV-RS-4081");
    expect(payload.guestName).toBe("Vikram Oberoi");
    expect(payload.tableOrRoom).toBe("Room 304 (Floor 3)");
    expect(payload.grandTotal).toBe(393.6);
    expect(payload.items[0].notes).toBe("Extra toasted");
  });

  it("converts RoomFolioOrder via adapter correctly", () => {
    const folioOrder = {
      orderNumber: "RS-992",
      totalAmount: 525,
      itemsSummary: "1x Biryani, 2x Raita",
      createdAt: "13-Nov-2026 12:45",
      paymentMode: "Room Folio",
    };

    const payload = roomFolioOrderToInvoicePayload(folioOrder, "201", "Mrs. Gupta");

    expect(payload.invoiceNo).toBe("INV-RS-992");
    expect(payload.guestName).toBe("Mrs. Gupta");
    expect(payload.tableOrRoom).toBe("Room 201");
    expect(payload.grandTotal).toBe(525);
    expect(payload.paymentMethod).toBe("Room Folio");
  });
});
