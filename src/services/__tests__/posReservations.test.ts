// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  toIsoDate,
  to24HourTime,
  toDisplayTime,
  parseReservationDateTime,
  isReservationActiveNow,
  isReservationUpcomingWithin30Min,
  minutesUntilReservation,
  posTablesService,
} from "../posTablesService";
import type { ReservationItem, RestaurantTable } from "@/types/posTables";
import type { CurrentOrderRecord } from "@/services/posOrdersService";
import { getPosCustomers } from "@/services/posCustomerStore";
import {
  filterActivePosOrders,
  filterActivePosReservations,
} from "@/components/shared/pos/billing/BillingTablesOrdersSidebar";

describe("POS Reservations & Dynamic Table Status", () => {
  describe("Date & Time Normalization", () => {
    it("converts human-readable date strings to standard YYYY-MM-DD", () => {
      expect(toIsoDate("2026-11-06")).toBe("2026-11-06");
      expect(toIsoDate("Fri, Nov 6, 2026")).toBe("2026-11-06");
      expect(toIsoDate("November 6, 2026")).toBe("2026-11-06");
    });

    it("handles 'Today' properly returning today's date in YYYY-MM-DD format", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      expect(toIsoDate("Today")).toBe(todayStr);
      expect(toIsoDate("")).toBe(todayStr);
    });

    it("converts 12-hour AM/PM and 24-hour time strings to standard 24h format HH:MM:00", () => {
      expect(to24HourTime("07:30 PM")).toBe("19:30:00");
      expect(to24HourTime("7:30 pm")).toBe("19:30:00");
      expect(to24HourTime("07:30 AM")).toBe("07:30:00");
      expect(to24HourTime("12:00 AM")).toBe("00:00:00");
      expect(to24HourTime("12:00 PM")).toBe("12:00:00");
      expect(to24HourTime("19:30")).toBe("19:30:00");
      expect(to24HourTime("19:30:00")).toBe("19:30:00");
    });

    it("converts 24-hour time strings to friendly display time", () => {
      expect(toDisplayTime("19:30:00")).toBe("07:30 PM");
      expect(toDisplayTime("08:15:00")).toBe("08:15 AM");
      expect(toDisplayTime("07:30 PM")).toBe("07:30 PM");
    });
  });

  describe("Active Reservation Time Calculation (Table not reserved prematurely)", () => {
    it("does NOT consider a future reservation active now (e.g. 3 hours away)", () => {
      const now = new Date(2026, 10, 6, 14, 0, 0); // 2:00 PM
      const res: ReservationItem = {
        id: "res-1",
        tableId: "t11",
        tableNumber: "Table #11",
        customerName: "Rahul Sharma",
        customerPhone: "9876543210",
        guests: 4,
        reservationDate: "2026-11-06",
        reservationTime: "07:30 PM", // 7:30 PM (5.5 hrs away)
        status: "reserved",
        createdAt: new Date().toISOString(),
      };

      expect(isReservationActiveNow(res, now)).toBe(false);
    });

    it("considers reservation active when current time is within reservation window", () => {
      const now = new Date(2026, 10, 6, 19, 45, 0); // 7:45 PM
      const res: ReservationItem = {
        id: "res-2",
        tableId: "t11",
        tableNumber: "Table #11",
        customerName: "Rahul Sharma",
        customerPhone: "9876543210",
        guests: 4,
        reservationDate: "2026-11-06",
        reservationTime: "07:30 PM", // 7:30 PM - 9:30 PM
        status: "reserved",
        createdAt: new Date().toISOString(),
      };

      expect(isReservationActiveNow(res, now)).toBe(true);
    });

    it("does NOT consider completed or cancelled reservations active", () => {
      const now = new Date(2026, 10, 6, 19, 45, 0); // 7:45 PM
      const res: ReservationItem = {
        id: "res-3",
        tableId: "t11",
        tableNumber: "Table #11",
        customerName: "Rahul Sharma",
        customerPhone: "9876543210",
        guests: 4,
        reservationDate: "2026-11-06",
        reservationTime: "07:30 PM",
        status: "completed", // Seated / Completed!
        createdAt: new Date().toISOString(),
      };

      expect(isReservationActiveNow(res, now)).toBe(false);
    });
  });

  describe("30-Minute Upcoming Reservation Notification Alert", () => {
    it("detects when a reservation is within 30 minutes of starting", () => {
      const now = new Date(2026, 10, 6, 19, 10, 0); // 7:10 PM
      const res: ReservationItem = {
        id: "res-4",
        tableId: "t11",
        tableNumber: "Table #11",
        customerName: "Pooja Patel",
        customerPhone: "9876543211",
        guests: 2,
        reservationDate: "2026-11-06",
        reservationTime: "07:30 PM", // 20 minutes from now!
        status: "reserved",
        createdAt: new Date().toISOString(),
      };

      const diffMins = minutesUntilReservation(res, now);
      expect(diffMins).toBe(20);
      expect(isReservationUpcomingWithin30Min(res, now)).toBe(true);
    });

    it("does NOT trigger 30-min alert if reservation is 45 minutes or 2 hours away", () => {
      const now = new Date(2026, 10, 6, 18, 0, 0); // 6:00 PM
      const res: ReservationItem = {
        id: "res-5",
        tableId: "t11",
        tableNumber: "Table #11",
        customerName: "Pooja Patel",
        customerPhone: "9876543211",
        guests: 2,
        reservationDate: "2026-11-06",
        reservationTime: "07:30 PM", // 90 minutes from now
        status: "reserved",
        createdAt: new Date().toISOString(),
      };

      expect(isReservationUpcomingWithin30Min(res, now)).toBe(false);
    });
  });

  describe("Seating Flow & Reservation Status Lifecycle", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("marks reservation status as 'completed' when guests are seated and transitions table to 'occupied'", async () => {
      // 1. Add a reservation
      const newRes = await posTablesService.addReservation({
        tableId: "tbl-seat-1",
        tableNumber: "Table #50",
        customerName: "Amit Verma",
        customerPhone: "9998887771",
        guests: 3,
        reservationDate: "2026-11-06",
        reservationTime: "08:00 PM",
      });

      expect(newRes.status).toBe("reserved");

      // 2. Seat the guests
      const table = await posTablesService.seatGuests("tbl-seat-1", newRes.id);
      expect(table.status).toBe("occupied");
      expect(table.activeReservation?.customerName).toBe("Amit Verma");
      expect(table.activeOrder?.guestName).toBe("Amit Verma");
      expect(table.activeOrder?.guestPhone).toBe("9998887771");

      // 3. Verify reservation list maintains the reservation with status 'seated'
      const reservations = await posTablesService.getReservations();
      const updatedRes = reservations.find((r) => r.id === newRes.id);
      expect(updatedRes).toBeDefined();
      expect(updatedRes?.status).toBe("seated");
    });

    it("allows switching an assigned reservation table to another table", async () => {
      // 1. Add a reservation for Table #51
      const res = await posTablesService.addReservation({
        tableId: "tbl-switch-1",
        tableNumber: "Table #51",
        customerName: "Karan Johar",
        customerPhone: "9998887772",
        guests: 2,
        reservationDate: "2026-11-06",
        reservationTime: "08:30 PM",
      });

      // 2. Add an alternative table #52 to the store
      await posTablesService.addTable({
        tableNumber: "Table #52",
        capacity: 4,
        area: "Main Dining",
      });
      const allTables = await posTablesService.getTables();
      const table52 = allTables.find((t) => t.tableNumber.includes("52")) || allTables[0];

      // 3. Switch reservation table
      const switched = await posTablesService.switchReservationTable(res.id, table52.id);
      expect(switched.tableId).toBe(table52.id);
      expect(switched.tableNumber).toBe(table52.tableNumber);

      // 4. Verify in reservation list
      const reservations = await posTablesService.getReservations();
      const savedRes = reservations.find((r) => r.id === res.id);
      expect(savedRes?.tableId).toBe(table52.id);
    });

    it("handles reservation without payment setting depositAmount to 0 and paymentStatus to unpaid", async () => {
      const res = await posTablesService.addReservation({
        tableId: "tbl-zero-pay",
        tableNumber: "Table #25",
        customerName: "Sneha Patel",
        customerPhone: "9876543201",
        guests: 4,
        reservationDate: "2026-11-09",
        reservationTime: "07:00 PM",
        depositAmount: 0,
        paymentStatus: "unpaid",
        notes: "Booked without advance payment (₹0 deposit).",
      });

      expect(res.depositAmount).toBe(0);
      expect(res.paymentStatus).toBe("unpaid");

      const all = await posTablesService.getReservations();
      const found = all.find((r) => r.id === res.id);
      expect(found?.depositAmount).toBe(0);
      expect(found?.paymentStatus).toBe("unpaid");
    });

    it("handles reservation with advance deposit payment setting entered amount and deposit_paid status", async () => {
      const res = await posTablesService.addReservation({
        tableId: "tbl-paid-dep",
        tableNumber: "Table #26",
        customerName: "Vikram Malhotra",
        customerPhone: "9876543202",
        guests: 6,
        reservationDate: "2026-11-09",
        reservationTime: "08:00 PM",
        depositAmount: 500,
        paymentStatus: "deposit_paid",
        notes: "Advance deposit of ₹500 collected via UPI (Payment Confirmed).",
      });

      expect(res.depositAmount).toBe(500);
      expect(res.paymentStatus).toBe("deposit_paid");

      const all = await posTablesService.getReservations();
      const found = all.find((r) => r.id === res.id);
      expect(found?.depositAmount).toBe(500);
      expect(found?.paymentStatus).toBe("deposit_paid");
    });

    it("sanitizes legacy hardcoded 25 deposit on reservations to 0", async () => {
      // Seed a legacy reservation with 25
      const legacyId = "res-legacy-bug-25";
      const legacyRes: ReservationItem = {
        id: legacyId,
        tableId: "tbl-22",
        tableNumber: "Table #22",
        customerName: "shab mohanty",
        customerPhone: "8478477446",
        guests: 2,
        reservationDate: "2026-11-09",
        reservationTime: "04:30 PM",
        depositAmount: 25, // legacy bug
        paymentStatus: "deposit_paid",
        status: "reserved",
        createdAt: new Date().toISOString(),
      };

      const key = "retrod_pos_reservations_default";
      localStorage.setItem(key, JSON.stringify([legacyRes]));

      const reservations = await posTablesService.getReservations();
      const sanitized = reservations.find((r) => r.id === legacyId);
      expect(sanitized).toBeDefined();
      expect(sanitized?.depositAmount).toBe(0);
      expect(sanitized?.paymentStatus).toBe("unpaid");
    });

    it("auto-persists reserved customer details in posCustomerStore when booked and seated", async () => {
      const res = await posTablesService.addReservation({
        tableId: "tbl-22",
        tableNumber: "Table #22",
        customerName: "shab mohanty",
        customerPhone: "8478477446",
        guests: 2,
        reservationDate: "2026-11-09",
        reservationTime: "04:30 PM",
      });

      // Verify customer is in customer store
      const customers = getPosCustomers();
      const customer = customers.find((c) => c.phone === "8478477446");
      expect(customer).toBeDefined();
      expect(customer?.name).toBe("shab mohanty");

      // Seat the reservation
      const table = await posTablesService.seatGuests("tbl-22", res.id);
      expect(table.activeOrder?.guestName).toBe("shab mohanty");
      expect(table.activeOrder?.guestPhone).toBe("8478477446");
      expect(table.activeReservation?.customerName).toBe("shab mohanty");
    });

    it("completes seated reservation after payment, removes it from POS lists, and keeps it completed in reservations list", async () => {
      const todayIso = new Date().toISOString().split("T")[0];
      const res = await posTablesService.addReservation({
        tableId: "tbl-complete-13",
        tableNumber: "T13",
        customerName: "Rahul Sharma",
        customerPhone: "9876543210",
        guests: 4,
        reservationDate: todayIso,
        reservationTime: "07:30 PM",
      });

      // Also add a future reservation on the same table that should NOT be auto-completed prematurely
      const futureRes = await posTablesService.addReservation({
        tableId: "tbl-complete-13",
        tableNumber: "T13",
        customerName: "Future Guest",
        customerPhone: "9111122222",
        guests: 2,
        reservationDate: "2099-12-31",
        reservationTime: "10:00 PM",
      });

      // Seat the guest
      await posTablesService.seatGuests("tbl-complete-13", res.id);

      // Before payment: visible in POS Bookings list as seated
      const beforeReservations = await posTablesService.getReservations();
      const posBookingsBefore = filterActivePosReservations(beforeReservations, "all");
      expect(posBookingsBefore.some((r) => r.id === res.id && r.status === "seated")).toBe(true);

      // After full payment: complete reservation (matching by table when order payment settles)
      const completed = await posTablesService.completeReservation({
        tableId: "tbl-complete-13",
        tableNumber: "T13",
      });
      expect(completed.some((r) => r.id === res.id && r.status === "completed")).toBe(true);

      // Full reservations list (/pos/reservations) retains it with "completed" status
      const afterReservations = await posTablesService.getReservations();
      const updated = afterReservations.find((r) => r.id === res.id);
      expect(updated?.status).toBe("completed");
      expect(afterReservations.find((r) => r.id === futureRes.id)?.status).toBe("reserved");

      // POS Bookings sidebar excludes completed/cancelled bookings even on "all" filter
      const posBookingsAfter = filterActivePosReservations(afterReservations, "all");
      expect(posBookingsAfter.some((r) => r.id === res.id)).toBe(false);
      expect(posBookingsAfter.some((r) => r.id === futureRes.id)).toBe(true);
    });

    it("excludes settled and cancelled orders from POS billing Orders tab", () => {
      const sampleOrders = [
        {
          id: "ord-active",
          orderNumber: "ORD-1001",
          type: "dine_in",
          tableOrRoom: "T13",
          customerName: "Rahul Sharma",
          itemsSummary: "1x Biryani",
          amount: 280,
          amountFormatted: "₹280",
          currentStage: "preparing",
          stageLabel: "Preparing",
          status: "preparing",
          elapsedMinutes: 5,
          isSettled: false,
        },
        {
          id: "ord-settled",
          orderNumber: "ORD-1002",
          type: "dine_in",
          tableOrRoom: "T13",
          customerName: "Rahul Sharma",
          itemsSummary: "1x Biryani",
          amount: 280,
          amountFormatted: "₹280",
          currentStage: "settled",
          stageLabel: "Settled",
          status: "settled",
          elapsedMinutes: 8,
          isSettled: true,
        },
      ] as unknown as CurrentOrderRecord[];

      const active = filterActivePosOrders(sampleOrders);
      expect(active.map((o) => o.id)).toEqual(["ord-active"]);
    });

    it("does not seed dummy fallback reservations when localStorage is empty and strips legacy res-seed entries", async () => {
      const emptyReservations = await posTablesService.getReservations();
      expect(emptyReservations.some((r) => r.id === "res-seed-01" || r.id === "res-seed-02")).toBe(
        false,
      );

      // Simulate a browser that previously cached the 2 legacy dummy reservations alongside a real booking
      const realRes: ReservationItem = {
        id: "res-real-100",
        tableId: "t05",
        tableNumber: "T05",
        customerName: "Ananya Das",
        customerPhone: "9000011111",
        guests: 2,
        reservationDate: "2026-11-12",
        reservationTime: "08:00 PM",
        status: "reserved",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(
        "retrod_pos_reservations_default",
        JSON.stringify([
          { ...realRes, id: "res-seed-01", customerName: "Rahul Sharma" },
          { ...realRes, id: "res-seed-02", customerName: "Pooja Patel" },
          realRes,
        ]),
      );

      const list = await posTablesService.getReservations();
      expect(list.some((r) => r.id === "res-seed-01" || r.id === "res-seed-02")).toBe(false);
      expect(list.some((r) => r.id === "res-real-100" && r.customerName === "Ananya Das")).toBe(true);
    });
  });
});
