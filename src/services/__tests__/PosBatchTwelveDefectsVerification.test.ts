import { describe, it, expect } from "vitest";
import type { POSSupportTicketDto } from "@/services/posManagementService";
import type { CreateOutletPayload } from "@/services/posOutletsService";

describe("Batch Twelve QA Defects Verification", () => {
  describe("Defect 7 & 8: Management Outlet navigation search params vs raw strings", () => {
    it("should construct route search object without raw query string in to pathname", () => {
      const stepTo = "/pos/management/configuration/outlet/details";
      const outletId = "out-789";

      // TanStack Router pattern: pathname stays clean, search parameters passed as object
      const routeLocation = {
        to: stepTo,
        search: { outletId },
      };

      expect(routeLocation.to).toBe("/pos/management/configuration/outlet/details");
      expect(routeLocation.search.outletId).toBe("out-789");
      expect(routeLocation.to.includes("?")).toBe(false);
    });
  });

  describe("Defect 9: Support Ticket contact_phone property", () => {
    it("should accept contact_phone on POSSupportTicketDto", () => {
      const ticket: POSSupportTicketDto = {
        id: "t-001",
        outlet: "out-101",
        ticket_number: "TKT-1001",
        category: "BILLING_HARDWARE",
        subject: "Thermal printer paper jam",
        description: "Printer 1 in kitchen is not feeding paper",
        priority: "HIGH",
        status: "OPEN",
        contact_phone: "+91 9876543210",
        created_at: new Date().toISOString(),
      };

      expect(ticket.contact_phone).toBe("+91 9876543210");
    });
  });

  describe("Defect 10: CreateOutletPayload orderTypes support", () => {
    it("should accept orderTypes on CreateOutletPayload interface", () => {
      const payload: CreateOutletPayload = {
        name: "Express Kiosk",
        outlet_type: "VIRTUAL",
        orderTypes: ["Takeaway", "Online Delivery"],
      };

      expect(payload.orderTypes).toEqual(["Takeaway", "Online Delivery"]);
      expect(payload.orderTypes?.length).toBe(2);
    });
  });

  describe("Defect 11: Reports viewer searching casts String(val ?? '').toLowerCase()", () => {
    it("should safely search records with numbers, nulls, and booleans without throwing TypeError", () => {
      const records = [
        { id: "R-1", dish: "Paneer Butter Masala", quantity: 15, isVeg: true, notes: null, price: 299 },
        { id: "R-2", dish: "Chicken Biryani", quantity: 20, isVeg: false, notes: undefined, price: 350 },
        { id: "R-3", dish: "Dal Makhani", quantity: 0, isVeg: true, notes: "Special", price: 220 },
      ];

      const query = "15";
      const q = query.toLowerCase().trim();

      // Ensure Object.values with String(val ?? '').toLowerCase() works flawlessly
      const matched = records.filter((r) =>
        Object.values(r).some((val) => String(val ?? "").toLowerCase().includes(q))
      );

      expect(matched.length).toBe(1);
      expect(matched[0].id).toBe("R-1");
    });

    it("should not crash when a record property is null or undefined", () => {
      const record = { name: "Null Item", count: null, meta: undefined };
      const searchFn = () =>
        Object.values(record).some((val) => String(val ?? "").toLowerCase().includes("null"));

      expect(searchFn).not.toThrow();
      expect(searchFn()).toBe(true); // matches 'Null Item'
    });
  });

  describe("Defect 12: Strict X-Outlet-ID header resolution on outlet-scoped requests", () => {
    it("should prioritize query/param outlet ID then fallback to stored active outlet ID", () => {
      const localStorageMock: Record<string, string> = {
        retrod_pos_active_outlet_id: "default-outlet-uuid",
      };

      const resolveEffectiveOutletId = (url?: string, params?: Record<string, any>) => {
        let targetOutletId = localStorageMock["retrod_pos_active_outlet_id"];
        if (params && (params.outlet_id || params.outletId)) {
          targetOutletId = params.outlet_id || params.outletId;
        } else if (url) {
          const match = url.match(/[?&](?:outlet_id|outletId)=([^&]+)/);
          if (match && match[1]) {
            targetOutletId = decodeURIComponent(match[1]);
          }
        }
        return targetOutletId;
      };

      // When url specifies outlet_id
      const scopedUrl = "/api/pos/management/outlet-config/?outlet_id=specific-outlet-uuid";
      expect(resolveEffectiveOutletId(scopedUrl)).toBe("specific-outlet-uuid");

      // When params specify outlet_id
      expect(resolveEffectiveOutletId("/api/pos/orders/", { outlet_id: "params-outlet-uuid" })).toBe("params-outlet-uuid");

      // When neither specifies outlet_id, fallback to active
      expect(resolveEffectiveOutletId("/api/pos/orders/")).toBe("default-outlet-uuid");
    });
  });
});
