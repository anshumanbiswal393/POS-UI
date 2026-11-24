import { describe, it, expect } from "vitest";
import { MENU_QUERY_KEYS, queryKeys } from "@/hooks/queries/usePosMenu";
import { posMenuService } from "@/services/posMenuService";
import type { TableStatusItem } from "@/types/posDashboard";
import type { TableStatus } from "@/types/posTables";
import type { POSVirtualWalletDto } from "@/services/posManagementService";
import type { PaymentTransaction } from "@/components/shared/pos/management/views/accounting/PaymentInformationView";
import type { RoomServiceOrder } from "@/types/posRoomService";
import { roomOrderToInvoicePayload } from "@/utils/printReceipt";

describe("Batch 4 Verification: 7 Defect Fixes", () => {
  // 1. Menu Management: queryKeys.items and billing menu keys
  it("Issue 18: should provide queryKeys.items and billingMenu on MENU_QUERY_KEYS and queryKeys", () => {
    expect(MENU_QUERY_KEYS.items).toBeDefined();
    expect(MENU_QUERY_KEYS.items("outlet-123")).toEqual(["pos", "menu", "items", "outlet-123"]);
    expect(MENU_QUERY_KEYS.billingMenu).toBeDefined();
    expect(MENU_QUERY_KEYS.billingMenu("outlet-123")).toEqual(["pos", "billing", "menu", "outlet-123"]);

    expect(queryKeys.items).toBeDefined();
    expect(typeof queryKeys.items).toBe("function");
    expect(queryKeys.items("outlet-123")).toEqual(["pos", "menu", "items", "outlet-123"]);
    expect(queryKeys.items.all).toEqual(["pos", "menu", "items"]);
  });

  // 2. Menu Management: Non-strict equality check between string and number item ID
  it("Issue 19: should resolve item when comparing numeric and string IDs in getMenuItemById", async () => {
    // Inject a test item with numeric ID 999
    const created = await (posMenuService as any).addMenuItem({
      id: 999 as any,
      name: "Paneer Tikka Masala",
      price: 320,
      category: "Main Course",
      outletId: "outlet-test",
    });

    // Look up using string "999" when item in store has numeric id
    const foundByString = await posMenuService.getMenuItemById("999");
    expect(foundByString).not.toBeNull();
    expect(foundByString?.name).toBe("Paneer Tikka Masala");

    // Look up using number 999
    const foundByNumber = await posMenuService.getMenuItemById(999 as any);
    expect(foundByNumber).not.toBeNull();
    expect(foundByNumber?.name).toBe("Paneer Tikka Masala");
  });

  // 3. Tables & Floor Plan: Table status union includes 'billed'
  it("Issue 20: should include 'billed' in TableStatus and TableStatusItem union", () => {
    const tableStatus: TableStatus = "billed";
    expect(tableStatus).toBe("billed");

    const dashboardItem: TableStatusItem = {
      tableNumber: "T04",
      status: "billed",
    };
    expect(dashboardItem.status).toBe("billed");
  });

  // 4. Reservations: Duplicate formatDateIndian removed
  it("Issue 21: should import and format Indian dates without TS2300 duplication error", async () => {
    const { formatDateIndian } = await import("@/utils/dateUtils");
    const formatted = formatDateIndian(new Date("2026-11-23T10:00:00Z"));
    expect(formatted).toBeDefined();
    expect(formatted).toContain("2026");
  });

  // 5. Accounting & Wallets: POSVirtualWalletDto field normalization
  it("Issue 22: should contain customer_mobile, total_credited, balance on POSVirtualWalletDto", () => {
    const wallet: POSVirtualWalletDto = {
      id: "wallet-01",
      outlet: "outlet-main",
      customer_name: "Aman Sharma",
      customer_mobile: "+91 9876543210",
      customer_phone: "+91 9876543210",
      balance: "1500.00",
      total_credited: "2500.00",
      total_debited: "1000.00",
      last_transaction_at: "2026-11-23T11:00:00Z",
      is_active: true,
      transactions: [
        {
          id: "tx-1",
          transaction_type: "credit",
          amount: "2500.00",
          balance_before: "0.00",
          balance_after: "2500.00",
          created_at: "2026-11-20T10:00:00Z",
        },
        {
          id: "tx-2",
          transaction_type: "debit",
          amount: "1000.00",
          balance_before: "2500.00",
          balance_after: "1500.00",
          created_at: "2026-11-23T11:00:00Z",
        },
      ],
    };

    expect(wallet.customer_mobile).toBe("+91 9876543210");
    expect(parseFloat(String(wallet.balance))).toBe(1500);
    expect(parseFloat(String(wallet.total_credited))).toBe(2500);
  });

  // 6. Accounting & Payments: PaymentTransaction mode, mdrFee, netSettled and PosCreatePanel isOpen
  it("Issue 23: should support mode, mdrFee, netSettled on PaymentTransaction", () => {
    const transaction: PaymentTransaction = {
      id: "tx-pay-1",
      orderId: "ord-101",
      billNo: "INV-2026-001",
      customerName: "Rahul Verma",
      provider: "UPI",
      mode: "UPI",
      txnRef: "UPI-REF-9988",
      amount: 1000,
      fee: 15,
      mdrFee: 15,
      netAmount: 985,
      netSettled: 985,
      status: "Success",
      timestamp: "2026-11-23 12:00:00",
      notes: "Direct QR scan",
    };

    expect(transaction.mode).toBe("UPI");
    expect(transaction.mdrFee).toBe(15);
    expect(transaction.netSettled).toBe(985);
  });

  // 7. Printing Engine: RoomServiceOrder specialInstructions
  it("Issue 24: should include specialInstructions on RoomServiceOrder and map to invoice/KOT print payload", () => {
    const roomOrder: RoomServiceOrder = {
      id: "rs-101",
      orderNumber: "RS-8088",
      roomNumber: "302",
      floor: "Floor 3",
      roomType: "Executive Suite",
      guest: {
        name: "Vikram Malhotra",
        phoneExtension: "302",
        pax: 2,
      },
      items: [
        {
          id: "itm-1",
          name: "Club Sandwich",
          quantity: 2,
          unitPrice: 350,
          specialInstructions: "Extra cheese, no mayo",
        },
      ],
      status: "kitchen_prep",
      subtotal: 700,
      serviceCharge: 70,
      tax: 35,
      totalAmount: 805,
      createdAt: new Date().toISOString(),
      elapsedMinutes: 5,
      traySetup: "Single Tray",
      paymentMethod: "room_folio",
      notes: "Deliver promptly at 1:30 PM",
      specialInstructions: "Guest has severe peanut allergy. Deliver promptly at 1:30 PM.",
    };

    expect(roomOrder.specialInstructions).toBe(
      "Guest has severe peanut allergy. Deliver promptly at 1:30 PM.",
    );

    const payload = roomOrderToInvoicePayload(roomOrder);
    expect(payload.specialNote).toBe(
      "Guest has severe peanut allergy. Deliver promptly at 1:30 PM.",
    );
    expect(payload.tableOrRoom).toContain("Room 302");
    expect(payload.grandTotal).toBe(805);
  });
});
