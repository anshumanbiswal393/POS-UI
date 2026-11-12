// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  resolveNotificationRole,
  filterNotificationsByRole,
  sortNotificationsRecentFirst,
  type PosNotification,
} from "../usePosNotifications";
import {
  isReservationUpcomingWithin30Min,
  minutesUntilReservation,
} from "@/services/posTablesService";
import type { ReservationItem } from "@/types/posTables";

describe("POS Notifications - Role-Based Access and Ordering", () => {
  const mockStockNotification: PosNotification = {
    id: "alert-tomato-01",
    title: "Low stock alert",
    message: "Tomato is at 2 kg.",
    category: "STOCK",
    createdAt: 1700000100000,
    isRead: false,
  };

  const mockKotNotification: PosNotification = {
    id: "kot-ready-101",
    title: "Order #ORD-101 is ready",
    message: "Paneer Tikka ready to serve.",
    category: "KOT",
    createdAt: 1700000300000,
    isRead: false,
  };

  const mockOrderNotification: PosNotification = {
    id: "order-ready-102",
    title: "Order #ORD-102 is ready",
    message: "Dal Makhani ready to serve.",
    category: "ORDER",
    createdAt: 1700000400000,
    isRead: false,
  };

  const mockReservationNotification: PosNotification = {
    id: "res-101",
    title: "Reservation: John Doe",
    message: "Table T-05 · 4 Guests · Arriving in 15 mins (07:30 PM)",
    category: "RESERVATION",
    createdAt: 1700000200000,
    isRead: false,
  };

  const mockSystemNotification: PosNotification = {
    id: "sys-01",
    title: "System Update",
    message: "Daily report generated.",
    category: "SYSTEM",
    createdAt: 1700000050000,
    isRead: false,
  };

  const allNotifications: PosNotification[] = [
    mockStockNotification,
    mockKotNotification,
    mockOrderNotification,
    mockReservationNotification,
    mockSystemNotification,
  ];

  describe("Role Resolution", () => {
    it("resolves waiter roles accurately", () => {
      expect(resolveNotificationRole("pos_waiter")).toBe("waiter");
      expect(resolveNotificationRole("waiter")).toBe("waiter");
      expect(resolveNotificationRole(undefined, "Floor Waiter")).toBe("waiter");
      expect(resolveNotificationRole("pos_custom", "Senior Waiter")).toBe("waiter");
    });

    it("resolves kitchen roles accurately", () => {
      expect(resolveNotificationRole("pos_kitchen")).toBe("kitchen");
      expect(resolveNotificationRole("kitchen")).toBe("kitchen");
      expect(resolveNotificationRole(undefined, "Kitchen Master")).toBe("kitchen");
    });

    it("resolves admin and other roles to admin access", () => {
      expect(resolveNotificationRole("pos_admin")).toBe("admin");
      expect(resolveNotificationRole("admin")).toBe("admin");
      expect(resolveNotificationRole("super_admin")).toBe("admin");
      expect(resolveNotificationRole("owner")).toBe("admin");
      expect(resolveNotificationRole(undefined, undefined)).toBe("admin");
    });
  });

  describe("Chronological Ordering (Recent ones on top, older ones below)", () => {
    it("sorts notifications descending by createdAt timestamp", () => {
      const sorted = sortNotificationsRecentFirst(allNotifications);

      expect(sorted.map((n) => n.id)).toEqual([
        "order-ready-102", // 1700000400000 (newest)
        "kot-ready-101",   // 1700000300000
        "res-101",         // 1700000200000
        "alert-tomato-01", // 1700000100000
        "sys-01",          // 1700000050000 (oldest)
      ]);

      expect(sorted[0].createdAt).toBeGreaterThan(sorted[1].createdAt);
      expect(sorted[1].createdAt).toBeGreaterThan(sorted[2].createdAt);
      expect(sorted[2].createdAt).toBeGreaterThan(sorted[3].createdAt);
      expect(sorted[3].createdAt).toBeGreaterThan(sorted[4].createdAt);
    });
  });

  describe("Waiter Access Filtering", () => {
    it("shows ready-to-serve orders and upcoming reservations, but strictly NO stock notifications", () => {
      const waiterVisible = filterNotificationsByRole(allNotifications, "pos_waiter");

      const categories = waiterVisible.map((n) => n.category);
      expect(categories).toContain("KOT");
      expect(categories).toContain("ORDER");
      expect(categories).toContain("RESERVATION");
      expect(categories).not.toContain("STOCK");
      expect(categories).not.toContain("SYSTEM");

      // Verify specific notification presence
      expect(waiterVisible.some((n) => n.id === "kot-ready-101")).toBe(true);
      expect(waiterVisible.some((n) => n.id === "order-ready-102")).toBe(true);
      expect(waiterVisible.some((n) => n.id === "res-101")).toBe(true);
      expect(waiterVisible.some((n) => n.id === "alert-tomato-01")).toBe(false);
      expect(waiterVisible.some((n) => n.id === "sys-01")).toBe(false);
    });
  });

  describe("Kitchen Access Filtering", () => {
    it("shows stock notifications ONLY, not order notifications and not reservations", () => {
      const kitchenVisible = filterNotificationsByRole(allNotifications, "pos_kitchen");

      expect(kitchenVisible.length).toBe(1);
      expect(kitchenVisible[0].id).toBe("alert-tomato-01");
      expect(kitchenVisible[0].category).toBe("STOCK");

      const categories = kitchenVisible.map((n) => n.category);
      expect(categories).not.toContain("KOT");
      expect(categories).not.toContain("ORDER");
      expect(categories).not.toContain("RESERVATION");
      expect(categories).not.toContain("SYSTEM");
    });
  });

  describe("Admin Access Filtering", () => {
    it("shows all notifications without omission", () => {
      const adminVisible = filterNotificationsByRole(allNotifications, "pos_admin");

      expect(adminVisible.length).toBe(allNotifications.length);
      const categories = adminVisible.map((n) => n.category);
      expect(categories).toContain("STOCK");
      expect(categories).toContain("KOT");
      expect(categories).toContain("ORDER");
      expect(categories).toContain("RESERVATION");
      expect(categories).toContain("SYSTEM");
    });
  });

  describe("Reservation 30-Minute Notification Trigger", () => {
    it("triggers notification when reservation arrival is within 30 minutes", () => {
      const now = new Date(2026, 10, 12, 19, 10, 0); // 7:10 PM
      const upcomingRes: ReservationItem = {
        id: "res-upcoming-01",
        tableId: "t12",
        tableNumber: "T-12",
        customerName: "Sneha Sen",
        customerPhone: "9876543200",
        guests: 4,
        reservationDate: "2026-11-12",
        reservationTime: "07:30 PM", // 20 minutes from now
        status: "reserved",
        createdAt: new Date().toISOString(),
      };

      const diffMins = minutesUntilReservation(upcomingRes, now);
      expect(diffMins).toBe(20);
      expect(isReservationUpcomingWithin30Min(upcomingRes, now)).toBe(true);
    });

    it("does NOT trigger notification if reservation is 45 minutes or hours away", () => {
      const now = new Date(2026, 10, 12, 18, 0, 0); // 6:00 PM
      const futureRes: ReservationItem = {
        id: "res-future-01",
        tableId: "t12",
        tableNumber: "T-12",
        customerName: "Amit Verma",
        customerPhone: "9876543201",
        guests: 2,
        reservationDate: "2026-11-12",
        reservationTime: "07:30 PM", // 90 minutes away
        status: "reserved",
        createdAt: new Date().toISOString(),
      };

      const diffMins = minutesUntilReservation(futureRes, now);
      expect(diffMins).toBe(90);
      expect(isReservationUpcomingWithin30Min(futureRes, now)).toBe(false);
    });

    it("does NOT trigger notification if reservation is already seated or cancelled", () => {
      const now = new Date(2026, 10, 12, 19, 10, 0); // 7:10 PM
      const seatedRes: ReservationItem = {
        id: "res-seated-01",
        tableId: "t12",
        tableNumber: "T-12",
        customerName: "Seated Guest",
        customerPhone: "9876543202",
        guests: 2,
        reservationDate: "2026-11-12",
        reservationTime: "07:30 PM",
        status: "seated",
        createdAt: new Date().toISOString(),
      };

      expect(isReservationUpcomingWithin30Min(seatedRes, now)).toBe(false);

      const cancelledRes: ReservationItem = {
        ...seatedRes,
        id: "res-cancelled-01",
        status: "cancelled",
      };
      expect(isReservationUpcomingWithin30Min(cancelledRes, now)).toBe(false);
    });
  });
});
