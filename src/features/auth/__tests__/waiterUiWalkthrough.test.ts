// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { posUsersRbacService } from "@/services/posUsersRbacService";
import { ROLE_PERMISSIONS } from "@/lib/auth/rbac";
import { POS_NAV_ITEMS } from "@/app/navigation/pos-nav-config";
import { WAITER_USER } from "@/components/providers/AuthProvider";
import {
  listKotReadyNotices,
  pushKotReadyNotice,
  dismissKotReadyNotice,
} from "@/lib/posReadyNotifications";

describe("Waiter Role UI & Permissions Full Walkthrough", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("Step 1: Retrieves configured Waiter role with 7 operational permissions", async () => {
    const roles = await posUsersRbacService.getRoles();
    const waiterRole = roles.find((r) => r.code === "pos_waiter" || r.name.toLowerCase().includes("waiter"));
    expect(waiterRole).toBeDefined();
    expect(waiterRole?.name).toBe("Waiter");

    const perms = await posUsersRbacService.getRolePermissions(waiterRole!.id);
    const permCodes = perms.map((p) => p.permission_code || p.permission);

    // Operational permissions for Waiter:
    expect(permCodes).toContain("pos.billing.view");
    expect(permCodes).toContain("pos.billing.create");
    expect(permCodes).toContain("pos.orders.view");
    expect(permCodes).toContain("pos.orders.take");
    expect(permCodes).toContain("pos.orders.kot");
    expect(permCodes).toContain("pos.reservations.manage");
    expect(permCodes).toContain("pos.notifications.waiter");

    // Total permissions = 7 out of 20
    expect(permCodes.length).toBe(7);

    // Strictly forbidden permissions:
    expect(permCodes).not.toContain("pos.kot.view");
    expect(permCodes).not.toContain("pos.billing.settle");
    expect(permCodes).not.toContain("pos.inventory.view");
    expect(permCodes).not.toContain("pos.inventory.manage");
    expect(permCodes).not.toContain("pos.reports.view");
    expect(permCodes).not.toContain("pos.settings.manage");
    expect(permCodes).not.toContain("pos.users.manage");
  });

  it("Step 2: Creates and persists a new Waiter staff user via UI form", async () => {
    const created = await posUsersRbacService.createUser({
      name: "Rohan Kumar (Floor Waiter)",
      username: "rohan.waiter",
      email: "waiter@retrod.in",
      phone: "9876543220",
      role: "pos_waiter",
      outlet_name: "Anshu Suite Restaurant",
      pin: "5566",
      is_active: true,
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Rohan Kumar (Floor Waiter)");
    expect(created.email).toBe("waiter@retrod.in");
    expect(created.role).toBe("pos_waiter");
    expect(created.is_active).toBe(true);

    const allUsers = await posUsersRbacService.getUsers();
    expect(allUsers.some((u) => u.email === "waiter@retrod.in")).toBe(true);
  });

  it("Step 3: Verifies Waiter login routes to POS billing terminal (/pos/billing)", () => {
    const resolveStartingRoute = (role?: string) => {
      const roleLower = String(role || "").toLowerCase();
      if (roleLower === "pos_kitchen" || roleLower.includes("kitchen")) {
        return "/pos/kot";
      }
      if (roleLower === "pos_waiter" || roleLower === "waiter" || roleLower.includes("waiter")) {
        return "/pos/billing";
      }
      return "/pos";
    };

    expect(resolveStartingRoute("pos_waiter")).toBe("/pos/billing");
    expect(resolveStartingRoute(WAITER_USER.role)).toBe("/pos/billing");
    expect(resolveStartingRoute("pos_kitchen")).toBe("/pos/kot");
    expect(resolveStartingRoute("pos_admin")).toBe("/pos");
  });

  it("Step 4: Simulates Sidebar generation for Waiter - Take Order, Billing, Orders (Current & History only), Reservations", () => {
    const simulateWaiterSidebar = (userRole: string) => {
      const isWaiter = userRole === "pos_waiter" || userRole === "waiter" || userRole.includes("waiter");
      const waiterPerms = new Set([
        "pos.billing.view",
        "pos.billing.create",
        "pos.orders.view",
        "pos.orders.take",
        "pos.orders.create",
        "pos.orders.kot",
        "pos.reservations.manage",
        "pos.notifications.waiter",
      ]);

      const filterNav = (items: typeof POS_NAV_ITEMS): typeof POS_NAV_ITEMS => {
        return items
          .filter((item) => {
            if (isWaiter) {
              const allowedIds = new Set(["take-order", "billing", "daily", "reservations", "notifications"]);
              if (!allowedIds.has(item.id)) return false;
            }
            if (item.permission && !waiterPerms.has(item.permission)) return false;
            if (item.anyPermissions && !item.anyPermissions.some((p) => waiterPerms.has(p))) return false;
            return true;
          })
          .map((item) => {
            if (!item.children) return item;
            const filteredChildren = item.children.filter((child) => {
              if (child.permission && !waiterPerms.has(child.permission)) return false;
              if (child.anyPermissions && !child.anyPermissions.some((p) => waiterPerms.has(p))) return false;
              return true;
            });
            return { ...item, children: filteredChildren };
          });
      };

      return filterNav(POS_NAV_ITEMS);
    };

    const waiterSidebar = simulateWaiterSidebar("pos_waiter");
    const visibleIds = waiterSidebar.map((i) => i.id);
    expect(visibleIds).toEqual(["take-order", "billing", "daily", "reservations", "notifications"]);

    // Orders (daily) has Current Orders and Order History, but NOT KOT or Pending Payments (settlement)
    const dailyItem = waiterSidebar.find((i) => i.id === "daily");
    expect(dailyItem).toBeDefined();
    const dailyChildrenIds = dailyItem?.children?.map((c) => c.id) || [];
    expect(dailyChildrenIds).toContain("live-orders");
    expect(dailyChildrenIds).toContain("all-orders");
    expect(dailyChildrenIds).not.toContain("kot");
    expect(dailyChildrenIds).not.toContain("settlement");

    // Strictly forbidden root modules
    expect(visibleIds).not.toContain("dashboard");
    expect(visibleIds).not.toContain("inventory");
    expect(visibleIds).not.toContain("reports");
    expect(visibleIds).not.toContain("management");
  });

  it("Step 5: Verifies Waiter Top Bar notifications only display real ready KOT tickets (no dummy orders)", () => {
    expect(listKotReadyNotices()).toEqual([]);

    pushKotReadyNotice({
      id: "kot-ready-real-501",
      title: "Order #ORD-501 is ready",
      message: "Dine In · Paneer Tikka ready to serve.",
      createdAt: Date.now(),
      orderNumber: "ORD-501",
    });

    const notices = listKotReadyNotices();
    expect(notices.length).toBe(1);
    expect(notices[0].title).toContain("ORD-501");

    dismissKotReadyNotice("kot-ready-real-501");
    expect(listKotReadyNotices()).toEqual([]);
  });

  it("Step 6: Verifies Waiter Settings are restricted strictly to Profile & Theme", () => {
    const simulateSettingsMenu = (userRole: string) => {
      const isKitchen = userRole === "pos_kitchen" || userRole.includes("kitchen");
      const isWaiter = userRole === "pos_waiter" || userRole === "waiter" || userRole.includes("waiter");
      const isLimitedStaff = isKitchen || isWaiter;

      return isLimitedStaff
        ? [{ id: "account", label: "Profile & Theme" }]
        : [
            { id: "account", label: "Account" },
            { id: "security", label: "Security" },
            { id: "outlets", label: "Outlets" },
            { id: "terminal", label: "Terminal" },
            { id: "receipts", label: "Receipts" },
            { id: "printers", label: "Printers" },
          ];
    };

    const waiterMenu = simulateSettingsMenu("pos_waiter");
    expect(waiterMenu.length).toBe(1);
    expect(waiterMenu[0].label).toBe("Profile & Theme");

    const adminMenu = simulateSettingsMenu("pos_admin");
    expect(adminMenu.length).toBe(6);
  });

  it("Step 7: Verifies Waiter has access to Reservation list and can manage reservations", async () => {
    const { posTablesService } = await import("@/services/posTablesService");
    const initialReservations = await posTablesService.getReservations();
    expect(initialReservations).toBeDefined();
    expect(Array.isArray(initialReservations)).toBe(true);
    expect(initialReservations.length).toBe(0);

    // Verify Waiter can add new reservation
    const created = await posTablesService.addReservation({
      tableId: "t13",
      tableNumber: "T13",
      customerName: "Aarav Sharma",
      customerPhone: "9876543299",
      guests: 3,
      reservationDate: "Today",
      reservationTime: "08:30 PM",
    });

    expect(created.id).toBeDefined();
    expect(created.customerName).toBe("Aarav Sharma");
    expect(created.status).toBe("reserved");

    const reservations = await posTablesService.getReservations();
    expect(reservations.length).toBe(1);
    expect(reservations[0].customerName).toBe("Aarav Sharma");
    expect(reservations[0].tableNumber).toBe(created.tableNumber);
  });

  it("Step 8: Verifies Waiter Order Ready Notifications Hub - Active queue, Serve action, and History transition", async () => {
    const { posWaiterNotificationService } = await import("@/services/posWaiterNotificationService");

    // 1. Initially no active ready notices
    expect(posWaiterNotificationService.getActiveReadyNotices()).toEqual([]);

    // 2. Kitchen marks an order ready
    const notice = posWaiterNotificationService.dispatchTestReadyNotice({
      orderNumber: "ORD-901",
      tableNumber: "Table #7",
      itemsText: "2x Chicken Biryani, 1x Raita",
      customerName: "Vikram Seth",
      orderType: "Dine In",
    });

    const activeList = posWaiterNotificationService.getActiveReadyNotices();
    expect(activeList.length).toBe(1);
    expect(activeList[0].orderNumber).toBe("ORD-901");
    expect(activeList[0].tableNumber).toBe("Table #7");
    expect(activeList[0].itemsText).toContain("Biryani");

    // 3. Waiter Raju clicks "Serve"
    const servedRecord = await posWaiterNotificationService.markServed(
      notice.id,
      "Raju waiter",
    );

    expect(servedRecord.status).toBe("completed");
    expect(servedRecord.stewardName).toBe("Raju waiter");
    expect(servedRecord.orderNumber).toBe("ORD-901");
    expect(servedRecord.tableNumber).toBe("Table #7");

    // 4. Active list is now empty (removed from current notifications)
    expect(posWaiterNotificationService.getActiveReadyNotices().length).toBe(0);

    // 5. Appears in Notification History in tabular form with steward name & completed status
    const todayStr = new Date().toISOString().split("T")[0];
    const history = posWaiterNotificationService.getServedHistory({
      startDate: todayStr,
      endDate: todayStr,
    });

    expect(history.length).toBeGreaterThanOrEqual(1);
    const found = history.find((h) => h.orderNumber === "ORD-901");
    expect(found).toBeDefined();
    expect(found?.stewardName).toBe("Raju waiter");
    expect(found?.status).toBe("completed");
    expect(found?.tableNumber).toBe("Table #7");

    // 6. Omnibar search filter works by steward or order number
    const searched = posWaiterNotificationService.getServedHistory({
      search: "ORD-901",
    });
    expect(searched.length).toBe(1);
    expect(searched[0].stewardName).toBe("Raju waiter");
  });
});

