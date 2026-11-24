// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { posWaiterNotificationService } from "../posWaiterNotificationService";

describe("posWaiterNotificationService - Waiter Food Ready Notifications & Served History", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds and retrieves active food ready notifications", () => {
    expect(posWaiterNotificationService.getActiveReadyNotices()).toEqual([]);

    posWaiterNotificationService.dispatchTestReadyNotice({
      orderNumber: "ORD-20261124-555",
      tableNumber: "Table #3",
      itemsText: "1x Paneer Butter Masala, 2x Roti",
      orderType: "Dine In",
      customerName: "Sanjay Gupta",
    });

    const active = posWaiterNotificationService.getActiveReadyNotices();
    expect(active.length).toBe(1);
    expect(active[0].orderNumber).toBe("ORD-20261124-555");
    expect(active[0].tableNumber).toBe("Table #3");
    expect(active[0].customerName).toBe("Sanjay Gupta");
    expect(active[0].itemsText).toContain("Paneer");
  });

  it("marks a notification as served, removing it from active and adding to history with steward name", async () => {
    const notice = posWaiterNotificationService.dispatchTestReadyNotice({
      orderNumber: "ORD-20261124-777",
      tableNumber: "Table #9",
      itemsText: "2x Cold Coffee, 1x Veg Sandwich",
    });

    expect(posWaiterNotificationService.getActiveReadyNotices().length).toBe(1);

    const servedRecord = await posWaiterNotificationService.markServed(
      notice.id,
      "Rohan Steward",
    );

    // 1. Verify returned served record
    expect(servedRecord.id).toBeDefined();
    expect(servedRecord.status).toBe("completed");
    expect(servedRecord.stewardName).toBe("Rohan Steward");
    expect(servedRecord.orderNumber).toBe("ORD-20261124-777");
    expect(servedRecord.tableNumber).toBe("Table #9");

    // 2. Active notifications queue is now cleared
    expect(posWaiterNotificationService.getActiveReadyNotices().length).toBe(0);

    // 3. Appears in history
    const history = posWaiterNotificationService.getServedHistory();
    const found = history.find((h) => h.orderNumber === "ORD-20261124-777");
    expect(found).toBeDefined();
    expect(found?.stewardName).toBe("Rohan Steward");
    expect(found?.status).toBe("completed");
  });

  it("filters served history date-wise and via omnibar search query", async () => {
    // Dispatch and serve an order
    const notice = posWaiterNotificationService.dispatchTestReadyNotice({
      orderNumber: "ORD-20261124-888",
      tableNumber: "Room 102",
      itemsText: "1x Chicken Soup",
    });

    await posWaiterNotificationService.markServed(notice.id, "Amit Waiter");

    const todayStr = new Date().toISOString().split("T")[0];

    // Query for today
    const todayHistory = posWaiterNotificationService.getServedHistory({
      startDate: todayStr,
      endDate: todayStr,
    });
    expect(todayHistory.some((h) => h.orderNumber === "ORD-20261124-888")).toBe(true);

    // Query for future date returns 0 for this item
    const futureHistory = posWaiterNotificationService.getServedHistory({
      startDate: "2099-01-01",
      endDate: "2099-01-02",
    });
    expect(futureHistory.some((h) => h.orderNumber === "ORD-20261124-888")).toBe(false);

    // Search by steward name
    const stewardSearch = posWaiterNotificationService.getServedHistory({
      search: "Amit Waiter",
    });
    expect(stewardSearch.length).toBe(1);
    expect(stewardSearch[0].stewardName).toBe("Amit Waiter");

    // Search by table/room number
    const roomSearch = posWaiterNotificationService.getServedHistory({
      search: "Room 102",
    });
    expect(roomSearch.length).toBe(1);
    expect(roomSearch[0].tableNumber).toBe("Room 102");
  });
});
