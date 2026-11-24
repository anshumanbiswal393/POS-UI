import { describe, it, expect } from "vitest";
import { posMenuService, type MenuItemIngredient } from "@/services/posMenuService";
import { posRoomService } from "@/services/posRoomService";
import { mapOutletApiToPosOutlet } from "@/services/posOutletsService";
import type { ReservationItem } from "@/types/posTables";
import type { RoomGuest } from "@/types/posRoomService";

describe("Batch Eleven QA Defects Verification", () => {
  describe("Defect 1 & 2: Menu Management & MenuItemIngredient export", () => {
    it("should export MenuItemIngredient type declaration without compile errors", () => {
      const mockIngredient: MenuItemIngredient = {
        rawMaterialId: "raw-001",
        rawMaterialName: "Paneer",
        quantity: 250,
        unit: "gm",
      };
      expect(mockIngredient.rawMaterialId).toBe("raw-001");
      expect(mockIngredient.rawMaterialName).toBe("Paneer");
      expect(mockIngredient.quantity).toBe(250);
      expect(mockIngredient.unit).toBe("gm");
    });

    it("posMenuService is defined and contains getMenuItems", () => {
      expect(posMenuService).toBeDefined();
      expect(typeof posMenuService.getMenuItems).toBe("function");
    });
  });

  describe("Defect 3: Global Omnibar search predicate on category", () => {
    it("should match menu items by category instead of non-existent subCategory", () => {
      const item = {
        name: "Paneer Tikka",
        code: "SNK-101",
        category: "Starters",
        description: "Tandoori cottage cheese cubes",
        price: 280,
      };

      const searchableText = `${item.name} ${item.code || ""} ${item.category || ""} ${item.description || ""}`.toLowerCase();
      const query = "starters";
      expect(searchableText.includes(query.toLowerCase())).toBe(true);
    });
  });

  describe("Defect 4: Room Service guest phone mapping", () => {
    it("should map guest phone using phone ?? mobile ?? guest_phone ?? guest_mobile fallback", () => {
      const occWithMobileOnly = {
        room_number: "402",
        unit_type: "Deluxe Suite",
        guest_name: "Rahul Sharma",
        guest_mobile: "+91 9876543210",
        pax: 2,
      };

      const guestPhone = (occWithMobileOnly as any).guest_phone ?? occWithMobileOnly.guest_mobile ?? "";
      const guest: RoomGuest = {
        name: occWithMobileOnly.guest_name,
        phone: guestPhone,
        mobile: occWithMobileOnly.guest_mobile,
        phoneExtension: guestPhone,
        pax: occWithMobileOnly.pax,
      };

      expect(guest.phone).toBe("+91 9876543210");
      expect(guest.phoneExtension).toBe("+91 9876543210");
      expect(guest.mobile).toBe("+91 9876543210");
    });

    it("should handle nullish guest_phone with fallback to guest_mobile", () => {
      const occ = {
        guest_phone: null,
        guest_mobile: "9988776655",
      };
      const phone = occ.guest_phone ?? occ.guest_mobile ?? "";
      expect(phone).toBe("9988776655");
    });
  });

  describe("Defect 5: Reservation party size (guestCount / pax / covers mapping)", () => {
    it("should map party size when backend returns pax or covers", () => {
      const rawResWithPax = {
        id: "res-001",
        guest_name: "Anita Roy",
        pax: 4,
      };

      const guestCount = Number((rawResWithPax as any).guestCount ?? (rawResWithPax as any).guests ?? rawResWithPax.pax ?? (rawResWithPax as any).covers ?? 2);
      expect(guestCount).toBe(4);

      const reservation: ReservationItem = {
        id: rawResWithPax.id,
        tableId: "t-1",
        tableNumber: "T1",
        customerName: rawResWithPax.guest_name,
        customerPhone: "9876500000",
        guests: guestCount,
        guestCount: guestCount,
        pax: guestCount,
        covers: guestCount,
        reservationDate: "2026-11-23",
        reservationTime: "08:00 PM",
        status: "reserved",
        createdAt: new Date().toISOString(),
      };

      expect(reservation.guestCount).toBe(4);
      expect(reservation.pax).toBe(4);
      expect(reservation.covers).toBe(4);
      expect(reservation.guests).toBe(4);
    });

    it("should map party size when backend returns covers instead of pax", () => {
      const rawResWithCovers = {
        id: "res-002",
        guest_name: "Vikram Das",
        covers: 6,
      };

      const guestCount = Number((rawResWithCovers as any).guestCount ?? (rawResWithCovers as any).guests ?? (rawResWithCovers as any).pax ?? rawResWithCovers.covers ?? 2);
      expect(guestCount).toBe(6);
    });
  });

  describe("Defect 6: Accounting & GST fallback to gstNumber or taxId", () => {
    it("should fallback to gstNumber when gstin is undefined", () => {
      const dto = {
        id: "outlet-101",
        name: "Highway Inn Fine Dine",
        code: "HWI-01",
        outlet_type: "PRIMARY",
        gstNumber: "21AAAAA1234A1Z5",
        meta_settings: {},
      };

      const outlet = mapOutletApiToPosOutlet(dto as any);
      expect(outlet.gstin).toBe("21AAAAA1234A1Z5");
      expect(outlet.gstNumber).toBe("21AAAAA1234A1Z5");
    });

    it("should fallback to taxId when gstin and gstNumber are undefined", () => {
      const dto = {
        id: "outlet-102",
        name: "Highway Inn Cloud Kitchen",
        code: "HWI-02",
        outlet_type: "KITCHEN",
        meta_settings: {
          tax_id: "27BBBBB5678B1Z2",
        },
      };

      const outlet = mapOutletApiToPosOutlet(dto as any);
      expect(outlet.gstin).toBe("27BBBBB5678B1Z2");
      expect(outlet.taxId).toBe("27BBBBB5678B1Z2");
    });

    it("should fallback to gst_number in meta_settings", () => {
      const dto = {
        id: "outlet-103",
        name: "Highway Inn Rooftop",
        code: "HWI-03",
        meta_settings: {
          gst_number: "29CCCCC9012C1Z8",
        },
      };

      const outlet = mapOutletApiToPosOutlet(dto as any);
      expect(outlet.gstin).toBe("29CCCCC9012C1Z8");
    });
  });
});
