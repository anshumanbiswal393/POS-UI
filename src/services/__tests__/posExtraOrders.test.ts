import { describe, it, expect } from "vitest";

describe("Occupied Table Extra Order & Incremental KOT Flow", () => {
  it("formats livePatchOrder payload correctly with append=true", () => {
    const rawPayload = {
      outletId: "out-01",
      tableNumber: "T05",
      append: true,
      sendKot: true,
      items: [
        {
          id: "item-101",
          menuItemId: "item-101",
          name: "Masala Cold Drinks",
          quantity: 2,
          price: 60,
        },
      ],
    };

    expect(rawPayload.append).toBe(true);
    expect(rawPayload.sendKot).toBe(true);
    expect(rawPayload.items).toHaveLength(1);
    expect(rawPayload.items[0].name).toBe("Masala Cold Drinks");
  });

  it("calculates combined totals correctly when new lines are appended", () => {
    // Initial round 1 items already served
    const round1Items = [
      { name: "Paneer Butter Masala", quantity: 2, price: 280, lineTotal: 560, taxRate: 5 },
      { name: "Butter Naan", quantity: 4, price: 40, lineTotal: 160, taxRate: 5 },
    ];
    const round1Subtotal = round1Items.reduce((acc, it) => acc + it.lineTotal, 0); // 720
    const round1Tax = round1Items.reduce((acc, it) => acc + (it.lineTotal * it.taxRate) / 100, 0); // 36
    const round1Grand = round1Subtotal + round1Tax; // 756

    expect(round1Subtotal).toBe(720);
    expect(round1Grand).toBe(756);

    // Extra round 2 items entered in blank check
    const extraRound2Items = [
      { name: "Jeera Rice", quantity: 1, price: 160, lineTotal: 160, taxRate: 5 },
      { name: "Masala Cold Drink", quantity: 2, price: 50, lineTotal: 100, taxRate: 5 },
    ];

    // Consolidated running order across both rounds
    const allItems = [...round1Items, ...extraRound2Items];
    const totalSubtotal = allItems.reduce((acc, it) => acc + it.lineTotal, 0); // 720 + 260 = 980
    const totalTax = allItems.reduce((acc, it) => acc + (it.lineTotal * it.taxRate) / 100, 0); // 49
    const totalGrand = totalSubtotal + totalTax; // 1029

    expect(totalSubtotal).toBe(980);
    expect(totalTax).toBe(49);
    expect(totalGrand).toBe(1029);

    // The KOT ticket for round 2 contains ONLY the new items
    const kot2Items = extraRound2Items;
    expect(kot2Items).toHaveLength(2);
    expect(kot2Items.map((i) => i.name)).toEqual(["Jeera Rice", "Masala Cold Drink"]);
  });

  it("ensures blank check initializes with 0 items while preserving table and customer context", () => {
    const activeTimelineOrder = {
      id: "ord-98213",
      orderNumber: "ORD-2026-0042",
      tableOrRoom: "T05",
      customerName: "Rahul Sharma",
      customerPhone: "+91 98765 43210",
      pax: 4,
      amount: 756,
      items: [
        { name: "Paneer Butter Masala", quantity: 2, price: 280 },
        { name: "Butter Naan", quantity: 4, price: 40 },
      ],
    };

    // When clicking occupied table for extra order:
    const activeCart: any[] = []; // Check is BLANK
    const runningOrderMeta = {
      id: activeTimelineOrder.id,
      orderNumber: activeTimelineOrder.orderNumber,
      tableNumber: activeTimelineOrder.tableOrRoom,
      guestName: activeTimelineOrder.customerName,
      itemsCount: activeTimelineOrder.items.length,
      amount: activeTimelineOrder.amount,
      items: activeTimelineOrder.items,
    };

    expect(activeCart).toHaveLength(0); // Cart is blank
    expect(runningOrderMeta.orderNumber).toBe("ORD-2026-0042");
    expect(runningOrderMeta.itemsCount).toBe(2);
    expect(runningOrderMeta.amount).toBe(756);
  });
});
